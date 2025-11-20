import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { TrendingUp, TrendingDown, Activity, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from './AuthContext';
import { getServerUrl } from '../utils/supabase-client';

interface StatData {
  label: string;
  value: number;
  unit?: string;
  trend?: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export const QuickStats: React.FC = () => {
  const { language } = useLanguage();
  const { accessToken } = useAuth();
  const [realStats, setRealStats] = useState({
    activeProjects: 0,
    completionRate: 0,
    delayedProjects: 0,
    overallPerformance: 0,
  });

  useEffect(() => {
    const fetchRealStats = async () => {
      if (!accessToken) {
        console.log('QuickStats: No access token available');
        return;
      }

      try {
        const response = await fetch(getServerUrl('/projects'), {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (response.ok) {
          const data = await response.json();
          const projects = data.projects || [];
          
          // حساب المشاريع النشطة (جاري العمل)
          const active = projects.filter((p: any) => 
            p.status === 'جاري العمل' || p.status === 'جاري'
          ).length;

          // حساب المشاريع المكتملة
          const completed = projects.filter((p: any) => 
            p.status === 'تم الاستلام النهائي' || p.status === 'منجز'
          ).length;

          // حساب معدل الإنجاز (نسبة المشاريع المكتملة)
          const completionRate = projects.length > 0 
            ? Math.round((completed / projects.length) * 100)
            : 0;

          // حساب المشاريع المتأخرة (deviation سالب)
          const delayed = projects.filter((p: any) => 
            p.status === 'متعثر' || p.status === 'متأخر' || (p.deviation && p.deviation < -5)
          ).length;

          // حساب الأداء العام (متوسط النسبة الفعلية)
          const overallPerformance = projects.length > 0
            ? Math.round(projects.reduce((sum: number, p: any) => sum + (p.progressActual || 0), 0) / projects.length)
            : 0;

          setRealStats({
            activeProjects: active,
            completionRate,
            delayedProjects: delayed,
            overallPerformance,
          });
        } else {
          console.error('QuickStats: Failed to fetch projects:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('QuickStats: Error fetching real stats:', error);
        // لا نعرض رسالة خطأ للمستخدم، فقط نسجل في console
      }
    };

    fetchRealStats();
  }, [accessToken]);

  const stats: StatData[] = [
    {
      label: language === 'ar' ? 'المشاريع النشطة' : 'Active Projects',
      value: realStats.activeProjects,
      unit: '',
      icon: <Activity className="h-6 w-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      label: language === 'ar' ? 'معدل الإنجاز' : 'Completion Rate',
      value: realStats.completionRate,
      unit: '%',
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      label: language === 'ar' ? 'المشاريع المتأخرة' : 'Delayed Projects',
      value: realStats.delayedProjects,
      unit: '',
      icon: <Clock className="h-6 w-6" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      label: language === 'ar' ? 'الأداء العام' : 'Overall Performance',
      value: realStats.overallPerformance,
      unit: '%',
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card 
          key={index}
          className={`border-0 shadow-lg glass-card hover-lift animate-fade-in-up delay-${(index + 1) * 100}`}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-3xl font-extrabold">
                {stat.value}{stat.unit}
              </p>
              <p className="text-sm font-semibold text-muted-foreground">
                {stat.label}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};