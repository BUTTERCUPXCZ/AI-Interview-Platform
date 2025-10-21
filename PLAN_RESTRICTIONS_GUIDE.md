# 🔒 Plan-Based Feature Restrictions Guide

## Overview
This guide documents the comprehensive plan-based restrictions implemented across your AI Interview Platform. Free and Pro users now have clearly defined feature access levels enforced both on the backend and frontend.

---

## ✨ Feature Comparison

### 🆓 Free Plan Features

| Feature | Limit | Details |
|---------|-------|---------|
| **Practice Interviews** | 2 per week | Enforced by middleware, resets weekly |
| **AI Feedback** | Basic | Simple scores and basic evaluation |
| **Role Specializations** | 1 (Frontend only) | Other roles locked behind Pro |
| **Interview Types** | Technical, Behavioral | System Design is Pro-only |
| **Difficulty Levels** | Beginner, Intermediate | Advanced is Pro-only |
| **Community Support** | ✅ Available | Standard support channels |
| **Progress Tracking** | ✅ Available | Basic stats and history |
| **Coding Sandbox** | ❌ Not available | Pro feature |
| **Advanced Analytics** | ❌ Not available | Pro feature |

### 💎 Pro Plan Features ($29/month)

| Feature | Limit | Details |
|---------|-------|---------|
| **Practice Interviews** | ∞ Unlimited | No weekly limits |
| **AI Feedback** | Advanced | Comprehensive analysis with detailed insights |
| **Role Specializations** | All 5 roles | Frontend, Backend, Full Stack, Data Science, Mobile, DevOps |
| **Interview Types** | All types | Technical, Behavioral, System Design |
| **Difficulty Levels** | All levels | Beginner, Intermediate, Advanced |
| **Priority Support** | ✅ Available | Faster response times |
| **Detailed Analytics** | ✅ Available | Performance charts, trends, recommendations |
| **Mock Recordings** | ✅ Available | Session history with playback |
| **Custom Scenarios** | ✅ Available | System Design and advanced interview types |
| **Coding Sandbox** | ✅ Available | Interactive code editor with AI evaluation |
| **Interviewer Analysis** | ✅ Available | AI-powered communication feedback |
| **Career Recommendations** | ✅ Available | Personalized career path suggestions |

---

## 🛡️ Backend Restrictions

### 1. Interview Session Creation
**File:** `backend/controller/interviewSetup.controller.ts`

#### Role Specialization Restriction
```typescript
// FREE users can only access frontend
const allowedDomains = userPlan === 'PRO' 
    ? ['frontend', 'backend', 'fullstack', 'data-science', 'mobile', 'devops'] 
    : ['frontend'];

if (!allowedDomains.includes(domain)) {
    return res.status(403).json({ 
        error: 'Upgrade to Pro to access all role specializations',
        message: 'Free plan users can only access Frontend Development.',
        requiredPlan: 'PRO'
    });
}
```

#### Interview Type Restriction
```typescript
// System Design is PRO-only
const allowedInterviewTypes = userPlan === 'PRO' 
    ? ['technical', 'behavioral', 'system-design'] 
    : ['technical', 'behavioral'];

if (!allowedInterviewTypes.includes(interviewType)) {
    return res.status(403).json({ 
        error: 'Upgrade to Pro for custom interview scenarios',
        message: 'System Design interviews are a Pro feature.',
        requiredPlan: 'PRO'
    });
}
```

#### Difficulty Level Restriction
```typescript
// Advanced difficulty is PRO-only
const allowedDifficulty = userPlan === 'PRO' 
    ? ['Beginner', 'Intermediate', 'Advanced'] 
    : ['Beginner', 'Intermediate'];

if (!allowedDifficulty.includes(difficulty)) {
    return res.status(403).json({ 
        error: 'Upgrade to Pro for advanced difficulty',
        message: 'Advanced difficulty interviews are a Pro feature.',
        requiredPlan: 'PRO'
    });
}
```

### 2. Weekly Interview Limit
**File:** `backend/middleware/checkplanlimit.ts`

```typescript
// FREE plan limit: 2 sessions per week
if (plan === "FREE" && interviewsThisWeek >= 2) {
    return res.status(403).json({
        message: "Free plan users can only take 2 practice interviews per week.",
    });
}
```

### 3. Advanced Feedback & Analytics
**File:** `backend/controller/feedback.controller.ts`

#### Comprehensive Feedback (PRO-only)
```typescript
export const generateComprehensiveSessionFeedback = async (req, res) => {
    const subscription = await prisma.subscription.findUnique({ where: { userId } });
    const userPlan = subscription?.planType ?? 'FREE';

    if (userPlan !== 'PRO') {
        return res.status(403).json({ 
            error: 'Upgrade to Pro for advanced feedback',
            message: 'Detailed performance analytics are Pro features.',
            requiredPlan: 'PRO'
        });
    }
    // ... generate comprehensive feedback
}
```

#### Interviewer Analysis (PRO-only)
```typescript
export const analyzeInterviewerBehavior = async (req, res) => {
    if (userPlan !== 'PRO') {
        return res.status(403).json({ 
            error: 'Upgrade to Pro for detailed analytics',
            feature: 'Detailed Performance Analytics'
        });
    }
    // ... analyze interviewer behavior
}
```

#### Career Recommendations (PRO-only)
```typescript
export const generateAICareerRecommendations = async (req, res) => {
    if (userPlan !== 'PRO') {
        return res.status(403).json({ 
            error: 'Upgrade to Pro for career recommendations',
            feature: 'Detailed Performance Analytics'
        });
    }
    // ... generate recommendations
}
```

---

## 🎨 Frontend Restrictions

### 1. Interview Setup Page
**File:** `frontend/src/pages/InterviewSetup.tsx`

#### Visual Restrictions
- **Locked Features**: Show lock icon 🔒 and "Pro Only" badge
- **Disabled State**: Greyed out with reduced opacity (60%)
- **Click Handler**: Alert + redirect to pricing page

#### Role Specialization UI
```tsx
const isLocked = !isPro && domain.id !== 'frontend';

<div 
    className={isLocked ? 'opacity-60 cursor-not-allowed' : ''}
    onClick={() => {
        if (isLocked) {
            alert('Upgrade to Pro to access all 5 role specializations');
            navigate('/pricing');
            return;
        }
        // ... set domain
    }}
>
    {isLocked && <Lock className="h-4 w-4" />}
    {isLocked && (
        <div className="flex items-center gap-1">
            <Crown className="h-3 w-3 text-yellow-500" />
            <span className="text-xs text-yellow-600">Pro Only</span>
        </div>
    )}
</div>
```

#### Interview Type UI
```tsx
// System Design is locked for FREE users
const isLocked = !isPro && type.id === 'system-design';
```

#### Difficulty Level UI
```tsx
// Advanced is locked for FREE users
const isLocked = !isPro && level.id === 'Advanced';
```

### 2. Dashboard Plan Badge
**File:** `frontend/src/pages/Dashboard.tsx`

```tsx
<Card className="p-6 bg-gradient-to-r from-primary/10">
    <div className="flex items-center gap-4">
        <div className={isPro ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 'bg-muted'}>
            {isPro ? <Crown /> : <Zap />}
        </div>
        <div>
            <h3>{isPro ? 'Pro Plan' : 'Free Plan'}</h3>
            <p>
                {isPro ? (
                    <span>∞ Unlimited interviews • All features unlocked</span>
                ) : (
                    <span>
                        {remainingInterviews} interviews remaining this week •
                        <span onClick={() => navigate('/pricing')}>Upgrade to Pro</span>
                    </span>
                )}
            </p>
        </div>
    </div>
    {!isPro && <Button onClick={() => navigate('/pricing')}>Upgrade to Pro</Button>}
</Card>
```

### 3. Subscription Status Hook
**File:** `frontend/src/hooks/useSubscription.ts`

```typescript
// Get current subscription status
export const useSubscriptionStatus = () => {
    return useQuery({
        queryKey: ['subscription-status'],
        queryFn: async () => {
            const response = await axios.get('/api/subscription/status');
            return response.data;
        },
        staleTime: 5 * 60 * 1000 // Cache for 5 minutes
    });
};

// Helper to check if user has PRO plan
export const useIsPro = () => {
    const { data } = useSubscriptionStatus();
    return data?.planType === 'PRO';
};
```

---

## 🔐 Protected Routes

### Interview Routes
**File:** `backend/routes/interview.ts`

```typescript
// Session creation - protected with auth + plan limit
router.post("/session/create", isAuthenticated, checkPlanLimit, createInterviewSession);

// PRO-only: Advanced features
router.post("/session/:sessionId/comprehensive-feedback", isAuthenticated, generateComprehensiveSessionFeedback);
router.post("/session/:sessionId/interviewer-analysis", isAuthenticated, analyzeInterviewerBehavior);
router.get("/session/:sessionId/ai-recommendations", isAuthenticated, generateAICareerRecommendations);
```

---

## 📊 User Experience Flow

### Free User Journey
1. **Sign Up** → Automatically assigned FREE plan
2. **Dashboard** → See plan badge: "Free Plan • 2 interviews remaining"
3. **Interview Setup** → 
   - ✅ Can select: Frontend (only)
   - ❌ Backend, Full Stack, Data Science, Mobile (locked with Pro badge)
   - ✅ Can select: Technical, Behavioral
   - ❌ System Design (locked)
   - ✅ Can select: Beginner, Intermediate
   - ❌ Advanced (locked)
4. **Start Interview** → Normal flow
5. **Feedback** → Basic AI evaluation (scores + simple feedback)
6. **After 2 Interviews** → Blocked from creating more until next week
7. **Upgrade Prompt** → Clear call-to-action to upgrade

### Pro User Journey
1. **Upgrade to Pro** → Stripe checkout flow
2. **Dashboard** → See plan badge: "Pro Plan • ∞ Unlimited interviews"
3. **Interview Setup** → 
   - ✅ All 6 role specializations unlocked
   - ✅ All 3 interview types unlocked
   - ✅ All 3 difficulty levels unlocked
4. **Start Interview** → Normal flow (no limits)
5. **Feedback** → Advanced AI feedback with:
   - Comprehensive performance analytics
   - Interviewer behavior analysis
   - AI career recommendations
   - Detailed charts and insights
6. **No Limits** → Can create unlimited interviews

---

## 🧪 Testing

### Test Free Plan Restrictions

```bash
# 1. Create FREE user account (register)
# 2. Check dashboard - should show "Free Plan • 2 interviews remaining"
# 3. Go to Interview Setup:
#    - Try to select Backend → Should see lock icon + "Pro Only" badge
#    - Try to select System Design → Should see lock icon
#    - Try to select Advanced difficulty → Should see lock icon
#    - Click on locked feature → Should alert + redirect to /pricing
# 4. Create 2 interviews successfully
# 5. Try to create 3rd interview → Should get error: "Free plan users can only take 2 practice interviews per week"
# 6. Try to access comprehensive feedback → Should get 403 error
```

### Test Pro Plan Features

```bash
# 1. Create account and upgrade to Pro (use test card: 4242 4242 4242 4242)
# 2. Check dashboard - should show "Pro Plan • ∞ Unlimited interviews"
# 3. Go to Interview Setup:
#    - All domains should be unlocked (no lock icons)
#    - All interview types should be unlocked
#    - All difficulty levels should be unlocked
# 4. Create multiple interviews (more than 2) → Should work without limits
# 5. Access comprehensive feedback → Should return detailed analytics
# 6. Access interviewer analysis → Should work
# 7. Access career recommendations → Should work
```

---

## 🎯 API Error Responses

### 403 Forbidden - Plan Restriction
```json
{
    "error": "Upgrade to Pro to access all role specializations",
    "message": "Free plan users can only access Frontend Development. Upgrade to Pro for all 5 specializations.",
    "requiredPlan": "PRO"
}
```

### 403 Forbidden - Weekly Limit
```json
{
    "message": "Free plan users can only take 2 practice interviews per week."
}
```

---

## 🚀 Adding More Restrictions

### Pattern for New Restrictions

#### Backend (Controller)
```typescript
export const newProFeature = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const subscription = await prisma.subscription.findUnique({ where: { userId } });
    const userPlan = subscription?.planType ?? 'FREE';

    // Check PRO access
    if (userPlan !== 'PRO') {
        return res.status(403).json({ 
            error: 'Upgrade to Pro for this feature',
            message: 'This feature is only available for Pro users.',
            requiredPlan: 'PRO',
            feature: 'Feature Name'
        });
    }

    // ... feature implementation
};
```

#### Frontend (Component)
```tsx
import { useSubscriptionStatus } from '@/hooks/useSubscription';

const MyComponent = () => {
    const { data: subscription } = useSubscriptionStatus();
    const isPro = subscription?.planType === 'PRO';

    const isLocked = !isPro; // Condition for locking

    return (
        <div 
            className={isLocked ? 'opacity-60 cursor-not-allowed' : ''}
            onClick={() => {
                if (isLocked) {
                    alert('Upgrade to Pro for this feature');
                    navigate('/pricing');
                    return;
                }
                // ... normal action
            }}
        >
            {isLocked && (
                <div className="flex items-center gap-1">
                    <Lock className="h-4 w-4" />
                    <Crown className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-yellow-600">Pro Only</span>
                </div>
            )}
            {/* ... content */}
        </div>
    );
};
```

---

## 📈 Analytics & Monitoring

### Track Plan Usage
```typescript
// Log plan restrictions for analytics
console.log(`User ${userId} attempted to access ${feature} with ${userPlan} plan`);

// Track upgrade conversions
console.log(`User ${userId} clicked upgrade CTA from ${location}`);
```

---

## ✅ Summary

### ✅ What's Implemented

1. **Backend Restrictions:**
   - ✅ Role specialization limits (Frontend only for FREE)
   - ✅ Interview type limits (No System Design for FREE)
   - ✅ Difficulty limits (No Advanced for FREE)
   - ✅ Weekly interview limits (2 per week for FREE)
   - ✅ Advanced feedback restrictions (PRO only)
   - ✅ Interviewer analysis restrictions (PRO only)
   - ✅ Career recommendations restrictions (PRO only)

2. **Frontend Restrictions:**
   - ✅ Visual indicators (lock icons, Pro badges)
   - ✅ Disabled states for locked features
   - ✅ Upgrade prompts and redirects
   - ✅ Plan badge on dashboard
   - ✅ Remaining interviews counter

3. **Security:**
   - ✅ Server-side validation (cannot bypass with frontend)
   - ✅ JWT authentication required
   - ✅ Middleware enforcement
   - ✅ Consistent error responses

### 🎉 Result
Your AI Interview Platform now has a complete, production-ready plan restriction system that:
- Encourages Free users to upgrade
- Provides clear value proposition for Pro plan
- Enforces limits securely on the backend
- Provides excellent UX with visual feedback
- Scales easily for adding more restrictions

---

## 📞 Support

If users encounter issues with plan restrictions:
1. Check subscription status in database
2. Verify Stripe subscription sync
3. Check middleware execution
4. Review error logs for 403 responses
5. Test with different plan types

---

**Last Updated:** January 2025
