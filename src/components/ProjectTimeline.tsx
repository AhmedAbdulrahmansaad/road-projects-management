import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from './AuthContext';
import { getServerUrl } from '../utils/supabase-client';

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'completed' | 'inprogress' | 'upcoming' | 'delayed';
  project: string;
}

export const ProjectTimeline: React.FC = () => {
  const { language } = useLanguage();
  const { accessToken } = useAuth();
  const [realEvents, setRealEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    const fetchRealTimeline = async () => {
      if (!accessToken) return;

      try {
        const response = await fetch(getServerUrl('/projects'), {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (response.ok) {
          const data = await response.json();
          const projects = data.projects || [];

          // إنشاء أحداث من المشاريع الحقيقية
          const events: TimelineEvent[] = [];

          projects.slice(0, 5).forEach((p: any) => {
            let type: 'completed' | 'inprogress' | 'upcoming' | 'delayed' = 'inprogress';
            
            if (p.status === 'تم الاستلام النهائي' || p.status === 'منجز') {
              type = 'completed';
            } else if (p.status === 'متأخر' || p.status === 'متعثر') {
              type = 'delayed';
            } else if (p.progressActual && p.progressActual > 0) {
              type = 'inprogress';
            } else {
              type = 'upcoming';
            }

            events.push({
              id: p.id,
              title: p.workOrderDescription || p.roadName || (language === 'ar' ? 'مشروع بدون اسم' : 'Unnamed Project'),
              description: `${language === 'ar' ? 'نسبة الإنجاز' : 'Progress'}: ${(p.progressActual || 0).toFixed(1)}% | ${language === 'ar' ? 'الحالة' : 'Status'}: ${p.status || '-'}`,
              date: p.contractEndDate || p.siteHandoverDate || new Date().toISOString().split('T')[0],
              type,
              project: p.roadName || (language === 'ar' ? 'مشروع' : 'Project')
            });
          });

          setRealEvents(events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        }
      } catch (error) {
        console.error('ProjectTimeline: Error fetching data:', error);
      }
    };

    fetchRealTimeline();
  }, [accessToken, language]);

  const events = realEvents;

  const getIcon = (type: string) => {
    switch (type) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'inprogress':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'delayed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (type: string) => {
    const configs = {
      completed: {
        label: language === 'ar' ? 'مكتمل' : 'Completed',
        variant: 'default' as const,
        className: 'bg-green-500 text-white'
      },
      inprogress: {
        label: language === 'ar' ? 'قيد التنفيذ' : 'In Progress',
        variant: 'secondary' as const,
        className: 'bg-blue-500 text-white'
      },
      upcoming: {
        label: language === 'ar' ? 'قادم' : 'Upcoming',
        variant: 'outline' as const,
        className: 'border-gray-300'
      },
      delayed: {
        label: language === 'ar' ? 'متأخر' : 'Delayed',
        variant: 'destructive' as const,
        className: ''
      }
    };

    const config = configs[type as keyof typeof configs] || configs.upcoming;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <Card className="glass-card border-0 shadow-xl hover-lift animate-fade-in-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Calendar className="h-6 w-6 text-primary animate-pulse" />
          {language === 'ar' ? 'الجدول الزمني للمشروع' : 'Project Timeline'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-primary opacity-30" />

          {/* Timeline Events */}
          <div className="space-y-6">
            {events.map((event, index) => (
              <div
                key={event.id}
                className={`relative flex gap-4 animate-fade-in-up delay-${(index % 4 + 1) * 100}`}
              >
                {/* Icon */}
                <div className="relative z-10 flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                    event.type === 'completed' ? 'bg-green-100 dark:bg-green-900/30' :
                    event.type === 'inprogress' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    event.type === 'delayed' ? 'bg-red-100 dark:bg-red-900/30' :
                    'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    {getIcon(event.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <Card className="glass hover-scale">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-base">{event.title}</h4>
                        {getStatusBadge(event.type)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 font-medium">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span className="font-semibold">{formatDate(event.date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold">{event.project}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};