#!/bin/bash

# TaskMasterPro Environment Setup Script

echo "🚀 TaskMasterPro Environment Setup"
echo "=================================="

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists. Do you want to overwrite it? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

echo ""
echo "📝 Creating .env.local file..."
echo ""

# Create .env.local file
cat > .env.local << 'EOF'
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
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Cron Jobs Configuration
CRON_SECRET=your_cron_secret_here

# Production Configuration (auto-set by Vercel)
VERCEL_URL=https://taskmasterpro-qesmseps-projects.vercel.app
EOF

echo "✅ .env.local file created!"
echo ""
echo "🔧 Next steps:"
echo "1. Edit .env.local and replace the placeholder values with your actual credentials"
echo "2. Get your Supabase keys from: https://supabase.com/dashboard/project/[YOUR_PROJECT]/settings/api"
echo "3. Get your OpenAI API key from: https://platform.openai.com/api-keys"
echo "4. Get your Resend API key from: https://resend.com/api-keys"
echo "5. Generate a strong random string for NEXTAUTH_SECRET and CRON_SECRET"
echo ""
echo "📚 For detailed instructions, see ENVIRONMENT_VARIABLES.md"
echo ""
echo "🔍 To validate your environment variables, run:"
echo "   node -e \"const required = ['DATABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY', 'RESEND_API_KEY', 'NEXTAUTH_SECRET', 'CRON_SECRET']; const missing = required.filter(v => !process.env[v]); if (missing.length > 0) { console.error('❌ Missing:', missing); process.exit(1); } else { console.log('✅ All required variables set'); }\""
