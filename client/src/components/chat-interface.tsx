import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest } from "@/lib/queryClient";
import { Send, Bot, User } from "lucide-react";

interface ChatMessage {
  id: string;
  message: string;
  response?: string;
  timestamp: string;
  isUser: boolean;
}

const sampleQueries = [
  "Who was the last person registered?",
  "At what time was Alice registered?",
  "How many people are currently registered?",
  "Show me recognition statistics for today",
  "What is the system status?",
];

export default function ChatInterface() {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch chat history
  const { data: chatHistory } = useQuery({
    queryKey: ["/api/chat/history"],
  });

  // WebSocket connection for real-time chat
  const { sendMessage: sendWebSocketMessage, lastMessage, connectionStatus } = useWebSocket('ws://localhost:5000');

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chat", { message });
      return response.json();
    },
    onSuccess: (data, message) => {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        message,
        response: data.response,
        timestamp: new Date().toISOString(),
        isUser: false,
      };
      setMessages(prev => [...prev, newMessage]);
      setIsTyping(false);
      queryClient.invalidateQueries({ queryKey: ["/api/chat/history"] });
    },
    onError: () => {
      setIsTyping(false);
    },
  });

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message,
      timestamp: new Date().toISOString(),
      isUser: true,
    };
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");
    setIsTyping(true);

    // Send to backend
    if (connectionStatus === 'Open') {
      sendWebSocketMessage(JSON.stringify({
        type: 'chat_message',
        payload: { message }
      }));
    } else {
      chatMutation.mutate(message);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(currentMessage);
  };

  const handleSampleQuery = (query: string) => {
    setCurrentMessage(query);
    handleSendMessage(query);
  };

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        if (data.type === 'chat_response') {
          const newMessage: ChatMessage = {
            id: Date.now().toString(),
            message: data.payload.message,
            response: data.payload.response,
            timestamp: data.payload.timestamp,
            isUser: false,
          };
          setMessages(prev => [...prev, newMessage]);
          setIsTyping(false);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: "welcome",
        message: "",
        response: "Hello! I'm your AI assistant. I can help you with questions about face registrations, recognition activities, and system statistics. What would you like to know?",
        timestamp: new Date().toISOString(),
        isUser: false,
      }]);
    }
  }, []);

  return (
    <Card className="h-[600px] flex flex-col">
      {/* Chat Header */}
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>AI Assistant</CardTitle>
              <p className="text-sm text-gray-500">Ask questions about face registrations</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            {connectionStatus || "Connected"}
          </Badge>
        </div>
      </CardHeader>

      {/* Chat Messages */}
      <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            {message.isUser ? (
              <div className="flex justify-end">
                <div className="max-w-sm bg-blue-600 text-white rounded-lg px-4 py-2">
                  <p className="text-sm">{message.message}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex justify-start">
                <div className="max-w-sm bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <Bot className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-medium text-gray-700">AI Assistant</span>
                  </div>
                  <p className="text-sm text-gray-800">{message.response}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-purple-500" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Chat Input */}
      <div className="p-6 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <Input
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Ask about registrations, recognition stats, or system status..."
            className="flex-1"
            disabled={chatMutation.isPending}
          />
          <Button
            type="submit"
            disabled={!currentMessage.trim() || chatMutation.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>

        {/* Sample Queries */}
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((query, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleSampleQuery(query)}
                disabled={chatMutation.isPending}
              >
                {query}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
