import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getServerUrl } from '../utils/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Skeleton } from './ui/skeleton';
import { Plus, Download, FileText, Trash2, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useLanguage } from '../contexts/LanguageContext';

interface PerformanceContract {
  id: string;
  contractNumber: string;
  projectName: string;
  contractorName: string;
  year: number;
  month: string;
  contractorScore: number;
  yearlyWeighted: number;
  difference: number;
  createdAt: string;
  createdBy: string;
}

export const PerformanceContractsPage: React.FC = () => {
  const { accessToken, role, userId } = useAuth();
  const { language } = useLanguage();
  const [contracts, setContracts] = useState<PerformanceContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<PerformanceContract | null>(null);

  const [formData, setFormData] = useState({
    contractNumber: '',
    projectName: '',
    contractorName: '',
    year: new Date().getFullYear(),
    month: '',
    contractorScore: '',
    yearlyWeighted: '',
  });

  // تحديد الصلاحيات بشكل صحيح - يدعم العربي والإنجليزي
  const canEdit = role === 'المدير العام' || role === 'General Manager';
  const canView = 
    role === 'المدير العام' || role === 'General Manager' ||
    role === 'مدير عام الفرع' || role === 'Branch General Manager' ||
    role === 'المدير الإداري' || role === 'Admin Manager';

  // Debug log
  console.log('🔍 PerformanceContracts - User Role:', role);
  console.log('✅ canView:', canView, '| canEdit:', canEdit);

  useEffect(() => {
    if (canView) {
      fetchContracts();
    } else {
      setLoading(false);
    }
  }, [canView, accessToken]); // أضفنا accessToken كـ dependency

  const fetchContracts = async () => {
    try {
      const response = await fetch(getServerUrl('/performance-contracts'), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setContracts(data.contracts || []);
      }
    } catch (error) {
      console.error('Error fetching performance contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEdit) {
      alert(language === 'ar' ? 'ليس لديك صلاحية للإضافة' : 'You do not have permission to add');
      return;
    }

    const difference = parseFloat(formData.contractorScore) - parseFloat(formData.yearlyWeighted);

    const newContract = {
      ...formData,
      difference,
      createdBy: userId,
    };

    try {
      const response = await fetch(getServerUrl('/performance-contracts'), {
        method: editingContract ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingContract ? { ...newContract, id: editingContract.id } : newContract),
      });

      if (response.ok) {
        alert(language === 'ar' 
          ? (editingContract ? 'تم تحديث العقد بنجاح' : 'تم إضافة العقد بنجاح') 
          : (editingContract ? 'Contract updated successfully' : 'Contract added successfully'));
        setIsDialogOpen(false);
        resetForm();
        fetchContracts();
      } else {
        const error = await response.json();
        alert(error.message || (language === 'ar' ? 'فشل في حفظ العقد' : 'Failed to save contract'));
      }
    } catch (error) {
      console.error('Error saving contract:', error);
      alert(language === 'ar' ? 'فشل في حفظ العقد' : 'Failed to save contract');
    }
  };

  const handleDelete = async (id: string) => {
    if (!canEdit) return;

    if (!confirm(language === 'ar' ? 'هل تريد حذف هذا العقد؟' : 'Delete this contract?')) return;

    try {
      const response = await fetch(getServerUrl('/performance-contracts'), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        alert(language === 'ar' ? 'تم حذف العقد بنجاح' : 'Contract deleted successfully');
        fetchContracts();
      }
    } catch (error) {
      console.error('Error deleting contract:', error);
      alert(language === 'ar' ? 'فشل في حذف العقد' : 'Failed to delete contract');
    }
  };

  const handleEdit = (contract: PerformanceContract) => {
    setEditingContract(contract);
    setFormData({
      contractNumber: contract.contractNumber,
      projectName: contract.projectName,
      contractorName: contract.contractorName,
      year: contract.year,
      month: contract.month,
      contractorScore: contract.contractorScore.toString(),
      yearlyWeighted: contract.yearlyWeighted.toString(),
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      contractNumber: '',
      projectName: '',
      contractorName: '',
      year: new Date().getFullYear(),
      month: '',
      contractorScore: '',
      yearlyWeighted: '',
    });
    setEditingContract(null);
  };

  const getCellColor = (difference: number): string => {
    if (difference > 0) return 'bg-green-100 text-green-800 border-green-300';
    if (difference === 0) return 'bg-gray-100 text-gray-800 border-gray-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const exportToExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      
      if (contracts.length === 0) {
        alert(language === 'ar' ? 'لا توجد بيانات للتصدير' : 'No data to export');
        return;
      }
      
      const excelData = contracts.map((c, index) => ({
        'م': index + 1,
        [language === 'ar' ? 'رقم العقد' : 'Contract No']: c.contractNumber,
        [language === 'ar' ? 'اسم المشروع' : 'Project Name']: c.projectName,
        [language === 'ar' ? 'اسم المقاول' : 'Contractor Name']: c.contractorName,
        [language === 'ar' ? 'السنة' : 'Year']: c.year,
        [language === 'ar' ? 'الشهر' : 'Month']: c.month,
        [language === 'ar' ? 'درجة أداء المقاول' : 'Contractor Score']: parseFloat(c.contractorScore).toFixed(2),
        [language === 'ar' ? 'المرجح للعام' : 'Yearly Weighted']: parseFloat(c.yearlyWeighted).toFixed(2),
        [language === 'ar' ? 'الفرق' : 'Difference']: parseFloat(c.difference).toFixed(2),
      }));
      
      const ws = XLSX.utils.json_to_sheet(excelData);
      ws['!cols'] = [
        { wch: 5 }, { wch: 15 }, { wch: 30 }, { wch: 25 }, 
        { wch: 10 }, { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 12 }
      ];
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, language === 'ar' ? 'عقود الأداء' : 'Performance Contracts');
      
      const fileName = `${language === 'ar' ? 'عقود_الأداء' : 'performance_contracts'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      alert(language === 'ar' ? 'تم تصدير Excel بنجاح' : 'Excel exported successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert(language === 'ar' ? 'فشل تصدير Excel' : 'Excel export failed');
    }
  };

  const exportToPDF = async () => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 1400px;
        height: 1000px;
        border: none;
      `;
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error('Failed to create document');
      
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              background: #ffffff;
              color: #000000;
              padding: 30px;
              direction: rtl;
              width: 1400px;
            }
            .header {
              background: #f97316;
              color: #ffffff;
              text-align: center;
              padding: 25px;
              margin-bottom: 20px;
              border: 3px solid #000000;
              border-radius: 8px;
            }
            .header h1 {
              font-size: 26px;
              font-weight: bold;
              margin: 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              border: 3px solid #000000;
              background: #ffffff;
              margin-top: 20px;
            }
            th {
              background: #fef3c7;
              color: #000000;
              font-weight: bold;
              font-size: 13px;
              padding: 15px 10px;
              text-align: center;
              border: 2px solid #000000;
            }
            td {
              padding: 12px 10px;
              text-align: center;
              border: 2px solid #000000;
              font-size: 12px;
              font-weight: 600;
            }
            .index-col {
              background: #fef3c7 !important;
              font-weight: bold;
            }
            .green-cell { background: #dcfce7; color: #166534; }
            .gray-cell { background: #f3f4f6; color: #374151; }
            .red-cell { background: #fee2e2; color: #991b1b; }
            .footer {
              background: #dbeafe;
              border: 3px solid #000000;
              padding: 20px;
              margin-top: 20px;
              text-align: center;
              border-radius: 8px;
            }
            .footer-text {
              font-size: 14px;
              font-weight: bold;
              color: #000000;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>بيان مؤشر أداء المقاول لمشروع صيانة أداء طرق</h1>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>م</th>
                <th>رقم العقد</th>
                <th>اسم المشروع</th>
                <th>اسم المقاول</th>
                <th>السنة</th>
                <th>الشهر</th>
                <th>درجة أداء المقاول</th>
                <th>المرجح للعام</th>
                <th>الفرق</th>
              </tr>
            </thead>
            <tbody>
              ${contracts.map((c, index) => {
                const diff = parseFloat(c.difference);
                const cellClass = diff > 0 ? 'green-cell' : diff === 0 ? 'gray-cell' : 'red-cell';
                return `
                  <tr>
                    <td class="index-col">${index + 1}</td>
                    <td>${c.contractNumber}</td>
                    <td>${c.projectName}</td>
                    <td>${c.contractorName}</td>
                    <td>${c.year}</td>
                    <td>${c.month}</td>
                    <td>${parseFloat(c.contractorScore).toFixed(2)}</td>
                    <td>${parseFloat(c.yearlyWeighted).toFixed(2)}</td>
                    <td class="${cellClass}"><strong>${diff > 0 ? '+' : ''}${diff.toFixed(2)}</strong></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <div class="footer-text">
              🇸🇦 الهيئة العامة للطرق - المملكة العربية السعودية | ${new Date().toLocaleDateString('ar-SA')}
            </div>
          </div>
        </body>
        </html>
      `);
      iframeDoc.close();
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1400,
        windowHeight: iframeDoc.body.scrollHeight,
      });
      
      document.body.removeChild(iframe);
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      const jsPDF = (await import('jspdf')).default;
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pageWidth - 10;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 5;
      
      pdf.addImage(imgData, 'PNG', 5, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= (pageHeight - 10);
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 5;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 5, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= (pageHeight - 10);
      }
      
      pdf.save(`عقود_الأداء_${new Date().toISOString().split('T')[0]}.pdf`);
      alert(language === 'ar' ? '✅ تم تصدير PDF بنجاح!' : '✅ PDF exported successfully!');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert(language === 'ar' ? 'فشل تصدير PDF' : 'PDF export failed');
    }
  };

  const exportToWord = async () => {
    try {
      const docx = await import('docx');
      const { Document, Paragraph, TextRun, Table, TableCell, TableRow, AlignmentType, WidthType, ShadingType } = docx;
      
      const children: any[] = [
        new Paragraph({
          children: [new TextRun({ text: 'الهيئة العامة للطرق 🇸🇦', bold: true, size: 32, color: '006C35' })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: 'بيان مؤشر أداء المقاول', bold: true, size: 28, color: '1F2937' })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `تاريخ الإصدار: ${new Date().toLocaleDateString('ar-SA')}`, size: 20, color: '6B7280' })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      ];
      
      if (contracts.length > 0) {
        const tableRows: TableRow[] = [];
        
        const headers = ['م', 'رقم العقد', 'اسم المشروع', 'اسم المقاول', 'السنة', 'الشهر', 'درجة أداء المقاول', 'المرجح للعام', 'الفرق'];
        
        tableRows.push(new TableRow({
          children: headers.map(h => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: h, color: 'FFFFFF', bold: true })], alignment: AlignmentType.CENTER })],
            shading: { fill: '006C35', type: ShadingType.CLEAR },
          }))
        }));
        
        contracts.forEach((contract, index) => {
          const diff = parseFloat(contract.difference);
          const diffColor = diff > 0 ? 'DCFCE7' : diff === 0 ? 'F3F4F6' : 'FEE2E2';
          const isEven = index % 2 === 0;
          const bg = isEven ? 'F9FAFB' : 'FFFFFF';
          
          const cells = [
            (index + 1).toString(),
            contract.contractNumber,
            contract.projectName,
            contract.contractorName,
            contract.year.toString(),
            contract.month,
            parseFloat(contract.contractorScore).toFixed(2),
            parseFloat(contract.yearlyWeighted).toFixed(2),
          ];
          
          tableRows.push(new TableRow({
            children: [
              ...cells.map(text => new TableCell({
                children: [new Paragraph({ text, alignment: AlignmentType.CENTER })],
                shading: { fill: bg, type: ShadingType.CLEAR },
              })),
              new TableCell({
                children: [new Paragraph({ 
                  children: [new TextRun({ 
                    text: (diff > 0 ? '+' : '') + diff.toFixed(2), 
                    bold: true 
                  })], 
                  alignment: AlignmentType.CENTER 
                })],
                shading: { fill: diffColor, type: ShadingType.CLEAR },
              })
            ]
          }));
        });
        
        children.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
        
        children.push(
          new Paragraph({
            children: [new TextRun({ text: '\\n\\nالهيئة العامة للطرق - المملكة العربية السعودية 🇸🇦', bold: true, size: 20, color: '6B7280' })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400 },
          })
        );
      }
      
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: { top: 720, right: 720, bottom: 720, left: 720 },
              size: { orientation: docx.PageOrientation.LANDSCAPE },
            },
          },
          children: children,
        }],
      });
      
      const { Packer } = docx;
      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `عقود_الأداء_${new Date().toISOString().split('T')[0]}.docx`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      alert(language === 'ar' ? 'تم تصدير Word بنجاح' : 'Word exported successfully');
    } catch (error) {
      console.error('Error exporting to Word:', error);
      alert(language === 'ar' ? 'فشل تصدير Word' : 'Word export failed');
    }
  };

  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const monthsEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-20">
          <div className="text-center text-muted-foreground">
            {language === 'ar' ? 'ليس لديك صلاحية لعرض هذه الصفحة' : 'You do not have permission to view this page'}
          </div>
        </CardContent>
      </Card>
    );
  }

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">
            {language === 'ar' ? '📊 عقود الأداء' : '📊 Performance Contracts'}
          </CardTitle>
          <div className="flex gap-2">
            {canEdit && (
              <>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-primary to-primary/80">
                      <Plus className="ml-2 h-4 w-4" />
                      {language === 'ar' ? 'إضافة عقد جديد' : 'Add New Contract'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <DialogHeader>
                      <DialogTitle>
                        {editingContract 
                          ? (language === 'ar' ? 'تعديل عقد' : 'Edit Contract')
                          : (language === 'ar' ? 'إضافة عقد جديد' : 'Add New Contract')}
                      </DialogTitle>
                      <DialogDescription>
                        {editingContract 
                          ? (language === 'ar' ? 'تعديل عقد الأداء الحالي' : 'Edit the current performance contract')
                          : (language === 'ar' ? 'إضافة عقد أداء جديد' : 'Add a new performance contract')}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>{language === 'ar' ? 'رقم العقد' : 'Contract Number'}</Label>
                          <Input
                            value={formData.contractNumber}
                            onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                            required
                            placeholder={language === 'ar' ? 'أدخل رقم العقد' : 'Enter contract number'}
                          />
                        </div>
                        <div>
                          <Label>{language === 'ar' ? 'السنة' : 'Year'}</Label>
                          <Input
                            type="number"
                            value={formData.year}
                            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label>{language === 'ar' ? 'اسم مشروع عقد الصيانة' : 'Maintenance Contract Project Name'}</Label>
                        <Input
                          value={formData.projectName}
                          onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                          required
                          placeholder={language === 'ar' ? 'أدخل اسم المشروع' : 'Enter project name'}
                        />
                      </div>

                      <div>
                        <Label>{language === 'ar' ? 'اسم المقاول' : 'Contractor Name'}</Label>
                        <Input
                          value={formData.contractorName}
                          onChange={(e) => setFormData({ ...formData, contractorName: e.target.value })}
                          required
                          placeholder={language === 'ar' ? 'أدخل اسم المقاول' : 'Enter contractor name'}
                        />
                      </div>

                      <div>
                        <Label>{language === 'ar' ? 'الشهر' : 'Month'}</Label>
                        <Select
                          value={formData.month}
                          onValueChange={(value) => setFormData({ ...formData, month: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={language === 'ar' ? 'اختر الشهر' : 'Select month'} />
                          </SelectTrigger>
                          <SelectContent>
                            {(language === 'ar' ? months : monthsEn).map((month) => (
                              <SelectItem key={month} value={month}>{month}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>{language === 'ar' ? 'درجة أداء المقاول' : 'Contractor Score'}</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.contractorScore}
                            onChange={(e) => setFormData({ ...formData, contractorScore: e.target.value })}
                            required
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label>{language === 'ar' ? 'المرجح للعام' : 'Yearly Weighted'}</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.yearlyWeighted}
                            onChange={(e) => setFormData({ ...formData, yearlyWeighted: e.target.value })}
                            required
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="bg-muted p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-2">
                          {language === 'ar' ? 'الفرق (تلقائي):' : 'Difference (auto):'}
                        </div>
                        <div className="text-2xl font-bold">
                          {((parseFloat(formData.contractorScore) || 0) - (parseFloat(formData.yearlyWeighted) || 0)).toFixed(2)}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button type="submit" className="flex-1">
                          {editingContract 
                            ? (language === 'ar' ? 'تحديث' : 'Update')
                            : (language === 'ar' ? 'إضافة' : 'Add')}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setIsDialogOpen(false);
                            resetForm();
                          }}
                        >
                          {language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600">
                      <Download className="ml-2 h-4 w-4" />
                      {language === 'ar' ? 'تصدير' : 'Export'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
                      <FileText className="ml-2 h-4 w-4 text-green-600" />
                      <span>{language === 'ar' ? 'تصدير Excel' : 'Export Excel'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer">
                      <FileText className="ml-2 h-4 w-4 text-red-600" />
                      <span>{language === 'ar' ? 'تصدير PDF' : 'Export PDF'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportToWord} className="cursor-pointer">
                      <FileText className="ml-2 h-4 w-4 text-blue-600" />
                      <span>{language === 'ar' ? 'تصدير Word' : 'Export Word'}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {contracts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            {language === 'ar' ? 'لا توجد عقود' : 'No contracts found'}
          </div>
        ) : (
          <div className="border-4 border-black rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-yellow-100 border-b-4 border-black">
                  <TableHead className="text-center border-r-2 border-black font-bold text-black">
                    {language === 'ar' ? 'م' : '#'}
                  </TableHead>
                  <TableHead className="text-center border-r-2 border-black font-bold text-black">
                    {language === 'ar' ? 'رقم العقد' : 'Contract No'}
                  </TableHead>
                  <TableHead className="text-center border-r-2 border-black font-bold text-black">
                    {language === 'ar' ? 'اسم المشروع' : 'Project Name'}
                  </TableHead>
                  <TableHead className="text-center border-r-2 border-black font-bold text-black">
                    {language === 'ar' ? 'اسم المقاول' : 'Contractor'}
                  </TableHead>
                  <TableHead className="text-center border-r-2 border-black font-bold text-black">
                    {language === 'ar' ? 'السنة' : 'Year'}
                  </TableHead>
                  <TableHead className="text-center border-r-2 border-black font-bold text-black">
                    {language === 'ar' ? 'الشهر' : 'Month'}
                  </TableHead>
                  <TableHead className="text-center border-r-2 border-black font-bold text-black">
                    {language === 'ar' ? 'درجة أداء المقاول' : 'Contractor Score'}
                  </TableHead>
                  <TableHead className="text-center border-r-2 border-black font-bold text-black">
                    {language === 'ar' ? 'المرجح للعام' : 'Yearly Weighted'}
                  </TableHead>
                  <TableHead className="text-center border-r-2 border-black font-bold text-black">
                    {language === 'ar' ? 'الفرق' : 'Difference'}
                  </TableHead>
                  {canEdit && (
                    <TableHead className="text-center font-bold text-black">
                      {language === 'ar' ? 'الإجراءات' : 'Actions'}
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract, index) => (
                  <TableRow key={contract.id} className="border-b-2 border-black">
                    <TableCell className="text-center border-r-2 border-black bg-yellow-50 font-bold">
                      {index + 1}
                    </TableCell>
                    <TableCell className="text-center border-r-2 border-black font-semibold">
                      {contract.contractNumber}
                    </TableCell>
                    <TableCell className="text-center border-r-2 border-black">
                      {contract.projectName}
                    </TableCell>
                    <TableCell className="text-center border-r-2 border-black">
                      {contract.contractorName}
                    </TableCell>
                    <TableCell className="text-center border-r-2 border-black font-bold">
                      {contract.year}
                    </TableCell>
                    <TableCell className="text-center border-r-2 border-black font-semibold">
                      {contract.month}
                    </TableCell>
                    <TableCell className="text-center border-r-2 border-black font-bold">
                      {parseFloat(contract.contractorScore).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center border-r-2 border-black font-bold">
                      {parseFloat(contract.yearlyWeighted).toFixed(2)}
                    </TableCell>
                    <TableCell className={`text-center border-r-2 border-black font-bold text-lg ${getCellColor(parseFloat(contract.difference))}`}>
                      {parseFloat(contract.difference) > 0 ? '+' : ''}{parseFloat(contract.difference).toFixed(2)}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(contract)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(contract.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};