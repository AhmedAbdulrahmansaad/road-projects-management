// ============================================
// 📊 Daily Reports SQL Routes
// ============================================
// هذا الملف يحتوي على routes التقارير اليومية مع SQL Database
// قم بنسخ المحتوى ولصقه في index.tsx قبل Deno.serve(app.fetch)
// ============================================

import { Hono } from "npm:hono@4";
import { createClient } from "jsr:@supabase/supabase-js@2";

// استبدل 'app' باسم الـ Hono app في index.tsx
// const app = new Hono();

// Create Daily Report (SQL)
app.post("/make-server-a52c947c/daily-reports-sql", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (!user || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data: currentUser } = await supabaseAdmin
      .from("users")
      .select("id, name")
      .eq("email", user.email)
      .single();

    if (!currentUser) {
      return c.json({ error: "User not found" }, 404);
    }

    const reportData = await c.req.json();

    // Generate unique report number
    const reportNumber = `DR-${Date.now()}`;

    // Prepare insert data (all optional except date and created_by)
    const insertData: any = {
      report_number: reportNumber,
      report_date: reportData.reportDate,
      created_by: currentUser.id,
    };

    // Add optional fields only if they have values
    if (reportData.projectId) insertData.project_id = reportData.projectId;
    if (reportData.location) insertData.location = reportData.location;
    if (reportData.weatherCondition) insertData.weather_condition = reportData.weatherCondition;
    if (reportData.temperature) insertData.temperature = reportData.temperature;
    if (reportData.workHoursFrom) insertData.work_hours_from = reportData.workHoursFrom;
    if (reportData.workHoursTo) insertData.work_hours_to = reportData.workHoursTo;
    if (reportData.saudiWorkers) insertData.saudi_workers = parseInt(reportData.saudiWorkers);
    if (reportData.nonSaudiWorkers) insertData.non_saudi_workers = parseInt(reportData.nonSaudiWorkers);
    if (reportData.equipmentUsed) insertData.equipment_used = reportData.equipmentUsed;
    if (reportData.workDescription) insertData.work_description = reportData.workDescription;
    if (reportData.dailyProgress) insertData.daily_progress = parseFloat(reportData.dailyProgress);
    if (reportData.executedQuantities) insertData.executed_quantities = reportData.executedQuantities;
    if (reportData.materialsUsed) insertData.materials_used = reportData.materialsUsed;
    if (reportData.problems) insertData.problems = reportData.problems;
    if (reportData.accidents) insertData.accidents = reportData.accidents;
    if (reportData.officialVisits) insertData.official_visits = reportData.officialVisits;
    if (reportData.recommendations) insertData.recommendations = reportData.recommendations;
    if (reportData.generalNotes) insertData.general_notes = reportData.generalNotes;

    // Insert into database
    const { data: newReport, error: insertError } = await supabaseAdmin
      .from("daily_reports_new")
      .insert(insertData)
      .select(`
        *,
        projects:project_id(id, project_number, work_order_description),
        users:created_by(id, name)
      `)
      .single();

    if (insertError) {
      console.log(`Error inserting daily report: ${insertError.message}`);
      return c.json({ error: "خطأ في إنشاء التقرير اليومي" }, 500);
    }

    // Create notification
    await supabaseAdmin.from("notifications").insert([
      {
        title: "تقرير يومي جديد",
        message: `تم إضافة تقرير يومي جديد: ${reportNumber} - ${reportData.workDescription?.substring(0, 50) || 'تقرير جديد'}`,
        type: reportData.problems || reportData.accidents ? "warning" : "info",
        user_id: null,
      },
    ]);

    return c.json({
      report: newReport,
      message: "تم إنشاء التقرير اليومي بنجاح",
    });
  } catch (error) {
    console.log(`Error creating daily report (SQL): ${error}`);
    return c.json({ error: "خطأ في إنشاء التقرير اليومي" }, 500);
  }
});

// Get All Daily Reports (SQL)
app.get("/make-server-a52c947c/daily-reports-sql", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (!user || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Fetch all reports with relations
    const { data: reports, error: fetchError } = await supabaseAdmin
      .from("daily_reports_new")
      .select(`
        *,
        projects:project_id(id, project_number, work_order_description),
        users:created_by(id, name)
      `)
      .order("report_date", { ascending: false });

    if (fetchError) {
      console.log(`Error fetching daily reports: ${fetchError.message}`);
      return c.json({ error: "خطأ في جلب التقارير اليومية" }, 500);
    }

    // Transform data to match frontend interface
    const transformedReports = reports.map((report: any) => ({
      id: report.id,
      reportNumber: report.report_number,
      reportDate: report.report_date,
      projectId: report.project_id,
      projectName: report.projects 
        ? `${report.projects.work_order_description} (${report.projects.project_number})`
        : null,
      location: report.location,
      weatherCondition: report.weather_condition,
      temperature: report.temperature,
      workHoursFrom: report.work_hours_from,
      workHoursTo: report.work_hours_to,
      saudiWorkers: report.saudi_workers,
      nonSaudiWorkers: report.non_saudi_workers,
      totalWorkers: report.total_workers,
      equipmentUsed: report.equipment_used,
      workDescription: report.work_description,
      dailyProgress: report.daily_progress,
      executedQuantities: report.executed_quantities,
      materialsUsed: report.materials_used,
      problems: report.problems,
      accidents: report.accidents,
      officialVisits: report.official_visits,
      recommendations: report.recommendations,
      generalNotes: report.general_notes,
      images: report.images || [],
      createdBy: report.created_by,
      createdByName: report.users?.name || 'Unknown',
      createdAt: report.created_at,
      updatedAt: report.updated_at,
    }));

    return c.json({ reports: transformedReports });
  } catch (error) {
    console.log(`Error fetching daily reports (SQL): ${error}`);
    return c.json({ error: "خطأ في جلب التقارير اليومية" }, 500);
  }
});

// Update Daily Report (SQL)
app.put("/make-server-a52c947c/daily-reports-sql/:id", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (!user || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data: currentUser } = await supabaseAdmin
      .from("users")
      .select("id, role")
      .eq("email", user.email)
      .single();

    if (!currentUser) {
      return c.json({ error: "User not found" }, 404);
    }

    const reportId = c.req.param("id");
    const reportData = await c.req.json();

    // Get existing report to check ownership
    const { data: existingReport } = await supabaseAdmin
      .from("daily_reports_new")
      .select("created_by")
      .eq("id", reportId)
      .single();

    if (!existingReport) {
      return c.json({ error: "Report not found" }, 404);
    }

    // Check permissions: general_manager OR owner
    const isGeneralManager = currentUser.role === "General Manager" ||
                            currentUser.role === "المدير العام" ||
                            currentUser.role === "general_manager";
    const isOwner = existingReport.created_by === currentUser.id;

    if (!isGeneralManager && !isOwner) {
      return c.json({ error: "Unauthorized to edit this report" }, 403);
    }

    // Prepare update data
    const updateData: any = {
      report_date: reportData.reportDate,
      project_id: reportData.projectId || null,
      location: reportData.location || null,
      weather_condition: reportData.weatherCondition || null,
      temperature: reportData.temperature || null,
      work_hours_from: reportData.workHoursFrom || null,
      work_hours_to: reportData.workHoursTo || null,
      saudi_workers: reportData.saudiWorkers ? parseInt(reportData.saudiWorkers) : null,
      non_saudi_workers: reportData.nonSaudiWorkers ? parseInt(reportData.nonSaudiWorkers) : null,
      equipment_used: reportData.equipmentUsed || null,
      work_description: reportData.workDescription || null,
      daily_progress: reportData.dailyProgress ? parseFloat(reportData.dailyProgress) : null,
      executed_quantities: reportData.executedQuantities || null,
      materials_used: reportData.materialsUsed || null,
      problems: reportData.problems || null,
      accidents: reportData.accidents || null,
      official_visits: reportData.officialVisits || null,
      recommendations: reportData.recommendations || null,
      general_notes: reportData.generalNotes || null,
    };

    // Update in database
    const { data: updatedReport, error: updateError } = await supabaseAdmin
      .from("daily_reports_new")
      .update(updateData)
      .eq("id", reportId)
      .select(`
        *,
        projects:project_id(id, project_number, work_order_description),
        users:created_by(id, name)
      `)
      .single();

    if (updateError) {
      console.log(`Error updating daily report: ${updateError.message}`);
      return c.json({ error: "خطأ في تحديث التقرير اليومي" }, 500);
    }

    // Create notification
    await supabaseAdmin.from("notifications").insert([
      {
        title: "تحديث تقرير يومي",
        message: `تم تحديث التقرير: ${updatedReport.report_number}`,
        type: "info",
        user_id: null,
      },
    ]);

    return c.json({
      report: updatedReport,
      message: "تم تحديث التقرير اليومي بنجاح",
    });
  } catch (error) {
    console.log(`Error updating daily report (SQL): ${error}`);
    return c.json({ error: "خطأ في تحديث التقرير اليومي" }, 500);
  }
});

// Delete Daily Report (SQL)
app.delete("/make-server-a52c947c/daily-reports-sql/:id", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (!user || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data: currentUser } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("email", user.email)
      .single();

    if (!currentUser) {
      return c.json({ error: "User not found" }, 404);
    }

    // Only general_manager can delete
    if (currentUser.role !== "general_manager") {
      return c.json({ error: "Unauthorized to delete reports" }, 403);
    }

    const reportId = c.req.param("id");

    // Get report details for notification
    const { data: report } = await supabaseAdmin
      .from("daily_reports_new")
      .select("report_number")
      .eq("id", reportId)
      .single();

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from("daily_reports_new")
      .delete()
      .eq("id", reportId);

    if (deleteError) {
      console.log(`Error deleting daily report: ${deleteError.message}`);
      return c.json({ error: "خطأ في حذف التقرير اليومي" }, 500);
    }

    // Create notification
    await supabaseAdmin.from("notifications").insert([
      {
        title: "حذف تقرير يومي",
        message: `تم حذف التقرير: ${report?.report_number || reportId}`,
        type: "warning",
        user_id: null,
      },
    ]);

    return c.json({ message: "تم حذف التقرير اليومي بنجاح" });
  } catch (error) {
    console.log(`Error deleting daily report (SQL): ${error}`);
    return c.json({ error: "خطأ في حذف التقرير اليومي" }, 500);
  }
});

// Export Daily Report (Word/Excel/PDF)
app.get("/make-server-a52c947c/daily-reports-sql/:id/export/:format", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (!user || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const reportId = c.req.param("id");
    const format = c.req.param("format");

    // Fetch report
    const { data: report, error: fetchError } = await supabaseAdmin
      .from("daily_reports_new")
      .select(`
        *,
        projects:project_id(id, project_number, work_order_description),
        users:created_by(id, name)
      `)
      .eq("id", reportId)
      .single();

    if (fetchError || !report) {
      return c.json({ error: "Report not found" }, 404);
    }

    // Generate export based on format
    if (format === 'word') {
      // Simple Word document (HTML-based)
      const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تقرير يومي - ${report.report_number}</title>
  <style>
    body { font-family: 'Arial', sans-serif; direction: rtl; text-align: right; padding: 40px; }
    h1 { color: #006C35; text-align: center; border-bottom: 3px solid #FDB714; padding-bottom: 10px; }
    h2 { color: #006C35; margin-top: 30px; border-right: 4px solid #FDB714; padding-right: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    td { padding: 10px; border: 1px solid #ddd; }
    .label { font-weight: bold; background-color: #f5f5f5; width: 200px; }
  </style>
</head>
<body>
  <h1>🗂️ تقرير يومي - ${report.report_number}</h1>
  
  <h2>📋 معلومات أساسية</h2>
  <table>
    <tr><td class="label">التاريخ</td><td>${new Date(report.report_date).toLocaleDateString('ar-SA')}</td></tr>
    <tr><td class="label">المشروع</td><td>${report.projects ? report.projects.work_order_description : 'غير محدد'}</td></tr>
    <tr><td class="label">الموقع</td><td>${report.location || '-'}</td></tr>
    <tr><td class="label">معد التقرير</td><td>${report.users?.name || 'Unknown'}</td></tr>
  </table>
  
  ${report.work_description ? `<h2>🔧 الأعمال المنفذة</h2><p>${report.work_description}</p>` : ''}
  ${report.problems ? `<h2>⚠️ المشاكل</h2><p>${report.problems}</p>` : ''}
</body>
</html>
      `;

      return new Response(html, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="daily_report_${report.report_number}.doc"`,
        },
      });

    } else if (format === 'excel') {
      const csv = [
        ['تقرير يومي', report.report_number],
        [],
        ['التاريخ', new Date(report.report_date).toLocaleDateString('ar-SA')],
        ['المشروع', report.projects ? report.projects.work_order_description : 'غير محدد'],
        ['الموقع', report.location || '-'],
        ['معد التقرير', report.users?.name || 'Unknown'],
      ].map(row => row.join('\t')).join('\n');

      return new Response('\ufeff' + csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="daily_report_${report.report_number}.csv"`,
        },
      });

    } else if (format === 'pdf') {
      const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><title>تقرير يومي - ${report.report_number}</title></head>
<body onload="window.print()">
  <h1>🗂️ تقرير يومي - ${report.report_number}</h1>
  <p><strong>التاريخ:</strong> ${new Date(report.report_date).toLocaleDateString('ar-SA')}</p>
  <p><strong>المشروع:</strong> ${report.projects ? report.projects.work_order_description : 'غير محدد'}</p>
  <p><strong>معد التقرير:</strong> ${report.users?.name || 'Unknown'}</p>
</body>
</html>`;

      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return c.json({ error: "Invalid export format" }, 400);

  } catch (error) {
    console.log(`Error exporting daily report: ${error}`);
    return c.json({ error: "خطأ في تصدير التقرير" }, 500);
  }
});
