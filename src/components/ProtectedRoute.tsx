// yellow-diamond-learn-dev/src/components/ProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole?: string | string[];
  requirePslIdEmpty?: boolean; // New prop
};

const ProtectedRoute = ({ children, requiredRole, requirePslIdEmpty = false }: ProtectedRouteProps) => {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const location = useLocation();
  
  const isLoading = authLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary border-r-2 border-b-2 border-gray-200"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If requirePslIdEmpty is true, redirect to /dashboard if psl_id is NOT empty
  if (requirePslIdEmpty && profile && profile.psl_id) {
    return <Navigate to="/dashboard" replace />;
  }

  // If requirePslIdEmpty is FALSE, AND psl_id IS empty, redirect to /onboarding
  // This ensures that users with empty psl_id cannot access other protected routes directly.
  if (!requirePslIdEmpty && profile && !profile.psl_id && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }


  // If requiredRole is specified, check user's role
  if (requiredRole && profile) {
    const userRole = profile.role;
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(userRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  } else if (requiredRole && !profile) {
    // If a role is required but there's no profile (shouldn't happen here if psl_id check passes), they can't access it.
    // Or if profile is still null after loading (error state or new user before onboarding)
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;