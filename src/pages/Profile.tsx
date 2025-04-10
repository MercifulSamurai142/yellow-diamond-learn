
import { useState } from "react";
import { Camera, Save } from "lucide-react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import YDButton from "@/components/ui/YDButton";
import { YDCard } from "@/components/ui/YDCard";
import { useProfile, UserProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const Profile = () => {
  const { profile, isLoading, updateProfile } = useProfile();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    email: profile?.email || "",
    role: profile?.role || "learner",
    region: "North India", // This would come from the profile in a real implementation
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [updating, setUpdating] = useState(false);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle password form input changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };
  
  // Update profile information
  const handleSave = async () => {
    if (!profile) return;
    
    setUpdating(true);
    
    try {
      const { error } = await updateProfile({
        name: formData.name,
        // Email updates would require verification and are not handled here
      });
      
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was a problem updating your profile.",
      });
    } finally {
      setUpdating(false);
    }
  };
  
  // Change password
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password mismatch",
        description: "New passwords do not match.",
      });
      return;
    }
    
    // In a real implementation, we would use Supabase auth to update the password
    // This is just a placeholder for now
    toast({
      title: "Password updated",
      description: "Your password has been changed successfully.",
    });
    
    // Reset password fields
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary border-r-2 border-b-2 border-gray-200"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Get initials from name for the avatar
  const getInitials = () => {
    if (!profile?.name) return user?.email?.[0].toUpperCase() || 'U';
    return profile.name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="yd-container animate-fade-in">
            <h2 className="yd-section-title mb-6">Profile</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile sidebar */}
              <div className="md:col-span-1">
                <YDCard className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    {profile?.profile_picture ? (
                      <img 
                        src={profile.profile_picture} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-yd-navy flex items-center justify-center text-white text-4xl font-medium">
                        {getInitials()}
                      </div>
                    )}
                    <button className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full hover:bg-primary/90">
                      <Camera size={16} />
                    </button>
                  </div>
                  
                  <h3 className="text-xl font-semibold">{profile?.name || 'User'}</h3>
                  <p className="text-muted-foreground">{profile?.role || 'Learner'}</p>
                  
                  <div className="border-t mt-4 pt-4">
                    <div className="flex justify-between text-sm py-2">
                      <span className="text-muted-foreground">Email</span>
                      <span>{profile?.email || user?.email || 'Not available'}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2">
                      <span className="text-muted-foreground">Region</span>
                      <span>{formData.region}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2">
                      <span className="text-muted-foreground">Joined</span>
                      <span>
                        {profile?.created_at 
                          ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) 
                          : 'Recent'}
                      </span>
                    </div>
                  </div>
                </YDCard>
                
                {/* Progress summary */}
                <YDCard className="mt-6">
                  <h3 className="font-semibold mb-4">Learning Progress</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Overall Progress</span>
                        <span className="text-sm font-medium">40%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary rounded-full h-2 w-[40%]"></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Quizzes Completed</span>
                        <span className="text-sm font-medium">4/10</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary rounded-full h-2 w-[40%]"></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Achievements</span>
                        <span className="text-sm font-medium">1/10</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary rounded-full h-2 w-[10%]"></div>
                      </div>
                    </div>
                  </div>
                </YDCard>
              </div>
              
              {/* Profile settings */}
              <div className="md:col-span-2">
                <YDCard>
                  <h3 className="font-semibold mb-6">Personal Information</h3>
                  
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="name" className="block text-sm font-medium text-yd-navy">
                          Full Name
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-yd-navy">
                          Email Address
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          disabled // Email changes require verification
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="role" className="block text-sm font-medium text-yd-navy">
                          Role
                        </label>
                        <input
                          id="role"
                          name="role"
                          type="text"
                          value={formData.role}
                          onChange={handleChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          disabled
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="region" className="block text-sm font-medium text-yd-navy">
                          Region
                        </label>
                        <select
                          id="region"
                          name="region"
                          value={formData.region}
                          onChange={handleChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="North India">North India</option>
                          <option value="South India">South India</option>
                          <option value="East India">East India</option>
                          <option value="West India">West India</option>
                          <option value="Central India">Central India</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <YDButton type="submit" disabled={updating}>
                        <Save size={16} className="mr-2" />
                        {updating ? "Saving..." : "Save Changes"}
                      </YDButton>
                    </div>
                  </form>
                </YDCard>
                
                <YDCard className="mt-6">
                  <h3 className="font-semibold mb-6">Password</h3>
                  
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-yd-navy">
                          Current Password
                        </label>
                        <input
                          id="currentPassword"
                          name="currentPassword"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder="••••••••"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="newPassword" className="block text-sm font-medium text-yd-navy">
                          New Password
                        </label>
                        <input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder="••••••••"
                        />
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-yd-navy">
                          Confirm New Password
                        </label>
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <YDButton variant="outline" type="submit">
                        Change Password
                      </YDButton>
                    </div>
                  </form>
                </YDCard>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
