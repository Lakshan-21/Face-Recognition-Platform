import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Keyboard, Zap, Clock, TrendingUp } from "lucide-react";

interface SearchShortcutsProps {
  onShortcutSelect?: (shortcut: string) => void;
}

export default function SearchShortcuts({ onShortcutSelect }: SearchShortcutsProps) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const shortcuts = [
    {
      key: "Ctrl + K",
      description: "Open quick search",
      action: "focus-search"
    },
    {
      key: "Ctrl + F",
      description: "Advanced filters",
      action: "open-filters"
    },
    {
      key: "↑ ↓",
      description: "Navigate results",
      action: "navigate"
    },
    {
      key: "Enter",
      description: "Select person",
      action: "select"
    },
    {
      key: "Esc",
      description: "Clear search",
      action: "clear"
    }
  ];

  const smartSuggestions = [
    {
      text: "recent:",
      description: "Show recently registered people",
      icon: Clock,
      color: "blue"
    },
    {
      text: "active:",
      description: "Show most recognized people",
      icon: TrendingUp,
      color: "green"
    },
    {
      text: "dept:engineering",
      description: "Filter by engineering department",
      icon: Zap,
      color: "purple"
    },
    {
      text: "today",
      description: "People registered today",
      icon: Clock,
      color: "orange"
    }
  ];

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const addRecentSearch = (search: string) => {
    const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  const handleShortcutClick = (suggestion: any) => {
    addRecentSearch(suggestion.text);
    onShortcutSelect?.(suggestion.text);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Keyboard Shortcuts */}
      <Card className="bg-black border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Keyboard className="w-5 h-5" />
            <span>Keyboard Shortcuts</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-900">
              <span className="text-gray-300 text-sm">{shortcut.description}</span>
              <Badge variant="secondary" className="bg-gray-800 text-gray-200 font-mono text-xs">
                {shortcut.key}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Smart Suggestions */}
      <Card className="bg-black border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Smart Suggestions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {smartSuggestions.map((suggestion, index) => {
            const Icon = suggestion.icon;
            return (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start p-3 h-auto bg-gray-900 hover:bg-gray-800 text-left"
                onClick={() => handleShortcutClick(suggestion)}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 text-${suggestion.color}-400`} />
                  <div>
                    <div className="font-mono text-sm text-white">{suggestion.text}</div>
                    <div className="text-xs text-gray-400">{suggestion.description}</div>
                  </div>
                </div>
              </Button>
            );
          })}
          
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="pt-3 border-t border-gray-700">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Recent Searches</h4>
              <div className="space-y-1">
                {recentSearches.map((search, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
                    onClick={() => onShortcutSelect?.(search)}
                  >
                    <Clock className="w-3 h-3 mr-2" />
                    {search}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}