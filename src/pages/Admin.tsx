
import { useState } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { YDCard } from "@/components/ui/YDCard";

const Admin = () => {
  const [activeTab, setActiveTab] = useState<string>("modules");

  // In a real implementation, this would fetch and manage modules, users, etc.

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="yd-container animate-fade-in">
              <h2 className="yd-section-title mb-6">Admin Dashboard</h2>
              
              <div className="mb-6">
                <div className="border-b">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "modules"
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                      }`}
                      onClick={() => setActiveTab("modules")}
                    >
                      Modules
                    </button>
                    <button
                      className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "users"
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                      }`}
                      onClick={() => setActiveTab("users")}
                    >
                      Users
                    </button>
                    <button
                      className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "reports"
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                      }`}
                      onClick={() => setActiveTab("reports")}
                    >
                      Reports
                    </button>
                  </nav>
                </div>
              </div>
              
              {activeTab === "modules" && (
                <YDCard>
                  <div className="p-6">
                    <h3 className="text-lg font-medium mb-4">Modules Management</h3>
                    <p className="text-muted-foreground">
                      This is a placeholder for the modules management interface. Here, admins would be able to create,
                      edit, and delete modules, lessons, quizzes, and other content.
                    </p>
                  </div>
                </YDCard>
              )}
              
              {activeTab === "users" && (
                <YDCard>
                  <div className="p-6">
                    <h3 className="text-lg font-medium mb-4">User Management</h3>
                    <p className="text-muted-foreground">
                      This is a placeholder for the user management interface. Here, admins would be able to view,
                      edit user roles, reset passwords, and manage other user settings.
                    </p>
                  </div>
                </YDCard>
              )}
              
              {activeTab === "reports" && (
                <YDCard>
                  <div className="p-6">
                    <h3 className="text-lg font-medium mb-4">Reports</h3>
                    <p className="text-muted-foreground">
                      This is a placeholder for reports. Here, admins would be able to view various analytics and
                      generate reports on user progress, popular modules, quiz completion rates, etc.
                    </p>
                  </div>
                </YDCard>
              )}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Admin;
