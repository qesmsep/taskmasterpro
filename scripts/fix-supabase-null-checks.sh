#!/bin/bash

# Fix supabase null checks in all API routes
echo "Fixing supabase null checks..."

# Function to add null check before supabase.auth.getUser calls
fix_supabase_null_check() {
    local file=$1
    echo "Fixing $file..."
    
    # Add null check before supabase.auth.getUser calls
    sed -i '' 's/const token = authHeader\.replace('\''Bearer '\'', '\'''\'')\n    const { data: { user }, error: authError } = await supabase\.auth\.getUser(token)/const token = authHeader.replace('\''Bearer '\'', '\'''\'')\n    if (!supabase) {\n      return NextResponse.json({ error: '\''Supabase client not initialized'\'' }, { status: 500 })\n    }\n    const { data: { user }, error: authError } = await supabase.auth.getUser(token)/g' "$file"
}

# Fix all API route files
fix_supabase_null_check "app/api/analytics/project/[id]/route.ts"
fix_supabase_null_check "app/api/categories/[id]/route.ts"
fix_supabase_null_check "app/api/categories/route.ts"
fix_supabase_null_check "app/api/ai/context-questions/route.ts"
fix_supabase_null_check "app/api/ai/task-review/route.ts"
fix_supabase_null_check "app/api/tasks/[id]/route.ts"
fix_supabase_null_check "app/api/tasks/route.ts"

echo "Supabase null checks fixed!"
