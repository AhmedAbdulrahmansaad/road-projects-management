-- ============================================
-- 🔧 FIX RLS POLICIES - حل مشكلة 500 Error
-- ============================================
-- نفذ هذا الكود في Supabase SQL Editor لإصلاح المشكلة!
-- ============================================

-- ============================================
-- STEP 1: حذف الـ Policies القديمة
-- ============================================

DROP POLICY IF EXISTS "Enable all for service role" ON users;
DROP POLICY IF EXISTS "Enable all for service role" ON projects;
DROP POLICY IF EXISTS "Enable all for service role" ON daily_reports;
DROP POLICY IF EXISTS "Enable all for service role" ON percentage_statements;
DROP POLICY IF EXISTS "Enable all for service role" ON performance_contracts;
DROP POLICY IF EXISTS "Enable all for service role" ON notifications;

-- ============================================
-- STEP 2: إنشاء Policies جديدة صحيحة
-- ============================================

-- Users Table Policies
CREATE POLICY "service_role_all_users" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_read_users" ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Projects Table Policies
CREATE POLICY "service_role_all_projects" ON projects
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_all_projects" ON projects
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Daily Reports Table Policies
CREATE POLICY "service_role_all_daily_reports" ON daily_reports
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_all_daily_reports" ON daily_reports
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Percentage Statements Table Policies
CREATE POLICY "service_role_all_percentage_statements" ON percentage_statements
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_all_percentage_statements" ON percentage_statements
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Performance Contracts Table Policies
CREATE POLICY "service_role_all_performance_contracts" ON performance_contracts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_all_performance_contracts" ON performance_contracts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Notifications Table Policies
CREATE POLICY "service_role_all_notifications" ON notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_all_notifications" ON notifications
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- STEP 3: تأكيد أن RLS مفعّل
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE percentage_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ✅ تم الإصلاح!
-- ============================================
-- الآن السيرفر يستطيع الوصول للجداول بدون مشاكل
-- جرب Sign Up الآن!
-- ============================================
