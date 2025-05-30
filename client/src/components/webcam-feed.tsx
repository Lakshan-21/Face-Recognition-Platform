import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Video, VideoOff, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WebcamFeedProps {
  mode: "registration" | "recognition";
  onFaceDetected?: (faceData: any) => void;
  isActive?: boolean;
}

interface FaceDetection {
  bbox: [number, number, number, number];
  confidence: number;
  encoding?: number[];
  name?: string;
  isRecognized?: boolean;
}

export default function WebcamFeed({ mode, onFaceDetected, isActive = true }: WebcamFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [faceDetections, setFaceDetections] = useState<FaceDetection[]>([]);
  const [processingFPS, setProcessingFPS] = useState(0);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access not supported in this browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsStreaming(true);
        };
        
        toast({
          title: "Camera Started",
          description: "Webcam is now active and ready for face detection",
        });
      }
    } catch (error) {
      console.error("Error accessing webcam:", error);
      toast({
        title: "Camera Error",
        description: "Failed to access webcam. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
      setFaceDetections([]);
      
      toast({
        title: "Camera Stopped",
        description: "Webcam has been disabled",
      });
    }
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return null;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    context.drawImage(videoRef.current, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const processFaceDetection = async () => {
    if (!isStreaming) return;

    const startTime = performance.now();
    const imageData = await captureFrame();
    
    if (!imageData) return;

    try {
      // Use different endpoints based on mode
      const endpoint = mode === "recognition" ? '/api/recognize-faces' : '/api/detect-face';
      
      const requestBody = mode === "recognition" 
        ? { imageData, sessionId: 'live-recognition' }
        : { imageData };
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        
        if (mode === "recognition" && result.detections) {
          // Handle recognition mode - show detected faces with names
          const detections = result.detections.map((detection: any) => ({
            bbox: detection.bbox,
            confidence: detection.confidence,
            name: detection.name,
            isRecognized: detection.isRecognized
          }));
          setFaceDetections(detections);
          
          // Pass detections to parent component for Current Frame display
          if (onFaceDetected && detections.length > 0) {
            onFaceDetected(detections);
          }
        } else if (mode === "registration" && result.faces) {
          // Handle registration mode - standard face detection
          setFaceDetections(result.faces || []);
          
          if (result.faces?.length > 0 && onFaceDetected) {
            onFaceDetected(result.faces[0]);
          }
        } else {
          // No faces detected - clear display
          setFaceDetections([]);
          if (onFaceDetected) {
            onFaceDetected([]);
          }
        }
      }
    } catch (error) {
      console.error("Face processing error:", error);
    }

    const endTime = performance.now();
    const fps = 1000 / (endTime - startTime);
    setProcessingFPS(Math.round(fps * 10) / 10);
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isStreaming && mode === "registration") {
      intervalId = setInterval(processFaceDetection, 1000);
    } else if (isStreaming && mode === "recognition" && isActive) {
      intervalId = setInterval(processFaceDetection, 3000); // 3 second intervals for recognition
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isStreaming, mode, isActive]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div 
        className="relative rounded-lg overflow-hidden aspect-video"
        style={{ 
          backgroundColor: isStreaming ? '#000000' : '#374151' 
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        
        <canvas
          ref={canvasRef}
          className="hidden"
        />
        
        {/* Face Detection Overlays */}
        {faceDetections.map((detection, index) => (
          <div
            key={index}
            className="absolute rounded"
            style={{
              left: `${detection.bbox[0]}%`,
              top: `${detection.bbox[1]}%`,
              width: `${detection.bbox[2] - detection.bbox[0]}%`,
              height: `${detection.bbox[3] - detection.bbox[1]}%`,
              border: mode === "recognition" && detection.name 
                ? (detection.isRecognized ? "4px solid #16a34a" : "4px solid #ea580c")
                : "4px solid #3b82f6",
              boxShadow: mode === "recognition" && detection.name 
                ? (detection.isRecognized ? "0 0 0 2px rgba(22, 163, 74, 0.3)" : "0 0 0 2px rgba(234, 88, 12, 0.3)")
                : "0 0 0 2px rgba(59, 130, 246, 0.3)",
            }}
          >
            <div className={`absolute -top-8 left-0 px-3 py-1 rounded-md text-sm font-bold shadow-lg ${
              mode === "recognition" && detection.name 
                ? (detection.isRecognized ? "bg-green-600 text-white" : "bg-orange-600 text-white")
                : "bg-blue-600 text-white"
            }`}
            style={{
              textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)",
              minWidth: "max-content"
            }}>
              {mode === "recognition" && detection.name 
                ? `${detection.name} (${Math.round(detection.confidence * 100)}%)`
                : `Face Detected (${Math.round(detection.confidence * 100)}%)`
              }
            </div>
          </div>
        ))}
        
        {/* Status Overlays */}
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-primary text-primary-foreground">
            <Camera className="w-3 h-3 mr-1" />
            {isStreaming ? "Camera Active" : "Camera Inactive"}
          </Badge>
        </div>
        
        {mode === "recognition" && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white rounded-lg px-3 py-2 text-xs">
            <div>Faces: {faceDetections.length}</div>
            <div>FPS: {processingFPS}</div>
          </div>
        )}
        
        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-gray-500">
            <div className="text-center text-gray-300">
              <Video className="w-16 h-16 mx-auto mb-3 opacity-60" />
              <p className="text-lg font-medium">Camera not active</p>
              <p className="text-sm mt-1 opacity-75">Click "Start Camera" to begin</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Camera Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            onClick={isStreaming ? stopCamera : startCamera}
            variant={isStreaming ? "destructive" : "default"}
            size="sm"
          >
            {isStreaming ? (
              <>
                <VideoOff className="w-4 h-4 mr-2" />
                Stop Camera
              </>
            ) : (
              <>
                <Video className="w-4 h-4 mr-2" />
                Start Camera
              </>
            )}
          </Button>
          
          {isStreaming && (
            <Button
              onClick={() => {
                stopCamera();
                setTimeout(startCamera, 100);
              }}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Switch Camera
            </Button>
          )}
        </div>
        
        <div className="text-xs text-gray-500">
          Resolution: {videoRef.current?.videoWidth || 0}x{videoRef.current?.videoHeight || 0}
        </div>
      </div>
    </div>
  );
}
