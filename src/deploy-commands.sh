#!/bin/bash

# 🚀 سكريبت النشر على GitHub
# نظام إدارة مشاريع الطرق السعودية

echo "════════════════════════════════════════════"
echo "🚀 بدء عملية النشر على GitHub"
echo "════════════════════════════════════════════"
echo ""

# 1. التحقق من Git
echo "📋 الخطوة 1: التحقق من Git..."
if ! command -v git &> /dev/null; then
    echo "❌ Git غير مثبت. يرجى تثبيت Git أولاً من: https://git-scm.com"
    exit 1
fi
echo "✅ Git مثبت"
echo ""

# 2. تهيئة Git Repository
echo "📋 الخطوة 2: تهيئة Git Repository..."
if [ ! -d .git ]; then
    git init
    echo "✅ تم تهيئة Git Repository"
else
    echo "ℹ️  Git Repository موجود مسبقاً"
fi
echo ""

# 3. إضافة جميع الملفات
echo "📋 الخطوة 3: إضافة الملفات..."
git add .
echo "✅ تم إضافة جميع الملفات"
echo ""

# 4. إنشاء Commit
echo "📋 الخطوة 4: إنشاء Commit..."
git commit -m "🎉 Initial commit: نظام إدارة مشاريع الطرق السعودية v1.0

✅ Features:
- 9 صفحات كاملة (Landing, Login, Dashboard, Projects, Reports, etc.)
- نظام مصادقة كامل مع 6 أدوار
- Supabase Backend متكامل
- تصدير Word/Excel/PDF
- مساعد ذكي AI
- ثيم سعودي (أخضر + ذهبي)
- تبديل اللغة (عربي/إنجليزي)
- وضع ليلي/نهاري
- 20+ animations
- خلفيات طرق حقيقية

✅ Fixed:
- مشكلة حذف التقارير اليومية
- تنظيف الجداول القديمة
- تحديث AI Assistant

🚀 Ready for production deployment!"

echo "✅ تم إنشاء Commit"
echo ""

# 5. تعليمات GitHub
echo "════════════════════════════════════════════"
echo "📋 الخطوة 5: إنشاء Repository على GitHub"
echo "════════════════════════════════════════════"
echo ""
echo "الآن افتح المتصفح واتبع الخطوات التالية:"
echo ""
echo "1. اذهب إلى: https://github.com/new"
echo ""
echo "2. املأ البيانات:"
echo "   Repository name: saudi-roads-management-system"
echo "   Description: نظام إدارة مشاريع الطرق السعودية - Saudi Roads Management System"
echo "   Visibility: ✅ Private (أو Public حسب رغبتك)"
echo "   ❌ لا تضف README أو .gitignore أو License"
echo ""
echo "3. اضغط: Create repository"
echo ""
echo "4. انسخ رابط الـ repository (سيظهر مثل):"
echo "   https://github.com/YOUR_USERNAME/saudi-roads-management-system.git"
echo ""
echo "════════════════════════════════════════════"
echo ""

# 6. انتظار إدخال المستخدم
echo "بعد إنشاء الـ repository، أدخل رابط الـ repository هنا:"
echo "(مثال: https://github.com/username/saudi-roads-management-system.git)"
echo ""
read -p "Repository URL: " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ لم يتم إدخال الرابط!"
    exit 1
fi

echo ""
echo "📋 الخطوة 6: ربط المشروع بـ GitHub..."
git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"
echo "✅ تم ربط المشروع بـ GitHub"
echo ""

# 7. تغيير اسم الفرع
echo "📋 الخطوة 7: تغيير اسم الفرع إلى main..."
git branch -M main
echo "✅ تم تغيير اسم الفرع إلى main"
echo ""

# 8. رفع المشروع
echo "📋 الخطوة 8: رفع المشروع إلى GitHub..."
echo "⏳ جاري الرفع... (قد يستغرق دقيقة)"
echo ""

if git push -u origin main; then
    echo ""
    echo "════════════════════════════════════════════"
    echo "✅ تم رفع المشروع على GitHub بنجاح! 🎉"
    echo "════════════════════════════════════════════"
    echo ""
    echo "📍 رابط الـ Repository:"
    echo "   $REPO_URL"
    echo ""
    echo "════════════════════════════════════════════"
    echo "📋 الخطوة التالية: النشر على Vercel"
    echo "════════════════════════════════════════════"
    echo ""
    echo "1. اذهب إلى: https://vercel.com"
    echo ""
    echo "2. سجل دخول بـ GitHub (إذا لم تكن مسجلاً)"
    echo ""
    echo "3. اضغط: Add New... → Project"
    echo ""
    echo "4. ابحث عن: saudi-roads-management-system"
    echo ""
    echo "5. اضغط: Import"
    echo ""
    echo "6. في صفحة الإعدادات:"
    echo "   Framework Preset: Vite"
    echo "   Build Command: npm run build"
    echo "   Output Directory: dist"
    echo ""
    echo "7. أضف Environment Variables:"
    echo ""
    echo "   Name: VITE_SUPABASE_URL"
    echo "   Value: https://lreziibjjeaeirgeszkx.supabase.co"
    echo ""
    echo "   Name: VITE_SUPABASE_ANON_KEY"
    echo "   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyZXppaWJqamVhZWlyZ2Vzemt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODk0NzcsImV4cCI6MjA3OTE2NTQ3N30.-wXcGMgz0uGF4Cj0AFyVQqRknEU11YIpt4bgfD7hANs"
    echo ""
    echo "8. اضغط: Deploy"
    echo ""
    echo "9. انتظر 2-3 دقائق..."
    echo ""
    echo "10. ✅ احصل على الرابط النهائي!"
    echo ""
    echo "════════════════════════════════════════════"
    echo ""
    echo "⚠️  تذكير مهم:"
    echo "لا تنسى حذف جدول daily_reports القديم من Supabase!"
    echo "https://supabase.com/dashboard/project/lreziibjjeaeirgeszkx"
    echo ""
    echo "════════════════════════════════════════════"
    echo "🎉 حظاً موفقاً! 🚀"
    echo "════════════════════════════════════════════"
else
    echo ""
    echo "❌ حدث خطأ أثناء رفع المشروع"
    echo ""
    echo "الحلول المحتملة:"
    echo "1. تأكد من أنك مسجل دخول في Git:"
    echo "   git config --global user.name \"Your Name\""
    echo "   git config --global user.email \"your.email@example.com\""
    echo ""
    echo "2. تأكد من أن الرابط صحيح"
    echo ""
    echo "3. جرّب مرة أخرى:"
    echo "   git push -u origin main"
    echo ""
fi
