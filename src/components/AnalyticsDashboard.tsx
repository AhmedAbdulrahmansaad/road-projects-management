import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Banknote, Users, Calendar, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from './AuthContext';
import { getServerUrl } from '../utils/supabase-client';

export const AnalyticsDashboard: React.FC = () => {
  const { language } = useLanguage();
  const { accessToken } = useAuth();
  const [realData, setRealData] = useState({
    totalProjects: 0,
    projectStatus: [] as any[],
    regionalPerformance: [] as any[],
    monthlyProgress: [] as any[],
    avgCompletion: 0,
    totalBudget: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTeamMembers: 0,
    delayedProjects: 0,
  });

  useEffect(() => {
    const fetchRealData = async () => {
      if (!accessToken) return;

      try {
        // جلب المشاريع
        const projectsResponse = await fetch(getServerUrl('/projects'), {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        // جلب التقارير اليومية لحساب عدد العمال
        const reportsResponse = await fetch(getServerUrl('/daily-reports-sql'), {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (projectsResponse.ok) {
          const data = await projectsResponse.json();
          const projects = data.projects || [];

          // حساب عدد العمال من آخر تقرير يومي
          let totalTeamMembers = 0;
          if (reportsResponse.ok) {
            const reportsData = await reportsResponse.json();
            const reports = reportsData.reports || [];
            if (reports.length > 0) {
              // جمع العمال من جميع التقارير الحديثة (آخر 30 يوم)
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              
              const recentReports = reports.filter((r: any) => {
                const reportDate = new Date(r.reportDate);
                return reportDate >= thirtyDaysAgo;
              });

              if (recentReports.length > 0) {
                // أخذ متوسط عدد العمال
                const totalWorkers = recentReports.reduce((sum: number, r: any) => {
                  return sum + (r.totalWorkers || 0);
                }, 0);
                totalTeamMembers = Math.round(totalWorkers / recentReports.length);
              }
            }
          }

          // إحصائيات احالات
          const statusCounts = {
            'نشط': projects.filter((p: any) => p.status === 'جاري العمل' || p.status === 'جاري').length,
            'مكتمل': projects.filter((p: any) => p.status === 'تم الاستلام النهائي' || p.status === 'منجز').length,
            'متأخر': projects.filter((p: any) => p.status === 'متأخر' || p.status === 'متعثر').length,
            'معلق': projects.filter((p: any) => p.status === 'متوقف').length,
          };

          const projectStatus = [
            { name: language === 'ar' ? 'نشط' : 'Active', value: statusCounts['نشط'], color: '#10b981' },
            { name: language === 'ar' ? 'مكتمل' : 'Completed', value: statusCounts['مكتمل'], color: '#006C35' },
            { name: language === 'ar' ? 'متأخر' : 'Delayed', value: statusCounts['متأخر'], color: '#ef4444' },
            { name: language === 'ar' ? 'معلق' : 'Pending', value: statusCounts['معلق'], color: '#f59e0b' }
          ];

          // الأداء حسب المنطقة
          const regions: any = {};
          projects.forEach((p: any) => {
            const region = p.region || (language === 'ar' ? 'غير محدد' : 'Unspecified');
            if (!regions[region]) {
              regions[region] = { projects: 0, totalCompletion: 0 };
            }
            regions[region].projects++;
            regions[region].totalCompletion += (p.progressActual || 0);
          });

          const regionalPerformance = Object.keys(regions).slice(0, 5).map(region => ({
            region,
            projects: regions[region].projects,
            completion: Math.round(regions[region].totalCompletion / regions[region].projects)
          }));

          // حساب التقدم الشهري من البيانات الحقيقية
          const monthlyData: any = {};
          const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
          const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          
          projects.forEach((p: any) => {
            if (p.createdAt) {
              const date = new Date(p.createdAt);
              const monthIndex = date.getMonth();
              const monthName = language === 'ar' ? months[monthIndex] : monthsEn[monthIndex];
              
              if (!monthlyData[monthName]) {
                monthlyData[monthName] = { total: 0, count: 0, budget: 0 };
              }
              monthlyData[monthName].total += (p.progressActual || 0);
              monthlyData[monthName].count++;
              monthlyData[monthName].budget += (p.projectValue || 0);
            }
          });

          const monthlyProgress = Object.keys(monthlyData).map(month => ({
            month,
            progress: Math.round(monthlyData[month].total / monthlyData[month].count) || 0,
            target: Math.round((monthlyData[month].total / monthlyData[month].count) * 0.95) || 0,
            cost: (monthlyData[month].budget / 1000000).toFixed(1)
          }));

          // حساب الإحصائيات الإجمالية
          const avgCompletion = projects.length > 0
            ? Math.round(projects.reduce((sum: number, p: any) => sum + (p.progressActual || 0), 0) / projects.length)
            : 0;

          const totalBudget = projects.reduce((sum: number, p: any) => sum + (parseFloat(p.projectValue) || 0), 0);
          
          // ✅ المشاريع النشطة = كل شيء ما عدا "متوقف"
          const activeProjects = projects.filter((p: any) => 
            p.status !== 'متوقف' && p.status !== 'Stopped'
          ).length;

          // ✅ المشاريع المكتملة = فقط حالة "منجز"
          const completedProjects = projects.filter((p: any) => 
            p.status === 'منجز' || p.status === 'Completed'
          ).length;

          // حساب المشاريع المتأخرة (التي انتهى موعدها ولم تكتمل بعد)
          const today = new Date();
          today.setHours(0, 0, 0, 0); // ✅ تصفير الوقت للمقارنة الصحيحة
          
          const delayedProjects = projects.filter((p: any) => {
            // 1. المشاريع التي لها حالة "متأخر" أو "متعثر" مباشرة
            if (p.status === 'متأخر' || p.status === 'متعثر') {
              return true;
            }
            
            // 2. المشاريع التي انتهى موعدها ولم تكتمل بعد
            if (p.contractEndDate) {
              const endDate = new Date(p.contractEndDate);
              endDate.setHours(0, 0, 0, 0); // ✅ تصفير الوقت
              
              // إذا كان تاريخ النهاية قد مضى والمشروع لم يكتمل
              if (endDate < today) {
                const isNotCompleted = p.status !== 'تم الاستلام النهائي' && 
                                      p.status !== 'منجز' && 
                                      p.status !== 'Completed';
                if (isNotCompleted) {
                  return true;
                }
              }
            }
            
            return false;
          }).length;

          setRealData({
            totalProjects: projects.length,
            projectStatus,
            regionalPerformance,
            monthlyProgress: monthlyProgress.slice(0, 6),
            avgCompletion,
            totalBudget,
            activeProjects,
            completedProjects,
            totalTeamMembers,
            delayedProjects,
          });
        }
      } catch (error) {
        console.error('AnalyticsDashboard: Error fetching data:', error);
      }
    };

    fetchRealData();
  }, [accessToken, language]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold gradient-text">
            {language === 'ar' ? 'لوحة التحليلات' : 'Analytics Dashboard'}
          </h2>
          <p className="text-base text-muted-foreground font-medium mt-1">
            {language === 'ar' ? 'تحليل شامل لأداء المشاريع والموارد' : 'Comprehensive analysis of projects and resources'}
          </p>
        </div>
        <Badge className="text-base px-4 py-2">
          {language === 'ar' ? 'محدّث الآن' : 'Updated Now'}
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="glass-card border-0 shadow-lg hover-lift animate-fade-in-up delay-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-3xl font-extrabold mb-1">{realData.totalProjects}</p>
            <p className="text-sm font-semibold text-muted-foreground">
              {language === 'ar' ? 'إجمالي المشاريع' : 'Total Projects'}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg hover-lift animate-fade-in-up delay-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-xs font-bold text-green-500">+5%</span>
            </div>
            <p className="text-3xl font-extrabold mb-1">{realData.avgCompletion}%</p>
            <p className="text-sm font-semibold text-muted-foreground">
              {language === 'ar' ? 'معدل الإنجاز' : 'Completion Rate'}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg hover-lift animate-fade-in-up delay-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Banknote className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xs font-bold text-green-500">
                {language === 'ar' ? 'ر.س' : 'SAR'}
              </span>
            </div>
            <p className="text-3xl font-extrabold mb-1 flex items-center gap-1">
              {(realData.totalBudget / 1000000).toFixed(1)}
              <span className="text-lg">م</span>
            </p>
            <p className="text-sm font-semibold text-muted-foreground">
              {language === 'ar' ? 'الميزانية (ريال سعودي)' : 'Budget (SAR)'}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg hover-lift animate-fade-in-up delay-400">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-secondary/10">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              {realData.totalTeamMembers > 0 && (
                <span className="text-xs font-bold text-blue-500">✓</span>
              )}
            </div>
            <p className="text-3xl font-extrabold mb-1">
              {realData.totalTeamMembers || 0}
            </p>
            <p className="text-sm font-semibold text-muted-foreground">
              {language === 'ar' ? 'متوسط عدد العمال' : 'Avg Workers'}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg hover-lift animate-fade-in-up delay-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
                <Calendar className="h-6 w-6 text-red-600" />
              </div>
              {realData.delayedProjects > 0 && (
                <span className="text-xs font-bold text-red-500">!</span>
              )}
            </div>
            <p className="text-3xl font-extrabold mb-1">{realData.delayedProjects}</p>
            <p className="text-sm font-semibold text-muted-foreground">
              {language === 'ar' ? 'مشاريع متأخرة' : 'Delayed Projects'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Progress Chart */}
        <Card className="glass-card border-0 shadow-xl hover-lift animate-fade-in-up delay-100">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              {language === 'ar' ? 'التقدم الشهري' : 'Monthly Progress'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={realData.monthlyProgress}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" style={{ fontSize: '14px', fontWeight: 600 }} />
                <YAxis style={{ fontSize: '14px', fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '14px', fontWeight: 600 }} />
                <Line 
                  type="monotone" 
                  dataKey="progress" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name={language === 'ar' ? 'الإنجاز الفعلي' : 'Actual Progress'}
                  dot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#006C35" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name={language === 'ar' ? 'الهدف' : 'Target'}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Status Pie Chart */}
        <Card className="glass-card border-0 shadow-xl hover-lift animate-fade-in-up delay-200">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-primary" />
              {language === 'ar' ? 'حالة المشاريع' : 'Project Status'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={realData.projectStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  style={{ fontSize: '14px', fontWeight: 600 }}
                >
                  {realData.projectStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Performance Chart */}
        <Card className="glass-card border-0 shadow-xl hover-lift animate-fade-in-up delay-400">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              {language === 'ar' ? 'الأداء حسب المنطقة' : 'Regional Performance'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={realData.regionalPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis type="number" style={{ fontSize: '14px', fontWeight: 600 }} />
                <YAxis dataKey="region" type="category" width={80} style={{ fontSize: '14px', fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '14px', fontWeight: 600 }} />
                <Bar 
                  dataKey="completion" 
                  fill="#10b981" 
                  name={language === 'ar' ? 'نسبة الإنجاز %' : 'Completion %'}
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      <Card className="glass-card border-0 shadow-xl animate-fade-in-up delay-500">
        <CardHeader>
          <CardTitle className="text-xl">
            {language === 'ar' ? 'ملخص الأداء' : 'Performance Summary'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
              <p className="text-4xl font-extrabold text-green-600 mb-2">96%</p>
              <p className="text-base font-semibold text-muted-foreground">
                {language === 'ar' ? 'رضا العملاء' : 'Customer Satisfaction'}
              </p>
            </div>
            <div className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <p className="text-4xl font-extrabold text-blue-600 mb-2">1.2M</p>
              <p className="text-base font-semibold text-muted-foreground">
                {language === 'ar' ? 'وفورات التكلفة (ريال)' : 'Cost Savings (SAR)'}
              </p>
            </div>
            <div className="text-center p-4 rounded-xl bg-primary/10">
              <p className="text-4xl font-extrabold text-primary mb-2">24h</p>
              <p className="text-base font-semibold text-muted-foreground">
                {language === 'ar' ? 'متوسط وقت الاستجابة' : 'Avg Response Time'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};