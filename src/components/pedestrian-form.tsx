
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { User, Users, Building, Camera as CameraIcon, Trash2, AlertTriangle, RefreshCw, CheckCircle, BrainCircuit, Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Address, PedestrianRegistration } from "@/lib/definitions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Card } from "./ui/card";
import { getList } from "@/lib/listService";
import { getUserById } from "@/lib/userService";
import { extractFullName } from "@/ai/flows/extract-name-flow";


const formSchema = z.object({
  fullName: z.string().min(1, "El nombre completo es requerido."),
  visitorType: z.string().min(1, "El tipo de visitante es requerido."),
  address: z.string().min(1, "El domicilio es requerido."),
});

type PendingRegistration = {
    passId?: string;
    notificationId?: string;
    fullName: string;
    address: string;
    visitorType: string;
    visitorIdPhotoUrl?: string;
    residentStatus?: 'moroso' | 'al_corriente' | null;
} | null;

interface PedestrianFormProps {
    onSubmit: (values: z.infer<typeof formSchema>, photos: { visitorIdPhotoUrl?: string }) => void;
    availableAddresses: Address[];
    pendingRegistration: PendingRegistration;
    pastRegistrations: PedestrianRegistration[];
}

export function PedestrianForm({ onSubmit, availableAddresses, pendingRegistration, pastRegistrations }: PedestrianFormProps) {
  const { toast } = useToast();
  const [visitorTypes, setVisitorTypes] = useState<string[]>([]);
  const [visitorIdPhoto, setVisitorIdPhoto] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Frequent Visitor state
  const [nameSuggestions, setNameSuggestions] = useState<PedestrianRegistration[]>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [isFrequentVisitor, setIsFrequentVisitor] = useState(false);
  const [isAddressDisabled, setIsAddressDisabled] = useState(false);
  
  // OCR state
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [isOcrConfirmationOpen, setIsOcrConfirmationOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      visitorType: "",
      address: "",
    },
  });

  const isVerificationMode = !!pendingRegistration;
  const fullNameValue = form.watch("fullName");

  useEffect(() => {
    setVisitorTypes(getList('visitorTypes'));
  }, []);

  useEffect(() => {
    if (pendingRegistration) {
        form.reset({
            fullName: pendingRegistration.fullName,
            address: pendingRegistration.address,
            visitorType: pendingRegistration.visitorType,
        });
        setVisitorIdPhoto(pendingRegistration.visitorIdPhotoUrl || null);
    } else {
        form.reset();
        setVisitorIdPhoto(null);
        resetFrequentVisitorState();
    }
  }, [pendingRegistration, form]);

  // Handle name input for suggestions
  useEffect(() => {
    if (fullNameValue && fullNameValue.length > 2 && showNameSuggestions) {
        const uniqueVisitorsMap = new Map<string, PedestrianRegistration>();
        pastRegistrations.forEach(reg => {
            if (reg.fullName.toLowerCase().includes(fullNameValue.toLowerCase())) {
                if (!uniqueVisitorsMap.has(reg.fullName.toLowerCase())) {
                    uniqueVisitorsMap.set(reg.fullName.toLowerCase(), reg);
                }
            }
        });
        setNameSuggestions(Array.from(uniqueVisitorsMap.values()));
    } else {
        setNameSuggestions([]);
    }
  }, [fullNameValue, pastRegistrations, showNameSuggestions]);

  const resetFrequentVisitorState = () => {
    setIsFrequentVisitor(false);
    setVisitorIdPhoto(null);
    setIsAddressDisabled(false);
  };

  const handleFrequentVisitorSelect = (visitorData: PedestrianRegistration) => {
    form.setValue("fullName", visitorData.fullName, { shouldValidate: true });
    form.setValue("visitorType", visitorData.visitorType, { shouldValidate: true });
    form.setValue("address", visitorData.address, { shouldValidate: true });
    setVisitorIdPhoto(visitorData.visitorIdPhotoUrl || null);
    setShowNameSuggestions(false);
    setIsFrequentVisitor(true);

    const visitorUser = getUserById(visitorData.fullName);
    if (visitorUser && (visitorUser.role === 'Propietario' || visitorUser.role === 'Renta')) {
        const addressCount = (visitorUser.addressIds?.length || 0) + (visitorUser.addressId ? 1 : 0);
        if (addressCount === 1) {
            setIsAddressDisabled(true);
        } else {
            setIsAddressDisabled(false);
        }
    } else {
        setIsAddressDisabled(false);
    }
  };

  // Camera logic
  useEffect(() => {
    if (!isCameraOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      return;
    }

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
        setHasCameraPermission(true);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn(`Cámara con facingMode ${facingMode} no encontrada, intentando con cualquier cámara:`, err);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setHasCameraPermission(true);
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (finalErr) {
            console.error("Acceso a la cámara denegado:", finalErr);
            setHasCameraPermission(false);
            toast({ variant: "destructive", title: "Cámara no disponible", description: "Revisa los permisos de cámara en tu navegador." });
        }
      }
    };
    getCameraPermission();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOpen, toast, facingMode]);

  const handleCapture = async () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (!context) return;
        
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setVisitorIdPhoto(dataUrl);
        setIsCameraOpen(false);

        // Start OCR
        setIsOcrLoading(true);
        try {
            const result = await extractFullName({ photoDataUri: dataUrl });
            if (result.fullName) {
                setOcrResult(result.fullName);
                setIsOcrConfirmationOpen(true);
            } else {
                 toast({ variant: 'warning', title: "No se encontró nombre", description: "No se pudo leer un nombre en la imagen. Por favor, ingréselo manualmente."});
            }
        } catch (error) {
            console.error("Name OCR Error:", error);
            toast({ variant: 'destructive', title: "Error de OCR", description: "No se pudo procesar la imagen para extraer el nombre."});
        } finally {
            setIsOcrLoading(false);
        }
    }
  };
  
  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    if (!visitorIdPhoto) {
        toast({
            variant: 'destructive',
            title: 'Falta Foto',
            description: 'Debe tomar una foto de la identificación para registrar la entrada.'
        });
        return;
    }
    onSubmit(values, { visitorIdPhotoUrl: visitorIdPhoto });
    form.reset();
    setVisitorIdPhoto(null);
    resetFrequentVisitorState();
  };

  return (
    <>
    <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
             {pendingRegistration?.residentStatus === 'moroso' && (
                <Alert variant="warning">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Residente con Adeudo</AlertTitle>
                    <AlertDescription>
                        Este residente tiene un saldo pendiente. Proceda con el registro pero notifique a administración.
                    </AlertDescription>
                </Alert>
            )}
            {pendingRegistration?.residentStatus === 'al_corriente' && (
                <Alert variant="success">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Residente al Corriente</AlertTitle>
                    <AlertDescription>
                        El residente está al corriente con sus pagos.
                    </AlertDescription>
                </Alert>
            )}
            {isFrequentVisitor && (
                <Alert variant="warning">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>VISITANTE FRECUENTE</AlertTitle>
                    <AlertDescription>
                        Datos autocompletados. Por favor, verifique la información.
                    </AlertDescription>
                </Alert>
            )}
            <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="flex items-center gap-2"><User className="h-4 w-4" />Nombre Completo</FormLabel>
                <div className="relative">
                    <FormControl>
                    <Input 
                        placeholder="Escriba para buscar..."
                        {...field}
                        onFocus={() => setShowNameSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowNameSuggestions(false), 150)}
                        autoComplete="off"
                        disabled={isVerificationMode || isFrequentVisitor}
                        onChange={(e) => {
                            field.onChange(e);
                            resetFrequentVisitorState();
                        }}
                    />
                    </FormControl>
                    {showNameSuggestions && nameSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                            <ul className="py-1">
                                {nameSuggestions.map(visitor => (
                                    <li key={visitor.id} onMouseDown={() => handleFrequentVisitorSelect(visitor)} className="px-3 py-2 text-sm cursor-pointer hover:bg-accent">
                                        {visitor.fullName}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="visitorType"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="flex items-center gap-2"><Users className="h-4 w-4" />Tipo de Visitante</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isVerificationMode || isFrequentVisitor}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccione un tipo" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {visitorTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="flex items-center gap-2"><Building className="h-4 w-4" />Domicilio</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isVerificationMode || availableAddresses.length === 0 || isAddressDisabled}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder={availableAddresses.length > 0 ? "Seleccione un domicilio" : "No hay domicilios para el condominio"} />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {availableAddresses.map(address => (
                        <SelectItem key={address.id} value={address.fullAddress}>{address.fullAddress}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />

            <Card className="p-4 space-y-2">
                <FormLabel>Foto de Identificación (Obligatorio)</FormLabel>
                {visitorIdPhoto ? (
                    <div className="relative w-full aspect-video">
                        <Image src={visitorIdPhoto} alt="Vista previa de ID" layout="fill" className="object-cover rounded-md" />
                        <Button 
                            variant="destructive" 
                            size="icon" 
                            onClick={() => setVisitorIdPhoto(null)} 
                            className="absolute top-2 right-2 h-7 w-7"
                            disabled={isVerificationMode || isFrequentVisitor || isOcrLoading}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button type="button" variant="outline" className="w-full" onClick={() => setIsCameraOpen(true)} disabled={isOcrLoading}>
                            {isOcrLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CameraIcon className="mr-2 h-4 w-4"/>}
                            {isOcrLoading ? "Analizando..." : "Tomar Foto ID"}
                        </Button>
                    </div>
                )}
            </Card>

            <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" className="w-full">
                    Registrar Entrada
                </Button>
            </div>
        </form>
    </Form>

    <canvas ref={canvasRef} className="hidden" />
    <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Tomar Fotografía</DialogTitle>
                <DialogDescription>
                    Tome una foto clara de la identificación oficial del visitante.
                </DialogDescription>
            </DialogHeader>
            <div className="relative bg-muted rounded-md overflow-hidden aspect-video">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                {hasCameraPermission === false && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
                        <Alert variant="destructive">
                            <CameraIcon className="h-4 w-4" />
                            <AlertTitle>Cámara no disponible</AlertTitle>
                        </Alert>
                    </div>
                )}
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <div className="flex-1 flex gap-2">
                    <Button onClick={handleCapture} disabled={!hasCameraPermission} className="w-full">Capturar</Button>
                    <Button variant="outline" size="icon" onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')} disabled={!hasCameraPermission}>
                        <RefreshCw className="h-4 w-4"/>
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>
     <Dialog open={isOcrConfirmationOpen} onOpenChange={setIsOcrConfirmationOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Confirmar Nombre Detectado</DialogTitle>
                <DialogDescription>
                    La IA detectó el siguiente nombre. ¿Es correcto?
                </DialogDescription>
            </DialogHeader>
            <div className="my-4 p-4 bg-muted rounded-md border text-center font-semibold text-xl">
                {ocrResult}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => { setIsOcrConfirmationOpen(false); setIsCameraOpen(true); }}>
                    Intentar de Nuevo
                </Button>
                <Button onClick={() => {
                    if (ocrResult) {
                        form.setValue('fullName', ocrResult);
                    }
                    setIsOcrConfirmationOpen(false);
                }}>
                    Aceptar y Usar
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
