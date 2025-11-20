# 🔍 Debug - فحص الأدوار

## 🧪 اختبار سريع في Console:

### **افتح Console (F12) واكتب:**

```javascript
// 1. اختبر الأدوار المتاحة في الصفحة
document.querySelectorAll('[role="option"]').forEach(el => {
  console.log('Option:', el.getAttribute('data-value'), el.textContent);
});
```

**يجب أن تشوف:**
```
Option: General Manager المدير العام
Option: Branch General Manager مدير عام الفرع
Option: Admin Manager المدير الإداري
Option: Supervising Engineer المهندس المشرف  ← هذا هو الصحيح!
Option: Engineer المهندس
Option: Observer المراقب
```

---

## ❌ إذا شفت "Supervisor Engineer":

**يعني التطبيق لم يُحدّث!**

**الحل:**
1. **Hard Refresh:** `Ctrl + Shift + R`
2. **امسح Cache:** `F12 → Application → Clear Storage → Clear Site Data`
3. **Refresh مرة أخرى**

---

## ✅ إذا كان الكود صحيح لكن الخطأ لا يزال:

**احتمال: الـ Edge Function لم تُحدّث في Supabase**

**الحل:**
انتظر دقيقتين، ثم جرب مرة أخرى

---

## 🎯 طريقة أخرى - استخدم Console مباشرة:

### **اكتب في Console:**

```javascript
// إرسال Sign Up مباشرة من Console
const projectId = 'YOUR_PROJECT_ID';
const publicAnonKey = 'YOUR_ANON_KEY';

fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a52c947c/signup`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`
  },
  body: JSON.stringify({
    email: 'test123@test.com',
    password: '123456',
    fullName: 'Test User',
    role: 'Supervising Engineer'  // ← تأكد أنه صحيح هنا!
  })
}).then(r => r.json()).then(console.log);
```

**إذا نجح من Console:** يعني المشكلة في Frontend Cache فقط!

---

**الآن: جرب Hard Refresh وخبرني!** 🚀
