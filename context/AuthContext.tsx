import { createUserRecord, updateLastLogin, userRecordExists } from '@/lib/api/users';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

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
  const guestUser = useMemo(
    () =>
      ({
        id: 'guest-user',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'guest@example.com',
        email_confirmed_at: new Date().toISOString(),
        phone: '',
        confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {
          username: 'guest',
          full_name: 'Guest User',
        },
        identities: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as User),
    []
  );

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? guestUser);
      } catch (error) {
        console.error('Error checking session:', error);
        setUser(guestUser);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? guestUser);
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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (authError) {
        return { error: authError };
      }

      // Create user record in our users table
      // If email confirmation is enabled, user.id might be null - we'll create the record on first login
      if (authData.user?.id) {
        const { error: userError } = await createUserRecord(
          authData.user.id,
          metadata.username,
          metadata.full_name,
          3 // Default: Staff role
        );

        if (userError) {
          console.error('Error creating user record:', userError);
          // Non-blocking: user can still sign in, record will be created on first login
        }
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
              metadata.full_name,
              3
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
      setUser(guestUser);
    } catch (error) {
      console.error('Error signing out:', error);
      setUser(guestUser);
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
