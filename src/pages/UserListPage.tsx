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
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleDownloadReport = () => {
    if (users.length === 0 && stagedUsers.length === 0 && revokedUsers.length === 0) {
      toast({ title: "No Data", description: "There is no user data to download.", variant: "destructive" });
      return;
    }

    setIsDownloading(true);

    try {
      const revokedEmailsSet = new Set(revokedUsers.map(u => u.email));
      const combinedData: any[] = [];

      users.forEach(u => {
        combinedData.push({
          "Status": revokedEmailsSet.has(u.email) ? "Revoked" : "Onboarded",
          "Name": u.name || '',
          "Email": u.email,
          "PSL ID": u.psl_id || '',
          "Role": u.role || '',
          "Designation": u.designation || '',
          "Region": u.region || '',
          "State": u.state || '',
          "Joined At": u.created_at ? new Date(u.created_at).toLocaleDateString() : '',
          "Last Updated At": u.updated_at ? new Date(u.updated_at).toLocaleDateString() : '',
        });
      });

      stagedUsers.forEach(su => {
        if (!users.some(u => u.email === su.email) && !revokedEmailsSet.has(su.email)) {
          combinedData.push({
            "Status": "Not Onboarded",
            "Name": su.name || '',
            "Email": su.email,
            "PSL ID": su.psl_id || '',
            "Role": su.role || '',
            "Designation": su.designation || '',
            "Region": su.region || '',
            "State": su.state || '',
            "Joined At": '',
            "Last Updated At": '',
          });
        }
      });

      revokedUsers.forEach(ru => {
        combinedData.push({
          "Status": "Revoked",
          "Name": ru.name || '',
          "Email": ru.email,
          "PSL ID": ru.psl_id || '',
          "Role": ru.role || '',
          "Designation": ru.designation || '',
          "Region": ru.region || '',
          "State": ru.state || '',
          "Joined At": '',
          "Last Updated At": ru.timestamp ? new Date(ru.timestamp).toLocaleDateString() : '',
        });
      });

      const worksheet = XLSX.utils.json_to_sheet(combinedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'User Data');

      worksheet['!cols'] = [
        { wch: 15 }, // Status
        { wch: 25 }, // Name
        { wch: 30 }, // Email
        { wch: 15 }, // PSL ID
        { wch: 15 }, // Role
        { wch: 20 }, // Designation
        { wch: 15 }, // Region
        { wch: 15 }, // State
        { wch: 18 }, // Joined At
        { wch: 20 }, // Last Updated At
      ];

      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear().toString().slice(-2);
      const formattedDate = `${day}_${month}_${year}`;
      
      XLSX.writeFile(workbook, `User_Data_Report_${formattedDate}.xlsx`);

      toast({ title: "Success", description: "User data downloaded successfully." });

    } catch (error) {
      toast({ title: "Download Failed", description: "Could not generate the report.", variant: "destructive" });
      console.error("Excel generation error:", error);
    } finally {
      setIsDownloading(false);
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
              <div className="flex gap-2">
                <YDButton onClick={loadData} disabled={isLoading || isDownloading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                  {isLoading ? "Loading..." : "Refresh Data"}
                </YDButton>
                <YDButton onClick={handleDownloadReport} disabled={isDownloading || isLoading}>
                  {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>}
                  {isDownloading ? "Downloading..." : "Download Report"}
                </YDButton>
              </div>
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