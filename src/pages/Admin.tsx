
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { YDCard } from "@/components/ui/YDCard";
import YDButton from "@/components/ui/YDButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ModuleManager from "@/components/admin/ModuleManager";
import LessonManager from "@/components/admin/LessonManager";
import QuizManager from "@/components/admin/QuizManager";
import UserManager from "@/components/admin/UserManager";
import AchievementManager from "@/components/admin/AchievementManager";
import { Tables } from "@/integrations/supabase/types";

export type Module = Tables<"modules">;
export type Lesson = Tables<"lessons">;
export type Quiz = Tables<"quizzes">;
export type Question = Tables<"questions">;
export type Answer = Tables<"answers">;
export type Achievement = Tables<"achievements">;
export type UserProfile = Tables<"users">;

const Admin = () => {
  const [activeTab, setActiveTab] = useState<string>("modules");
  const [isLoading, setIsLoading] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetch modules
      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select("*")
        .order("order");
      
      if (modulesError) throw modulesError;
      setModules(modulesData || []);

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select("*")
        .order("module_id, order");
      
      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);

      // Fetch quizzes
      const { data: quizzesData, error: quizzesError } = await supabase
        .from("quizzes")
        .select("*");
      
      if (quizzesError) throw quizzesError;
      setQuizzes(quizzesData || []);

      // Fetch achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from("achievements")
        .select("*");
      
      if (achievementsError) throw achievementsError;
      setAchievements(achievementsData || []);

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*");
      
      if (usersError) throw usersError;
      setUsers(usersData || []);
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
                  <TabsTrigger value="achievements">Achievements</TabsTrigger>
                </TabsList>
                
                <TabsContent value="modules" className="space-y-4">
                  <ModuleManager 
                    modules={modules} 
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
                    onUsersUpdate={setUsers} 
                    refreshData={loadData} 
                  />
                </TabsContent>
                
                <TabsContent value="achievements" className="space-y-4">
                  <AchievementManager 
                    achievements={achievements} 
                    onAchievementsUpdate={setAchievements} 
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
