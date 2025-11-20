# 🇸🇦 أكواد SQL لقاعدة بيانات نظام إدارة مشاريع الطرق

## 📋 التعليمات:

### خطوات التنفيذ في Supabase:

1. **افتح Supabase Dashboard**
   - اذهب إلى: https://supabase.com/dashboard
   - اختر مشروعك: Smart road Projects System

2. **افتح SQL Editor**
   - من القائمة الجانبية → SQL Editor
   - اضغط New Query

3. **نفذ الملفات بالترتيب:**

#### المرحلة 1: حذف الجداول القديمة
- افتح ملف: `01-drop-tables.sql`
- انسخ المحتوى بالكامل
- الصقه في SQL Editor
- اضغط RUN (أو Ctrl+Enter)
- يجب أن يظهر: Success

#### المرحلة 2: إنشاء جدول المستخدمين
- افتح ملف: `02-create-users.sql`
- انسخ المحتوى والصقه
- اضغط RUN
- يجب أن يظهر: Success

#### المرحلة 3: إنشاء جدول المشاريع
- افتح ملف: `03-create-projects.sql`
- انسخ المحتوى والصقه
- اضغط RUN
- يجب أن يظهر: Success

#### المرحلة 4: إنشاء جدول التقارير اليومية
- افتح ملف: `04-create-daily-reports.sql`
- انسخ المحتوى والصقه
- اضغط RUN
- يجب أن يظهر: Success

#### المرحلة 5: إنشاء جدول بيان النسب
- افتح ملف: `05-create-percentage-statements.sql`
- انسخ المحتوى والصقه
- اضغط RUN
- يجب أن يظهر: Success

#### المرحلة 6: إنشاء جدول عقود الأداء
- افتح ملف: `06-create-performance-contracts.sql`
- انسخ المحتوى والصقه
- اضغط RUN
- يجب أن يظهر: Success

#### المرحلة 7: إنشاء جدول الإشعارات
- افتح ملف: `07-create-notifications.sql`
- انسخ المحتوى والصقه
- اضغط RUN
- يجب أن يظهر: Success

#### المرحلة 8: تفعيل Row Level Security
- افتح ملف: `08-enable-rls.sql`
- انسخ المحتوى والصقه
- اضغط RUN
- يجب أن يظهر: Success

#### المرحلة 9: إنشاء Functions
- افتح ملف: `09-create-functions.sql`
- انسخ المحتوى والصقه
- اضغط RUN
- يجب أن يظهر: Success

---

## ✅ التحقق من نجاح العملية:

بعد تنفيذ جميع الملفات:

1. اذهب إلى **Table Editor** في Supabase
2. يجب أن تشاهد 6 جداول:
   - ✅ users
   - ✅ projects
   - ✅ daily_reports
   - ✅ percentage_statements
   - ✅ performance_contracts
   - ✅ notifications

---

## 🎯 الخطوة التالية:

بعد نجاح جميع المراحل، أخبر المطور بـ:
**"✅ الجداول جاهزة - كل المراحل نجحت"**

وبعدها سيبدأ بتعديل ملفات Backend لتستخدم SQL بدلاً من KV Store.

---

## 📊 بنية قاعدة البيانات:

### 1️⃣ users (المستخدمين)
- id: UUID (Primary Key)
- email: TEXT (Unique)
- password: TEXT (مشفرة)
- name: TEXT
- role: TEXT (الدور الوظيفي)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

### 2️⃣ projects (المشاريع)
- id: UUID (Primary Key)
- project_number: TEXT
- project_name: TEXT
- location: TEXT
- contractor_name: TEXT
- consultant_name: TEXT
- start_date: DATE
- end_date: DATE
- contract_value: DECIMAL(15, 2)
- status: TEXT
- created_by: UUID (Foreign Key → users.id)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

### 3️⃣ daily_reports (التقارير اليومية)
- id: UUID (Primary Key)
- project_id: UUID (Foreign Key → projects.id)
- report_date: DATE
- weather: TEXT
- work_description: TEXT
- workers_count: INTEGER
- equipment_used: TEXT
- notes: TEXT
- created_by: UUID (Foreign Key → users.id)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

### 4️⃣ percentage_statements (بيان النسب)
- id: UUID (Primary Key)
- project_id: UUID (Foreign Key → projects.id)
- statement_date: DATE
- item_description: TEXT
- planned_percentage: DECIMAL(5, 2)
- actual_percentage: DECIMAL(5, 2)
- notes: TEXT
- created_by: UUID (Foreign Key → users.id)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

### 5️⃣ performance_contracts (عقود الأداء)
- id: UUID (Primary Key)
- contract_number: TEXT
- project_name: TEXT
- contractor_name: TEXT
- year: INTEGER
- month: TEXT
- contractor_score: DECIMAL(10, 2)
- yearly_weighted: DECIMAL(10, 2)
- difference: DECIMAL(10, 2)
- created_by: UUID (Foreign Key → users.id)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

### 6️⃣ notifications (الإشعارات)
- id: UUID (Primary Key)
- title: TEXT
- message: TEXT
- type: TEXT (info, success, warning, error)
- user_id: UUID (Foreign Key → users.id)
- is_read: BOOLEAN
- created_at: TIMESTAMPTZ

---

## 🔒 الأمان:

- ✅ Row Level Security (RLS) مفعل على كل الجداول
- ✅ Policies تسمح بالوصول عبر Service Role فقط
- ✅ Foreign Keys لضمان سلامة البيانات
- ✅ Indexes للأداء العالي
- ✅ Constraints للتحقق من صحة البيانات

---

## 💚 نظام حقيقي وفعلي - جاهز للإنتاج 🇸🇦
