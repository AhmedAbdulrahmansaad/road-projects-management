import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../components/AuthContext';
import { getServerUrl } from '../utils/supabase-client';

interface Project {
  id: string;
  status: string;
  progressActual: number;
  progressPlanned: number;
  deviation: number;
  budget?: number;
  workers?: number;
  satisfaction?: number;
  startDate?: string;
  endDate?: string;
  contractorName?: string;
  region?: string;
  [key: string]: any;
}

interface StatsContextType {
  // إحصائيات أساسية
  totalProjects: number;
  activeProjects: number; // ✅ كل شيء ما عدا متوقف
  completedProjects: number; // ✅ فقط 100%
  delayedProjects: number;
  stoppedProjects: number;
  inProgressProjects: number; // جاري العمل
  
  // نسب مئوية
  avgProgress: number;
  completionRate: number;
  
  // إحصائيات إضافية
  avgWorkers: number; // متوسط عدد العمال
  totalBudget: number; // الميزانية الإجمالية
  avgSatisfaction: number; // رضا العملاء
  avgResponseTime: number; // متوسط وقت الاستجابة
  costSavings: number; // وفورات التكلفة
  
  // توزيع المشاريع حسب الحالة
  projectsByStatus: { [key: string]: number };
  
  // توزيع المشاريع حسب المنطقة
  projectsByRegion: { [key: string]: number };
  
  // البيانات الخام
  projects: Project[];
  
  // حالة التحميل
  loading: boolean;
  
  // تحديث البيانات
  refreshStats: () => Promise<void>;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export const useStats = () => {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats must be used within StatsProvider');
  }
  return context;
};

interface StatsProviderProps {
  children: ReactNode;
}

export const StatsProvider: React.FC<StatsProviderProps> = ({ children }) => {
  const { accessToken } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ إجمالي المشاريع
  const totalProjects = projects.length;

  // ✅ المشاريع المكتملة = فقط التي حالتها "منجز"
  const completedProjects = projects.filter(p => 
    p.status === 'منجز' || p.status === 'Completed'
  ).length;

  // ✅ المشاريع المتوقفة
  const stoppedProjects = projects.filter(p => 
    p.status === 'متوقف' || p.status === 'Stopped'
  ).length;

  // ✅ المشاريع النشطة = كل شيء ما عدا المتوقف
  const activeProjects = totalProjects - stoppedProjects;

  // ✅ المشاريع قيد التنفيذ = جاري العمل
  const inProgressProjects = projects.filter(p => 
    p.status === 'جاري العمل' || p.status === 'In Progress'
  ).length;

  // ✅ المشاريع المتأخرة = فقط متعثر أو متأخر (الحالة فقط، لا deviation)
  const delayedProjects = projects.filter(p => 
    p.status === 'متعثر' || p.status === 'متأخر' || p.status === 'Delayed' || p.status === 'Stalled'
  ).length;

  // ✅ متوسط الإنجاز العام (لكل المشاريع)
  const avgProgress = totalProjects > 0
    ? Math.round(projects.reduce((sum, p) => sum + (parseFloat(String(p.progressActual)) || 0), 0) / totalProjects)
    : 0;

  // ✅ معدل الإنجاز (للمشاريع النشطة فقط - غير المتوقفة)
  const activeProjectsList = projects.filter(p => 
    p.status !== 'متوقف' && p.status !== 'Stopped'
  );
  const completionRate = activeProjectsList.length > 0
    ? Math.round(activeProjectsList.reduce((sum, p) => sum + (parseFloat(String(p.progressActual)) || 0), 0) / activeProjectsList.length)
    : 0;

  // ✅ متوسط عدد العمال
  const projectsWithWorkers = projects.filter(p => p.workers && p.workers > 0);
  const avgWorkers = projectsWithWorkers.length > 0
    ? Math.round(projectsWithWorkers.reduce((sum, p) => sum + (p.workers || 0), 0) / projectsWithWorkers.length)
    : 0;

  // ✅ الميزانية الإجمالية من قيمة المشاريع (بالريال السعودي) - حقيقية من قاعدة البيانات
  const totalBudget = projects.reduce((sum, p) => sum + (parseFloat(String(p.projectValue)) || 0), 0);

  // ✅ رضا العملاء (متوسط)
  const projectsWithSatisfaction = projects.filter(p => p.satisfaction && p.satisfaction > 0);
  const avgSatisfaction = projectsWithSatisfaction.length > 0
    ? Math.round(projectsWithSatisfaction.reduce((sum, p) => sum + (p.satisfaction || 0), 0) / projectsWithSatisfaction.length)
    : 0;

  // ✅ متوسط وقت الاستجابة (بالساعات)
  const avgResponseTime = 24; // يمكن حسابه من البيانات الفعلية لاحقاً

  // ✅ وفورات التكلفة (بالريال)
  const costSavings = Math.round(totalBudget * 0.05); // 5% من الميزانية كوفورات افتراضية

  // ✅ توزيع المشاريع حسب الحالة
  const projectsByStatus: { [key: string]: number } = {};
  projects.forEach(p => {
    const status = p.status || 'غير محدد';
    projectsByStatus[status] = (projectsByStatus[status] || 0) + 1;
  });

  // ✅ توزيع المشاريع حسب المنطقة
  const projectsByRegion: { [key: string]: number } = {};
  projects.forEach(p => {
    const region = p.region || 'الرياض'; // افتراضي
    projectsByRegion[region] = (projectsByRegion[region] || 0) + 1;
  });

  const fetchStats = async () => {
    if (!accessToken) {
      console.log('StatsContext: No access token, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(getServerUrl('/projects'), {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        const fetchedProjects = data.projects || [];
        setProjects(fetchedProjects);
        console.log('✅ StatsContext: Fetched', fetchedProjects.length, 'projects');
      } else {
        if (response.status === 401) {
          console.log('StatsContext: Unauthorized (401)');
        } else {
          console.error('StatsContext: Failed to fetch projects:', response.status);
        }
        setProjects([]);
      }
    } catch (error) {
      console.error('StatsContext: Error fetching stats:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [accessToken]);

  const value: StatsContextType = {
    totalProjects,
    activeProjects,
    completedProjects,
    delayedProjects,
    stoppedProjects,
    inProgressProjects,
    avgProgress,
    completionRate,
    avgWorkers,
    totalBudget,
    avgSatisfaction,
    avgResponseTime,
    costSavings,
    projectsByStatus,
    projectsByRegion,
    projects,
    loading,
    refreshStats: fetchStats,
  };

  return <StatsContext.Provider value={value}>{children}</StatsContext.Provider>;
};