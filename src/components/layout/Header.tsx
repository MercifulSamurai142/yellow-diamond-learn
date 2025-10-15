// yellow-diamond-learn-main/src/components/layout/Header.tsx
import { Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";
import { useIsMobile } from "@/hooks/use-mobile";
import { useContext } from 'react';
import { LanguageContext } from '@/contexts/LanguageContext'; // Import LanguageContext
// Removed DropdownMenu imports as language selection is moved to Profile page

interface HeaderProps {
  className?: string;
}

const Header = ({ className }: HeaderProps) => {
  const { profile } = useProfile();
  const isMobile = useIsMobile();
  const { currentLanguage } = useContext(LanguageContext)!; // Get currentLanguage

  const mobileLeftPaddingClass = isMobile ? "pl-[60px]" : "pl-6";

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'english': return 'English';
      case 'hindi': return 'हिन्दी';
      case 'kannada': return 'ಕನ್ನಡ';
      default: return 'Language';
    }
  };

  return (
    <header className={cn(
      "w-full h-16 border-b bg-white flex items-center justify-between px-6",
      mobileLeftPaddingClass,
      className
    )}>
      <div className="flex-1">
        <h1 className="text-xl font-heading font-semibold tracking-tight text-orange-600">
          Yellow Diamond Academy
        </h1>
      </div>
      
      <div className="relative mx-4 flex-1 max-w-md hidden md:block">
        {/* <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input
          type="search"
          placeholder="Search modules, lessons..."
          className="w-full rounded-md border bg-background px-3 py-2 pl-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        /> */},
      </div>
      
      <div className="flex items-center gap-4">
        {/* Language Selector Dropdown Button - REMOVED */}

        {/* <button className="relative rounded-full p-1 hover:bg-muted">
          <Bell size={20} className="text-muted-foreground" />
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-amber-500"></span>
        </button> */}
        <div className="flex items-center gap-3">
          {/* Placeholder for user profile image or initials */}
          <div className="rounded-full bg-orange-500 h-8 w-8 flex items-center justify-center text-white font-medium">
            {profile?.profile_picture ? (
              <img
                src={
                  profile?.profile_picture
                    ? `${profile.profile_picture}${profile.updated_at ? `?v=${profile.updated_at}` : ''}`
                    : undefined
                }
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center text-primary text-4xl font-medium">
                YD
              </div>
            )}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium">
              {profile?.name || "Team Member"}
            </p>
            <p className="text-xs text-muted-foreground">Yellow Diamond</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;