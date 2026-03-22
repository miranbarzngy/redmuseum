# Supabase Setup Instructions

## Problem Identified

Your `.env.local` file contains fake Supabase credentials:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_TBSBdDmvnphx26C51b8mGg_wExGcaB5`
- `SUPABASE_SERVICE_ROLE_KEY=your-real-service-role-key-here

These are not valid credentials and will cause authentication to fail.

## Solution

### Step 1: Get Real Supabase Credentials

1. Go to your Supabase project dashboard
2. Click on "Settings" in the left sidebar
3. Click on "API"
4. Copy the "Project URL" and "anon public" key
5. Update your `.env.local` file with the real values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-real-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-real-service-role-key-here
```

### Step 2: Create Admin User

1. In your Supabase dashboard, go to "Authentication" > "Users"
2. Click "Invite user" or "Create user"
3. Create an admin user with:
   - Email: `admin@amnasuraka.com` (or your preferred admin email)
   - Password: `your-admin-password`
4. Make sure to set the user as confirmed

### Step 3: Test the Login

After updating the credentials and creating a user:

1. Restart your development server
2. Go to `/admin/login`
3. Enter the admin email and password
4. You should be redirected to `/admin/dashboard`

## Current Login Page Features

The login page now includes:

- ✅ Proper error handling and debugging
- ✅ Console logging for troubleshooting
- ✅ Router redirect to dashboard on success
- ✅ Session persistence through Supabase auth
- ✅ Error messages displayed to user

## Debugging

If login still fails:

1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Try logging in
4. Check console for error messages
5. Common issues:
   - Wrong Supabase URL
   - Wrong API keys
   - User not confirmed in Supabase
   - Network connectivity issues

## Testing Credentials

You can test if your Supabase credentials are working by running this in your browser console:

```javascript
// Test Supabase connection
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

// Test if you can get session
const { data, error } = await supabase.auth.getSession();
console.log("Session test:", { data, error });
```
