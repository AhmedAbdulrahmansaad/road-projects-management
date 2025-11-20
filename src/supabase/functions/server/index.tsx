import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { generateWordHTML, generateExcelCSV, generatePDFHTML } from "./export-helper.tsx";

// ============================================
// 🔐 Password Hashing Utilities (Deno-compatible)
// ============================================

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    data,
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  const hash = await hashPassword(password);
  return hash === hashedPassword;
}

const app = new Hono();

app.use("*", logger(console.log));
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Supabase Client with Service Role Key
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// ============================================
// 🔐 Authentication Routes
// ============================================

// Sign Up Route
app.post("/make-server-a52c947c/signup", async (c) => {
  try {
    console.log("🟢 [SIGNUP] Starting signup process...");

    const { email, password, fullName, role } =
      await c.req.json();
    console.log(
      `🟢 [SIGNUP] Received data: email=${email}, fullName=${fullName}, role=${role}`,
    );

    // Hash password
    console.log("🟢 [SIGNUP] Hashing password...");
    const hashedPassword = await hashPassword(password);
    console.log("🟢 [SIGNUP] Password hashed successfully");

    // Insert user into database
    console.log("🟢 [SIGNUP] Inserting user into database...");
    const { data, error } = await supabaseAdmin
      .from("users")
      .insert([
        {
          email,
          password: hashedPassword,
          name: fullName,
          role: role || "Observer",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(
        `❌ [SIGNUP] Database insert error: ${JSON.stringify(error)}`,
      );
      return c.json({ error: error.message }, 400);
    }

    console.log(
      `✅ [SIGNUP] User created in database with ID: ${data.id}`,
    );

    // Create auth user
    console.log("🟢 [SIGNUP] Creating auth user...");
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          full_name: fullName,
          role: role || "Observer",
          user_db_id: data.id,
        },
        email_confirm: true,
      });

    if (authError) {
      console.error(
        `❌ [SIGNUP] Auth creation error: ${JSON.stringify(authError)}`,
      );
      // Rollback database insert
      console.log(
        "🔄 [SIGNUP] Rolling back database insert...",
      );
      await supabaseAdmin
        .from("users")
        .delete()
        .eq("id", data.id);
      return c.json({ error: authError.message }, 400);
    }

    console.log(`✅ [SIGNUP] Auth user created successfully`);
    console.log(`✅ [SIGNUP] Signup complete for: ${email}`);

    return c.json({
      user: {
        id: data.id,
        email: data.email,
        fullName: data.name,
        role: data.role,
      },
      message: "تم إنشاء الحساب بنجاح",
    });
  } catch (error) {
    console.error(
      `❌ [SIGNUP] Unexpected server error: ${error.message}`,
    );
    console.error(`❌ [SIGNUP] Error stack: ${error.stack}`);
    return c.json(
      { error: `خطأ في إنشاء الحساب: ${error.message}` },
      500,
    );
  }
});

// Get User Profile
app.get("/make-server-a52c947c/profile", async (c) => {
  try {
    const accessToken = c.req
      .header("Authorization")
      ?.split(" ")[1];

    if (!accessToken) {
      return c.json({ error: "No access token" }, 401);
    }

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (!user || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get user from database
    const { data: userData, error: dbError } =
      await supabaseAdmin
        .from("users")
        .select("*")
        .eq("email", user.email)
        .single();

    if (dbError || !userData) {
      return c.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.user_metadata?.full_name || user.email,
          role: user.user_metadata?.role || "Observer",
        },
      });
    }

    return c.json({
      user: {
        id: userData.id,
        email: userData.email,
        fullName: userData.name,
        role: userData.role,
      },
    });
  } catch (error) {
    console.log(`Error fetching user profile: ${error}`);
    return c.json({ error: "خطأ في جلب البيانات" }, 500);
  }
});

// ============================================
// 👥 User Management Routes
// ============================================

// Get All Users (General Manager only - NO edit/delete for Branch Manager)
app.get("/make-server-a52c947c/users", async (c) => {
  try {
    const accessToken = c.req
      .header("Authorization")
      ?.split(" ")[1];
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (!user || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get current user role from database
    const { data: currentUser } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("email", user.email)
      .single();

    const role = currentUser?.role || user.user_metadata?.role;

    // Only General Manager can access users list
    if (role !== "General Manager" && role !== "المدير العام") {
      return c.json(
        {
          error:
            "Forbidden: Only General Manager can access this",
        },
        403,
      );
    }

    const { data: users, error: usersError } =
      await supabaseAdmin
        .from("users")
        .select("id, email, name, role, created_at")
        .order("created_at", { ascending: false });

    if (usersError) {
      return c.json({ error: usersError.message }, 500);
    }

    const usersFormatted = users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.name,
      role: u.role,
      createdAt: u.created_at,
    }));

    return c.json({ users: usersFormatted });
  } catch (error) {
    console.log(`Error fetching users: ${error}`);
    return c.json({ error: "خطأ في جلب المستخدمين" }, 500);
  }
});

// Delete User (General Manager only)
app.delete("/make-server-a52c947c/users/:userId", async (c) => {
  try {
    const accessToken = c.req
      .header("Authorization")
      ?.split(" ")[1];
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (!user || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get current user role
    const { data: currentUser } = await supabaseAdmin
      .from("users")
      .select("role, id")
      .eq("email", user.email)
      .single();

    const role = currentUser?.role;

    if (role !== "General Manager" && role !== "المدير العام") {
      return c.json(
        {
          error:
            "Forbidden: Only General Manager can delete users",
        },
        403,
      );
    }

    const userIdToDelete = c.req.param("userId");

    // Prevent user from deleting themselves
    if (currentUser.id === userIdToDelete) {
      return c.json({ error: "Cannot delete yourself" }, 400);
    }

    // Get user email for auth deletion
    const { data: userToDelete } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("id", userIdToDelete)
      .single();

    // Delete from database (CASCADE will handle related records)
    const { error: deleteError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", userIdToDelete);

    if (deleteError) {
      return c.json({ error: deleteError.message }, 400);
    }

    // Delete from Supabase Auth
    if (userToDelete?.email) {
      const { data: authUsers } =
        await supabaseAdmin.auth.admin.listUsers();
      const authUser = authUsers.users.find(
        (u) => u.email === userToDelete.email,
      );
      if (authUser) {
        await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      }
    }

    return c.json({ message: "User deleted successfully" });
  } catch (error) {
    console.log(`Error deleting user: ${error}`);
    return c.json({ error: "خطأ في حذف المستخدم" }, 500);
  }
});

// ============================================
// 🚧 Projects Routes
// ============================================

// Create Project
app.post("/make-server-a52c947c/projects", async (c) => {
  try {
    const accessToken = c.req
      .header("Authorization")
      ?.split(" ")[1];
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (!user || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get current user from database
    const { data: currentUser } = await supabaseAdmin
      .from("users")
      .select("id, name, email, role")
      .eq("email", user.email)
      .single();

    if (!currentUser) {
      return c.json({ error: "User not found" }, 404);
    }

    const projectData = await c.req.json();

    const { data: project, error: projectError } =
      await supabaseAdmin
        .from("projects")
        .insert([
          {
            work_order_number: projectData.workOrderNumber,
            contract_number: projectData.contractNumber,
            year: projectData.year || new Date().getFullYear(),
            project_type: projectData.projectType || "تنفيذ",
            road_number: projectData.roadNumber,
            road_name: projectData.roadName,
            work_order_description:
              projectData.workOrderDescription,
            project_number: projectData.projectNumber,
            project_value: projectData.projectValue || 0,
            duration: projectData.duration || 0,
            site_handover_date: projectData.siteHandoverDate,
            contract_end_date: projectData.contractEndDate,
            status: projectData.status || "جاري العمل",
            region: projectData.region,
            branch: projectData.branch,
            host_name: projectData.hostName || null,
            progress_actual: projectData.progressActual || 0,
            progress_planned: projectData.progressPlanned || 0,
            deviation: projectData.deviation || 0,
            notes: projectData.notes || null,
            created_by: currentUser.id,
            created_by_name: currentUser.name,
            created_by_email: currentUser.email,
          },
        ])
        .select()
        .single();

    if (projectError) {
      console.error(
        "❌ [CREATE PROJECT] Database error:",
        projectError,
      );
      return c.json({ error: projectError.message }, 400);
    }

    // Create notification
    await supabaseAdmin.from("notifications").insert([
      {
        title: "مشروع جديد",
        message: `تم إنشاء مشروع جديد: ${project.work_order_description}`,
        type: "success",
        user_id: null, // null means for all users
      },
    ]);

    return c.json({
      project,
      message: "تم إنشاء المشروع بنجاح",
    });
  } catch (error) {
    console.error(`❌ [CREATE PROJECT] Error: ${error}`);
    return c.json({ error: "خطأ في إنشاء المشروع" }, 500);
  }
});

// Get All Projects
app.get("/make-server-a52c947c/projects", async (c) => {
  try {
    const accessToken = c.req
      .header("Authorization")
      ?.split(" ")[1];
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (!user || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data: projects, error: projectsError } =
      await supabaseAdmin
        .from("projects")
        .select(
          `
        *,
        creator:created_by (
          id,
          name,
          email
        )
      `,
        )
        .order("created_at", { ascending: false });

    if (projectsError) {
      return c.json({ error: projectsError.message }, 500);
    }

    const projectsFormatted = projects.map((p) => ({
      id: p.id,
      workOrderNumber: p.work_order_number,
      contractNumber: p.contract_number,
      year: p.year,
      projectType: p.project_type,
      roadNumber: p.road_number,
      roadName: p.road_name,
      workOrderDescription: p.work_order_description,
      projectNumber: p.project_number,
      projectValue: p.project_value,
      duration: p.duration,
      siteHandoverDate: p.site_handover_date,
      contractEndDate: p.contract_end_date,
      status: p.status,
      region: p.region,
      branch: p.branch,
      hostName: p.host_name,
      progressActual: p.progress_actual,
      progressPlanned: p.progress_planned,
      deviation: p.deviation,
      notes: p.notes,
      createdBy: p.created_by,
      createdByName:
        p.created_by_name || p.creator?.name || "غير معروف",
      createdByEmail:
        p.created_by_email || p.creator?.email || "",
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    return c.json({ projects: projectsFormatted });
  } catch (error) {
    console.log(`Error fetching projects: ${error}`);
    return c.json({ error: "خطأ في جلب المشاريع" }, 500);
  }
});

// Update Project (General Manager only)
app.put("/make-server-a52c947c/projects/:id", async (c) => {
  try {
    const accessToken = c.req
      .header("Authorization")
      ?.split(" ")[1];
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (!user || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get current user role
    const { data: currentUser } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("email", user.email)
      .single();

    const role = currentUser?.role;

    if (role !== "General Manager" && role !== "المدير العام") {
      return c.json(
        {
          error:
            "غير مصرح لك بتعديل المشاريع - المدير العام فقط",
        },
        403,
      );
    }

    const projectId = c.req.param("id");
    const updates = await c.req.json();

    console.log(
      "🟢 [UPDATE PROJECT] Updating project:",
      projectId,
    );
    console.log("🟢 [UPDATE PROJECT] Updates:", updates);

    const { data: project, error: updateError } =
      await supabaseAdmin
        .from("projects")
        .update({
          work_order_number: updates.workOrderNumber,
          contract_number: updates.contractNumber,
          year: updates.year,
          project_type: updates.projectType,
          road_number: updates.roadNumber,
          road_name: updates.roadName,
          work_order_description: updates.workOrderDescription,
          project_number: updates.projectNumber,
          project_value: updates.projectValue,
          duration: updates.duration,
          site_handover_date: updates.siteHandoverDate,
          contract_end_date: updates.contractEndDate,
          status: updates.status,
          region: updates.region,
          branch: updates.branch,
          host_name: updates.hostName,
          progress_actual: updates.progressActual,
          progress_planned: updates.progressPlanned,
          deviation: updates.deviation,
          notes: updates.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId)
        .select()
        .single();

    if (updateError) {
      console.error("❌ [UPDATE PROJECT] Error:", updateError);
      return c.json({ error: updateError.message }, 400);
    }

    console.log("✅ [UPDATE PROJECT] Successfully updated");

    // Create notification
    await supabaseAdmin.from("notifications").insert([
      {
        title: "تحديث مشروع",
        message: `تم تحديث مشروع: ${updates.workOrderDescription}`,
        type: "info",
        user_id: null,
      },
    ]);

    return c.json({
      project,
      message: "تم تحديث المشروع بنجاح",
    });
  } catch (error) {
    console.error(`❌ [UPDATE PROJECT] Error: ${error}`);
    return c.json({ error: "خطأ في تحديث المشروع" }, 500);
  }
});

// Delete Project (General Manager only)
app.delete("/make-server-a52c947c/projects/:id", async (c) => {
  try {
    const accessToken = c.req
      .header("Authorization")
      ?.split(" ")[1];
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (!user || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get current user role
    const { data: currentUser } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("email", user.email)
      .single();

    const role = currentUser?.role;

    if (role !== "General Manager" && role !== "المدير العام") {
      return c.json(
        {
          error: "غير مصرح لك بحذف المشاريع - المدير العام فقط",
        },
        403,
      );
    }

    const projectId = c.req.param("id");

    const { error: deleteError } = await supabaseAdmin
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (deleteError) {
      return c.json({ error: deleteError.message }, 400);
    }

    return c.json({ message: "تم حذف المشروع بنجاح" });
  } catch (error) {
    console.log(`Error deleting project: ${error}`);
    return c.json({ error: "خطأ في حذف المشروع" }, 500);
  }
});

// ============================================
// 📊 Daily Reports Routes
// ============================================

// Create Daily Report
app.post("/make-server-a52c947c/daily-reports", async (c) => {
  try {
    const accessToken = c.req
      .header("Authorization")
      ?.split(" ")[1];
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (!user || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data: currentUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", user.email)
      .single();

    if (!currentUser) {
      return c.json({ error: "User not found" }, 404);
    }

    const reportData = await c.req.json();

    // Validate projectId
    if (!reportData.projectId) {
      console.log(
        "❌ [DAILY REPORT ERROR]: project_id is required",
      );
      return c.json({ error: "المشروع مطلوب" }, 400);
    }

    const { data: report, error: reportError } =
      await supabaseAdmin
        .from("daily_reports")
        .insert([
          {
            project_id: reportData.projectId,
            report_date: reportData.reportDate,
            weather: reportData.weatherCondition || "مشمس",
            work_description: reportData.workDescription,
            workers_count:
              parseInt(reportData.workersCount) || 0,
            equipment_used: reportData.equipment || "",
            notes: reportData.notes || "",
            created_by: currentUser.id,
          },
        ])
        .select()
        .single();

    if (reportError) {
      console.log("❌ [DAILY REPORT ERROR]:", reportError);
      return c.json({ error: reportError.message }, 400);
    }

    // Create notification
    await supabaseAdmin.from("notifications").insert([
      {
        title: "تقرير يومي جديد",
        message: `تم إضافة تقرير يومي جديد: ${reportData.workDescription.substring(0, 50)}...`,
        type: reportData.issues ? "warning" : "info",
        user_id: null,
      },
    ]);

    return c.json({
      report,
      message: "تم إنشاء التقرير اليومي بنجاح",
    });
  } catch (error) {
    console.log(`Error creating daily report: ${error}`);
    return c.json(
      { error: "خطأ في إنشاء التقرير اليومي" },
      500,
    );
  }
});

// Get All Daily Reports
app.get("/make-server-a52c947c/daily-reports", async (c) => {
  try {
    const accessToken = c.req
      .header("Authorization")
      ?.split(" ")[1];
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (!user || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data: reports, error: reportsError } =
      await supabaseAdmin
        .from("daily_reports")
        .select(
          `
        *,
        project:project_id (
          id,
          work_order_description,
          project_number
        ),
        creator:created_by (
          id,
          name
        )
      `,
        )
        .order("report_date", { ascending: false });

    if (reportsError) {
      return c.json({ error: reportsError.message }, 500);
    }

    const reportsFormatted = reports.map((r) => ({
      id: r.id,
      projectId: r.project_id || null,
      projectName:
        r.project?.work_order_description || "بدون مشروع",
      reportDate: r.report_date,
      weatherCondition: r.weather,
      workDescription: r.work_description,
      workersCount: r.workers_count,
      equipment: r.equipment_used,
      notes: r.notes,
      createdBy: r.created_by,
      createdByName: r.creator?.name || "غير معروف",
      createdAt: r.created_at,
    }));

    return c.json({ reports: reportsFormatted });
  } catch (error) {
    console.log(`Error fetching daily reports: ${error}`);
    return c.json(
      { error: "خطأ في جلب التقارير اليومية" },
      500,
    );
  }
});

// Update Daily Report (General Manager only)
app.put(
  "/make-server-a52c947c/daily-reports/:id",
  async (c) => {
    try {
      const accessToken = c.req
        .header("Authorization")
        ?.split(" ")[1];
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(accessToken);

      if (!user || error) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { data: currentUser } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("email", user.email)
        .single();

      const role = currentUser?.role;

      if (
        role !== "General Manager" &&
        role !== "المدير العام"
      ) {
        return c.json(
          {
            error:
              "غير مصرح لك بتعديل التقارير - المدير العام فقط",
          },
          403,
        );
      }

      const reportId = c.req.param("id");
      const updates = await c.req.json();

      const { data: report, error: updateError } =
        await supabaseAdmin
          .from("daily_reports")
          .update({
            report_date: updates.reportDate,
            weather: updates.weatherCondition,
            work_description: updates.workDescription,
            workers_count: updates.workersCount,
            equipment_used: updates.equipment,
            notes: updates.notes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", reportId)
          .select()
          .single();

      if (updateError) {
        return c.json({ error: updateError.message }, 400);
      }

      return c.json({
        report,
        message: "تم تحديث التقرير بنجاح",
      });
    } catch (error) {
      console.log(`Error updating daily report: ${error}`);
      return c.json({ error: "خطأ في تحديث التقرير" }, 500);
    }
  },
);

// Delete Daily Report (General Manager only)
app.delete(
  "/make-server-a52c947c/daily-reports/:id",
  async (c) => {
    try {
      const accessToken = c.req
        .header("Authorization")
        ?.split(" ")[1];
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(accessToken);

      if (!user || error) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { data: currentUser } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("email", user.email)
        .single();

      const role = currentUser?.role;

      if (
        role !== "General Manager" &&
        role !== "المدير العام"
      ) {
        return c.json(
          {
            error:
              "غير مصرح لك بحذف التقارير - المدير العام فقط",
          },
          403,
        );
      }

      const reportId = c.req.param("id");

      const { error: deleteError } = await supabaseAdmin
        .from("daily_reports")
        .delete()
        .eq("id", reportId);

      if (deleteError) {
        return c.json({ error: deleteError.message }, 400);
      }

      return c.json({ message: "تم حذف التقرير بنجاح" });
    } catch (error) {
      console.log(`Error deleting daily report: ${error}`);
      return c.json({ error: "خطأ في حذف التقرير" }, 500);
    }
  },
);

// ============================================
// 📈 Performance Contracts Routes
// ============================================

// Get Performance Contracts
app.get(
  "/make-server-a52c947c/performance-contracts",
  async (c) => {
    try {
      const accessToken = c.req
        .header("Authorization")
        ?.split(" ")[1];
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(accessToken);

      if (!user || error) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { data: contracts, error: contractsError } =
        await supabaseAdmin
          .from("performance_contracts")
          .select("*")
          .order("created_at", { ascending: false });

      if (contractsError) {
        return c.json({ error: contractsError.message }, 500);
      }

      // تحويل من snake_case إلى camelCase
      const contractsFormatted =
        contracts?.map((c) => ({
          id: c.id,
          contractNumber: c.contract_number || "",
          projectName: c.project_name || "",
          contractorName: c.contractor_name || "",
          year: c.year || new Date().getFullYear(),
          month: c.month || "",
          contractorScore: c.contractor_score || 0,
          yearlyWeighted: c.yearly_weighted || 0,
          difference: c.difference || 0,
          createdAt: c.created_at,
          createdBy: c.created_by,
        })) || [];

      return c.json({ contracts: contractsFormatted });
    } catch (error) {
      console.log(
        `Error fetching performance contracts: ${error}`,
      );
      return c.json({ error: "خطأ في جلب عقود الأداء" }, 500);
    }
  },
);

// Create Performance Contract (General Manager only)
app.post(
  "/make-server-a52c947c/performance-contracts",
  async (c) => {
    try {
      const accessToken = c.req
        .header("Authorization")
        ?.split(" ")[1];
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(accessToken);

      if (!user || error) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { data: currentUser } = await supabaseAdmin
        .from("users")
        .select("id, role")
        .eq("email", user.email)
        .single();

      const role = currentUser?.role;

      if (
        role !== "General Manager" &&
        role !== "المدير العام"
      ) {
        return c.json(
          {
            error: "Only General Manager can create contracts",
          },
          403,
        );
      }

      const contractData = await c.req.json();

      const { data: contract, error: contractError } =
        await supabaseAdmin
          .from("performance_contracts")
          .insert([
            {
              contract_number: contractData.contractNumber,
              project_name: contractData.projectName,
              contractor_name: contractData.contractorName,
              year: contractData.year,
              month: contractData.month,
              contractor_score: parseFloat(
                contractData.contractorScore,
              ),
              yearly_weighted: parseFloat(
                contractData.yearlyWeighted,
              ),
              difference: contractData.difference,
              created_by: currentUser.id,
            },
          ])
          .select()
          .single();

      if (contractError) {
        return c.json({ error: contractError.message }, 400);
      }

      // Create notifications for Branch Manager and Admin Manager
      const { data: targetUsers } = await supabaseAdmin
        .from("users")
        .select("id")
        .in("role", [
          "مدير عام الفرع",
          "Branch General Manager",
          "المدير الإداري",
          "Admin Manager",
        ]);

      if (targetUsers && targetUsers.length > 0) {
        const notifications = targetUsers.map((u) => ({
          user_id: u.id,
          title: "عقد أداء جديد",
          message: `تم إضافة عقد أداء جديد: ${contractData.contractNumber}`,
          type: "info",
        }));

        await supabaseAdmin
          .from("notifications")
          .insert(notifications);
      }

      return c.json({
        contract,
        message: "تم إضافة عقد الأداء بنجاح",
      });
    } catch (error) {
      console.log(
        `Error creating performance contract: ${error}`,
      );
      return c.json({ error: "خطأ في إنشاء عقد الأداء" }, 500);
    }
  },
);

// Update Performance Contract (General Manager only)
app.put(
  "/make-server-a52c947c/performance-contracts",
  async (c) => {
    try {
      const accessToken = c.req
        .header("Authorization")
        ?.split(" ")[1];
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(accessToken);

      if (!user || error) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { data: currentUser } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("email", user.email)
        .single();

      const role = currentUser?.role;

      if (
        role !== "General Manager" &&
        role !== "المدير العام"
      ) {
        return c.json(
          {
            error: "Only General Manager can update contracts",
          },
          403,
        );
      }

      const { id, ...contractData } = await c.req.json();

      const { data: contract, error: updateError } =
        await supabaseAdmin
          .from("performance_contracts")
          .update({
            contract_number: contractData.contractNumber,
            project_name: contractData.projectName,
            contractor_name: contractData.contractorName,
            year: contractData.year,
            month: contractData.month,
            contractor_score: parseFloat(
              contractData.contractorScore,
            ),
            yearly_weighted: parseFloat(
              contractData.yearlyWeighted,
            ),
            difference: contractData.difference,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single();

      if (updateError) {
        return c.json({ error: updateError.message }, 400);
      }

      // Create notifications
      const { data: targetUsers } = await supabaseAdmin
        .from("users")
        .select("id")
        .in("role", [
          "مدير عام الفرع",
          "Branch General Manager",
          "المدير الإداري",
          "Admin Manager",
        ]);

      if (targetUsers && targetUsers.length > 0) {
        const notifications = targetUsers.map((u) => ({
          user_id: u.id,
          title: "تحديث عقد أداء",
          message: `تم تحديث عقد الأداء: ${contractData.contractNumber}`,
          type: "info",
        }));

        await supabaseAdmin
          .from("notifications")
          .insert(notifications);
      }

      return c.json({
        contract,
        message: "تم تحديث عقد الأداء بنجاح",
      });
    } catch (error) {
      console.log(
        `Error updating performance contract: ${error}`,
      );
      return c.json({ error: "خطأ في تحديث عقد الأداء" }, 500);
    }
  },
);

// Delete Performance Contract (General Manager only)
app.delete(
  "/make-server-a52c947c/performance-contracts",
  async (c) => {
    try {
      const accessToken = c.req
        .header("Authorization")
        ?.split(" ")[1];
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(accessToken);

      if (!user || error) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { data: currentUser } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("email", user.email)
        .single();

      const role = currentUser?.role;

      if (
        role !== "General Manager" &&
        role !== "المدير العام"
      ) {
        return c.json(
          {
            error: "Only General Manager can delete contracts",
          },
          403,
        );
      }

      const { id } = await c.req.json();

      const { error: deleteError } = await supabaseAdmin
        .from("performance_contracts")
        .delete()
        .eq("id", id);

      if (deleteError) {
        return c.json({ error: deleteError.message }, 400);
      }

      return c.json({ message: "تم حذف عقد الأداء بنجاح" });
    } catch (error) {
      console.log(
        `Error deleting performance contract: ${error}`,
      );
      return c.json({ error: "خطأ في حذف عقد الأداء" }, 500);
    }
  },
);

// ============================================
// 🔔 Notifications Routes
// ============================================

// Get Notifications
app.get("/make-server-a52c947c/notifications", async (c) => {
  try {
    const accessToken = c.req
      .header("Authorization")
      ?.split(" ")[1];
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (!user || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data: currentUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", user.email)
      .single();

    if (!currentUser) {
      return c.json({ notifications: [] });
    }

    // Get notifications for this user or for all users (user_id is null)
    const { data: notifications, error: notificationsError } =
      await supabaseAdmin
        .from("notifications")
        .select("*")
        .or(`user_id.eq.${currentUser.id},user_id.is.null`)
        .order("created_at", { ascending: false })
        .limit(50);

    if (notificationsError) {
      return c.json({ error: notificationsError.message }, 500);
    }

    const notificationsFormatted = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.is_read,
      timestamp: n.created_at,
      userId: n.user_id || "all",
    }));

    return c.json({ notifications: notificationsFormatted });
  } catch (error) {
    console.log(`Error fetching notifications: ${error}`);
    return c.json({ error: "خطأ في جلب الإشعارات" }, 500);
  }
});

// Mark Notification as Read
app.put(
  "/make-server-a52c947c/notifications/:id/read",
  async (c) => {
    try {
      const accessToken = c.req
        .header("Authorization")
        ?.split(" ")[1];
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(accessToken);

      if (!user || error) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const notificationId = c.req.param("id");

      await supabaseAdmin
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      return c.json({ message: "تم تحديد الإشعار كمقروء" });
    } catch (error) {
      console.log(
        `Error marking notification as read: ${error}`,
      );
      return c.json({ error: "خطأ في تحديث الإشعار" }, 500);
    }
  },
);

// Mark All Notifications as Read
app.put(
  "/make-server-a52c947c/notifications/read-all",
  async (c) => {
    try {
      const accessToken = c.req
        .header("Authorization")
        ?.split(" ")[1];
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(accessToken);

      if (!user || error) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { data: currentUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", user.email)
        .single();

      await supabaseAdmin
        .from("notifications")
        .update({ is_read: true })
        .or(`user_id.eq.${currentUser.id},user_id.is.null`);

      return c.json({
        message: "تم تحديد جميع الإشعارات كمقروءة",
      });
    } catch (error) {
      console.log(
        `Error marking all notifications as read: ${error}`,
      );
      return c.json({ error: "خطأ في تحديث الإشعارات" }, 500);
    }
  },
);

// Delete Notification
app.delete(
  "/make-server-a52c947c/notifications/:id",
  async (c) => {
    try {
      const accessToken = c.req
        .header("Authorization")
        ?.split(" ")[1];
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(accessToken);

      if (!user || error) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const notificationId = c.req.param("id");

      await supabaseAdmin
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      return c.json({ message: "تم حذف الإشعار بنجاح" });
    } catch (error) {
      console.log(`Error deleting notification: ${error}`);
      return c.json({ error: "خطأ في حذف الإشعار" }, 500);
    }
  },
);

// ============================================
// 🤖 AI Assistant Routes - REAL & ROLE-BASED
// ============================================

// AI Assistant - Analyze Data based on User Role
app.post("/make-server-a52c947c/ai/analyze", async (c) => {
  try {
    const accessToken = c.req
      .header("Authorization")
      ?.split(" ")[1];
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (!user || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get current user role
    const { data: currentUser } = await supabaseAdmin
      .from("users")
      .select("role, name")
      .eq("email", user.email)
      .single();

    const { query } = await c.req.json();
    const role = currentUser?.role || "Observer";
    const lowerQuery = query.toLowerCase();

    let response = "";

    // Get data based on user role
    const { data: projects } = await supabaseAdmin
      .from("projects")
      .select("*");
    const { data: dailyReports } = await supabaseAdmin
      .from("daily_reports")
      .select("*");
    const { data: performanceContracts } = await supabaseAdmin
      .from("performance_contracts")
      .select("*");

    // Role-based responses
    if (role === "المدير العام" || role === "General Manager") {
      // Full access to all data
      if (
        lowerQuery.includes("إحصائ") ||
        lowerQuery.includes("تقرير شامل")
      ) {
        response = `📊 تقرير شامل للنظام:\\n\\n`;
        response += `• إجمالي المشاريع: ${projects?.length || 0}\\n`;
        response += `• المشاريع قيد التنفيذ: ${projects?.filter((p) => p.status === "قيد التنفيذ").length || 0}\\n`;
        response += `• المشاريع المكتملة: ${projects?.filter((p) => p.status === "مكتمل").length || 0}\\n`;
        response += `• التقارير اليومية: ${dailyReports?.length || 0}\\n`;
        response += `• عقود الأداء: ${performanceContracts?.length || 0}\\n`;

        const totalValue =
          projects?.reduce(
            (sum, p) => sum + (p.contract_value || 0),
            0,
          ) || 0;
        response += `• إجمالي قيمة المشاريع: ${totalValue.toLocaleString("ar-SA")} ريال`;
      } else if (
        lowerQuery.includes("متأخر") ||
        lowerQuery.includes("تأخر")
      ) {
        const delayed =
          projects?.filter((p) => p.status === "متوقف") || [];
        response = `⚠️ المشاريع المتأخرة (${delayed.length}):\\n\\n`;
        delayed.forEach((p) => {
          response += `• ${p.project_name} - ${p.location}\\n`;
        });
      } else {
        response = `مرحباً ${currentUser.name}! أنا المساعد الذكي.\\n\\nكمدير عام، يمكنك السؤال عن:\\n• الإحصائيات الشاملة\\n• المشاريع المتأخرة\\n• قيمة المشاريع\\n• عقود الأداء\\n• التقارير اليومية`;
      }
    } else if (
      role === "مدير عام الفرع" ||
      role === "Branch General Manager" ||
      role === "المدير الإداري" ||
      role === "Admin Manager"
    ) {
      // View-only access
      if (
        lowerQuery.includes("مشاريع") ||
        lowerQuery.includes("عدد")
      ) {
        response = `📋 إحصائيات المشاريع:\\n\\n`;
        response += `• إجمالي: ${projects?.length || 0}\\n`;
        response += `• قيد التنفيذ: ${projects?.filter((p) => p.status === "قيد التنفيذ").length || 0}\\n`;
        response += `• مكتمل: ${projects?.filter((p) => p.status === "مكتمل").length || 0}`;
      } else if (
        lowerQuery.includes("تقرير") ||
        lowerQuery.includes("يومي")
      ) {
        response = `📊 التقارير اليومية:\\n\\n`;
        response += `• إجمالي التقارير: ${dailyReports?.length || 0}\\n`;
        response += `• آخر تقرير: ${dailyReports?.[0]?.report_date || "لا يوجد"}`;
      } else {
        response = `مرحباً ${currentUser.name}!\\n\\nكـ${role}، يمكنك الاطلاع على:\\n• إحصائيات المشاريع\\n• التقارير اليومية\\n• عقود الأداء (عرض فقط)`;
      }
    } else if (
      role === "المهندس المشرف" ||
      role === "Supervising Engineer" ||
      role === "المهندس" ||
      role === "Engineer"
    ) {
      // Create projects and reports, view all
      if (lowerQuery.includes("مشاريع")) {
        response = `👷 المشاريع الحالية:\\n\\n`;
        const activeProjects =
          projects?.filter((p) => p.status === "قيد التنفيذ") ||
          [];
        response += `• قيد التنفيذ: ${activeProjects.length}\\n\\n`;
        activeProjects.slice(0, 5).forEach((p) => {
          response += `• ${p.project_name}\\n`;
        });
      } else if (lowerQuery.includes("تقرير")) {
        response = `📝 يمكنك:\\n• إنشاء تقارير يومية جديدة\\n• عرض جميع التقارير\\n• تتب تقدم المشاريع`;
      } else {
        response = `مرحباً ${currentUser.name}!\\n\\nكمهندس، يمكنك:\\n• إنشاء مشاريع جديدة\\n• إضافة تقارير يومية\\n• عرض جميع المشاريع`;
      }
    } else {
      // Observer - view only
      response = `مرحباً ${currentUser.name}!\\n\\nكمراقب، يمكنك عرض:\\n• جميع المشاريع\\n• التقارير اليومية\\n• إحصائيات عامة`;
    }

    return c.json({ response });
  } catch (error) {
    console.log(`Error in AI analysis: ${error}`);
    return c.json({ error: "خطأ في تحليل البيانات" }, 500);
  }
});

// AI Assistant - Create Project from Description (Engineers only)
app.post(
  "/make-server-a52c947c/ai/create-project",
  async (c) => {
    try {
      const accessToken = c.req
        .header("Authorization")
        ?.split(" ")[1];
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(accessToken);

      if (!user || error) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { data: currentUser } = await supabaseAdmin
        .from("users")
        .select("id, role")
        .eq("email", user.email)
        .single();

      const role = currentUser?.role;

      // Check permissions
      const canCreate = [
        "المدير العام",
        "General Manager",
        "المهندس المشرف",
        "Supervising Engineer",
        "المهندس",
        "Engineer",
      ].includes(role);

      if (!canCreate) {
        return c.json(
          { error: "ليس لديك صلاحية لإنشاء المشاريع" },
          403,
        );
      }

      const { description, type } = await c.req.json();

      // Extract info from description (AI simulation)
      const regions = [
        "الرياض",
        "جدة",
        "مكة",
        "المدينة",
        "الدمام",
        "القصيم",
        "تبوك",
        "حائل",
        "نجران",
        "عسير",
      ];
      const region =
        regions.find((r) => description.includes(r)) ||
        "الرياض";

      const roadName = description.includes("طريق")
        ? description
            .substring(
              description.indexOf("طريق"),
              description.indexOf("طريق") + 50,
            )
            .trim()
        : "طريق جديد";

      // استخراج معلومات إضافية من الوصف
      const projectType = description.includes("صيانة")
        ? "صيانة"
        : "تنفيذ";
      const workOrderNumber = `AI-${Date.now().toString().slice(-6)}`;
      const contractNumber = `CT-${Date.now().toString().slice(-8)}`;
      const projectNumber = `PRJ-${Date.now().toString().slice(-6)}`;
      const roadNumber = Math.floor(
        Math.random() * 900 + 100,
      ).toString();

      // Get user details for created_by fields
      const { data: userData } = await supabaseAdmin
        .from("users")
        .select("id, name, email")
        .eq("email", user.email)
        .single();

      const currentDate = new Date()
        .toISOString()
        .split("T")[0];
      const futureDate = new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
      )
        .toISOString()
        .split("T")[0];

      const { data: project, error: projectError } =
        await supabaseAdmin
          .from("projects")
          .insert([
            {
              work_order_number: workOrderNumber,
              contract_number: contractNumber,
              year: new Date().getFullYear(),
              project_type: projectType,
              road_number: roadNumber,
              road_name: roadName,
              work_order_description:
                description || "تم إنشاؤه بواسطة المساعد الذكي",
              project_number: projectNumber,
              duration: 12,
              site_handover_date: currentDate,
              contract_end_date: futureDate,
              progress_actual: 0,
              progress_planned: 0,
              deviation: 0,
              status: "جاري العمل",
              branch: `فرع ${region}`,
              region: region,
              project_value: 5000000,
              host_name: "سيتم التحديد",
              notes: "تم الإنشاء بواسطة المساعد الذكي",
              created_by: userData?.id || currentUser.id,
              created_by_name: userData?.name || "مستخدم",
              created_by_email: userData?.email || user.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

      if (projectError) {
        console.log(
          `[AI CREATE PROJECT] Error: ${projectError.message}`,
        );
        return c.json({ error: projectError.message }, 400);
      }

      console.log(
        `[AI CREATE PROJECT] Successfully created project:`,
        project,
      );

      // إنشاء إشعار
      await supabaseAdmin.from("notifications").insert([
        {
          type: "project_created",
          title: "مشروع جديد من المساعد الذكي",
          message: `تم إنشاء مشروع "${roadName}" بواسطة المساعد الذكي`,
          user_id: userData?.id || currentUser.id,
          user_name: userData?.name || "مستخدم",
          created_at: new Date().toISOString(),
        },
      ]);

      return c.json({
        project,
        message: "تم إنشاء المشروع بنجاح بواسطة المساعد الذكي",
      });
    } catch (error) {
      console.log(`Error in AI create project: ${error}`);
      return c.json({ error: "خطأ في إنشاء المشروع" }, 500);
    }
  },
);

// Initialize storage buckets
const initializeStorage = async () => {
  try {
    const buckets = [
      "make-a52c947c-daily-reports",
      "make-a52c947c-projects",
    ];

    for (const bucketName of buckets) {
      const { data: existing } =
        await supabaseAdmin.storage.listBuckets();
      const bucketExists = existing?.some(
        (bucket) => bucket.name === bucketName,
      );

      if (!bucketExists) {
        await supabaseAdmin.storage.createBucket(bucketName, {
          public: false,
          fileSizeLimit: 10485760, // 10MB
        });
        console.log(`✅ Created bucket: ${bucketName}`);
      }
    }
    console.log("✅ Storage initialized successfully");
  } catch (error) {
    console.log(`❌ Error initializing storage: ${error}`);
  }
};

initializeStorage();

console.log(
  "🚀 Server started successfully with SQL database!",
);
console.log("📊 Using PostgreSQL database via Supabase");
console.log("🤖 AI Assistant is active and role-based");

// ============================================
// 📊 Daily Reports (KV Store) Routes
// ============================================

// Create Daily Report (KV)
app.post(
  "/make-server-a52c947c/daily-reports-kv",
  async (c) => {
    try {
      const accessToken = c.req
        .header("Authorization")
        ?.split(" ")[1];
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(accessToken);

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

      // Generate report number
      const reportNumber = `DR-${Date.now()}`;

      // Calculate total workers
      const saudiWorkers =
        parseInt(reportData.saudiWorkers) || 0;
      const nonSaudiWorkers =
        parseInt(reportData.nonSaudiWorkers) || 0;
      const totalWorkers = saudiWorkers + nonSaudiWorkers;

      // Get project name if projectId provided
      let projectName = null;
      if (reportData.projectId) {
        const { data: project } = await supabaseAdmin
          .from("projects")
          .select("work_order_description, project_number")
          .eq("id", reportData.projectId)
          .single();

        if (project) {
          projectName = `${project.work_order_description} (${project.project_number})`;
        }
      }

      const report = {
        id: crypto.randomUUID(),
        reportNumber,
        reportDate: reportData.reportDate,
        projectId: reportData.projectId || null,
        projectName,
        location: reportData.location || null,
        weatherCondition: reportData.weatherCondition || null,
        temperature: reportData.temperature || null,
        workHoursFrom: reportData.workHoursFrom || null,
        workHoursTo: reportData.workHoursTo || null,
        saudiWorkers,
        nonSaudiWorkers,
        totalWorkers,
        equipmentUsed: reportData.equipmentUsed || null,
        workDescription: reportData.workDescription || null,
        dailyProgress:
          parseFloat(reportData.dailyProgress) || null,
        executedQuantities:
          reportData.executedQuantities || null,
        materialsUsed: reportData.materialsUsed || null,
        problems: reportData.problems || null,
        accidents: reportData.accidents || null,
        officialVisits: reportData.officialVisits || null,
        recommendations: reportData.recommendations || null,
        generalNotes: reportData.generalNotes || null,
        images: [],
        createdBy: currentUser.id,
        createdByName: currentUser.name,
        createdAt: new Date().toISOString(),
      };

      // Save to KV store
      await kv.set(`daily_report:${report.id}`, report);

      // Create notification
      await supabaseAdmin.from("notifications").insert([
        {
          title: "تقرير يومي جديد",
          message: `تم إضافة تقرير يومي جديد: ${reportNumber} - ${reportData.workDescription?.substring(0, 50) || "تقرير جديد"}`,
          type:
            reportData.problems || reportData.accidents
              ? "warning"
              : "info",
          user_id: null,
        },
      ]);

      return c.json({
        report,
        message: "تم إنشاء التقرير اليومي بنجاح",
      });
    } catch (error) {
      console.log(`Error creating daily report (KV): ${error}`);
      return c.json(
        { error: "خطأ في إنشاء التقرير اليومي" },
        500,
      );
    }
  },
);

// Get All Daily Reports (KV)
app.get("/make-server-a52c947c/daily-reports-kv", async (c) => {
  try {
    const accessToken = c.req
      .header("Authorization")
      ?.split(" ")[1];
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (!user || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get all reports from KV store
    const allReports = await kv.getByPrefix("daily_report:");

    // Sort by date descending
    const sortedReports = allReports.sort(
      (a: any, b: any) =>
        new Date(b.reportDate).getTime() -
        new Date(a.reportDate).getTime(),
    );

    return c.json({ reports: sortedReports });
  } catch (error) {
    console.log(`Error fetching daily reports (KV): ${error}`);
    return c.json(
      { error: "خطأ في جلب التقارير اليومية" },
      500,
    );
  }
});

// Get Reports by Project ID (KV)
app.get(
  "/make-server-a52c947c/daily-reports-kv/project/:projectId",
  async (c) => {
    try {
      const accessToken = c.req
        .header("Authorization")
        ?.split(" ")[1];
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(accessToken);

      if (!user || error) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const projectId = c.req.param("projectId");

      // Get all reports and filter by project
      const allReports = await kv.getByPrefix("daily_report:");
      const projectReports = allReports.filter(
        (r: any) => r.projectId === projectId,
      );

      return c.json({ reports: projectReports });
    } catch (error) {
      console.log(
        `Error fetching project reports (KV): ${error}`,
      );
      return c.json(
        { error: "خطأ في جلب تقارير المشروع" },
        500,
      );
    }
  },
);

// Update Daily Report (KV)
app.put(
  "/make-server-a52c947c/daily-reports-kv/:id",
  async (c) => {
    try {
      const accessToken = c.req
        .header("Authorization")
        ?.split(" ")[1];
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(accessToken);

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

      // Get existing report
      const existingReport = await kv.get(
        `daily_report:${reportId}`,
      );

      if (!existingReport) {
        return c.json({ error: "Report not found" }, 404);
      }

      // Check permissions
      const isGeneralManager =
        currentUser.role === "General Manager" ||
        currentUser.role === "المدير العام" ||
        currentUser.role === "general_manager";
      const isOwner =
        existingReport.createdBy === currentUser.id;

      if (!isGeneralManager && !isOwner) {
        return c.json(
          { error: "Unauthorized to edit this report" },
          403,
        );
      }

      // Calculate total workers
      const saudiWorkers =
        parseInt(reportData.saudiWorkers) || 0;
      const nonSaudiWorkers =
        parseInt(reportData.nonSaudiWorkers) || 0;
      const totalWorkers = saudiWorkers + nonSaudiWorkers;

      // Get project name if projectId provided
      let projectName = null;
      if (reportData.projectId) {
        const { data: project } = await supabaseAdmin
          .from("projects")
          .select("work_order_description, project_number")
          .eq("id", reportData.projectId)
          .single();

        if (project) {
          projectName = `${project.work_order_description} (${project.project_number})`;
        }
      }

      const updatedReport = {
        ...existingReport,
        reportDate: reportData.reportDate,
        projectId: reportData.projectId || null,
        projectName,
        location: reportData.location || null,
        weatherCondition: reportData.weatherCondition || null,
        temperature: reportData.temperature || null,
        workHoursFrom: reportData.workHoursFrom || null,
        workHoursTo: reportData.workHoursTo || null,
        saudiWorkers,
        nonSaudiWorkers,
        totalWorkers,
        equipmentUsed: reportData.equipmentUsed || null,
        workDescription: reportData.workDescription || null,
        dailyProgress:
          parseFloat(reportData.dailyProgress) || null,
        executedQuantities:
          reportData.executedQuantities || null,
        materialsUsed: reportData.materialsUsed || null,
        problems: reportData.problems || null,
        accidents: reportData.accidents || null,
        officialVisits: reportData.officialVisits || null,
        recommendations: reportData.recommendations || null,
        generalNotes: reportData.generalNotes || null,
        updatedAt: new Date().toISOString(),
      };

      await kv.set(`daily_report:${reportId}`, updatedReport);

      // Create notification
      await supabaseAdmin.from("notifications").insert([
        {
          title: "تحديث تقرير يومي",
          message: `تم تحديث التقرير: ${existingReport.reportNumber}`,
          type: "info",
          user_id: null,
        },
      ]);

      return c.json({
        report: updatedReport,
        message: "تم تحديث التقرير اليومي بنجاح",
      });
    } catch (error) {
      console.log(`Error updating daily report (KV): ${error}`);
      return c.json(
        { error: "خطأ في تحديث التقرير اليومي" },
        500,
      );
    }
  },
);

// Delete Daily Report (KV)
app.delete(
  "/make-server-a52c947c/daily-reports-kv/:id",
  async (c) => {
    try {
      const accessToken = c.req
        .header("Authorization")
        ?.split(" ")[1];
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(accessToken);

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

      // Only general manager can delete
      if (currentUser.role !== "general_manager") {
        return c.json(
          { error: "Unauthorized to delete reports" },
          403,
        );
      }

      const reportId = c.req.param("id");

      // Get report to get report number for notification
      const existingReport = await kv.get(
        `daily_report:${reportId}`,
      );

      await kv.del(`daily_report:${reportId}`);

      // Create notification
      await supabaseAdmin.from("notifications").insert([
        {
          title: "حذف تقرير يومي",
          message: `تم حذف التقرير: ${existingReport?.reportNumber || reportId}`,
          type: "warning",
          user_id: null,
        },
      ]);

      return c.json({ message: "تم حذف التقرير اليومي بنجاح" });
    } catch (error) {
      console.log(`Error deleting daily report (KV): ${error}`);
      return c.json(
        { error: "خطأ في حذف التقرير اليومي" },
        500,
      );
    }
  },
);

// ============================================
// 📊 Daily Reports SQL Routes
// ============================================

// Create Daily Report (SQL)
app.post(
  "/make-server-a52c947c/daily-reports-sql",
  async (c) => {
    try {
      const accessToken = c.req
        .header("Authorization")
        ?.split(" ")[1];
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(accessToken);

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
      if (reportData.projectId)
        insertData.project_id = reportData.projectId;
      if (reportData.location)
        insertData.location = reportData.location;
      if (reportData.weatherCondition)
        insertData.weather_condition =
          reportData.weatherCondition;
      if (reportData.temperature)
        insertData.temperature = reportData.temperature;
      if (reportData.workHoursFrom)
        insertData.work_hours_from = reportData.workHoursFrom;
      if (reportData.workHoursTo)
        insertData.work_hours_to = reportData.workHoursTo;
      if (reportData.saudiWorkers)
        insertData.saudi_workers = parseInt(
          reportData.saudiWorkers,
        );
      if (reportData.nonSaudiWorkers)
        insertData.non_saudi_workers = parseInt(
          reportData.nonSaudiWorkers,
        );
      if (reportData.equipmentUsed)
        insertData.equipment_used = reportData.equipmentUsed;
      if (reportData.workDescription)
        insertData.work_description =
          reportData.workDescription;
      if (reportData.dailyProgress)
        insertData.daily_progress = parseFloat(
          reportData.dailyProgress,
        );
      if (reportData.executedQuantities)
        insertData.executed_quantities =
          reportData.executedQuantities;
      if (reportData.materialsUsed)
        insertData.materials_used = reportData.materialsUsed;
      if (reportData.problems)
        insertData.problems = reportData.problems;
      if (reportData.accidents)
        insertData.accidents = reportData.accidents;
      if (reportData.officialVisits)
        insertData.official_visits = reportData.officialVisits;
      if (reportData.recommendations)
        insertData.recommendations = reportData.recommendations;
      if (reportData.generalNotes)
        insertData.general_notes = reportData.generalNotes;

      // Insert into database
      const { data: newReport, error: insertError } =
        await supabaseAdmin
          .from("daily_reports_new")
          .insert(insertData)
          .select(
            `
        *,
        projects:project_id(id, project_number, work_order_description),
        users:created_by(id, name)
      `,
          )
          .single();

      if (insertError) {
        console.log(
          `Error inserting daily report: ${insertError.message}`,
        );
        return c.json(
          { error: "خطأ في إنشاء التقرير اليومي" },
          500,
        );
      }

      // Create notification
      await supabaseAdmin.from("notifications").insert([
        {
          title: "تقرير يومي جديد",
          message: `تم إضافة تقرير يومي جديد: ${reportNumber} - ${reportData.workDescription?.substring(0, 50) || "تقرير جديد"}`,
          type:
            reportData.problems || reportData.accidents
              ? "warning"
              : "info",
          user_id: null,
        },
      ]);

      return c.json({
        report: newReport,
        message: "تم إنشاء التقرير اليومي بنجاح",
      });
    } catch (error) {
      console.log(
        `Error creating daily report (SQL): ${error}`,
      );
      return c.json(
        { error: "خطأ في إنشاء التقرير اليومي" },
        500,
      );
    }
  },
);

// Get All Daily Reports (SQL)
app.get(
  "/make-server-a52c947c/daily-reports-sql",
  async (c) => {
    try {
      const accessToken = c.req
        .header("Authorization")
        ?.split(" ")[1];
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(accessToken);

      if (!user || error) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Fetch all reports with relations
      const { data: reports, error: fetchError } =
        await supabaseAdmin
          .from("daily_reports_new")
          .select(
            `
        *,
        projects:project_id(id, project_number, work_order_description),
        users:created_by(id, name)
      `,
          )
          .order("report_date", { ascending: false });

      if (fetchError) {
        console.log(
          `Error fetching daily reports: ${fetchError.message}`,
        );
        return c.json(
          { error: "خطأ في جلب التقارير اليومية" },
          500,
        );
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
        createdByName: report.users?.name || "Unknown",
        createdAt: report.created_at,
        updatedAt: report.updated_at,
      }));

      return c.json({ reports: transformedReports });
    } catch (error) {
      console.log(
        `Error fetching daily reports (SQL): ${error}`,
      );
      return c.json(
        { error: "خطأ في جلب التقارير اليومية" },
        500,
      );
    }
  },
);

// Update Daily Report (SQL)
app.put(
  "/make-server-a52c947c/daily-reports-sql/:id",
  async (c) => {
    try {
      const accessToken = c.req
        .header("Authorization")
        ?.split(" ")[1];
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(accessToken);

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
      const isGeneralManager =
        currentUser.role === "General Manager" ||
        currentUser.role === "المدير العام" ||
        currentUser.role === "general_manager";
      const isOwner =
        existingReport.created_by === currentUser.id;

      if (!isGeneralManager && !isOwner) {
        return c.json(
          { error: "Unauthorized to edit this report" },
          403,
        );
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
        saudi_workers: reportData.saudiWorkers
          ? parseInt(reportData.saudiWorkers)
          : null,
        non_saudi_workers: reportData.nonSaudiWorkers
          ? parseInt(reportData.nonSaudiWorkers)
          : null,
        equipment_used: reportData.equipmentUsed || null,
        work_description: reportData.workDescription || null,
        daily_progress: reportData.dailyProgress
          ? parseFloat(reportData.dailyProgress)
          : null,
        executed_quantities:
          reportData.executedQuantities || null,
        materials_used: reportData.materialsUsed || null,
        problems: reportData.problems || null,
        accidents: reportData.accidents || null,
        official_visits: reportData.officialVisits || null,
        recommendations: reportData.recommendations || null,
        general_notes: reportData.generalNotes || null,
      };

      // Update in database
      const { data: updatedReport, error: updateError } =
        await supabaseAdmin
          .from("daily_reports_new")
          .update(updateData)
          .eq("id", reportId)
          .select(
            `
        *,
        projects:project_id(id, project_number, work_order_description),
        users:created_by(id, name)
      `,
          )
          .single();

      if (updateError) {
        console.log(
          `Error updating daily report: ${updateError.message}`,
        );
        return c.json(
          { error: "خطأ في تحديث التقرير اليومي" },
          500,
        );
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
      console.log(
        `Error updating daily report (SQL): ${error}`,
      );
      return c.json(
        { error: "خطأ في تحديث التقرير اليومي" },
        500,
      );
    }
  },
);

// Delete Daily Report (SQL)
app.delete(
  "/make-server-a52c947c/daily-reports-sql/:id",
  async (c) => {
    try {
      const accessToken = c.req
        .header("Authorization")
        ?.split(" ")[1];
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(accessToken);

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
        return c.json(
          { error: "Unauthorized to delete reports" },
          403,
        );
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
        console.log(
          `Error deleting daily report: ${deleteError.message}`,
        );
        return c.json(
          { error: "خطأ في حذف التقرير اليومي" },
          500,
        );
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
      console.log(
        `Error deleting daily report (SQL): ${error}`,
      );
      return c.json(
        { error: "خطأ في حذف التقرير اليومي" },
        500,
      );
    }
  },
);

// Export Daily Report (Word/Excel/PDF) - FIXED WITH HELPER
app.get(
  "/make-server-a52c947c/daily-reports-sql/:id/export/:format",
  async (c) => {
    try {
      console.log("🔍 Export request started");
      
      const accessToken = c.req.header("Authorization")?.split(" ")[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);

      if (!user || error) {
        console.log("❌ Unauthorized");
        return c.json({ error: "Unauthorized" }, 401);
      }

      const reportId = c.req.param("id");
      const format = c.req.param("format");
      console.log(`📄 Exporting report ${reportId} as ${format}`);

      const { data: report, error: fetchError } = await supabaseAdmin
        .from("daily_reports_new")
        .select(`*, projects:project_id(id, project_number, work_order_description), users:created_by(id, name)`)
        .eq("id", reportId)
        .single();

      if (fetchError || !report) {
        console.log("❌ Report not found:", fetchError);
        return c.json({ error: "Report not found" }, 404);
      }

      console.log("✅ Report found:", report.report_number);

      if (format === "word") {
        const html = generateWordHTML(report);
        console.log("✅ Word HTML generated, length:", html.length);
        
        // Return HTML as Word-compatible document
        // Word can open HTML files with proper styling
        return new Response(html, {
          headers: {
            "Content-Type": "application/msword; charset=utf-8",
            "Content-Disposition": `attachment; filename="Report_${report.report_number}.doc"`,
          },
        });
      } else if (format === "excel") {
        const csv = generateExcelCSV(report);
        console.log("✅ Excel CSV generated, length:", csv.length);
        
        // Return as proper Excel CSV with UTF-8 BOM
        return new Response(csv, {
          headers: {
            "Content-Type": "application/vnd.ms-excel; charset=utf-8",
            "Content-Disposition": `attachment; filename="Report_${report.report_number}.xls"`,
          },
        });
      } else if (format === "pdf") {
        const html = generatePDFHTML(report);
        console.log("✅ PDF HTML generated, length:", html.length);
        
        // Return HTML that opens in new tab for Print to PDF
        return new Response(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Content-Disposition": `inline`,
          },
        });
      }

      return c.json({ error: "Invalid format" }, 400);
    } catch (error) {
      console.log(`❌ Error exporting: ${error}`);
      console.log(`❌ Stack: ${error.stack}`);
      return c.json({ error: "خطأ في التصدير" }, 500);
    }
  },
);

Deno.serve(app.fetch);