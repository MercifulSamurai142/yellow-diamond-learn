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
import { useIsMobile } from '@/hooks/use-mobile'; // Import the mobile hook
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'; // Import Sheet components

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false); // State for mobile sheet
  const location = useLocation();
  const { signOut } = useAuth();
  const isMobile = useIsMobile(); // Use the mobile hook

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navigationItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { name: 'Modules', icon: <BookOpen size={20} />, path: '/modules' },
    // { name: 'Achievements', icon: <Award size={20} />, path: '/achievements' },
    { name: 'Progress', icon: <LineChart size={20} />, path: '/progress' },
    { name: 'Profile', icon: <User size={20} />, path: '/profile' },
  ];

  // Admin items would be conditionally displayed based on user role
  const adminItems = [
    { name: 'Settings', icon: <Settings size={20} />, path: '/admin' },
  ];

  const sidebarContent = (
    <>
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
        {/* Close button for mobile sheet (the "new" one to keep) or desktop collapse button */}
        {/* As per the very first response, this button changes functionality/icon based on mobile state */}
        {isMobile ? (
             <button
                 onClick={() => setMobileOpen(false)} // This button closes the mobile sheet
                 className="text-sidebar-foreground hover:bg-sidebar-accent rounded-md p-1"
             >
                 <X size={18} />
             </button>
        ) : (
            <button
                onClick={() => setCollapsed(!collapsed)} // This button toggles desktop sidebar collapse
                className="text-sidebar-foreground hover:bg-sidebar-accent rounded-md p-1"
            >
                {collapsed ? <Menu size={18} /> : <X size={18} />}
            </button>
        )}
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
                onClick={() => isMobile && setMobileOpen(false)} // Close sidebar on mobile after navigation
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
                onClick={() => isMobile && setMobileOpen(false)} // Close sidebar on mobile after navigation
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.name}</span>}
              </Link>
            ))}
          </li>
        </ul>
      </nav>

      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={() => {
            signOut();
            isMobile && setMobileOpen(false); // Close sidebar on mobile after sign out
          }}
          className={cn(
            "flex items-center gap-3 w-full px-2 py-2 rounded-md transition-colors hover:bg-sidebar-accent text-sidebar-foreground/90"
          )}
        >
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Sidebar (Sheet) */}
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            {/* Hamburger menu button for mobile */}
            <button className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white border shadow-sm md:hidden">
              <Menu size={20} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] bg-sidebar p-0 [&>button]:hidden">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground h-screen flex-col hidden md:flex", // Hide on mobile
          collapsed ? "w-[70px]" : "w-[240px]",
          "transition-all duration-300 ease-in-out",
          className
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;