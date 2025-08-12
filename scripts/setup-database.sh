#!/bin/bash

# TaskMasterPro Database Setup Script

echo "🔧 TaskMasterPro Database Setup"
echo "================================"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    echo "Please run the environment setup first:"
    echo "   ./scripts/setup-env.sh"
    exit 1
fi

echo ""
echo "📋 Current Database Status:"
echo "=========================="

# Check if DATABASE_URL is set
if grep -q "your_password" .env.local; then
    echo "❌ DATABASE_URL still has placeholder password"
    echo ""
    echo "🔑 To get your database password:"
    echo "1. Go to https://supabase.com/dashboard/project/zhdckqfqabahanamlxwh"
    echo "2. Navigate to Settings > Database"
    echo "3. Find the 'Connection string' section"
    echo "4. Copy the password from the connection string"
    echo ""
    echo "📝 Then update .env.local with the correct password:"
    echo "   DATABASE_URL=\"postgresql://postgres.zhdckqfqabahanamlxwh:YOUR_ACTUAL_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres\""
    echo ""
    echo "After updating the password, run this script again."
    exit 1
fi

echo "✅ DATABASE_URL appears to be configured"
echo ""

# Test database connection
echo "🔍 Testing database connection..."
if npx prisma db pull --force > /dev/null 2>&1; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed!"
    echo "Please check your DATABASE_URL in .env.local"
    exit 1
fi

echo ""
echo "🚀 Pushing schema changes..."
if npx prisma db push; then
    echo "✅ Schema changes applied successfully!"
else
    echo "❌ Failed to apply schema changes"
    exit 1
fi

echo ""
echo "🔧 Generating Prisma client..."
if npx prisma generate; then
    echo "✅ Prisma client generated successfully!"
else
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo ""
echo "🎉 Database setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Start the development server: npm run dev"
echo "2. Navigate to /settings to set up categories"
echo "3. Create your first task using the new wizard"
echo ""
echo "📚 For more information, see ENHANCED_TASK_CREATION.md"
