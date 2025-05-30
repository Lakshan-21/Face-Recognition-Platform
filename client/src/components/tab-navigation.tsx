import { Button } from "@/components/ui/button";
import { Video, UserPlus, MessageSquare, Search } from "lucide-react";

interface TabNavigationProps {
  activeTab: "registration" | "recognition" | "chat" | "search";
  onTabChange: (tab: "registration" | "recognition" | "chat" | "search") => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    {
      id: "registration" as const,
      label: "Registration",
      icon: UserPlus,
    },
    {
      id: "recognition" as const,
      label: "Live Recognition",
      icon: Video,
    },
    {
      id: "search" as const,
      label: "Search",
      icon: Search,
    },
    {
      id: "chat" as const,
      label: "AI Chat",
      icon: MessageSquare,
    },
  ];

  return (
    <nav className="bg-[#000000] border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex space-x-1 bg-muted p-1 rounded-full w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className={`px-6 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background"
                }`}
                onClick={() => onTabChange(tab.id)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
