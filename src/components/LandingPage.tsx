import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Shield, Zap, CheckCircle, Award, TrendingUp, Users, Clock, Headphones, Globe, Moon, Sun } from 'lucide-react';
import { Activity, BarChart3, Bot } from 'lucide-react';
import { roadBackground } from '../assets/backgrounds';

interface LandingPageProps {
  onGetStarted: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, darkMode, toggleDarkMode }) => {
  const { language, toggleLanguage, t } = useLanguage();
  
  console.log('🎯 LandingPage: Rendering...', { darkMode, language });

  return (
    <div 
      className="min-h-screen relative overflow-hidden" 
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      style={{
        backgroundImage: `url(${roadBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Gradient Overlay - خفيف عشان الصورة تظهر */}
      <div 
        className="absolute inset-0 z-0 transition-all duration-500"
        style={{
          background: darkMode 
            ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.82) 0%, rgba(0, 108, 53, 0.22) 20%, rgba(16, 185, 129, 0.18) 35%, rgba(0, 0, 0, 0.80) 50%, rgba(16, 185, 129, 0.18) 65%, rgba(0, 108, 53, 0.22) 80%, rgba(0, 0, 0, 0.82) 100%)'
            : 'linear-gradient(135deg, rgba(0, 108, 53, 0.85) 0%, rgba(0, 0, 0, 0.75) 50%, rgba(253, 183, 20, 0.15) 75%, rgba(0, 108, 53, 0.85) 100%)',
          backdropFilter: 'blur(1px)'
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 glass-card border-b border-border/50 shadow-lg animate-fade-in-down">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 animate-fade-in-left">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-xl hover-scale animate-float">
                <span className="text-2xl">🛣️</span>
              </div>
              <div>
                <h1 className="text-xl">{t('landing.title')}</h1>
                <p className="text-xs text-muted-foreground">{t('landing.subtitle')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 animate-fade-in-right">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="rounded-full hover-scale glass"
              >
                {darkMode ? <Sun className="h-5 w-5 animate-spin" style={{ animation: 'spin 20s linear infinite' }} /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLanguage}
                className="rounded-full hover-scale glass"
              >
                <Globe className="h-5 w-5 hover-rotate" />
              </Button>
              <Button onClick={onGetStarted} className="hover-lift animate-glow">
                {t('landing.getStarted')}
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative z-10 max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 glass px-6 py-2 rounded-full border border-secondary/30 animate-fade-in delay-100">
              <Award className="h-4 w-4 text-secondary animate-bounce" />
              <span className="text-sm font-semibold">{t('landing.headerSub')}</span>
            </div>

            {/* Main Title */}
            <div className="space-y-4 animate-fade-in-up delay-200">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold gradient-text leading-tight">
                {t('landing.title')}
              </h1>
              <p className="text-2xl md:text-3xl text-white max-w-3xl mx-auto leading-relaxed font-bold drop-shadow-lg">
                {t('landing.subtitle')}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-fade-in-up delay-300">
              <Button 
                onClick={onGetStarted}
                size="lg"
                className="bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 text-secondary-foreground px-8 py-6 text-lg shadow-xl hover-lift animate-glow-gold"
              >
                <Zap className={`h-5 w-5 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                {t('landing.getStarted')}
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg border-2 glass hover-lift"
              >
                <svg className={`h-5 w-5 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('landing.watchDemo')}
              </Button>
            </div>

            {/* Features Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-8 animate-fade-in-up delay-400">
              <div className="glass px-6 py-3 rounded-full flex items-center gap-2 hover-scale">
                <Activity className="h-5 w-5 text-secondary" />
                <span className="text-white text-base font-semibold">{t('landing.roadProjects')} 1000+</span>
              </div>
              <div className="glass px-6 py-3 rounded-full flex items-center gap-2 hover-scale">
                <Users className="h-5 w-5 text-secondary" />
                <span className="text-white text-base font-semibold">{t('landing.users')}</span>
              </div>
              <div className="glass px-6 py-3 rounded-full flex items-center gap-2 hover-scale">
                <BarChart3 className="h-5 w-5 text-secondary" />
                <span className="text-white text-base font-semibold">{language === 'ar' ? 'تقارير فورية' : 'Instant Reports'}</span>
              </div>
              <div className="glass px-6 py-3 rounded-full flex items-center gap-2 hover-scale">
                <Bot className="h-5 w-5 text-secondary" />
                <span className="text-white text-base font-semibold">{language === 'ar' ? 'مساعد ذكي AI' : 'AI Assistant'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="relative z-10 max-w-7xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                icon: TrendingUp, 
                value: '1000+', 
                label: t('landing.roadProjects'),
                color: 'from-green-500 to-green-600',
                bgColor: 'bg-green-500/10',
                delay: '100'
              },
              { 
                icon: Users, 
                value: '500+', 
                label: t('landing.engineers'),
                color: 'from-yellow-500 to-yellow-600',
                bgColor: 'bg-yellow-500/10',
                delay: '200'
              },
              { 
                icon: Clock, 
                value: '99.9%', 
                label: t('landing.uptime'),
                color: 'from-blue-500 to-blue-600',
                bgColor: 'bg-blue-500/10',
                delay: '300'
              },
              { 
                icon: Headphones, 
                value: '24/7', 
                label: t('landing.support'),
                color: 'from-purple-500 to-purple-600',
                bgColor: 'bg-purple-500/10',
                delay: '400'
              },
            ].map((stat, i) => (
              <Card 
                key={i} 
                className={`border-0 shadow-xl glass-card hover-lift animate-fade-in-up delay-${stat.delay}`}
              >
                <CardContent className="p-8 text-center space-y-4">
                  <div className={`w-16 h-16 rounded-2xl ${stat.bgColor} flex items-center justify-center mx-auto hover-rotate`}>
                    <stat.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <div className={`text-5xl font-extrabold bg-gradient-to-br ${stat.color} bg-clip-text text-transparent mb-2`}>
                      {stat.value}
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 border-t border-border glass-card animate-fade-in">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center text-sm text-muted-foreground">
              <p className="font-semibold">© 2025 {t('landing.headerSub')} - {language === 'ar' ? 'جميع الحقوق محفوظة' : 'All Rights Reserved'}</p>
              <p className="mt-2 text-lg">{language === 'ar' ? 'المملكة العربية السعودية' : 'Kingdom of Saudi Arabia'} 🇸🇦</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};