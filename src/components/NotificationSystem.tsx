import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from './AuthContext';
import { getServerUrl } from '../utils/supabase-client';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'update' | 'error' | 'danger';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  userId?: string;
}

export const NotificationSystem: React.FC = () => {
  const { language, t } = useLanguage();
  const { accessToken, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // جلب الإشعارات من الـ backend
  useEffect(() => {
    if (accessToken) {
      fetchNotifications();
      // تحديث الإشعارات كل دقيقة
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [accessToken]);

  const fetchNotifications = async () => {
    // ✅ التحقق من accessToken قبل الطلب
    if (!accessToken) {
      console.log('NotificationSystem: No access token available');
      return;
    }
    
    try {
      const response = await fetch(getServerUrl('/notifications'), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.filter((n: Notification) => !n.read).length || 0);
      } else {
        // ✅ عدم عرض رسالة 401 إذا كان المستخدم غير مسجل دخول
        if (response.status === 401) {
          console.log('NotificationSystem: Unauthorized (401) - User may not be logged in');
        } else {
          console.warn('Notifications fetch returned non-OK status:', response.status);
        }
      }
    } catch (error) {
      console.error('Notifications fetch error:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(getServerUrl(`/notifications/${id}/read`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => 
          n.id === id ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(getServerUrl('/notifications/read-all'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(getServerUrl(`/notifications/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const notification = notifications.find(n => n.id === id);
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
      case 'danger':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'update':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return language === 'ar' ? 'الآن' : 'Now';
    if (minutes < 60) return language === 'ar' ? `منذ ${minutes} دقيقة` : `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return language === 'ar' ? `منذ ${hours} ساعة` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return language === 'ar' ? `منذ ${days} يوم` : `${days}d ago`;
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowPanel(!showPanel)}
        className="relative rounded-full hover-scale glass"
      >
        <Bell className="h-5 w-5 hover-rotate" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-bounce"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {showPanel && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowPanel(false)}
          />
          
          {/* Panel */}
          <Card className={`absolute ${language === 'ar' ? 'left-0' : 'right-0'} top-12 w-96 max-h-[500px] overflow-hidden shadow-2xl border-0 glass-card z-50 animate-scale-in`}>
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg">
                  {language === 'ar' ? 'الإشعارات' : 'Notifications'}
                </h3>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="animate-pulse">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs hover-scale"
                >
                  {language === 'ar' ? 'قراءة الكل' : 'Mark all read'}
                </Button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[400px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">
                    {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
                  </p>
                </div>
              ) : (
                notifications
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((notification, index) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-border hover:bg-accent/50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="mt-1">
                          {getIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`font-semibold text-sm ${!notification.read ? 'text-primary' : 'text-foreground'}`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatTime(notification.timestamp)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="h-6 w-6 p-0 hover-scale"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};