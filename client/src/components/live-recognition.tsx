import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import WebcamFeed from "./webcam-feed";
import { Play, Square, Download, User, AlertTriangle } from "lucide-react";

interface RecognitionResult {
  personId?: number;
  name: string;
  confidence: number;
  bbox: [number, number, number, number];
  isRecognized: boolean;
}

interface RecognitionStats {
  totalDetections: number;
  recognizedFaces: number;
  unknownFaces: number;
  averageConfidence: number;
}

export default function LiveRecognition() {
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState([85]);
  const [currentDetections, setCurrentDetections] = useState<RecognitionResult[]>([]);

  // Fetch recognition statistics
  const { data: stats } = useQuery<RecognitionStats>({
    queryKey: ["/api/recognition-stats"],
    refetchInterval: 5000,
  });

  // Fetch recent recognition events
  const { data: recentEvents = [] } = useQuery<any[]>({
    queryKey: ["/api/recognition-events/recent"],
    refetchInterval: 2000,
  });

  const handleStartRecognition = () => {
    setIsRecognizing(true);
    setCurrentDetections([]);
  };

  const handleStopRecognition = () => {
    setIsRecognizing(false);
    setCurrentDetections([]);
  };

  const handleFaceDetection = (detectionResults: any) => {
    if (isRecognizing && detectionResults?.detections) {
      setCurrentDetections(detectionResults.detections);
    }
  };

  const handleExportLog = () => {
    // Export recognition log functionality
    const csvContent = recentEvents.map((event: any) => 
      `${event.detectedAt},${event.personName},${event.confidence},${event.isRecognized ? 'Recognized' : 'Unknown'}`
    ).join('\n');
    
    const blob = new Blob([`Timestamp,Name,Confidence,Status\n${csvContent}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recognition_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Live Recognition
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
                {isRecognizing ? "Scanning" : "Standby"}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleExportLog}>
                <Download className="w-4 h-4 mr-2" />
                Export Log
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WebcamFeed 
            mode="recognition" 
            onFaceDetected={handleFaceDetection}
            isActive={isRecognizing}
          />
          
          {/* Recognition Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={isRecognizing ? handleStopRecognition : handleStartRecognition}
                variant={isRecognizing ? "destructive" : "default"}
              >
                {isRecognizing ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Stop Recognition
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Recognition
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <Label className="text-xs text-gray-600">Confidence Threshold:</Label>
              <div className="w-20">
                <Slider
                  value={confidenceThreshold}
                  onValueChange={setConfidenceThreshold}
                  max={99}
                  min={50}
                  step={5}
                />
              </div>
              <span className="text-xs text-gray-600 min-w-[3rem]">{confidenceThreshold[0]}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Live Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Live Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{stats?.totalDetections || '0'}</div>
              <div className="text-sm text-gray-600">Total Detections</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{stats?.recognizedFaces || '0'}</div>
              <div className="text-sm text-gray-600">Recognized Faces</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">{stats?.unknownFaces || '0'}</div>
              <div className="text-sm text-gray-600">Unknown Faces</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-700">{stats?.averageConfidence || '0'}%</div>
              <div className="text-sm text-gray-600">Average Confidence</div>
            </div>
          </CardContent>
        </Card>

        {/* Current Detections */}
        <Card>
          <CardHeader>
            <CardTitle>Current Frame</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentDetections.map((detection, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    detection.isRecognized
                      ? "bg-green-50 border-green-200"
                      : "bg-orange-50 border-orange-200"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      detection.isRecognized ? "bg-green-500" : "bg-orange-500"
                    }`}>
                      {detection.isRecognized ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{detection.name}</div>
                      <div className="text-xs text-gray-500">
                        Position: {detection.bbox[0] < 50 ? "Left" : detection.bbox[0] > 50 ? "Right" : "Center"}
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${
                    detection.isRecognized ? "text-green-600" : "text-orange-600"
                  }`}>
                    {Math.round(detection.confidence)}%
                  </div>
                </div>
              ))}
              
              {currentDetections.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No faces currently detected</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recognition Log */}
        <Card>
          <CardHeader>
            <CardTitle>Recognition Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentEvents.slice(0, 10).map((event: any) => (
                <div key={event.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      event.isRecognized ? "bg-green-500" : "bg-orange-500"
                    }`} />
                    <span className="font-medium text-gray-900">{event.personName}</span>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {new Date(event.detectedAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              
              {recentEvents.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No recognition events yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
