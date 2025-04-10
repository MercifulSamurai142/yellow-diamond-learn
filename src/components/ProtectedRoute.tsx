
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole?: string;
};

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const location = useLocation();
  
  const isLoading = authLoading || profileLoading;

  useEffect(() => {
    if (requiredRole && profile && profile.role !== requiredRole) {
      console.log(`User does not have required role: ${requiredRole}`);
    }
  }, [user, profile, requiredRole]);

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
  if (requiredRole && profile && profile.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
