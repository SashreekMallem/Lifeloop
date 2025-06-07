import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import LifeOSLogo from "@/components/life-os/LifeOSLogo";
import AppHeader from "@/components/life-os/AppHeader";
import TasksWidget from "@/components/life-os/widgets/TasksWidget";
import MeetingsWidget from "@/components/life-os/widgets/MeetingsWidget";
import HealthDataWidget from "@/components/life-os/widgets/HealthDataWidget";
import PersonalizedInsightsWidget from "@/components/life-os/widgets/PersonalizedInsightsWidget";
import LifeXPWidget from "@/components/life-os/widgets/LifeXPWidget";
import IntelligentSuggestionsWidget from "@/components/life-os/widgets/IntelligentSuggestionsWidget";
import EntertainmentWidget from "@/components/life-os/widgets/EntertainmentWidget";
import MorningSummaryWidget from "@/components/life-os/widgets/MorningSummaryWidget";
import MoodWidget from "@/components/life-os/widgets/MoodWidget";
import { LayoutDashboard, Target, Heart, SettingsIcon, UserCircle, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function LifeOSDashboard() {
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "#" },
    { label: "Goals", icon: Target, href: "#" },
    { label: "Health", icon: Heart, href: "#" },
    { label: "Profile", icon: UserCircle, href: "#" },
    { label: "Settings", icon: SettingsIcon, href: "#" },
  ];

  return (
    <SidebarProvider defaultOpen={true} collapsible="icon">
      <Sidebar side="left" className="border-r">
        <SidebarHeader className="p-4">
          <LifeOSLogo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton href={item.href} isActive={item.label === "Dashboard"} tooltip={item.label}>
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t">
           <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton href="#" tooltip="Logout">
                    <LogOut />
                    <span>Logout</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
           </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-background">
          <div className="mb-6">
            <h1 className="text-3xl font-headline font-semibold">Life Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, User! Here's your overview.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 md:gap-6">
            <MorningSummaryWidget />
            <TasksWidget />
            <MeetingsWidget />
            <HealthDataWidget />
            <MoodWidget />
            <LifeXPWidget />
            <PersonalizedInsightsWidget />
            <IntelligentSuggestionsWidget />
            <EntertainmentWidget />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
