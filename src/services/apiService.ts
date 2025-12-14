// yellow-diamond-learn-dev/src/services/apiService.ts

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Session } from '@supabase/supabase-js'; // Import Session type for clarity

// Define the base URL for your backend API
const BACKEND_API_URL = "YOUR_BACKEND_API_URL"; // <-- Replace with your actual backend API URL

// This hook will provide functions to make authenticated calls to your backend
export const useBackendApiService = () => {
  const { session, isLoading: isAuthLoading } = useAuth();

  // Corrected: getToken is now synchronous and relies on the session from AuthContext
  // For robustness, it checks the local session as well if AuthContext is still loading.
  const getToken = async (): Promise<string | null> => {
    // 1. Check AuthContext's session first (most immediate/up-to-date state)
    if (session?.access_token) {
      return session.access_token;
    }

    // 2. If AuthContext is loading or session is null, try getting the session directly from Supabase
    // This is the correct way to await the asynchronous call.
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  };

  // Example function to call a backend endpoint
  const callBackend = async (endpoint: string, payload?: any, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST') => {
    const token = await getToken(); // <-- Await the getToken call

    if (!token) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "You need to be logged in to perform this action.",
      });
      return null;
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/${endpoint}`, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Pass the JWT as a Bearer token
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });

      if (!response.ok) {
        // Attempt to parse a JSON error response if available
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response body is not JSON, use default message
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error: any) {
      console.error(`Backend API Error (${endpoint}):`, error);
      toast({
        variant: "destructive",
        title: "API Error",
        description: error.message || "An unexpected error occurred.",
      });
      return null;
    }
  };

  return {
    callBackend,
  };
};