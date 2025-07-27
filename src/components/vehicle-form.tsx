
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Car, ClipboardList, User, Users, Palette, Building, CarFront, AlertTriangle, Camera as CameraIcon, Trash2, RefreshCw, CheckCircle, BrainCircuit, Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Address, VehicularRegistration, User as UserType } from "@/lib/definitions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Card } from "./ui/card";
import { extractLicensePlate } from "@/ai/flows/extract-plate-flow";
import { extractFullName } from "@/ai/flows/extract-name-flow";
import { analyzeVehicle, type AnalyzeVehicleOutput } from "@/ai/flows/analyze-vehicle-flow";
import { getList, updateList } from "@/lib/listService";
import { getUserById } from "@/lib/userService";
import { addPeticion } from "@/lib/peticionService";
import { Badge } from "./ui/badge";


const formSchema = z.object({
  licensePlate: z.string().min(1, "Las placas son requeridas."),
  fullName: z.string().min(1, "El nombre completo es requerido."),
  visitorType: z.string().min(1, "El tipo de visitante es requerido."),
  providerType: z.string().optional(),
  employeeType: z.string().optional(),
  vehicleType: z.string().min(1, "El tipo de vehículo es requerido."),
  vehicleBrand: z.string().min(1, "La marca del vehículo es requerida."),
  vehicleColor: z.string().min(1, "El color del vehículo es requerido."),
  address: z.string().min(1, "El domicilio es requerido."),
});

type PendingRegistration = {
    passId?: string;
    notificationId?: string;
    fullName: string;
    address: string;
    visitorType: string;
    licensePlate?: string;
    vehicleType?: string;
    vehicleBrand?: string;
    vehicleColor?: string;
    visitorIdPhotoUrl?: string;
    vehiclePhotoUrl?: string;
    residentStatus?: 'moroso' | 'al_corriente' | null;
} | null;

interface VehicleFormProps {
    onSubmit: (values: z.infer<typeof formSchema>, photos: { visitorIdPhotoUrl?: string, vehiclePhotoUrl?: string }) => void;
    availableAddresses: Address[];
    pendingRegistration: PendingRegistration;
    pastRegistrations: VehicularRegistration[];
}

const vehicleTypeImages: Record<string, { url: string; hint: string }> = {
  'Automóvil Compacto': { url: 'https://i.postimg.cc/Qd1FrHh7/compacto.png', hint: 'compact car blueprint' },
  'Automóvil Sedán': { url: 'https://i.postimg.cc/sX1k1bJj/sedan.png', hint: 'sedan car blueprint' },
  'SUV': { url: 'https://i.postimg.cc/kG7G0G0K/suv.png', hint: 'suv car blueprint' },
  'Camioneta Pick-Up': { url: 'https://i.postimg.cc/tCNxS22N/pickup.png', hint: 'pickup truck blueprint' },
  'Motocicleta': { url: 'https://i.postimg.cc/s26pXN3v/moto.png', hint: 'motorcycle blueprint' },
  'Van': { url: 'https://i.postimg.cc/PqYJ1Jq0/van.png', hint: 'van blueprint' },
  'Camión': { url: 'https://i.postimg.cc/G2g5T25V/truck.png', hint: 'truck blueprint' },
};


export function VehicleForm({ onSubmit, availableAddresses, pendingRegistration, pastRegistrations }: VehicleFormProps) {
  const { toast } = useToast();
  // State for plate search suggestions
  const [plateSuggestions, setPlateSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const lastProcessedPlate = useRef<string | null>(null);

  // Dynamic lists from service
  const [vehicleVisitorTypes, setVehicleVisitorTypes] = useState<string[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [vehicleBrands, setVehicleBrands] = useState<string[]>([]);
  const [vehicleColors, setVehicleColors] = useState<string[]>([]);
  const [providerTypes, setProviderTypes] = useState<string[]>([]);
  const [employeeTypes, setEmployeeTypes] = useState<string[]>([]);

  // State for frequent visitor logic
  const [isFrequentVisitor, setIsFrequentVisitor] = useState(false);
  const [frequentVisitors, setFrequentVisitors] = useState<VehicularRegistration[]>([]);
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);
  const [isNewVisitorMode, setIsNewVisitorMode] = useState(false);
  const [isAddressDisabled, setIsAddressDisabled] = useState(false);

  // Photo states
  const [visitorIdPhoto, setVisitorIdPhoto] = useState<string | null>(null);
  const [vehiclePhoto, setVehiclePhoto] = useState<string | null>(null);
  
  // OCR & Camera states
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [vehicleOcrResult, setVehicleOcrResult] = useState<AnalyzeVehicleOutput | null>(null);
  const [isOcrConfirmationOpen, setIsOcrConfirmationOpen] = useState(false);
  const [isVehicleOcrConfirmationOpen, setIsVehicleOcrConfirmationOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<'id' | 'vehicle' | 'plate' | null>(null);
  
  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      licensePlate: "",
      fullName: "",
      visitorType: "",
      providerType: "",
      employeeType: "",
      vehicleType: "",
      vehicleBrand: "",
      vehicleColor: "",
      address: "",
    },
  });
  
  const isVerificationMode = !!pendingRegistration;
  const licensePlateValue = form.watch("licensePlate");
  const visitorTypeValue = form.watch("visitorType");
  const selectedVehicleType = form.watch("vehicleType");

  useEffect(() => {
    setVehicleVisitorTypes(getList('vehicleVisitorTypes'));
    setVehicleTypes(getList('vehicleTypes'));
    setVehicleBrands(getList('vehicleBrands'));
    setVehicleColors(getList('vehicleColors'));
    setProviderTypes(getList('providerTypes'));
    setEmployeeTypes(getList('employeeTypes'));
  }, []);

  const resetFrequentVisitorState = () => {
    setIsFrequentVisitor(false);
    setFrequentVisitors([]);
    setIsNewVisitorMode(false);
    setSelectedVisitorId(null);
    setVisitorIdPhoto(null);
    setVehiclePhoto(null);
    setIsAddressDisabled(false);
  };

  useEffect(() => {
    if (pendingRegistration) {
        form.reset({
            fullName: pendingRegistration.fullName,
            address: pendingRegistration.address,
            visitorType: pendingRegistration.visitorType,
            licensePlate: pendingRegistration.licensePlate || "",
            vehicleType: pendingRegistration.vehicleType || "",
            vehicleBrand: pendingRegistration.vehicleBrand || "",
            vehicleColor: pendingRegistration.vehicleColor || "",
        });
        setVisitorIdPhoto(pendingRegistration.visitorIdPhotoUrl || null);
        setVehiclePhoto(pendingRegistration.vehiclePhotoUrl || null);
    } else {
        form.reset();
        resetFrequentVisitorState();
    }
  }, [pendingRegistration, form]);

  // Handle plate input: show suggestions
  useEffect(() => {
    const currentPlate = licensePlateValue?.toUpperCase();
    if (currentPlate && currentPlate.length > 0 && showSuggestions) {
      const uniquePlates = [...new Set(pastRegistrations.map(reg => reg.licensePlate.toUpperCase()))];
      const matches = uniquePlates.filter(plate => plate.startsWith(currentPlate));
      setPlateSuggestions(matches);
    } else {
      setPlateSuggestions([]);
    }
  }, [licensePlateValue, pastRegistrations, showSuggestions]);

  // When a full plate is selected, determine if it's a frequent visitor
  const handlePlateFinalized = (plate: string) => {
    if (!plate || plate.toUpperCase() === lastProcessedPlate.current) return;
    
    lastProcessedPlate.current = plate.toUpperCase();
    resetFrequentVisitorState(); // Reset previous state
    form.setValue('licensePlate', plate); // Ensure form has the selected plate

    const allRegistrations = [...pastRegistrations].sort(
      (a, b) => new Date(b.entryTimestamp).getTime() - new Date(a.entryTimestamp).getTime()
    );

    const plateMatches = allRegistrations.filter(reg => reg.licensePlate.toUpperCase() === plate.toUpperCase());
    
    if (plateMatches.length > 0) {
        setIsFrequentVisitor(true);
        const mostRecentReg = plateMatches[0];
        
        // Autofill vehicle data
        form.setValue("vehicleType", mostRecentReg.vehicleType, { shouldValidate: true });
        form.setValue("vehicleBrand", mostRecentReg.vehicleBrand, { shouldValidate: true });
        form.setValue("vehicleColor", mostRecentReg.vehicleColor, { shouldValidate: true });
        setVehiclePhoto(mostRecentReg.vehiclePhotoUrl || null);
        
        // Find unique drivers for this plate
        const uniqueVisitorsMap = new Map<string, VehicularRegistration>();
        plateMatches.forEach(reg => {
            if (!uniqueVisitorsMap.has(reg.fullName)) {
              uniqueVisitorsMap.set(reg.fullName, reg);
            }
        });
        
        const uniqueVisitors = Array.from(uniqueVisitorsMap.values());
        setFrequentVisitors(uniqueVisitors);

        if (uniqueVisitors.length === 1) {
            handleFrequentVisitorSelect(uniqueVisitors[0]);
        }
    }
    setShowSuggestions(false);
  };
  
  // Autofill form when a specific frequent visitor is chosen from the dropdown
  const handleFrequentVisitorSelect = (visitorData: VehicularRegistration) => {
    if (!visitorData) return;
    form.setValue("fullName", visitorData.fullName, { shouldValidate: true });
    form.setValue("visitorType", visitorData.visitorType, { shouldValidate: true });
    form.setValue("address", visitorData.address, { shouldValidate: true });
    form.setValue("providerType", visitorData.providerType, { shouldValidate: true });
    form.setValue("employeeType", visitorData.employeeType, { shouldValidate: true });
    setVisitorIdPhoto(visitorData.visitorIdPhotoUrl || null);
    setSelectedVisitorId(visitorData.id);
    setIsNewVisitorMode(false);

    // New logic for disabling address field
    const visitorUser = getUserById(visitorData.fullName); // Assuming fullName is unique enough for mock
    if (visitorUser && (visitorUser.role === 'Propietario' || visitorUser.role === 'Renta')) {
      const addressCount = visitorUser.addressIds?.length || (visitorUser.addressId ? 1 : 0);
      if (addressCount === 1) {
        setIsAddressDisabled(true);
      } else {
        setIsAddressDisabled(false);
      }
    } else {
      setIsAddressDisabled(false);
    }
  };
  
  const handleNewVisitorForPlate = () => {
    const mostRecentReg = frequentVisitors[0]; // Assumes sorted by date
    form.setValue("fullName", "", { shouldValidate: true });
    form.setValue("visitorType", "Visitante", { shouldValidate: true });
    form.setValue("address", mostRecentReg.address, { shouldValidate: true });
    
    setVisitorIdPhoto(null); // REQUIRE new ID photo
    setIsNewVisitorMode(true);
    setSelectedVisitorId('new-visitor');
    setIsAddressDisabled(false);
  };

  // Camera Effects
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
  }, [isCameraOpen, cameraMode, toast, facingMode]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    if (!visitorIdPhoto || !vehiclePhoto) {
        toast({
            variant: 'destructive',
            title: 'Faltan Fotos',
            description: 'Debe tomar una foto de la identificación y del vehículo para registrar la entrada.'
        });
        return;
    }
    onSubmit(values, { visitorIdPhotoUrl: visitorIdPhoto, vehiclePhotoUrl: vehiclePhoto });
    form.reset();
    resetFrequentVisitorState();
    lastProcessedPlate.current = null;
  };

  const openCamera = (mode: 'id' | 'vehicle' | 'plate') => {
    setCameraMode(mode);
    setIsCameraOpen(true);
  };

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
        setIsCameraOpen(false);

        setIsOcrLoading(true);
        try {
            if (cameraMode === 'plate') {
                const result = await extractLicensePlate({ photoDataUri: dataUrl });
                if (result.licensePlate) {
                    setOcrResult(result.licensePlate);
                    setIsOcrConfirmationOpen(true);
                } else {
                    toast({ variant: 'warning', title: "No se encontró placa", description: "No se pudo leer una placa en la imagen. Por favor, ingrésela manualmente."});
                }
            } else if (cameraMode === 'id') {
                setVisitorIdPhoto(dataUrl);
                const result = await extractFullName({ photoDataUri: dataUrl });
                if (result.fullName) {
                    setOcrResult(result.fullName);
                    setIsOcrConfirmationOpen(true);
                } else {
                    toast({ variant: 'warning', title: "No se encontró nombre", description: "No se pudo leer un nombre en la imagen. Por favor, ingréselo manualmente."});
                }
            } else if (cameraMode === 'vehicle') {
                setVehiclePhoto(dataUrl);
                const result = await analyzeVehicle({ photoDataUri: dataUrl });
                if (result.brand || result.color || result.type) {
                  setVehicleOcrResult(result);
                  setIsVehicleOcrConfirmationOpen(true);
                } else {
                  toast({ variant: 'warning', title: "Análisis incompleto", description: "No se pudieron identificar todos los rasgos del vehículo."});
                }
            }
        } catch (error) {
            console.error("AI Analysis Error:", error);
            toast({ variant: 'destructive', title: "Error de IA", description: "No se pudo procesar la imagen."});
        } finally {
            setIsOcrLoading(false);
        }
    }
  };

  const handleVehicleOcrConfirm = () => {
      if (!vehicleOcrResult) return;

      const { type, brand, color } = vehicleOcrResult;
      const newItems: {key: 'vehicleTypes' | 'vehicleBrands' | 'vehicleColors', value: string, name: string}[] = [];

      if (type && !vehicleTypes.includes(type)) {
          newItems.push({ key: 'vehicleTypes', value: type, name: 'Tipo de Vehículo' });
      }
      if (brand && !vehicleBrands.includes(brand)) {
          newItems.push({ key: 'vehicleBrands', value: brand, name: 'Marca' });
      }
      if (color && !vehicleColors.includes(color)) {
          newItems.push({ key: 'vehicleColors', value: color, name: 'Color' });
      }

      if (newItems.length > 0) {
          let description = 'Se añadieron nuevos elementos a las listas:';
          newItems.forEach(item => {
              const currentList = getList(item.key);
              updateList(item.key, [...currentList, item.value]);
              description += `\n- ${item.name}: ${item.value}`;
          });

          // Notify admin via a peticion
          addPeticion({
              title: "Nuevo Elemento Añadido a Listas",
              description: description,
              creatorId: 'system-ai',
              creatorName: 'Sistema (IA)',
              creatorRole: 'Administrador',
              condominioId: 'all',
              condominioName: 'Sistema General',
              category: 'General'
          });
          
          toast({
              title: "Listas Actualizadas",
              description: `Se han añadido ${newItems.length} nuevo(s) elemento(s) a las listas de vehículos.`
          });
          // Refresh local lists
          setVehicleTypes(getList('vehicleTypes'));
          setVehicleBrands(getList('vehicleBrands'));
          setVehicleColors(getList('vehicleColors'));
      }

      form.setValue('vehicleType', type);
      form.setValue('vehicleBrand', brand);
      form.setValue('vehicleColor', color);
      setIsVehicleOcrConfirmationOpen(false);
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
        {isVerificationMode && !pendingRegistration?.residentStatus && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>VERIFICANDO PASE QR</AlertTitle>
            <AlertDescription>
                Confirme que los datos y fotos coinciden con el visitante y el vehículo.
            </AlertDescription>
          </Alert>
        )}
        {isFrequentVisitor && !isVerificationMode && (
          <Alert variant="warning" className="sm:col-span-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>VEHÍCULO FRECUENTE</AlertTitle>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="licensePlate"
          render={({ field }) => (
              <FormItem>
              <FormLabel className="flex items-center gap-2"><ClipboardList className="h-4 w-4" />Placas Vehiculares</FormLabel>
              <div className="relative">
                  <div className="flex gap-2">
                      <FormControl>
                          <Input 
                              placeholder="Escriba para buscar..." 
                              {...field}
                              onFocus={() => setShowSuggestions(true)}
                              onBlur={(e) => {
                              setTimeout(() => {
                                  setShowSuggestions(false);
                                  handlePlateFinalized(e.target.value);
                              }, 150);
                              }}
                              autoComplete="off"
                              disabled={isVerificationMode || isOcrLoading}
                              onChange={(e) => {
                                  const sanitizedValue = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                                  field.onChange(sanitizedValue);
                                  if (lastProcessedPlate.current) {
                                      form.reset({ licensePlate: sanitizedValue });
                                      resetFrequentVisitorState();
                                      lastProcessedPlate.current = null;
                                  }
                              }}
                          />
                      </FormControl>
                      <Button type="button" variant="outline" size="icon" onClick={() => openCamera('plate')} disabled={isOcrLoading}>
                         {isOcrLoading && cameraMode==='plate' ? <Loader2 className="h-4 w-4 animate-spin"/> : <CameraIcon className="h-4 w-4" />}
                      </Button>
                  </div>
                  {showSuggestions && plateSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                      <ul className="py-1">
                      {plateSuggestions.map(plate => (
                          <li key={plate} onMouseDown={() => {
                            form.setValue('licensePlate', plate);
                            handlePlateFinalized(plate);
                          }} className="px-3 py-2 text-sm cursor-pointer hover:bg-accent">
                          {plate}
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
        
        <Card className="p-4 space-y-4">
            <h3 className="font-medium text-sm">Evidencia Fotográfica (Obligatorio)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <FormLabel>Foto de Identificación</FormLabel>
                    {visitorIdPhoto ? (
                        <div className="relative w-full aspect-video">
                            <Image src={visitorIdPhoto} alt="Vista previa de ID" layout="fill" className="object-cover rounded-md" />
                            <Button 
                                variant="destructive" 
                                size="icon" 
                                onClick={() => setVisitorIdPhoto(null)} 
                                className="absolute top-2 right-2 h-7 w-7"
                                disabled={isVerificationMode || (isFrequentVisitor && !isNewVisitorMode) || isOcrLoading}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                         <div className="flex flex-col sm:flex-row gap-2">
                            <Button type="button" variant="outline" className="w-full" onClick={() => openCamera('id')} disabled={isOcrLoading}>
                                {isOcrLoading && cameraMode === 'id' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CameraIcon className="mr-2 h-4 w-4"/>}
                                {isOcrLoading && cameraMode === 'id' ? "Analizando..." : "Tomar Foto ID"}
                            </Button>
                        </div>
                    )}
                    {isNewVisitorMode && (
                        <FormDescription className="text-destructive text-xs flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Se requiere nueva foto para el nuevo conductor.
                        </FormDescription>
                    )}
                </div>
                 <div className="space-y-2">
                    <FormLabel>Foto del Vehículo</FormLabel>
                    {vehiclePhoto ? (
                        <div className="relative w-full aspect-video">
                            <Image src={vehiclePhoto} alt="Vista previa del vehículo" layout="fill" className="object-cover rounded-md" />
                             <Button 
                                variant="destructive" 
                                size="icon" 
                                onClick={() => setVehiclePhoto(null)} 
                                className="absolute top-2 right-2 h-7 w-7"
                                disabled={isVerificationMode || isFrequentVisitor || isOcrLoading}
                             >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                         <div className="flex flex-col sm:flex-row gap-2">
                            <Button type="button" variant="outline" className="w-full" onClick={() => openCamera('vehicle')} disabled={isOcrLoading}>
                                {isOcrLoading && cameraMode === 'vehicle' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CameraIcon className="mr-2 h-4 w-4"/>}
                                {isOcrLoading && cameraMode === 'vehicle' ? "Analizando..." : "Tomar Foto Vehículo"}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="flex items-center gap-2"><User className="h-4 w-4" />Nombre Completo</FormLabel>
                {isFrequentVisitor && !isNewVisitorMode ? (
                    <Select
                    onValueChange={(value) => {
                        if (value === 'new-visitor') {
                          handleNewVisitorForPlate();
                        } else {
                          const selected = frequentVisitors.find(v => v.id === value);
                          if (selected) {
                            handleFrequentVisitorSelect(selected);
                          }
                        }
                    }}
                    value={selectedVisitorId || ''}
                    disabled={isVerificationMode}
                    >
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Seleccione un conductor..." />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {frequentVisitors.map(visitor => (
                        <SelectItem key={visitor.id} value={visitor.id}>{visitor.fullName}</SelectItem>
                        ))}
                        <SelectItem value="new-visitor" className="text-primary">Registrar nuevo visitante</SelectItem>
                    </SelectContent>
                    </Select>
                ) : (
                    <FormControl>
                    <Input placeholder="John Doe" {...field} disabled={isVerificationMode || (isFrequentVisitor && !isNewVisitorMode)} />
                    </FormControl>
                )}
                {isFrequentVisitor && selectedVisitorId && !isNewVisitorMode && <FormDescription className="text-amber-600 dark:text-amber-500 text-xs">Campo autocompletado.</FormDescription>}
                {isNewVisitorMode && <FormDescription className="text-primary text-xs">Ingrese el nombre del nuevo visitante.</FormDescription>}
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
                    {vehicleVisitorTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                {isFrequentVisitor && selectedVisitorId && !isNewVisitorMode && <FormDescription className="text-amber-600 dark:text-amber-500 text-xs">Campo autocompletado.</FormDescription>}
                <FormMessage />
                </FormItem>
            )}
            />

            {visitorTypeValue === 'Proveedor' && (
                <FormField
                    control={form.control}
                    name="providerType"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2"><Users className="h-4 w-4" />Tipo de Proveedor</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isVerificationMode || (isFrequentVisitor && !isNewVisitorMode)}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccione tipo de proveedor" /></SelectTrigger></FormControl>
                            <SelectContent>{providerTypes.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}

            {visitorTypeValue === 'Empleado' && (
                <FormField
                    control={form.control}
                    name="employeeType"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2"><Users className="h-4 w-4" />Tipo de Empleado</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isVerificationMode || (isFrequentVisitor && !isNewVisitorMode)}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccione tipo de empleado" /></SelectTrigger></FormControl>
                            <SelectContent>{employeeTypes.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}

            <FormField
            control={form.control}
            name="vehicleType"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="flex items-center gap-2"><Car className="h-4 w-4" />Tipo de Vehículo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isVerificationMode || isFrequentVisitor}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccione un tipo" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {vehicleTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                 {isFrequentVisitor && <FormDescription className="text-amber-600 dark:text-amber-500 text-xs">Campo autocompletado.</FormDescription>}
                {selectedVehicleType && vehicleTypeImages[selectedVehicleType] && (
                    <div className="mt-2 p-2 border rounded-md bg-muted/30 relative aspect-[4/3]">
                        <Image 
                            src={vehicleTypeImages[selectedVehicleType].url}
                            alt={`Ejemplo de ${selectedVehicleType}`}
                            layout="fill"
                            objectFit="contain"
                            className="w-full h-auto"
                            data-ai-hint={vehicleTypeImages[selectedVehicleType].hint}
                        />
                    </div>
                )}
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="vehicleBrand"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="flex items-center gap-2"><CarFront className="h-4 w-4" />Marca de Vehículo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isVerificationMode || isFrequentVisitor}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccione una marca" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {vehicleBrands.map(brand => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                {isFrequentVisitor && <FormDescription className="text-amber-600 dark:text-amber-500 text-xs">Campo autocompletado.</FormDescription>}
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="vehicleColor"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="flex items-center gap-2"><Palette className="h-4 w-4" />Color de Vehículo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isVerificationMode || isFrequentVisitor}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccione un color" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {vehicleColors.map(color => (
                        <SelectItem key={color} value={color}>{color}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                {isFrequentVisitor && <FormDescription className="text-amber-600 dark:text-amber-500 text-xs">Campo autocompletado.</FormDescription>}
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
                {isFrequentVisitor && selectedVisitorId && !isNewVisitorMode && <FormDescription className="text-amber-600 dark:text-amber-500 text-xs">Campo autocompletado.</FormDescription>}
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="sm:col-span-2 flex justify-end pt-4">
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
                    {cameraMode === 'id' ? 'Tome una foto clara de la identificación oficial del visitante.' : cameraMode === 'vehicle' ? 'Tome una foto del frente del vehículo, mostrando las placas.' : 'Centre la placa del vehículo en el recuadro.'}
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
                <DialogTitle>Confirmar Texto Detectado</DialogTitle>
                <DialogDescription>
                    La IA detectó el siguiente texto. ¿Es correcto?
                </DialogDescription>
            </DialogHeader>
            <div className="my-4 p-4 bg-muted rounded-md border text-center font-mono text-2xl tracking-widest">
                {ocrResult}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => { setIsOcrConfirmationOpen(false); openCamera(cameraMode!); }}>
                    Intentar de Nuevo
                </Button>
                <Button onClick={() => {
                    if (ocrResult) {
                        if (cameraMode === 'plate') {
                             handlePlateFinalized(ocrResult);
                        } else if (cameraMode === 'id') {
                            form.setValue('fullName', ocrResult);
                        }
                    }
                    setIsOcrConfirmationOpen(false);
                }}>
                    Aceptar y Usar
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    <Dialog open={isVehicleOcrConfirmationOpen} onOpenChange={setIsVehicleOcrConfirmationOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Confirmar Datos del Vehículo</DialogTitle>
                <DialogDescription>
                    La IA detectó las siguientes características. ¿Son correctas?
                </DialogDescription>
            </DialogHeader>
            <div className="my-4 space-y-2 text-base">
                <p><strong>Tipo:</strong> {vehicleOcrResult?.type} {!vehicleTypes.includes(vehicleOcrResult?.type || '') && <Badge variant="outline">Nuevo</Badge>}</p>
                <p><strong>Marca:</strong> {vehicleOcrResult?.brand} {!vehicleBrands.includes(vehicleOcrResult?.brand || '') && <Badge variant="outline">Nuevo</Badge>}</p>
                <p><strong>Color:</strong> {vehicleOcrResult?.color} {!vehicleColors.includes(vehicleOcrResult?.color || '') && <Badge variant="outline">Nuevo</Badge>}</p>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => { setIsVehicleOcrConfirmationOpen(false); openCamera('vehicle'); }}>
                    Intentar de Nuevo
                </Button>
                <Button onClick={handleVehicleOcrConfirm}>
                    Aceptar y Usar
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
