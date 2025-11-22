-- ============================================
-- 🔧 SQL Scripts لإصلاح جداول Supabase
-- ============================================
-- نسخ هذا الكود وتنفيذه في Supabase SQL Editor
-- ============================================

-- 1️⃣ إصلاح جدول projects
-- ============================================

-- ✅ جعل work_order_number اختياري (nullable)
ALTER TABLE projects 
ALTER COLUMN work_order_number DROP NOT NULL;

-- ✅ جعل contract_number اختياري (nullable)
ALTER TABLE projects 
ALTER COLUMN contract_number DROP NOT NULL;

-- ✅ التحقق من وجود عمود status (إذا لم يكن موجوداً، أضفه)
-- إذا كان موجوداً، هذا الأمر سيفشل وهذا عادي، تجاهل الخطأ
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'جاري العمل';

-- ✅ التحقق من وجود عمود deviation (الانحراف)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS deviation NUMERIC;

-- ✅ التحقق من وجود عمود progress_actual (النسبة الفعلية)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS progress_actual NUMERIC DEFAULT 0;

-- ✅ التحقق من وجود عمود progress_planned (النسبة المخططة)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS progress_planned NUMERIC DEFAULT 0;


-- 2️⃣ إصلاح جدول daily_reports_new
-- ============================================

-- ✅ التحقق من وجود عمود images (للصور)
-- استخدام TEXT لتخزين JSON array من base64 images
ALTER TABLE daily_reports_new 
ADD COLUMN IF NOT EXISTS images TEXT;

-- ✅ التحقق من وجود عمود items (البنود الاختياري)
ALTER TABLE daily_reports_new 
ADD COLUMN IF NOT EXISTS items TEXT;

-- ✅ التحقق من باقي الأعمدة المطلوبة
ALTER TABLE daily_reports_new 
ADD COLUMN IF NOT EXISTS report_number TEXT;

ALTER TABLE daily_reports_new 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);

ALTER TABLE daily_reports_new 
ADD COLUMN IF NOT EXISTS report_date DATE;

ALTER TABLE daily_reports_new 
ADD COLUMN IF NOT EXISTS location TEXT;

ALTER TABLE daily_reports_new 
ADD COLUMN IF NOT EXISTS weather_condition TEXT;

ALTER TABLE daily_reports_new 
ADD COLUMN IF NOT EXISTS temperature NUMERIC;

ALTER TABLE daily_reports_new 
ADD COLUMN IF NOT EXISTS work_hours_from TEXT;

ALTER TABLE daily_reports_new 
ADD COLUMN IF NOT EXISTS work_hours_to TEXT;

ALTER TABLE daily_reports_new 
ADD COLUMN IF NOT EXISTS total_workers INTEGER DEFAULT 0;

ALTER TABLE daily_reports_new 
ADD COLUMN IF NOT EXISTS saudi_workers INTEGER DEFAULT 0;

ALTER TABLE daily_reports_new 
ADD COLUMN IF NOT EXISTS non_saudi_workers INTEGER DEFAULT 0;

ALTER TABLE daily_reports_new 
ADD COLUMN IF NOT EXISTS equipment_used TEXT;

ALTER TABLE daily_reports_new 
ADD COLUMN IF NOT EXISTS work_description TEXT;

ALTER TABLE daily_reports_new 
ADD COLUMN IF NOT EXISTS daily_progress NUMERIC;

ALTER TABLE daily_reports_new 
ADD COLUMN IF NOT EXISTS executed_quantities TEXT;

ALTER TABLE daily_reports_new 
ADD COLUMN IF NOT EXISTS materials_used TEXT;

ALTER TABLE daily_reports_new 
ADD COLUMN IF NOT EXISTS problems TEXT;

ALTER TABLE daily_reports_new 
ADD COLUMN IF NOT EXISTS accidents TEXT;

ALTER TABLE daily_reports_new 
ADD COLUMN IF NOT EXISTS official_visits TEXT;

ALTER TABLE daily_reports_new 
ADD COLUMN IF NOT EXISTS recommendations TEXT;

ALTER TABLE daily_reports_new 
ADD COLUMN IF NOT EXISTS general_notes TEXT;

ALTER TABLE daily_reports_new 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

ALTER TABLE daily_reports_new 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();


-- 3️⃣ إصلاح جدول users
-- ============================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password TEXT;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Observer';

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();


-- 4️⃣ إصلاح جدول notifications
-- ============================================

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS title TEXT;

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS message TEXT;

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info';

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();


-- 5️⃣ إصلاح جدول performance_contracts
-- ============================================

ALTER TABLE performance_contracts 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);

ALTER TABLE performance_contracts 
ADD COLUMN IF NOT EXISTS planned_value NUMERIC;

ALTER TABLE performance_contracts 
ADD COLUMN IF NOT EXISTS actual_value NUMERIC;

ALTER TABLE performance_contracts 
ADD COLUMN IF NOT EXISTS difference NUMERIC;

ALTER TABLE performance_contracts 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

ALTER TABLE performance_contracts 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();


-- ============================================
-- ✅ تم! الآن نفّذ هذا الكود في Supabase
-- ============================================

-- 📝 ملاحظات:
-- 1. إذا ظهرت أخطاء "column already exists"، تجاهلها - هذا طبيعي
-- 2. إذا ظهرت أخطاء "cannot drop not null constraint"، يعني العمود كان nullable من الأساس
-- 3. بعد التنفيذ، تحقق من أن كل شيء يعمل

-- ============================================
-- 🔍 للتحقق من الأعمدة الموجودة:
-- ============================================

-- فحص جدول projects:
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'projects';

-- فحص جدول daily_reports_new:
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'daily_reports_new';
