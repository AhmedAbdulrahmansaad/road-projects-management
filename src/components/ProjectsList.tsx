import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getServerUrl } from '../utils/supabase-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { FileText, Calendar, TrendingUp, Trash2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from '../contexts/LanguageContext';
import { EditProjectDialog } from './EditProjectDialog';

interface Project {
  id: string;
  workOrderDescription: string;
  workOrderNumber: string;
  contractNumber: string;
  roadName: string;
  roadNumber: string;
  region: string;
  branch: string;
  projectNumber: string;
  year: number;
  projectValue: number;
  duration: number;
  siteHandoverDate: string;
  contractEndDate: string;
  progressActual: number;
  progressPlanned: number;
  deviation: number;
  status: string;
  projectType: string;
  notes: string;
  hostName?: string;
  createdByName?: string;
  createdByEmail?: string;
}

interface ProjectsListProps {
  limit?: number;
}

export const ProjectsList: React.FC<ProjectsListProps> = ({ limit }) => {
  const { accessToken, user } = useAuth();
  const { t, language } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get user role
  const userRole = user?.user_metadata?.role || user?.role || 'Observer';
  const isGeneralManager = userRole === 'General Manager' || userRole === 'مدير عام';
  const isAdminManager = userRole === 'Admin Manager' || userRole === 'مدير إداري';
  const canEdit = isGeneralManager; // فقط المدير العام يستطيع التعديل والحذف

  useEffect(() => {
    fetchProjects();
  }, [accessToken]);

  const fetchProjects = async () => {
    if (!accessToken) return;
    
    setLoading(true);
    try {
      const response = await fetch(getServerUrl('/projects'), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const allProjects = data.projects || [];
        setProjects(limit ? allProjects.slice(0, limit) : allProjects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error(t('projects.fetchError') || 'خطأ في جلب المشاريع');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'جاري':
      case 'جاري العمل':
      case 'Ongoing':
        return 'bg-blue-500'; // أزرق
      case 'متعثر':
      case 'Stalled':
        return 'bg-red-600'; // أحمر
      case 'متوقف':
      case 'Stopped':
        return 'bg-gray-600'; // رصاصي
      case 'متقدم':
      case 'Advanced':
        return 'bg-green-600'; // أخضر
      case 'تم الرفع بالاستلام الابتدائي':
      case 'Preliminary Handover':
        return 'bg-gray-400'; // رمادي
      case 'تم الاستلام النهائي':
      case 'Final Handover':
        return 'bg-gray-500'; // رمادي
      case 'منجز':
      case 'Completed':
        return 'bg-green-500';
      case 'متأخر':
      case 'Delayed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getDeviationColor = (deviation: number) => {
    if (deviation >= 0) return 'text-green-600 dark:text-green-400';
    if (deviation >= -5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const deleteProject = async (projectId: string) => {
    try {
      const response = await fetch(getServerUrl(`/projects/${projectId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        setProjects(projects.filter(project => project.id !== projectId));
        toast.success(t('projects.deleteSuccess'));
      } else {
        toast.error(t('projects.deleteError'));
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error(t('projects.deleteError'));
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold mb-2">{t('projects.noProjects')}</h3>
          <p className="text-muted-foreground text-base">{t('projects.startCreating')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('projects.title')} ({projects.length})</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {/* العنوان الرئيسي: وصف أمر العمل */}
                  <CardTitle className="line-clamp-2 text-xl text-foreground mb-2">
                    {project.workOrderDescription}
                  </CardTitle>
                  {/* اسم الطريق تحته بخط خفيف */}
                  <CardDescription className="line-clamp-1 text-base border-b border-border/30 pb-2">
                    {project.roadName}
                  </CardDescription>
                  {/* المنطقة والفرع */}
                  <CardDescription className="line-clamp-1 text-sm mt-2">
                    {project.region} - {project.branch}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground text-xs">{t('projects.projectNumber')}</div>
                    <div className="font-semibold">{project.projectNumber}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground text-xs">رقم أمر العمل</div>
                    <div className="font-semibold">{project.workOrderNumber || 'غير محدد'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground text-xs">{t('projects.year')}</div>
                    <div className="font-semibold">{project.year}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div>
                    <div className="text-muted-foreground text-xs">{t('projects.value')}</div>
                    <div className="font-semibold">{((project.projectValue || 0) / 1000000).toFixed(2)} {language === 'ar' ? 'مليون ر.س' : 'Million SAR'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground text-xs">{t('projects.progress')}</div>
                    <div className={`font-bold ${getDeviationColor(project.progressActual)}`}>
                      {project.progressActual}%
                    </div>
                  </div>
                </div>

                {project.hostName && (
                  <div className="flex items-center gap-2 col-span-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-muted-foreground text-xs">{language === 'ar' ? 'اسم المضيف' : 'Host Name'}</div>
                      <div className="font-semibold">{project.hostName}</div>
                    </div>
                  </div>
                )}

                {project.createdByName && (
                  <div className="flex items-center gap-2 col-span-2">
                    <span className="text-lg">👤</span>
                    <div>
                      <div className="text-muted-foreground text-xs">{language === 'ar' ? 'أضيف بواسطة' : 'Created By'}</div>
                      <div className="font-semibold text-primary">{project.createdByName}</div>
                    </div>
                  </div>
                )}
              </div>

              {canEdit && (
                <EditProjectDialog project={project} onProjectUpdated={fetchProjects} />
              )}

              {canEdit && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full" size="sm">
                      <Trash2 className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                      {t('projects.delete')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('projects.confirmDelete')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('projects.confirmDeleteDesc')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('projects.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteProject(project.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t('common.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};