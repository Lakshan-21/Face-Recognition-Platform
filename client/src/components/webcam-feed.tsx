import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Video, VideoOff, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WebcamFeedProps {
  mode: "registration" | "recognition";
  onFaceDetected?: (faceData: any) => void;
}

interface FaceDetection {
  bbox: [number, number, number, number];
  confidence: number;
  encoding?: number[];
}

export default function WebcamFeed({ mode, onFaceDetected }: WebcamFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [faceDetections, setFaceDetections] = useState<FaceDetection[]>([]);
  const [processingFPS, setProcessingFPS] = useState(0);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        
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
      const response = await fetch('/api/detect-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData })
      });

      if (response.ok) {
        const result = await response.json();
        setFaceDetections(result.faces || []);
        
        if (mode === "registration" && result.faces?.length > 0 && onFaceDetected) {
          onFaceDetected(result.faces[0]);
        }
      }
    } catch (error) {
      console.error("Face detection error:", error);
    }

    const endTime = performance.now();
    const fps = 1000 / (endTime - startTime);
    setProcessingFPS(Math.round(fps * 10) / 10);
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isStreaming) {
      // Process frames at 5 FPS to avoid overwhelming the system
      intervalId = setInterval(processFaceDetection, 200);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isStreaming, mode]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
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
            className="absolute border-2 border-blue-500 rounded"
            style={{
              left: `${detection.bbox[0]}%`,
              top: `${detection.bbox[1]}%`,
              width: `${detection.bbox[2] - detection.bbox[0]}%`,
              height: `${detection.bbox[3] - detection.bbox[1]}%`,
            }}
          >
            <div className="absolute -top-6 left-0 bg-blue-500 text-white px-2 py-1 rounded text-xs">
              Face Detected ({Math.round(detection.confidence * 100)}%)
            </div>
          </div>
        ))}
        
        {/* Status Overlays */}
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-black bg-opacity-60 text-white">
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
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
            <div className="text-center text-white">
              <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Camera not active</p>
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
