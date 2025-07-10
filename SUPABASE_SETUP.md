# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub, Google, or create an account
4. Click "New Project"
5. Fill in your project details:
   - Name: `iris-whiteboard`
   - Database Password: (generate a strong password)
   - Region: Choose closest to your users
6. Click "Create new project"

## 2. Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (something like: `https://your-project.supabase.co`)
   - **Public anon key** (starts with `eyJ...`)

## 3. Configure Your Application

1. Open `auth.js` file
2. Replace the placeholder values:
   ```javascript
   const SUPABASE_URL = 'https://your-project.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
   ```

## 4. Set Up Authentication Providers

### Email Authentication (Default)
- Already configured! Users can sign up with email/password.

### Google OAuth (Optional)
1. In Supabase dashboard: **Authentication** → **Providers**
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Get credentials from [Google Cloud Console](https://console.cloud.google.com)
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`

### GitHub OAuth (Optional)
1. In Supabase dashboard: **Authentication** → **Providers**
2. Enable GitHub provider
3. Add your GitHub OAuth App credentials:
   - Create OAuth App in [GitHub Settings](https://github.com/settings/applications/new)
   - Authorization callback URL: `https://your-project.supabase.co/auth/v1/callback`

## 5. Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize the email templates for:
   - Confirm signup
   - Reset password
   - Magic link

## 6. Set Up User Profiles Table (Optional)

Run this SQL in your Supabase SQL editor to create a user profiles table:

```sql
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 7. Test Your Setup

1. Open `auth.html` in your browser
2. Try signing up with a new email
3. Check your email for confirmation
4. Try signing in with your credentials

## 8. Production Considerations

### Security
- Never expose your `service_role` key in client-side code
- Use Row Level Security (RLS) policies
- Set up proper CORS settings in Supabase

### Email Configuration
- Set up custom SMTP for production emails
- Configure your domain for email authentication

### Domain Configuration
- Add your production domain to allowed origins
- Update redirect URLs in OAuth providers

## 9. Environment Variables (Recommended)

Instead of hardcoding credentials, use environment variables:

```javascript
const SUPABASE_URL = process.env.SUPABASE_URL || 'your-fallback-url';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-fallback-key';
```

## Troubleshooting

### Common Issues:

1. **"Invalid API key"**: Check that you're using the `anon` key, not the `service_role` key
2. **CORS errors**: Make sure your domain is added to allowed origins in Supabase
3. **Email not sending**: Check your email settings and spam folder
4. **OAuth not working**: Verify redirect URLs match exactly

### Getting Help:

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com/)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

## Next Steps

After setting up authentication:

1. Add authentication checks to your main app (`index.html`)
2. Create user-specific canvas saving/loading
3. Add user profile management
4. Implement team collaboration features
