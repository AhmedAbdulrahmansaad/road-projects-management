import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getServerUrl } from '../utils/supabase-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from '../contexts/LanguageContext';

interface Project {
  id: string;
  workOrderDescription: string;
  workOrderNumber: string;
  contractNumber: string;
  roadName: string;
  roadNumber: string;
  region: string;
  branch: string;
  projectNumber: string;
  year: number;
  projectValue: number;
  duration: number;
  siteHandoverDate: string;
  contractEndDate: string;
  progressActual: number;
  progressPlanned: number;
  status: string;
  projectType: string;
  notes: string;
  hostName?: string;
}

interface EditProjectDialogProps {
  project: Project;
  onProjectUpdated: () => void;
}

export const EditProjectDialog: React.FC<EditProjectDialogProps> = ({ project, onProjectUpdated }) => {
  const { accessToken } = useAuth();
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    workOrderNumber: project.workOrderNumber || '',
    contractNumber: project.contractNumber || '',
    year: project.year || new Date().getFullYear(),
    projectType: project.projectType || 'تنفيذ',
    roadNumber: project.roadNumber || '',
    roadName: project.roadName || '',
    workOrderDescription: project.workOrderDescription || '',
    duration: project.duration || 0,
    siteHandoverDate: project.siteHandoverDate || '',
    contractEndDate: project.contractEndDate || '',
    progressActual: project.progressActual || 0,
    progressPlanned: project.progressPlanned || 0,
    status: project.status || 'جاري العمل',
    branch: project.branch || '',
    region: project.region || '',
    projectValue: project.projectValue || 0,
    notes: project.notes || '',
    hostName: project.hostName || '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Update formData when project changes
  useEffect(() => {
    setFormData({
      workOrderNumber: project.workOrderNumber || '',
      contractNumber: project.contractNumber || '',
      year: project.year || new Date().getFullYear(),
      projectType: project.projectType || 'تنفيذ',
      roadNumber: project.roadNumber || '',
      roadName: project.roadName || '',
      workOrderDescription: project.workOrderDescription || '',
      duration: project.duration || 0,
      siteHandoverDate: project.siteHandoverDate || '',
      contractEndDate: project.contractEndDate || '',
      progressActual: project.progressActual || 0,
      progressPlanned: project.progressPlanned || 0,
      status: project.status || 'جاري العمل',
      branch: project.branch || '',
      region: project.region || '',
      projectValue: project.projectValue || 0,
      notes: project.notes || '',
      hostName: project.hostName || '',
    });
  }, [project, open]);

  const deviation = formData.progressActual - formData.progressPlanned;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(getServerUrl(`/projects/${project.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...formData,
          deviation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // ✅ إذا كان الخطأ constraint violation، أعطي رسالة واضحة
        if (errorData.error && errorData.error.includes('projects_status_check')) {
          toast.error(
            '❌ خطأ في حالة المشروع! يرجى تحديث قاعدة البيانات. راجع ملف FIX_DATABASE_CONSTRAINT.md',
            { duration: 8000 }
          );
          console.error('🔧 Database constraint error. See FIX_DATABASE_CONSTRAINT.md or run SQL in Supabase');
        }
        
        throw new Error(errorData.error || 'فشل تحديث المشروع');
      }

      toast.success('تم تحديث المشروع بنجاح');
      setOpen(false);
      onProjectUpdated();
    } catch (error: any) {
      console.error('Error updating project:', error);
      toast.error(error.message || 'حدث خطأ أثناء تحديث المشروع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Pencil className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
          تعديل المشروع
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="text-2xl">تعديل المشروع</DialogTitle>
          <DialogDescription>
            قم بتعديل بيانات المشروع. جميع الحقول المطلوبة مميزة بـ *
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* المعلومات الأساسية */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold border-b-2 border-primary/20 pb-2">المعلومات الأساسية</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workOrderNumber">رقم أمر العمل</Label>
                <Input
                  id="workOrderNumber"
                  value={formData.workOrderNumber}
                  onChange={(e) => handleChange('workOrderNumber', e.target.value)}
                  placeholder="مثال: 2024/123"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractNumber">رقم العقد</Label>
                <Input
                  id="contractNumber"
                  value={formData.contractNumber}
                  onChange={(e) => handleChange('contractNumber', e.target.value)}
                  placeholder="مثال: 2024-CT-456"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">العام *</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleChange('year', parseInt(e.target.value))}
                  required
                  placeholder="مثال: 2024"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectType">النوع *</Label>
                <Select value={formData.projectType} onValueChange={(v) => handleChange('projectType', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="تنفيذ">تنفيذ</SelectItem>
                    <SelectItem value="صيانة">صيانة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roadNumber">رقم الطريق *</Label>
                <Input
                  id="roadNumber"
                  value={formData.roadNumber}
                  onChange={(e) => handleChange('roadNumber', e.target.value)}
                  required
                  placeholder="مثال: 123"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roadName">اسم الطريق *</Label>
                <Input
                  id="roadName"
                  value={formData.roadName}
                  onChange={(e) => handleChange('roadName', e.target.value)}
                  required
                  placeholder="مثال: طريق الملك فهد"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workOrderDescription">وصف أمر العمل *</Label>
              <Textarea
                id="workOrderDescription"
                value={formData.workOrderDescription}
                onChange={(e) => handleChange('workOrderDescription', e.target.value)}
                required
                placeholder="مثال: تنفيذ طريق الملك فهد من تقاطع..."
                rows={3}
              />
            </div>
          </div>

          {/* التفاصيل التعاقدية */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold border-b-2 border-chart-1/20 pb-2">التفاصيل التعاقدية</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectValue">قيمة التبليغ (ريال) *</Label>
                <Input
                  id="projectValue"
                  type="number"
                  value={formData.projectValue}
                  onChange={(e) => handleChange('projectValue', parseFloat(e.target.value) || 0)}
                  required
                  placeholder="مثال: 5000000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">مدة التنفيذ (شهور) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', parseInt(e.target.value) || 0)}
                  required
                  placeholder="مثال: 12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">حالة المشروع *</Label>
                <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="جاري العمل">جاري العمل</SelectItem>
                    <SelectItem value="منجز">منجز</SelectItem>
                    <SelectItem value="متأخر">متأخر</SelectItem>
                    <SelectItem value="متقدم">متقدم</SelectItem>
                    <SelectItem value="متعثر">متعثر</SelectItem>
                    <SelectItem value="متوقف">متوقف</SelectItem>
                    <SelectItem value="تم الاستلام الابتدائي">تم الاستلام الابتدائي</SelectItem>
                    <SelectItem value="تم الرفع بالاستلام الابتدائي">تم الرفع بالاستلام الابتدائي</SelectItem>
                    <SelectItem value="تم الرفع بالاستلام النهائي">تم الرفع بالاستلام النهائي</SelectItem>
                    <SelectItem value="تم الاستلام النهائي">تم الاستلام النهائي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="siteHandoverDate">تاريخ تسليم الموقع *</Label>
                <Input
                  id="siteHandoverDate"
                  type="date"
                  value={formData.siteHandoverDate}
                  onChange={(e) => handleChange('siteHandoverDate', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractEndDate">تاريخ نهاية المدة التعاقدية *</Label>
                <Input
                  id="contractEndDate"
                  type="date"
                  value={formData.contractEndDate}
                  onChange={(e) => handleChange('contractEndDate', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* الموقع */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold border-b-2 border-chart-2/20 pb-2">الموقع</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="region">المنطقة *</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => handleChange('region', e.target.value)}
                  required
                  placeholder="مثال: الرياض"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch">الفرع *</Label>
                <Input
                  id="branch"
                  value={formData.branch}
                  onChange={(e) => handleChange('branch', e.target.value)}
                  required
                  placeholder="مثال: فرع الرياض"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hostName">اسم المضيف</Label>
              <Input
                id="hostName"
                value={formData.hostName}
                onChange={(e) => handleChange('hostName', e.target.value)}
                placeholder="مثال: شركة المقاولون العرب"
              />
            </div>
          </div>

          {/* نسب الإنجاز */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold border-b-2 border-chart-3/20 pb-2">نسب الإنجاز</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="progressActual">نسبة الإنجاز الفعلي (%)</Label>
                <Input
                  id="progressActual"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.progressActual}
                  onChange={(e) => handleChange('progressActual', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="progressPlanned">النسبة المفترض إنجازها (%)</Label>
                <Input
                  id="progressPlanned"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.progressPlanned}
                  onChange={(e) => handleChange('progressPlanned', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>التقدم/التأخير (تلقائي)</Label>
                <div className={`text-2xl font-bold p-3 rounded-md ${deviation >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                  {deviation > 0 ? '+' : ''}{deviation.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          {/* الملاحظات */}
          <div className="space-y-2">
            <Label htmlFor="notes">الملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="أي ملاحظات إضافية..."
              rows={3}
            />
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};