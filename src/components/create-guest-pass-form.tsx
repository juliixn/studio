
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { User as UserIcon, Building, Car, Users, QrCode, Camera as CameraIcon, Trash2, RefreshCw, Upload, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { User, Condominio, Address, VehicleInfo } from "@/lib/definitions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { useEffect, useState, useRef } from "react";
import { addGuestPass } from "@/lib/guestPassService";
import { DialogHeader, DialogTitle, DialogDescription, Dialog, DialogContent, DialogFooter, DialogClose } from "./ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import Image from "next/image";
import { Alert, AlertTitle } from "./ui/alert";
import { getUserVehicles } from "@/lib/vehicleService";
import { getList } from "@/lib/listService";


const formSchema = z.object({
  accessType: z.enum(['pedestrian', 'vehicular'], { required_error: "Debe seleccionar un tipo de acceso." }),
  guestName: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  visitorType: z.string().min(1, "El tipo de visitante es requerido."),
  
  passType: z.enum(['temporal', 'permanent']),
  durationValue: z.coerce.number().optional(),
  durationUnit: z.enum(['days', 'months', 'years']).optional(),

  condominioId: z.string().optional(),
  addressId: z.string().min(1, "El domicilio es requerido."),
  
  licensePlate: z.string().optional(),
  vehicleType: z.string().optional(),
  vehicleBrand: z.string().optional(),
  vehicleColor: z.string().optional(),
})
.superRefine((data, ctx) => {
    if (data.accessType === 'vehicular') {
        if (!data.licensePlate?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La placa es requerida.", path: ['licensePlate'] });
        }
        if (!data.vehicleType) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El tipo es requerido.", path: ['vehicleType'] });
        }
        if (!data.vehicleBrand) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La marca es requerida.", path: ['vehicleBrand'] });
        }
        if (!data.vehicleColor) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El color es requerido.", path: ['vehicleColor'] });
        }
    }
    if (data.passType === 'temporal') {
        if (!data.durationValue || data.durationValue <= 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La duración debe ser mayor a 0.", path: ['durationValue'] });
        }
        if (!data.durationUnit) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La unidad de tiempo es requerida.", path: ['durationUnit'] });
        }
    }
});


interface CreateGuestPassFormProps {
  user: User;
  condominios: Condominio[];
  addresses: Address[];
  onPassCreated: () => void;
  onCancel?: () => void;
}

export default function CreateGuestPassForm({ user, condominios, addresses, onPassCreated, onCancel }: CreateGuestPassFormProps) {
  const { toast } = useToast();
  const [availableAddresses, setAvailableAddresses] = useState<Address[]>([]);
  const [savedVehicles, setSavedVehicles] = useState<VehicleInfo[]>([]);

  // Dynamic lists from service
  const [visitorTypes, setVisitorTypes] = useState<string[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [vehicleBrands, setVehicleBrands] = useState<string[]>([]);
  const [vehicleColors, setVehicleColors] = useState<string[]>([]);

  // Location State
  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Photo states
  const [visitorIdPhoto, setVisitorIdPhoto] = useState<string | null>(null);
  const [vehiclePhoto, setVehiclePhoto] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<'id' | 'vehicle' | null>(null);

  // Camera and file refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accessType: 'pedestrian',
      guestName: "",
      visitorType: "Visitante",
      condominioId: user.role === 'Administrador' ? '' : user.condominioId,
      addressId: user.role.match(/Propietario|Renta/) ? user.addressId : '',
      passType: 'temporal',
      durationValue: 1,
      durationUnit: 'days',
      licensePlate: "",
      vehicleType: "",
      vehicleBrand: "",
      vehicleColor: ""
    },
  });

  const { setValue } = form;
  const accessType = form.watch("accessType");
  const selectedCondoId = form.watch("condominioId");
  const passType = form.watch("passType");

  const isUserAdmin = user.role === 'Administrador';
  const isUserResident = user.role === 'Propietario' || user.role === 'Renta';
  
  const showCondoSelector = isUserAdmin;
  const showAddressSelector = isUserAdmin;
  const fixedAddress = isUserResident ? addresses.find(a => a.id === user.addressId) : null;
  
  useEffect(() => {
    setVisitorTypes(getList('visitorTypes'));
    setVehicleTypes(getList('vehicleTypes'));
    setVehicleBrands(getList('vehicleBrands'));
    setVehicleColors(getList('vehicleColors'));
    
    if (isUserResident) {
        setSavedVehicles(getUserVehicles(user.id));
    }
  }, [user.id, isUserResident]);

  useEffect(() => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                });
                setLocationError(null);
            },
            (error) => {
                console.warn(`Error getting location: ${error.message}`);
                setLocationError("No se pudo obtener la ubicación. Se creará el pase sin ella.");
            }
        );
    } else {
        setLocationError("Geolocalización no soportada por este navegador.");
    }
  }, []);

  useEffect(() => {
    const condoIdToFilterBy = isUserAdmin ? selectedCondoId : user.condominioId;
    if (condoIdToFilterBy) {
      const filtered = addresses.filter(a => a.condominioId === condoIdToFilterBy);
      setAvailableAddresses(filtered);
    } else {
      setAvailableAddresses([]);
    }
  }, [selectedCondoId, user.condominioId, isUserAdmin, addresses]);

  useEffect(() => {
    if (isUserAdmin) {
      setValue("addressId", "");
    }
  }, [selectedCondoId, isUserAdmin, setValue]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    if (!visitorIdPhoto) {
      toast({ variant: 'destructive', title: 'Falta Foto', description: 'Debe tomar o subir una foto de la identificación.' });
      return;
    }
    if (values.accessType === 'vehicular' && !vehiclePhoto) {
      toast({ variant: 'destructive', title: 'Falta Foto', description: 'Debe tomar o subir una foto del vehículo.' });
      return;
    }

    const addressIdToUse = isUserResident ? user.addressId : values.addressId;
    if (!addressIdToUse) {
        toast({
            variant: "destructive",
            title: "Error de Domicilio",
            description: "No se ha especificado un domicilio. Por favor, seleccione uno o contacte al administrador."
        });
        return;
    }
    const selectedAddress = addresses.find(a => a.id === addressIdToUse);
    if (!selectedAddress) {
        toast({
            variant: "destructive",
            title: "Error de Domicilio",
            description: "El domicilio especificado no es válido. Por favor, inténtelo de nuevo."
        });
        return;
    }

    addGuestPass({
      ...values,
      residentId: user.id,
      residentName: user.name,
      addressId: selectedAddress.id,
      address: selectedAddress.fullAddress,
      condominioId: selectedAddress.condominioId,
      visitorIdPhotoUrl: visitorIdPhoto,
      vehiclePhotoUrl: accessType === 'vehicular' ? vehiclePhoto : undefined,
      latitude: location?.lat,
      longitude: location?.lon,
    });
    
    onPassCreated();
    form.reset();
    setVisitorIdPhoto(null);
    setVehiclePhoto(null);
  };
  
  const openCamera = (mode: 'id' | 'vehicle') => {
    setCameraMode(mode);
    setIsCameraOpen(true);
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
            if (cameraMode === 'id') {
                setVisitorIdPhoto(dataUrl);
            } else if (cameraMode === 'vehicle') {
                setVehiclePhoto(dataUrl);
            }
            setIsCameraOpen(false);
        }
    }
  };
  
  const handleUploadClick = (mode: 'id' | 'vehicle') => {
    setCameraMode(mode);
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (cameraMode === 'id') {
                setVisitorIdPhoto(dataUrl);
            } else if (cameraMode === 'vehicle') {
                setVehiclePhoto(dataUrl);
            }
        };
        reader.readAsDataURL(file);
    }
    // Reset file input value to allow re-uploading the same file
    if (e.target) {
        e.target.value = '';
    }
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
        streamRef.current = null;
      }
    };
  }, [isCameraOpen, cameraMode, toast, facingMode]);

  return (
    <>
      {onCancel && (
        <DialogHeader>
          <DialogTitle>Generar Pase de Invitado</DialogTitle>
          <DialogDescription>
            Complete la información del visitante para generar un código QR de acceso.
          </DialogDescription>
        </DialogHeader>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 pt-4 max-h-[80vh] overflow-y-auto pr-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
          <FormField
            control={form.control}
            name="accessType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Tipo de Acceso</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl><RadioGroupItem value="pedestrian" id="r1" /></FormControl>
                      <FormLabel htmlFor="r1" className="font-normal flex items-center gap-2"><UserIcon className="h-4 w-4"/> Peatonal</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl><RadioGroupItem value="vehicular" id="r2" /></FormControl>
                      <FormLabel htmlFor="r2" className="font-normal flex items-center gap-2"><Car className="h-4 w-4"/> Vehicular</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name="guestName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Invitado/Servicio</FormLabel>
                    <FormControl><Input placeholder="Ej: Juan Pérez" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="visitorType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Visitante</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un tipo" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {visitorTypes.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </div>

          {accessType === 'vehicular' && (
            <div className="p-4 border rounded-md space-y-4 bg-muted/50">
              <h3 className="text-sm font-medium">Información del Vehículo</h3>
               {isUserResident && savedVehicles.length > 0 && (
                 <FormItem>
                  <FormLabel>Vehículo Guardado (Opcional)</FormLabel>
                  <Select onValueChange={(value) => {
                    if (value === 'none') {
                        form.setValue('licensePlate', '');
                        form.setValue('vehicleType', '');
                        form.setValue('vehicleBrand', '');
                        form.setValue('vehicleColor', '');
                    } else {
                        const vehicle = savedVehicles.find(v => v.id === value);
                        if (vehicle) {
                          form.setValue('licensePlate', vehicle.licensePlate);
                          form.setValue('vehicleType', vehicle.type);
                          form.setValue('vehicleBrand', vehicle.brand);
                          form.setValue('vehicleColor', vehicle.color);
                        }
                    }
                  }}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Autocompletar con vehículo guardado" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">-- Ninguno (Ingresar Manualmente) --</SelectItem>
                      {savedVehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.alias || v.licensePlate}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
               )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="licensePlate" render={({ field }) => (<FormItem><FormLabel>Placas</FormLabel><FormControl><Input placeholder="ABC-123" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="vehicleColor" render={({ field }) => (<FormItem><FormLabel>Color</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione color" /></SelectTrigger></FormControl><SelectContent>{vehicleColors.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="vehicleBrand" render={({ field }) => (<FormItem><FormLabel>Marca</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione marca" /></SelectTrigger></FormControl><SelectContent>{vehicleBrands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="vehicleType" render={({ field }) => (<FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione tipo" /></SelectTrigger></FormControl><SelectContent>{vehicleTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
              </div>
            </div>
          )}

          <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-base">Evidencia Fotográfica (Obligatorio)</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <FormLabel>Foto de Identificación</FormLabel>
                      {visitorIdPhoto ? (
                          <div className="relative w-full aspect-video">
                              <Image src={visitorIdPhoto} alt="Vista previa de ID" layout="fill" className="object-cover rounded-md" />
                              <Button variant="destructive" size="icon" onClick={() => setVisitorIdPhoto(null)} className="absolute top-2 right-2 h-7 w-7"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                      ) : (
                          <div className="flex flex-col sm:flex-row gap-2">
                              <Button type="button" variant="outline" className="w-full" onClick={() => openCamera('id')}>
                                  <CameraIcon className="mr-2 h-4 w-4"/> Tomar Foto
                              </Button>
                              <Button type="button" variant="outline" className="w-full" onClick={() => handleUploadClick('id')}>
                                  <Upload className="mr-2 h-4 w-4"/> Subir Archivo
                              </Button>
                          </div>
                      )}
                  </div>
                  {accessType === 'vehicular' && (
                    <div className="space-y-2">
                        <FormLabel>Foto del Vehículo</FormLabel>
                        {vehiclePhoto ? (
                            <div className="relative w-full aspect-video">
                                <Image src={vehiclePhoto} alt="Vista previa del vehículo" layout="fill" className="object-cover rounded-md" />
                                <Button variant="destructive" size="icon" onClick={() => setVehiclePhoto(null)} className="absolute top-2 right-2 h-7 w-7"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button type="button" variant="outline" className="w-full" onClick={() => openCamera('vehicle')}>
                                    <CameraIcon className="mr-2 h-4 w-4"/> Tomar Foto
                                </Button>
                                <Button type="button" variant="outline" className="w-full" onClick={() => handleUploadClick('vehicle')}>
                                    <Upload className="mr-2 h-4 w-4"/> Subir Archivo
                                </Button>
                            </div>
                        )}
                    </div>
                  )}
              </CardContent>
          </Card>
          
          <div className="p-4 border rounded-md space-y-4">
              <FormField
                control={form.control}
                name="passType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Tipo de Vigencia del Pase</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl><RadioGroupItem value="temporal" id="r_temp" /></FormControl>
                          <FormLabel htmlFor="r_temp" className="font-normal">Temporal</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl><RadioGroupItem value="permanent" id="r_perm" /></FormControl>
                          <FormLabel htmlFor="r_perm" className="font-normal">Permanente</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              {passType === 'temporal' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="durationValue"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Duración</FormLabel>
                                <FormControl><Input type="number" min="1" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="durationUnit"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Unidad</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="days">Días</SelectItem>
                                        <SelectItem value="months">Meses</SelectItem>
                                        <SelectItem value="years">Años</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                </div>
              )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {showCondoSelector && (
                 <FormField
                    control={form.control}
                    name="condominioId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condominio</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccione condominio" /></SelectTrigger></FormControl>
                            <SelectContent>{condominios.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              )}
              {showAddressSelector ? (
                 <FormField
                    control={form.control}
                    name="addressId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Domicilio a Visitar</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={(!isUserAdmin && !user.condominioId) && !selectedCondoId || availableAddresses.length === 0}>
                            <FormControl><SelectTrigger><SelectValue placeholder={((!isUserAdmin && !user.condominioId) && !selectedCondoId) ? "Seleccione un condominio" : "Seleccione domicilio"} /></SelectTrigger></FormControl>
                            <SelectContent>{availableAddresses.map(a => <SelectItem key={a.id} value={a.id}>{a.fullAddress}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              ) : fixedAddress && (
                <FormItem>
                    <FormLabel>Domicilio a Visitar</FormLabel>
                    <FormControl>
                        <Input value={`${fixedAddress.fullAddress} (${condominios.find(c => c.id === fixedAddress.condominioId)?.name})`} disabled />
                    </FormControl>
                </FormItem>
              )}
          </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground p-2 bg-muted rounded-md">
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span>
                        {location ? `Ubicación: ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}` : locationError ? "Ubicación no disponible" : "Obteniendo ubicación..."}
                    </span>
                    {!location && !locationError && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
            </div>

          <div className="flex justify-end pt-4 gap-2">
            {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
            <Button type="submit" className="w-full md:w-auto">
                <QrCode className="mr-2 h-4 w-4" /> Generar Pase
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
                    {cameraMode === 'id' ? 'Tome una foto clara de la identificación oficial del visitante.' : 'Tome una foto del frente del vehículo, mostrando las placas.'}
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
    </>
  );
}
