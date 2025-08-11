# TaskMasterPro API Keys & Secrets Guide

This guide will walk you through getting all the required API keys and secrets for TaskMasterPro.

## 🔐 **NEXTAUTH_SECRET** (Required)

### **What it is:**
A secret key used to encrypt JWT tokens for user authentication.

### **How to generate:**
**Option 1: Use our script (Recommended)**
```bash
./scripts/generate-secrets.sh
```

**Option 2: Manual generation**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 3: Online generator**
- Go to https://generate-secret.vercel.app/32
- Copy the generated string

### **Example:**
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

---

## ⏰ **CRON_SECRET** (Required)

### **What it is:**
A secret key to authenticate cron job requests from Vercel.

### **How to generate:**
**Option 1: Use our script (Recommended)**
```bash
./scripts/generate-secrets.sh
```

**Option 2: Manual generation**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 3: Online generator**
- Go to https://generate-secret.vercel.app/32
- Copy the generated string

### **Example:**
```
f1e2d3c4b5a6789012345678901234567890fedcba1234567890fedcba123456
```

---

## 📧 **RESEND_API_KEY** (Required for email features)

### **What it is:**
API key for Resend email service to send/receive emails within tasks.

### **Step-by-Step Setup:**

#### 1. **Create Resend Account**
- Go to [https://resend.com](https://resend.com)
- Click "Get Started"
- Sign up with your email or GitHub

#### 2. **Get Your API Key**
- Log into your Resend dashboard
- Go to **API Keys** in the left sidebar
- Click **"Create API Key"**
- Give it a name like "TaskMasterPro"
- Select "Full Access" (or customize permissions)
- Click **"Create API Key"**
- **Copy the generated API key immediately** (you won't see it again)

#### 3. **Add Your Domain (Optional but Recommended)**
- Go to **Domains** in the left sidebar
- Click **"Add Domain"**
- Enter your domain (e.g., `yourdomain.com`)
- Follow the DNS verification steps
- Or use the default `resend.dev` domain for testing

### **Example API Key:**
```
re_1234567890abcdef1234567890abcdef12345678
```

### **Free Tier Limits:**
- 3,000 emails per month
- 100 emails per day
- Perfect for personal use

---

## 🤖 **OPENAI_API_KEY** (Required for AI features)

### **What it is:**
API key for OpenAI services (GPT-4) used for task expansion and AI assessments.

### **Step-by-Step Setup:**

#### 1. **Create OpenAI Account**
- Go to [https://platform.openai.com](https://platform.openai.com)
- Click "Sign Up"
- Create an account with your email

#### 2. **Add Payment Method**
- Go to **Billing** in the left sidebar
- Click **"Add payment method"**
- Add a credit card (required even for free tier)

#### 3. **Get Your API Key**
- Go to **API Keys** in the left sidebar
- Click **"Create new secret key"**
- Give it a name like "TaskMasterPro"
- Click **"Create secret key"**
- **Copy the generated API key immediately**

### **Example API Key:**
```
sk-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### **Pricing:**
- Free tier: $5 credit (usually lasts for months of personal use)
- GPT-4: ~$0.03 per 1K tokens
- Very affordable for personal task management

---

## 🗄️ **SUPABASE_SERVICE_ROLE_KEY** (Required)

### **What it is:**
Private key for server-side Supabase operations (keep this secret!).

### **Step-by-Step Setup:**

#### 1. **Access Your Supabase Project**
- Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Select your project (or create one if you haven't)

#### 2. **Get Your Service Role Key**
- Go to **Settings** → **API** in the left sidebar
- Scroll down to **Project API keys**
- Copy the **"service_role"** key (not the anon key)
- This key has admin privileges, so keep it secure

### **Example Service Role Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoZGNrcWZxYWJhaGFuYW1seHdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkzMTc5MSwiZXhwIjoyMDcwNTA3NzkxfQ.example_signature
```

---

## 🚀 **Quick Setup Commands**

### **Generate Secrets Automatically:**
```bash
# Make the script executable
chmod +x scripts/generate-secrets.sh

# Run the secret generation script
./scripts/generate-secrets.sh
```

### **Create Environment File:**
```bash
# Create .env.local with all required variables
./scripts/setup-env.sh
```

### **Validate Environment Variables:**
```bash
# Check if all required variables are set
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

## 📋 **Complete Environment Variables Checklist**

Here's what your `.env.local` should look like:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres.zhdckqfqabahanamlxwh:your_password@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://zhdckqfqabahanamlxwh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoZGNrcWZxYWJhaGFuYW1seHdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzE3OTEsImV4cCI6MjA3MDUwNzc5MX0.b0EznLprAYIIiQTEXwdNituy12UiVSPDKat6_aIUY4A
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Email Configuration (Resend)
RESEND_API_KEY=your_resend_api_key_here

# Authentication Configuration
NEXTAUTH_SECRET=your_generated_secret_here
NEXTAUTH_URL=http://localhost:3000

# Cron Jobs Configuration
CRON_SECRET=your_generated_cron_secret_here

# Production Configuration (auto-set by Vercel)
VERCEL_URL=https://taskmasterpro-qesmseps-projects.vercel.app
```

---

## 🔒 **Security Best Practices**

### **Keep These Secret:**
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `RESEND_API_KEY`
- `NEXTAUTH_SECRET`
- `CRON_SECRET`

### **Safe to Expose:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### **Never Commit to Git:**
- Always add `.env.local` to your `.gitignore`
- Use environment variables in production (Vercel, etc.)

---

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"supabaseUrl is required"**
   - Check that `NEXT_PUBLIC_SUPABASE_URL` is set correctly
   - Ensure the URL format is correct

2. **"OpenAI API key invalid"**
   - Verify your OpenAI API key is correct
   - Check your OpenAI account has credits
   - Ensure the key has the correct permissions

3. **"Resend API key invalid"**
   - Verify your Resend API key is correct
   - Check your Resend account is active
   - Ensure you've added a domain (or use resend.dev)

4. **"Authentication failed"**
   - Verify `NEXTAUTH_SECRET` is set
   - Check `NEXTAUTH_URL` matches your deployment URL
   - Ensure Supabase authentication is configured

---

## 💰 **Cost Estimates**

### **Free Tier Usage:**
- **Resend**: 3,000 emails/month (free)
- **OpenAI**: $5 credit (usually lasts months for personal use)
- **Supabase**: 500MB database, 2GB bandwidth (free)
- **Vercel**: 100GB bandwidth, 100 serverless function executions (free)

### **Typical Monthly Costs (Personal Use):**
- **Resend**: $0 (free tier sufficient)
- **OpenAI**: $0-5 (depending on usage)
- **Supabase**: $0 (free tier sufficient)
- **Vercel**: $0 (free tier sufficient)

**Total: $0-5/month for personal use**

---

For additional help, refer to the [README.md](README.md) and [DEPLOYMENT.md](DEPLOYMENT.md) files.
