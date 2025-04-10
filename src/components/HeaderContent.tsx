
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

const HeaderContent = () => {
  const { signOut } = useAuth();
  const { profile } = useProfile();

  const handleSignOut = async () => {
    await signOut();
  };

  // Extract initials from name for the avatar
  const getInitials = () => {
    if (!profile || !profile.name) return 'U';
    return profile.name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex items-center gap-4">
      {/* Notifications */}
      <button className="relative p-1 rounded-full hover:bg-gray-100">
        <Bell size={20} className="text-yd-navy" />
        <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full">
          3
        </span>
      </button>
      
      {/* Profile dropdown can be expanded later */}
      <div className="flex items-center gap-2">
        <div className="text-right mr-2">
          <p className="text-sm font-medium">{profile?.name || 'User'}</p>
          <p className="text-xs text-muted-foreground">{profile?.role || 'Learner'}</p>
        </div>
        
        {/* User Avatar - can use profile picture if available */}
        <div className="h-9 w-9 rounded-full bg-yd-navy text-white flex items-center justify-center text-sm font-medium">
          {getInitials()}
        </div>

        {/* Logout button */}
        <button 
          onClick={handleSignOut}
          className="ml-2 p-2 rounded-full hover:bg-gray-100"
          title="Sign out"
        >
          <LogOut size={18} className="text-yd-navy" />
        </button>
      </div>
    </div>
  );
};

export default HeaderContent;
