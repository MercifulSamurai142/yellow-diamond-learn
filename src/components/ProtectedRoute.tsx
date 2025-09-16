import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole?: string | string[];
};

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
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

  // If requiredRole is specified, check user's role
  if (requiredRole && profile) {
    const userRole = profile.role;
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(userRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  } else if (requiredRole && !profile) {
    // If a role is required but there's no profile, they can't access it.
    return <Navigate to="/dashboard" replace />;
  }


  return <>{children}</>;
};

export default ProtectedRoute;