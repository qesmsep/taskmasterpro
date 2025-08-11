#!/bin/bash

# TaskMasterPro Secret Generation Script

echo "🔐 TaskMasterPro Secret Generation"
echo "=================================="
echo ""

# Generate NEXTAUTH_SECRET
echo "📝 Generating NEXTAUTH_SECRET..."
NEXTAUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "✅ NEXTAUTH_SECRET: $NEXTAUTH_SECRET"
echo ""

# Generate CRON_SECRET
echo "📝 Generating CRON_SECRET..."
CRON_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "✅ CRON_SECRET: $CRON_SECRET"
echo ""

echo "🔑 Generated Secrets:"
echo "====================="
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
echo "CRON_SECRET=$CRON_SECRET"
echo ""

echo "📋 Next Steps:"
echo "=============="
echo "1. Copy these secrets to your .env.local file"
echo "2. Get your RESEND_API_KEY from: https://resend.com/api-keys"
echo "3. Get your OPENAI_API_KEY from: https://platform.openai.com/api-keys"
echo "4. Get your SUPABASE_SERVICE_ROLE_KEY from your Supabase dashboard"
echo ""

echo "💡 Pro Tip: Keep these secrets secure and never commit them to version control!"
echo ""

# Option to update .env.local directly
if [ -f ".env.local" ]; then
    echo "🔧 Update .env.local with these secrets? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        # Update NEXTAUTH_SECRET
        if grep -q "NEXTAUTH_SECRET=" .env.local; then
            sed -i '' "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$NEXTAUTH_SECRET/" .env.local
        else
            echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET" >> .env.local
        fi
        
        # Update CRON_SECRET
        if grep -q "CRON_SECRET=" .env.local; then
            sed -i '' "s/CRON_SECRET=.*/CRON_SECRET=$CRON_SECRET/" .env.local
        else
            echo "CRON_SECRET=$CRON_SECRET" >> .env.local
        fi
        
        echo "✅ .env.local updated with new secrets!"
    fi
else
    echo "📝 Create .env.local with these secrets? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        cat > .env.local << EOF
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
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=http://localhost:3000

# Cron Jobs Configuration
CRON_SECRET=$CRON_SECRET

# Production Configuration (auto-set by Vercel)
VERCEL_URL=https://taskmasterpro-qesmseps-projects.vercel.app
EOF
        echo "✅ .env.local created with generated secrets!"
        echo ""
        echo "🔧 Now you need to add your actual API keys:"
        echo "   - SUPABASE_SERVICE_ROLE_KEY"
        echo "   - OPENAI_API_KEY" 
        echo "   - RESEND_API_KEY"
    fi
fi

echo ""
echo "🎉 Secret generation complete!"
