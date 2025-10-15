import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
// REMOVED: import ProtectedRoute from "@/components/ProtectedRoute"; // Protection is handled in App.tsx
import UserManager from "@/components/admin/UserManager";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import YDButton from "@/components/ui/YDButton";
import { Loader2 } from "lucide-react";

export type UserProfile = Tables<"users">;
export type StagedUser = Tables<"user_import_staging">;
export type RevokedUser = Tables<"revoked_users">;

const UserListPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stagedUsers, setStagedUsers] = useState<StagedUser[]>([]);
  const [revokedUsers, setRevokedUsers] = useState<RevokedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("email");
      if (usersError) throw usersError;
      setUsers(usersData || []);

      const { data: stagedUsersData, error: stagedUsersError } = await supabase
        .from("user_import_staging")
        .select("*")
        .order("email");
      if (stagedUsersError) throw stagedUsersError;
      setStagedUsers(stagedUsersData || []);

      const { data: revokedUsersData, error: revokedUsersError } = await supabase
        .from("revoked_users")
        .select("*")
        .order("timestamp", { ascending: false });
      if (revokedUsersError) throw revokedUsersError;
      setRevokedUsers(revokedUsersData || []);

    } catch (error) {
      console.error("Error loading user data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load user data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // REMOVED: ProtectedRoute wrapper here. Protection is handled in App.tsx
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="yd-container animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="yd-section-title">User Management</h2>
              <YDButton onClick={loadData} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                {isLoading ? "Loading..." : "Refresh Data"}
              </YDButton>
            </div>
            
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : (
              <UserManager 
                users={users} 
                stagedUsers={stagedUsers}
                revokedUsers={revokedUsers}
                onUsersUpdate={setUsers} 
                refreshData={loadData} 
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserListPage;