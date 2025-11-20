import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getServerUrl } from '../utils/supabase-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Calendar, FileText, Users, Hammer, Plus, Image as ImageIcon, Download, Edit, Trash2, FileSpreadsheet, FileText as FileWord, MoreVertical } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from '../contexts/LanguageContext';

interface Project {
  id: string;
  workOrderDescription: string;
  workOrderNumber: string;
  projectNumber: string;
  roadName: string;
}

interface DailyReport {
  id: string;
  projectId: string;
  projectName: string;
  reportDate: string;
  workDescription: string;
  workersCount: number;
  equipment: string;
  weatherCondition: string;
  notes: string;
  images: string[];
  createdBy: string;
  createdByName?: string;
  createdAt: string;
}

export const DailyReports: React.FC = () => {
  const { accessToken, user } = useAuth();
  const { language, t } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [filterProject, setFilterProject] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<DailyReport | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [reportToEdit, setReportToEdit] = useState<DailyReport | null>(null);
  const [editFormData, setEditFormData] = useState({
    projectId: '',
    reportDate: '',
    workDescription: '',
    workersCount: '',
    equipment: '',
    weatherCondition: 'مشمس',
    notes: '',
  });

  // Get user role
  const userRole = user?.user_metadata?.role || user?.role || 'Observer';
  const isGeneralManager = userRole === 'General Manager' || userRole === 'مدير عام';
  const isBranchGeneralManager = userRole === 'Branch General Manager' || userRole === 'مدير عام الفرع';
  const isSupervisorEngineer = userRole === 'Supervising Engineer' || userRole === 'المهندس المشرف';
  const isEngineer = userRole === 'Engineer' || userRole === 'مهندس';
  
  const canCreateReport = isGeneralManager || isSupervisorEngineer || isEngineer;
  const canEditDelete = isGeneralManager;

  const [formData, setFormData] = useState({
    projectId: '',
    reportDate: new Date().toISOString().split('T')[0],
    workDescription: '',
    workersCount: '',
    equipment: '',
    weatherCondition: 'مشمس',
    notes: '',
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  useEffect(() => {
    fetchProjects();
    fetchReports();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch(getServerUrl('/projects'), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await fetch(getServerUrl('/daily-reports'), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadedFiles(prev => [...prev, ...files]);
    const fileNames = files.map(f => f.name);
    setUploadedImages(prev => [...prev, ...fileNames]);
    
    toast.success(`تم اختيار ${files.length} صورة`);
  };

  const removeImage = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    toast.success('تم حذف الصورة');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const selectedProjectData = projects.find(p => p.id === formData.projectId);
      
      const response = await fetch(getServerUrl('/daily-reports'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...formData,
          projectName: selectedProjectData?.workOrderDescription || '',
          images: uploadedImages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في إنشاء التقرير');
      }

      toast.success('تم إنشاء التقرير اليومي بنجاح');
      setOpen(false);
      resetForm();
      fetchReports();
    } catch (error: any) {
      console.error('Error creating daily report:', error);
      toast.error(error.message || 'حدث خطأ أثناء إنشاء التقرير');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!reportToDelete) return;

    try {
      const response = await fetch(getServerUrl(`/daily-reports/${reportToDelete.id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('فشل في حذف التقرير');
      }

      toast.success('تم حذف التقرير بنجاح');
      setDeleteDialogOpen(false);
      setReportToDelete(null);
      fetchReports();
    } catch (error: any) {
      console.error('Error deleting report:', error);
      toast.error(error.message || 'حدث خطأ أثناء حذف التقرير');
    }
  };

  const resetForm = () => {
    setFormData({
      projectId: '',
      reportDate: new Date().toISOString().split('T')[0],
      workDescription: '',
      workersCount: '',
      equipment: '',
      weatherCondition: 'مشمس',
      notes: '',
    });
    setUploadedFiles([]);
    setUploadedImages([]);
  };

  // دالة تصدير Excel
  const exportToExcel = async (report: DailyReport) => {
    try {
      const XLSX = await import('xlsx');
      const data = [
        ['التقرير اليومي', ''],
        ['التاريخ', new Date(report.reportDate).toLocaleDateString('ar-SA')],
        ['المشروع', report.projectName],
        ['', ''],
        ['تفاصيل العمل', ''],
        ['وصف الأعمال', report.workDescription],
        ['عدد العمال', report.workersCount.toString()],
        ['المعدات', report.equipment || '-'],
        ['حالة الطقس', report.weatherCondition],
        ['', ''],
        ['المشاكل والملاحظات', ''],
        ['ملاحظات', report.notes || '-'],
        ['', ''],
        ['معلومات إضافية', ''],
        ['مضاف بواسطة', report.createdByName || '-'],
        ['تاريخ الإنشاء', new Date(report.createdAt).toLocaleString('ar-SA')],
      ];

      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'التقرير اليومي');
      ws['!cols'] = [{ width: 20 }, { width: 50 }];
      
      XLSX.writeFile(wb, `تقرير_يومي_${report.reportDate}.xlsx`);
      toast.success('تم تصدير التقرير بصيغة Excel');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('فشل تصدير التقرير');
    }
  };

  // دالة تصدير Word
  const exportToWord = async (report: DailyReport) => {
    try {
      const { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, HeadingLevel } = await import('docx');
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: '🇸🇦 التقرير اليومي',
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 },
            }),
            new Paragraph({
              text: 'المعلومات الأساسية',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 200 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'التاريخ', alignment: AlignmentType.RIGHT })] }),
                    new TableCell({ children: [new Paragraph({ text: new Date(report.reportDate).toLocaleDateString('ar-SA'), alignment: AlignmentType.RIGHT })] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'المشروع', alignment: AlignmentType.RIGHT })] }),
                    new TableCell({ children: [new Paragraph({ text: report.projectName, alignment: AlignmentType.RIGHT })] }),
                  ],
                }),
              ],
            }),
            new Paragraph({
              text: 'تفاصيل العمل',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 200 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'وصف الأعمال', alignment: AlignmentType.RIGHT })] }),
                    new TableCell({ children: [new Paragraph({ text: report.workDescription, alignment: AlignmentType.RIGHT })] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'عدد العمال', alignment: AlignmentType.RIGHT })] }),
                    new TableCell({ children: [new Paragraph({ text: report.workersCount.toString(), alignment: AlignmentType.RIGHT })] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'المعدات', alignment: AlignmentType.RIGHT })] }),
                    new TableCell({ children: [new Paragraph({ text: report.equipment || '-', alignment: AlignmentType.RIGHT })] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'حالة الطقس', alignment: AlignmentType.RIGHT })] }),
                    new TableCell({ children: [new Paragraph({ text: report.weatherCondition, alignment: AlignmentType.RIGHT })] }),
                  ],
                }),
              ],
            }),
            new Paragraph({
              text: 'المشاكل والملاحظات',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 200 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'ملاحظات', alignment: AlignmentType.RIGHT })] }),
                    new TableCell({ children: [new Paragraph({ text: report.notes || '-', alignment: AlignmentType.RIGHT })] }),
                  ],
                }),
              ],
            }),
            new Paragraph({
              text: 'معلومات إضافية',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 200 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'مضاف بواسطة', alignment: AlignmentType.RIGHT })] }),
                    new TableCell({ children: [new Paragraph({ text: report.createdByName || '-', alignment: AlignmentType.RIGHT })] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'تاريخ الإنشاء', alignment: AlignmentType.RIGHT })] }),
                    new TableCell({ children: [new Paragraph({ text: new Date(report.createdAt).toLocaleString('ar-SA'), alignment: AlignmentType.RIGHT })] }),
                  ],
                }),
              ],
            }),
            new Paragraph({
              text: 'الهيئة العامة للطرق - المملكة العربية السعودية 🇸🇦',
              alignment: AlignmentType.CENTER,
              spacing: { before: 400 },
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `تقرير_يومي_${report.reportDate}.docx`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('تم تصدير التقرير بصيغة Word');
    } catch (error) {
      console.error('Error exporting to Word:', error);
      toast.error('فشل تصدير التقرير');
    }
  };

  // دالة تصدير PDF
  const exportToPDF = async (report: DailyReport) => {
    try {
      // إنشاء iframe معزول تماماً
      const iframe = document.createElement('iframe');
      iframe.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 800px;
        height: 1200px;
        border: none;
      `;
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error('فشل في إنشاء المستند');
      
      // كتابة HTML كامل معزول مع CSS inline فقط
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
              background: #ffffff;
              color: #000000;
              padding: 40px;
              direction: rtl;
            }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 4px solid #FDB714;">
            <h1 style="font-size: 32px; color: #006C35; margin: 0 0 10px 0; font-weight: bold;">🇸🇦 التقرير اليومي</h1>
            <p style="font-size: 16px; color: #666666; margin: 0;">الهيئة العامة للطرق - المملكة العربية السعودية</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 22px; color: #006C35; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 3px solid #FDB714; font-weight: bold;">📋 المعلومات الأساسية</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
              <tr>
                <td style="padding: 12px; background: #f5f5f5; border: 1px solid #dddddd; font-weight: bold; width: 35%;">📅 التاريخ</td>
                <td style="padding: 12px; border: 1px solid #dddddd;">${new Date(report.reportDate).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background: #f5f5f5; border: 1px solid #dddddd; font-weight: bold;">🏗️ المشروع</td>
                <td style="padding: 12px; border: 1px solid #dddddd;">${report.projectName}</td>
              </tr>
            </table>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 22px; color: #006C35; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 3px solid #FDB714; font-weight: bold;">🔨 تفاصيل العمل</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
              <tr>
                <td style="padding: 12px; background: #f5f5f5; border: 1px solid #dddddd; font-weight: bold; width: 35%;">📝 وصف الأعمال</td>
                <td style="padding: 12px; border: 1px solid #dddddd; line-height: 1.8;">${report.workDescription}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background: #f5f5f5; border: 1px solid #dddddd; font-weight: bold;">👷 عدد العمال</td>
                <td style="padding: 12px; border: 1px solid #dddddd;">${report.workersCount} عامل</td>
              </tr>
              <tr>
                <td style="padding: 12px; background: #f5f5f5; border: 1px solid #dddddd; font-weight: bold;">🚜 المعدات المستخدمة</td>
                <td style="padding: 12px; border: 1px solid #dddddd;">${report.equipment || 'لا يوجد'}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background: #f5f5f5; border: 1px solid #dddddd; font-weight: bold;">🌤️ حالة الطقس</td>
                <td style="padding: 12px; border: 1px solid #dddddd;">${report.weatherCondition}</td>
              </tr>
            </table>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 22px; color: #006C35; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 3px solid #FDB714; font-weight: bold;">⚠️ المشاكل والملاحظات</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
              <tr>
                <td style="padding: 12px; background: #f5f5f5; border: 1px solid #dddddd; font-weight: bold; width: 35%;">📌 ملاحظات إضافية</td>
                <td style="padding: 12px; border: 1px solid #dddddd; line-height: 1.8;">${report.notes || 'لا توجد ملاحظات'}</td>
              </tr>
            </table>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 22px; color: #006C35; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 3px solid #FDB714; font-weight: bold;">ℹ️ معلومات إضافية</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
              <tr>
                <td style="padding: 12px; background: #f5f5f5; border: 1px solid #dddddd; font-weight: bold; width: 35%;">👤 مضاف بواسطة</td>
                <td style="padding: 12px; border: 1px solid #dddddd;">${report.createdByName || 'غير معروف'}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background: #f5f5f5; border: 1px solid #dddddd; font-weight: bold;">🕐 تاريخ الإنشاء</td>
                <td style="padding: 12px; border: 1px solid #dddddd;">${new Date(report.createdAt).toLocaleString('ar-SA', { dateStyle: 'full', timeStyle: 'short' })}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin-top: 50px; padding-top: 20px; border-top: 3px solid #e0e0e0;">
            <p style="font-size: 14px; color: #006C35; margin: 0 0 8px 0; font-weight: bold;">🇸🇦 الهيئة العامة للطرق - المملكة العربية السعودية</p>
            <p style="font-size: 12px; color: #999999; margin: 0;">تم إنشاء التقرير بتاريخ: ${new Date().toLocaleString('ar-SA', { dateStyle: 'full', timeStyle: 'short' })}</p>
          </div>
        </body>
        </html>
      `);
      iframeDoc.close();
      
      // انتظار تحميل المحتوى
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // تحويل iframe body إلى canvas
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 800,
        windowHeight: iframeDoc.body.scrollHeight,
      });
      
      // إزالة iframe
      document.body.removeChild(iframe);
      
      // تحويل Canvas إلى صورة
      const imgData = canvas.toDataURL('image/png');
      
      // إنشاء PDF
      const jsPDF = (await import('jspdf')).default;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // حساب أبعاد الصورة
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // إضافة الصورة
      if (imgHeight <= pageHeight - 20) {
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        let position = 10;
        
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - 20);
        
        while (heightLeft > 0) {
          position = heightLeft - imgHeight + 10;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
          heightLeft -= (pageHeight - 20);
        }
      }
      
      pdf.save(`تقرير_يومي_${report.reportDate}.pdf`);
      toast.success('تم تصدير التقرير بصيغة PDF بنجاح! ✅');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('فشل تصدير التقرير - حاول مرة أخرى');
    }
  };

  const filteredReports = filterProject === 'all' 
    ? reports 
    : reports.filter(r => r.projectId === filterProject);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl">التقارير اليومية</CardTitle>
              <CardDescription className="mt-2">
                إدارة التقارير اليومية للمشاريع وتتبع الأعمال المنفذة
              </CardDescription>
            </div>
            {canCreateReport && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-primary to-primary/80">
                    <Plus className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                    إنشاء تقرير يومي
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  <DialogHeader>
                    <DialogTitle className="text-2xl">إنشاء تقرير يومي جديد</DialogTitle>
                    <DialogDescription>
                      قم بتعبئة تفاصيل الأعمال المنفذة اليوم
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold border-b-2 border-primary/20 pb-2">المعلومات الأساسية</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="projectId">المشروع *</Label>
                          <Select value={formData.projectId} onValueChange={(v) => handleChange('projectId', v)} required>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر مشروع" />
                            </SelectTrigger>
                            <SelectContent>
                              {projects.map(project => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.workOrderDescription} ({project.projectNumber})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="reportDate">تاريخ التقرير *</Label>
                          <Input
                            id="reportDate"
                            type="date"
                            value={formData.reportDate}
                            onChange={(e) => handleChange('reportDate', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-bold border-b-2 border-chart-1/20 pb-2">تفاصيل العمل</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="workDescription">وصف الأعمال المنفذة *</Label>
                        <Textarea
                          id="workDescription"
                          value={formData.workDescription}
                          onChange={(e) => handleChange('workDescription', e.target.value)}
                          required
                          placeholder="مثال: تم صب الخرسانة للقطاع من كم 0+000 إلى كم 0+500..."
                          rows={4}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="workersCount">عدد العمال</Label>
                          <Input
                            id="workersCount"
                            type="number"
                            min="0"
                            value={formData.workersCount}
                            onChange={(e) => handleChange('workersCount', e.target.value)}
                            placeholder="0"
                          />
                        </div>

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
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="equipment">المعدات المستخدمة</Label>
                          <Input
                            id="equipment"
                            value={formData.equipment}
                            onChange={(e) => handleChange('equipment', e.target.value)}
                            placeholder="مثال: حفار، شاحنة، رافعة..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-bold border-b-2 border-chart-2/20 pb-2">الملاحظات</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="notes">ملاحظات إضافية</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => handleChange('notes', e.target.value)}
                          placeholder="أي ملاحظات إضافية..."
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-bold border-b-2 border-chart-3/20 pb-2">الصور</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="images">رفع الصور (اختياري)</Label>
                        <Input
                          id="images"
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                        {uploadedFiles.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            تم رفع {uploadedFiles.length} صورة
                          </div>
                        )}
                      </div>

                      {uploadedImages.length > 0 && (
                        <div className="space-y-2">
                          <Label>صور مرفوعة:</Label>
                          <div className="flex flex-wrap gap-2">
                            {uploadedImages.map((image, index) => (
                              <Badge key={index} variant="outline" className="gap-2">
                                <ImageIcon className="h-3 w-3" />
                                {image}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0"
                                  onClick={() => removeImage(index)}
                                >
                                  ×
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <Button type="submit" className="flex-1" disabled={submitting}>
                        {submitting ? 'جاري الحفظ...' : 'حفظ التقرير'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                        إلغاء
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-lg">
            <Label>تصفية حسب المشروع:</Label>
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المشاريع</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.workOrderDescription}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">إجمالي التقارير</div>
                    <div className="text-2xl font-bold">{filteredReports.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">تقارير هذا الشهر</div>
                    <div className="text-2xl font-bold">
                      {filteredReports.filter(r => {
                        const reportDate = new Date(r.reportDate);
                        const now = new Date();
                        return reportDate.getMonth() === now.getMonth() && 
                               reportDate.getFullYear() === now.getFullYear();
                      }).length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Hammer className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">مشاريع نشطة</div>
                    <div className="text-2xl font-bold">
                      {new Set(filteredReports.map(r => r.projectId)).size}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">التاريخ</TableHead>
                  <TableHead className="text-center min-w-[200px]">المشروع</TableHead>
                  <TableHead className="text-center min-w-[250px]">وصف الأعمال</TableHead>
                  <TableHead className="text-center">العمال</TableHead>
                  <TableHead className="text-center">الطقس</TableHead>
                  <TableHead className="text-center">مضاف بواسطة</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد تقارير يومية
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()).map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="text-center">
                        {new Date(report.reportDate).toLocaleDateString('ar-SA')}
                      </TableCell>
                      <TableCell className="text-right">
                        {report.projectName}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="line-clamp-2">{report.workDescription}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {report.workersCount}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {report.weatherCondition}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {report.createdByName || 'غير معروف'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                            <DropdownMenuItem onClick={() => exportToExcel(report)}>
                              <FileSpreadsheet className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                              تصدير Excel
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportToWord(report)}>
                              <FileWord className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                              تصدير Word
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportToPDF(report)}>
                              <Download className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                              تصدير PDF
                            </DropdownMenuItem>
                            
                            {canEditDelete && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => toast.info('التعديل قريباً')}>
                                  <Edit className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                                  تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setReportToDelete(report);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                                  حذف
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف التقرير</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا التقرير؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteReport}
              className="bg-destructive hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};