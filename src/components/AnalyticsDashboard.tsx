import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Users, Calendar, CheckCircle } from 'lucide-react';
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
  });

  useEffect(() => {
    const fetchRealData = async () => {
      if (!accessToken) return;

      try {
        const response = await fetch(getServerUrl('/projects'), {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (response.ok) {
          const data = await response.json();
          const projects = data.projects || [];

          // إحصائيات الحالات
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

          setRealData({
            totalProjects: projects.length,
            projectStatus,
            regionalPerformance,
          });
        }
      } catch (error) {
        console.error('AnalyticsDashboard: Error fetching data:', error);
      }
    };

    fetchRealData();
  }, [accessToken, language]);

  // بيانات التقدم الشهري - يمكن حسابها من التقارير اليومية لاحقاً
  const monthlyProgress = [
    { month: language === 'ar' ? 'يناير' : 'Jan', progress: 65, target: 60, cost: 2.5 },
    { month: language === 'ar' ? 'فبراير' : 'Feb', progress: 72, target: 70, cost: 2.8 },
    { month: language === 'ar' ? 'مارس' : 'Mar', progress: 78, target: 75, cost: 3.1 },
    { month: language === 'ar' ? 'أبريل' : 'Apr', progress: 82, target: 80, cost: 3.3 },
    { month: language === 'ar' ? 'مايو' : 'May', progress: 88, target: 85, cost: 3.6 },
    { month: language === 'ar' ? 'يونيو' : 'Jun', progress: 92, target: 90, cost: 3.9 }
  ];

  // بيانات التكاليف الفصلية - يمكن حسابها من قيم المشاريع
  const quarterlyCosts = [
    { quarter: 'Q1', planned: 8.5, actual: 8.2, saved: 0.3 },
    { quarter: 'Q2', planned: 9.2, actual: 9.5, saved: -0.3 },
    { quarter: 'Q3', planned: 10.1, actual: 9.8, saved: 0.3 },
    { quarter: 'Q4', planned: 11.0, actual: 10.5, saved: 0.5 }
  ];

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
            <p className="text-3xl font-extrabold mb-1">88%</p>
            <p className="text-sm font-semibold text-muted-foreground">
              {language === 'ar' ? 'معدل الإنجاز' : 'Completion Rate'}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg hover-lift animate-fade-in-up delay-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xs font-bold text-green-500">+2%</span>
            </div>
            <p className="text-3xl font-extrabold mb-1">38.5M</p>
            <p className="text-sm font-semibold text-muted-foreground">
              {language === 'ar' ? 'الميزانية (ريال)' : 'Budget (SAR)'}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg hover-lift animate-fade-in-up delay-400">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-secondary/10">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <span className="text-xs font-bold text-blue-500">+12</span>
            </div>
            <p className="text-3xl font-extrabold mb-1">156</p>
            <p className="text-sm font-semibold text-muted-foreground">
              {language === 'ar' ? 'فريق العمل' : 'Team Members'}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg hover-lift animate-fade-in-up delay-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
                <Calendar className="h-6 w-6 text-red-600" />
              </div>
              <span className="text-xs font-bold text-red-500">-2</span>
            </div>
            <p className="text-3xl font-extrabold mb-1">3</p>
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
              <LineChart data={monthlyProgress}>
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
        {/* Quarterly Costs Chart */}
        <Card className="glass-card border-0 shadow-xl hover-lift animate-fade-in-up delay-300">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              {language === 'ar' ? 'التكاليف الفصلية (مليون ريال)' : 'Quarterly Costs (M SAR)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={quarterlyCosts}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="quarter" style={{ fontSize: '14px', fontWeight: 600 }} />
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
                <Bar 
                  dataKey="planned" 
                  fill="#FDB714" 
                  name={language === 'ar' ? 'المخطط' : 'Planned'}
                  radius={[8, 8, 0, 0]}
                />
                <Bar 
                  dataKey="actual" 
                  fill="#006C35" 
                  name={language === 'ar' ? 'الفعلي' : 'Actual'}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

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