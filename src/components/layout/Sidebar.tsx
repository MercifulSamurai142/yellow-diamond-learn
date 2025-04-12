
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Award, 
  LineChart, 
  User, 
  Settings, 
  Menu, 
  X,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const {signOut}  = useAuth()
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const navigationItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { name: 'Modules', icon: <BookOpen size={20} />, path: '/modules' },
    { name: 'Achievements', icon: <Award size={20} />, path: '/achievements' },
    { name: 'Progress', icon: <LineChart size={20} />, path: '/progress' },
    { name: 'Profile', icon: <User size={20} />, path: '/profile' },
  ];
  
  // Admin items would be conditionally displayed based on user role
  const adminItems = [
    { name: 'Settings', icon: <Settings size={20} />, path: '/admin' },
  ];

  return (
    <aside 
      className={cn(
        "bg-sidebar text-sidebar-foreground h-screen flex flex-col",
        collapsed ? "w-[60px]" : "w-[240px]",
        "transition-all duration-300 ease-in-out",
        className
      )}
    >
      <div className="flex items-center justify-between px-3 py-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="bg-yd-yellow rounded-md p-1">
              <span className="font-bold text-yd-navy">YD</span>
            </div>
            <span className="font-heading font-semibold text-yd-navy">Yellow Diamond</span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto bg-yd-yellow rounded-md p-1">
            <span className="font-bold text-yd-navy">YD</span>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent rounded-md p-1"
        >
          {collapsed ? <Menu size={18} /> : <X size={18} />}
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navigationItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-2 py-2 rounded-md transition-colors",
                  isActive(item.path) 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" 
                    : "hover:bg-sidebar-accent"
                )}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.name}</span>}
              </Link>
            </li>
          ))}
          
          {/* Admin items would be conditionally displayed */}
          <li className="pt-4 mt-4 border-t border-sidebar-border">
            {!collapsed && <span className="px-2 text-xs uppercase tracking-wider text-sidebar-foreground/60">Admin</span>}
            {adminItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 mt-1 px-2 py-2 rounded-md transition-colors",
                  isActive(item.path) 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" 
                    : "hover:bg-sidebar-accent"
                )}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.name}</span>}
              </Link>
            ))}
          </li>
        </ul>
      </nav>
      
      <div className="p-2 border-t border-sidebar-border">
        <button onClick={()=>signOut()} className={cn(
          "flex items-center gap-3 w-full px-2 py-2 rounded-md transition-colors hover:bg-sidebar-accent text-sidebar-foreground/90"
        )}>
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
