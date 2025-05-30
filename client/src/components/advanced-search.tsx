import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Clock, User, MapPin, Calendar } from "lucide-react";

interface SearchFilters {
  query: string;
  department: string;
  role: string;
  dateRange: string;
  sortBy: string;
}

interface SearchResult {
  id: number;
  name: string;
  department?: string;
  role?: string;
  registeredAt: string;
  lastSeen?: string;
  totalRecognitions: number;
}

interface AdvancedSearchProps {
  onResultsChange?: (results: SearchResult[]) => void;
}

export default function AdvancedSearch({ onResultsChange }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    department: "",
    role: "",
    dateRange: "",
    sortBy: "recent"
  });

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch all registrations and recognition events
  const { data: registrations = [] } = useQuery({
    queryKey: ["/api/registrations/all"],
  });

  const { data: recognitionEvents = [] } = useQuery({
    queryKey: ["/api/recognition/recent", 100],
  });

  // Extract unique departments and roles for filter options
  const uniqueDepartments = Array.from(new Set(
    (registrations as any[]).map(r => r.department).filter(Boolean)
  ));

  const uniqueRoles = Array.from(new Set(
    (registrations as any[]).map(r => r.role).filter(Boolean)
  ));

  // Perform search with filters
  const performSearch = () => {
    setIsSearching(true);
    
    let results = [...(registrations as any[])];

    // Apply text search filter
    if (filters.query.trim()) {
      const query = filters.query.toLowerCase();
      results = results.filter(person => 
        person.name.toLowerCase().includes(query) ||
        (person.department && person.department.toLowerCase().includes(query)) ||
        (person.role && person.role.toLowerCase().includes(query))
      );
    }

    // Apply department filter
    if (filters.department) {
      results = results.filter(person => person.department === filters.department);
    }

    // Apply role filter
    if (filters.role) {
      results = results.filter(person => person.role === filters.role);
    }

    // Apply date range filter
    if (filters.dateRange) {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      results = results.filter(person => 
        new Date(person.registeredAt) >= filterDate
      );
    }

    // Enhance results with recognition data
    const enhancedResults = results.map(person => {
      const personEvents = (recognitionEvents as any[]).filter(
        event => event.personId === person.id
      );
      
      const lastSeen = personEvents.length > 0 
        ? personEvents[0].timestamp 
        : undefined;

      return {
        ...person,
        lastSeen,
        totalRecognitions: personEvents.length
      };
    });

    // Apply sorting
    switch (filters.sortBy) {
      case "name":
        enhancedResults.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "recent":
        enhancedResults.sort((a, b) => 
          new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
        );
        break;
      case "active":
        enhancedResults.sort((a, b) => b.totalRecognitions - a.totalRecognitions);
        break;
      case "lastSeen":
        enhancedResults.sort((a, b) => {
          if (!a.lastSeen && !b.lastSeen) return 0;
          if (!a.lastSeen) return 1;
          if (!b.lastSeen) return -1;
          return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
        });
        break;
    }

    setSearchResults(enhancedResults);
    onResultsChange?.(enhancedResults);
    setIsSearching(false);
  };

  // Auto-search when filters change
  useEffect(() => {
    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [filters, registrations, recognitionEvents]);

  const clearFilters = () => {
    setFilters({
      query: "",
      department: "",
      role: "",
      dateRange: "",
      sortBy: "recent"
    });
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
    <div className="space-y-6">
      {/* Search Filters */}
      <Card className="bg-black border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Advanced Search & Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Query */}
          <div>
            <Input
              placeholder="Search by name, department, or role..."
              value={filters.query}
              onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
              className="bg-black border-gray-700 text-white placeholder-gray-400"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={filters.department}
              onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}
            >
              <SelectTrigger className="bg-black border-gray-700 text-white">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent className="bg-black border-gray-700">
                <SelectItem value="">All Departments</SelectItem>
                {uniqueDepartments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.role}
              onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger className="bg-black border-gray-700 text-white">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent className="bg-black border-gray-700">
                <SelectItem value="">All Roles</SelectItem>
                {uniqueRoles.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.dateRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
            >
              <SelectTrigger className="bg-black border-gray-700 text-white">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent className="bg-black border-gray-700">
                <SelectItem value="">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Past Week</SelectItem>
                <SelectItem value="month">Past Month</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.sortBy}
              onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
            >
              <SelectTrigger className="bg-black border-gray-700 text-white">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent className="bg-black border-gray-700">
                <SelectItem value="recent">Recently Registered</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="active">Most Active</SelectItem>
                <SelectItem value="lastSeen">Last Seen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-blue-900 text-blue-200">
                {searchResults.length} results found
              </Badge>
              {isSearching && (
                <Badge variant="secondary" className="bg-yellow-900 text-yellow-200">
                  Searching...
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      <Card className="bg-black border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Search Results</span>
            <Badge variant="secondary" className="bg-gray-800 text-gray-200">
              {searchResults.length} people
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {searchResults.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No people found matching your search criteria</p>
              <p className="text-sm mt-2">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{person.name}</h3>
                      <div className="flex items-center space-x-3 text-sm text-gray-400">
                        {person.department && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>{person.department}</span>
                          </div>
                        )}
                        {person.role && (
                          <Badge variant="secondary" className="text-xs">
                            {person.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>Registered {formatTime(person.registeredAt)}</span>
                    </div>
                    {person.lastSeen && (
                      <div className="flex items-center space-x-2 text-sm text-green-400">
                        <Clock className="w-3 h-3" />
                        <span>Seen {formatTime(person.lastSeen)}</span>
                      </div>
                    )}
                    <Badge variant="secondary" className="bg-blue-900 text-blue-200 text-xs">
                      {person.totalRecognitions} recognitions
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}