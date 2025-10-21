import { Request, Response } from 'express';
import { 
    createCheckoutSession, 
    createBillingPortalSession,
    getUserSubscription,
    cancelSubscription,
    handleWebhookEvent,
    stripe
} from '../services/stripeService.js';
import { PlanType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

/**
 * Create a Stripe checkout session for Pro plan
 */
export const createCheckout = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const userEmail = (req as any).user?.email;

        if (!userId || !userEmail) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { priceId, planType } = req.body;

        if (!planType) {
            res.status(400).json({ error: 'Plan type is required' });
            return;
        }

        // Handle FREE plan - just create/ensure subscription record
        if (planType === PlanType.FREE) {
            await prisma.subscription.upsert({
                where: { userId },
                create: {
                    userId,
                    planType: PlanType.FREE,
                    isActive: true,
                    startDate: new Date()
                },
                update: {
                    planType: PlanType.FREE,
                    isActive: true
                }
            });

            // Update user's plan field
            await prisma.user.update({
                where: { id: userId },
                data: { plan: PlanType.FREE }
            });

            res.json({ success: true, message: 'Free plan activated' });
            return;
        }

        // Validate plan type for paid plans
        if (planType !== PlanType.PRO) {
            res.status(400).json({ error: 'Invalid plan type. Only PRO plan is available for purchase.' });
            return;
        }

        if (!priceId) {
            res.status(400).json({ error: 'Price ID is required for paid plans' });
            return;
        }

        const session = await createCheckoutSession({
            userId,
            userEmail,
            priceId,
            planType
        });

        res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ 
            error: 'Failed to create checkout session',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Create a billing portal session for managing subscription
 */
export const createPortalSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const session = await createBillingPortalSession(userId);

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating portal session:', error);
        res.status(500).json({ 
            error: 'Failed to create portal session',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Get current user's subscription status
 */
export const getSubscriptionStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        console.log(`📊 Fetching subscription status for user ${userId}`);

        const subscription = await getUserSubscription(userId);

        if (!subscription) {
            console.log(`   → User ${userId} has no subscription (defaulting to FREE)`);
            // User has no subscription, return default FREE plan
            res.json({
                planType: PlanType.FREE,
                isActive: true,
                cancelAtPeriodEnd: false
            });
            return;
        }

        console.log(`   → User ${userId} subscription found:`, {
            planType: subscription.planType,
            isActive: subscription.isActive,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
        });

        res.json({
            planType: subscription.planType,
            isActive: subscription.isActive,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            currentPeriodEnd: subscription.stripeCurrentPeriodEnd,
            startDate: subscription.startDate
        });
    } catch (error) {
        console.error('Error fetching subscription status:', error);
        res.status(500).json({ 
            error: 'Failed to fetch subscription status',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Cancel user's subscription
 */
export const cancelUserSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        await cancelSubscription(userId);

        res.json({ 
            message: 'Subscription canceled successfully. You will retain access until the end of your billing period.' 
        });
    } catch (error) {
        console.error('Error canceling subscription:', error);
        res.status(500).json({ 
            error: 'Failed to cancel subscription',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Debug endpoint to check user's current plan from all sources
 */
export const debugUserPlan = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Get user with subscription
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { subscription: true }
        });

        res.json({
            userId,
            userEmail: user?.email,
            userPlanField: user?.plan,
            subscription: user?.subscription ? {
                planType: user.subscription.planType,
                isActive: user.subscription.isActive,
                stripeCustomerId: user.subscription.stripeCustomerId,
                stripeSubscriptionId: user.subscription.stripeSubscriptionId,
                stripePriceId: user.subscription.stripePriceId,
                cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
                startDate: user.subscription.startDate,
                currentPeriodEnd: user.subscription.stripeCurrentPeriodEnd
            } : null,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error debugging user plan:', error);
        res.status(500).json({ 
            error: 'Failed to fetch debug info',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Manually sync subscription from Stripe (in case webhook failed)
 */
export const syncSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const { sessionId } = req.body as { sessionId?: string };

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        console.log(`🔄 Manual sync requested for user ${userId}`);

        // Get user's subscription from database
        const dbSubscription = await prisma.subscription.findUnique({
            where: { userId }
        });

        // If DB doesn't have a stripeSubscriptionId, but client provided a sessionId, try to fetch it from the Checkout Session
        let stripeSubscriptionId = dbSubscription?.stripeSubscriptionId;
        if (!stripeSubscriptionId && sessionId) {
            try {
                console.log(`   → No stripeSubscriptionId in DB, attempting to retrieve from Checkout Session ${sessionId}`);
                const checkoutSession: any = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] });
                const sessionSubscription = checkoutSession.subscription;
                // session.subscription can be a string id or an expanded object. Handle both.
                if (typeof sessionSubscription === 'string') {
                    stripeSubscriptionId = sessionSubscription;
                } else if (sessionSubscription && typeof sessionSubscription === 'object') {
                    stripeSubscriptionId = sessionSubscription.id;
                }
                console.log('   → Session lookup result subscription id:', stripeSubscriptionId);
            } catch (err) {
                console.error('   ❌ Failed to retrieve checkout session:', err);
            }
        }

        if (!stripeSubscriptionId) {
            console.log(`   → No Stripe subscription found for user ${userId}`);
            res.json({ 
                message: 'No active Stripe subscription found',
                currentPlan: dbSubscription?.planType || PlanType.FREE
            });
            return;
        }

        console.log(`   → Found Stripe subscription: ${stripeSubscriptionId}`);

        // Fetch latest subscription data from Stripe
        const stripeSubscription: any = await stripe.subscriptions.retrieve(
            stripeSubscriptionId
        );

        console.log(`   → Stripe subscription status: ${stripeSubscription.status}`);
        console.log(`   → Stripe price ID: ${stripeSubscription.items.data[0].price.id}`);

        // Determine plan type from price ID
        const priceId = stripeSubscription.items.data[0].price.id;
        const FREE_PRICE_ID = 'price_1SKUgaBQ6sV3m28sv4RkRPpI';
        const PRO_PRICE_ID = 'price_1SKUizBQ6sV3m28s7eCCJGQw';
        
        let planType: PlanType = PlanType.FREE;
        if (priceId === PRO_PRICE_ID) {
            planType = PlanType.PRO;
        }

        const isActive = stripeSubscription.status === 'active';

        console.log(`   → Determined plan type: ${planType}`);
        console.log(`   → Is active: ${isActive}`);

        // Update subscription table (also persist stripeSubscriptionId if it was missing)
        const updatedSubscription = await prisma.subscription.update({
            where: { userId },
            data: {
                planType,
                isActive,
                stripeSubscriptionId: stripeSubscription.id,
                stripePriceId: priceId,
                stripeCurrentPeriodEnd: stripeSubscription.current_period_end 
                    ? new Date(stripeSubscription.current_period_end * 1000) 
                    : undefined,
                cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false
            }
        });

        console.log(`   ✅ Subscription table updated to ${planType}`);

        // Update user's plan field
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { plan: planType }
        });

        console.log(`   ✅ User table updated to ${planType}`);

        const previousPlan = dbSubscription?.planType || PlanType.FREE;
        res.json({
            message: 'Subscription synced successfully',
            previousPlan,
            currentPlan: planType,
            isActive,
            stripeStatus: stripeSubscription.status,
            currentPeriodEnd: updatedSubscription.stripeCurrentPeriodEnd
        });
    } catch (error) {
        console.error('Error syncing subscription:', error);
        res.status(500).json({ 
            error: 'Failed to sync subscription',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Handle Stripe webhooks
 */
export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
    console.log('🎯 WEBHOOK ENDPOINT HIT');
    console.log('   Headers:', req.headers['stripe-signature'] ? 'Signature present' : 'NO SIGNATURE');
    
    const sig = req.headers['stripe-signature'];

    if (!sig) {
        console.error('❌ Missing stripe-signature header');
        res.status(400).json({ error: 'Missing stripe-signature header' });
        return;
    }

    try {
        console.log('🔐 Verifying webhook signature...');
        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );

        console.log('✅ Webhook signature verified');
        console.log('📨 Event type:', event.type);
        console.log('📨 Event ID:', event.id);

        await handleWebhookEvent(event);

        console.log('✅ Webhook processed successfully');
        res.json({ received: true });
    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.status(400).json({ 
            error: 'Webhook signature verification failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
