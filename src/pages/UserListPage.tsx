// yellow-diamond-learn-dev/src/pages/UserListPage.tsx
import { useState, useEffect, useMemo } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import UserManager from "@/components/admin/UserManager";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import YDButton from "@/components/ui/YDButton";
import { Loader2, Download } from "lucide-react";
import * as XLSX from 'xlsx';
import { useProfile } from "@/hooks/useProfile"; // Import useProfile

export type UserProfile = Tables<"users">;
export type StagedUser = Tables<"user_import_staging">;
export type RevokedUser = Tables<"revoked_users">;

const UserListPage = () => {
  const { profile, isLoading: isProfileLoading } = useProfile(); // Get current user's profile
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stagedUsers, setStagedUsers] = useState<StagedUser[]>([]);
  const [revokedUsers, setRevokedUsers] = useState<RevokedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Removed [isDownloading, setIsDownloading] state and handleDownloadReport logic from here

  useEffect(() => {
    if (isProfileLoading) {
        return; // Wait for profile to load
    }
    loadData();
  }, [profile, isProfileLoading]); // Re-run when profile changes

  const loadData = async () => {
    setIsLoading(true);
    try {
      let usersQuery = supabase.from("users").select("*");
      let stagedUsersQuery = supabase.from("user_import_staging").select("*");

      let authorizedStates: string[] = [];
      if (profile?.role === 'region admin' && profile.id) {
          const { data: adminStatesData, error: adminStatesError } = await supabase
              .from('region_admin_state')
              .select('state')
              .eq('id', profile.id);
          if (adminStatesError) throw adminStatesError;
          authorizedStates = adminStatesData.map(row => row.state);
      }

      if (profile?.role === 'region admin' && authorizedStates.length > 0) {
          usersQuery = usersQuery.in('state', authorizedStates);
          stagedUsersQuery = stagedUsersQuery.in('state', authorizedStates);
      } else if (profile?.role === 'region admin' && authorizedStates.length === 0) {
          // If region admin but no states assigned, they see no users.
          setUsers([]);
          setStagedUsers([]);
          setRevokedUsers([]); // Also show no revoked users
          setIsLoading(false);
          return;
      }

      const [{ data: usersData, error: usersError },
        { data: stagedUsersData, error: stagedUsersError },
        { data: revokedUsersData, error: revokedUsersError }
      ] = await Promise.all([
        usersQuery.order("email"),
        stagedUsersQuery.order("email"),
        supabase.from("revoked_users").select("*").order("timestamp", { ascending: false }),
      ]);

      if (usersError) throw usersError;
      setUsers(usersData || []);

      if (stagedUsersError) throw stagedUsersError;
      setStagedUsers(stagedUsersData || []);

      if (revokedUsersError) throw revokedUsersError;
      // Filter revoked users if the current user is a region admin with assigned states
      if (profile?.role === 'region admin' && authorizedStates.length > 0) {
          const filteredRevokedUsers = revokedUsersData!.filter(ru => ru.state && authorizedStates.includes(ru.state));
          setRevokedUsers(filteredRevokedUsers || []);
      } else {
          setRevokedUsers(revokedUsersData || []);
      }

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
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="yd-container animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="yd-section-title">User Management</h2>
              {/* Download and Refresh buttons are now moved into UserManager.tsx for better filtering control */}
              {/* The refreshData function is passed down */}
            </div>
            
            {/* Pass isLoading to UserManager to handle the loading spinner */}
            <UserManager 
              users={users} 
              stagedUsers={stagedUsers}
              revokedUsers={revokedUsers}
              onUsersUpdate={setUsers} 
              refreshData={loadData} 
              isLoadingData={isLoading}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserListPage;