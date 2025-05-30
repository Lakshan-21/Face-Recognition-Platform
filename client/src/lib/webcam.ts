export interface WebcamConstraints {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
  deviceId?: string;
}

export class WebcamManager {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;

  async getDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  }

  async startCamera(
    videoElement: HTMLVideoElement,
    constraints: WebcamConstraints = {}
  ): Promise<MediaStream> {
    const defaultConstraints = {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'user',
      ...constraints,
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: defaultConstraints,
        audio: false,
      });

      videoElement.srcObject = this.stream;
      this.video = videoElement;
      
      return this.stream;
    } catch (error) {
      throw new Error(`Failed to access camera: ${error.message}`);
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }
  }

  captureFrame(canvas: HTMLCanvasElement): string | null {
    if (!this.video) return null;

    const context = canvas.getContext('2d');
    if (!context) return null;

    canvas.width = this.video.videoWidth;
    canvas.height = this.video.videoHeight;
    
    context.drawImage(this.video, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
}

export const webcamManager = new WebcamManager();
