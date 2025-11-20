# ⚡ الحل السريع - نسخ ولصق فقط!

## 🎯 افعل هذا الآن:

### **1️⃣ افتح Supabase:**
```
https://supabase.com/dashboard/project/lreziibjjeaeirgeszkx/editor
```

### **2️⃣ اذهب لـ SQL Editor:**
القائمة الجانبية → **SQL Editor** → **New query**

### **3️⃣ انسخ والصق هذا الكود:**

```sql
-- حذف Policies القديمة
DROP POLICY IF EXISTS "Enable all for service role" ON users;
DROP POLICY IF EXISTS "Enable all for service role" ON projects;
DROP POLICY IF EXISTS "Enable all for service role" ON daily_reports;
DROP POLICY IF EXISTS "Enable all for service role" ON percentage_statements;
DROP POLICY IF EXISTS "Enable all for service role" ON performance_contracts;
DROP POLICY IF EXISTS "Enable all for service role" ON notifications;

-- Policies جديدة صحيحة
CREATE POLICY "service_role_all_users" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_read_users" ON users FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_role_all_projects" ON projects FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all_projects" ON projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_daily_reports" ON daily_reports FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all_daily_reports" ON daily_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_percentage_statements" ON percentage_statements FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all_percentage_statements" ON percentage_statements FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_performance_contracts" ON performance_contracts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all_performance_contracts" ON performance_contracts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_notifications" ON notifications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all_notifications" ON notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### **4️⃣ اضغط Run:**
زر **"Run"** أسفل اليمين ▶️

### **5️⃣ انتظر:**
يجب أن تشوف: **"Success"** ✅

---

## 🧪 الآن اختبر:

1. ارجع للتطبيق
2. **Refresh** (Ctrl + Shift + R)
3. افتح **Console** (F12)
4. سجل حساب جديد:
   ```
   الاسم: علي السعودي
   الإيميل: ali@test.com
   الرمز: 123456
   الدور: المهندس
   ```
5. اضغط **"إنشاء حساب"**

---

## ✅ يجب أن تشوف في Console:

```
🟢 [SIGNUP] Starting signup process...
🟢 [SIGNUP] Hashing password...
🟢 [SIGNUP] Inserting user into database...
✅ [SIGNUP] User created in database
✅ [SIGNUP] Signup complete

🔵 Signup response status: 200  ← نجح!
✅ Auto sign-in successful!
```

---

## 🎉 بعدها:

- ✅ يسجل دخول تلقائياً
- ✅ ينتقل لـ Dashboard
- ✅ اسمك يظهر في الأعلى

---

## ❌ إذا ما اشتغل:

**صور لي Console كامل وأنا أحل المشكلة!** 📸

---

**الآن جرب!** 🚀💪
