import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { LandingPage } from './components/LandingPage';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Toaster } from './components/ui/sonner';
import { ClearAuthCache } from './components/ClearAuthCache';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [showLogin, setShowLogin] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    console.log('🔍 App: User state changed:', { user: user?.email, loading });
  }, [user, loading]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (loading) {
    console.log('⏳ App: Still loading...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="text-center space-y-6 p-8">
          {/* Logo */}
          <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-2xl animate-pulse">
            <span className="text-5xl">🛣️</span>
          </div>
          
          {/* Spinner */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
          </div>
          
          {/* Text */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              نظام إدارة مشاريع الطرق
            </h2>
            <p className="text-muted-foreground text-lg font-medium">
              {t('auth.loading')}...
            </p>
            <p className="text-xs text-muted-foreground/60">
              المملكة العربية السعودية 🇸🇦
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  if (showLogin) {
    return <Login onBack={() => setShowLogin(false)} />;
  }

  return (
    <LandingPage 
      onGetStarted={() => setShowLogin(true)} 
      darkMode={darkMode}
      toggleDarkMode={() => setDarkMode(!darkMode)}
    />
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ClearAuthCache />
        <AppContent />
        <Toaster position="top-center" dir="rtl" />
      </AuthProvider>
    </LanguageProvider>
  );
}