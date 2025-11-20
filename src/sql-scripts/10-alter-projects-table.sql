-- ============================================
-- 📊 تحديث جدول المشاريع بجميع الحقول المطلوبة
-- ============================================

-- حذف جدول projects القديم وإعادة إنشائه بجميع الحقول الموسعة
DROP TABLE IF EXISTS projects CASCADE;

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- المعلومات الأساسية
  work_order_number TEXT NOT NULL,
  contract_number TEXT NOT NULL,
  year INTEGER NOT NULL,
  project_type TEXT NOT NULL CHECK (project_type IN ('تنفيذ', 'صيانة')),
  
  -- معلومات الطريق
  road_number TEXT NOT NULL,
  road_name TEXT NOT NULL,
  work_order_description TEXT NOT NULL,
  
  -- التفاصيل التعاقدية
  project_number TEXT NOT NULL,
  project_value DECIMAL(15, 2) NOT NULL,
  duration INTEGER NOT NULL,
  site_handover_date DATE NOT NULL,
  contract_end_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('جاري العمل', 'منجز', 'متأخر', 'متقدم', 'متعثر', 'متوقف', 'تم الرفع بالاستلام الابتدائي', 'تم الاستلام النهائي')),
  
  -- الموقع
  region TEXT NOT NULL,
  branch TEXT NOT NULL,
  host_name TEXT,
  
  -- نسب الإنجاز
  progress_actual DECIMAL(5, 2) DEFAULT 0,
  progress_planned DECIMAL(5, 2) DEFAULT 0,
  deviation DECIMAL(5, 2) DEFAULT 0,
  
  -- الملاحظات
  notes TEXT,
  
  -- معلومات التتبع
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by_name TEXT,
  created_by_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء الفهارس
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_project_number ON projects(project_number);
CREATE INDEX idx_projects_year ON projects(year);
CREATE INDEX idx_projects_region ON projects(region);
CREATE INDEX idx_projects_branch ON projects(branch);

-- تحديث timestamp تلقائياً عند التحديث
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_projects_updated_at();

COMMENT ON TABLE projects IS 'جدول المشاريع الكامل مع جميع الحقول الموسعة';
