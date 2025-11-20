import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import { LogIn, UserPlus, Moon, Sun, Globe, ArrowLeft } from 'lucide-react';

interface LoginProps {
  onBack?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onBack }) => {
  const { signIn, signUp } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up State
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Engineer');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(signInEmail, signInPassword);
      toast.success(t('auth.loginSuccess'));
    } catch (error: any) {
      toast.error(error.message || t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('📝 Login component: Starting sign up...');
      await signUp(signUpEmail, signUpPassword, fullName, role);
      console.log('✅ Login component: Sign up completed successfully!');
      toast.success(t('auth.signupSuccess'));
      
      // Wait a bit for state to update before navigation might happen
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error('❌ Login component: Sign up failed:', error);
      toast.error(error.message || t('auth.signupError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-login-slideshow relative overflow-hidden flex items-center justify-center p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Gradient Overlay مدمج في الخلفية */}
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Back Button */}
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="absolute top-4 left-4 z-50 rounded-full glass hover-scale animate-fade-in-left"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        {/* Top Right Controls */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 animate-fade-in-right">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
            className="rounded-full glass hover-scale"
          >
            {darkMode ? <Sun className="h-5 w-5 animate-spin" style={{ animation: 'spin 20s linear infinite' }} /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLanguage}
            className="rounded-full glass hover-scale"
          >
            <Globe className="h-5 w-5 hover-rotate" />
          </Button>
        </div>

        <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 glass-card animate-scale-in">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                <span className="text-3xl">🛣️</span>
              </div>
            </div>
            <div>
              <CardTitle className="text-3xl mb-2">{t('auth.systemTitle')}</CardTitle>
              <CardDescription className="text-base">{t('auth.systemSubtitle')}</CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="signin" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin" className="text-base">{t('auth.signIn')}</TabsTrigger>
                <TabsTrigger value="signup" className="text-base">{t('auth.signUp')}</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">{t('auth.email')}</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      required
                      dir="ltr"
                      placeholder="example@email.com"
                      className="h-11 bg-input-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">{t('auth.password')}</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      required
                      className="h-11 bg-input-background"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" 
                    disabled={loading}
                  >
                    <LogIn className={`h-5 w-5 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                    {loading ? t('auth.loading') : t('auth.signInBtn')}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullname">{t('auth.fullName')}</Label>
                    <Input
                      id="fullname"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                      className="h-11 bg-input-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{t('auth.email')}</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                      dir="ltr"
                      placeholder="example@email.com"
                      className="h-11 bg-input-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{t('auth.password')}</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-11 bg-input-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">{t('auth.role')}</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className="h-11 bg-input-background">
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

                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 text-secondary-foreground" 
                    disabled={loading}
                  >
                    <UserPlus className={`h-5 w-5 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                    {loading ? t('auth.loading') : t('auth.signUpBtn')}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};