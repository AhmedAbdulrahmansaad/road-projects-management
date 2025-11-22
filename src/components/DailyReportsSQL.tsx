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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
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
  items?: string; // البنود - اختياري
  images?: string[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
}

export const DailyReportsSQL: React.FC = () => {
  const { language } = useLanguage();
  const { accessToken, user, role: userRole } = useAuth(); // استخدام role من AuthContext مباشرة
  
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [viewingReport, setViewingReport] = useState<DailyReport | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState<string | null>(null);
  
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
    items: '', // البنود - اختياري
  });

  // State للصور المرفوعة
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  
  // State للبنود - نفس CreateProject
  const [reportItems, setReportItems] = useState<{ itemType: string; itemNumber: string; itemName: string; }[]>([]);

  useEffect(() => {
    if (accessToken) {
      fetchReports();
      fetchProjects();
    }
  }, [accessToken]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(getServerUrl('/daily-reports-sql'), {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      } else {
        toast.error('فشل تحميل التقارير');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('حدث خطأ في تحميل التقارير');
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
    setFormData(prev => ({ ...prev, [field]: value }));
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
      items: '', // البنود - اختياري
    });
    setEditingReport(null);
    setUploadedImages([]);
    setReportItems([]);
  };

  // وظائف إدارة البنود - نفس CreateProject
  const addReportItem = () => {
    setReportItems(prev => [...prev, { itemType: '', itemNumber: '', itemName: '' }]);
  };

  const removeReportItem = (index: number) => {
    setReportItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateReportItem = (index: number, field: 'itemType' | 'itemNumber' | 'itemName', value: string) => {
    setReportItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async () => {
    try {
      const method = editingReport ? 'PUT' : 'POST';
      const url = editingReport 
        ? getServerUrl(`/daily-reports-sql/${editingReport.id}`)
        : getServerUrl('/daily-reports-sql');

      // ✅ تحويل البنود من array إلى JSON string
      const itemsJson = reportItems.length > 0 ? JSON.stringify(reportItems) : '';

      // ✅ إضافة الصور والبنود إلى البيانات المُرسلة
      const dataToSend = {
        ...formData,
        images: uploadedImages, // ✅ إرسال الصور كـ array
        items: itemsJson, // ✅ إرسال البنود كـ JSON string
      };
      
      console.log('📤 Sending report data:', {
        imagesCount: uploadedImages.length,
        itemsCount: reportItems.length,
        items: itemsJson,
        dataToSend,
      });

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend), // ✅ استخدام dataToSend بدلاً من formData
      });

      if (response.ok) {
        toast.success(editingReport ? 'تم تحديث التقرير بنجاح ✅' : 'تم إنشاء التقرير بنجاح ✅');
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
      items: report.items || '', // البنود - اختياري
    });
    // ✅ تحميل الصور - images هو array بالفعل
    setUploadedImages(report.images || []);
    // ✅ تحميل البنود - تحويل من JSON string إلى array
    try {
      const loadedItems = report.items ? JSON.parse(report.items) : [];
      setReportItems(Array.isArray(loadedItems) ? loadedItems : []);
    } catch (e) {
      console.error('Error parsing items:', e);
      setReportItems([]);
    }
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التقرير؟ ⚠️')) return;

    try {
      const response = await fetch(getServerUrl(`/daily-reports-sql/${id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (response.ok) {
        toast.success('تم حذف التقرير بنجاح ✅');
        fetchReports();
      } else {
        const error = await response.json();
        toast.error(error.error || 'فشل حذف التقرير');
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

  const exportReport = async (reportId: string, format: 'word' | 'excel' | 'pdf') => {
    try {
      console.log(`🔍 بدء تصدير التقرير: ${reportId} بصيغة: ${format}`);
      setExporting(reportId);
      
      const url = getServerUrl(`/daily-reports-sql/${reportId}/export/${format}`);
      console.log(`📡 URL: ${url}`);
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      console.log(`📥 Response Status: ${response.status}`, response.ok);

      if (response.ok) {
        const report = reports.find(r => r.id === reportId);
        const filename = `تقرير_يومي_${report?.reportNumber || reportId}`;
        
        console.log(`✅ تم الحصول على الاستجابة - الاسم: ${filename}`);
        
        if (format === 'pdf') {
          // For PDF, open HTML in new window with direct write
          const htmlText = await response.text();
          console.log('🖼️ فتح PDF في نافذة جديدة للطباعة');
          const newWindow = window.open('', '_blank');
          if (newWindow) {
            newWindow.document.open();
            newWindow.document.write(htmlText);
            newWindow.document.close();
            newWindow.focus();
            toast.success('تم فتح التقرير في نافذة جديدة - سيظهر مربع الطباعة تلقائياً. اختر "حفظ كـ PDF" لتنزيله ✅', {
              duration: 6000,
            });
          } else {
            toast.error('يرجى السماح بفتح النوافذ المنبثقة في إعدادات المتصفح');
          }
          // Clean up after a delay
          setTimeout(() => window.URL.revokeObjectURL(url), 30000);
        } else {
          // For Word and Excel, download directly
          const blob = await response.blob();
          console.log(`📦 حجم الملف: ${blob.size} bytes`);
          
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          
          if (format === 'word') {
            a.download = `${filename}.doc`;
            console.log('📄 تنزيل ملف Word');
          } else if (format === 'excel') {
            a.download = `${filename}.xls`;
            console.log('📊 تنزيل ملف Excel');
          }
          
          console.log(`⬇️ بدء التنزيل: ${a.download}`);
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          if (format === 'word') {
            toast.success('تم تنزيل ملف Word - يمكنك فتحه باستخدام Microsoft Word أو متصفح الويب ✅');
          } else {
            toast.success('تم تنزيل ملف Excel - يمكنك فتحه باستخدام Microsoft Excel ✅');
          }
        }
      } else {
        const errorText = await response.text();
        console.error('❌ خطأ في الاستجابة:', errorText);
        toast.error('فشل تصدير التقرير');
      }
    } catch (error) {
      console.error('❌ Error exporting report:', error);
      toast.error('حدث خطأ في تصدير التقرير');
    } finally {
      setExporting(null);
      console.log(' انتهى التصدير');
    }
  };

  const filteredReports = reports.filter(report => 
    report.reportNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.workDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.createdByName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEdit = (report: DailyReport) => {
    const currentRole = userRole || user?.role; // استخدام role من context أو user
    console.log('🔍 [canEdit] Current role:', currentRole);
    const isGeneralManager = currentRole === 'General Manager' || 
                            currentRole === 'المدير العام' || 
                            currentRole === 'general_manager';
    return isGeneralManager || report.createdBy === user?.id;
  };

  const currentRole = userRole || user?.role; // استخدام role من context أو user
  console.log('🔍 [DailyReportsSQL] User role:', currentRole, '| User:', user);
  
  const canDelete = currentRole === 'General Manager' || 
                   currentRole === 'المدير العام' || 
                   currentRole === 'general_manager';

  console.log('🗑️ [DailyReportsSQL] canDelete:', canDelete, '| Role:', currentRole);

  // صلاحية إنشاء تقرير: المدير العام، المهندس المشرف، المهندس
  const canCreateReport = currentRole === 'General Manager' || 
                         currentRole === 'المدير العام' ||
                         currentRole === 'Supervising Engineer' ||
                         currentRole === 'المهندس المشرف' ||
                         currentRole === 'Engineer' ||
                         currentRole === 'مهندس';

  // المدير الإداري يمكنه فقط العرض
  const isViewOnlyUser = currentRole === 'Admin Manager' || 
                        currentRole === 'مدير إداري';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جاري تحميل التقارير اليومية...</p>
        </div>
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
            <p className="text-muted-foreground">
              {isViewOnlyUser ? 'عرض ومتابعة التقارير اليومية للمشاريع (عرض فقط)' : 'إدارة ومتابعة التقارير اليومية للمشاريع'}
            </p>
          </div>
        </div>
        {/* إخفاء زر إنشاء تقرير للمدير الإداري */}
        {canCreateReport && (
          <Button onClick={() => { resetForm(); setShowDialog(true); }} className="gap-2">
            <Plus className="h-5 w-5" />
            إنشاء تقرير يومي
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي التقارير</p>
              <p className="text-2xl font-bold">{reports.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">تقارير اليوم</p>
              <p className="text-2xl font-bold">
                {reports.filter(r => r.reportDate === new Date().toISOString().split('T')[0]).length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">تقارير بها مشاكل</p>
              <p className="text-2xl font-bold">
                {reports.filter(r => r.problems || r.accidents).length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">تقاريري</p>
              <p className="text-2xl font-bold">
                {reports.filter(r => r.createdBy === user?.id).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <Input
          placeholder="🔍 بحث في التقارير (رقم التقرير، المشروع، الموقع، الوصف، معد التقرير)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="text-lg"
        />
      </Card>

      {/* Reports Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">رقم التقرير</TableHead>
                <TableHead className="text-center">التاريخ</TableHead>
                <TableHead className="text-center">المشروع</TableHead>
                <TableHead className="text-center">الموقع</TableHead>
                <TableHead className="text-center">معد التقرير</TableHead>
                <TableHead className="text-center">الحالة</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="text-muted-foreground space-y-2">
                      <FileText className="h-12 w-12 mx-auto opacity-20" />
                      <p className="text-lg">لا توجد تقارير يومية</p>
                      <p className="text-sm">ابدأ بإنشاء تقرير يومي جديد</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports
                  .sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime())
                  .map((report) => (
                    <TableRow key={report.id} className="hover:bg-muted/50">
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-mono">
                          {report.reportNumber}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(report.reportDate).toLocaleDateString('ar-SA')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {report.projectName ? (
                          <span className="text-sm">{report.projectName}</span>
                        ) : (
                          <Badge variant="outline">غير محدد</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {report.location ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{report.location}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="gap-1">
                          <Users className="h-3 w-3" />
                          {report.createdByName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {report.problems || report.accidents ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            مشاكل
                          </Badge>
                        ) : (
                          <Badge variant="default" className="gap-1 bg-green-600">
                            <CheckCircle className="h-3 w-3" />
                            طبيعي
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(report)}
                            title="عرض التقرير"
                          >
                            <Eye className="h-4 w-4 text-blue-500" />
                          </Button>
                          
                          {canEdit(report) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(report)}
                              title="تعديل التقرير"
                            >
                              <Edit2 className="h-4 w-4 text-orange-500" />
                            </Button>
                          )}
                          
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(report.id)}
                              title="حذف التقرير"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                          
                          {/* Export Buttons - Direct & Visible */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => exportReport(report.id, 'word')}
                            title="تنزيل Word"
                            disabled={exporting === report.id}
                            className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20"
                          >
                            <FileDown className="h-4 w-4 text-blue-600" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => exportReport(report.id, 'excel')}
                            title="تنزيل Excel"
                            disabled={exporting === report.id}
                            className="bg-green-50 hover:bg-green-100 dark:bg-green-950/20"
                          >
                            <FileDown className="h-4 w-4 text-green-600" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => exportReport(report.id, 'pdf')}
                            title="فتح PDF"
                            disabled={exporting === report.id}
                            className="bg-red-50 hover:bg-red-100 dark:bg-red-950/20"
                          >
                            <FileDown className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              {editingReport ? 'تعديل التقرير اليومي' : 'إنشاء تقرير يومي جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingReport ? 'قم بتعديل بيانات التقرير اليومي' : 'املأ البيانات لإنشاء تقرير يومي جديد'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* القسم 1: معلومات أساسية */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold border-b-2 border-primary/20 pb-2">
                📋 معلومات أساسية
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportDate">
                    تاريخ التقرير <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="reportDate"
                    type="date"
                    value={formData.reportDate}
                    onChange={(e) => handleChange('reportDate', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectId">المشروع (اختياري)</Label>
                  <Select value={formData.projectId} onValueChange={(v) => handleChange('projectId', v === 'none' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مشروع أو اترك فارغاً" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون مشروع</SelectItem>
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
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-semibold">
                  💡 إجمالي العمال: {(parseInt(formData.saudiWorkers) || 0) + (parseInt(formData.nonSaudiWorkers) || 0)}
                  <span className="text-muted-foreground mr-2">(يُحسب تلقائياً في قاعدة البيانات)</span>
                </p>
              </div>
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
                📊 الإنجاز والكميات (كلها اختيارية)
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
                <p className="text-xs text-muted-foreground">💡 هذا الحقل اختياري تماماً</p>
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

            {/* القسم 9: إرفاق صور وملفات */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold border-b-2 border-purple-500/20 pb-2">
                📷 إرفاق صور وملفات
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="images">رفع صور (اختياري)</Label>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      toast.info(`جاري تحميل ${files.length} صورة 📷...`);
                      
                      // ✅ تحويل الصور إلى base64
                      const base64Images: string[] = [];
                      for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        // فحص حجم الملف (أقل من 2MB)
                        if (file.size > 2 * 1024 * 1024) {
                          toast.error(`الصورة ${file.name} كبيرة جداً! الحد الأقصى 2MB`);
                          continue;
                        }
                        
                        const reader = new FileReader();
                        const base64 = await new Promise<string>((resolve) => {
                          reader.onload = () => resolve(reader.result as string);
                          reader.readAsDataURL(file);
                        });
                        base64Images.push(base64);
                      }
                      
                      setUploadedImages(prev => [...prev, ...base64Images]);
                      toast.success(`تم تحميل ${base64Images.length} صورة بنجاح ✅`);
                    }
                  }}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  💡 يمكنك رفع عدة صور للموقع، المعدات، الأعمال المنفذة، إلخ... (حجم كل صورة أقل من 2MB)
                </p>
                
                {/* ✅ عرض الصور المرفوعة */}
                {uploadedImages.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label className="text-sm font-bold">الصور المرفوعة ({uploadedImages.length}):</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {uploadedImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img 
                            src={img} 
                            alt={`صورة ${idx + 1}`} 
                            className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700"
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setUploadedImages(prev => prev.filter((_, i) => i !== idx));
                              toast.success('تم حذف الصورة');
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    ℹ️ <strong>ملاحظة:</strong> خاصية رفع الصور مفعّلة! يمكنك اختيار صور متعددة من جهازك.
                    سيتم حفظها مع التقرير في قاعدة البيانات وستظهر في التقرير المُصدّر.
                  </p>
                </div>
              </div>
            </div>

            {/* القسم 10: البنود - اختياري */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-chart-2/20 pb-3">
                <h3 className="text-xl font-bold">
                  📝 البنود - اختياري
                </h3>
                <Button type="button" onClick={addReportItem} size="sm" variant="default" className="h-10">
                  <Plus className="h-5 w-5 ml-2" />
                  إضافة بند
                </Button>
              </div>

              {reportItems.length === 0 && (
                <div className="p-8 text-center border-2 border-dashed border-muted rounded-xl bg-muted/20">
                  <p className="text-muted-foreground font-medium text-base">
                    لا توجد بنود بعد. اضغط "إضافة بند" لبدء الإضافة
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {reportItems.map((item, index) => (
                  <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">نوع البند</Label>
                        <Input
                          value={item.itemType}
                          onChange={(e) => updateReportItem(index, 'itemType', e.target.value)}
                          placeholder="مثال: بند رئيسي"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">رقم البند</Label>
                        <Input
                          value={item.itemNumber}
                          onChange={(e) => updateReportItem(index, 'itemNumber', e.target.value)}
                          placeholder="مثال: 1.2.3"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">اسم البند</Label>
                        <Input
                          value={item.itemName}
                          onChange={(e) => updateReportItem(index, 'itemName', e.target.value)}
                          placeholder="مثال: أعمال الحفر"
                        />
                      </div>

                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removeReportItem(index)}
                          className="h-10 w-10"
                          title="حذف البند"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
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
              <DialogDescription>
                عرض تفاصيل التقرير اليومي الكاملة
              </DialogDescription>
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
                <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                  <h3 className="font-bold text-lg mb-3 text-red-600 dark:text-red-400">⚠️ المشاكل والحوادث</h3>
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

              {/* البنود - اختياري */}
              {viewingReport.items && (() => {
                try {
                  const parsedItems = JSON.parse(viewingReport.items);
                  if (Array.isArray(parsedItems) && parsedItems.length > 0) {
                    return (
                      <Card className="p-4 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
                        <h3 className="font-bold text-lg mb-3 text-purple-700 dark:text-purple-300">📝 البنود ({parsedItems.length})</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b-2 border-purple-300 dark:border-purple-700">
                                <th className="text-right p-2 font-bold">#</th>
                                <th className="text-right p-2 font-bold">نوع البند</th>
                                <th className="text-right p-2 font-bold">رقم البند</th>
                                <th className="text-right p-2 font-bold">اسم البند</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parsedItems.map((item: any, idx: number) => (
                                <tr key={idx} className="border-b border-purple-200 dark:border-purple-800">
                                  <td className="p-2">{idx + 1}</td>
                                  <td className="p-2">{item.itemType || '-'}</td>
                                  <td className="p-2">{item.itemNumber || '-'}</td>
                                  <td className="p-2">{item.itemName || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    );
                  }
                } catch (e) {
                  // إذا فشل parsing، عرض النص كما هو
                  return (
                    <Card className="p-4 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
                      <h3 className="font-bold text-lg mb-3 text-purple-700 dark:text-purple-300">📝 البنود</h3>
                      <p className="text-sm whitespace-pre-wrap">{viewingReport.items}</p>
                    </Card>
                  );
                }
                return null;
              })()}
              
              {/* ✅ الصور المرفقة */}
              {viewingReport.images && viewingReport.images.length > 0 && (
                <Card className="p-4 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
                  <h3 className="font-bold text-lg mb-3 text-purple-700 dark:text-purple-300">📷 صور التقرير ({viewingReport.images.length})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {viewingReport.images.map((img: string, idx: number) => (
                      <div key={idx} className="relative group">
                        <img 
                          src={img} 
                          alt={`صورة ${idx + 1}`} 
                          className="w-full h-40 object-cover rounded-lg border-2 border-purple-300 dark:border-purple-700 shadow-md hover:shadow-xl transition-all cursor-pointer"
                          onClick={() => {
                            const win = window.open('', '_blank');
                            if (win) {
                              win.document.write(`<html dir="rtl"><head><title>صورة ${idx + 1}</title><style>body{margin:0;padding:20px;background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh;}img{max-width:100%;max-height:100vh;border:5px solid #fff;border-radius:10px;box-shadow:0 10px 50px rgba(255,255,255,0.3);}</style></head><body><img src="${img}" alt="صورة ${idx + 1}" /></body></html>`);
                            }
                          }}
                        />
                        <div className="absolute bottom-2 right-2 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          📷 {idx + 1}
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 text-lg font-bold">🔍 انقر للتكبير</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-3 text-center">
                    💡 انقر على أي صورة لعرضها بحجم كامل
                  </p>
                </Card>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                إغلاق
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => exportReport(viewingReport.id, 'word')} disabled={exporting === viewingReport.id}>
                  <FileDown className="h-4 w-4 ml-2 text-blue-600" />
                  Word
                </Button>
                <Button variant="outline" onClick={() => exportReport(viewingReport.id, 'excel')} disabled={exporting === viewingReport.id}>
                  <FileDown className="h-4 w-4 ml-2 text-green-600" />
                  Excel
                </Button>
                <Button variant="outline" onClick={() => exportReport(viewingReport.id, 'pdf')} disabled={exporting === viewingReport.id}>
                  <FileDown className="h-4 w-4 ml-2 text-red-600" />
                  PDF
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};