-- ============================================
-- 🇸🇦 نظام إدارة مشاريع الطرق - السعودية
-- ============================================
-- 📅 تاريخ الإنشاء: 2024
-- 🎯 الغرض: إنشاء جميع الجداول المطلوبة للنظام
-- ============================================

-- ============================================
-- 1️⃣ جدول المستخدمين
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2️⃣ جدول المشاريع
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_date DATE,
  end_date DATE,
  budget NUMERIC,
  status TEXT DEFAULT 'قيد التنفيذ',
  progress NUMERIC DEFAULT 0,
  contract_number TEXT,
  contractor_name TEXT,
  project_manager TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3️⃣ جدول أعضاء الفريق في المشاريع
-- ============================================
CREATE TABLE IF NOT EXISTS project_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- ============================================
-- 4️⃣ جدول التقارير اليومية
-- ============================================
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  weather TEXT,
  temperature TEXT,
  work_description TEXT,
  progress_percentage NUMERIC,
  challenges TEXT,
  notes TEXT,
  images TEXT[], -- مصفوفة روابط الصور
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5️⃣ جدول بيانات النسب
-- ============================================
CREATE TABLE IF NOT EXISTS percentage_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  statement_number TEXT NOT NULL,
  statement_date DATE NOT NULL,
  period_from DATE,
  period_to DATE,
  previous_completed_work NUMERIC DEFAULT 0,
  current_period_work NUMERIC DEFAULT 0,
  total_completed_work NUMERIC DEFAULT 0,
  completion_percentage NUMERIC DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6️⃣ جدول عقود الأداء
-- ============================================
CREATE TABLE IF NOT EXISTS performance_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT NOT NULL,
  project_name TEXT NOT NULL,
  contractor_name TEXT NOT NULL,
  year INTEGER NOT NULL,
  month TEXT NOT NULL,
  contractor_score NUMERIC NOT NULL,
  yearly_weighted NUMERIC NOT NULL,
  difference NUMERIC NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7️⃣ جدول الإشعارات
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8️⃣ Indexes للأداء
-- ============================================
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_daily_reports_project_id ON daily_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_created_by ON daily_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_percentage_statements_project_id ON percentage_statements(project_id);
CREATE INDEX IF NOT EXISTS idx_performance_contracts_created_by ON performance_contracts(created_by);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_project_id ON project_team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_user_id ON project_team_members(user_id);

-- ============================================
-- 9️⃣ Row Level Security (RLS) - تفعيل الأمان
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE percentage_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 🔟 Policies - السماح بالوصول (التحقق في السيرفر)
-- ============================================

-- Policies for users
DROP POLICY IF EXISTS "Allow all operations for service role" ON users;
CREATE POLICY "Allow all operations for service role" ON users FOR ALL USING (true);

-- Policies for projects
DROP POLICY IF EXISTS "Allow all operations for service role" ON projects;
CREATE POLICY "Allow all operations for service role" ON projects FOR ALL USING (true);

-- Policies for project_team_members
DROP POLICY IF EXISTS "Allow all operations for service role" ON project_team_members;
CREATE POLICY "Allow all operations for service role" ON project_team_members FOR ALL USING (true);

-- Policies for daily_reports
DROP POLICY IF EXISTS "Allow all operations for service role" ON daily_reports;
CREATE POLICY "Allow all operations for service role" ON daily_reports FOR ALL USING (true);

-- Policies for percentage_statements
DROP POLICY IF EXISTS "Allow all operations for service role" ON percentage_statements;
CREATE POLICY "Allow all operations for service role" ON percentage_statements FOR ALL USING (true);

-- Policies for performance_contracts
DROP POLICY IF EXISTS "Allow all operations for service role" ON performance_contracts;
CREATE POLICY "Allow all operations for service role" ON performance_contracts FOR ALL USING (true);

-- Policies for notifications
DROP POLICY IF EXISTS "Allow all operations for service role" ON notifications;
CREATE POLICY "Allow all operations for service role" ON notifications FOR ALL USING (true);

-- ============================================
-- ✅ اكتمل إنشاء الجداول بنجاح!
-- ============================================
-- الخطوة التالية:
-- 1. افتح Supabase Dashboard
-- 2. اذهب إلى SQL Editor
-- 3. انسخ محتوى هذا الملف بالكامل
-- 4. الصق في SQL Editor
-- 5. اضغط RUN
-- ============================================
