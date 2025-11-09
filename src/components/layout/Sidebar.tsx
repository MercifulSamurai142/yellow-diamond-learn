// yellow-diamond-learn-main/src/components/layout/Sidebar.tsx
import { useState, useContext } from 'react';
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
  LogOut,
  Megaphone,
  Users, // Import Users icon
  BarChartHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile'; // Import the mobile hook
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'; // Import Sheet components
import { LanguageContext } from '@/contexts/LanguageContext'; // Import LanguageContext
import { useProfile } from '@/hooks/useProfile'; // Import useProfile

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false); // State for mobile sheet
  const location = useLocation();
  const { signOut } = useAuth();
  const { profile, isLoading: isProfileLoading } = useProfile(); // Get profile and its loading state
  const isMobile = useIsMobile(); // Use the mobile hook
  const { currentLanguage } = useContext(LanguageContext)!; // Get currentLanguage from context

  // Translation object structure
  const translations = {
    english: {
      companyName: "Yellow Diamond",
      dashboard: "Dashboard",
      modules: "Modules",
      certificates: "Certificates",
      announcements: "Announcements",
      progress: "Progress",
      profile: "Profile",
      settings: "Settings",
      admin: "Admin",
      logout: "Logout",
      userList: "User List",
      progressReport: "Progress Report"
    },
    hindi: {
      companyName: "यलो डायमंड",
      dashboard: "डैशबोर्ड",
      modules: "मॉड्यूल",
      certificates: "प्रमाणपत्र",
      announcements: "घोषणाएँ",
      progress: "प्रगति",
      profile: "प्रोफाइल",
      settings: "सेटिंग्स",
      admin: "एडमिन",
      logout: "लॉग आउट",
      userList: "उपयोगकर्ता सूची",
      progressReport: "प्रगति रिपोर्ट"
    },
    kannada: {
      companyName: "ಯೆಲ್ಲೊ ಡೈಮಂಡ್",
      dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
      modules: "ಮಾಡ್ಯೂಲ್‌ಗಳು",
      certificates: "ಪ್ರಮಾಣಪತ್ರಗಳು",
      announcements: "ಪ್ರಕಟಣೆಗಳು",
      progress: "ಪ್ರಗತಿ",
      profile: "ಪ್ರೊಫೈಲ್",
      settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
      admin: "ಆಡ್ಮಿನ್",
      logout: "ಲಾಗ್ ಔಟ್",
      userList: "ಬಳಕೆದಾರರ ಪಟ್ಟಿ",
      progressReport: "ಪ್ರಗತಿ ವರದಿ"
    }
  };

  // Get current language translations
  const t = translations[currentLanguage] || translations.english;

  const isActive = (path: string) => {
    // Special handling for the base /admin path to match only it
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    // For other paths, match if the pathname starts with the item's path
    return location.pathname.startsWith(path);
  };

  const navigationItems = [
    { name: t.dashboard, icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { name: t.modules, icon: <BookOpen size={20} />, path: '/modules' },
    { name: t.certificates, icon: <Award size={20} />, path: '/certificates' },
    { name: t.announcements, icon: <Megaphone size={20} />, path: '/announcements' },
    { name: t.progress, icon: <LineChart size={20} />, path: '/progress' },
    { name: t.profile, icon: <User size={20} />, path: '/profile' },
  ];

  // Admin items would be conditionally displayed based on user role
  const adminItems = [
    { name: t.settings, icon: <Settings size={20} />, path: '/admin', roles: ['admin'] },
    { name: t.userList, icon: <Users size={20} />, path: '/users', roles: ['admin', 'region admin'] }, // Added 'region admin'
    { name: t.progressReport, icon: <BarChartHorizontal size={20} />, path: '/progress-report', roles: ['admin', 'region admin'] },
  ];

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-3 py-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="bg-yd-yellow rounded-md p-1">
              <span className="font-bold text-yd-navy">YD</span>
            </div>
            <span className="font-heading font-semibold text-yd-navy">{t.companyName}</span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto bg-yd-yellow rounded-md p-1">
            <span className="font-bold text-yd-navy">YD</span>
          </div>
        )}
        {isMobile ? (
             <button
                 onClick={() => setMobileOpen(false)}
                 className="text-sidebar-foreground hover:bg-sidebar-accent rounded-md p-1"
             >
                 <X size={18} />
             </button>
        ) : (
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="text-sidebar-foreground hover:bg-sidebar-accent rounded-md p-1"
            >
                {collapsed ? <Menu size={18} /> : <X size={18} />}
            </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navigationItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-2 py-2 rounded-md transition-colors",
                  isActive(item.path)
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "hover:bg-sidebar-accent"
                )}
                onClick={() => isMobile && setMobileOpen(false)}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.name}</span>}
              </Link>
            </li>
          ))}

          {!isProfileLoading && profile && (profile.role === 'admin' || profile.role === 'region admin') && (
            <li className="pt-4 mt-4 border-t border-sidebar-border">
              {!collapsed && <span className="px-2 text-xs uppercase tracking-wider text-sidebar-foreground/60">{t.admin}</span>}
              {adminItems
                .filter(item => item.roles.includes(profile.role!))
                .map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 mt-1 px-2 py-2 rounded-md transition-colors",
                    isActive(item.path)
                      ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                      : "hover:bg-sidebar-accent"
                  )}
                  onClick={() => isMobile && setMobileOpen(false)}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              ))}
            </li>
          )}
        </ul>
      </nav>

      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={() => {
            signOut();
            isMobile && setMobileOpen(false);
          }}
          className={cn(
            "flex items-center gap-3 w-full px-2 py-2 rounded-md transition-colors hover:bg-sidebar-accent text-sidebar-foreground/90"
          )}
        >
          <LogOut size={20} />
          {!collapsed && <span>{t.logout}</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white border shadow-sm md:hidden">
              <Menu size={20} />
            </button>
          </SheetTrigger> {/* CLOSING TAG ADDED HERE */}
          <SheetContent side="left" className="w-[240px] bg-sidebar p-0 [&>button]:hidden">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      )}

      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground h-screen flex-col hidden md:flex",
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