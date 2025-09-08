// yellow-diamond-learn-main/src/App.tsx
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
import Announcements from "./pages/Announcements";
import AnnouncementDetail from "./pages/modules/AnnouncementDetail";
import CertificatesPage from "./pages/Certificates";
import Progress from "./pages/Progress";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import ResetPasswordPage from "./pages/ResetPasswordPage"; // Import the new component
import { AuthProvider } from "./contexts/AuthContext";
import {ProgressProvider} from "./contexts/ProgressContext"
import { LanguageProvider } from "./contexts/LanguageContext";
import ProtectedRoute from "./components/ProtectedRoute";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <ProgressProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<AuthPage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} /> {/* New route for password reset */}

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
                  <ProtectedRoute requiredRole="admin">
                    <Admin />
                  </ProtectedRoute>
                } />

                {/* Not found route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ProgressProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;