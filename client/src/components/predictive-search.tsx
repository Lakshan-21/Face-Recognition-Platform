import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, User, Clock, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: number;
  name: string;
  department?: string;
  role?: string;
  registeredAt: string;
  lastSeen?: string;
  confidence?: number;
}

interface PredictiveSearchProps {
  onSelectPerson?: (person: SearchResult) => void;
  placeholder?: string;
}

export default function PredictiveSearch({ onSelectPerson, placeholder = "Search for people..." }: PredictiveSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch all registrations for search
  const { data: registrations = [] } = useQuery({
    queryKey: ["/api/registrations/all"],
  });

  // Fetch recent recognition events for "last seen" data
  const { data: recentEvents = [] } = useQuery({
    queryKey: ["/api/recognition/recent", 50],
  });

  // Filter and search logic
  const filteredResults = searchQuery.trim() 
    ? registrations.filter((person: any) => 
        person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (person.department && person.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (person.role && person.role.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 8)
    : [];

  // Smart suggestions when no search query
  const smartSuggestions = searchQuery.trim() === "" ? [
    { type: "recent", label: "Recently registered", icon: Clock },
    { type: "active", label: "Recently recognized", icon: User },
    { type: "department", label: "Search by department", icon: MapPin },
  ] : [];

  // Get last seen time for a person
  const getLastSeen = (personName: string) => {
    const lastEvent = recentEvents.find((event: any) => 
      event.personName === personName
    );
    return lastEvent?.timestamp;
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      const totalItems = filteredResults.length + smartSuggestions.length;
      
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % totalItems);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1);
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < filteredResults.length) {
            handleSelectPerson(filteredResults[selectedIndex]);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredResults]);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPerson = (person: SearchResult) => {
    setSearchQuery(person.name);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelectPerson?.(person);
  };

  const handleSuggestionClick = (suggestion: any) => {
    switch (suggestion.type) {
      case "recent":
        setSearchQuery("recent:");
        break;
      case "active":
        setSearchQuery("active:");
        break;
      case "department":
        setSearchQuery("dept:");
        break;
    }
    inputRef.current?.focus();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 bg-black border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
        />
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 bg-black border-gray-700 max-h-96 overflow-y-auto">
          <CardContent className="p-2">
            {/* Search Results */}
            {filteredResults.length > 0 && (
              <div className="space-y-1">
                {filteredResults.map((person: any, index: number) => {
                  const lastSeen = getLastSeen(person.name);
                  return (
                    <div
                      key={person.id}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedIndex === index
                          ? "bg-blue-600 text-white"
                          : "bg-gray-900 hover:bg-gray-800 text-white"
                      }`}
                      onClick={() => handleSelectPerson(person)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{person.name}</p>
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            {person.department && (
                              <span>{person.department}</span>
                            )}
                            {person.role && (
                              <Badge variant="secondary" className="text-xs">
                                {person.role}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-400">
                        <p>Registered {formatTime(person.registeredAt)}</p>
                        {lastSeen && (
                          <p className="text-green-400">Seen {formatTime(lastSeen)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Smart Suggestions */}
            {smartSuggestions.length > 0 && filteredResults.length === 0 && (
              <div className="space-y-1">
                <p className="text-xs text-gray-500 px-3 py-2 font-medium">Smart Suggestions</p>
                {smartSuggestions.map((suggestion, index) => {
                  const Icon = suggestion.icon;
                  return (
                    <div
                      key={suggestion.type}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedIndex === filteredResults.length + index
                          ? "bg-blue-600 text-white"
                          : "bg-gray-900 hover:bg-gray-800 text-white"
                      }`}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <Icon className="w-4 h-4 text-blue-400" />
                      <span className="text-sm">{suggestion.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* No Results */}
            {searchQuery.trim() && filteredResults.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">No people found matching "{searchQuery}"</p>
                <p className="text-xs mt-1">Try searching by name, department, or role</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}