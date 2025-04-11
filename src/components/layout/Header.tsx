
import { Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

const Header = ({ className }: HeaderProps) => {
  return (
    <header className={cn(
      "w-full h-16 border-b bg-white flex items-center justify-between px-6",
      className
    )}>
      <div className="flex-1">
        <h1 className="text-xl font-heading font-semibold tracking-tight text-orange-600">
          Yellow Diamond Academy
        </h1>
      </div>
      
      <div className="relative mx-4 flex-1 max-w-md hidden md:block">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input
          type="search"
          placeholder="Search modules, lessons..."
          className="w-full rounded-md border bg-background px-3 py-2 pl-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-1 hover:bg-muted">
          <Bell size={20} className="text-muted-foreground" />
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-amber-500"></span>
        </button>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-orange-500 h-8 w-8 flex items-center justify-center text-white font-medium">
            YD
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium">Team Member</p>
            <p className="text-xs text-muted-foreground">Yellow Diamond</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
