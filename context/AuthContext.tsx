import { createUserRecord, updateLastLogin, userRecordExists } from '@/lib/api/users';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    metadata: { username: string; full_name: string }
  ) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    metadata: { username: string; full_name: string }
  ): Promise<{ error: any }> => {
    try {
      // Get redirect URL for email confirmation
      const redirectUrl = `${process.env.EXPO_PUBLIC_APP_URL || 'exp://localhost:8081'}/auth/confirm-email`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: redirectUrl,
        },
      });

      if (authError) {
        return { error: authError };
      }

      // Create user record in our users table
      // Only create if we have an active session (email confirmation might be disabled)
      // If email confirmation is enabled, record on first login
      if (authData.user?.id && authData.session) {
        const { error: userError } = await createUserRecord(
          authData.user.id,
          metadata.username,
          metadata.full_name
        );

        if (userError) {
          console.error('Error creating user record:', userError);
          // If it's an RLS error, the record will be created on first login
          if (userError.code === '42501') {
            console.log('User record will be created after email confirmation');
          }
        }
      } else if (authData.user?.id && !authData.session) {
        // Email confirmation is required - user record will be created on first login
        console.log('Email confirmation required. User record will be created after email confirmation.');
      }

      return { error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { error };
    }
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: any }> => {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (authData.user?.id) {
        // Handle legacy users: create record if missing, otherwise update login time
        const { data: exists } = await userRecordExists(authData.user.id);
        
        if (!exists) {
          // Backfill user record from auth metadata (for users created before this fix)
          const metadata = authData.user.user_metadata;
          if (metadata?.username && metadata?.full_name) {
            await createUserRecord(
              authData.user.id,
              metadata.username,
              metadata.full_name
            );
          }
        } else {
          await updateLastLogin(authData.user.id);
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

