
import { useState } from "react";
import { Camera, Save } from "lucide-react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import YDButton from "@/components/ui/YDButton";
import { YDCard } from "@/components/ui/YDCard";

const Profile = () => {
  // In a real implementation, we would fetch this from Supabase
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Sales Representative",
    region: "North India",
    joinDate: "March, 2024",
    profilePicture: ""
  });
  
  // This would save changes to Supabase
  const handleSave = () => {
    // In a real implementation, we would update the profile in Supabase
    console.log("Profile updated:", profile);
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
                    {profile.profilePicture ? (
                      <img 
                        src={profile.profilePicture} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-yd-navy flex items-center justify-center text-white text-4xl font-medium">
                        {profile.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    <button className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full hover:bg-primary/90">
                      <Camera size={16} />
                    </button>
                  </div>
                  
                  <h3 className="text-xl font-semibold">{profile.name}</h3>
                  <p className="text-muted-foreground">{profile.role}</p>
                  
                  <div className="border-t mt-4 pt-4">
                    <div className="flex justify-between text-sm py-2">
                      <span className="text-muted-foreground">Email</span>
                      <span>{profile.email}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2">
                      <span className="text-muted-foreground">Region</span>
                      <span>{profile.region}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2">
                      <span className="text-muted-foreground">Joined</span>
                      <span>{profile.joinDate}</span>
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
                  
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="name" className="block text-sm font-medium text-yd-navy">
                          Full Name
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          value={profile.name}
                          onChange={(e) => setProfile({...profile, name: e.target.value})}
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
                          value={profile.email}
                          onChange={(e) => setProfile({...profile, email: e.target.value})}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                          value={profile.role}
                          onChange={(e) => setProfile({...profile, role: e.target.value})}
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
                          value={profile.region}
                          onChange={(e) => setProfile({...profile, region: e.target.value})}
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
                      <YDButton onClick={handleSave} type="button">
                        <Save size={16} className="mr-2" />
                        Save Changes
                      </YDButton>
                    </div>
                  </form>
                </YDCard>
                
                <YDCard className="mt-6">
                  <h3 className="font-semibold mb-6">Password</h3>
                  
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="current-password" className="block text-sm font-medium text-yd-navy">
                          Current Password
                        </label>
                        <input
                          id="current-password"
                          name="currentPassword"
                          type="password"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder="••••••••"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="new-password" className="block text-sm font-medium text-yd-navy">
                          New Password
                        </label>
                        <input
                          id="new-password"
                          name="newPassword"
                          type="password"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder="••••••••"
                        />
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-yd-navy">
                          Confirm New Password
                        </label>
                        <input
                          id="confirm-password"
                          name="confirmPassword"
                          type="password"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <YDButton variant="outline" type="button">
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
