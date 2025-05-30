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
    <nav style={{ backgroundColor: '#000000', borderBottom: '1px solid #2f3336' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          padding: '12px 0',
          justifyContent: 'flex-start'
        }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                style={{
                  backgroundColor: isActive ? '#1d9bf0' : '#2f3336',
                  color: isActive ? '#ffffff' : '#71767b',
                  border: isActive ? '2px solid #1d9bf0' : '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '25px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  outline: 'none',
                  transform: isActive ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isActive ? '0 2px 8px rgba(29, 155, 240, 0.4)' : '0 1px 3px rgba(0, 0, 0, 0.2)',
                  minWidth: '140px',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#16181c';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#2f3336';
                    e.currentTarget.style.color = '#71767b';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  }
                }}
              >
                <Icon style={{ width: '16px', height: '16px' }} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}