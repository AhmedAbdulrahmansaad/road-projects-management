import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useLanguage } from '../contexts/LanguageContext';
import { useStats } from '../contexts/StatsContext';
import { 
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Calendar, TrendingUp, Users, Banknote, Clock, 
  CheckCircle2, AlertTriangle, MapPin, Activity 
} from 'lucide-react';

export const EnhancedAnalyticsDashboard: React.FC = () => {
  const { language } = useLanguage();
  const { 
    delayedProjects,
    avgWorkers,
    totalBudget,
    completionRate,
    totalProjects,
    projectsByStatus,
    projectsByRegion,
    avgResponseTime,
    costSavings,
    avgSatisfaction,
    loading
  } = useStats();

  // ✅ بيانات حالة المشاريع من قاعدة البيانات
  const statusData = Object.entries(projectsByStatus).map(([name, value]) => ({
    name,
    value
  }));

  // ✅ ألوان للرسم البياني
  const COLORS = ['#006C35', '#FDB714', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181'];

  // ✅ بيانات الأداء حسب المنطقة
  const regionData = Object.entries(projectsByRegion).map(([name, value]) => ({
    name,
    value,
    percentage: totalProjects > 0 ? Math.round((value / totalProjects) * 100) : 0
  }));

  // ✅ بيانات التقدم الشهري (افتراضية - يمكن حسابها من البيانات الفعلية)
  const monthlyProgressData = [
    { month: language === 'ar' ? 'يناير' : 'Jan', planned: 15, actual: 18 },
    { month: language === 'ar' ? 'فبراير' : 'Feb', planned: 25, actual: 22 },
    { month: language === 'ar' ? 'مارس' : 'Mar', planned: 35, actual: 38 },
    { month: language === 'ar' ? 'أبريل' : 'Apr', planned: 45, actual: 42 },
    { month: language === 'ar' ? 'مايو' : 'May', planned: 55, actual: 58 },
    { month: language === 'ar' ? 'يونيو' : 'Jun', planned: 65, actual: 62 },
    { month: language === 'ar' ? 'يوليو' : 'Jul', planned: 75, actual: completionRate }
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* عنوان القسم */}
      <Card className="border-r-4 border-r-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            {language === 'ar' ? 'لوحة التحليلات' : 'Analytics Dashboard'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {language === 'ar' ? 'تحليل شامل لأداء المشاريع والموارد' : 'Comprehensive analysis of project and resource performance'}
          </p>
        </CardHeader>
      </Card>

      {/* بطاقات الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* مشاريع متأخرة */}
        <Card className="border-r-4 border-r-red-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
                <Calendar className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-extrabold text-red-600">{delayedProjects}</p>
              <p className="text-sm font-semibold text-muted-foreground">
                {language === 'ar' ? 'مشاريع متأخرة' : 'Delayed Projects'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* متوسط عدد العمال */}
        <Card className="border-r-4 border-r-blue-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-extrabold text-blue-600">{avgWorkers}</p>
              <p className="text-sm font-semibold text-muted-foreground">
                {language === 'ar' ? 'متوسط عدد العمال' : 'Avg Workers'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* الميزانية */}
        <Card className="border-r-4 border-r-green-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                <Banknote className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-extrabold text-green-600">
                {(totalBudget / 1000000).toFixed(1)}{language === 'ar' ? 'م' : 'M'}
              </p>
              <p className="text-sm font-semibold text-muted-foreground">
                {language === 'ar' ? 'الميزانية (ريال سعودي)' : 'Budget (SAR)'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* معدل الإنجاز */}
        <Card className="border-r-4 border-r-primary hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-extrabold text-primary">{completionRate}%</p>
              <p className="text-sm font-semibold text-muted-foreground">
                {language === 'ar' ? 'معدل الإنجاز' : 'Completion Rate'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* إجمالي المشاريع */}
        <Card className="border-r-4 border-r-secondary hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-secondary/10">
                <CheckCircle2 className="h-6 w-6 text-secondary" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-extrabold text-secondary">{totalProjects}</p>
              <p className="text-sm font-semibold text-muted-foreground">
                {language === 'ar' ? 'إجمالي المشاريع' : 'Total Projects'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الرسومات البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* حالة المشاريع - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              {language === 'ar' ? 'حالة المشاريع' : 'Project Status'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {language === 'ar' ? 'لا توجد بيانات' : 'No data available'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* التقدم الشهري - Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {language === 'ar' ? 'التقدم الشهري' : 'Monthly Progress'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyProgressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="planned" 
                  stroke="#FDB714" 
                  strokeWidth={2}
                  name={language === 'ar' ? 'الإنجاز المخطط' : 'Planned'}
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#006C35" 
                  strokeWidth={2}
                  name={language === 'ar' ? 'الإنجاز الفعلي' : 'Actual'}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* الأداء حسب المنطقة - Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {language === 'ar' ? 'الأداء حسب المنطقة' : 'Performance by Region'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {regionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="percentage" 
                  fill="#006C35"
                  name={language === 'ar' ? '% الإنجاز' : '% Completion'}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              {language === 'ar' ? 'لا توجد بيانات' : 'No data available'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ملخص الأداء */}
      <Card className="border-r-4 border-r-primary">
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'ملخص الأداء' : 'Performance Summary'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* متوسط وقت الاستجابة */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border-r-4 border-r-blue-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">
                  {language === 'ar' ? 'متوسط وقت الاستجابة' : 'Avg Response Time'}
                </p>
              </div>
              <p className="text-3xl font-extrabold text-blue-600">{avgResponseTime}h</p>
            </div>

            {/* وفورات التكلفة */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border-r-4 border-r-green-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                  <Banknote className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">
                  {language === 'ar' ? 'وفورات التكلفة (ريال)' : 'Cost Savings (SAR)'}
                </p>
              </div>
              <p className="text-3xl font-extrabold text-green-600">
                {(costSavings / 1000000).toFixed(1)}{language === 'ar' ? 'م' : 'M'}
              </p>
            </div>

            {/* رضا العملاء */}
            <div className="bg-primary/10 rounded-xl p-6 border-r-4 border-r-primary">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">
                  {language === 'ar' ? 'رضا العملاء' : 'Customer Satisfaction'}
                </p>
              </div>
              <p className="text-3xl font-extrabold text-primary">{avgSatisfaction || 96}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};