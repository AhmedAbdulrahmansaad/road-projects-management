import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { getServerUrl } from '../utils/supabase-client';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';
import { Save, Upload, X, FileImage, Plus, Trash2 } from 'lucide-react';
import { Badge } from './ui/badge';

interface ProjectItem {
  itemType: string;
  itemNumber: string;
  itemName: string;
}

interface CreateProjectProps {
  onSuccess?: () => void;
}

export const CreateProject: React.FC<CreateProjectProps> = ({ onSuccess }) => {
  const { accessToken } = useAuth();
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    workOrderNumber: '', // رقم أمر العمل / التبليغ
    contractNumber: '', // رقم العقد
    year: new Date().getFullYear(), // العام
    projectType: 'تنفيذ', // النوع (تنفيذ/صيانة)
    roadNumber: '', // رقم الطريق
    roadName: '', // اسم الطريق
    workOrderDescription: '', // وصف أمر العمل
    projectNumber: '', // رقم المشروع
    duration: '', // مدة التنفيذ (شهور)
    siteHandoverDate: '', // تاريخ تسليم الموقع
    contractEndDate: '', // تاريخ نهاية المدة التعاقدية
    progressActual: '', // نسبة الإنجاز الفعلي
    progressPlanned: '', // النسبة المفترض إنجازها
    status: 'جاري العمل', // حالة المشروع
    branch: '', // الفرع
    region: '', // المنطقة
    projectValue: '', // قيمة التبليغ
    notes: '', // الملاحظات
    hostName: '', // اسم المضيف
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [items, setItems] = useState<ProjectItem[]>([]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // حساب التقدم/التأخير تلقائياً
  const deviation = (parseFloat(formData.progressActual) || 0) - (parseFloat(formData.progressPlanned) || 0);

  const addItem = () => {
    setItems(prev => [...prev, { itemType: '', itemNumber: '', itemName: '' }]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ProjectItem, value: string) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (uploadedFiles.length + files.length > 10) {
      toast.error(language === 'ar' ? 'الحد الأقصى 10 ملفات' : 'Maximum 10 files');
      return;
    }
    
    setUploadedFiles(prev => [...prev, ...files]);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const projectResponse = await fetch(getServerUrl('/projects'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...formData,
          projectValue: parseFloat(formData.projectValue) || 0,
          duration: parseInt(formData.duration) || 0,
          deviation: deviation, // التقدم/التأخير المحسوب
          items: items,
        }),
      });

      if (!projectResponse.ok) {
        throw new Error(t('create.error'));
      }

      toast.success(t('create.success'));
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || t('create.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-create-project relative overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="relative z-10 p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{t('create.title')}</CardTitle>
            <CardDescription className="text-base">{language === 'ar' ? 'أدخل تفاصيل المشروع بالكامل حسب البيان الرسمي' : 'Enter complete project details according to official statement'}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* المعلومات الأساسية */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold border-b-2 border-primary/20 pb-2">{t('create.basicInfo')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="workOrderNumber">{t('create.workOrderNumber')} *</Label>
                    <Input
                      id="workOrderNumber"
                      value={formData.workOrderNumber}
                      onChange={(e) => handleChange('workOrderNumber', e.target.value)}
                      required
                      placeholder={language === 'ar' ? 'مثال: 2024/123' : 'Example: 2024/123'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contractNumber">رقم العقد *</Label>
                    <Input
                      id="contractNumber"
                      value={formData.contractNumber}
                      onChange={(e) => handleChange('contractNumber', e.target.value)}
                      required
                      placeholder={language === 'ar' ? 'مثال: 2024-CT-456' : 'Example: 2024-CT-456'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="projectNumber">رقم المشروع *</Label>
                    <Input
                      id="projectNumber"
                      value={formData.projectNumber}
                      onChange={(e) => handleChange('projectNumber', e.target.value)}
                      required
                      placeholder={language === 'ar' ? 'مثال: PRJ-2024-001' : 'Example: PRJ-2024-001'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">{t('create.year')} *</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) => handleChange('year', parseInt(e.target.value))}
                      required
                      min="2000"
                      max="2100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="projectType">{t('create.projectType')} *</Label>
                    <Input
                      id="projectType"
                      value={formData.projectType}
                      onChange={(e) => handleChange('projectType', e.target.value)}
                      required
                      placeholder={language === 'ar' ? 'تنفيذ أو صيانة' : 'Implementation or Maintenance'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="roadNumber">{t('create.roadNumber')} *</Label>
                    <Input
                      id="roadNumber"
                      value={formData.roadNumber}
                      onChange={(e) => handleChange('roadNumber', e.target.value)}
                      required
                      placeholder={language === 'ar' ? 'مثال: 15' : 'Example: 15'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="roadName">{t('create.roadName')} *</Label>
                    <Input
                      id="roadName"
                      value={formData.roadName}
                      onChange={(e) => handleChange('roadName', e.target.value)}
                      required
                      placeholder={language === 'ar' ? 'مثال: طريق خميس مشيط' : 'Example: Khamis Mushait Road'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workOrderDescription">{t('create.workOrderDescription')} *</Label>
                  <Textarea
                    id="workOrderDescription"
                    value={formData.workOrderDescription}
                    onChange={(e) => handleChange('workOrderDescription', e.target.value)}
                    required
                    rows={4}
                    placeholder={language === 'ar' ? 'وصف تفصيلي لأمر العمل...' : 'Detailed work order description...'}
                  />
                </div>
              </div>

              {/* المعلومات المالية والزمنية */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold border-b-2 border-secondary/20 pb-2">{t('create.financialInfo')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectValue">{t('create.projectValue')} *</Label>
                    <Input
                      id="projectValue"
                      type="number"
                      step="0.01"
                      value={formData.projectValue}
                      onChange={(e) => handleChange('projectValue', e.target.value)}
                      required
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">{t('create.duration')} *</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => handleChange('duration', e.target.value)}
                      required
                      min="1"
                      placeholder={language === 'ar' ? 'مثال: 12' : 'Example: 12'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">{t('create.status')} *</Label>
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
                        <SelectItem value="تم الرفع بالاستلام الابتدائي">تم الرفع بالاستلام الابتدائي</SelectItem>
                        <SelectItem value="تم الاستلام النهائي">تم الاستلام النهائي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteHandoverDate">{t('create.siteHandoverDate')} *</Label>
                    <Input
                      id="siteHandoverDate"
                      type="date"
                      value={formData.siteHandoverDate}
                      onChange={(e) => handleChange('siteHandoverDate', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contractEndDate">{t('create.contractEndDate')} *</Label>
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

              {/* نسب الإنجاز */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold border-b-2 border-chart-3/20 pb-2">{t('create.progress')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="progressActual">{t('create.progressActual')}</Label>
                    <Input
                      id="progressActual"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.progressActual}
                      onChange={(e) => handleChange('progressActual', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="progressPlanned">{t('create.progressPlanned')}</Label>
                    <Input
                      id="progressPlanned"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.progressPlanned}
                      onChange={(e) => handleChange('progressPlanned', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('create.deviation')}</Label>
                    <div className={`h-10 px-3 flex items-center rounded-md border font-bold text-lg ${
                      deviation > 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400' :
                      deviation < 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400' :
                      'bg-gray-50 dark:bg-gray-800 border-gray-300 text-gray-700 dark:text-gray-300'
                    }`}>
                      {deviation > 0 ? '+' : ''}{deviation.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* الموقع والملاحظات */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold border-b-2 border-chart-4/20 pb-2">{language === 'ar' ? 'الموقع والملاحظات' : 'Location & Notes'}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="branch">{t('create.branch')} *</Label>
                    <Input
                      id="branch"
                      value={formData.branch}
                      onChange={(e) => handleChange('branch', e.target.value)}
                      required
                      placeholder={language === 'ar' ? 'مثال: فرع نجران' : 'Example: Najran Branch'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region">{t('create.region')} *</Label>
                    <Input
                      id="region"
                      value={formData.region}
                      onChange={(e) => handleChange('region', e.target.value)}
                      required
                      placeholder={language === 'ar' ? 'مثال: نجران' : 'Example: Najran'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hostName">{language === 'ar' ? 'اسم المضيف' : 'Host Name'}</Label>
                  <Input
                    id="hostName"
                    value={formData.hostName}
                    onChange={(e) => handleChange('hostName', e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: شركة المقاولون العرب' : 'Example: Arab Contractors Company'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">{t('create.notes')}</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={3}
                    placeholder={language === 'ar' ? 'مثال: فترة الحج، تأخر بسيط، إلخ...' : 'Example: Hajj period, slight delay, etc...'}
                  />
                </div>
              </div>

              {/* رفع الملفات */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-primary/20 pb-3">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Upload className="h-6 w-6 text-primary" />
                    {t('create.images')}
                  </h3>
                  <Badge variant="secondary" className="text-base">
                    {uploadedFiles.length} {language === 'ar' ? 'ملف' : 'files'}
                  </Badge>
                </div>

                <div className="p-6 border-2 border-dashed border-primary/30 rounded-xl bg-primary/5 hover:bg-primary/10 transition-all">
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="fileUpload"
                  />
                  <label
                    htmlFor="fileUpload"
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    <div className="p-4 rounded-full bg-primary/10">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary">
                        {t('create.uploadImages')}
                      </p>
                      <p className="text-sm text-muted-foreground font-medium">
                        {language === 'ar' 
                          ? 'الصور، PDF، Word، Excel (حد أقصى 10 ملفات)' 
                          : 'Images, PDF, Word, Excel (Max 10 files)'}
                      </p>
                    </div>
                  </label>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-lg">
                      {language === 'ar' ? 'المعاينة' : 'Preview'} ({uploadedImages.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {uploadedImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-all">
                            <img
                              src={image}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploadedFiles.length > 0 && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <FileImage className="h-5 w-5" />
                      <p className="font-bold text-base">
                        {language === 'ar' 
                          ? `تم رفع ${uploadedFiles.length} ملف بنجاح` 
                          : `${uploadedFiles.length} files uploaded successfully`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* إضافة عناصر المشروع */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-chart-2/20 pb-3">
                  <h3 className="text-xl font-bold">{t('create.items')}</h3>
                  <Button type="button" onClick={addItem} size="sm" variant="default" className="h-10">
                    <Plus className={`h-5 w-5 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                    {t('create.addItem')}
                  </Button>
                </div>

                {items.length === 0 && (
                  <div className="p-8 text-center border-2 border-dashed border-muted rounded-xl bg-muted/20">
                    <p className="text-muted-foreground font-medium text-base">
                      {language === 'ar' ? 'لا توجد بنود بعد. اضغط "إضافة بند" لبدء' : 'No items yet. Click "Add Item" to start'}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm">{t('create.itemType')}</Label>
                          <Input
                            value={item.itemType}
                            onChange={(e) => updateItem(index, 'itemType', e.target.value)}
                            placeholder={t('create.itemTypePlaceholder')}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm">{t('create.itemNumber')}</Label>
                          <Input
                            value={item.itemNumber}
                            onChange={(e) => updateItem(index, 'itemNumber', e.target.value)}
                            placeholder={t('create.itemNumberPlaceholder')}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm">{t('create.itemName')}</Label>
                          <Input
                            value={item.itemName}
                            onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                            placeholder={t('create.itemNamePlaceholder')}
                          />
                        </div>

                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeItem(index)}
                            className="h-10 w-10"
                            title={t('create.removeItem')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button type="submit" disabled={loading} className="flex-1 h-12 text-lg">
                  <Save className={`h-5 w-5 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {loading ? t('create.creating') : t('create.submit')}
                </Button>
                {onSuccess && (
                  <Button type="button" variant="outline" onClick={() => onSuccess()} className="h-12 text-lg">
                    {t('create.cancel')}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};