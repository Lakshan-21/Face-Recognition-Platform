import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TabNavigation from "@/components/tab-navigation";
import WebcamFeed from "@/components/webcam-feed";
import FaceRegistrationForm from "@/components/face-registration-form";
import LiveRecognition from "@/components/live-recognition";
import ChatInterface from "@/components/chat-interface";

import { useQuery } from "@tanstack/react-query";
import { Circle } from "lucide-react";
import katomaranLogo from "@assets/katomaran_logo.png";
import faceLogo from "@assets/FACE (1).png";

type Tab = "registration" | "recognition" | "chat";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("registration");

  // Fetch system status
  const { data: systemStatus } = useQuery({
    queryKey: ["/api/system/status"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-[#000000] border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <img src={faceLogo} alt="Aperture Logo" className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Face Recognition Platform</h1>
                  <p className="text-xs font-semibold text-[#f2f2f2]">Aperture Security Systems</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-accent text-[#1d9bf0]">
                  <div className="w-2 h-2 bg-[#1d9bf0] rounded-full animate-pulse mr-2" />
                  System Active
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground font-medium">
                <span className="font-semibold text-[#ffffff]">{(systemStatus as any)?.registrationCount || 0}</span> registered faces
              </div>
              <div className="w-8 h-8 flex items-center justify-center">
                <img src={katomaranLogo} alt="Katomaran Logo" className="w-8 h-8 object-contain" />
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "registration" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Video Feed Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl leading-none tracking-tight flex items-center justify-between text-[#ffffff] font-bold">
                    Camera Feed
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
                      Live
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WebcamFeed mode="registration" onFaceDetected={(faceData) => {
                    // Pass face data to registration form component
                    const event = new CustomEvent('faceDetected', { detail: faceData });
                    window.dispatchEvent(event);
                  }} />
                </CardContent>
              </Card>
            </div>

            {/* Registration Form Section */}
            <div className="space-y-6">
              <Card className="text-[#ffffff]">
                <CardHeader>
                  <CardTitle className="text-2xl leading-none tracking-tight text-[#ffffff] font-bold">Register New Face</CardTitle>
                  <CardDescription>
                    Capture and register a new face in the system
                  </CardDescription>
                </CardHeader>
                <CardContent className="bg-[#000000]">
                  <FaceRegistrationForm />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "recognition" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <LiveRecognition />
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl leading-none tracking-tight text-[#ffffff] font-bold">Recognition Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-muted rounded-lg p-4">
                      <div className="text-2xl font-bold text-[#ffffff]">{(systemStatus as any)?.todayEvents || 0}</div>
                      <div className="text-sm text-muted-foreground">Total Detections Today</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ChatInterface />
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl leading-none tracking-tight text-[#ffffff] font-bold">RAG System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Vector Database</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        Connected
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">LLM API</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">WebSocket</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
                        Live
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
