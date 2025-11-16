// yellow-diamond-learn-dev/src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Modules from "./pages/modules/Modules";
import ModuleDetail from "./pages/modules/ModuleDetail";
import LessonDetail from "./pages/modules/LessonDetail";
import Quiz from "./pages/modules/Quiz";
import Onboarding from "./pages/Onboarding"; // Import the new Onboarding page
import Announcements from "./pages/Announcements";
import AnnouncementDetail from "./pages/modules/AnnouncementDetail";
import CertificatesPage from "./pages/Certificates";
import Progress from "./pages/Progress";
import Admin from "./pages/Admin";
import UserListPage from "./pages/UserListPage";
import NotFound from "./pages/NotFound";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { AuthProvider } from "./contexts/AuthContext";
import { ProgressProvider } from "./contexts/ProgressContext"
import { LanguageProvider, useLanguage, Language } from "./contexts/LanguageContext"; // Import useLanguage and Language
import ProtectedRoute from "./components/ProtectedRoute";
import ProgressReport from "./pages/admin/ProgressReport";
import ProgressDetail from "./pages/admin/ProgressDetail";
import RegionAdminsPage from "./pages/admin/RegionAdminsPage"; // Import the new wrapper page
import { useEffect } from "react";
import { useProfile } from "./hooks/useProfile"; // Import useProfile


// Create a single, stable QueryClient instance outside the component
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false, // Disable refetch on window focus
      retry: 1,
    },
  },
});

const AppContent = () => {
  const { profile, isLoading: isProfileLoading } = useProfile();
  const { currentLanguage, setLanguage } = useLanguage();

  // Effect to set the global language once the profile is loaded
  useEffect(() => {
    if (!isProfileLoading && profile && profile.language && profile.language !== currentLanguage) {
      setLanguage(profile.language as Language);
    }
  }, [profile, isProfileLoading, currentLanguage, setLanguage]);


  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<AuthPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Onboarding route - accessible only if psl_id is empty */}
      <Route path="/onboarding" element={
        <ProtectedRoute requirePslIdEmpty={true}>
          <Onboarding />
        </ProtectedRoute>
      } />

      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />

      {/* Module routes */}
      <Route path="/modules" element={
        <ProtectedRoute>
          <Modules />
        </ProtectedRoute>
      } />
      <Route path="/modules/:moduleId" element={
        <ProtectedRoute>
          <ModuleDetail />
        </ProtectedRoute>
      } />
      <Route path="/modules/:moduleId/lessons/:lessonId" element={
        <ProtectedRoute>
          <LessonDetail />
        </ProtectedRoute>
      } />
      <Route path="/modules/:moduleId/lessons/:lessonId/quiz" element={
        <ProtectedRoute>
          <Quiz />
        </ProtectedRoute>
      } />

      {/* Other routes */}
      <Route path="/announcements" element={
        <ProtectedRoute>
          <Announcements />
        </ProtectedRoute>
      } />
      <Route path="/announcements/:announcementId" element={
        <ProtectedRoute>
          <AnnouncementDetail />
        </ProtectedRoute> 
      } />
        <Route path="/certificates" element={
        <ProtectedRoute>
          <CertificatesPage />
        </ProtectedRoute>
      } />
      <Route path="/progress" element={
        <ProtectedRoute>
          <Progress />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute requiredRole={['admin']}>
          <Admin />
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute requiredRole={['admin', 'region admin']}> {/* Updated: Allow region admins */}
          <UserListPage />
        </ProtectedRoute>
      } />
      <Route path="/progress-report" element={
        <ProtectedRoute requiredRole={['admin', 'region admin']}>
          <ProgressReport />
        </ProtectedRoute>
      } />
      <Route path="/admin/progress-report/:userId" element={
        <ProtectedRoute requiredRole="admin">
          <ProgressDetail />
        </ProtectedRoute>
      } />
      {/* New route for RegionAdminManager, using the wrapper page */}
      <Route path="/admin/region-admins" element={
        <ProtectedRoute requiredRole="admin">
          <RegionAdminsPage />
        </ProtectedRoute>
      } />

      {/* Not found route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* LanguageProvider must wrap AuthProvider if AuthProvider consumes LanguageContext */}
        <LanguageProvider>
          <AuthProvider>
            <ProgressProvider>
              <AppContent /> {/* Render AppContent here */}
            </ProgressProvider>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;