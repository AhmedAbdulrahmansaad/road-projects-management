// 🎨 Helper functions for BEAUTIFUL Arabic exports with proper RTL and colors

export function generateWordHTML(report: any): string {
  const reportDate = new Date(report.report_date).toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric", 
    month: "long",
    day: "numeric"
  });
  const projectName = report.projects?.work_order_description || "غير محدد";
  const projectNumber = report.projects?.project_number || "";
  const userName = report.users?.name || "غير معروف";
  
  const safeReplace = (text: string | null | undefined): string => {
    if (!text) return "-";
    return String(text).replace(/\n/g, "<br>");
  };

  return `<!DOCTYPE html>
<html dir="rtl">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>تقرير ${report.report_number}</title>
<style>
@page {
  margin: 1.5cm;
  size: A4;
}
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: 'Arial', 'Tahoma', 'Segoe UI', 'Traditional Arabic', sans-serif;
  direction: rtl;
  text-align: right;
  padding: 0;
  line-height: 1.8;
  color: #1a1a1a;
  background: #ffffff;
}
.page-container {
  width: 100%;
  max-width: 21cm;
  margin: 0 auto;
  background: white;
  box-shadow: 0 0 30px rgba(0,0,0,0.1);
}
.header-wrapper {
  background: linear-gradient(135deg, #006C35 0%, #008844 50%, #00a651 100%);
  padding: 35px 30px;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.header-wrapper::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 40%;
  height: 200%;
  background: rgba(255,255,255,0.05);
  transform: rotate(15deg);
}
.header-wrapper::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 8px;
  background: linear-gradient(90deg, #FDB714 0%, #ffc940 50%, #FDB714 100%);
}
.logo {
  font-size: 60px;
  margin-bottom: 15px;
  text-shadow: 0 4px 10px rgba(0,0,0,0.2);
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
.header-title {
  color: white;
  font-size: 42px;
  font-weight: bold;
  margin: 10px 0;
  text-shadow: 3px 3px 6px rgba(0,0,0,0.3);
  letter-spacing: 1px;
}
.header-subtitle {
  color: rgba(255,255,255,0.95);
  font-size: 18px;
  margin-top: 10px;
  font-weight: 500;
}
.report-badge {
  background: linear-gradient(135deg, #FDB714 0%, #ffc940 100%);
  color: #000;
  padding: 12px 35px;
  border-radius: 30px;
  display: inline-block;
  margin-top: 20px;
  font-size: 24px;
  font-weight: bold;
  box-shadow: 0 4px 15px rgba(253,183,20,0.5);
  border: 3px solid rgba(255,255,255,0.3);
}
.content-wrapper {
  padding: 30px;
}
.section-title {
  background: linear-gradient(135deg, #006C35 0%, #008844 100%);
  color: white;
  padding: 18px 25px;
  border-radius: 12px;
  margin: 30px 0 20px 0;
  font-size: 24px;
  font-weight: bold;
  box-shadow: 0 4px 15px rgba(0,108,53,0.25);
  border-right: 6px solid #FDB714;
  position: relative;
}
.section-title::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 100%);
  border-radius: 12px;
}
.info-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 20px 0;
  box-shadow: 0 3px 15px rgba(0,0,0,0.08);
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #e0e0e0;
}
.info-table tr {
  transition: all 0.2s ease;
}
.info-table tr:nth-child(even) {
  background: linear-gradient(135deg, #f8f9fa 0%, #f0f2f5 100%);
}
.info-table tr:nth-child(odd) {
  background: white;
}
.info-table tr:hover {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  transform: scale(1.01);
}
.info-table td {
  padding: 18px 20px;
  border-bottom: 1px solid #e0e0e0;
  font-size: 17px;
  vertical-align: top;
}
.info-table tr:last-child td {
  border-bottom: none;
}
.label-cell {
  font-weight: bold;
  background: linear-gradient(135deg, #006C35 0%, #008844 100%);
  color: white;
  width: 250px;
  text-align: center;
  font-size: 17px;
  box-shadow: inset 0 0 15px rgba(0,0,0,0.1);
  position: relative;
}
.label-cell::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #FDB714;
}
.value-cell {
  font-size: 17px;
  color: #2c3e50;
  line-height: 1.6;
}
.value-cell strong {
  color: #006C35;
  font-size: 20px;
}
.content-box {
  background: linear-gradient(135deg, #f0f8f5 0%, #e1f5e8 100%);
  border-right: 8px solid #FDB714;
  border-left: 2px solid rgba(0,108,53,0.2);
  padding: 25px 30px;
  margin: 20px 0;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  line-height: 2;
  font-size: 17px;
  position: relative;
  overflow: hidden;
}
.content-box::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100%;
  background: linear-gradient(90deg, transparent 0%, rgba(253,183,20,0.08) 100%);
}
.content-box-title {
  color: #006C35;
  font-weight: bold;
  font-size: 19px;
  margin-bottom: 12px;
  display: block;
}
.warning-box {
  background: linear-gradient(135deg, #fff3cd 0%, #ffe9a8 100%);
  border-right: 8px solid #ff9800;
  border-left: 2px solid rgba(255,152,0,0.3);
  padding: 25px 30px;
  margin: 20px 0;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(255,152,0,0.2);
  position: relative;
}
.warning-box::before {
  content: '⚠️';
  position: absolute;
  top: 20px;
  left: 20px;
  font-size: 40px;
  opacity: 0.2;
}
.warning-box-title {
  color: #d84315;
  font-weight: bold;
  font-size: 19px;
  margin-bottom: 12px;
  display: block;
}
.footer {
  margin-top: 60px;
  padding: 25px 30px;
  border-top: 5px solid #006C35;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  text-align: center;
  border-radius: 12px 12px 0 0;
}
.footer-title {
  color: #006C35;
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 10px;
}
.footer-date {
  color: #666;
  font-size: 15px;
}
.highlight-value {
  background: linear-gradient(135deg, #FDB714 0%, #ffc940 100%);
  color: #000;
  padding: 4px 12px;
  border-radius: 8px;
  font-weight: bold;
  display: inline-block;
  box-shadow: 0 2px 6px rgba(253,183,20,0.3);
}
.stats-highlight {
  text-align: center;
  font-size: 32px;
  font-weight: bold;
  color: #006C35;
  margin: 15px 0;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}
</style>
</head>
<body>
<div class="page-container">
  <div class="header-wrapper">
    <div class="logo">🇸🇦</div>
    <h1 class="header-title">📋 التقرير اليومي</h1>
    <div class="report-badge">${report.report_number}</div>
    <p class="header-subtitle">نظام إدارة مشاريع الطرق - المملكة العربية السعودية</p>
  </div>
  
  <div class="content-wrapper">
    <h2 class="section-title">📋 معلومات أساسية</h2>
    <table class="info-table">
      <tr>
        <td class="label-cell">📅 التاريخ</td>
        <td class="value-cell"><strong>${reportDate}</strong></td>
      </tr>
      <tr>
        <td class="label-cell">🏗️ المشروع</td>
        <td class="value-cell"><strong>${projectName}</strong> ${projectNumber ? `<span class="highlight-value">${projectNumber}</span>` : ''}</td>
      </tr>
      <tr>
        <td class="label-cell">📍 الموقع</td>
        <td class="value-cell">${report.location || "-"}</td>
      </tr>
      <tr>
        <td class="label-cell">👤 معد التقرير</td>
        <td class="value-cell"><strong>${userName}</strong></td>
      </tr>
    </table>
    
    ${report.weather_condition || report.temperature ? `
    <h2 class="section-title">☀️ حالة الطقس</h2>
    <table class="info-table">
      ${report.weather_condition ? `<tr><td class="label-cell">🌤️ الحالة الجوية</td><td class="value-cell"><strong>${report.weather_condition}</strong></td></tr>` : ''}
      ${report.temperature ? `<tr><td class="label-cell">🌡️ درجة الحرارة</td><td class="value-cell"><span class="highlight-value" style="color:#d32f2f;">${report.temperature}°م</span></td></tr>` : ''}
    </table>
    ` : ''}
    
    <h2 class="section-title">👷 العمل والعمالة</h2>
    <table class="info-table">
      <tr>
        <td class="label-cell">⏰ ساعات العمل</td>
        <td class="value-cell"><strong>${report.work_hours_from || "-"} - ${report.work_hours_to || "-"}</strong></td>
      </tr>
      <tr>
        <td class="label-cell">👥 إجمالي العمال</td>
        <td class="value-cell"><div class="stats-highlight">${report.total_workers || 0} عامل</div></td>
      </tr>
      <tr>
        <td class="label-cell">🇸🇦 العمال السعوديين</td>
        <td class="value-cell"><strong style="color:#006C35;font-size:20px;">${report.saudi_workers || 0}</strong></td>
      </tr>
      <tr>
        <td class="label-cell">🌍 العمال غير السعوديين</td>
        <td class="value-cell"><strong style="font-size:20px;">${report.non_saudi_workers || 0}</strong></td>
      </tr>
    </table>
    
    ${report.equipment_used ? `
    <h2 class="section-title">🚜 المعدات المستخدمة</h2>
    <div class="content-box">
      <span class="content-box-title">🔧 قائمة المعدات:</span>
      ${safeReplace(report.equipment_used)}
    </div>
    ` : ''}
    
    ${report.work_description ? `
    <h2 class="section-title">🔧 الأعمال المنفذة</h2>
    <div class="content-box">
      ${safeReplace(report.work_description)}
    </div>
    ` : ''}
    
    ${report.daily_progress || report.executed_quantities || report.materials_used ? `
    <h2 class="section-title">📊 الإنجاز والكميات</h2>
    ${report.daily_progress ? `
    <div class="content-box" style="text-align:center;">
      <span class="content-box-title">📈 نسبة الإنجاز اليومية:</span><br>
      <div class="stats-highlight" style="font-size:48px;color:#FDB714;text-shadow:3px 3px 6px rgba(0,0,0,0.2);">${report.daily_progress}%</div>
    </div>` : ''}
    ${report.executed_quantities ? `
    <div class="content-box">
      <span class="content-box-title">📦 الكميات المنفذة:</span><br>
      ${safeReplace(report.executed_quantities)}
    </div>` : ''}
    ${report.materials_used ? `
    <div class="content-box">
      <span class="content-box-title">🧱 المواد المستخدمة:</span><br>
      ${safeReplace(report.materials_used)}
    </div>` : ''}
    ` : ''}
    
    ${report.problems || report.accidents ? `
    <h2 class="section-title" style="background:linear-gradient(135deg,#ff9800 0%,#f57c00 100%);">⚠️ المشاكل والحوادث</h2>
    ${report.problems ? `
    <div class="warning-box">
      <span class="warning-box-title">⚠️ المشاكل والمعوقات:</span><br>
      ${safeReplace(report.problems)}
    </div>` : ''}
    ${report.accidents ? `
    <div class="warning-box" style="border-right-color:#c62828;">
      <span class="warning-box-title" style="color:#c62828;">🚨 الحوادث:</span><br>
      ${safeReplace(report.accidents)}
    </div>` : ''}
    ` : ''}
    
    ${report.official_visits || report.recommendations || report.general_notes ? `
    <h2 class="section-title">📝 معلومات إضافية</h2>
    ${report.official_visits ? `
    <div class="content-box">
      <span class="content-box-title">👔 الزيارات الرسمية:</span><br>
      ${safeReplace(report.official_visits)}
    </div>` : ''}
    ${report.recommendations ? `
    <div class="content-box">
      <span class="content-box-title">💡 التوصيات:</span><br>
      ${safeReplace(report.recommendations)}
    </div>` : ''}
    ${report.general_notes ? `
    <div class="content-box">
      <span class="content-box-title">📌 ملاحظات عامة:</span><br>
      ${safeReplace(report.general_notes)}
    </div>` : ''}
    ` : ''}
    
    <div class="footer">
      <p class="footer-title">🇸🇦 نظام إدارة مشاريع الطرق - المملكة العربية السعودية</p>
      <p class="footer-date">تاريخ الطباعة: ${new Date().toLocaleDateString("ar-SA")} - الساعة: ${new Date().toLocaleTimeString("ar-SA")}</p>
    </div>
  </div>
</div>
</body>
</html>`;
}

export function generateExcelCSV(report: any): string {
  const reportDate = new Date(report.report_date).toLocaleDateString("ar-SA");
  const projectName = report.projects?.work_order_description || "غير محدد";
  const projectNumber = report.projects?.project_number || "";
  const userName = report.users?.name || "غير معروف";

  const rows = [
    ["🇸🇦 التقرير اليومي - نظام إدارة مشاريع الطرق", ""],
    ["رقم التقرير:", report.report_number],
    [""],
    ["📋 معلومات أساسية", ""],
    ["التاريخ", reportDate],
    ["المشروع", `${projectName} ${projectNumber}`],
    ["الموقع", report.location || "-"],
    ["معد التقرير", userName],
    [""],
    ["☀️ حالة الطقس", ""],
    ["الحالة", report.weather_condition || "-"],
    ["درجة الحرارة", report.temperature ? `${report.temperature}°م` : "-"],
    [""],
    ["👷 العمل والعمالة", ""],
    ["ساعات العمل", `${report.work_hours_from || "-"} - ${report.work_hours_to || "-"}`],
    ["إجمالي العمال", report.total_workers || 0],
    ["سعوديين", report.saudi_workers || 0],
    ["غير سعوديين", report.non_saudi_workers || 0],
    [""],
    ["🚜 المعدات المستخدمة", ""],
    [report.equipment_used || "-", ""],
    [""],
    ["🔧 الأعمال المنفذة", ""],
    [report.work_description || "-", ""],
    [""],
    ["📊 الإنجاز والكميات", ""],
    ["نسبة الإنجاز", report.daily_progress ? `${report.daily_progress}%` : "-"],
    ["الكميات المنفذة", report.executed_quantities || "-"],
    ["المواد المستخدمة", report.materials_used || "-"],
    [""],
    ["⚠️ المشاكل والحوادث", ""],
    ["المشاكل والمعوقات", report.problems || "-"],
    ["الحوادث", report.accidents || "-"],
    [""],
    ["📝 معلومات إضافية", ""],
    ["الزيارات الرسمية", report.official_visits || "-"],
    ["التوصيات", report.recommendations || "-"],
    ["ملاحظات عامة", report.general_notes || "-"],
    [""],
    ["تاريخ التصدير:", new Date().toLocaleDateString("ar-SA")],
  ];

  // UTF-8 BOM for Excel Arabic support
  return "\ufeff" + rows.map(row => row.join("\t")).join("\n");
}

export function generatePDFHTML(report: any): string {
  const reportDate = new Date(report.report_date).toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long", 
    day: "numeric"
  });
  const projectName = report.projects?.work_order_description || "غير محدد";
  const projectNumber = report.projects?.project_number || "";
  const userName = report.users?.name || "غير معروف";
  
  const safeReplace = (text: string | null | undefined): string => {
    if (!text) return "-";
    return String(text).replace(/\n/g, "<br>");
  };

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${report.report_number}</title>
<style>
@media print {
  body { margin: 0; }
  .no-print { display: none; }
  @page { margin: 1.5cm; }
}
* {
  box-sizing: border-box;
}
body {
  font-family: 'Arial', 'Tahoma', 'Segoe UI', 'Traditional Arabic', sans-serif;
  direction: rtl;
  text-align: right;
  padding: 20px;
  line-height: 1.8;
  color: #1a1a1a;
  background: #f5f5f5;
  margin: 0;
}
.container {
  max-width: 1000px;
  margin: 0 auto;
  background: white;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
.header {
  text-align: center;
  background: linear-gradient(135deg, #006C35 0%, #008844 100%);
  color: white;
  padding: 30px;
  border-radius: 15px;
  margin-bottom: 30px;
  box-shadow: 0 4px 15px rgba(0,108,53,0.3);
}
.header h1 {
  margin: 0;
  font-size: 36px;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
}
.header .report-number {
  background: #FDB714;
  color: #000;
  padding: 10px 25px;
  border-radius: 25px;
  display: inline-block;
  margin-top: 15px;
  font-size: 22px;
  font-weight: bold;
  box-shadow: 0 3px 10px rgba(253,183,20,0.4);
}
.logo {
  font-size: 50px;
  margin-bottom: 10px;
}
h2 {
  background: linear-gradient(90deg, #006C35 0%, #00a651 100%);
  color: white;
  padding: 15px 25px;
  border-radius: 10px;
  margin-top: 30px;
  margin-bottom: 20px;
  font-size: 24px;
  box-shadow: 0 3px 10px rgba(0,108,53,0.2);
  page-break-after: avoid;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  border-radius: 10px;
  overflow: hidden;
  page-break-inside: avoid;
}
tr {
  page-break-inside: avoid;
}
tr:nth-child(even) {
  background-color: #f8f9fa;
}
td {
  padding: 15px 20px;
  border: 1px solid #dee2e6;
  font-size: 17px;
}
.label {
  font-weight: bold;
  background: linear-gradient(135deg, #006C35 0%, #008844 100%);
  color: white;
  width: 220px;
  text-align: center;
  font-size: 16px;
}
.section {
  background: linear-gradient(135deg, #f0f8f5 0%, #e8f5e9 100%);
  border-right: 6px solid #FDB714;
  padding: 20px 25px;
  margin: 20px 0;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  line-height: 2.2;
  font-size: 17px;
  page-break-inside: avoid;
}
.warning {
  background: linear-gradient(135deg, #fff3cd 0%, #ffe9a8 100%);
  border-right: 6px solid #ff9800;
  padding: 20px 25px;
  margin: 20px 0;
  border-radius: 10px;
  box-shadow: 0 3px 10px rgba(255,152,0,0.2);
  page-break-inside: avoid;
}
.footer {
  margin-top: 50px;
  padding-top: 20px;
  border-top: 3px solid #006C35;
  text-align: center;
  color: #666;
  font-size: 14px;
}
.print-button {
  position: fixed;
  top: 20px;
  left: 20px;
  padding: 15px 30px;
  background: linear-gradient(135deg, #006C35 0%, #008844 100%);
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  box-shadow: 0 4px 15px rgba(0,108,53,0.4);
  z-index: 1000;
  transition: all 0.3s;
}
.print-button:hover {
  background: linear-gradient(135deg, #008844 0%, #00a651 100%);
  transform: scale(1.05);
}
</style>
</head>
<body>
<button class="print-button no-print" onclick="window.print()">🖨️ طباعة / حفظ PDF</button>
<script>
// Auto-trigger print dialog when page loads
window.onload = function() {
  // Small delay to ensure page is fully rendered
  setTimeout(function() {
    window.print();
  }, 500);
};
</script>
<div class="container">
<div class="logo">🇸🇦</div>
<div class="header">
<h1>📋 التقرير اليومي</h1>
<div class="report-number">${report.report_number}</div>
<p style="margin-top:15px;font-size:18px;margin-bottom:0;">نظام إدارة مشاريع الطرق - المملكة العربية السعودية</p>
</div>

<h2>📋 معلومات أساسية</h2>
<table>
<tr><td class="label">📅 التاريخ</td><td><strong>${reportDate}</strong></td></tr>
<tr><td class="label">🏗️ المشروع</td><td><strong>${projectName}</strong> ${projectNumber ? `<span style="color:#666;">(${projectNumber})</span>` : ''}</td></tr>
<tr><td class="label">📍 الموقع</td><td>${report.location || "-"}</td></tr>
<tr><td class="label">👤 معد التقرير</td><td><strong>${userName}</strong></td></tr>
</table>

${report.weather_condition || report.temperature ? `
<h2>☀️ حالة الطقس</h2>
<table>
${report.weather_condition ? `<tr><td class="label">🌤️ الحالة</td><td><strong>${report.weather_condition}</strong></td></tr>` : ''}
${report.temperature ? `<tr><td class="label">🌡️ درجة الحرارة</td><td><strong style="color:#d32f2f;font-size:20px;">${report.temperature}°م</strong></td></tr>` : ''}
</table>
` : ''}

<h2>👷 العمل والعمالة</h2>
<table>
<tr><td class="label">⏰ ساعات العمل</td><td><strong>${report.work_hours_from || "-"} - ${report.work_hours_to || "-"}</strong></td></tr>
<tr><td class="label">👥 إجمالي العمال</td><td><strong style="color:#006C35;font-size:22px;">${report.total_workers || 0}</strong></td></tr>
<tr><td class="label">🇸🇦 سعوديين</td><td><strong style="color:#006C35;">${report.saudi_workers || 0}</strong></td></tr>
<tr><td class="label">🌍 غير سعوديين</td><td><strong>${report.non_saudi_workers || 0}</strong></td></tr>
</table>

${report.equipment_used ? `
<h2>🚜 المعدات المستخدمة</h2>
<div class="section"><strong style="color:#006C35;">المعدات:</strong><br>${safeReplace(report.equipment_used)}</div>
` : ''}

${report.work_description ? `
<h2>🔧 الأعمال المنفذة</h2>
<div class="section">${safeReplace(report.work_description)}</div>
` : ''}

${report.daily_progress || report.executed_quantities || report.materials_used ? `
<h2>📊 الإنجاز والكميات</h2>
${report.daily_progress ? `
<div class="section">
<strong style="color:#006C35;font-size:18px;">📈 نسبة الإنجاز اليومية:</strong><br>
<span style="font-size:32px;color:#FDB714;font-weight:bold;">${report.daily_progress}%</span>
</div>` : ''}
${report.executed_quantities ? `
<div class="section">
<strong style="color:#006C35;font-size:18px;">📦 الكميات المنفذة:</strong><br>
${safeReplace(report.executed_quantities)}
</div>` : ''}
${report.materials_used ? `
<div class="section">
<strong style="color:#006C35;font-size:18px;">🧱 المواد المستخدمة:</strong><br>
${safeReplace(report.materials_used)}
</div>` : ''}
` : ''}

${report.problems || report.accidents ? `
<h2 style="background:linear-gradient(90deg,#ff9800 0%,#f57c00 100%);">⚠️ المشاكل والحوادث</h2>
${report.problems ? `
<div class="warning">
<strong style="color:#d84315;font-size:18px;">⚠️ المشاكل والمعوقات:</strong><br>
${safeReplace(report.problems)}
</div>` : ''}
${report.accidents ? `
<div class="warning">
<strong style="color:#c62828;font-size:18px;">🚨 الحوادث:</strong><br>
${safeReplace(report.accidents)}
</div>` : ''}
` : ''}

${report.official_visits || report.recommendations || report.general_notes ? `
<h2>📝 معلومات إضافية</h2>
${report.official_visits ? `
<div class="section">
<strong style="color:#006C35;font-size:18px;">👔 الزيارات الرسمية:</strong><br>
${safeReplace(report.official_visits)}
</div>` : ''}
${report.recommendations ? `
<div class="section">
<strong style="color:#006C35;font-size:18px;">💡 التوصيات:</strong><br>
${safeReplace(report.recommendations)}
</div>` : ''}
${report.general_notes ? `
<div class="section">
<strong style="color:#006C35;font-size:18px;">📌 ملاحظات عامة:</strong><br>
${safeReplace(report.general_notes)}
</div>` : ''}
` : ''}

<div class="footer">
<p style="margin:5px 0;"><strong>🇸🇦 نظام إدارة مشاريع الطرق - المملكة العربية السعودية</strong></p>
<p style="margin:5px 0;">تاريخ الطباعة: <strong>${new Date().toLocaleDateString("ar-SA")}</strong> - الساعة: <strong>${new Date().toLocaleTimeString("ar-SA")}</strong></p>
</div>
</div>
</body>
</html>`;
}