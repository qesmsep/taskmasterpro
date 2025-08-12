-- TaskMasterPro Database Schema
-- This file contains all the necessary tables, indexes, and RLS policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE task_status AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE communication_type AS ENUM ('EMAIL', 'NOTE', 'COMMENT');
CREATE TYPE notification_type AS ENUM ('DUE_DATE', 'DEPENDENCY', 'OVERDUE', 'REMINDER');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#007AFF',
    description TEXT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'TODO',
    priority priority DEFAULT 'MEDIUM',
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_time INTEGER, -- in minutes
    actual_time INTEGER, -- in minutes
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    responsible_party VARCHAR(255),
    tags TEXT[], -- JSON array of tags
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_rule TEXT, -- RRULE format
    next_occurrence TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Task dependencies table
CREATE TABLE task_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dependent_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(dependent_id, dependency_id)
);

-- Time blocks table
CREATE TABLE time_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attachments table
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    filesize INTEGER NOT NULL,
    mimetype VARCHAR(100) NOT NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Communications table
CREATE TABLE communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type communication_type NOT NULL,
    subject VARCHAR(500),
    content TEXT NOT NULL,
    from_email VARCHAR(255),
    to_email VARCHAR(255),
    message_id VARCHAR(255), -- For email threading
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX idx_tasks_category_id ON tasks(category_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_user_due_date ON tasks(user_id, due_date);
CREATE INDEX idx_tasks_recurring ON tasks(is_recurring, next_occurrence);

CREATE INDEX idx_task_dependencies_dependent ON task_dependencies(dependent_id);
CREATE INDEX idx_task_dependencies_dependency ON task_dependencies(dependency_id);

CREATE INDEX idx_time_blocks_task_id ON time_blocks(task_id);
CREATE INDEX idx_time_blocks_start_time ON time_blocks(start_time);

CREATE INDEX idx_attachments_task_id ON attachments(task_id);
CREATE INDEX idx_attachments_user_id ON attachments(user_id);

CREATE INDEX idx_communications_task_id ON communications(task_id);
CREATE INDEX idx_communications_user_id ON communications(user_id);
CREATE INDEX idx_communications_type ON communications(type);
CREATE INDEX idx_communications_message_id ON communications(message_id);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_task_id ON notifications(task_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_categories_user_id ON categories(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_blocks_updated_at BEFORE UPDATE ON time_blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile (for signup)
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for categories
CREATE POLICY "Users can view own categories" ON categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON categories
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for tasks
CREATE POLICY "Users can view own tasks" ON tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for task_dependencies
CREATE POLICY "Users can view task dependencies" ON task_dependencies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_dependencies.dependent_id 
            AND tasks.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert task dependencies" ON task_dependencies
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_dependencies.dependent_id 
            AND tasks.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete task dependencies" ON task_dependencies
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_dependencies.dependent_id 
            AND tasks.user_id = auth.uid()
        )
    );

-- RLS Policies for time_blocks
CREATE POLICY "Users can view own time blocks" ON time_blocks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = time_blocks.task_id 
            AND tasks.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own time blocks" ON time_blocks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = time_blocks.task_id 
            AND tasks.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own time blocks" ON time_blocks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = time_blocks.task_id 
            AND tasks.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own time blocks" ON time_blocks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = time_blocks.task_id 
            AND tasks.user_id = auth.uid()
        )
    );

-- RLS Policies for attachments
CREATE POLICY "Users can view own attachments" ON attachments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attachments" ON attachments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own attachments" ON attachments
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for communications
CREATE POLICY "Users can view own communications" ON communications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own communications" ON communications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own communications" ON communications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own communications" ON communications
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle task completion and cascade updates
CREATE OR REPLACE FUNCTION handle_task_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- If task is being completed, set completed_at
    IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
        NEW.completed_at = NOW();
    END IF;
    
    -- If task is being uncompleted, clear completed_at
    IF NEW.status != 'COMPLETED' AND OLD.status = 'COMPLETED' THEN
        NEW.completed_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for task completion
CREATE TRIGGER handle_task_completion_trigger
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION handle_task_completion();

-- Create function to handle recurring task creation
CREATE OR REPLACE FUNCTION create_next_recurring_task()
RETURNS TRIGGER AS $$
DECLARE
    next_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Only process if this is a recurring task that was completed
    IF NEW.is_recurring = TRUE AND NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
        -- Calculate next occurrence based on recurrence rule
        -- This is a simplified version - you might want to implement full RRULE parsing
        IF NEW.recurrence_rule LIKE 'FREQ=DAILY%' THEN
            next_date := NEW.due_date + INTERVAL '1 day';
        ELSIF NEW.recurrence_rule LIKE 'FREQ=WEEKLY%' THEN
            next_date := NEW.due_date + INTERVAL '1 week';
        ELSIF NEW.recurrence_rule LIKE 'FREQ=MONTHLY%' THEN
            next_date := NEW.due_date + INTERVAL '1 month';
        ELSIF NEW.recurrence_rule LIKE 'FREQ=YEARLY%' THEN
            next_date := NEW.due_date + INTERVAL '1 year';
        ELSE
            RETURN NEW;
        END IF;
        
        -- Create next occurrence
        INSERT INTO tasks (
            title, description, status, priority, due_date,
            estimated_time, category_id, user_id, parent_id,
            responsible_party, tags, is_recurring, recurrence_rule,
            next_occurrence
        ) VALUES (
            NEW.title, NEW.description, 'TODO', NEW.priority, next_date,
            NEW.estimated_time, NEW.category_id, NEW.user_id, NEW.parent_id,
            NEW.responsible_party, NEW.tags, TRUE, NEW.recurrence_rule,
            next_date
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for recurring tasks
CREATE TRIGGER create_next_recurring_task_trigger
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION create_next_recurring_task();

-- Create a function to insert default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO categories (name, color, description, user_id) VALUES
        ('Personal', '#34C759', 'Personal tasks and goals', NEW.id),
        ('Work', '#007AFF', 'Work-related tasks and projects', NEW.id),
        ('Health', '#FF3B30', 'Health and fitness tasks', NEW.id),
        ('Learning', '#AF52DE', 'Learning and skill development', NEW.id),
        ('Finance', '#FF9500', 'Financial planning and budgeting', NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically create default categories for new users
CREATE TRIGGER create_default_categories_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_categories();

-- Create a function to get task statistics
CREATE OR REPLACE FUNCTION get_task_statistics(user_uuid UUID)
RETURNS TABLE (
    total_tasks BIGINT,
    completed_tasks BIGINT,
    overdue_tasks BIGINT,
    today_tasks BIGINT,
    completion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_tasks,
        COUNT(*) FILTER (WHERE status = 'COMPLETED')::BIGINT as completed_tasks,
        COUNT(*) FILTER (WHERE status IN ('TODO', 'IN_PROGRESS') AND due_date < NOW())::BIGINT as overdue_tasks,
        COUNT(*) FILTER (WHERE status IN ('TODO', 'IN_PROGRESS') AND due_date::date = NOW()::date)::BIGINT as today_tasks,
        ROUND(
            (COUNT(*) FILTER (WHERE status = 'COMPLETED')::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
            2
        ) as completion_rate
    FROM tasks 
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
