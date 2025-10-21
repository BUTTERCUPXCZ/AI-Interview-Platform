# Stripe Subscription Integration Guide

## Overview
This guide explains the complete Stripe subscription implementation for AceDevAI's Free and Pro plans.

## ✅ What's Been Implemented

### Backend
1. **Database Schema** (`backend/prisma/schema.prisma`)
   - Updated `Subscription` model with Stripe fields:
     - `stripeCustomerId` - Unique Stripe customer ID
     - `stripeSubscriptionId` - Unique Stripe subscription ID
     - `stripePriceId` - Price ID from Stripe dashboard
     - `stripeCurrentPeriodEnd` - Billing period end date
     - `cancelAtPeriodEnd` - Cancellation flag
   - `PlanType` enum: `FREE`, `PRO`
   - User model has `plan` field (PlanType)

2. **Stripe Service** (`backend/services/stripeService.ts`)
   - `createCheckoutSession()` - Creates Stripe checkout for Pro plan
   - `createBillingPortalSession()` - Opens Stripe portal for subscription management
   - `handleWebhookEvent()` - Processes Stripe webhook events
   - `getUserSubscription()` - Gets user's subscription status
   - `cancelSubscription()` - Cancels subscription at period end
   - Webhook handlers for: checkout completion, subscription updates, payment events

3. **Subscription Controller** (`backend/controller/subscription.controller.ts`)
   - `POST /api/subscription/create-checkout` - Creates checkout (handles both FREE and PRO)
   - `POST /api/subscription/create-portal` - Opens billing portal
   - `GET /api/subscription/status` - Returns subscription status
   - `POST /api/subscription/cancel` - Cancels subscription
   - `POST /api/subscription/webhook` - Webhook endpoint (requires raw body)

4. **Plan Limit Middleware** (`backend/middleware/checkplanlimit.ts`)
   - Enforces FREE plan limit: 2 interviews per week
   - Attaches `userPlan` and `subscription` to request
   - PRO users have unlimited interviews

5. **Interview Session Protection** (`backend/routes/interview.ts`)
   - Session creation protected by `isAuthenticated` + `checkPlanLimit`
   - Pro-only features (like `enableCodingSandbox`) enforced in controller

### Frontend
1. **Pricing Component** (`frontend/src/components/Pricing.tsx`)
   - Integrated with Stripe checkout
   - Free plan: Creates subscription record and redirects to dashboard
   - Pro plan: Opens Stripe checkout with priceId
   - Team plan: Opens email to sales
   - Loading states during checkout

2. **Subscription Hook** (`frontend/src/hooks/useSubscription.ts`)
   - `createCheckout(priceId, planType)` - Initiates checkout flow
   - Handles FREE plan locally
   - Redirects to Stripe Checkout for PRO

3. **Success/Cancel Pages**
   - `/success` - Shows success message, auto-redirects to dashboard
   - `/cancel` - Shows cancellation message, links back to pricing

4. **Routes** (`frontend/src/App.tsx`)
   - Added protected routes for `/success` and `/cancel`

## 🔧 Environment Variables Required

### Backend (`.env`)
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook signing secret (from Stripe dashboard)

# Frontend URL for redirects
FRONTEND_URL=http://localhost:5173 # or your production URL
```

### Frontend (`.env` or `.env.local`)
```env
# API Base URL (already configured)
VITE_API_BASE_URL=/api

# Frontend URL for redirects
VITE_FRONTEND_URL=http://localhost:5173
```

## 📋 Setup Steps

### 1. Stripe Dashboard Setup

1. **Create Products and Prices**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com)
   - Products → Add Product
   - **Pro Plan**:
     - Name: "Pro Plan"
     - Price: $29/month (recurring)
     - Copy the Price ID (e.g., `price_1SKUizBQ6sV3m28s7eCCJGQw`)

2. **Get Your API Keys**
   - Developers → API keys
   - Copy "Secret key" (starts with `sk_test_` for test mode)
   - Add to `backend/.env` as `STRIPE_SECRET_KEY`

3. **Set up Webhooks** (for production)
   - Developers → Webhooks → Add endpoint
   - Endpoint URL: `https://your-backend-url.com/api/subscription/webhook`
   - Events to listen:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy "Signing secret" (starts with `whsec_`)
   - Add to `backend/.env` as `STRIPE_WEBHOOK_SECRET`

### 2. Test Webhooks Locally

For local development, use Stripe CLI:

```bash
# Install Stripe CLI
# macOS
brew install stripe/stripe-cli/stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_amd64.tar.gz
tar -xvf stripe_linux_amd64.tar.gz
sudo mv stripe /usr/local/bin/

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/subscription/webhook

# This will output a webhook secret like: whsec_...
# Copy this and add to backend/.env as STRIPE_WEBHOOK_SECRET
```

### 3. Update Price IDs in Frontend

The Price IDs are already in `frontend/src/components/Pricing.tsx`:
```tsx
const plans = [
  {
    name: 'Pro',
    priceId: 'price_1SKUizBQ6sV3m28s7eCCJGQw', // Update with your Price ID
    ...
  }
]
```

### 4. Run Database Migration

```bash
cd backend
npx prisma migrate dev
```

## 🧪 Testing

### Test Free Plan
1. Go to `/` (landing page)
2. Click "Start Free" on Free plan
3. Login if not authenticated
4. Should redirect to dashboard
5. Check database - `Subscription` record created with `planType: FREE`

### Test Pro Plan
1. Go to `/` (landing page)
2. Click "Get Pro" on Pro plan
3. Login if not authenticated
4. Redirects to Stripe Checkout
5. Use test card: `4242 4242 4242 4242`, any future date, any CVC
6. Complete payment
7. Redirects to `/success`
8. Check database - `Subscription` updated with Stripe IDs and `planType: PRO`

### Test Plan Limits
1. As FREE user, create 2 interview sessions - should work
2. Try to create a 3rd interview - should get 403 error:
   ```json
   {
     "message": "Free plan users can only take 2 practice interviews per week."
   }
   ```
3. As PRO user, create unlimited interviews - should work

### Test Stripe CLI Webhooks
```bash
# In one terminal, start your backend
cd backend && npm run dev

# In another terminal, forward webhooks
stripe listen --forward-to localhost:3000/api/subscription/webhook

# In a third terminal, trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_succeeded
```

## 🎯 Plan-Based Feature Access

### Current Implementation

**FREE Plan Features:**
- 2 practice interviews per week (enforced by middleware)
- Basic AI feedback
- 1 role specialization
- Progress tracking

**PRO Plan Features:**
- ✅ Unlimited practice interviews (no middleware limit)
- ✅ Coding sandbox enabled (`enableCodingSandbox: true`)
- Advanced AI feedback
- All 5 role specializations
- Detailed performance analytics

### Adding More Plan-Restricted Features

To add restrictions for other features, use the middleware-attached plan info:

```typescript
// In any controller
export const someFeatureController = async (req: Request, res: Response) => {
    const userPlan = (req as any).userPlan; // 'FREE' or 'PRO'
    
    if (userPlan !== 'PRO') {
        return res.status(403).json({
            error: 'This feature requires a Pro subscription',
            upgradeUrl: '/pricing'
        });
    }
    
    // Continue with Pro-only feature...
};
```

Frontend UI can also check plan:
```typescript
// Get subscription status
const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
        const res = await axios.get('/api/subscription/status', { withCredentials: true });
        return res.data;
    }
});

// Conditionally render features
{subscription?.planType === 'PRO' && (
    <ProOnlyFeature />
)}
```

## 🔐 Security Notes

1. **Webhook Secret**: Never commit `STRIPE_WEBHOOK_SECRET` to Git
2. **API Keys**: Keep `STRIPE_SECRET_KEY` secure, never expose to frontend
3. **Webhook Verification**: All webhooks are verified using Stripe signature
4. **Authentication**: All subscription endpoints require JWT authentication
5. **User Ownership**: Webhooks use metadata to match users, not client input

## 📊 Monitoring

### Check Subscription Status
```bash
# Via API
curl -X GET http://localhost:3000/api/subscription/status \
  -H "Cookie: token=YOUR_JWT_TOKEN"

# Response:
{
  "planType": "PRO",
  "isActive": true,
  "cancelAtPeriodEnd": false,
  "currentPeriodEnd": "2024-11-20T12:00:00.000Z",
  "startDate": "2024-10-21T12:00:00.000Z"
}
```

### Database Queries
```sql
-- Check all subscriptions
SELECT u.email, s."planType", s."isActive", s."stripeSubscriptionId"
FROM "User" u
LEFT JOIN "Subscription" s ON u.id = s."userId";

-- Count by plan type
SELECT "planType", COUNT(*) 
FROM "Subscription" 
GROUP BY "planType";

-- Active PRO subscriptions
SELECT u.email, s."stripeCurrentPeriodEnd"
FROM "User" u
JOIN "Subscription" s ON u.id = s."userId"
WHERE s."planType" = 'PRO' AND s."isActive" = true;
```

## 🚀 Deployment Checklist

- [ ] Update `FRONTEND_URL` in backend `.env` to production URL
- [ ] Update `VITE_API_BASE_URL` if needed
- [ ] Add webhook endpoint in Stripe Dashboard (production mode)
- [ ] Use production Stripe keys (`sk_live_...`)
- [ ] Test webhook delivery in Stripe Dashboard
- [ ] Set up monitoring for failed payments
- [ ] Configure email notifications for subscription events
- [ ] Test the full checkout flow in production
- [ ] Verify plan limits are enforced

## 📝 Next Steps (Optional Enhancements)

1. **Billing Portal Integration**
   - Add "Manage Subscription" button in ProfilePage
   - Calls `POST /api/subscription/create-portal`
   - Redirects to Stripe Billing Portal

2. **Team Plan Implementation**
   - Add Team plan webhook handlers
   - Implement team member management
   - Add team-specific features

3. **Trial Period**
   - Add 14-day trial to Pro plan in Stripe Dashboard
   - Update webhook handlers to handle trial periods

4. **Proration**
   - Handle plan upgrades/downgrades
   - Stripe handles proration automatically

5. **Usage Tracking**
   - Track interview usage per user
   - Display in dashboard

6. **Email Notifications**
   - Payment successful
   - Payment failed
   - Subscription cancelled
   - Subscription renewed

## 🐛 Troubleshooting

### Webhook not working
- Check `STRIPE_WEBHOOK_SECRET` is correct
- Ensure endpoint receives raw body (not JSON parsed)
- Check Stripe CLI is forwarding events
- Verify webhook signature in Stripe Dashboard

### Payment not updating database
- Check webhook events in Stripe Dashboard
- Look for errors in webhook logs
- Verify metadata (userId, planType) is included in checkout session

### Plan limits not enforced
- Verify `isAuthenticated` middleware runs first
- Check `checkPlanLimit` is added to route
- Ensure subscription record exists for user

### Frontend not redirecting to Stripe
- Check `VITE_API_BASE_URL` is correct
- Verify Price ID is valid
- Check network tab for API errors

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
