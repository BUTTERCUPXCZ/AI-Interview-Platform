# 🚀 Quick Start - Stripe Subscription

## Your subscription system is ready! Here's how to test it:

### 1. Start Your Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev

# Terminal 3 - Stripe Webhooks (optional for local testing)
stripe listen --forward-to localhost:3000/api/subscription/webhook
```

### 2. Test the Free Plan

1. Open http://localhost:5173
2. Click **"Start Free"** on the Free plan card
3. Login/register if needed
4. ✅ You'll be redirected to dashboard with FREE plan

### 3. Test the Pro Plan ($29/month)

1. Go back to landing page
2. Click **"Get Pro"** on the Pro plan card
3. You'll be redirected to Stripe Checkout
4. Use test card: **4242 4242 4242 4242**
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
5. Complete payment
6. ✅ You'll see success page and be redirected to dashboard with PRO plan

### 4. Verify Plan Features

**As FREE user:**
- Create 2 interview sessions ✅
- Try to create a 3rd → You'll get error: "Free plan users can only take 2 practice interviews per week"

**As PRO user:**
- Create unlimited interview sessions ✅
- Coding sandbox is enabled automatically ✅

### 5. Environment Variables Already Set

✅ Backend `.env`:
- `STRIPE_SECRET_KEY` - Your test key is already there
- `STRIPE_WEBHOOK_SECRET` - Add this from Stripe CLI output (see step 1, Terminal 3)

✅ Frontend already uses:
- Correct Price IDs from your Stripe dashboard
- API base URL configured

### 6. Database Check

```bash
# Check subscriptions in your database
cd backend
npx prisma studio
```

Look at:
- `Subscription` table - see plan types, Stripe IDs
- `User` table - see `plan` field (FREE or PRO)

---

## 🎯 What's Working

### ✅ Backend
- Stripe checkout session creation
- Webhook handling (syncs Stripe → Database)
- Plan enforcement middleware (2 interviews/week for FREE)
- Pro-only features (coding sandbox auto-enabled for PRO)
- Subscription status API
- Cancellation (at period end)

### ✅ Frontend
- Pricing page with Stripe integration
- Free plan activation (instant)
- Pro plan checkout (redirects to Stripe)
- Success page with auto-redirect
- Cancel page with helpful info
- Loading states during checkout

### ✅ Security
- JWT authentication required
- Webhook signature verification
- User ownership validation
- Plan limits enforced server-side

---

## 📝 Next Steps (Optional)

### Add Billing Portal (Manage Subscription)

Users can manage their subscription in Stripe's portal. Add this to ProfilePage:

```tsx
const handleManageSubscription = async () => {
  const res = await axios.post('/api/subscription/create-portal', {}, { withCredentials: true });
  window.location.href = res.data.url;
};

<Button onClick={handleManageSubscription}>
  Manage Subscription
</Button>
```

### Add More Plan-Restricted Features

Example - restrict advanced feedback to PRO:

```typescript
// In feedback controller
export const getAdvancedFeedback = async (req: Request, res: Response) => {
  const userPlan = (req as any).userPlan;
  
  if (userPlan !== 'PRO') {
    return res.status(403).json({
      error: 'Advanced feedback requires a Pro subscription',
      upgradeUrl: '/pricing'
    });
  }
  
  // Return advanced feedback...
};
```

---

## 🐛 Common Issues

**Webhook not working?**
- Run `stripe listen --forward-to localhost:3000/api/subscription/webhook`
- Copy the `whsec_...` secret shown in terminal
- Add it to `backend/.env` as `STRIPE_WEBHOOK_SECRET`

**Payment not updating plan?**
- Check webhook events in terminal (from `stripe listen`)
- Check backend console logs
- Verify Stripe webhook secret is correct

**Can't create 3rd interview as FREE user?**
- ✅ This is correct! Working as intended
- Upgrade to PRO to get unlimited interviews

---

## 📖 Full Documentation

See `STRIPE_SUBSCRIPTION_SETUP.md` for:
- Detailed setup instructions
- Production deployment checklist
- Troubleshooting guide
- Testing strategies
- Adding more features

---

## ✨ You're All Set!

Your subscription system is fully functional. Test it now with the steps above! 🎉
