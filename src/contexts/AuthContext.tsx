// yellow-diamond-learn-main/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

// Define the shape of our context
type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

// Create the auth context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
});

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Get initial session only once on mount
  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          return;
        }
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch (error) {
        console.error('Unexpected error during getSession:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();
  }, []); // Empty dependency array - only run once on mount

  // Separate effect for auth state changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only update state for explicit sign-in/sign-out events
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          console.log('Auth event:', event);
          setSession(session);
          setUser(session?.user ?? null);

          if (event === 'SIGNED_IN' && session) {
            // Check if the user is on the /reset-password page after a password reset.
            // If so, do NOT redirect to dashboard immediately. The ResetPasswordPage will handle navigation.
            if (location.pathname === '/reset-password') {
                return; // Let ResetPasswordPage handle post-update navigation
            }
            // Only navigate if explicitly signing in and not on a special auth page
            if (location.pathname === '/login' || location.pathname === '/') {
              navigate('/dashboard', { replace: true });
            }
            toast({
              title: 'Welcome!',
              description: 'You have successfully signed in.',
            });
          }

          if (event === 'SIGNED_OUT') {
            // Only navigate if explicitly signing out
            if (location.pathname !== '/login' && location.pathname !== '/') {
              navigate('/login', { replace: true });
            }
            toast({
              title: 'Goodbye!',
              description: 'You have signed out.',
            });
          }
        }
        // Ignore all other events (like token refresh)
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Sign in failed',
          description: error.message,
        });
        throw error;
      }
    } catch (error) {
      throw error;
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    try {
      // 1. Check if email exists in the staging table for authorization
      const { data: stagedUser, error: stageError } = await supabase
        .from('user_import_staging')
        .select('*')
        .eq('email', email)
        .single();

      if (stageError && stageError.code !== 'PGRST116') { // PGRST116 means no rows are found.
        throw stageError;
      }

      if (!stagedUser) {
        toast({
          variant: 'destructive',
          title: 'Unauthorized user',
          description: 'This email is not authorized to create an account.',
        });
        return;
      }
      
      // 2. Check if the user account already exists in the public.users table
      const { data: existingUser, error: existingUserError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUserError && existingUserError.code !== 'PGRST116') {
          throw existingUserError;
      }

      if (existingUser) {
          toast({
              variant: 'destructive',
              title: 'Account exists',
              description: 'An account with this email already exists. Please sign in.',
          });
          return;
      }

      // 3. If authorized and not existing, proceed with signup
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: stagedUser.name || 'New User',
          },
        },
      });

      if (signUpError) {
        toast({
          variant: 'destructive',
          title: 'Sign up failed',
          description: signUpError.message,
        });
        throw signUpError;
      } else {
        toast({
          title: 'Account created',
          description: 'Please check your email for verification instructions.',
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Sign up process failed:", error.message);
      }
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Sign out failed',
          description: error.message,
        });
        throw error;
      }
    } catch (error) {
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Password reset failed',
          description: error.message,
        });
        throw error;
      } else {
        toast({
          title: 'Password reset email sent',
          description: 'Please check your email for password reset instructions.',
        });
      }
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};