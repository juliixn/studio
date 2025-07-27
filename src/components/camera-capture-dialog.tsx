
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Camera, RefreshCw } from "lucide-react";
import { Loader2 } from "lucide-react";

interface CameraCaptureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
  title: string;
  description: string;
}

export function CameraCaptureDialog({ isOpen, onClose, onCapture, title, description }: CameraCaptureDialogProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopStream();
      return;
    }

    const getCameraPermission = async () => {
      setIsLoading(true);
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        
        if (videoInputs.length === 0) {
            toast({ variant: "destructive", title: "Cámara no disponible", description: "No se encontraron cámaras." });
            setHasPermission(false);
            return;
        }

        setVideoDevices(videoInputs);
        const currentDeviceId = videoInputs[currentDeviceIndex % videoInputs.length].deviceId;
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { deviceId: { exact: currentDeviceId } } 
        });

        setHasPermission(true);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setHasPermission(false);
        toast({ variant: "destructive", title: "Cámara no disponible", description: "Revisa los permisos de cámara en tu navegador." });
      } finally {
        setIsLoading(false);
      }
    };

    getCameraPermission();
    
    return () => {
        stopStream();
    }
  }, [isOpen, currentDeviceIndex, stopStream, toast]);

  const handleCycleCamera = () => {
    setCurrentDeviceIndex(prevIndex => (prevIndex + 1) % (videoDevices.length || 1));
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onCapture(dataUrl);
        onClose();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="relative bg-muted rounded-md overflow-hidden aspect-video">
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-8 w-8 text-white animate-spin"/>
            </div>
          )}
          {hasPermission === false && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Alert variant="destructive">
                <Camera className="h-4 w-4" />
                <AlertTitle>Cámara no disponible</AlertTitle>
              </Alert>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <div className="flex-1 flex gap-2">
            <Button onClick={handleCapture} disabled={!hasPermission || isLoading} className="w-full">Capturar</Button>
            <Button variant="outline" size="icon" onClick={handleCycleCamera} disabled={!hasPermission || isLoading || videoDevices.length < 2}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </DialogFooter>
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}
