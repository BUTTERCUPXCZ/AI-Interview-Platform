# 🚀 Quick Deployment Checklist

## Before You Deploy

### ✅ Backend Environment Variables (Render.com)
```env
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
JWT_SECRET=your-secret-key
DATABASE_URL=your-database-url
# ... other variables
```

### ✅ Frontend Environment Variables (Vercel)
```env
VITE_API_BASE_URL=https://your-backend.render.com/api
```

## Deploy Commands

```bash
git add .
git commit -m "Fix: Production authentication and GSAP errors"
git push origin main
```

## After Deployment Testing

1. ✅ Open production site in incognito mode
2. ✅ Clear cookies
3. ✅ Try login
4. ✅ Check console (should be clean, no GSAP errors)
5. ✅ Check Network tab (cookies should be set)
6. ✅ Refresh page (should stay logged in)

## If Issues Persist

### Quick Checks:
- [ ] Both sites use HTTPS?
- [ ] Environment variables match your actual URLs?
- [ ] Backend deployed with latest changes?
- [ ] Frontend deployed with latest changes?
- [ ] Browser cookies cleared?

### Debug Steps:
1. Open browser DevTools → Network tab
2. Attempt login
3. Check `/auth/login` response headers
4. Look for `Set-Cookie` header
5. Verify cookie has `SameSite=None; Secure`

## Common Issues

| Issue | Solution |
|-------|----------|
| 401 errors | Check FRONTEND_URL matches exactly |
| No cookies set | Verify both sites use HTTPS |
| GSAP warnings | Clear browser cache, should be gone |
| CORS errors | Check CORS origin in backend logs |

## Files Changed

- ✅ `frontend/src/components/Hero.tsx`
- ✅ `frontend/src/contexts/AuthContext.tsx`
- ✅ `frontend/.env.production` (NEW)
- ✅ `backend/src/server.ts`
- ✅ `backend/utils/jwt.utils.ts`
- ✅ `backend/.env`
