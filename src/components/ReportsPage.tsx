import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getServerUrl } from '../utils/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { Download, Filter, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
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
  deviation: number;
  status: string;
  projectType: string;
  hostName: string;
}

export const ReportsPage: React.FC = () => {
  const { accessToken } = useAuth();
  const { language } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all-regions');
  const [statusFilter, setStatusFilter] = useState<string>('all-status');
  const [typeFilter, setTypeFilter] = useState<string>('all-types');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [projects, selectedYear, regionFilter, statusFilter, typeFilter]);

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
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...projects];

    if (selectedYear !== 'all') {
      filtered = filtered.filter(p => p.year.toString() === selectedYear);
    }

    if (regionFilter && regionFilter !== 'all-regions') {
      filtered = filtered.filter(p => p.region === regionFilter);
    }

    if (statusFilter && statusFilter !== 'all-status') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (typeFilter && typeFilter !== 'all-types') {
      filtered = filtered.filter(p => p.projectType === typeFilter);
    }

    setFilteredProjects(filtered);
  };

  const clearFilters = () => {
    setSelectedYear('all');
    setRegionFilter('all-regions');
    setStatusFilter('all-status');
    setTypeFilter('all-types');
  };

  const getStatusColorForExcel = (status: string): string => {
    switch (status) {
      case 'منجز': return '22C55E';
      case 'جاري': 
      case 'جاري العمل': return '3B82F6';
      case 'متأخر': return 'EF4444';
      case 'متقدم': return '16A34A';
      case 'متعثر': return 'DC2626';
      case 'متوقف': return '6B7280';
      case 'تم الرفع بالاستلام الابتدائي': return '9CA3AF';
      case 'تم الاستلام النهائي': return '059669';
      default: return '6B7280';
    }
  };

  const exportToExcel = async () => {
    try {
      // استخدام xlsx العادية
      const XLSX = await import('xlsx');
      
      if (filteredProjects.length === 0) {
        alert(language === 'ar' ? 'لا توجد بيانات للتصدير' : 'No data to export');
        return;
      }
      
      const excelData = filteredProjects.map((p, index) => ({
        'م': index + 1,
        [language === 'ar' ? 'رقم أمر العمل' : 'Work Order No']: p.workOrderNumber || '-',
        [language === 'ar' ? 'رقم العقد' : 'Contract No']: p.contractNumber || '-',
        [language === 'ar' ? 'السنة' : 'Year']: p.year || '-',
        [language === 'ar' ? 'النوع' : 'Type']: p.projectType || '-',
        [language === 'ar' ? 'رقم الطريق' : 'Road No']: p.roadNumber || '-',
        [language === 'ar' ? 'اسم الطريق' : 'Road Name']: p.roadName || '-',
        [language === 'ar' ? 'وصف أمر العمل' : 'Work Description']: p.workOrderDescription || '-',
        [language === 'ar' ? 'المدة (شهور)' : 'Duration (months)']: p.duration || 0,
        [language === 'ar' ? 'تاريخ التسليم' : 'Handover Date']: p.siteHandoverDate || '-',
        [language === 'ar' ? 'تاريخ النهاية' : 'End Date']: p.contractEndDate || '-',
        [language === 'ar' ? 'قيمة المشروع (ريال)' : 'Project Value (SAR)']: (p.projectValue || 0).toLocaleString('en-US') + ' ر.س',
        [language === 'ar' ? 'النسبة المخططة %' : 'Planned %']: (p.progressPlanned || 0).toFixed(2) + '%',
        [language === 'ar' ? 'النسبة الفعلية %' : 'Actual %']: (p.progressActual || 0).toFixed(2) + '%',
        [language === 'ar' ? 'التقدم/التأخير %' : 'Deviation %']: ((p.deviation || 0) >= 0 ? '+' : '') + (p.deviation || 0).toFixed(2) + '%',
        [language === 'ar' ? 'الحالة' : 'Status']: p.status || '-',
        [language === 'ar' ? 'المنطقة' : 'Region']: p.region || '-',
        [language === 'ar' ? 'الفرع' : 'Branch']: p.branch || '-',
        [language === 'ar' ? 'المضيف' : 'Host']: p.hostName || '-',
      }));
      
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // تعيين عرض الأعمدة
      ws['!cols'] = [
        { wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 8 }, { wch: 12 }, { wch: 12 },
        { wch: 30 }, { wch: 45 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
      ];
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, language === 'ar' ? 'بيان نسب الإنجاز' : 'Progress Report');
      
      const fileName = `${language === 'ar' ? 'بيان_نسب_الإنجاز' : 'progress_report'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      alert(language === 'ar' ? 'تم تصدير ملف Excel بنجاح' : 'Excel file exported successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert(language === 'ar' ? 'فشل تصدير ملف Excel' : 'Failed to export Excel file');
    }
  };

  const exportToPDF = async () => {
    try {
      // إنشاء iframe معزول بعرض كبير
      const iframe = document.createElement('iframe');
      iframe.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 2200px;
        height: 1400px;
        border: none;
      `;
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error('فشل في إنشاء المستند');
      
      const getStatusBgColor = (status: string): string => {
        const map: Record<string, string> = {
          'منجز': '#22c55e',
          'جاري': '#3b82f6',
          'جاري العمل': '#3b82f6',
          'متأخر': '#ef4444',
          'متقدم': '#16a34a',
          'متعثر': '#dc2626',
          'متوقف': '#6b7280',
          'تم الرفع بالاستلام الابتدائي': '#9ca3af',
          'تم الاستلام النهائي': '#059669'
        };
        return map[status] || '#6b7280';
      };
      
      const getDeviationColor = (deviation: number): string => {
        if (deviation >= 0) return '#22c55e';
        if (deviation >= -5) return '#fbbf24';
        return '#ef4444';
      };
      
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
              font-family: Arial, sans-serif;
              background: #ffffff;
              color: #000000;
              padding: 20px;
              direction: rtl;
              width: 2200px;
            }
            
            /* Header */
            .header {
              background: #f97316;
              color: #ffffff;
              text-align: center;
              padding: 20px;
              margin-bottom: 10px;
              border: 2px solid #000000;
            }
            .header h1 {
              font-size: 22px;
              font-weight: bold;
              margin: 0;
            }
            
            /* Table */
            table {
              width: 100%;
              border-collapse: collapse;
              border: 2px solid #000000;
              background: #ffffff;
            }
            
            th {
              background: #f97316;
              color: #ffffff;
              font-weight: bold;
              font-size: 10px;
              padding: 12px 5px;
              text-align: center;
              border: 1px solid #000000;
              vertical-align: middle;
            }
            
            td {
              padding: 8px 5px;
              text-align: center;
              border: 1px solid #000000;
              font-size: 9px;
              vertical-align: middle;
              background: #ffffff;
            }
            
            .text-right {
              text-align: right;
              padding-right: 8px;
            }
            
            .text-bold {
              font-weight: bold;
            }
            
            /* حالة المشروع */
            .status-badge {
              padding: 5px 10px;
              border-radius: 4px;
              color: #ffffff;
              font-weight: bold;
              font-size: 9px;
              display: inline-block;
            }
            
            /* Footer */
            .footer {
              background: #dbeafe;
              border: 2px solid #000000;
              padding: 15px;
              margin-top: 10px;
              text-align: center;
            }
            .footer-total {
              font-size: 14px;
              font-weight: bold;
              color: #000000;
            }
            
            /* Index column */
            .index-col {
              background: #fef3c7 !important;
              font-weight: bold;
            }
            
            /* Deviation colors */
            .deviation-positive {
              color: #22c55e;
              font-weight: bold;
            }
            .deviation-neutral {
              color: #fbbf24;
              font-weight: bold;
            }
            .deviation-negative {
              color: #ef4444;
              font-weight: bold;
            }
            
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>بيان نسب الإنجاز في أوامر العمل (عدد ${filteredProjects.length}) - ${new Date().getFullYear()}</h1>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 2.5%;">م</th>
                <th style="width: 12%;">وصف العمل</th>
                <th style="width: 6%;">رقم العمل</th>
                <th style="width: 6%;">رقم العقد</th>
                <th style="width: 5%;">نوع المشروع</th>
                <th style="width: 8%;">اسم الطريق</th>
                <th style="width: 6%;">المنطقة</th>
                <th style="width: 6%;">الفرع</th>
                <th style="width: 4%;">السنة</th>
                <th style="width: 6%;">رقم المشروع</th>
                <th style="width: 7%;">قيمة العقد (ريال)</th>
                <th style="width: 4%;">المدة</th>
                <th style="width: 6%;">تاريخ التسليم</th>
                <th style="width: 6%;">نهاية المدة</th>
                <th style="width: 4.5%;">المخطط %</th>
                <th style="width: 4.5%;">الفعلي %</th>
                <th style="width: 4.5%;">الانحراف %</th>
                <th style="width: 5%;">الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${filteredProjects.map((p, index) => {
                const statusBgColor = getStatusBgColor(p.status);
                const deviationValue = p.deviation || 0;
                const deviationClass = deviationValue >= 0 ? 'deviation-positive' : 
                                      deviationValue >= -5 ? 'deviation-neutral' : 'deviation-negative';
                
                return `
                  <tr>
                    <td class="index-col text-bold">${index + 1}</td>
                    <td class="text-right">${p.workOrderDescription || 'غير محدد'}</td>
                    <td class="text-bold">${p.workOrderNumber || 'غير محدد'}</td>
                    <td class="text-bold">${p.contractNumber || 'غير محدد'}</td>
                    <td>${p.projectType || 'غير محدد'}</td>
                    <td>${p.roadName || 'غير محدد'}</td>
                    <td>${p.region || 'غير محدد'}</td>
                    <td>${p.branch || 'غير محدد'}</td>
                    <td class="text-bold">${p.year || 'غير محدد'}</td>
                    <td>${p.projectNumber || 'غير محدد'}</td>
                    <td class="text-bold" dir="ltr">${(p.projectValue || 0).toLocaleString('en-US')} ر.س</td>
                    <td class="text-bold">${p.duration || 0} شهر</td>
                    <td>${p.siteHandoverDate || 'غير محدد'}</td>
                    <td>${p.contractEndDate || 'غير محدد'}</td>
                    <td class="text-bold">${(p.progressPlanned || 0).toFixed(2)}%</td>
                    <td class="text-bold">${(p.progressActual || 0).toFixed(2)}%</td>
                    <td class="${deviationClass}">${deviationValue > 0 ? '+' : ''}${deviationValue.toFixed(2)}%</td>
                    <td><span class="status-badge" style="background: ${statusBgColor};">${p.status || 'غير محدد'}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <div class="footer-total">
              الإجمالي (ريال): ${filteredProjects.reduce((sum, p) => sum + (p.projectValue || 0), 0).toLocaleString('en-US')}
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 15px; font-size: 11px; color: #666;">
            الهيئة العامة للطرق - المملكة العربية السعودية 🇸🇦 | تاريخ الإصدار: ${new Date().toLocaleDateString('ar-SA')}
          </div>
        </body>
        </html>
      `);
      iframeDoc.close();
      
      // انتظار تحميل المحتوى
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // تحويل iframe body إلى canvas
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 2200,
        windowHeight: iframeDoc.body.scrollHeight,
      });
      
      // إزالة iframe
      document.body.removeChild(iframe);
      
      // تحويل Canvas إلى صورة
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // إنشاء PDF بتوجيه landscape بحجم A3
      const jsPDF = (await import('jspdf')).default;
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3',
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // حساب أبعاد الصورة
      const imgWidth = pageWidth - 10;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // إضافة الصورة
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
      
      pdf.save(`بيان_نسب_الإنجاز_${new Date().toISOString().split('T')[0]}.pdf`);
      alert(language === 'ar' ? '✅ تم تصدير PDF بنجاح!' : '✅ PDF exported successfully!');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert(language === 'ar' ? 'فشل تصدير PDF - حاول مرة أخرى' : 'PDF export failed - try again');
    }
  };

  const exportToWord = async () => {
    try {
      const docx = await import('docx');
      const { Document, Paragraph, TextRun, Table, TableCell, TableRow, AlignmentType, WidthType, ShadingType } = docx;
      
      const getStatusColor = (status: string): string => {
        const map: Record<string, string> = {
          'منجز': '22C55E', 'جاري': '3B82F6', 'جاري العمل': '3B82F6', 'متأخر': 'EF4444',
          'متقدم': '16A34A', 'متعثر': 'DC2626', 'متوقف': '6B7280',
          'تم الرفع بالاستلام الابتدائي': '9CA3AF', 'تم الاستلام النهائي': '059669'
        };
        return map[status] || '6B7280';
      };
      
      const children: any[] = [
        new Paragraph({
          children: [new TextRun({ text: 'الهيئة العامة للطرق 🇸🇦', bold: true, size: 32, color: '006C35' })],
          alignment: AlignmentType.CENTER, spacing: { after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: 'بيان نسب الإنجاز', bold: true, size: 28, color: '1F2937' })],
          alignment: AlignmentType.CENTER, spacing: { after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `تاريخ الإصدار: ${new Date().toLocaleDateString('ar-SA')}`, size: 20, color: '6B7280' })],
          alignment: AlignmentType.CENTER, spacing: { after: 400 },
        })
      ];
      
      if (filteredProjects.length > 0) {
        const tableRows: TableRow[] = [];
        
        const headers = ['م', 'رقم أمر العمل', 'رقم العقد', 'السنة', 'النوع', 'رقم الطريق', 'اسم الطريق', 'وصف أمر العمل', 
          'المدة', 'تاريخ التسليم', 'تاريخ النهاية', 'قيمة المشروع (ريال)', 'المخططة %', 'الفعلية %', 'الانحراف %', 'الحالة', 'المنطقة'];
        const widths = [3, 7, 7, 4, 6, 6, 12, 15, 4, 6, 6, 7, 5, 5, 5, 6, 6];
        
        tableRows.push(new TableRow({
          children: headers.map((h, i) => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: h, color: 'FFFFFF', bold: true })], alignment: AlignmentType.CENTER })],
            shading: { fill: '006C35', type: ShadingType.CLEAR },
            width: { size: widths[i], type: WidthType.PERCENTAGE },
          }))
        }));
        
        filteredProjects.forEach((project, index) => {
          const statusColor = getStatusColor(project.status);
          const isEven = index % 2 === 0;
          const bg = isEven ? 'F9FAFB' : 'FFFFFF';
          
          const cells = [
            (index + 1).toString(),
            project.workOrderNumber || '-',
            project.contractNumber || '-',
            (project.year || '-').toString(),
            project.projectType || '-',
            project.roadNumber || '-',
            project.roadName || '-',
            project.workOrderDescription || '-',
            (project.duration || 0).toString(),
            project.siteHandoverDate || '-',
            project.contractEndDate || '-',
            (project.projectValue || 0).toLocaleString('en-US') + ' ر.س',
            (project.progressPlanned || 0).toFixed(2) + '%',
            (project.progressActual || 0).toFixed(2) + '%',
            ((project.deviation || 0) >= 0 ? '+' : '') + (project.deviation || 0).toFixed(2) + '%'
          ];
          
          tableRows.push(new TableRow({
            children: [
              ...cells.map((text, i) => new TableCell({
                children: [new Paragraph({ text, alignment: (i === 6 || i === 7) ? AlignmentType.RIGHT : AlignmentType.CENTER })],
                shading: { fill: bg, type: ShadingType.CLEAR },
              })),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: project.status || '-', bold: true, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
                shading: { fill: statusColor, type: ShadingType.CLEAR },
              }),
              new TableCell({
                children: [new Paragraph({ text: project.region || '-', alignment: AlignmentType.CENTER })],
                shading: { fill: bg, type: ShadingType.CLEAR },
              })
            ]
          }));
        });
        
        children.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
        
        children.push(
          new Paragraph({
            children: [new TextRun({ text: '\n\nالهيئة العامة للطرق - المملكة العربية السعودية 🇸🇦', bold: true, size: 20, color: '6B7280' })],
            alignment: AlignmentType.CENTER, spacing: { before: 400 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `جميع الحقوق محفوظة © ${new Date().getFullYear()}`, size: 18, color: '9CA3AF' })],
            alignment: AlignmentType.CENTER,
          })
        );
      }
      
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: { top: 720, right: 720, bottom: 720, left: 720 },
              size: { orientation: docx.PageOrientation.LANDSCAPE, width: 16838, height: 11906 },
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
      link.download = `بيان_سب_الإنجاز_${new Date().toISOString().split('T')[0]}.docx`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      alert('تم تصدير ملف Word بنجاح');
    } catch (error) {
      console.error('Error exporting to Word:', error);
      alert('فشل تصدير ملف Word');
    }
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      'منجز': 'bg-green-500', 'جاري': 'bg-blue-500', 'جاري العمل': 'bg-blue-500', 'متأخر': 'bg-red-500',
      'متقدم': 'bg-green-600', 'متعثر': 'bg-red-600', 'متوقف': 'bg-gray-600',
      'تم الرفع بالاستلام الابتدائي': 'bg-gray-400', 'تم الاستلام النهائي': 'bg-emerald-600'
    };
    return map[status] || 'bg-gray-500';
  };

  const getDeviationColor = (deviation: number) => {
    if (deviation >= 0) return 'text-green-600';
    if (deviation >= -5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const uniqueYears = Array.from(new Set(projects.map(p => p.year).filter(Boolean))).sort((a, b) => b - a);
  const uniqueRegions = Array.from(new Set(projects.map(p => p.region).filter(Boolean))).sort();

  if (loading) {
    return <Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-96 w-full" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{language === 'ar' ? 'بيان نسب الإنجاز' : 'Progress Report'}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70">
                <Download className="ml-2 h-4 w-4" />
                {language === 'ar' ? 'تصدير التقرير' : 'Export Report'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" dir={language === 'ar' ? 'rtl' : 'ltr'} className="w-48">
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
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 items-end bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center gap-2"><Filter className="h-5 w-5 text-muted-foreground" /><span>{language === 'ar' ? 'الفلاتر:' : 'Filters:'}</span></div>
          <div className="flex-1 min-w-[150px]">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder={language === 'ar' ? 'السنة' : 'Year'} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
                {uniqueYears.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger><SelectValue placeholder={language === 'ar' ? 'المنطقة' : 'Region'} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all-regions">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
                {uniqueRegions.map(region => <SelectItem key={region} value={region}>{region}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder={language === 'ar' ? 'الحالة' : 'Status'} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all-status">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
                {['جاري العمل', 'منجز', 'متأخر', 'متقدم', 'متعثر', 'متوقف', 'تم الرفع بالاستلام الابتدائي', 'تم الاستلام النهائي'].map(s =>
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger><SelectValue placeholder={language === 'ar' ? 'النوع' : 'Type'} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all-types">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
                <SelectItem value="تنفيذ">تنفيذ</SelectItem>
                <SelectItem value="صيانة">صيانة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={clearFilters} variant="ghost">{language === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-primary/10 p-4 rounded-lg"><div className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي المشاريع' : 'Total Projects'}</div><div className="text-2xl">{filteredProjects.length}</div></div>
          <div className="bg-green-500/10 p-4 rounded-lg"><div className="text-sm text-muted-foreground">{language === 'ar' ? 'منجز' : 'Completed'}</div><div className="text-2xl">{filteredProjects.filter(p => p.status === 'منجز').length}</div></div>
          <div className="bg-blue-500/10 p-4 rounded-lg"><div className="text-sm text-muted-foreground">{language === 'ar' ? 'جاري' : 'Ongoing'}</div><div className="text-2xl">{filteredProjects.filter(p => p.status === 'جاري' || p.status === 'جاري العمل').length}</div></div>
          <div className="bg-red-500/10 p-4 rounded-lg"><div className="text-sm text-muted-foreground">{language === 'ar' ? 'متأخر' : 'Delayed'}</div><div className="text-2xl">{filteredProjects.filter(p => p.status === 'متأخر').length}</div></div>
        </div>

        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {['وصف العمل', 'رقم العمل', 'رقم العقد', 'نوع المشروع', 'اسم الطريق', 'المنطقة', 'الفرع', 'السنة', 'رقم المشروع', 'قيمة العقد (ريال)', 'المدة', 'تاريخ التسليم', 'نهاية المدة', 'المخطط %', 'الفعلي %', 'الانحراف %', 'الحالة'].map(h =>
                  <TableHead key={h} className="text-center min-w-[200px]">{language === 'ar' ? h : h}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length === 0 ? (
                <TableRow><TableCell colSpan={17} className="text-center py-8 text-muted-foreground">{language === 'ar' ? 'لا توجد مشاريع' : 'No projects found'}</TableCell></TableRow>
              ) : (
                filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="text-right">{project.workOrderDescription || 'غير محدد'}</TableCell>
                    <TableCell className="text-center">{project.workOrderNumber || 'غير محدد'}</TableCell>
                    <TableCell className="text-center">{project.contractNumber || 'غير محدد'}</TableCell>
                    <TableCell className="text-center">{project.projectType || 'غير محدد'}</TableCell>
                    <TableCell className="text-center">{project.roadName || 'غير محدد'}</TableCell>
                    <TableCell className="text-center">{project.region || 'غير محدد'}</TableCell>
                    <TableCell className="text-center">{project.branch || 'غير محدد'}</TableCell>
                    <TableCell className="text-center">{project.year || 'غير محدد'}</TableCell>
                    <TableCell className="text-center">{project.projectNumber || 'غير محدد'}</TableCell>
                    <TableCell className="text-center" dir="ltr">{(project.projectValue || 0).toLocaleString('en-US')} ر.س</TableCell>
                    <TableCell className="text-center">{project.duration || 0} {language === 'ar' ? 'شهر' : 'month'}</TableCell>
                    <TableCell className="text-center">{project.siteHandoverDate || 'غير محدد'}</TableCell>
                    <TableCell className="text-center">{project.contractEndDate || 'غير محدد'}</TableCell>
                    <TableCell className="text-center">{(project.progressPlanned || 0).toFixed(2)}%</TableCell>
                    <TableCell className="text-center">{(project.progressActual || 0).toFixed(2)}%</TableCell>
                    <TableCell className={`text-center ${getDeviationColor(project.deviation || 0)}`}>{(project.deviation || 0) > 0 ? '+' : ''}{(project.deviation || 0).toFixed(2)}%</TableCell>
                    <TableCell className="text-center"><Badge className={getStatusColor(project.status)}>{project.status}</Badge></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};