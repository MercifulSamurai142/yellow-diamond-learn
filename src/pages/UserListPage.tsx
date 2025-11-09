import { useState, useEffect, useMemo } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import UserManager from "@/components/admin/UserManager";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import YDButton from "@/components/ui/YDButton";
import { Loader2, Download } from "lucide-react"; // Import Download icon
import * as XLSX from 'xlsx'; // Import XLSX library

export type UserProfile = Tables<"users">;
export type StagedUser = Tables<"user_import_staging">;
export type RevokedUser = Tables<"revoked_users">;

const REGION_OPTIONS = ["North", "South", "East", "West", "Central"]; // Re-define or import if needed for download logic

const UserListPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stagedUsers, setStagedUsers] = useState<StagedUser[]>([]);
  const [revokedUsers, setRevokedUsers] = useState<RevokedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false); // New state for download button

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

  const handleDownloadReport = () => {
    if (users.length === 0 && stagedUsers.length === 0 && revokedUsers.length === 0) {
      toast({ title: "No Data", description: "There is no user data to download.", variant: "destructive" });
      return;
    }

    setIsDownloading(true);

    try {
      const revokedEmailsSet = new Set(revokedUsers.map(u => u.email));
      const combinedData: any[] = [];

      // Add onboarded users
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

      // Add staged users not yet onboarded or revoked
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
            "Joined At": '', // Staged users don't have a joined date in `users` table
            "Last Updated At": '',
          });
        }
      });

      // Add explicitly revoked users (these should override other statuses for reporting revoked status)
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
          "Joined At": '', // Revoked users from staging might not have a joined date
          "Last Updated At": ru.timestamp ? new Date(ru.timestamp).toLocaleDateString() : '', // Use revocation timestamp
        });
      });

      const worksheet = XLSX.utils.json_to_sheet(combinedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'User Data');

      // Set column widths for better readability
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
              <div className="flex gap-2"> {/* Added a div to group buttons */}
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