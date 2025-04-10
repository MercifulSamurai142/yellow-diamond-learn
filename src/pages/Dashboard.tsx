
import { BookOpen, CheckCircle, Clock, Award, ChevronRight } from "lucide-react";
import { 
  YDCard, 
  YDCardContent, 
  YDCardDescription, 
  YDCardFooter, 
  YDCardHeader, 
  YDCardTitle 
} from "@/components/ui/YDCard";
import YDButton from "@/components/ui/YDButton";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Link } from "react-router-dom";

// Mock data - In a real implementation, we would fetch this from Supabase
const modules = [
  {
    id: "1",
    name: "FMCG Fundamentals",
    description: "Learn the basics of FMCG industry and Yellow Diamond's core products",
    lessons: 8,
    progress: 75,
    status: "in-progress"
  },
  {
    id: "2",
    name: "Sales Techniques",
    description: "Master effective sales strategies for retail success",
    lessons: 12,
    progress: 50,
    status: "in-progress"
  },
  {
    id: "3",
    name: "Product Knowledge",
    description: "Detailed overview of Yellow Diamond's product portfolio",
    lessons: 10,
    progress: 30,
    status: "in-progress"
  },
  {
    id: "4",
    name: "Customer Relationship",
    description: "Building and maintaining successful client relationships",
    lessons: 6,
    progress: 0,
    status: "not-started"
  }
];

// Mock achievements
const achievements = [
  {
    id: "1",
    name: "Fast Learner",
    description: "Complete 5 lessons in a day",
    icon: Clock,
    unlocked: true
  },
  {
    id: "2",
    name: "Quiz Master",
    description: "Score 100% on 3 quizzes",
    icon: CheckCircle,
    unlocked: false
  },
  {
    id: "3",
    name: "Module Champion",
    description: "Complete all modules",
    icon: Award,
    unlocked: false
  }
];

const Dashboard = () => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="yd-container animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                <h2 className="yd-section-title">Dashboard</h2>
                <p className="text-muted-foreground">Welcome back, John Doe!</p>
              </div>
              <div className="mt-4 md:mt-0">
                <YDButton variant="default">Resume Learning</YDButton>
              </div>
            </div>
            
            {/* Progress summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <YDCard>
                <div className="flex items-center">
                  <div className="p-3 bg-primary/10 rounded-lg mr-4">
                    <BookOpen size={24} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Course Progress</p>
                    <p className="text-2xl font-semibold">40%</p>
                  </div>
                </div>
              </YDCard>
              
              <YDCard>
                <div className="flex items-center">
                  <div className="p-3 bg-yd-success/10 rounded-lg mr-4">
                    <CheckCircle size={24} className="text-yd-success" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Modules Completed</p>
                    <p className="text-2xl font-semibold">0/4</p>
                  </div>
                </div>
              </YDCard>
              
              <YDCard>
                <div className="flex items-center">
                  <div className="p-3 bg-yd-warning/10 rounded-lg mr-4">
                    <Award size={24} className="text-yd-warning" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Achievements</p>
                    <p className="text-2xl font-semibold">1/10</p>
                  </div>
                </div>
              </YDCard>
            </div>
            
            {/* Modules */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-medium text-yd-navy">Your Modules</h3>
                <Link to="/modules" className="text-sm text-primary flex items-center hover:underline">
                  View all modules <ChevronRight size={16} />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.map((module) => (
                  <YDCard key={module.id} className="hover:border-primary transition-colors">
                    <YDCardHeader>
                      <YDCardTitle>{module.name}</YDCardTitle>
                      <YDCardDescription>{module.description}</YDCardDescription>
                    </YDCardHeader>
                    <YDCardContent>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">{module.progress}% Complete</span>
                        <span className="text-sm text-muted-foreground">{module.lessons} lessons</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mt-1">
                        <div 
                          className="bg-primary rounded-full h-2" 
                          style={{ width: `${module.progress}%` }}
                        ></div>
                      </div>
                    </YDCardContent>
                    <YDCardFooter>
                      <Link to={`/modules/${module.id}`}>
                        <YDButton variant="default">
                          {module.progress > 0 ? "Continue" : "Start"} Module
                        </YDButton>
                      </Link>
                    </YDCardFooter>
                  </YDCard>
                ))}
              </div>
            </div>
            
            {/* Recent Achievements */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-medium text-yd-navy">Recent Achievements</h3>
                <Link to="/achievements" className="text-sm text-primary flex items-center hover:underline">
                  View all achievements <ChevronRight size={16} />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <YDCard 
                    key={achievement.id} 
                    className={`${!achievement.unlocked && "opacity-60 grayscale"}`}
                  >
                    <div className="flex items-center">
                      <div className={`p-3 ${achievement.unlocked ? "bg-primary/10" : "bg-muted"} rounded-lg mr-4`}>
                        <achievement.icon 
                          size={24} 
                          className={achievement.unlocked ? "text-primary" : "text-muted-foreground"} 
                        />
                      </div>
                      <div>
                        <h4 className="font-medium">{achievement.name}</h4>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                  </YDCard>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
