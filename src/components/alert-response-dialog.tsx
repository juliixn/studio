
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, User, Trees, Siren, Send } from 'lucide-react';
import Image from 'next/image';
import { Textarea } from './ui/textarea';
import type { AlertResponse } from '@/lib/definitions';
import { CameraCaptureDialog } from './camera-capture-dialog';

interface AlertResponseDialogProps {
  open: boolean;
  onResponse: (data: Omit<AlertResponse, 'id' | 'guardId' | 'guardName' | 'condominioId' | 'createdAt'>) => void;
  startTime: number;
}

export function AlertResponseDialog({ open, onResponse, startTime }: AlertResponseDialogProps) {
  const [step, setStep] = useState<'selfie' | 'environment' | 'review'>('selfie');
  const [selfiePhotoUrl, setSelfiePhotoUrl] = useState<string | null>(null);
  const [environmentPhotoUrl, setEnvironmentPhotoUrl] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const { toast } = useToast();
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    let audio: HTMLAudioElement | null = null;
    if (typeof window !== 'undefined') {
        audio = new Audio('/alarm.mp3');
        audio.loop = true;
        audioRef.current = audio;
    }
    return () => {
      if (audio) {
        audio.pause();
        audio.src = ''; 
      }
      audioRef.current = null;
    };
  }, []); 

  useEffect(() => {
    if (open) {
        setStep('selfie');
        const playPromise = audioRef.current?.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                if (error.name !== 'AbortError') {
                    console.error("Audio playback failed:", error);
                }
            });
        }
    } else {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0; 
        }
    }
  }, [open]);

  const handleSelfieCapture = (dataUrl: string) => {
    setSelfiePhotoUrl(dataUrl);
    setStep('environment');
  };

  const handleEnvironmentCapture = (dataUrl: string) => {
    setEnvironmentPhotoUrl(dataUrl);
    setStep('review');
  };

  const handleSubmit = () => {
    if (!selfiePhotoUrl || !environmentPhotoUrl || !comment.trim()) {
      toast({ variant: 'destructive', title: 'Faltan datos', description: 'Debe tomar ambas fotos y añadir un comentario.' });
      return;
    }
    
    const endTime = Date.now();
    const responseTimeSeconds = Math.round((endTime - startTime) / 1000);

    onResponse({ selfiePhotoUrl, environmentPhotoUrl, comment, responseTimeSeconds });
    
    setStep('selfie');
    setSelfiePhotoUrl(null);
    setEnvironmentPhotoUrl(null);
    setComment('');
  };

  const renderStep = () => {
    switch (step) {
      case 'selfie':
        return (
            <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">1. Tomar Selfie</h3>
                <p className="text-sm text-muted-foreground">Confirma tu identidad con una selfie.</p>
                <Button onClick={() => setIsCameraOpen(true)} size="lg" className="w-full">
                    <Camera className="mr-2 h-5 w-5" /> Abrir Cámara
                </Button>
            </div>
        );
      case 'environment':
        return (
            <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">2. Foto del Entorno</h3>
                <p className="text-sm text-muted-foreground">Muestra tu ubicación actual.</p>
                <Button onClick={() => setIsCameraOpen(true)} size="lg" className="w-full">
                    <Camera className="mr-2 h-5 w-5" /> Abrir Cámara
                </Button>
            </div>
        );
      case 'review':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">3. Revisión y Comentario</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <p className="text-sm font-medium text-center flex items-center justify-center gap-2"><User className="h-4 w-4" />Selfie</p>
                 <Image src={selfiePhotoUrl!} alt="Selfie" width={200} height={150} className="rounded-md object-cover mx-auto" />
                 <Button variant="outline" size="sm" className="w-full" onClick={() => setStep('selfie')}>
                    Tomar de Nuevo
                 </Button>
              </div>
              <div className="space-y-2">
                 <p className="text-sm font-medium text-center flex items-center justify-center gap-2"><Trees className="h-4 w-4" />Entorno</p>
                 <Image src={environmentPhotoUrl!} alt="Entorno" width={200} height={150} className="rounded-md object-cover mx-auto" />
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setStep('environment')}>
                    Tomar de Nuevo
                 </Button>
              </div>
            </div>
            <div>
              <label htmlFor="comment" className="text-sm font-medium">Actividad Actual</label>
              <Textarea 
                id="comment"
                placeholder="Ej: Realizando rondín en área de juegos. Todo en orden."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={handleSubmit} className="w-full" size="lg">
                <Send className="mr-2 h-5 w-5" /> Enviar Reporte
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
        <Dialog open={open} modal={true}>
            <DialogContent className="sm:max-w-md" hideCloseButton={true}>
                <div className="flex flex-col items-center justify-center text-center p-4">
                <Siren className="h-16 w-16 text-destructive animate-pulse mb-4" />
                <h2 className="text-2xl font-bold text-destructive">¡ALERTA DE VIGILANCIA!</h2>
                <p className="text-muted-foreground">Responda inmediatamente para confirmar su estado.</p>
                </div>
                <div className="p-4 border-t border-destructive/20">
                    {renderStep()}
                </div>
            </DialogContent>
        </Dialog>
        <CameraCaptureDialog 
            isOpen={isCameraOpen}
            onClose={() => setIsCameraOpen(false)}
            onCapture={step === 'selfie' ? handleSelfieCapture : handleEnvironmentCapture}
            title={step === 'selfie' ? 'Tomar Selfie' : 'Foto del Entorno'}
            description={step === 'selfie' ? 'Apunta la cámara frontal hacia ti.' : 'Muestra una foto de tu ubicación actual.'}
        />
    </>
  );
}
