import { Button } from "@/components/ui/button";
import { Video, UserPlus, MessageSquare } from "lucide-react";

interface TabNavigationProps {
  activeTab: "registration" | "recognition" | "chat";
  onTabChange: (tab: "registration" | "recognition" | "chat") => void;
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
                className={`px-6 py-2.5 text-sm font-semibold rounded-full transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-[#1d9bf0] text-white shadow-lg transform scale-105 border-2 border-[#1d9bf0]"
                    : "text-[#71767b] hover:text-white hover:bg-[#16181c] border-2 border-transparent"
                }`}
                onClick={() => onTabChange(tab.id)}
                style={{
                  backgroundColor: activeTab === tab.id ? '#1d9bf0' : 'transparent',
                  color: activeTab === tab.id ? '#ffffff' : '#71767b',
                  borderColor: activeTab === tab.id ? '#1d9bf0' : 'transparent'
                }}
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
