-- ============================================
-- 🇸🇦 Saudi Roads Management System - Database Setup
-- ============================================
-- Copy and paste this ENTIRE file into Supabase SQL Editor
-- Then click "RUN" to create all tables and policies
-- ============================================

-- ============================================
-- STEP 1: Drop existing tables (if any)
-- ============================================

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS performance_contracts CASCADE;
DROP TABLE IF EXISTS percentage_statements CASCADE;
DROP TABLE IF EXISTS daily_reports CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- STEP 2: Create Users Table
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN (
    'المدير العام', 'General Manager',
    'مدير عام الفرع', 'Branch General Manager',
    'المدير الإداري', 'Admin Manager',
    'المهندس المشرف', 'Supervising Engineer',
    'المهندس', 'Engineer',
    'المراقب', 'Observer'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- STEP 3: Create Projects Table
-- ============================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_number TEXT NOT NULL,
  project_name TEXT NOT NULL,
  location TEXT NOT NULL,
  contractor_name TEXT NOT NULL,
  consultant_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  contract_value DECIMAL(15, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('جاري العمل', 'منجز', 'متأخر', 'متقدم', 'متعثر', 'متوقف', 'تم الرفع بالاستلام الابتدائي', 'تم الاستلام النهائي')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_project_number ON projects(project_number);

-- ============================================
-- STEP 4: Create Daily Reports Table
-- ============================================

CREATE TABLE daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  weather TEXT NOT NULL,
  work_description TEXT NOT NULL,
  workers_count INTEGER NOT NULL CHECK (workers_count >= 0),
  equipment_used TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_reports_project_id ON daily_reports(project_id);
CREATE INDEX idx_daily_reports_created_by ON daily_reports(created_by);
CREATE INDEX idx_daily_reports_date ON daily_reports(report_date DESC);

-- ============================================
-- STEP 5: Create Percentage Statements Table
-- ============================================

CREATE TABLE percentage_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  statement_date DATE NOT NULL,
  item_description TEXT NOT NULL,
  planned_percentage DECIMAL(5, 2) NOT NULL CHECK (planned_percentage >= 0 AND planned_percentage <= 100),
  actual_percentage DECIMAL(5, 2) NOT NULL CHECK (actual_percentage >= 0 AND actual_percentage <= 100),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_percentage_statements_project_id ON percentage_statements(project_id);
CREATE INDEX idx_percentage_statements_created_by ON percentage_statements(created_by);
CREATE INDEX idx_percentage_statements_date ON percentage_statements(statement_date DESC);

-- ============================================
-- STEP 6: Create Performance Contracts Table
-- ============================================

CREATE TABLE performance_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT NOT NULL,
  project_name TEXT NOT NULL,
  contractor_name TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  month TEXT NOT NULL,
  contractor_score DECIMAL(10, 2) NOT NULL,
  yearly_weighted DECIMAL(10, 2) NOT NULL,
  difference DECIMAL(10, 2) NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_performance_contracts_created_by ON performance_contracts(created_by);
CREATE INDEX idx_performance_contracts_year ON performance_contracts(year DESC);
CREATE INDEX idx_performance_contracts_contract_number ON performance_contracts(contract_number);

-- ============================================
-- STEP 7: Create Notifications Table
-- ============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- ============================================
-- STEP 8: Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE percentage_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 9: Create RLS Policies (Allow ALL for Service Role)
-- ============================================

CREATE POLICY "Enable all for service role" ON users FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON projects FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON daily_reports FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON percentage_statements FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON performance_contracts FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON notifications FOR ALL USING (true);

-- ============================================
-- STEP 10: Create Helper Functions
-- ============================================

CREATE OR REPLACE FUNCTION get_projects_count_by_status()
RETURNS TABLE(status TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT p.status, COUNT(*)::BIGINT
  FROM projects p
  GROUP BY p.status;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_recent_activities(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  id UUID,
  activity_type TEXT,
  description TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    'project'::TEXT as activity_type,
    p.project_name as description,
    p.created_at
  FROM projects p
  UNION ALL
  SELECT 
    dr.id,
    'daily_report'::TEXT,
    'تقرير يومي: ' || pr.project_name,
    dr.created_at
  FROM daily_reports dr
  JOIN projects pr ON dr.project_id = pr.id
  ORDER BY created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ✅ DONE! Database is ready!
-- ============================================
-- Now you can test Sign Up in your application!
-- ============================================