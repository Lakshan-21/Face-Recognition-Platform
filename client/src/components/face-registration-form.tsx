import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Clock, User, AlertCircle, ChevronDown } from "lucide-react";

const registrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().optional(),
  department: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface FaceData {
  encoding: number[];
  confidence: number;
  bbox: [number, number, number, number];
}

export default function FaceRegistrationForm() {
  const [faceData, setFaceData] = useState<FaceData | null>(null);
  const [detectionStatus, setDetectionStatus] = useState<"waiting" | "detected" | "processing">("waiting");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Listen for face detection events from webcam
  useEffect(() => {
    const handleFaceDetectionEvent = (event: any) => {
      const faceData = event.detail;
      console.log("Face detected event:", faceData);
      setFaceData(faceData);
      setDetectionStatus("detected");
      
      toast({
        title: "Face Detected",
        description: `Face detected with ${Math.round(faceData.confidence * 100)}% confidence`,
      });
    };

    window.addEventListener('faceDetected', handleFaceDetectionEvent);
    return () => window.removeEventListener('faceDetected', handleFaceDetectionEvent);
  }, [toast]);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      role: "",
      department: "",
    },
  });

  // Fetch recent registrations
  const { data: recentRegistrations } = useQuery({
    queryKey: ["/api/registrations/recent"],
    refetchInterval: 5000,
  });

  const registrationMutation = useMutation({
    mutationFn: async (data: RegistrationFormData & { faceEncoding: number[] }) => {
      const response = await apiRequest("POST", "/api/register-face", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful",
        description: "Face has been registered successfully in the system",
      });
      form.reset();
      setFaceData(null);
      setDetectionStatus("waiting");
      queryClient.invalidateQueries({ queryKey: ["/api/registrations/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/system/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register face",
        variant: "destructive",
      });
    },
  });

  const handleFaceDetected = (faceData: FaceData) => {
    console.log("Face detected:", faceData);
    setFaceData(faceData);
    setDetectionStatus("detected");
    
    toast({
      title: "Face Detected",
      description: `Face detected with ${Math.round(faceData.confidence * 100)}% confidence`,
    });
  };

  const onSubmit = (data: RegistrationFormData) => {
    if (!faceData) {
      toast({
        title: "No Face Detected",
        description: "Please ensure a face is detected before registering",
        variant: "destructive",
      });
      return;
    }

    setDetectionStatus("processing");
    registrationMutation.mutate({
      ...data,
      faceEncoding: faceData.encoding,
    });
  };

  const getStatusIcon = () => {
    switch (detectionStatus) {
      case "detected":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "processing":
        return <Clock className="w-4 h-4 animate-spin" style={{ color: '#71767b' }} />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (detectionStatus) {
      case "detected":
        return "Face detected and ready for registration";
      case "processing":
        return "Processing registration...";
      default:
        return "Position your face in the camera frame";
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div style={{ marginBottom: '24px' }}>
          <label
            htmlFor="name"
            style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#ffffff', 
              marginBottom: '8px' 
            }}
            className="text-[#71767b]">Person Name </label>
          <input
            id="name"
            type="text"
            placeholder="Enter full name"
            {...form.register("name")}
            style={{ 
              all: 'unset',
              backgroundColor: '#000000',
              color: '#ffffff',
              border: '1px solid #2F3336',
              borderRadius: '6px',
              padding: '10px 12px',
              width: '100%',
              height: '42px',
              fontSize: '14px',
              display: 'block',
              boxSizing: 'border-box',
              fontFamily: 'inherit'
            }}
          />
          {form.formState.errors.name && (
            <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="mb-6">
          <label 
            htmlFor="role" 
            style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#ffffff', 
              marginBottom: '8px' 
            }}
          >Role</label>
          <div className="mt-2 relative">
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between p-3 border border-gray-600 rounded-md cursor-pointer text-[#ffffff] hover:bg-gray-800 transition-colors duration-200 bg-[#000000]"
            >
              <span className="text-[#71767b]">{selectedRole || "Select role"}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#000000] border-2 border-gray-500 rounded-md shadow-2xl z-50 overflow-hidden backdrop-blur-sm" style={{ backgroundColor: '#000000 !important', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.8)' }}>
                {["employee", "visitor", "contractor", "intern"].map((role) => (
                  <div
                    key={role}
                    onClick={() => {
                      setSelectedRole(role.charAt(0).toUpperCase() + role.slice(1));
                      form.setValue("role", role);
                      setIsDropdownOpen(false);
                    }}
                    className="p-3 cursor-pointer text-[#ffffff] hover:text-[#1d9bf0] transition-colors duration-200 bg-[#000000]"
                    style={{ backgroundColor: '#000000' }}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label
            htmlFor="department"
            style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#ffffff', 
              marginBottom: '8px' 
            }}
            className="text-[#71767b]">Department </label>
          <input
            id="department"
            type="text"
            placeholder="e.g., Engineering, Marketing"
            {...form.register("department")}
            style={{ 
              all: 'unset',
              backgroundColor: '#000000',
              color: '#ffffff',
              border: '1px solid #2F3336',
              borderRadius: '6px',
              padding: '10px 12px',
              width: '100%',
              height: '42px',
              fontSize: '14px',
              display: 'block',
              boxSizing: 'border-box',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Detection Status</h3>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="text-sm text-gray-600">{getStatusText()}</span>
          </div>
          {faceData && (
            <div className="mt-2 text-xs text-gray-500">
              Confidence: {Math.round(faceData.confidence * 100)}%
            </div>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={!faceData || detectionStatus === "processing" || registrationMutation.isPending}
        >
          <User className="w-4 h-4 mr-2" />
          {registrationMutation.isPending ? "Registering..." : "Register Face"}
        </Button>
      </form>
      {/* Recent Registrations */}
      <Card>
        <CardHeader>
          <CardTitle className="tracking-tight text-lg text-[#ffffff] font-bold">Recent Registrations</CardTitle>
          <CardDescription>Latest face registrations in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentRegistrations?.map((registration: any) => (
              <div key={registration.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{registration.name}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(registration.registeredAt).toLocaleString()}
                  </div>
                  {registration.role && (
                    <Badge variant="outline" className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-xs mt-1 text-[#1d9bf0] bg-[#1d9bf0]">
                      {registration.role}
                    </Badge>
                  )}
                </div>
                <Badge variant="secondary" className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-secondary/80 bg-green-100 text-[#68c400]">
                  Active
                </Badge>
              </div>
            ))}
            {(!recentRegistrations || recentRegistrations.length === 0) && (
              <div className="text-center py-4 text-gray-500">
                <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No registrations yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
