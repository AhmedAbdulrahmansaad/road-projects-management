import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from './AuthContext';
import { getServerUrl } from '../utils/supabase-client';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  FileText, Plus, Edit2, Trash2, Download, Calendar, MapPin, 
  Thermometer, Clock, Users, Wrench, TrendingUp, Package, 
  AlertTriangle, Eye, CheckCircle, XCircle, Save, X, FileDown
} from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  projectNumber: string;
  workOrderDescription: string;
}

interface DailyReport {
  id: string;
  reportNumber: string;
  reportDate: string;
  projectId?: string;
  projectName?: string;
  location?: string;
  weatherCondition?: string;
  temperature?: string;
  workHoursFrom?: string;
  workHoursTo?: string;
  saudiWorkers?: number;
  nonSaudiWorkers?: number;
  totalWorkers?: number;
  equipmentUsed?: string;
  workDescription?: string;
  dailyProgress?: number;
  executedQuantities?: string;
  materialsUsed?: string;
  problems?: string;
  accidents?: string;
  officialVisits?: string;
  recommendations?: string;
  generalNotes?: string;
  images?: string[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
}

export const DailyReportsNew: React.FC = () => {
  const { language } = useLanguage();
  const { accessToken, user } = useAuth();
  
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [viewingReport, setViewingReport] = useState<DailyReport | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    reportDate: new Date().toISOString().split('T')[0],
    projectId: '',
    location: '',
    weatherCondition: 'مشمس',
    temperature: '',
    workHoursFrom: '07:00',
    workHoursTo: '15:00',
    saudiWorkers: '',
    nonSaudiWorkers: '',
    equipmentUsed: '',
    workDescription: '',
    dailyProgress: '',
    executedQuantities: '',
    materialsUsed: '',
    problems: '',
    accidents: '',
    officialVisits: '',
    recommendations: '',
    generalNotes: '',
  });

  useEffect(() => {
    if (accessToken) {
      fetchReports();
      fetchProjects();
    }
  }, [accessToken]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(getServerUrl('/daily-reports-kv'), {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('فشل تحميل التقارير');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch(getServerUrl('/projects'), {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // حساب إجمالي العمال تلقائياً
      if (field === 'saudiWorkers' || field === 'nonSaudiWorkers') {
        const saudi = field === 'saudiWorkers' ? parseInt(value) || 0 : parseInt(prev.saudiWorkers) || 0;
        const nonSaudi = field === 'nonSaudiWorkers' ? parseInt(value) || 0 : parseInt(prev.nonSaudiWorkers) || 0;
        // سيتم حفظ المجموع في backend
      }
      
      return updated;
    });
  };

  const resetForm = () => {
    setFormData({
      reportDate: new Date().toISOString().split('T')[0],
      projectId: '',
      location: '',
      weatherCondition: 'مشمس',
      temperature: '',
      workHoursFrom: '07:00',
      workHoursTo: '15:00',
      saudiWorkers: '',
      nonSaudiWorkers: '',
      equipmentUsed: '',
      workDescription: '',
      dailyProgress: '',
      executedQuantities: '',
      materialsUsed: '',
      problems: '',
      accidents: '',
      officialVisits: '',
      recommendations: '',
      generalNotes: '',
    });
    setEditingReport(null);
  };

  const handleSubmit = async () => {
    try {
      const method = editingReport ? 'PUT' : 'POST';
      const url = editingReport 
        ? getServerUrl(`/daily-reports-kv/${editingReport.id}`)
        : getServerUrl('/daily-reports-kv');

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingReport ? 'تم تحديث التقرير بنجاح' : 'تم إنشاء التقرير بنجاح');
        setShowDialog(false);
        resetForm();
        fetchReports();
      } else {
        const error = await response.json();
        toast.error(error.error || 'فشل حفظ التقرير');
      }
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('حدث خطأ في حفظ التقرير');
    }
  };

  const handleEdit = (report: DailyReport) => {
    setEditingReport(report);
    setFormData({
      reportDate: report.reportDate,
      projectId: report.projectId || '',
      location: report.location || '',
      weatherCondition: report.weatherCondition || 'مشمس',
      temperature: report.temperature || '',
      workHoursFrom: report.workHoursFrom || '07:00',
      workHoursTo: report.workHoursTo || '15:00',
      saudiWorkers: report.saudiWorkers?.toString() || '',
      nonSaudiWorkers: report.nonSaudiWorkers?.toString() || '',
      equipmentUsed: report.equipmentUsed || '',
      workDescription: report.workDescription || '',
      dailyProgress: report.dailyProgress?.toString() || '',
      executedQuantities: report.executedQuantities || '',
      materialsUsed: report.materialsUsed || '',
      problems: report.problems || '',
      accidents: report.accidents || '',
      officialVisits: report.officialVisits || '',
      recommendations: report.recommendations || '',
      generalNotes: report.generalNotes || '',
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التقرير؟')) return;

    try {
      const response = await fetch(getServerUrl(`/daily-reports-kv/${id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (response.ok) {
        toast.success('تم حذف التقرير بنجاح');
        fetchReports();
      } else {
        toast.error('فشل حذف التقرير');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('حدث خطأ في حذف التقرير');
    }
  };

  const handleView = (report: DailyReport) => {
    setViewingReport(report);
    setShowViewDialog(true);
  };

  const exportToWord = (report: DailyReport) => {
    // سيتم التنفيذ لاحقاً
    toast.info('جاري تصدير التقرير...');
  };

  const filteredReports = reports.filter(report => 
    report.reportNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.workDescription?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEdit = user?.role === 'general_manager' || 
                 user?.role === 'General Manager' || 
                 user?.role === 'المدير العام' ||
                 user?.role === 'branch_manager';
  const canDelete = user?.role === 'general_manager' ||
                   user?.role === 'General Manager' ||
                   user?.role === 'المدير العام';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">التقارير اليومية</h1>
            <p className="text-muted-foreground">إدارة ومتابعة التقارير اليومية للمشاريع</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowDialog(true); }} className="gap-2">
          <Plus className="h-5 w-5" />
          إنشاء تقرير يومي
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <Input
          placeholder="🔍 بحث في التقارير..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Card>

      {/* Reports Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">رقم التقرير</TableHead>
              <TableHead className="text-center">التاريخ</TableHead>
              <TableHead className="text-center">المشروع</TableHead>
              <TableHead className="text-center">الموقع</TableHead>
              <TableHead className="text-center">معد التقرير</TableHead>
              <TableHead className="text-center">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  لا توجد تقارير يومية
                </TableCell>
              </TableRow>
            ) : (
              filteredReports
                .sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime())
                .map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{report.reportNumber}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {new Date(report.reportDate).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell className="text-right">
                      {report.projectName || 'غير محدد'}
                    </TableCell>
                    <TableCell className="text-right">
                      {report.location || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{report.createdByName}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(report)}
                          title="عرض"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(canEdit || report.createdBy === user?.id) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(report)}
                            title="تعديل"
                          >
                            <Edit2 className="h-4 w-4 text-blue-500" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(report.id)}
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => exportToWord(report)}
                          title="تصدير Word"
                        >
                          <FileDown className="h-4 w-4 text-green-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingReport ? 'تعديل التقرير اليومي' : 'إنشاء تقرير يومي جديد'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* القسم 1: معلومات أساسية */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold border-b-2 border-chart-1/20 pb-2">
                📋 معلومات أساسية
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportDate">تاريخ التقرير</Label>
                  <Input
                    id="reportDate"
                    type="date"
                    value={formData.reportDate}
                    onChange={(e) => handleChange('reportDate', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectId">المشروع (اختياري)</Label>
                  <Select value={formData.projectId} onValueChange={(v) => handleChange('projectId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مشروع أو اترك فارغاً" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">بدون مشروع</SelectItem>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.workOrderDescription} ({project.projectNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">💡 يمكنك ترك هذا فارغاً للتقارير العامة</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">الموقع</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="مثال: الرياض - طريق الملك فهد"
                  />
                </div>
              </div>
            </div>

            {/* القسم 2: حالة الطقس */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold border-b-2 border-chart-2/20 pb-2">
                ☀️ حالة الطقس
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weatherCondition">حالة الطقس</Label>
                  <Select value={formData.weatherCondition} onValueChange={(v) => handleChange('weatherCondition', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="مشمس">☀️ مشمس</SelectItem>
                      <SelectItem value="غائم">☁️ غائم</SelectItem>
                      <SelectItem value="ممطر">🌧️ ممطر</SelectItem>
                      <SelectItem value="عاصف">💨 عاصف</SelectItem>
                      <SelectItem value="حار جداً">🔥 حار جداً</SelectItem>
                      <SelectItem value="بارد">❄️ بارد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">درجة الحرارة (°م)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    value={formData.temperature}
                    onChange={(e) => handleChange('temperature', e.target.value)}
                    placeholder="مثال: 35"
                  />
                </div>
              </div>
            </div>

            {/* القسم 3: ساعات العمل */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold border-b-2 border-chart-3/20 pb-2">
                ⏰ ساعات العمل
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workHoursFrom">من الساعة</Label>
                  <Input
                    id="workHoursFrom"
                    type="time"
                    value={formData.workHoursFrom}
                    onChange={(e) => handleChange('workHoursFrom', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workHoursTo">إلى الساعة</Label>
                  <Input
                    id="workHoursTo"
                    type="time"
                    value={formData.workHoursTo}
                    onChange={(e) => handleChange('workHoursTo', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* القسم 4: العمالة */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold border-b-2 border-chart-4/20 pb-2">
                👷 العمالة
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="saudiWorkers">عدد العمال السعوديين</Label>
                  <Input
                    id="saudiWorkers"
                    type="number"
                    min="0"
                    value={formData.saudiWorkers}
                    onChange={(e) => handleChange('saudiWorkers', e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nonSaudiWorkers">عدد العمال غير السعوديين</Label>
                  <Input
                    id="nonSaudiWorkers"
                    type="number"
                    min="0"
                    value={formData.nonSaudiWorkers}
                    onChange={(e) => handleChange('nonSaudiWorkers', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 سيتم حساب إجمالي العمال تلقائياً: {(parseInt(formData.saudiWorkers) || 0) + (parseInt(formData.nonSaudiWorkers) || 0)}
              </p>
            </div>

            {/* القسم 5: المعدات والأعمال */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold border-b-2 border-chart-5/20 pb-2">
                🔧 المعدات والأعمال المنفذة
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="equipmentUsed">المعدات المستخدمة</Label>
                <Textarea
                  id="equipmentUsed"
                  value={formData.equipmentUsed}
                  onChange={(e) => handleChange('equipmentUsed', e.target.value)}
                  placeholder="مثال: حفار، شاحنة قلاب، رافعة، خلاط خرسانة..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workDescription">وصف الأعمال المنفذة</Label>
                <Textarea
                  id="workDescription"
                  value={formData.workDescription}
                  onChange={(e) => handleChange('workDescription', e.target.value)}
                  placeholder="وصف تفصيلي للأعمال التي تم تنفيذها اليوم..."
                  rows={4}
                />
              </div>
            </div>

            {/* القسم 6: الإنجاز والكميات */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold border-b-2 border-chart-1/20 pb-2">
                📊 الإنجاز والكميات
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="dailyProgress">نسبة الإنجاز اليومية (%)</Label>
                <Input
                  id="dailyProgress"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.dailyProgress}
                  onChange={(e) => handleChange('dailyProgress', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="executedQuantities">الكميات المنفذة</Label>
                <Textarea
                  id="executedQuantities"
                  value={formData.executedQuantities}
                  onChange={(e) => handleChange('executedQuantities', e.target.value)}
                  placeholder="مثال: 50 متر مكعب خرسانة، 200 متر طولي أنابيب..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="materialsUsed">المواد المستخدمة</Label>
                <Textarea
                  id="materialsUsed"
                  value={formData.materialsUsed}
                  onChange={(e) => handleChange('materialsUsed', e.target.value)}
                  placeholder="مثال: أسمنت، حديد تسليح، رمل، حصى..."
                  rows={3}
                />
              </div>
            </div>

            {/* القسم 7: المشاكل والحوادث */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold border-b-2 border-red-500/20 pb-2">
                ⚠️ المشاكل والحوادث
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="problems">المشاكل والمعوقات</Label>
                <Textarea
                  id="problems"
                  value={formData.problems}
                  onChange={(e) => handleChange('problems', e.target.value)}
                  placeholder="أي مشاكل أو معوقات واجهت العمل اليوم..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accidents">الحوادث (إن وجدت)</Label>
                <Textarea
                  id="accidents"
                  value={formData.accidents}
                  onChange={(e) => handleChange('accidents', e.target.value)}
                  placeholder="وصف أي حوادث حصلت (لا قدر الله)..."
                  rows={2}
                />
              </div>
            </div>

            {/* القسم 8: معلومات إضافية */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold border-b-2 border-chart-2/20 pb-2">
                📝 معلومات إضافية
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="officialVisits">الزيارات الرسمية</Label>
                <Textarea
                  id="officialVisits"
                  value={formData.officialVisits}
                  onChange={(e) => handleChange('officialVisits', e.target.value)}
                  placeholder="أي زيارات رسمية أو تفتيشية للموقع..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recommendations">التوصيات</Label>
                <Textarea
                  id="recommendations"
                  value={formData.recommendations}
                  onChange={(e) => handleChange('recommendations', e.target.value)}
                  placeholder="التوصيات والإجراءات المقترحة..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="generalNotes">ملاحظات عامة</Label>
                <Textarea
                  id="generalNotes"
                  value={formData.generalNotes}
                  onChange={(e) => handleChange('generalNotes', e.target.value)}
                  placeholder="أي ملاحظات عامة أخرى..."
                  rows={3}
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>
                <X className="h-4 w-4 ml-2" />
                إلغاء
              </Button>
              <Button onClick={handleSubmit}>
                <Save className="h-4 w-4 ml-2" />
                {editingReport ? 'حفظ التعديلات' : 'حفظ التقرير'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      {viewingReport && (
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                تقرير يومي - {viewingReport.reportNumber}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* معلومات أساسية */}
              <Card className="p-4 bg-primary/5">
                <h3 className="font-bold text-lg mb-3">📋 معلومات أساسية</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-semibold">التاريخ:</span> {new Date(viewingReport.reportDate).toLocaleDateString('ar-SA')}</div>
                  <div><span className="font-semibold">المشروع:</span> {viewingReport.projectName || 'غير محدد'}</div>
                  <div><span className="font-semibold">الموقع:</span> {viewingReport.location || '-'}</div>
                  <div><span className="font-semibold">معد التقرير:</span> {viewingReport.createdByName}</div>
                </div>
              </Card>

              {/* حالة الطقس */}
              {(viewingReport.weatherCondition || viewingReport.temperature) && (
                <Card className="p-4">
                  <h3 className="font-bold text-lg mb-3">☀️ حالة الطقس</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-semibold">الحالة:</span> {viewingReport.weatherCondition}</div>
                    <div><span className="font-semibold">درجة الحرارة:</span> {viewingReport.temperature ? `${viewingReport.temperature}°م` : '-'}</div>
                  </div>
                </Card>
              )}

              {/* ساعات العمل والعمالة */}
              <Card className="p-4">
                <h3 className="font-bold text-lg mb-3">👷 العمل والعمالة</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-semibold">ساعات العمل:</span> {viewingReport.workHoursFrom} - {viewingReport.workHoursTo}</div>
                  <div><span className="font-semibold">إجمالي العمال:</span> {viewingReport.totalWorkers || 0}</div>
                  <div><span className="font-semibold">سعوديين:</span> {viewingReport.saudiWorkers || 0}</div>
                  <div><span className="font-semibold">غير سعوديين:</span> {viewingReport.nonSaudiWorkers || 0}</div>
                </div>
              </Card>

              {/* الأعمال المنفذة */}
              {viewingReport.workDescription && (
                <Card className="p-4">
                  <h3 className="font-bold text-lg mb-3">🔧 الأعمال المنفذة</h3>
                  <p className="text-sm whitespace-pre-wrap">{viewingReport.workDescription}</p>
                </Card>
              )}

              {/* المعدات */}
              {viewingReport.equipmentUsed && (
                <Card className="p-4">
                  <h3 className="font-bold text-lg mb-3">🚜 المعدات المستخدمة</h3>
                  <p className="text-sm whitespace-pre-wrap">{viewingReport.equipmentUsed}</p>
                </Card>
              )}

              {/* الإنجاز والكميات */}
              {(viewingReport.dailyProgress || viewingReport.executedQuantities || viewingReport.materialsUsed) && (
                <Card className="p-4">
                  <h3 className="font-bold text-lg mb-3">📊 الإنجاز والكميات</h3>
                  {viewingReport.dailyProgress && (
                    <div className="mb-3">
                      <span className="font-semibold">نسبة الإنجاز اليومية:</span> {viewingReport.dailyProgress}%
                    </div>
                  )}
                  {viewingReport.executedQuantities && (
                    <div className="mb-3">
                      <span className="font-semibold">الكميات المنفذة:</span>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{viewingReport.executedQuantities}</p>
                    </div>
                  )}
                  {viewingReport.materialsUsed && (
                    <div>
                      <span className="font-semibold">المواد المستخدمة:</span>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{viewingReport.materialsUsed}</p>
                    </div>
                  )}
                </Card>
              )}

              {/* المشاكل */}
              {(viewingReport.problems || viewingReport.accidents) && (
                <Card className="p-4 bg-red-50 dark:bg-red-950/20">
                  <h3 className="font-bold text-lg mb-3 text-red-600">⚠️ المشاكل والحوادث</h3>
                  {viewingReport.problems && (
                    <div className="mb-3">
                      <span className="font-semibold">المشاكل والمعوقات:</span>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{viewingReport.problems}</p>
                    </div>
                  )}
                  {viewingReport.accidents && (
                    <div>
                      <span className="font-semibold">الحوادث:</span>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{viewingReport.accidents}</p>
                    </div>
                  )}
                </Card>
              )}

              {/* معلومات إضافية */}
              {(viewingReport.officialVisits || viewingReport.recommendations || viewingReport.generalNotes) && (
                <Card className="p-4">
                  <h3 className="font-bold text-lg mb-3">📝 معلومات إضافية</h3>
                  {viewingReport.officialVisits && (
                    <div className="mb-3">
                      <span className="font-semibold">الزيارات الرسمية:</span>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{viewingReport.officialVisits}</p>
                    </div>
                  )}
                  {viewingReport.recommendations && (
                    <div className="mb-3">
                      <span className="font-semibold">التوصيات:</span>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{viewingReport.recommendations}</p>
                    </div>
                  )}
                  {viewingReport.generalNotes && (
                    <div>
                      <span className="font-semibold">ملاحظات عامة:</span>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{viewingReport.generalNotes}</p>
                    </div>
                  )}
                </Card>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                إغلاق
              </Button>
              <Button onClick={() => exportToWord(viewingReport)}>
                <FileDown className="h-4 w-4 ml-2" />
                تصدير Word
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};