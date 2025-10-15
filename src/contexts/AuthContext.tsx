// yellow-diamond-learn-dev/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useLanguage, Language } from '../contexts/LanguageContext'; // Import useLanguage and Language

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
  const { setLanguage } = useLanguage(); // Access setLanguage from LanguageContext

  //console.log("AuthProvider rendered. isLoading:", isLoading, "user:", user?.id);

  // Get initial session only once on mount
  useEffect(() => {
    const getInitialSession = async () => {
      //console.log("AuthContext: getInitialSession started.");
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('AuthContext: Error getting initial session:', error);
          return;
        }
        setSession(data.session);
        setUser(data.session?.user ?? null);
        //console.log("AuthContext: Initial session set. User:", data.session?.user?.id);
      } catch (error) {
        console.error('AuthContext: Unexpected error during getInitialSession:', error);
      } finally {
        setIsLoading(false);
        //console.log("AuthContext: getInitialSession finished. isLoading set to false.");
      }
    };

    getInitialSession();
  }, []); // Empty dependency array - only run once on mount

  // Separate effect for auth state changes
  useEffect(() => {
    //console.log("AuthContext: onAuthStateChange effect registered.");
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        //console.log('AuthContext: onAuthStateChange event:', event, 'session:', session?.user?.id);
        // Only update state for explicit sign-in/sign-out events
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          setSession(session);
          setUser(session?.user ?? null);
          //console.log("AuthContext: User/Session state updated by onAuthStateChange. New user:", session?.user?.id);

          if (event === 'SIGNED_IN' && session) {
            // REMOVED: Fetching profile language here. This will now be handled in App.tsx
            // once the profile is loaded via useProfile.

            if (location.pathname === '/reset-password') {
                //console.log("AuthContext: On reset-password page, skipping dashboard navigate.");
                return;
            }
            if (location.pathname === '/login' || location.pathname === '/' || location.pathname === '/onboarding') { // Added /onboarding here
              // After sign-in, if user is on login/root/onboarding, check if their profile is complete
              // This check will be done by ProtectedRoute, which will redirect to /onboarding if psl_id is empty.
              // If psl_id is NOT empty, ProtectedRoute will let them pass to /dashboard.
              navigate('/dashboard', { replace: true });
            }
            toast({
              title: 'Welcome!',
              description: 'You have successfully signed in.',
            });
          }

          if (event === 'SIGNED_OUT') {
            //console.log("AuthContext: SIGNED_OUT event. Resetting language to english and navigating to /login.");
            setLanguage('english'); // Reset language to English on sign out
            if (location.pathname !== '/login' && location.pathname !== '/') {
              navigate('/login', { replace: true });
            }
            toast({
              title: 'Goodbye!',
              description: 'You have signed out.',
            });
          }
        }
      }
    );

    return () => {
      //console.log("AuthContext: onAuthStateChange listener unsubscribed.");
      authListener.subscription.unsubscribe();
    };
  }, [navigate, location.pathname, setLanguage]);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    //console.log("AuthContext: signIn called for", email);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('AuthContext: signIn failed:', error);
        toast({
          variant: 'destructive',
          title: 'Sign in failed',
          description: error.message,
        });
        throw error;
      }
      //console.log("AuthContext: signIn successful.");
    } catch (error) {
      throw error;
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    //console.log("AuthContext: signUp called for", email);
    try {
      // 1. Check if email exists in the staging table for authorization
      const { data: stagedUser, error: stageError } = await supabase
        .from('user_import_staging')
        .select('*')
        .eq('email', email)
        .single();

      if (stageError && stageError.code !== 'PGRST116') { // PGRST116 means no rows are found.
        console.error('AuthContext: stageError during signUp:', stageError);
        throw stageError;
      }

      if (!stagedUser) {
        //console.log("AuthContext: User not found in staging for signUp:", email);
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
          console.error('AuthContext: existingUserError during signUp:', existingUserError);
          throw existingUserError;
      }

      if (existingUser) {
          //console.log("AuthContext: Account already exists for signUp:", email);
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
          emailRedirectTo: `${window.location.origin}/onboarding`, // Redirect to onboarding
          data: {
            name: stagedUser.name || 'New User',
            language: 'english', // Default language on signup
          },
        },
      });

      if (signUpError) {
        console.error('AuthContext: signUp failed:', signUpError);
        toast({
          variant: 'destructive',
          title: 'Sign up failed',
          description: signUpError.message,
        });
        throw signUpError;
      } else {
        //console.log("AuthContext: signUp successful, verification email sent.");
        toast({
          title: 'Account created',
          description: 'Please check your email for verification instructions.',
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("AuthContext: signUp process failed:", error.message);
      }
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    //console.log("AuthContext: signOut called.");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthContext: signOut failed:', error);
        toast({
          variant: 'destructive',
          title: 'Sign out failed',
          description: error.message,
        });
        throw error;
      }
      //console.log("AuthContext: signOut successful.");
    } catch (error) {
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    //console.log("AuthContext: resetPassword called for", email);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('AuthContext: resetPassword failed:', error);
        toast({
          variant: 'destructive',
          title: 'Password reset failed',
          description: error.message,
        });
        throw error;
      } else {
        //console.log("AuthContext: Password reset email sent for", email);
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