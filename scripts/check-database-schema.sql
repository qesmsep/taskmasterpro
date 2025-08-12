-- TaskMasterPro Database Schema Check Script
-- Run this in your Supabase SQL Editor to get schema information

-- 1. Check the tasks table structure
SELECT 
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check all enum types in the database
SELECT 
  t.typname AS enum_name, 
  array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values,
  n.nspname AS schema_name
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname, n.nspname
ORDER BY t.typname;

-- 3. Check the users table structure
SELECT 
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check foreign key constraints for tasks table
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'tasks'
AND tc.table_schema = 'public';

-- 5. Check if there are any existing tasks (to see the data format)
SELECT 
  id,
  title,
  status,
  priority,
  user_id,
  created_at
FROM tasks 
LIMIT 5;
