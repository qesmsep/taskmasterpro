# TaskMasterPro Environment Variables

This document lists all the environment variables required for the TaskMasterPro application.

## 🔐 Required Environment Variables

### Database Configuration
```env
# Supabase Database URL (Required)
DATABASE_URL="postgresql://postgres.zhdckqfqabahanamlxwh:your_password@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
```
**Description**: Connection string for your Supabase PostgreSQL database
**Format**: `postgresql://username:password@host:port/database`

### Supabase Configuration
```env
# Supabase Project URL (Required)
NEXT_PUBLIC_SUPABASE_URL=https://zhdckqfqabahanamlxwh.supabase.co

# Supabase Anonymous Key (Required)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoZGNrcWZxYWJhaGFuYW1seHdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzE3OTEsImV4cCI6MjA3MDUwNzc5MX0.b0EznLprAYIIiQTEXwdNituy12UiVSPDKat6_aIUY4A

# Supabase Service Role Key (Required)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```
**Description**: 
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public key for client-side operations
- `SUPABASE_SERVICE_ROLE_KEY`: Private key for server-side operations (keep secret!)

### OpenAI Configuration
```env
# OpenAI API Key (Required for AI features)
OPENAI_API_KEY=your_openai_api_key_here
```
**Description**: API key for OpenAI services (GPT-4 for task expansion and assessments)
**Get it from**: [OpenAI Platform](https://platform.openai.com/api-keys)

### Email Configuration (Resend)
```env
# Resend API Key (Required for email features)
RESEND_API_KEY=your_resend_api_key_here
```
**Description**: API key for Resend email service (for sending/receiving emails within tasks)
**Get it from**: [Resend Dashboard](https://resend.com/api-keys)

### Authentication Configuration
```env
# NextAuth Secret (Required)
NEXTAUTH_SECRET=your_nextauth_secret_here

# NextAuth URL (Required)
NEXTAUTH_URL=http://localhost:3000
```
**Description**:
- `NEXTAUTH_SECRET`: Secret key for JWT encryption (generate a strong random string)
- `NEXTAUTH_URL`: Your application URL (localhost for development, production URL for deployment)

### Cron Jobs Configuration
```env
# Cron Secret (Required for cron job authentication)
CRON_SECRET=your_cron_secret_here
```
**Description**: Secret key to authenticate cron job requests from Vercel
**Generate**: Use a strong random string (32+ characters)

### Production Configuration
```env
# Vercel URL (Required for production)
VERCEL_URL=https://taskmasterpro-qesmseps-projects.vercel.app
```
**Description**: Your Vercel deployment URL (automatically set by Vercel)

## 🔧 Optional Environment Variables

### Development Configuration
```env
# Node Environment
NODE_ENV=development

# Debug Mode
DEBUG=taskmasterpro:*
```

### Email Configuration (Advanced)
```env
# Email From Address
EMAIL_FROM=noreply@yourdomain.com

# Email Reply-To Address
EMAIL_REPLY_TO=support@yourdomain.com
```

### File Upload Configuration
```env
# Maximum File Size (in bytes)
MAX_FILE_SIZE=10485760

# Allowed File Types
ALLOWED_FILE_TYPES=image/*,application/pdf,text/plain
```

### AI Configuration (Advanced)
```env
# OpenAI Model
OPENAI_MODEL=gpt-4

# OpenAI Temperature
OPENAI_TEMPERATURE=0.7

# OpenAI Max Tokens
OPENAI_MAX_TOKENS=2000
```

## 🚀 Environment Setup Instructions

### 1. Local Development
1. Create a `.env.local` file in your project root
2. Copy the required variables from above
3. Fill in your actual values
4. Restart your development server

### 2. Vercel Deployment
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each required variable
4. Set the appropriate environment (Production, Preview, Development)

### 3. Supabase Setup
1. Create a new Supabase project
2. Go to Settings → Database to get your connection string
3. Go to Settings → API to get your API keys
4. Enable Row Level Security (RLS) on all tables

### 4. OpenAI Setup
1. Create an OpenAI account
2. Go to API Keys section
3. Create a new API key
4. Copy the key to your environment variables

### 5. Resend Setup
1. Create a Resend account
2. Go to API Keys section
3. Create a new API key
4. Add your domain for sending emails

## 🔒 Security Best Practices

### Required Variables (Keep Secret)
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `RESEND_API_KEY`
- `NEXTAUTH_SECRET`
- `CRON_SECRET`

### Public Variables (Safe to Expose)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Environment-Specific Configuration

#### Development
```env
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

#### Production
```env
NEXTAUTH_URL=https://yourdomain.com
NODE_ENV=production
VERCEL_URL=https://yourdomain.com
```

## 🧪 Testing Environment Variables

### Validation Script
Create a `scripts/validate-env.js` file to validate your environment variables:

```javascript
const requiredVars = [
  'DATABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'RESEND_API_KEY',
  'NEXTAUTH_SECRET',
  'CRON_SECRET'
];

const missing = requiredVars.filter(varName => !process.env[varName]);

if (missing.length > 0) {
  console.error('Missing required environment variables:', missing);
  process.exit(1);
}

console.log('✅ All required environment variables are set');
```

### Environment Variable Checklist

- [ ] `DATABASE_URL` - Supabase database connection string
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- [ ] `OPENAI_API_KEY` - OpenAI API key for AI features
- [ ] `RESEND_API_KEY` - Resend API key for email features
- [ ] `NEXTAUTH_SECRET` - NextAuth secret for authentication
- [ ] `NEXTAUTH_URL` - Application URL
- [ ] `CRON_SECRET` - Secret for cron job authentication
- [ ] `VERCEL_URL` - Vercel deployment URL (auto-set)

## 🚨 Troubleshooting

### Common Issues

1. **"supabaseUrl is required"**
   - Check that `NEXT_PUBLIC_SUPABASE_URL` is set correctly
   - Ensure the URL format is correct

2. **"Database connection failed"**
   - Verify `DATABASE_URL` format
   - Check that your Supabase project is active
   - Ensure database schema is created

3. **"OpenAI API key invalid"**
   - Verify your OpenAI API key is correct
   - Check your OpenAI account has credits
   - Ensure the key has the correct permissions

4. **"Authentication failed"**
   - Verify `NEXTAUTH_SECRET` is set
   - Check `NEXTAUTH_URL` matches your deployment URL
   - Ensure Supabase authentication is configured

5. **"Cron jobs not working"**
   - Verify `CRON_SECRET` is set in Vercel
   - Check that cron jobs are enabled in `vercel.json`
   - Ensure the secret matches in your API routes

### Environment Variable Validation

Run this command to check if all required variables are set:

```bash
node -e "
const required = ['DATABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY', 'RESEND_API_KEY', 'NEXTAUTH_SECRET', 'CRON_SECRET'];
const missing = required.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error('❌ Missing:', missing);
  process.exit(1);
} else {
  console.log('✅ All required variables set');
}
"
```

---

For additional help, refer to the [README.md](README.md) and [DEPLOYMENT.md](DEPLOYMENT.md) files.
