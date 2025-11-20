import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getServerUrl } from '../utils/supabase-client';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
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
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { Users, UserPlus, Edit, Trash2, Shield } from 'lucide-react';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export const UserManagement: React.FC = () => {
  const { accessToken, user } = useAuth();
  const { language, t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Engineer');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(getServerUrl('/users'), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('خطأ في تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(getServerUrl('/signup'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          role,
        }),
      });

      if (response.ok) {
        toast.success('تم إشاء المستخدم بنجاح');
        setDialogOpen(false);
        resetForm();
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.message || 'خطأ في إنشاء المستخدم');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('خطأ في إنشاء المستخدم');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setRole('Engineer');
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    // Prevent deleting yourself
    if (user?.id === userId) {
      toast.error(language === 'ar' ? 'لا يمكنك حذف نفسك!' : 'You cannot delete yourself!');
      return;
    }

    try {
      const response = await fetch(getServerUrl(`/users/${userId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        toast.success(language === 'ar' ? `تم حذف المستخدم ${userEmail} بنجاح` : `User ${userEmail} deleted successfully`);
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.message || (language === 'ar' ? 'خطأ في حذف المستخدم' : 'Error deleting user'));
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(language === 'ar' ? 'خطأ في حذف المستخدم' : 'Error deleting user');
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      'General Manager': 'bg-purple-500',
      'مدير عام': 'bg-purple-500',
      'Branch General Manager': 'bg-purple-500',
      'مدير عام الفرع': 'bg-purple-500',
      'Admin Manager': 'bg-red-500',
      'مدير إداري': 'bg-red-500',
      'Supervising Engineer': 'bg-blue-500',
      'المهندس المشرف': 'bg-blue-500',
      'Engineer': 'bg-blue-500',
      'مهندس': 'bg-blue-500',
      'Observer': 'bg-gray-500',
      'مراقب': 'bg-gray-500',
    };
    
    return roleColors[role] || 'bg-gray-500';
  };

  const getRoleDisplay = (role: string) => {
    // إذا كانت اللغة إنجليزية، نعرض الإنجليزي
    if (language === 'en') {
      // تحويل الدور العربي إلى إنجليزي
      const arabicToEnglish: Record<string, string> = {
        'مدير عام': 'General Manager',
        'مدير عام الفرع': 'Branch General Manager',
        'مدير إداري': 'Admin Manager',
        'المهندس المشرف': 'Supervising Engineer',
        'مهندس': 'Engineer',
        'مراقب': 'Observer',
      };
      return arabicToEnglish[role] || role;
    }
    
    // إذا كانت اللغة عربية، نعرض العربي
    const englishToArabic: Record<string, string> = {
      'General Manager': 'مدير عام',
      'Branch General Manager': 'مدير عام الفرع',
      'Admin Manager': 'مدير إداري',
      'Supervising Engineer': 'المهندس المشرف',
      'Engineer': 'مهندس',
      'Observer': 'مراقب',
    };
    return englishToArabic[role] || role;
  };

  // Only General Manager and Branch General Manager can access this
  const userRole = user?.user_metadata?.role || user?.role || 'Observer';
  const isGeneralManager = userRole === 'General Manager' || userRole === 'مدير عام';
  const isBranchGeneralManager = userRole === 'Branch General Manager' || userRole === 'مدير عام الفرع';
  const canManageUsers = isGeneralManager || isBranchGeneralManager;
  
  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold mb-2">{t('users.unauthorized')}</h3>
          <p className="text-muted-foreground text-base">{t('users.unauthorizedDesc')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              <CardTitle className="text-2xl">{t('users.title')}</CardTitle>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-primary/80 h-11">
                  <UserPlus className={`h-5 w-5 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {t('users.addUser')}
                </Button>
              </DialogTrigger>
              <DialogContent dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <DialogHeader>
                  <DialogTitle className="text-xl">{t('users.createUser')}</DialogTitle>
                  <DialogDescription className="text-base">
                    {t('users.createUserDesc')}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullname" className="text-base">{t('users.fullName')}</Label>
                    <Input
                      id="fullname"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder={language === 'ar' ? 'أدخل الاسم الكامل' : 'Enter full name'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base">{t('users.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      dir="ltr"
                      placeholder="example@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-base">{t('users.password')}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder={language === 'ar' ? '6 أحرف على الأقل' : '6 characters minimum'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-base">{t('users.role')}</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General Manager">{t('role.generalManager')}</SelectItem>
                        <SelectItem value="Branch General Manager">{t('role.branchGeneralManager')}</SelectItem>
                        <SelectItem value="Admin Manager">{t('role.adminManager')}</SelectItem>
                        <SelectItem value="Supervising Engineer">{t('role.supervisorEngineer')}</SelectItem>
                        <SelectItem value="Engineer">{t('role.engineer')}</SelectItem>
                        <SelectItem value="Observer">{t('role.observer')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full h-11 text-base">
                    {t('users.submit')}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center text-base">{t('users.actions')}</TableHead>
                  <TableHead className="text-center text-base">{t('users.createdAt')}</TableHead>
                  <TableHead className="text-center text-base">{t('users.role')}</TableHead>
                  <TableHead className="text-center text-base">{t('users.email')}</TableHead>
                  <TableHead className="text-center text-base">{t('users.fullName')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-base">
                      {t('users.loading')}
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-base">
                      {t('users.noUsers')}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((userItem) => (
                    <TableRow key={userItem.id}>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                disabled={user?.id === userItem.id}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir={language === 'ar' ? 'rtl' : 'ltr'}>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl">
                                  {language === 'ar' ? 'تأكيد حذف المستخدم' : 'Confirm User Deletion'}
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-base">
                                  {language === 'ar' 
                                    ? `هل أنت متأكد من حذف المستخدم "${userItem.fullName}" (${userItem.email})? هذا الإجراء لا يمكن التراجع عنه.`
                                    : `Are you sure you want to delete user "${userItem.fullName}" (${userItem.email})? This action cannot be undone.`
                                  }
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="text-base">
                                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteUser(userItem.id, userItem.email)}
                                  className="bg-destructive hover:bg-destructive/90 text-base"
                                >
                                  {language === 'ar' ? 'حذف' : 'Delete'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-base">
                        {new Date(userItem.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getRoleBadge(userItem.role)}>
                          {getRoleDisplay(userItem.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-base" dir="ltr">
                        {userItem.email}
                      </TableCell>
                      <TableCell className="text-center text-base">{userItem.fullName}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{users.length}</div>
              <p className="text-sm text-muted-foreground font-medium">{t('users.totalUsers')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                {users.filter(u => u.role === 'General Manager').length}
              </div>
              <p className="text-sm text-muted-foreground font-medium">{t('users.generalManagers')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                {users.filter(u => u.role === 'Project Manager').length}
              </div>
              <p className="text-sm text-muted-foreground font-medium">{t('users.projectManagers')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                {users.filter(u => u.role === 'Engineer').length}
              </div>
              <p className="text-sm text-muted-foreground font-medium">{t('users.engineers')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};