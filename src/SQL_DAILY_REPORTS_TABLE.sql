-- ============================================
-- 🗂️ جدول التقارير اليومية - Daily Reports
-- ============================================
-- نفذ هذا الكود كاملاً في Supabase SQL Editor
-- ============================================

-- حذف الجدول القديم إذا كان موجوداً (اختياري)
-- DROP TABLE IF EXISTS daily_reports_new CASCADE;

-- إنشاء جدول التقارير اليومية
CREATE TABLE IF NOT EXISTS daily_reports_new (
  -- ============================================
  -- المعرفات الأساسية
  -- ============================================
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_number VARCHAR(100) UNIQUE NOT NULL,
  
  -- ============================================
  -- معلومات أساسية (كلها اختيارية!)
  -- ============================================
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,  -- اختياري! يمكن NULL
  location TEXT,                                                -- اختياري
  
  -- ============================================
  -- حالة الطقس (اختيارية)
  -- ============================================
  weather_condition VARCHAR(50),   -- مشمس، غائم، ممطر، إلخ
  temperature VARCHAR(20),          -- درجة الحرارة
  
  -- ============================================
  -- ساعات العمل (اختيارية)
  -- ============================================
  work_hours_from TIME,             -- من الساعة
  work_hours_to TIME,               -- إلى الساعة
  
  -- ============================================
  -- العمالة (اختيارية)
  -- ============================================
  saudi_workers INTEGER,            -- عدد العمال السعوديين
  non_saudi_workers INTEGER,        -- عدد العمال غير السعوديين
  total_workers INTEGER,            -- إجمالي العمال (محسوب تلقائياً)
  
  -- ============================================
  -- المعدات والأعمال (اختيارية)
  -- ============================================
  equipment_used TEXT,              -- المعدات المستخدمة
  work_description TEXT,            -- وصف الأعمال المنفذة
  
  -- ============================================
  -- الإنجاز والكميات (كلها اختيارية!)
  -- ============================================
  daily_progress DECIMAL(5,2),     -- نسبة الإنجاز اليومية (0.00 - 100.00)
  executed_quantities TEXT,         -- الكميات المنفذة
  materials_used TEXT,              -- المواد المستخدمة
  
  -- ============================================
  -- المشاكل والحوادث (اختيارية)
  -- ============================================
  problems TEXT,                    -- المشاكل والمعوقات
  accidents TEXT,                   -- الحوادث (إن وجدت)
  
  -- ============================================
  -- معلومات إضافية (اختيارية)
  -- ============================================
  official_visits TEXT,             -- الزيارات الرسمية
  recommendations TEXT,             -- التوصيات
  general_notes TEXT,               -- ملاحظات عامة
  
  -- ============================================
  -- المرفقات (اختيارية)
  -- ============================================
  images JSONB DEFAULT '[]'::jsonb, -- مصفوفة روابط الصور
  attachments JSONB DEFAULT '[]'::jsonb, -- مصفوفة روابط المرفقات
  
  -- ============================================
  -- Metadata (معلومات النظام)
  -- ============================================
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- معد التقرير
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  
  -- ============================================
  -- Constraints (القيود)
  -- ============================================
  CONSTRAINT valid_daily_progress CHECK (daily_progress IS NULL OR (daily_progress >= 0 AND daily_progress <= 100)),
  CONSTRAINT valid_workers CHECK (
    (saudi_workers IS NULL OR saudi_workers >= 0) AND 
    (non_saudi_workers IS NULL OR non_saudi_workers >= 0) AND
    (total_workers IS NULL OR total_workers >= 0)
  )
);

-- ============================================
-- إنشاء Indexes للأداء
-- ============================================
CREATE INDEX IF NOT EXISTS idx_daily_reports_new_date ON daily_reports_new(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_reports_new_project ON daily_reports_new(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_new_created_by ON daily_reports_new(created_by);
CREATE INDEX IF NOT EXISTS idx_daily_reports_new_report_number ON daily_reports_new(report_number);

-- ============================================
-- Function لحساب إجمالي العمال تلقائياً
-- ============================================
CREATE OR REPLACE FUNCTION calculate_total_workers()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_workers := COALESCE(NEW.saudi_workers, 0) + COALESCE(NEW.non_saudi_workers, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Trigger لحساب إجمالي العمال عند الإدخال/التحديث
-- ============================================
DROP TRIGGER IF EXISTS trg_calculate_total_workers ON daily_reports_new;
CREATE TRIGGER trg_calculate_total_workers
  BEFORE INSERT OR UPDATE ON daily_reports_new
  FOR EACH ROW
  EXECUTE FUNCTION calculate_total_workers();

-- ============================================
-- Function لتحديث updated_at تلقائياً
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Trigger لتحديث updated_at
-- ============================================
DROP TRIGGER IF EXISTS trg_update_daily_reports_new_updated_at ON daily_reports_new;
CREATE TRIGGER trg_update_daily_reports_new_updated_at
  BEFORE UPDATE ON daily_reports_new
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE daily_reports_new ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- ============================================

-- Policy 1: الجميع يمكنهم القراءة (SELECT)
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON daily_reports_new;
CREATE POLICY "Enable read access for all authenticated users"
  ON daily_reports_new
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy 2: الجميع يمكنهم الإضافة (INSERT)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON daily_reports_new;
CREATE POLICY "Enable insert for authenticated users"
  ON daily_reports_new
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Policy 3: التعديل (UPDATE)
-- المستخدم يمكنه تعديل تقاريره فقط
-- المدير العام يمكنه تعديل كل التقارير
DROP POLICY IF EXISTS "Enable update for owners and general manager" ON daily_reports_new;
CREATE POLICY "Enable update for owners and general manager"
  ON daily_reports_new
  FOR UPDATE
  USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'general_manager'
    )
  );

-- Policy 4: الحذف (DELETE)
-- المدير العام فقط يمكنه الحذف
DROP POLICY IF EXISTS "Enable delete for general manager only" ON daily_reports_new;
CREATE POLICY "Enable delete for general manager only"
  ON daily_reports_new
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'general_manager'
    )
  );

-- ============================================
-- إضافة تعليقات توضيحية
-- ============================================
COMMENT ON TABLE daily_reports_new IS 'جدول التقارير اليومية - جميع الحقول اختيارية ما عدا التاريخ ومعد التقرير';
COMMENT ON COLUMN daily_reports_new.report_number IS 'رقم التقرير الفريد - يتم توليده تلقائياً';
COMMENT ON COLUMN daily_reports_new.project_id IS 'معرف المشروع - اختياري (يمكن NULL للتقارير العامة)';
COMMENT ON COLUMN daily_reports_new.daily_progress IS 'نسبة الإنجاز اليومية - اختيارية (0.00 - 100.00)';
COMMENT ON COLUMN daily_reports_new.total_workers IS 'إجمالي العمال - يحسب تلقائياً عبر Trigger';
COMMENT ON COLUMN daily_reports_new.created_by IS 'معد التقرير - مطلوب';

-- ============================================
-- Grant Permissions
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON daily_reports_new TO authenticated;

-- ============================================
-- ✅ تم! الجدول جاهز
-- ============================================
-- الآن يمكنك البدء في استخدام النظام
-- جميع الحقول اختيارية ما عدا:
--   1. report_date (التاريخ)
--   2. created_by (معد التقرير - يُملأ تلقائياً)
-- 
-- المدير العام له صلاحيات كاملة (تعديل وحذف كل التقارير)
-- المستخدمون الآخرون يمكنهم تعديل تقاريرهم فقط
-- ============================================