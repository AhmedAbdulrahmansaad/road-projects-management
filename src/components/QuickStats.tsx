import React from 'react';
import { Card, CardContent } from './ui/card';
import { TrendingUp, Activity, Clock, BarChart3, FolderKanban, CheckCircle2, PauseCircle, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useStats } from '../contexts/StatsContext';

interface StatData {
  label: string;
  value: number;
  unit?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export const QuickStats: React.FC = () => {
  const { language } = useLanguage();
  const { 
    totalProjects,
    activeProjects,
    stoppedProjects,
    delayedProjects,
    completedProjects,
    loading 
  } = useStats();

  const stats: StatData[] = [
    {
      label: language === 'ar' ? 'إجمالي المشاريع' : 'Total Projects',
      value: totalProjects,
      unit: '',
      icon: <FolderKanban className="h-6 w-6" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      label: language === 'ar' ? 'المشاريع النشطة' : 'Active Projects',
      value: activeProjects,
      unit: '',
      icon: <Activity className="h-6 w-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      label: language === 'ar' ? 'المشاريع المتوقفة' : 'Stopped Projects',
      value: stoppedProjects,
      unit: '',
      icon: <PauseCircle className="h-6 w-6" />,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20'
    },
    {
      label: language === 'ar' ? 'المشاريع المتأخرة' : 'Delayed Projects',
      value: delayedProjects,
      unit: '',
      icon: <AlertTriangle className="h-6 w-6" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      label: language === 'ar' ? 'المشاريع المكتملة' : 'Completed Projects',
      value: completedProjects,
      unit: '',
      icon: <CheckCircle2 className="h-6 w-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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