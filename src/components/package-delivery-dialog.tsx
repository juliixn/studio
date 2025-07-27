
"use client";

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Package } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { Camera, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import SignaturePad, { SignaturePadRef } from './signature-pad';
import { Input } from './ui/input';
import { CameraCaptureDialog } from './camera-capture-dialog';

interface PackageDeliveryDialogProps {
  pkg: Package;
  onConfirm: (packageId: string, photoUrl: string, signatureUrl: string, deliveredToName: string) => void;
  onClose: () => void;
}

export function PackageDeliveryDialog({ pkg, onConfirm, onClose }: PackageDeliveryDialogProps) {
  const { toast } = useToast();
  
  const [step, setStep] = useState<'signature' | 'photo'>('signature');
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [deliveredToName, setDeliveredToName] = useState('');
  
  const signaturePadRef = useRef<SignaturePadRef>(null);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  React.useEffect(() => {
    setStep('signature');
    setSignatureUrl(null);
    setPhotoUrl(null);
    setDeliveredToName('');
    signaturePadRef.current?.clear();
  }, [pkg]);
  
  const handleConfirmSignature = () => {
    const sigData = signaturePadRef.current?.getSignature();
    if (!sigData) {
      toast({ variant: 'destructive', title: 'Firma Requerida', description: 'Por favor, solicite una firma para continuar.' });
      return;
    }
    setSignatureUrl(sigData);
    setStep('photo');
  };

  const handleFinalConfirm = () => {
    if (!deliveredToName.trim()) {
      toast({ variant: 'destructive', title: 'Falta Nombre', description: 'Por favor, anote el nombre de quien recibe.' });
      return;
    }
    if (!photoUrl) {
      toast({ variant: 'destructive', title: 'Falta Fotografía', description: 'Por favor, tome una foto como prueba de entrega.' });
      return;
    }
    if (!signatureUrl) {
        toast({ variant: 'destructive', title: 'Falta Firma', description: 'Error inesperado, falta la firma.' });
        return;
    }
    onConfirm(pkg.id, photoUrl, signatureUrl, deliveredToName);
  };
  
  return (
    <>
      <DialogContent className="sm:max-w-xl">
        {step === 'signature' && (
          <>
            <DialogHeader>
              <DialogTitle>Paso 1: Firma de Recibido</DialogTitle>
              <DialogDescription>
                Para: {pkg.recipientName} ({pkg.recipientAddress}).<br/>
                Solicite la firma de la persona que recibe el paquete.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="h-48 w-full border rounded-md bg-white">
                <SignaturePad ref={signaturePadRef} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button variant="ghost" onClick={() => signaturePadRef.current?.clear()}><RefreshCw className="mr-2 h-4 w-4" />Otra Vez</Button>
              <Button onClick={handleConfirmSignature}>Confirmar Firma</Button>
            </DialogFooter>
          </>
        )}
        {step === 'photo' && (
          <>
             <DialogHeader>
              <DialogTitle>Paso 2: Prueba Fotográfica y Nombre</DialogTitle>
              <DialogDescription>Tome una foto de la ID junto al paquete y anote el nombre.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Nombre de quien recibe</label>
                    <Input
                        placeholder="Ej: Juan Pérez (Titular), Ana G. (Familiar)"
                        value={deliveredToName}
                        onChange={(e) => setDeliveredToName(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Prueba Fotográfica</label>
                    <div className="relative w-full aspect-video border rounded-md bg-muted flex items-center justify-center">
                        {photoUrl ? (
                            <>
                                <Image src={photoUrl} alt="Prueba de entrega" fill className="object-contain" />
                                <Button variant="secondary" size="sm" onClick={() => setIsCameraOpen(true)} className="absolute bottom-2 left-2">
                                    <RefreshCw className="mr-2 h-4 w-4" /> Otra Vez
                                </Button>
                            </>
                        ) : (
                            <Button variant="outline" onClick={() => setIsCameraOpen(true)}>
                                <Camera className="mr-2 h-4 w-4" /> Tomar Foto
                            </Button>
                        )}
                    </div>
                </div>
            </div>
             <DialogFooter>
              <Button variant="outline" onClick={() => setStep('signature')}>Volver a Firma</Button>
              <Button onClick={handleFinalConfirm}>Confirmar Entrega</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
      <CameraCaptureDialog
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => setPhotoUrl(dataUrl)}
        title="Tomar Foto de Entrega"
        description="Tome una foto de la identificación junto al paquete."
      />
    </>
  );
}
