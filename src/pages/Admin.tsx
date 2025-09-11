import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import YDButton from "@/components/ui/YDButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ModuleManager from "@/components/admin/ModuleManager";
import LessonManager from "@/components/admin/LessonManager";
import QuizManager from "@/components/admin/QuizManager";
import UserManager from "@/components/admin/UserManager";
import AnnouncementManager from "@/components/admin/AnnouncementManager";
import { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";

export type Module = Tables<"modules">;
export type Lesson = Tables<"lessons">;
export type Quiz = Tables<"quizzes">;
export type Question = Tables<"questions">;
export type Answer = Tables<"answers">;
export type Announcement = Tables<"announcements">;
export type UserProfile = Tables<"users">;
export type StagedUser = Tables<"user_import_staging">;
export type ModuleDesignation = Tables<"module_designation">;
export type ModuleRegion = Tables<"module_region">;


const Admin = () => {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("modules");
  const [isLoading, setIsLoading] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stagedUsers, setStagedUsers] = useState<StagedUser[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [moduleDesignations, setModuleDesignations] = useState<ModuleDesignation[]>([]);
  const [moduleRegions, setModuleRegions] = useState<ModuleRegion[]>([]);

  useEffect(() => {
    console.log('Current Auth User Object:', authUser);
    loadData();
  }, [authUser]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: modulesData, error: modulesError } = await supabase.from("modules").select("*").order("order");
      if (modulesError) throw modulesError;
      setModules(modulesData || []);

      const { data: lessonsData, error: lessonsError } = await supabase.from("lessons").select("*").order("module_id, order");
      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);

      const { data: quizzesData, error: quizzesError } = await supabase.from("quizzes").select("*");
      if (quizzesError) throw quizzesError;
      setQuizzes(quizzesData || []);

      const { data: usersData, error: usersError } = await supabase.from("users").select("*");
      if (usersError) throw usersError;
      setUsers(usersData || []);

      const { data: stagedUsersData, error: stagedUsersError } = await supabase.from("user_import_staging").select("*");
      if (stagedUsersError) throw stagedUsersError;
      setStagedUsers(stagedUsersData || []);
      
      const { data: announcementsData, error: announcementsError } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
      if (announcementsError) throw announcementsError;
      setAnnouncements(announcementsData || []);

      const { data: designationsData, error: designationsError } = await supabase.from("module_designation").select("*");
      if (designationsError) throw designationsError;
      setModuleDesignations(designationsData || []);
      
      const { data: regionsData, error: regionsError } = await supabase.from("module_region").select("*");
      if (regionsError) throw regionsError;
      setModuleRegions(regionsData || []);

    } catch (error) {
      console.error("Error loading admin data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="yd-container animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="yd-section-title">Admin Dashboard</h2>
                <YDButton onClick={loadData} disabled={isLoading}>
                  {isLoading ? "Loading..." : "Refresh Data"}
                </YDButton>
              </div>
              
              <Tabs defaultValue="modules" onValueChange={setActiveTab}>
                <TabsList className="mb-6 w-full grid grid-cols-5">
                  <TabsTrigger value="modules">Modules</TabsTrigger>
                  <TabsTrigger value="lessons">Lessons</TabsTrigger>
                  <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
                  <TabsTrigger value="users">Users</TabsTrigger>
                  <TabsTrigger value="announcements">Announcements</TabsTrigger>
                </TabsList>
                
                <TabsContent value="modules" className="space-y-4">
                  <ModuleManager 
                    modules={modules} 
                    moduleDesignations={moduleDesignations}
                    moduleRegions={moduleRegions}
                    onModulesUpdate={setModules} 
                    refreshData={loadData} 
                  />
                </TabsContent>
                
                <TabsContent value="lessons" className="space-y-4">
                  <LessonManager 
                    lessons={lessons} 
                    modules={modules} 
                    onLessonsUpdate={setLessons} 
                    refreshData={loadData} 
                  />
                </TabsContent>
                
                <TabsContent value="quizzes" className="space-y-4">
                  <QuizManager 
                    quizzes={quizzes} 
                    lessons={lessons} 
                    onQuizzesUpdate={setQuizzes} 
                    refreshData={loadData} 
                  />
                </TabsContent>
                
                <TabsContent value="users" className="space-y-4">
                  <UserManager 
                    users={users} 
                    stagedUsers={stagedUsers}
                    onUsersUpdate={setUsers} 
                    refreshData={loadData} 
                  />
                </TabsContent>

                <TabsContent value="announcements" className="space-y-4">
                  <AnnouncementManager
                    announcements={announcements}
                    onAnnouncementsUpdate={setAnnouncements}
                    refreshData={loadData}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Admin;