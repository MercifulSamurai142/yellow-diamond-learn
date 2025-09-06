import { useState } from "react";
import { YDCard } from "@/components/ui/YDCard";
import YDButton from "@/components/ui/YDButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Save, User, Search } from "lucide-react";
import { UserProfile } from "@/pages/Admin";

interface UserManagerProps {
  users: UserProfile[];
  onUsersUpdate: (users: UserProfile[]) => void;
  refreshData: () => Promise<void>;
}

const UserManager = ({ users, onUsersUpdate, refreshData }: UserManagerProps) => {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserData, setEditUserData] = useState<{name: string, role: string, designation: string}>({
    name: '',
    role: 'learner',
    designation: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  const handleEditUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    setEditingUserId(userId);
    setEditUserData({
      name: user.name || '',
      role: user.role,
      designation: user.designation || ''
    });
  };

  const handleSaveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: editUserData.name,
          role: editUserData.role,
          designation: editUserData.designation
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
            name: editUserData.name,
            role: editUserData.role,
            designation: editUserData.designation
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

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower) ||
      user.designation?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium">Users</h3>
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
        {filteredUsers.length === 0 ? (
          <YDCard>
            <div className="p-6 text-center">
              <p className="text-muted-foreground">No users found matching your search criteria.</p>
            </div>
          </YDCard>
        ) : (
          filteredUsers.map((user) => (
            <YDCard key={user.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
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
                  
                  <div>
                    {editingUserId === user.id ? (
                      <div className="flex items-center gap-4">
                        <Input
                          value={editUserData.name}
                          onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                          placeholder="User name"
                          className="w-48"
                        />
                        <Input
                          value={editUserData.designation}
                          onChange={(e) => setEditUserData({ ...editUserData, designation: e.target.value })}
                          placeholder="Designation"
                          className="w-48"
                        />
                        <Select
                          value={editUserData.role}
                          onValueChange={(value) => setEditUserData({ ...editUserData, role: value })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="learner">Learner</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <>
                        <h4 className="font-medium">{user.name || 'Unnamed User'}</h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              user.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-gray-100'
                            }`}>
                              {user.role}
                            </span>
                           {user.designation && <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">{user.designation}</span>}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  {editingUserId === user.id ? (
                    <YDButton
                      variant="default"
                      size="sm"
                      onClick={() => handleSaveUser(user.id)}
                    >
                      <Save size={16} className="mr-1" /> Save
                    </YDButton>
                  ) : (
                    <YDButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user.id)}
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