
"use client";

import { useRef, useEffect, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Zap, RefreshCw } from 'lucide-react';
import { playSound } from '@/lib/soundService';

interface QrScannerProps {
    onScan: (data: string) => void;
}

export default function QrScanner({ onScan }: QrScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const requestRef = useRef<number>();
    
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isScanning, setIsScanning] = useState(true);
    const [scanStatus, setScanStatus] = useState<'idle' | 'success'>('idle');
    const [isTorchSupported, setIsTorchSupported] = useState(false);
    const [isTorchOn, setIsTorchOn] = useState(false);
    const { toast } = useToast();

    const handleScanSuccess = useCallback((data: string) => {
        setIsScanning(false);
        setScanStatus('success');
        playSound('success');
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }
        onScan(data);
        setTimeout(() => {
            setScanStatus('idle');
            setIsScanning(true);
        }, 3000);
    }, [onScan]);

    const tick = useCallback(() => {
        if (!isScanning || !videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
            requestRef.current = requestAnimationFrame(tick);
            return;
        }
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return;
        
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
        });

        if (code) {
            handleScanSuccess(code.data);
        }
        
        requestRef.current = requestAnimationFrame(tick);
    }, [isScanning, handleScanSuccess]);

    const handleToggleTorch = async () => {
        if (!streamRef.current || !isTorchSupported) return;
        const track = streamRef.current.getVideoTracks()[0];
        try {
            await track.applyConstraints({
                advanced: [{ torch: !isTorchOn }]
            });
            setIsTorchOn(!isTorchOn);
        } catch (err) {
            console.error('Error toggling torch:', err);
            toast({ variant: 'destructive', title: 'Error de Linterna', description: 'No se pudo activar la linterna.' });
        }
    };
    
    const handleToggleCamera = () => {
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    };

    useEffect(() => {
        const startCamera = async () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
                setHasPermission(true);
                streamRef.current = stream;

                const track = stream.getVideoTracks()[0];
                const capabilities = track.getCapabilities();
                if ('torch' in capabilities) {
                    setIsTorchSupported(true);
                }

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                    requestRef.current = requestAnimationFrame(tick);
                }
            } catch (error) {
                console.error('Error de acceso a la cámara:', error);
                setHasPermission(false);
                toast({
                    variant: 'destructive',
                    title: 'Acceso a la cámara denegado',
                    description: 'Por favor, habilita los permisos de la cámara en tu navegador.',
                });
            }
        };

        startCamera();
        
        return () => {
             if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        }
    }, [toast, tick, facingMode]);

    return (
        <div className="relative w-full max-w-md mx-auto aspect-video bg-black rounded-md overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline />
            <canvas ref={canvasRef} className="hidden" />
            
            {hasPermission === false && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                     <Alert variant="destructive">
                        <AlertTitle>Cámara no disponible</AlertTitle>
                        <AlertDescription>
                            Revisa los permisos de la cámara.
                        </AlertDescription>
                    </Alert>
                </div>
            )}
            
            <div className={cn(
                "absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-300",
                scanStatus === 'success' && 'bg-green-500/30'
            )}>
                <div className={cn(
                    "w-3/4 h-1/2 border-4 rounded-lg transition-all duration-300",
                    scanStatus === 'idle' && "border-white/50",
                    scanStatus === 'success' && "border-green-400 scale-105"
                )} />
            </div>
            
            <div className="absolute bottom-4 flex w-full justify-center items-center gap-4">
                {isTorchSupported && (
                    <Button 
                        size="icon" 
                        variant={isTorchOn ? "default" : "outline"} 
                        onClick={handleToggleTorch}
                        aria-label="Toggle Flashlight"
                    >
                        <Zap className="h-5 w-5" />
                    </Button>
                )}
                 <Button 
                    size="icon" 
                    variant="outline" 
                    onClick={handleToggleCamera}
                    aria-label="Toggle Camera"
                >
                    <RefreshCw className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}
