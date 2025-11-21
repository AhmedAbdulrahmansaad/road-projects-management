import React, { useEffect } from 'react';

/**
 * Component to clear old/invalid auth cache on mount
 * This helps fix issues with stale tokens in localStorage
 */
export const ClearAuthCache: React.FC = () => {
  useEffect(() => {
    const clearCache = async () => {
      try {
        console.log('🧹 Checking for stale auth cache...');
        
        // Get all keys from localStorage
        const keys = Object.keys(localStorage);
        
        // Find Supabase auth keys
        const supabaseKeys = keys.filter(key => 
          key.startsWith('sb-') || 
          key.includes('supabase') || 
          key.includes('auth-token')
        );
        
        if (supabaseKeys.length > 0) {
          console.log('🧹 Found Supabase keys in localStorage:', supabaseKeys);
          
          // Try to parse the session data
          for (const key of supabaseKeys) {
            try {
              const data = localStorage.getItem(key);
              if (data) {
                const parsed = JSON.parse(data);
                
                // Check if there's an access_token and if it's expired
                if (parsed.access_token) {
                  // Decode JWT to check expiration (basic check)
                  const tokenParts = parsed.access_token.split('.');
                  if (tokenParts.length === 3) {
                    const payload = JSON.parse(atob(tokenParts[1]));
                    const expiresAt = payload.exp * 1000; // Convert to milliseconds
                    const now = Date.now();
                    
                    if (expiresAt < now) {
                      console.log(`⚠️ Token in key "${key}" is expired, removing...`);
                      localStorage.removeItem(key);
                    } else {
                      console.log(`✅ Token in key "${key}" is still valid`);
                    }
                  }
                } else if (parsed.currentSession) {
                  // Check nested session object
                  const session = parsed.currentSession;
                  if (session.access_token) {
                    const tokenParts = session.access_token.split('.');
                    if (tokenParts.length === 3) {
                      const payload = JSON.parse(atob(tokenParts[1]));
                      const expiresAt = payload.exp * 1000;
                      const now = Date.now();
                      
                      if (expiresAt < now) {
                        console.log(`⚠️ Session in key "${key}" is expired, removing...`);
                        localStorage.removeItem(key);
                      } else {
                        console.log(`✅ Session in key "${key}" is still valid`);
                      }
                    }
                  }
                }
              }
            } catch (err) {
              console.error(`Error processing key "${key}":`, err);
              // If we can't parse it, it might be corrupted - remove it
              console.log(`🧹 Removing potentially corrupted key: ${key}`);
              localStorage.removeItem(key);
            }
          }
          
          console.log('✅ Auth cache cleanup complete');
        } else {
          console.log('✅ No Supabase auth cache found');
        }
      } catch (error) {
        console.error('❌ Error clearing auth cache:', error);
      }
    };
    
    clearCache();
  }, []);
  
  return null;
};
