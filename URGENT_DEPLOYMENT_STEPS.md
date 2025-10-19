# 🎯 IMMEDIATE ACTION REQUIRED

## Your Backend URL (from error log):
```
https://ai-interview-platform-oz2b.onrender.com
```

## Step-by-Step Instructions

### STEP 1: Find Your Frontend Production URL

Your frontend is likely hosted on Vercel, Netlify, or similar. Find the URL:

- **Vercel**: Check your Vercel dashboard → your project → Domains
- **Netlify**: Check your Netlify dashboard → your site → Site settings
- **Other**: Check your deployment platform

Example URLs:
- `https://ai-interview-platform.vercel.app`
- `https://your-site-name.netlify.app`

### STEP 2: Update Backend Environment on Render.com

1. Go to https://dashboard.render.com
2. Click on your backend service
3. Go to "Environment" tab
4. Update or add these variables:

```env
NODE_ENV=production
FRONTEND_URL=https://YOUR-ACTUAL-FRONTEND-URL.vercel.app
```

**IMPORTANT**: Replace `https://YOUR-ACTUAL-FRONTEND-URL.vercel.app` with your real frontend URL from Step 1!

5. Click "Save Changes"
6. Your backend will automatically redeploy

### STEP 3: Update Frontend Environment on Your Hosting Platform

**If using Vercel:**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add this variable:

```
Name: VITE_API_BASE_URL
Value: https://ai-interview-platform-oz2b.onrender.com/api
```

5. Select "Production" environment
6. Save
7. Go to Deployments tab
8. Redeploy your latest deployment

**If using Netlify:**
1. Go to your Netlify dashboard
2. Select your site
3. Go to Site settings → Build & deploy → Environment
4. Add variable:

```
Key: VITE_API_BASE_URL
Value: https://ai-interview-platform-oz2b.onrender.com/api
```

5. Save
6. Trigger a new deploy

### STEP 4: Commit and Push Your Code Changes

```bash
# In your project directory
git add .
git commit -m "Fix: Production authentication cookies and GSAP errors"
git push origin main
```

This will trigger automatic deployments on both platforms.

### STEP 5: Test Your Production Site

1. Wait for deployments to complete (usually 2-5 minutes)
2. Open your production frontend URL in a **new incognito window**
3. Open browser DevTools (F12)
4. Try to log in
5. Check console:
   - ✅ Should see "Login successful"
   - ✅ No GSAP warnings
   - ✅ No repeated 401 errors

### STEP 6: Verify Cookies Are Working

1. In DevTools, go to Network tab
2. Find the `login` request
3. Click on it → Response Headers
4. You should see: `Set-Cookie: auth_token=...; SameSite=None; Secure`
5. Go to Application tab → Cookies
6. You should see `auth_token` cookie with:
   - ✅ Secure: true
   - ✅ SameSite: None
   - ✅ HttpOnly: true

## Troubleshooting

### If you still get 401 errors:

**Check 1**: Verify FRONTEND_URL on Render.com
- Go to Render.com → Your service → Environment
- Make sure FRONTEND_URL exactly matches your frontend domain
- Include `https://` and the exact domain (no trailing slash)

**Check 2**: Verify both sites use HTTPS
- Frontend URL should start with `https://`
- Backend URL should start with `https://`
- HTTP will NOT work in production!

**Check 3**: Clear everything and try again
- Clear all browser cookies
- Clear browser cache
- Close and reopen browser
- Try in incognito mode

### If GSAP errors persist:

- Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache completely
- Wait for the new deployment to propagate (can take a few minutes)

## Expected Result

After following all steps:
✅ Login works smoothly
✅ User stays logged in after page refresh
✅ No console errors
✅ No GSAP warnings
✅ Authentication persists across sessions

## Need Help?

If you're stuck on any step or still seeing errors:
1. Check which step you're on
2. Verify you've completed all previous steps
3. Take a screenshot of the error
4. Check the browser Network tab for the exact API response
