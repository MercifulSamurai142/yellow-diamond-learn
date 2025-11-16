// yellow-diamond-learn-dev/src/components/admin/UserManager.tsx
import { useState, useMemo } from "react";
import { YDCard } from "@/components/ui/YDCard";
import YDButton from "@/components/ui/YDButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Save, User, Search, X, UserX, Loader2, UserCheck } from "lucide-react";
import { UserProfile, StagedUser, RevokedUser } from "@/pages/UserListPage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProfile } from "@/hooks/useProfile"; // Import useProfile

interface UserManagerProps {
  users: UserProfile[];
  stagedUsers: StagedUser[];
  revokedUsers: RevokedUser[];
  onUsersUpdate: (users: UserProfile[]) => void;
  refreshData: () => Promise<void>;
}

const REGION_OPTIONS = ["North", "South", "East", "West", "Central"];

const UserManager = ({ users, stagedUsers, revokedUsers, onUsersUpdate, refreshData }: UserManagerProps) => {
  const { profile } = useProfile(); // Get current user's profile for role check
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [revokingUser, setRevokingUser] = useState<UserProfile | null>(null);
  const [unrevokingUser, setUnrevokingUser] = useState<UserProfile | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isUnrevoking, setIsUnrevoking] = useState(false);
  const [editUserData, setEditUserData] = useState({
    name: '',
    email: '',
    role: 'learner',
    designation: '',
    region: '',
    state: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'onboarded' | 'not onboarded' | 'revoked'>('all');
  
  const revokedEmailsSet = useMemo(() => new Set(revokedUsers.map(u => u.email)), [revokedUsers]);

  const combinedAndFilteredUsers = useMemo(() => {
    let combined: any[] = [];

    // Create a temporary map to track unique entities by a generated key
    const uniqueEntities = new Map<string, any>();

    // Process onboarded users
    users.forEach(u => {
        const key = `onboarded-${u.id}`; 
        uniqueEntities.set(key, { 
          ...u, 
          status: 'onboarded' as const,
          isRevoked: u.email ? revokedEmailsSet.has(u.email) : false,
          __key: key // Add a specific key for React rendering
        });
    });

    // Process not-onboarded (staged) users
    stagedUsers.forEach(su => {
        if (su.email) {
            const key = `staged-${su.email}`;
            // Only add if not already an onboarded user (email is the linking factor)
            if (!users.some(u => u.email === su.email)) {
                uniqueEntities.set(key, {
                    ...su,
                    id: su.email, // Use email as id for consistency in rendering, but prefix key
                    status: 'not onboarded' as const,
                    isRevoked: su.email ? revokedEmailsSet.has(su.email) : false,
                    role: su.role || 'learner',
                    profile_picture: null, // Staged users don't have profile pictures
                    __key: key
                });
            }
        }
    });

    // Process revoked users (these should override or be distinct)
    revokedUsers.forEach(ru => {
        if (ru.email) {
            const key = `revoked-${ru.email}`;
            // If a user is revoked, their entry in the revoked list takes precedence for display status
            uniqueEntities.set(key, {
                ...ru,
                id: ru.email, // Use email as id for consistency in rendering, but prefix key
                status: 'revoked' as const,
                isRevoked: true, // Explicitly marked as revoked
                profile_picture: null,
                __key: key
            });
        }
    });

    // Convert map values to an array for filtering
    combined = Array.from(uniqueEntities.values());


    if (filter === 'revoked') {
        combined = combined.filter(u => u.status === 'revoked');
    } else {
        // Filter out explicitly revoked users from 'onboarded' and 'not onboarded' views
        combined = combined.filter(u => u.status !== 'revoked');
        if (filter === 'onboarded') {
            combined = combined.filter(u => u.status === 'onboarded');
        } else if (filter === 'not onboarded') {
            combined = combined.filter(u => u.status === 'not onboarded');
        }
    }


    if (!searchTerm) return combined;

    const lowerSearch = searchTerm.toLowerCase();
    return combined.filter(u => 
        (u.name && u.name.toLowerCase().includes(lowerSearch)) ||
        (u.email && u.email.toLowerCase().includes(lowerSearch)) ||
        (u.role && u.role.toLowerCase().includes(lowerSearch)) ||
        (u.designation && u.designation.toLowerCase().includes(lowerSearch))
    );
  }, [users, stagedUsers, revokedUsers, filter, searchTerm, revokedEmailsSet]);

  const handleEditUser = (userId: string) => {
    // Only admins can initiate an edit
    if (profile?.role !== 'admin') {
      toast({ title: "Permission Denied", description: "Only administrators can edit user profiles.", variant: "destructive" });
      return;
    }
    const userToEdit = users.find(u => u.id === userId);
    if (!userToEdit) return;

    setEditingUserId(userId);
    setEditUserData({
      name: userToEdit.name || '',
      email: userToEdit.email || '',
      role: userToEdit.role,
      designation: userToEdit.designation || '',
      region: userToEdit.region || '',
      state: userToEdit.state || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
  };

  const handleSaveUser = async (userId: string) => {
    // Only admins can save user changes
    if (profile?.role !== 'admin') {
      toast({ title: "Permission Denied", description: "Only administrators can save user changes.", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: editUserData.name,
          email: editUserData.email,
          role: editUserData.role,
          designation: editUserData.designation,
          region: editUserData.region,
          state: editUserData.state,
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setEditingUserId(null);
      await refreshData();
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user",
      });
    }
  };
  
  const handleRevokeUser = async () => {
    // Only admins can revoke users
    if (profile?.role !== 'admin') {
      toast({ title: "Permission Denied", description: "Only administrators can revoke users.", variant: "destructive" });
      setRevokingUser(null);
      return;
    }
    if (!revokingUser) return;
    setIsRevoking(true);
    try {
        const { error } = await supabase.from('revoked_users').insert({
            email: revokingUser.email,
            name: revokingUser.name,
            psl_id: revokingUser.psl_id || 'NOT_AVAILABLE', // Fallback for non-nullable column
            designation: revokingUser.designation,
            region: revokingUser.region,
            state: revokingUser.state,
            role: revokingUser.role,
            timestamp: new Date().toISOString()
        });
        if (error) throw error;
        toast({
            title: "User Revoked",
            description: `${revokingUser.name || revokingUser.email} has been scheduled for deletion.`,
        });
        await refreshData();
    } catch (error: any) {
        console.error("Error revoking user:", error);
        toast({
            variant: "destructive",
            title: "Revocation Failed",
            description: `Failed to revoke user: ${error.message}`
        });
    } finally {
        setIsRevoking(false);
        setRevokingUser(null);
    }
  };
  
  const handleUnrevokeUser = async () => {
    // Only admins can unrevoke users
    if (profile?.role !== 'admin') {
      toast({ title: "Permission Denied", description: "Only administrators can unrevoke users.", variant: "destructive" });
      setUnrevokingUser(null);
      return;
    }
    if (!unrevokingUser) return;
    setIsUnrevoking(true);
    try {
      const { error } = await supabase
        .from('revoked_users')
        .delete()
        .eq('email', unrevokingUser.email);
        
      if (error) throw error;
      
      toast({
        title: "User Reinstated",
        description: `${unrevokingUser.name || unrevokingUser.email} has been removed from the revocation list.`,
      });
      
      await refreshData();
    } catch (error: any) {
      console.error("Error un-revoking user:", error);
      toast({
          variant: "destructive",
          title: "Action Failed",
          description: `Failed to reinstate user: ${error.message}`
      });
    } finally {
      setIsUnrevoking(false);
      setUnrevokingUser(null);
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-medium">Users</h3>
          <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
              <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="onboarded">Onboarded</SelectItem>
                  <SelectItem value="not onboarded">Not Onboarded</SelectItem>
                  <SelectItem value="revoked">Revoked Users</SelectItem>
              </SelectContent>
          </Select>
        </div>
        <div className="relative w-64">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>

      <div className="space-y-4">
        {combinedAndFilteredUsers.length === 0 ? (
          <YDCard>
            <div className="p-6 text-center">
              <p className="text-muted-foreground">No users found matching your search criteria.</p>
            </div>
          </YDCard>
        ) : (
          combinedAndFilteredUsers.map((user) => (
            <YDCard key={user.__key} className="p-4"> {/* Use __key for React's key prop */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 w-full">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    {user.profile_picture ? (
                      <img
                        src={user.profile_picture}
                        alt={user.name || 'User'}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    {editingUserId === user.id && user.status === 'onboarded' ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <Input value={editUserData.name} onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })} placeholder="User name" />
                          <Input value={editUserData.email} type="email" onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })} placeholder="User email" />
                          <Input value={editUserData.designation} onChange={(e) => setEditUserData({ ...editUserData, designation: e.target.value })} placeholder="Designation" />
                          <Select value={editUserData.role} onValueChange={(value) => setEditUserData({ ...editUserData, role: value })}>
                            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="learner">Learner</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="region admin">Region Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input value={editUserData.state} onChange={(e) => setEditUserData({ ...editUserData, state: e.target.value })} placeholder="State" />
                          <Select value={editUserData.region} onValueChange={(value) => setEditUserData({ ...editUserData, region: value })}>
                            <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                            <SelectContent>
                              {REGION_OPTIONS.map(region => (<SelectItem key={region} value={region}>{region}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                          <YDButton variant="default" size="sm" onClick={() => handleSaveUser(user.id)}><Save size={16} className="mr-1" /> Save</YDButton>
                          <YDButton variant="outline" size="sm" onClick={handleCancelEdit}><X size={16} className="mr-1" /> Cancel</YDButton>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 className="font-medium">{user.name || 'Unnamed User'}</h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full capitalize ${ user.role === 'admin' ? 'bg-primary/20 text-primary' : user.role === 'region admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100'}`}>
                              {user.role}
                            </span>
                             <span className={`capitalize text-xs px-2 py-1 rounded-full ${user.status === 'revoked' ? 'bg-red-100 text-red-800' : user.isRevoked ? 'bg-red-100 text-red-800' : user.status === 'onboarded' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800' }`}>
                                {user.status === 'revoked' ? 'Revoked' : user.isRevoked ? 'Revoked' : user.status}
                            </span>
                           {user.designation && <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">{user.designation}</span>}
                           {user.state && <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">{user.state}</span>}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {editingUserId !== user.id && isAdmin && ( // Only admins see edit/revoke/unrevoke buttons
                    <>
                      {user.status === 'onboarded' && !user.isRevoked && (
                          <>
                              <YDButton variant="outline" size="sm" onClick={() => handleEditUser(user.id)}>
                                  <Pencil size={16} className="mr-1" /> Edit
                              </YDButton>
                              <YDButton variant="destructive" size="sm" onClick={() => setRevokingUser(user as UserProfile)}>
                                  <UserX size={16} className="mr-1" /> Revoke
                              </YDButton>
                          </>
                      )}
                      {((user.status === 'onboarded' && user.isRevoked) || user.status === 'revoked') && (
                          <YDButton variant="secondary" size="sm" onClick={() => setUnrevokingUser(user as UserProfile)}>
                              <UserCheck size={16} className="mr-1" /> Unrevoke
                          </YDButton>
                      )}
                    </>
                  )}
                </div>
              </div>
            </YDCard>
          ))
        )}
      </div>

      <AlertDialog open={!!revokingUser} onOpenChange={(open) => !open && setRevokingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to revoke this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will add <span className="font-semibold">{revokingUser?.name || revokingUser?.email}</span> to the revocation list. Their access will be removed by a scheduled process. This action can be reversed by an administrator before the process runs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <YDButton
              variant="destructive"
              onClick={handleRevokeUser}
              disabled={isRevoking}
            >
              {isRevoking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Revoke User
            </YDButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!unrevokingUser} onOpenChange={(open) => !open && setUnrevokingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to reinstate this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <span className="font-semibold">{unrevokingUser?.name || unrevokingUser?.email}</span> from the revocation list, cancelling their scheduled deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnrevoking}>Cancel</AlertDialogCancel>
            <YDButton
              variant="secondary"
              onClick={handleUnrevokeUser}
              disabled={isUnrevoking}
            >
              {isUnrevoking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Reinstate User
            </YDButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManager;