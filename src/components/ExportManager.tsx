import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Download, FileText, Table, FileSpreadsheet, Printer, Mail, CheckCircle, FileDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from './AuthContext';
import { getServerUrl } from '../utils/supabase-client';
import { toast } from 'sonner@2.0.3';

interface ExportOptions {
  format: 'pdf' | 'excel' | 'word' | 'csv';
  type: 'projects' | 'daily-reports' | 'full-report';
  includeCharts: boolean;
  includePhotos: boolean;
  includeSignatures: boolean;
  dateRange: 'all' | 'month' | 'quarter' | 'year';
}

export const ExportManager: React.FC = () => {
  const { language } = useLanguage();
  const { accessToken } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [options, setOptions] = useState<ExportOptions>({
    format: 'excel',
    type: 'projects',
    includeCharts: true,
    includePhotos: false,
    includeSignatures: true,
    dateRange: 'all'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch projects
      const projectsResponse = await fetch(getServerUrl('/projects'), {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (projectsResponse.ok) {
        const data = await projectsResponse.json();
        console.log('Projects fetched for export:', data.projects);
        setProjects(data.projects || []);
      }

      // Fetch daily reports
      const reportsResponse = await fetch(getServerUrl('/daily-reports'), {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (reportsResponse.ok) {
        const data = await reportsResponse.json();
        console.log('Reports fetched for export:', data.reports);
        setDailyReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const filterDataByDateRange = (data: any[], dateField: string = 'createdAt') => {
    const now = new Date();
    
    if (options.dateRange === 'all') return data;
    
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      
      if (options.dateRange === 'month') {
        return itemDate.getMonth() === now.getMonth() && 
               itemDate.getFullYear() === now.getFullYear();
      }
      
      if (options.dateRange === 'quarter') {
        const quarter = Math.floor(now.getMonth() / 3);
        const itemQuarter = Math.floor(itemDate.getMonth() / 3);
        return itemQuarter === quarter && itemDate.getFullYear() === now.getFullYear();
      }
      
      if (options.dateRange === 'year') {
        return itemDate.getFullYear() === now.getFullYear();
      }
      
      return true;
    });
  };

  const exportToExcel = async () => {
    try {
      console.log('Starting Excel export...');
      console.log('Projects data:', projects);
      console.log('Daily reports data:', dailyReports);
      
      const XLSX = await import('xlsx');
      
      if (options.type === 'projects') {
        const filteredProjects = filterDataByDateRange(projects);
        console.log('Filtered projects:', filteredProjects);
        
        if (filteredProjects.length === 0) {
          toast.error(language === 'ar' ? 'لا توجد بيانات للتصدير' : 'No data to export');
          return;
        }
        
        // تحضير البيانات بالعربية
        const excelData = filteredProjects.map((p, index) => ({
          'م': index + 1,
          'رقم أمر العمل': p.workOrderNumber || '-',
          'رقم العقد': p.contractNumber || '-',
          'السنة': p.year || '-',
          'النوع': p.projectType || '-',
          'رقم الطريق': p.roadNumber || '-',
          'اسم الطريق': p.roadName || '-',
          'وصف أمر العمل': p.workOrderDescription || '-',
          'المدة': p.duration || 0,
          'تاريخ التسليم': p.siteHandoverDate || '-',
          'تاريخ النهاية': p.contractEndDate || '-',
          'قيمة المشروع': p.projectValue || 0,
          'النسبة المخططة %': p.progressPlanned || 0,
          'النسبة الفعلية %': p.progressActual || 0,
          'التقدم/التأخير %': p.deviation || 0,
          'الحالة': p.status || '-',
          'المنطقة': p.region || '-',
          'الفرع': p.branch || '-',
          'الملاحظات': p.notes || '-',
        }));
        
        console.log('Excel data prepared:', excelData);
        
        // إنشاء worksheet
        const ws = XLSX.utils.json_to_sheet(excelData);
        
        // تعيين عرض الأعمدة
        ws['!cols'] = [
          { wch: 5 },  // م
          { wch: 15 }, // رقم أمر العمل
          { wch: 15 }, // رقم العقد
          { wch: 8 },  // السنة
          { wch: 10 }, // النوع
          { wch: 12 }, // رقم الطريق
          { wch: 30 }, // اسم الطريق
          { wch: 40 }, // وصف أمر العمل
          { wch: 10 }, // المدة
          { wch: 15 }, // تاريخ التسليم
          { wch: 15 }, // تاريخ النهاية
          { wch: 15 }, // قيمة المشروع
          { wch: 15 }, // النسبة المخططة
          { wch: 15 }, // النسبة الفعلية
          { wch: 15 }, // التقدم/التأخير
          { wch: 20 }, // الحالة
          { wch: 15 }, // المنطقة
          { wch: 15 }, // الفرع
          { wch: 30 }, // الملاحظات
        ];
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'بيان نسب الإنجاز');
        
        const fileName = `بيان_نسب_الإنجاز_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        toast.success(language === 'ar' ? 'تم تصدير ملف Excel بنجاح' : 'Excel file exported successfully');
        
      } else if (options.type === 'daily-reports') {
        const filteredReports = filterDataByDateRange(dailyReports, 'reportDate');
        console.log('Filtered reports:', filteredReports);
        
        if (filteredReports.length === 0) {
          toast.error(language === 'ar' ? 'لا توجد تقارير للتصدير' : 'No reports to export');
          return;
        }
        
        const excelData = filteredReports.map((r, index) => ({
          'م': index + 1,
          'التاريخ': r.reportDate || '-',
          'المشروع': r.projectName || '-',
          'وصف الأعمال': r.workDescription || '-',
          'عدد العمال': r.workersCount || 0,
          'المعدات': r.equipment || '-',
          'التقدم اليومي %': r.dailyProgress || 0,
          'حالة الطقس': r.weatherCondition || '-',
          'المشاكل': r.issues || '-',
          'الملاحظات': r.notes || '-',
        }));
        
        const ws = XLSX.utils.json_to_sheet(excelData);
        
        ws['!cols'] = [
          { wch: 5 },  // م
          { wch: 15 }, // التاريخ
          { wch: 25 }, // المشروع
          { wch: 50 }, // وصف الأعمال
          { wch: 12 }, // عدد العمال
          { wch: 30 }, // المعدات
          { wch: 15 }, // التقدم اليومي
          { wch: 15 }, // حالة الطقس
          { wch: 30 }, // المشاكل
          { wch: 30 }, // الملاحظات
        ];
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'التقارير اليومية');
        
        const fileName = `التقارير_اليومية_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        toast.success(language === 'ar' ? 'تم تصدير التقارير اليومية بنجاح' : 'Daily reports exported successfully');
        
      } else {
        // Full report with both sheets
        const filteredProjects = filterDataByDateRange(projects);
        const filteredReports = filterDataByDateRange(dailyReports, 'reportDate');
        
        const wb = XLSX.utils.book_new();
        
        // Projects sheet
        if (filteredProjects.length > 0) {
          const projectsData = filteredProjects.map((p, index) => ({
            'م': index + 1,
            'رقم أمر العمل': p.workOrderNumber || '-',
            'رقم العقد': p.contractNumber || '-',
            'اسم الطريق': p.roadName || '-',
            'النسبة الفعلية %': p.progressActual || 0,
            'النسبة المخططة %': p.progressPlanned || 0,
            'التقدم/التأخير %': p.deviation || 0,
            'الحالة': p.status || '-',
            'المنطقة': p.region || '-',
          }));
          
          const ws1 = XLSX.utils.json_to_sheet(projectsData);
          ws1['!cols'] = [
            { wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, 
            { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }
          ];
          
          XLSX.utils.book_append_sheet(wb, ws1, 'بيان نسب الإنجاز');
        }
        
        // Reports sheet
        if (filteredReports.length > 0) {
          const reportsData = filteredReports.map((r, index) => ({
            'م': index + 1,
            'التاريخ': r.reportDate || '-',
            'المشروع': r.projectName || '-',
            'وصف الأعمال': r.workDescription || '-',
            'التقدم اليومي %': r.dailyProgress || 0,
            'عدد العمال': r.workersCount || 0,
          }));
          
          const ws2 = XLSX.utils.json_to_sheet(reportsData);
          ws2['!cols'] = [
            { wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 50 }, { wch: 15 }, { wch: 12 }
          ];
          
          XLSX.utils.book_append_sheet(wb, ws2, 'التقارير اليومية');
        }
        
        const fileName = `تقرير_شامل_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        toast.success(language === 'ar' ? 'تم تصدير التقرير الشامل بنجاح' : 'Full report exported successfully');
      }
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error(language === 'ar' ? 'فشل تصدير ملف Excel' : 'Failed to export Excel file');
      throw error;
    }
  };

  const exportToPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      
      const doc = new jsPDF('l', 'mm', 'a4'); // landscape orientation
      
      // Header - بدون SA
      doc.setFontSize(20);
      doc.text(
        language === 'ar' ? 'الهيئة العامة للطرق 🇸🇦' : 'Roads General Authority 🇸🇦',
        doc.internal.pageSize.getWidth() / 2,
        20,
        { align: 'center' }
      );
      
      doc.setFontSize(16);
      doc.text(
        language === 'ar' ? 'بيان نسب الإنجاز' : 'Progress Report',
        doc.internal.pageSize.getWidth() / 2,
        30,
        { align: 'center' }
      );
      
      doc.setFontSize(10);
      doc.text(
        `${language === 'ar' ? 'تاريخ الإنشاء:' : 'Generated:'} ${new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}`,
        doc.internal.pageSize.getWidth() / 2,
        37,
        { align: 'center' }
      );
      
      if (options.type === 'projects') {
        const filteredProjects = filterDataByDateRange(projects);
        
        if (filteredProjects.length === 0) {
          doc.setFontSize(14);
          doc.text(language === 'ar' ? 'لا توجد مشاريع للعرض' : 'No projects to display', 20, 50);
        } else {
          const tableData = filteredProjects.map((p, index) => [
            (index + 1).toString(),
            p.workOrderNumber || '-',
            p.roadName || '-',
            p.projectType || '-',
            (p.progressPlanned || 0) + '%',
            (p.progressActual || 0) + '%',
            (p.deviation || 0) + '%',
            p.status || '-',
          ]);
          
          (doc as any).autoTable({
            startY: 45,
            head: [[
              language === 'ar' ? 'م' : '#',
              language === 'ar' ? 'رقم أمر العمل' : 'Work Order',
              language === 'ar' ? 'اسم الطريق' : 'Road Name',
              language === 'ar' ? 'النوع' : 'Type',
              language === 'ar' ? 'المخططة %' : 'Planned %',
              language === 'ar' ? 'الفعلية %' : 'Actual %',
              language === 'ar' ? 'الانحراف %' : 'Deviation %',
              language === 'ar' ? 'الحالة' : 'Status',
            ]],
            body: tableData,
            styles: {
              font: 'helvetica',
              fontSize: 9,
              cellPadding: 3,
            },
            headStyles: {
              fillColor: [0, 108, 53], // Saudi green
              textColor: 255,
              fontStyle: 'bold',
            },
            alternateRowStyles: {
              fillColor: [245, 245, 245],
            },
            margin: { top: 45, left: 10, right: 10 },
          });
        }
      } else if (options.type === 'daily-reports') {
        const filteredReports = filterDataByDateRange(dailyReports, 'reportDate');
        
        if (filteredReports.length === 0) {
          doc.setFontSize(14);
          doc.text(language === 'ar' ? 'لا توجد تقارير للعرض' : 'No reports to display', 20, 50);
        } else {
          const tableData = filteredReports.map((r, index) => [
            (index + 1).toString(),
            r.reportDate || '-',
            r.projectName || '-',
            r.workDescription?.substring(0, 50) + '...' || '-',
            (r.workersCount || 0).toString(),
            (r.dailyProgress || 0) + '%',
          ]);
          
          (doc as any).autoTable({
            startY: 45,
            head: [[
              language === 'ar' ? 'م' : '#',
              language === 'ar' ? 'التاريخ' : 'Date',
              language === 'ar' ? 'المشروع' : 'Project',
              language === 'ar' ? 'وصف الأعمال' : 'Work Description',
              language === 'ar' ? 'العمال' : 'Workers',
              language === 'ar' ? 'التقدم %' : 'Progress %',
            ]],
            body: tableData,
            styles: {
              font: 'helvetica',
              fontSize: 9,
              cellPadding: 3,
            },
            headStyles: {
              fillColor: [0, 108, 53],
              textColor: 255,
              fontStyle: 'bold',
            },
            alternateRowStyles: {
              fillColor: [245, 245, 245],
            },
            margin: { top: 45, left: 10, right: 10 },
          });
        }
      }
      
      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `${language === 'ar' ? 'صفحة' : 'Page'} ${i} ${language === 'ar' ? 'من' : 'of'} ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
      
      const fileName = `${language === 'ar' ? 'بيان_نسب_الإنجاز' : 'progress_report'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast.success(language === 'ar' ? 'تم تصدير ملف PDF بنجاح' : 'PDF file exported successfully');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error(language === 'ar' ? 'فشل تصدير ملف PDF' : 'Failed to export PDF file');
      throw error;
    }
  };

  const exportToWord = async () => {
    try {
      const docx = await import('docx');
      const { Document, Paragraph, TextRun, Table, TableCell, TableRow, AlignmentType, WidthType, BorderStyle } = docx;
      
      const children: any[] = [];
      
      // Header - بدون SA
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: language === 'ar' ? 'الهيئة العامة للطرق 🇸🇦' : 'Roads General Authority 🇸🇦',
              bold: true,
              size: 32,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: language === 'ar' ? 'بيان نسب الإنجاز' : 'Progress Report',
              bold: true,
              size: 28,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `${language === 'ar' ? 'تاريخ الإنشاء:' : 'Generated:'} ${new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}`,
              size: 20,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );
      
      if (options.type === 'projects') {
        const filteredProjects = filterDataByDateRange(projects);
        
        if (filteredProjects.length === 0) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: language === 'ar' ? 'لا توجد مشاريع للعرض' : 'No projects to display',
                  size: 24,
                }),
              ],
              alignment: AlignmentType.CENTER,
            })
          );
        } else {
          // إنشاء جدول للمشاريع
          const tableRows: TableRow[] = [];
          
          // Header row
          tableRows.push(
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: language === 'ar' ? 'م' : '#', alignment: AlignmentType.CENTER })],
                  shading: { fill: '006C35' },
                }),
                new TableCell({
                  children: [new Paragraph({ text: language === 'ar' ? 'رقم أمر العمل' : 'Work Order', alignment: AlignmentType.CENTER })],
                  shading: { fill: '006C35' },
                }),
                new TableCell({
                  children: [new Paragraph({ text: language === 'ar' ? 'اسم الطريق' : 'Road Name', alignment: AlignmentType.CENTER })],
                  shading: { fill: '006C35' },
                }),
                new TableCell({
                  children: [new Paragraph({ text: language === 'ar' ? 'النوع' : 'Type', alignment: AlignmentType.CENTER })],
                  shading: { fill: '006C35' },
                }),
                new TableCell({
                  children: [new Paragraph({ text: language === 'ar' ? 'المخططة %' : 'Planned %', alignment: AlignmentType.CENTER })],
                  shading: { fill: '006C35' },
                }),
                new TableCell({
                  children: [new Paragraph({ text: language === 'ar' ? 'الفعلية %' : 'Actual %', alignment: AlignmentType.CENTER })],
                  shading: { fill: '006C35' },
                }),
                new TableCell({
                  children: [new Paragraph({ text: language === 'ar' ? 'الانحراف %' : 'Deviation %', alignment: AlignmentType.CENTER })],
                  shading: { fill: '006C35' },
                }),
                new TableCell({
                  children: [new Paragraph({ text: language === 'ar' ? 'الحالة' : 'Status', alignment: AlignmentType.CENTER })],
                  shading: { fill: '006C35' },
                }),
              ],
            })
          );
          
          // Data rows
          filteredProjects.forEach((project, index) => {
            tableRows.push(
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ text: project.workOrderNumber || '-', alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ text: project.roadName || '-', alignment: AlignmentType.RIGHT })] }),
                  new TableCell({ children: [new Paragraph({ text: project.projectType || '-', alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ text: (project.progressPlanned || 0) + '%', alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ text: (project.progressActual || 0) + '%', alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ text: (project.deviation || 0) + '%', alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ text: project.status || '-', alignment: AlignmentType.CENTER })] }),
                ],
              })
            );
          });
          
          const projectsTable = new Table({
            rows: tableRows,
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
          });
          
          children.push(projectsTable);
        }
      } else if (options.type === 'daily-reports') {
        const filteredReports = filterDataByDateRange(dailyReports, 'reportDate');
        
        if (filteredReports.length === 0) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: language === 'ar' ? 'لا توجد تقارير للعرض' : 'No reports to display',
                  size: 24,
                }),
              ],
              alignment: AlignmentType.CENTER,
            })
          );
        } else {
          const tableRows: TableRow[] = [];
          
          // Header row
          tableRows.push(
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: language === 'ar' ? 'م' : '#', alignment: AlignmentType.CENTER })],
                  shading: { fill: '006C35' },
                }),
                new TableCell({
                  children: [new Paragraph({ text: language === 'ar' ? 'التاريخ' : 'Date', alignment: AlignmentType.CENTER })],
                  shading: { fill: '006C35' },
                }),
                new TableCell({
                  children: [new Paragraph({ text: language === 'ar' ? 'المشروع' : 'Project', alignment: AlignmentType.CENTER })],
                  shading: { fill: '006C35' },
                }),
                new TableCell({
                  children: [new Paragraph({ text: language === 'ar' ? 'وصف الأعمال' : 'Work Description', alignment: AlignmentType.CENTER })],
                  shading: { fill: '006C35' },
                }),
                new TableCell({
                  children: [new Paragraph({ text: language === 'ar' ? 'العمال' : 'Workers', alignment: AlignmentType.CENTER })],
                  shading: { fill: '006C35' },
                }),
                new TableCell({
                  children: [new Paragraph({ text: language === 'ar' ? 'التقدم %' : 'Progress %', alignment: AlignmentType.CENTER })],
                  shading: { fill: '006C35' },
                }),
              ],
            })
          );
          
          // Data rows
          filteredReports.forEach((report, index) => {
            tableRows.push(
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ text: report.reportDate || '-', alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ text: report.projectName || '-', alignment: AlignmentType.RIGHT })] }),
                  new TableCell({ children: [new Paragraph({ text: report.workDescription || '-', alignment: AlignmentType.RIGHT })] }),
                  new TableCell({ children: [new Paragraph({ text: (report.workersCount || 0).toString(), alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ text: (report.dailyProgress || 0) + '%', alignment: AlignmentType.CENTER })] }),
                ],
              })
            );
          });
          
          const reportsTable = new Table({
            rows: tableRows,
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
          });
          
          children.push(reportsTable);
        }
      }
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: children,
        }],
      });
      
      const { Packer } = docx;
      const blob = await Packer.toBlob(doc);
      
      // Download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${language === 'ar' ? 'بيان_نسب_الإنجاز' : 'progress_report'}_${new Date().toISOString().split('T')[0]}.docx`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(language === 'ar' ? 'تم تصدير ملف Word بنجاح' : 'Word file exported successfully');
    } catch (error) {
      console.error('Error exporting to Word:', error);
      toast.error(language === 'ar' ? 'فشل تصدير ملف Word' : 'Failed to export Word file');
      throw error;
    }
  };

  const exportToCSV = () => {
    try {
      let dataToExport: any[] = [];
      let headers: string[] = [];
      
      if (options.type === 'projects') {
        const filteredProjects = filterDataByDateRange(projects);
        headers = ['م', 'رقم أمر العمل', 'اسم الطريق', 'الحالة', 'النسبة الفعلية %', 'الانحراف %'];
        dataToExport = filteredProjects.map((p, index) => [
          index + 1,
          p.workOrderNumber || '',
          p.roadName || '',
          p.status || '',
          p.progressActual || 0,
          p.deviation || 0,
        ]);
      } else if (options.type === 'daily-reports') {
        const filteredReports = filterDataByDateRange(dailyReports, 'reportDate');
        headers = ['م', 'التاريخ', 'المشروع', 'وصف الأعمال', 'عدد العمال', 'التقدم اليومي %'];
        dataToExport = filteredReports.map((r, index) => [
          index + 1,
          r.reportDate || '',
          r.projectName || '',
          r.workDescription || '',
          r.workersCount || 0,
          r.dailyProgress || 0,
        ]);
      }
      
      let csvContent = headers.join(',') + '\n';
      dataToExport.forEach(row => {
        csvContent += row.map((cell: any) => `"${cell}"`).join(',') + '\n';
      });
      
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `data_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(language === 'ar' ? 'تم تصدير ملف CSV بنجاح' : 'CSV file exported successfully');
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast.error(language === 'ar' ? 'فشل تصدير ملف CSV' : 'Failed to export CSV file');
      throw error;
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      if (options.format === 'excel') {
        await exportToExcel();
      } else if (options.format === 'pdf') {
        await exportToPDF();
      } else if (options.format === 'word') {
        await exportToWord();
      } else if (options.format === 'csv') {
        exportToCSV();
      }
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatOptions = [
    {
      value: 'excel',
      label: 'Excel',
      icon: <FileSpreadsheet className="h-6 w-6" />,
      description: language === 'ar' ? 'ملف Excel قابل للتحرير' : 'Editable Excel File',
      color: 'text-green-500'
    },
    {
      value: 'pdf',
      label: 'PDF',
      icon: <FileText className="h-6 w-6" />,
      description: language === 'ar' ? 'مستند PDF احترافي' : 'Professional PDF Document',
      color: 'text-red-500'
    },
    {
      value: 'word',
      label: 'Word',
      icon: <FileDown className="h-6 w-6" />,
      description: language === 'ar' ? 'مستند Word قابل للتحرير' : 'Editable Word Document',
      color: 'text-blue-500'
    },
    {
      value: 'csv',
      label: 'CSV',
      icon: <Table className="h-6 w-6" />,
      description: language === 'ar' ? 'بيانات CSV خام' : 'Raw CSV Data',
      color: 'text-purple-500'
    }
  ];

  const typeOptions = [
    { value: 'projects', label: language === 'ar' ? 'المشاريع' : 'Projects' },
    { value: 'daily-reports', label: language === 'ar' ? 'التقارير اليومية' : 'Daily Reports' },
    { value: 'full-report', label: language === 'ar' ? 'تقرير شامل' : 'Full Report' },
  ];

  const dateRangeOptions = [
    { value: 'all', label: language === 'ar' ? 'جميع البيانات' : 'All Data' },
    { value: 'month', label: language === 'ar' ? 'الشهر الحالي' : 'Current Month' },
    { value: 'quarter', label: language === 'ar' ? 'الربع الحالي' : 'Current Quarter' },
    { value: 'year', label: language === 'ar' ? 'السنة الحالية' : 'Current Year' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold gradient-text">
            {language === 'ar' ? 'مركز التصدير' : 'Export Center'}
          </h2>
          <p className="text-base text-muted-foreground font-medium mt-1">
            {language === 'ar' ? 'تصدير التقارير والبيانات بصيغ متعددة' : 'Export reports and data in multiple formats'}
          </p>
        </div>
      </div>

      {/* Type Selection */}
      <Card className="glass-card border-0 shadow-xl animate-fade-in-up">
        <CardHeader>
          <CardTitle className="text-xl">
            {language === 'ar' ? 'نوع البيانات' : 'Data Type'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {typeOptions.map((type) => (
              <button
                key={type.value}
                onClick={() => setOptions({ ...options, type: type.value as any })}
                className={`px-4 py-3 rounded-lg border-2 transition-all text-base font-semibold ${
                  options.type === type.value
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-card hover:border-primary'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Format Selection */}
      <Card className="glass-card border-0 shadow-xl animate-fade-in-up delay-100">
        <CardHeader>
          <CardTitle className="text-xl">
            {language === 'ar' ? 'اختر صيغة التصدير' : 'Select Export Format'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {formatOptions.map((format) => (
              <button
                key={format.value}
                onClick={() => setOptions({ ...options, format: format.value as any })}
                className={`p-6 rounded-xl border-2 transition-all hover-scale ${
                  options.format === format.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className={`${format.color} mb-3`}>
                  {format.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{format.label}</h3>
                <p className="text-sm text-muted-foreground font-medium">
                  {format.description}
                </p>
                {options.format === format.value && (
                  <Badge className="mt-3">
                    <CheckCircle className="h-3 w-3 ml-1" />
                    {language === 'ar' ? 'محدد' : 'Selected'}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card className="glass-card border-0 shadow-xl animate-fade-in-up delay-200">
        <CardHeader>
          <CardTitle className="text-xl">
            {language === 'ar' ? 'خيارات التصدير' : 'Export Options'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range */}
          <div className="space-y-3">
            <label className="text-base font-bold">
              {language === 'ar' ? 'الفترة الزمنية' : 'Date Range'}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {dateRangeOptions.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setOptions({ ...options, dateRange: range.value as any })}
                  className={`px-4 py-3 rounded-lg border-2 transition-all text-base font-semibold ${
                    options.dateRange === range.value
                      ? 'border-primary bg-primary text-white'
                      : 'border-border bg-card hover:border-primary'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Actions */}
      <Card className="glass-card border-0 shadow-xl animate-fade-in-up delay-300">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 h-14 text-lg font-bold"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full ml-2" />
                  {language === 'ar' ? 'جاري التصدير...' : 'Exporting...'}
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 ml-2" />
                  {language === 'ar' ? 'تصدير الآن' : 'Export Now'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      {exportSuccess && (
        <Card className="glass-card border-0 shadow-xl bg-green-50 dark:bg-green-900/20 border-green-500 animate-scale-in">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-500 text-white">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-700 dark:text-green-400">
                  {language === 'ar' ? 'تم التصدير بنجاح!' : 'Export Successful!'}
                </h3>
                <p className="text-base text-green-600 dark:text-green-300 font-medium">
                  {language === 'ar' ? 'تم تنزيل الملف على جهازك' : 'File has been downloaded to your device'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
