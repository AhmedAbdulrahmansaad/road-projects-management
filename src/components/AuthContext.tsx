import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient, getServerUrl } from '../utils/supabase-client';
import { publicAnonKey } from '../utils/supabase/info';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  role: string | null;
  userId: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Use a single Supabase instance
  const supabase = React.useMemo(() => createClient(), []);

  useEffect(() => {
    // Set a maximum timeout for loading
    const loadingTimeout = setTimeout(() => {
      console.log('AuthContext: Loading timeout reached, forcing loading to false');
      setLoading(false);
    }, 5000); // 5 seconds maximum

    checkSession().finally(() => {
      clearTimeout(loadingTimeout);
    });

    return () => clearTimeout(loadingTimeout);
  }, []);

  const checkSession = async () => {
    console.log('AuthContext: Checking session...');
    setLoading(true);
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log('AuthContext: Session check result:', { 
        hasSession: !!session, 
        hasToken: !!session?.access_token,
        error: error?.message 
      });
      
      if (error) {
        console.error('AuthContext: Session error:', error);
        // Clear everything on error
        setUser(null);
        setAccessToken(null);
        setRole(null);
        setUserId(null);
        return;
      }
      
      if (session?.access_token) {
        console.log('AuthContext: Valid session found, fetching profile...');
        setAccessToken(session.access_token);
        await fetchUserProfile(session.access_token);
      } else {
        console.log('AuthContext: No active session found');
        // Clear all auth state
        setUser(null);
        setAccessToken(null);
        setRole(null);
        setUserId(null);
      }
    } catch (error) {
      console.error('AuthContext: Error checking session:', error);
      // Clear all auth state on error
      setUser(null);
      setAccessToken(null);
      setRole(null);
      setUserId(null);
    } finally {
      console.log('AuthContext: Session check complete, setting loading to false');
      setLoading(false);
    }
  };

  const fetchUserProfile = async (token: string) => {
    if (!token || token === 'undefined' || token === 'null') {
      console.log('❌ No valid token provided to fetchUserProfile');
      return;
    }

    try {
      console.log('🔍 Fetching user profile with token...');
      const response = await fetch(getServerUrl('/profile'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ AuthContext - Fetched user profile:', data.user);
        setUser(data.user);
        setRole(data.user.role);
        setUserId(data.user.id);
        console.log('✅ AuthContext - Set role:', data.user.role, '| userId:', data.user.id);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Failed to fetch user profile:', response.status, errorData);
        
        // If 401, token is invalid - clear auth state
        if (response.status === 401) {
          console.warn('⚠️ Token expired or invalid, clearing auth state...');
          setUser(null);
          setAccessToken(null);
          setRole(null);
          setUserId(null);
          // Sign out from Supabase auth to clear localStorage
          await supabase.auth.signOut();
        }
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      // Don't clear auth state on network errors, only on auth errors
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.session?.access_token) {
      setAccessToken(data.session.access_token);
      await fetchUserProfile(data.session.access_token);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: string) => {
    try {
      console.log('🔵 Starting signup process...', { email, fullName, role });
      
      const response = await fetch(getServerUrl('/signup'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password, fullName, role }),
      });

      console.log('🔵 Signup response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Signup error from server:', error);
        throw new Error(error.error || 'خطأ في إنشاء الحساب');
      }

      const result = await response.json();
      console.log('✅ Signup successful, attempting auto sign-in...', result);

      // Auto sign-in after successful signup
      await signIn(email, password);
      console.log('✅ Auto sign-in successful!');
    } catch (error) {
      console.error('❌ Error in signUp:', error);
      throw error;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccessToken(null);
    setRole(null);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, role, userId, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};