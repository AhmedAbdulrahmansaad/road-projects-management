import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { TrendingUp, TrendingDown, Minus, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from './AuthContext';
import { getServerUrl } from '../utils/supabase-client';

interface ProjectProgress {
  id: string;
  name: string;
  progress: number;
  target: number;
  status: 'ahead' | 'ontrack' | 'behind';
  trend: number; // Percentage change
  dueDate: string;
}

interface ProgressTrackerProps {
  projects?: ProjectProgress[];
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ projects }) => {
  const { language, t } = useLanguage();
  const { accessToken } = useAuth();
  const [realProjects, setRealProjects] = useState<ProjectProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealProjects = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(getServerUrl('/projects'), {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (response.ok) {
          const data = await response.json();
          const projectsData = data.projects || [];

          // تحويل بيانات المشاريع الحقيقية إلى ProjectProgress
          const mapped = projectsData.slice(0, 5).map((p: any) => {
            const progress = p.progressActual || 0;
            const target = p.progressPlanned || 0;
            const deviation = p.deviation || 0;

            let status: 'ahead' | 'ontrack' | 'behind' = 'ontrack';
            if (deviation > 5) status = 'ahead';
            else if (deviation < -5) status = 'behind';

            return {
              id: p.id,
              name: p.workOrderDescription || p.roadName || (language === 'ar' ? 'مشروع بدون اسم' : 'Unnamed Project'),
              progress: Math.round(progress),
              target: Math.round(target),
              status,
              trend: Math.round(deviation),
              dueDate: p.contractEndDate || 'غير محدد',
            };
          });

          setRealProjects(mapped);
        }
      } catch (error) {
        console.error('ProgressTracker: Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealProjects();
  }, [accessToken, language]);

  const displayProjects = projects || realProjects;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ahead':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'behind':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      default:
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ahead':
        return <CheckCircle className="h-4 w-4" />;
      case 'behind':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    if (language === 'ar') {
      switch (status) {
        case 'ahead':
          return 'متقدم';
        case 'behind':
          return 'متأخر';
        default:
          return 'على المسار';
      }
    } else {
      switch (status) {
        case 'ahead':
          return 'Ahead';
        case 'behind':
          return 'Behind';
        default:
          return 'On Track';
      }
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-blue-500" />;
  };

  const getProgressColor = (progress: number, target: number) => {
    if (progress >= target) return 'bg-green-500';
    if (progress >= target * 0.8) return 'bg-blue-500';
    return 'bg-yellow-500';
  };

  const getDaysRemaining = (dueDate: string) => {
    const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (language === 'ar') {
      return days > 0 ? `${days} يوم متبقي` : `متأخر ${Math.abs(days)} يوم`;
    } else {
      return days > 0 ? `${days} days left` : `${Math.abs(days)} days overdue`;
    }
  };

  return (
    <Card className="glass-card border-0 shadow-xl hover-lift animate-fade-in-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <TrendingUp className="h-6 w-6 text-primary animate-pulse" />
          {language === 'ar' ? 'متابعة التقدم' : 'Progress Tracker'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayProjects.map((project, index) => (
          <div
            key={project.id}
            className={`p-4 rounded-xl border glass hover:scale-[1.02] transition-transform animate-fade-in-up delay-${(index % 4 + 1) * 100}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-bold text-base mb-1">{project.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {getDaysRemaining(project.dueDate)}
                </p>
              </div>
              <Badge 
                variant="outline" 
                className={`${getStatusColor(project.status)} flex items-center gap-1`}
              >
                {getStatusIcon(project.status)}
                {getStatusText(project.status)}
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-2xl">{project.progress}%</span>
                  <div className="flex items-center gap-1 text-xs">
                    {getTrendIcon(project.trend)}
                    <span className={project.trend > 0 ? 'text-green-500' : project.trend < 0 ? 'text-red-500' : 'text-blue-500'}>
                      {Math.abs(project.trend)}%
                    </span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'الهدف' : 'Target'}: {project.target}%
                </span>
              </div>

              {/* Custom Progress Bar */}
              <div className="relative h-3 bg-secondary/20 rounded-full overflow-hidden">
                {/* Target Marker */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-foreground/30 z-10"
                  style={{ left: `${project.target}%` }}
                />
                {/* Progress Fill */}
                <div
                  className={`h-full ${getProgressColor(project.progress, project.target)} transition-all duration-1000 ease-out animate-slide-right`}
                  style={{ width: `${project.progress}%` }}
                >
                  <div className="h-full w-full bg-gradient-to-r from-transparent to-white/20 animate-pulse" />
                </div>
              </div>

              {/* Details */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>0%</span>
                <span className="font-semibold">
                  {project.progress - project.target > 0 ? '+' : ''}{project.progress - project.target}% 
                  {language === 'ar' ? ' من الهدف' : ' from target'}
                </span>
                <span>100%</span>
              </div>
            </div>
          </div>
        ))}

        {/* Summary */}
        <div className="pt-4 border-t border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {language === 'ar' ? 'متقدمة' : 'Ahead'}
              </p>
              <p className="text-2xl font-bold text-green-500">
                {displayProjects.filter(p => p.status === 'ahead').length}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {language === 'ar' ? 'على المسار' : 'On Track'}
              </p>
              <p className="text-2xl font-bold text-blue-500">
                {displayProjects.filter(p => p.status === 'ontrack').length}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {language === 'ar' ? 'متأخرة' : 'Behind'}
              </p>
              <p className="text-2xl font-bold text-red-500">
                {displayProjects.filter(p => p.status === 'behind').length}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};