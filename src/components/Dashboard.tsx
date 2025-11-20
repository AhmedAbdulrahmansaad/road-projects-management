import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { getServerUrl } from '../utils/supabase-client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CreateProject } from './CreateProject';
import { ProjectsList } from './ProjectsList';
import { ReportsPage } from './ReportsPage';
import { DailyReports } from './DailyReports';
import { RealAIAssistant } from './RealAIAssistant';
import { UserManagement } from './UserManagement';
import { NotificationSystem } from './NotificationSystem';
import { ProgressTracker } from './ProgressTracker';
import { QuickStats } from './QuickStats';
import { ProjectTimeline } from './ProjectTimeline';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { AdvancedSearch } from './AdvancedSearch';
import { ExportManager } from './ExportManager';
import { LogOut, Plus, FileText, BarChart3, Calendar, Bot, Moon, Sun, Settings, Bell, Users, TrendingUp, Activity, FolderKanban, Globe } from 'lucide-react';
import { Badge } from './ui/badge';
import { ArrowRight } from 'lucide-react';
import { PerformanceContractsPage } from './PerformanceContractsPage';

type View = 'home' | 'projects' | 'create' | 'reports' | 'daily' | 'ai' | 'users' | 'performance';

export const Dashboard: React.FC = () => {
  const { user, signOut, accessToken } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [currentView, setCurrentView] = useState<View>('home');
  const [darkMode, setDarkMode] = useState(false);
  const [totalProjects, setTotalProjects] = useState(0);
  const [stats, setStats] = useState({
    activeProjects: 0,
    completedProjects: 0,
    avgProgress: 0
  });

  // Get user role
  const userRole = user?.user_metadata?.role || user?.role || 'Observer';
  const isGeneralManager = userRole === 'General Manager' || userRole === 'مدير عام';
  const isBranchGeneralManager = userRole === 'Branch General Manager' || userRole === 'مدير عام الفرع';
  const isAdminManager = userRole === 'Admin Manager' || userRole === 'مدير إداري';
  const isSupervisorEngineer = userRole === 'Supervising Engineer' || userRole === 'المهندس المشرف';
  const isEngineer = userRole === 'Engineer' || userRole === 'مهندس';
  
  const canEdit = isGeneralManager; // فقط المدير العام يمتلك كل الصلاحيات
  const canViewDailyReports = isGeneralManager || isBranchGeneralManager || isSupervisorEngineer; // المدير العام ومدير عام الفرع والمهندس المش��ف
  const canManageUsers = isGeneralManager; // فقط المدير العام يدير المستخدمين
  const canCreateProject = isGeneralManager || isSupervisorEngineer || isEngineer; // المدير العام والمهندس المشرف والمهندس
  const canCreateReport = isGeneralManager || isSupervisorEngineer || isEngineer; // المدير العام والمهندس المشرف والمهندس
  const canViewPerformance = isGeneralManager || isBranchGeneralManager || isAdminManager; // عقود الأداء

  const handleSignOut = async () => {
    await signOut();
  };

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // تحميل الإحصائيات
  useEffect(() => {
    const fetchProjectsCount = async () => {
      if (!accessToken) {
        console.log('Dashboard: No access token, skipping fetch');
        return;
      }
      
      try {
        const response = await fetch(
          getServerUrl('/projects'),
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          const projects = data.projects || [];
          setTotalProjects(projects.length);
          
          // حساب الإحصائيات
          const active = projects.filter((p: any) => 
            p.status === 'جاري العمل' || p.status === 'جاري'
          ).length;
          
          const completed = projects.filter((p: any) => 
            p.status === 'تم الاستلام النهائي' || p.status === 'منجز'
          ).length;
          
          const avgProgress = projects.length > 0
            ? Math.round(projects.reduce((sum: number, p: any) => sum + (p.progressActual || 0), 0) / projects.length)
            : 0;
          
          setStats({
            activeProjects: active,
            completedProjects: completed,
            avgProgress
          });
        } else {
          console.error('Dashboard: Failed to fetch projects:', response.status);
        }
      } catch (error) {
        console.error('Error fetching projects count:', error);
        // لا نعرض رسالة خطأ للمستخدم
      }
    };

    fetchProjectsCount();
  }, [accessToken]);

  const getMenuItems = () => {
    const baseItems = [
      { 
        name: language === 'ar' ? 'لوحة التحكم' : 'Dashboard', 
        icon: LayoutDashboard, 
        view: 'overview' as const,
        roles: ['project_manager', 'admin_manager', 'site_engineer', 'consultant']
      },
      { 
        name: language === 'ar' ? 'المشاريع' : 'Projects', 
        icon: FolderKanban, 
        view: 'projects' as const,
        roles: ['project_manager', 'admin_manager', 'site_engineer', 'consultant']
      },
      { 
        name: language === 'ar' ? 'التقارير اليومية' : 'Daily Reports', 
        icon: FileText, 
        view: 'reports' as const,
        roles: ['project_manager', 'admin_manager', 'site_engineer']
      },
      { 
        name: language === 'ar' ? 'بيان النسب' : 'Progress Reports', 
        icon: BarChart3, 
        view: 'progress-reports' as const,
        roles: ['project_manager', 'admin_manager', 'consultant']
      },
      { 
        name: language === 'ar' ? 'إدارة المستخدمين' : 'User Management', 
        icon: Users, 
        view: 'users' as const,
        roles: ['project_manager'] // فقط المدير العام
      },
      { 
        name: language === 'ar' ? 'المساعد الذكي' : 'AI Assistant', 
        icon: MessageSquare, 
        view: 'assistant' as const,
        roles: ['project_manager', 'admin_manager', 'site_engineer', 'consultant']
      },
    ];

    return baseItems.filter(item => item.roles.includes(userRole as any));
  };

  return (
    <div className="min-h-screen bg-dashboard-slideshow relative overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Gradient Overlay مدمج في الخلفية */}
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 glass-card border-b border-border shadow-lg animate-fade-in-down">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 animate-fade-in-left">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg hover-scale animate-float">
                <span className="text-2xl">🛣️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">{t('dashboard.title')}</h1>
                <p className="text-base text-muted-foreground font-semibold">{t('dashboard.subtitle')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 animate-fade-in-right">
              {user && (
                <div className="hidden md:flex items-center gap-2 bg-card px-4 py-2 rounded-lg border border-border">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm">
                    {user.user_metadata?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{user.user_metadata?.name || t('dashboard.user')}</p>
                    <Badge variant="secondary" className="text-xs">
                      {user.user_metadata?.role || t('dashboard.defaultRole')}
                    </Badge>
                  </div>
                </div>
              )}

              <NotificationSystem />

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setDarkMode(!darkMode)}
                className="rounded-full hover-scale glass"
              >
                {darkMode ? <Sun className="h-5 w-5 animate-spin" style={{ animation: 'spin 20s linear infinite' }} /> : <Moon className="h-5 w-5" />}
              </Button>

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleLanguage}
                className="rounded-full hover-scale glass"
              >
                <Globe className="h-5 w-5 hover-rotate" />
              </Button>

              <Button 
                variant="ghost" 
                size="icon"
                className="rounded-full hover-scale glass"
              >
                <Settings className="h-5 w-5" />
              </Button>

              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleSignOut}
                className="hover-lift"
              >
                <LogOut className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                {t('dashboard.logout')}
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="bg-sidebar/50 border-t border-sidebar-border backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide">
                <Button
                  variant={currentView === 'home' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('home')}
                  className="whitespace-nowrap"
                >
                  <Activity className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {t('dashboard.home')}
                </Button>
                <Button
                  variant={currentView === 'projects' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('projects')}
                  className="whitespace-nowrap"
                >
                  <FolderKanban className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {t('dashboard.projects')}
                </Button>
                {/* إخفاء "مشروع جديد" عن المدير العام والدير الإداري (عرض فقط) */}
                {canCreateProject && (
                  <Button
                    variant={currentView === 'create' ? 'default' : 'ghost'}
                    onClick={() => setCurrentView('create')}
                    className="whitespace-nowrap"
                  >
                    <Plus className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                    {t('dashboard.newProject')}
                  </Button>
                )}
                <Button
                  variant={currentView === 'reports' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('reports')}
                  className="whitespace-nowrap"
                >
                  <BarChart3 className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {t('dashboard.reports')}
                </Button>
                {/* التقارير اليومية فقط لمدير البرنامج */}
                {canViewDailyReports && (
                  <Button
                    variant={currentView === 'daily' ? 'default' : 'ghost'}
                    onClick={() => setCurrentView('daily')}
                    className="whitespace-nowrap"
                  >
                    <Calendar className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                    {t('dashboard.daily')}
                  </Button>
                )}
                <Button
                  variant={currentView === 'ai' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('ai')}
                  className="whitespace-nowrap"
                >
                  <Bot className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {t('dashboard.ai')}
                </Button>
                {/* إدارة المستخدمين فقط لمدير البرنامج */}
                {canManageUsers && (
                  <Button
                    variant={currentView === 'users' ? 'default' : 'ghost'}
                    onClick={() => setCurrentView('users')}
                    className="whitespace-nowrap"
                  >
                    <Users className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                    {t('actions.manageUsers')}
                  </Button>
                )}
                {/* عقود الأداء فقط لمدير البرنامج */}
                {canViewPerformance && (
                  <Button
                    variant={currentView === 'performance' ? 'default' : 'ghost'}
                    onClick={() => setCurrentView('performance')}
                    className="whitespace-nowrap"
                  >
                    <TrendingUp className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                    {language === 'ar' ? 'عقود الأداء' : 'Performance Contracts'}
                  </Button>
                )}
              </div>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto p-4">
          {currentView === 'home' && (
            <div className="space-y-6">
              {/* Welcome Section */}
              <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-white shadow-xl animate-fade-in">
                <h2 className="text-3xl font-bold mb-2">{t('dashboard.welcome')}, {user?.fullName}! 👋</h2>
                <p className="text-lg text-white/90 font-medium">{t('dashboard.overview')}</p>
              </div>

              {/* Quick Stats */}
              <QuickStats />

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-r-4 border-r-primary hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-bold">{t('stats.totalProjects')}</CardTitle>
                    <FolderKanban className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-extrabold mb-1">{totalProjects}</div>
                    <p className="text-sm text-muted-foreground font-medium">{t('stats.allProjects')}</p>
                  </CardContent>
                </Card>

                <Card className="border-r-4 border-r-chart-3 hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-bold">{t('stats.activeProjects')}</CardTitle>
                    <Activity className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-extrabold mb-1">{stats.activeProjects}</div>
                    <p className="text-sm text-muted-foreground font-medium">{t('stats.inProgress')}</p>
                  </CardContent>
                </Card>

                <Card className="border-r-4 border-r-secondary hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-bold">{t('stats.completedProjects')}</CardTitle>
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-extrabold mb-1">{stats.completedProjects}</div>
                    <p className="text-sm text-muted-foreground font-medium">{t('stats.completedSuccess')}</p>
                  </CardContent>
                </Card>

                <Card className="border-r-4 border-r-chart-4 hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-bold">{t('stats.avgProgress')}</CardTitle>
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-extrabold mb-1">{stats.avgProgress}%</div>
                    <p className="text-sm text-muted-foreground font-medium">{t('stats.overallProgress')}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions - فقط لمدير البرنامج */}
              {isGeneralManager && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('actions.quickActions')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button 
                        onClick={() => setCurrentView('create')}
                        className="h-24 flex flex-col gap-2 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                      >
                        <Plus className="h-8 w-8" />
                        <span>{t('actions.createProject')}</span>
                      </Button>
                      <Button 
                        onClick={() => setCurrentView('daily')}
                        className="h-24 flex flex-col gap-2 bg-gradient-to-br from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70"
                        variant="secondary"
                      >
                        <Calendar className="h-8 w-8" />
                        <span>{t('actions.addReport')}</span>
                      </Button>
                      <Button 
                        onClick={() => setCurrentView('reports')}
                        className="h-24 flex flex-col gap-2 bg-gradient-to-br from-chart-3 to-chart-3/80 hover:from-chart-3/90 hover:to-chart-3/70"
                      >
                        <BarChart3 className="h-8 w-8" />
                        <span>{t('actions.viewReports')}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Projects Preview */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{t('actions.recentProjects')}</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setCurrentView('projects')}
                  >
                    {t('actions.viewAll')}
                  </Button>
                </CardHeader>
                <CardContent>
                  <ProjectsList limit={5} />
                </CardContent>
              </Card>

              {/* Progress Tracker */}
              <ProgressTracker />

              {/* Project Timeline */}
              <ProjectTimeline />

              {/* Analytics Dashboard */}
              <AnalyticsDashboard />

              {/* Advanced Search */}
              <AdvancedSearch />

              {/* Export Manager */}
              <ExportManager />
            </div>
          )}
          {currentView === 'projects' && <ProjectsList />}
          {currentView === 'create' && <CreateProject onSuccess={() => setCurrentView('projects')} />}
          {currentView === 'reports' && <ReportsPage />}
          {currentView === 'daily' && <DailyReports />}
          {currentView === 'ai' && (
            <div className="space-y-6 animate-fade-in-up">
              <Button
                variant="ghost"
                onClick={() => setCurrentView('home')}
                className="mb-4"
              >
                <ArrowRight className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                {t('actions.back')}
              </Button>
              <RealAIAssistant />
            </div>
          )}
          {currentView === 'users' && <UserManagement />}
          {currentView === 'performance' && <PerformanceContractsPage />}
        </main>
      </div>
    </div>
  );
};