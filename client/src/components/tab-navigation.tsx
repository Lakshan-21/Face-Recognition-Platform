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
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className={`px-6 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
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
