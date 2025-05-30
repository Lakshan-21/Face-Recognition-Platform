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
        <div className="flex space-x-2 p-1 w-fit" style={{ backgroundColor: 'transparent' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                style={{
                  backgroundColor: activeTab === tab.id ? '#1d9bf0' : '#2f3336',
                  color: activeTab === tab.id ? '#ffffff' : '#71767b',
                  border: activeTab === tab.id ? '2px solid #1d9bf0' : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '9999px',
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: activeTab === tab.id ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: activeTab === tab.id ? '0 4px 12px rgba(29, 155, 240, 0.3)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = '#16181c';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = '#2f3336';
                    e.currentTarget.style.color = '#71767b';
                  }
                }}
              >
                <Icon style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
