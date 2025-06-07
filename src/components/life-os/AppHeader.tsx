import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
// SidebarTrigger might not be needed if we use a different mechanism or it's part of AiConsole
// import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, Settings, UserCircle, Menu } from "lucide-react";

const AppHeader = () => {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-primary/10 bg-background/30 backdrop-blur-md px-4 md:px-6">
      {/* Placeholder for a potential global menu trigger if AiConsole trigger is elsewhere */}
      {/* <div className="md:hidden">
        <Button variant="ghost" size="icon"><Menu /></Button>
      </div> */}
      <div className="flex-1">
        {/* Breadcrumbs or Contextual Title */}
        {/* <h1 className="text-xl font-semibold text-foreground/80">Dashboard Overview</h1> */}
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-9 w-9 border-2 border-primary/50">
                <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="user avatar tech" />
                <AvatarFallback className="bg-primary/30 text-primary-foreground">OP</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glassmorphic border-primary/20 w-56">
            <DropdownMenuLabel className="text-foreground/90">Operator Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-primary/10" />
            <DropdownMenuItem className="hover:bg-primary/10 focus:bg-primary/10">
              <UserCircle className="mr-2 h-4 w-4 text-primary/80" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-primary/10 focus:bg-primary/10">
              <Settings className="mr-2 h-4 w-4 text-primary/80" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-primary/10" />
            <DropdownMenuItem className="text-destructive/80 hover:bg-destructive/10 focus:bg-destructive/10 hover:text-destructive focus:text-destructive">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AppHeader;
