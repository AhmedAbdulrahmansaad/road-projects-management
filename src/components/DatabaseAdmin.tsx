import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { AlertCircle, CheckCircle2, Database } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export const DatabaseAdmin: React.FC = () => {
  const { language } = useLanguage();
  const [fixing, setFixing] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleFixConstraint = async () => {
    setFixing(true);
    setResult('');

    try {
      // SQL to fix the constraint
      const sqlScript = `
-- Drop old constraint
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- Add new constraint with all allowed statuses
ALTER TABLE projects ADD CONSTRAINT projects_status_check 
CHECK (status IN (
  'جاري العمل',
  'منجز', 
  'متأخر',
  'متقدم',
  'متعثر',
  'متوقف',
  'تم الاستلام الابتدائي',
  'تم الرفع بالاستلام الابتدائي',
  'تم الرفع بالاستلام النهائي',
  'تم الاستلام النهائي',
  'In Progress',
  'Completed',
  'Delayed',
  'Advanced',
  'Stalled',
  'Stopped'
));
      `.trim();

      setResult(sqlScript);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(sqlScript);
      
      toast.success(
        language === 'ar' 
          ? '✅ تم نسخ الأمر SQL! الصقه في SQL Editor في Supabase' 
          : '✅ SQL copied! Paste it in Supabase SQL Editor'
      );

    } catch (error) {
      console.error('Error:', error);
      toast.error(
        language === 'ar' 
          ? 'خطأ في نسخ الأمر' 
          : 'Error copying command'
      );
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Card className="border-r-4 border-r-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            {language === 'ar' ? 'إدارة قاعدة البيانات' : 'Database Administration'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' 
              ? 'إصلاح constraints قاعدة البيانات' 
              : 'Fix database constraints'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Fix Status Constraint */}
          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                <AlertCircle className="h-5 w-5" />
                {language === 'ar' ? 'إصلاح Status Constraint' : 'Fix Status Constraint'}
              </CardTitle>
              <CardDescription className="text-yellow-600 dark:text-yellow-400">
                {language === 'ar' 
                  ? 'إذا ظهر خطأ "violates check constraint projects_status_check"، اتبع الخطوات التالية:' 
                  : 'If you see error "violates check constraint projects_status_check", follow these steps:'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  {language === 'ar' 
                    ? '1. اضغط على الزر أدناه لنسخ أمر SQL' 
                    : '1. Click the button below to copy SQL command'}
                </li>
                <li>
                  {language === 'ar' 
                    ? '2. افتح Supabase Dashboard' 
                    : '2. Open Supabase Dashboard'}
                </li>
                <li>
                  {language === 'ar' 
                    ? '3. اذهب إلى SQL Editor' 
                    : '3. Go to SQL Editor'}
                </li>
                <li>
                  {language === 'ar' 
                    ? '4. الصق الأمر واضغط RUN' 
                    : '4. Paste the command and press RUN'}
                </li>
              </ol>

              <Button 
                onClick={handleFixConstraint} 
                disabled={fixing}
                className="w-full"
              >
                {fixing ? (
                  language === 'ar' ? 'جاري النسخ...' : 'Copying...'
                ) : (
                  <>
                    <CheckCircle2 className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                    {language === 'ar' ? 'نسخ أمر SQL' : 'Copy SQL Command'}
                  </>
                )}
              </Button>

              {result && (
                <div className="mt-4">
                  <p className="text-sm font-semibold mb-2 text-green-700 dark:text-green-300">
                    ✅ {language === 'ar' ? 'تم النسخ! الصق هذا الأمر في SQL Editor:' : 'Copied! Paste this in SQL Editor:'}
                  </p>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
                    {result}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'ar' ? 'حالات المشاريع المسموحة' : 'Allowed Project Statuses'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  'جاري العمل',
                  'منجز',
                  'متأخر',
                  'متقدم',
                  'متعثر',
                  'متوقف',
                  'تم الاستلام الابتدائي',
                  'تم الرفع بالاستلام الابتدائي',
                  'تم الرفع بالاستلام النهائي',
                  'تم الاستلام النهائي'
                ].map((status) => (
                  <div key={status} className="bg-primary/10 px-3 py-2 rounded-lg text-sm font-semibold">
                    {status}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};
