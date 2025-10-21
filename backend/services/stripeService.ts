import Stripe from 'stripe';
import { prisma } from '../lib/prisma.js';
import { PlanType } from '@prisma/client';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-09-30.clover' as any,
});

export interface CheckoutSessionParams {
    userId: number;
    userEmail: string;
    priceId: string;
    planType: PlanType;
}

/**
 * Create a Stripe checkout session for subscription
 */
export const createCheckoutSession = async ({
    userId,
    userEmail,
    priceId,
    planType
}: CheckoutSessionParams): Promise<Stripe.Checkout.Session> => {
    try {
        // Check if user already has a Stripe customer ID
        const existingSubscription = await prisma.subscription.findUnique({
            where: { userId }
        });

        let customerId: string | undefined;

        if (existingSubscription?.stripeCustomerId) {
            customerId = existingSubscription.stripeCustomerId;
        } else {
            // Create a new Stripe customer
            const customer = await stripe.customers.create({
                email: userEmail,
                metadata: {
                    userId: userId.toString()
                }
            });
            customerId = customer.id;
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`,
            metadata: {
                userId: userId.toString(),
                planType: planType
            },
            subscription_data: {
                metadata: {
                    userId: userId.toString(),
                    planType: planType
                }
            }
        });

        // Store or update customer ID in subscription
        if (!existingSubscription) {
            await prisma.subscription.create({
                data: {
                    userId,
                    stripeCustomerId: customerId,
                    planType: PlanType.FREE, // Will be updated by webhook
                    isActive: true
                }
            });
        } else if (!existingSubscription.stripeCustomerId) {
            await prisma.subscription.update({
                where: { userId },
                data: {
                    stripeCustomerId: customerId
                }
            });
        }

        return session;
    } catch (error) {
        console.error('Error creating checkout session:', error);
        throw error;
    }
};

/**
 * Create a billing portal session for managing subscription
 */
export const createBillingPortalSession = async (
    userId: number
): Promise<Stripe.BillingPortal.Session> => {
    try {
        const subscription = await prisma.subscription.findUnique({
            where: { userId }
        });

        if (!subscription?.stripeCustomerId) {
            throw new Error('No Stripe customer found for this user');
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: subscription.stripeCustomerId,
            return_url: `${process.env.FRONTEND_URL}/profile`,
        });

        return session;
    } catch (error) {
        console.error('Error creating billing portal session:', error);
        throw error;
    }
};

/**
 * Handle Stripe webhook events
 */
export const handleWebhookEvent = async (
    event: Stripe.Event
): Promise<void> => {
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
                break;

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;

            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
                break;

            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
    } catch (error) {
        console.error('Error handling webhook event:', error);
        throw error;
    }
};

/**
 * Handle successful checkout session
 */
async function handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session
): Promise<void> {
    console.log('🔔 WEBHOOK: checkout.session.completed received');
    console.log('📦 Session metadata:', session.metadata);
    
    const userId = parseInt(session.metadata?.userId || '0');
    const planType = session.metadata?.planType as PlanType;

    if (!userId || !planType) {
        console.error('❌ Missing userId or planType in session metadata');
        console.error('   userId:', userId);
        console.error('   planType:', planType);
        return;
    }

    console.log(`👤 Processing upgrade for user ${userId} to plan ${planType}`);

    const subscriptionId = session.subscription as string;
    console.log('🔖 Stripe subscription ID:', subscriptionId);

    // Get subscription details from Stripe
    const stripeSubscription: any = await stripe.subscriptions.retrieve(subscriptionId);
    console.log('📋 Stripe subscription retrieved:', {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        priceId: stripeSubscription.items.data[0].price.id
    });

    // Update subscription table
    const updatedSubscription = await prisma.subscription.upsert({
        where: { userId },
        create: {
            userId,
            planType,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: stripeSubscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: stripeSubscription.current_period_end 
                ? new Date(stripeSubscription.current_period_end * 1000) 
                : undefined,
            isActive: true,
            startDate: new Date()
        },
        update: {
            planType,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: stripeSubscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: stripeSubscription.current_period_end 
                ? new Date(stripeSubscription.current_period_end * 1000) 
                : undefined,
            isActive: true,
            cancelAtPeriodEnd: false
        }
    });
    console.log('✅ Subscription table updated:', {
        userId: updatedSubscription.userId,
        planType: updatedSubscription.planType,
        isActive: updatedSubscription.isActive
    });

    // Also update the user's plan field
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { plan: planType }
    });
    console.log('✅ User table updated:', {
        userId: updatedUser.id,
        plan: updatedUser.plan,
        email: updatedUser.email
    });

    // Verify the update worked
    const verification = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
    });
    console.log('🔍 VERIFICATION - User plan after update:', {
        userId: verification?.id,
        userPlan: verification?.plan,
        subscriptionPlan: verification?.subscription?.planType,
        subscriptionActive: verification?.subscription?.isActive
    });

    console.log(`✅ ✅ ✅ Subscription activated for user ${userId} with plan ${planType}`);
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdate(
    subscription: any
): Promise<void> {
    const userId = parseInt(subscription.metadata?.userId || '0');

    if (!userId) {
        console.error('Missing userId in subscription metadata');
        return;
    }

    const planType = subscription.metadata?.planType as PlanType || PlanType.PRO;
    const isActive = subscription.status === 'active' || subscription.status === 'trialing';

    await prisma.subscription.upsert({
        where: { userId },
        create: {
            userId,
            planType: isActive ? planType : PlanType.FREE,
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: subscription.current_period_end 
                ? new Date(subscription.current_period_end * 1000) 
                : undefined,
            isActive,
            cancelAtPeriodEnd: subscription.cancel_at_period_end
        },
        update: {
            planType: isActive ? planType : PlanType.FREE,
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: subscription.current_period_end 
                ? new Date(subscription.current_period_end * 1000) 
                : undefined,
            isActive,
            cancelAtPeriodEnd: subscription.cancel_at_period_end
        }
    });

    // Update user's plan field
    await prisma.user.update({
        where: { id: userId },
        data: { plan: isActive ? planType : PlanType.FREE }
    });

    console.log(`✅ Subscription updated for user ${userId}`);
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(
    subscription: Stripe.Subscription
): Promise<void> {
    const userId = parseInt(subscription.metadata?.userId || '0');

    if (!userId) {
        console.error('Missing userId in subscription metadata');
        return;
    }

    // Downgrade to FREE plan
    await prisma.subscription.update({
        where: { userId },
        data: {
            planType: PlanType.FREE,
            isActive: false,
            endDate: new Date()
        }
    });

    // Update user's plan field
    await prisma.user.update({
        where: { id: userId },
        data: { plan: PlanType.FREE }
    });

    console.log(`✅ Subscription deleted for user ${userId}, downgraded to FREE`);
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaymentSucceeded(
    invoice: any
): Promise<void> {
    const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
    if (!subscriptionId) return;

    const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = parseInt(subscription.metadata?.userId || '0');

    if (!userId) return;

    // Extend subscription period
    await prisma.subscription.update({
        where: { userId },
        data: {
            stripeCurrentPeriodEnd: subscription.current_period_end 
                ? new Date(subscription.current_period_end * 1000) 
                : undefined,
            isActive: true
        }
    });

    console.log(`✅ Payment succeeded for user ${userId}`);
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(
    invoice: any
): Promise<void> {
    const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
    if (!subscriptionId) return;

    const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = parseInt(subscription.metadata?.userId || '0');

    if (!userId) return;

    // Mark subscription as inactive if payment fails
    if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
        await prisma.subscription.update({
            where: { userId },
            data: {
                isActive: false
            }
        });

        console.log(`⚠️ Payment failed for user ${userId}, subscription marked inactive`);
    }
}

/**
 * Get subscription status for a user
 */
export const getUserSubscription = async (userId: number) => {
    return await prisma.subscription.findUnique({
        where: { userId },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    Firstname: true,
                    Lastname: true
                }
            }
        }
    });
};

/**
 * Cancel subscription (at period end)
 */
export const cancelSubscription = async (userId: number): Promise<void> => {
    const subscription = await prisma.subscription.findUnique({
        where: { userId }
    });

    if (!subscription?.stripeSubscriptionId) {
        throw new Error('No active subscription found');
    }

    // Cancel at period end in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
    });

    // Update in database
    await prisma.subscription.update({
        where: { userId },
        data: {
            cancelAtPeriodEnd: true
        }
    });

    console.log(`✅ Subscription cancellation scheduled for user ${userId}`);
};

export { stripe };
