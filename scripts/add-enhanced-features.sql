-- Enhanced Task Creation Features SQL Script
-- Run this script in your Supabase SQL editor

-- 1. Add new fields to existing tables
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS success_criteria TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS context TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ai_suggestions JSONB;

-- 2. Create category_schedules table
CREATE TABLE IF NOT EXISTS category_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  start_hour INTEGER NOT NULL,
  end_hour INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint
ALTER TABLE category_schedules ADD CONSTRAINT unique_category_day UNIQUE (category_id, day_of_week);

-- 3. Create task_creation_steps table
CREATE TABLE IF NOT EXISTS task_creation_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_type VARCHAR NOT NULL,
  data JSONB NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create calendar_integrations table
CREATE TABLE IF NOT EXISTS calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR NOT NULL,
  access_token VARCHAR NOT NULL,
  refresh_token VARCHAR,
  expires_at TIMESTAMP WITH TIME ZONE,
  calendar_id VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Add RLS policies for new tables
ALTER TABLE category_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_creation_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;

-- Category schedules policies
CREATE POLICY "Users can view own category schedules" ON category_schedules
  FOR SELECT USING (
    category_id IN (
      SELECT id FROM categories WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own category schedules" ON category_schedules
  FOR INSERT WITH CHECK (
    category_id IN (
      SELECT id FROM categories WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own category schedules" ON category_schedules
  FOR UPDATE USING (
    category_id IN (
      SELECT id FROM categories WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own category schedules" ON category_schedules
  FOR DELETE USING (
    category_id IN (
      SELECT id FROM categories WHERE user_id = auth.uid()
    )
  );

-- Task creation steps policies
CREATE POLICY "Users can view own task creation steps" ON task_creation_steps
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own task creation steps" ON task_creation_steps
  FOR INSERT WITH CHECK (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own task creation steps" ON task_creation_steps
  FOR UPDATE USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own task creation steps" ON task_creation_steps
  FOR DELETE USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = auth.uid()
    )
  );

-- Calendar integrations policies
CREATE POLICY "Users can view own calendar integrations" ON calendar_integrations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own calendar integrations" ON calendar_integrations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own calendar integrations" ON calendar_integrations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own calendar integrations" ON calendar_integrations
  FOR DELETE USING (user_id = auth.uid());

-- 6. Create default categories for existing users
INSERT INTO categories (id, name, color, description, user_id, is_default, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Work',
  '#007AFF',
  'Professional tasks and projects',
  u.id,
  true,
  NOW(),
  NOW()
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM categories c 
  WHERE c.user_id = u.id AND c.name = 'Work'
);

INSERT INTO categories (id, name, color, description, user_id, is_default, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Personal',
  '#34C759',
  'Personal life and hobbies',
  u.id,
  true,
  NOW(),
  NOW()
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM categories c 
  WHERE c.user_id = u.id AND c.name = 'Personal'
);

INSERT INTO categories (id, name, color, description, user_id, is_default, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Financial',
  '#FF9500',
  'Money management and planning',
  u.id,
  true,
  NOW(),
  NOW()
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM categories c 
  WHERE c.user_id = u.id AND c.name = 'Financial'
);

-- 7. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_category_schedules_category_id ON category_schedules(category_id);
CREATE INDEX IF NOT EXISTS idx_task_creation_steps_task_id ON task_creation_steps(task_id);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_user_id ON calendar_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_success_criteria ON tasks(success_criteria);
CREATE INDEX IF NOT EXISTS idx_tasks_context ON tasks(context);
CREATE INDEX IF NOT EXISTS idx_tasks_ai_suggestions ON tasks USING GIN(ai_suggestions);
