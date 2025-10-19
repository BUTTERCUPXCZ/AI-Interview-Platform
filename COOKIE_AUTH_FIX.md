# Cookie Authentication Reload Fix

## Problem
When reloading protected pages (Dashboard, Interview Setup, Progress, Profile), users were being redirected to the login page even though they were authenticated with valid cookies.

## Root Cause
The issue was with React Query's configuration in the `AuthContext`. When a page reload occurred:

1. React Query's cache was empty (caches don't persist across page reloads by default)
2. The `useQuery` hook would return `undefined` for the user data initially
3. Before the authentication check completed, `isAuthenticated` would be `false`
4. The `ProtectedRoute` component would see `isAuthenticated === false` and redirect to login
5. The query would complete in the background, but the redirect had already happened

## Solution

### 1. Updated `AuthContext.tsx`
Made the following changes to ensure proper authentication state on page reload:

**Changes:**
- Added `refetchOnMount: true` to force refetch when component mounts (critical for page reloads)
- Added `gcTime` (garbage collection time) to keep cache data longer
- Added `isFetching` state to `isLoading` calculation to prevent premature redirects
- Added debug logging to track authentication flow

**Key configuration:**
```typescript
const {
    data: user,
    isLoading,
    isFetching,
    refetch: refetchUser,
} = useQuery({
    queryKey: ['user'],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnMount: true, // ← Critical for page reloads
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
});

const value: AuthContextType = {
    user: user || null,
    isLoading: isLoading || isFetching, // ← Wait for both states
    isAuthenticated: !!user,
    logout,
    refetchUser,
};
```

### 2. Updated `main.tsx`
Added better default configuration for React Query:

```typescript
const queryclient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});
```

## How It Works Now

### Page Reload Flow:
1. User reloads protected page
2. React app initializes
3. `AuthContext` mounts and starts fetching user (with `isLoading = true`)
4. `ProtectedRoute` sees `isLoading = true` and shows loading spinner
5. Backend receives request with HTTP-only cookie
6. Backend verifies JWT token and returns user data
7. `AuthContext` sets `user` data and `isAuthenticated = true`
8. `ProtectedRoute` renders the protected content
9. User sees their page, not login screen

### If Cookie is Invalid/Expired:
1. User reloads protected page
2. `AuthContext` fetches user data
3. Backend returns 401 (cookie invalid/expired)
4. `fetchCurrentUser` returns `null`
5. `isAuthenticated = false`
6. `ProtectedRoute` redirects to login
7. User is correctly asked to login again

## Testing Checklist

- [x] Lint checks pass
- [ ] User can login successfully
- [ ] User stays logged in after page reload on Dashboard
- [ ] User stays logged in after page reload on Interview Setup
- [ ] User stays logged in after page reload on Progress
- [ ] User stays logged in after page reload on Profile
- [ ] User is redirected to login when cookie expires
- [ ] User is redirected to login when manually clearing cookies

## Files Modified

1. `/frontend/src/contexts/AuthContext.tsx`
   - Added `refetchOnMount: true`
   - Added `gcTime` configuration
   - Added `isFetching` to loading state
   - Added debug logging

2. `/frontend/src/main.tsx`
   - Added QueryClient default options
   - Configured better defaults for auth queries

## Technical Details

### Why `refetchOnMount: true` is Critical
By default, React Query might use stale cache data if available. But on page reload, there's no cache. Setting `refetchOnMount: true` ensures that every time the AuthProvider mounts (which happens on every page reload), it will fetch fresh user data from the backend.

### Why Both `isLoading` and `isFetching`
- `isLoading`: True only on the initial fetch
- `isFetching`: True whenever a fetch is in progress (including refetches)

By combining both (`isLoading || isFetching`), we ensure the ProtectedRoute waits for the refetch to complete on page reload.

### Cookie Security
The authentication continues to use HTTP-only, secure cookies with the correct `sameSite` settings:
- Development: `sameSite: "strict"` (same domain)
- Production: `sameSite: "none"` (cross-domain with HTTPS)

## Next Steps

1. Test the fix in development
2. If working, deploy to staging/production
3. Monitor for any authentication issues
4. Consider adding React Query Devtools for debugging

## Additional Notes

The backend JWT and cookie configuration remains unchanged - this was purely a frontend state management issue with how React Query handled page reloads.
