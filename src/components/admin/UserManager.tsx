import { useState, useMemo } from "react";
import { YDCard } from "@/components/ui/YDCard";
import YDButton from "@/components/ui/YDButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Save, User, Search, X } from "lucide-react";
import { UserProfile, StagedUser } from "@/pages/Admin";

interface UserManagerProps {
  users: UserProfile[];
  stagedUsers: StagedUser[];
  onUsersUpdate: (users: UserProfile[]) => void;
  refreshData: () => Promise<void>;
}

const REGION_OPTIONS = ["North", "South", "East", "West", "Central"];

const UserManager = ({ users, stagedUsers, onUsersUpdate, refreshData }: UserManagerProps) => {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserData, setEditUserData] = useState({
    name: '',
    role: 'learner',
    designation: '',
    region: '',
    state: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'onboarded' | 'not onboarded'>('all');

  const combinedAndFilteredUsers = useMemo(() => {
    const onboardedEmails = new Set(users.map(u => u.email));

    const onboarded = users.map(u => ({ ...u, status: 'onboarded' as const }));

    const notOnboarded = stagedUsers
      .filter(su => su.email && !onboardedEmails.has(su.email))
      .map(su => ({
        ...su,
        id: su.email!,
        status: 'not onboarded' as const,
        role: su.role || 'learner',
        profile_picture: null
      }));

    let combined: (typeof onboarded[number] | typeof notOnboarded[number])[] = [];

    if (filter === 'all') {
        combined = [...onboarded, ...notOnboarded];
    } else if (filter === 'onboarded') {
        combined = onboarded;
    } else {
        combined = notOnboarded;
    }

    if (!searchTerm) return combined;

    const lowerSearch = searchTerm.toLowerCase();
    return combined.filter(u => 
        (u.name && u.name.toLowerCase().includes(lowerSearch)) ||
        (u.email && u.email.toLowerCase().includes(lowerSearch)) ||
        (u.role && u.role.toLowerCase().includes(lowerSearch)) ||
        (u.designation && u.designation.toLowerCase().includes(lowerSearch))
    );
  }, [users, stagedUsers, filter, searchTerm]);

  const handleEditUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    setEditingUserId(userId);
    setEditUserData({
      name: user.name || '',
      role: user.role,
      designation: user.designation || '',
      region: user.region || '',
      state: user.state || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
  };

  const handleSaveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: editUserData.name,
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

      // Update local state
      const updatedUsers = users.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            ...editUserData
          };
        }
        return user;
      });
      onUsersUpdate(updatedUsers);

      // Reset edit state
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
            <YDCard key={user.id} className="p-4">
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
                          <Input
                            value={editUserData.name}
                            onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                            placeholder="User name"
                          />
                          <Input
                            value={editUserData.designation}
                            onChange={(e) => setEditUserData({ ...editUserData, designation: e.target.value })}
                            placeholder="Designation"
                          />
                          <Select
                            value={editUserData.role}
                            onValueChange={(value) => setEditUserData({ ...editUserData, role: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="learner">Learner</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="region admin">Region Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            value={editUserData.state}
                            onChange={(e) => setEditUserData({ ...editUserData, state: e.target.value })}
                            placeholder="State"
                          />
                          <Select
                            value={editUserData.region}
                            onValueChange={(value) => setEditUserData({ ...editUserData, region: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select region" />
                            </SelectTrigger>
                            <SelectContent>
                              {REGION_OPTIONS.map(region => (
                                  <SelectItem key={region} value={region}>{region}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 className="font-medium">{user.name || 'Unnamed User'}</h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                              user.role === 'admin' ? 'bg-primary/20 text-primary' 
                              : user.role === 'region admin' ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100'
                            }`}>
                              {user.role}
                            </span>
                            <span className={`capitalize text-xs px-2 py-1 rounded-full ${
                              user.status === 'onboarded' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                                {user.status}
                            </span>
                           {user.designation && <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">{user.designation}</span>}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {editingUserId === user.id && user.status === 'onboarded' ? (
                    <>
                      <YDButton
                        variant="default"
                        size="sm"
                        onClick={() => handleSaveUser(user.id)}
                      >
                        <Save size={16} className="mr-1" /> Save
                      </YDButton>
                      <YDButton
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        <X size={16} className="mr-1" /> Cancel
                      </YDButton>
                    </>
                  ) : (
                    <YDButton
                      variant="outline"
                      size="sm"
                      onClick={() => user.status === 'onboarded' && handleEditUser(user.id)}
                      disabled={user.status !== 'onboarded'}
                    >
                      <Pencil size={16} className="mr-1" /> Edit
                    </YDButton>
                  )}
                </div>
              </div>
            </YDCard>
          ))
        )}
      </div>
    </div>
  );
};

export default UserManager;