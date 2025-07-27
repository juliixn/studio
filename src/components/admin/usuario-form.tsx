
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User, Condominio, Address, UserRole } from "@/lib/definitions";
import { useEffect, useState, useRef } from "react";
import { Switch } from "../ui/switch";
import { Checkbox } from "../ui/checkbox";
import { ScrollArea } from "../ui/scroll-area";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Camera, Trash2, Upload, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { Textarea } from "../ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CameraCaptureDialog } from "../camera-capture-dialog";


const formSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres.").regex(/^[a-zA-Z0-9_.-]*$/, "Solo se permiten letras, números y los caracteres . _ -"),
  name: z.string().min(1, "El nombre es requerido."),
  email: z.string().email("Debe ser un correo electrónico válido."),
  password: z.string().optional(),
  photoUrl: z.string().url({ message: "Debe ser una URL de imagen válida." }).optional().or(z.literal('')),
  role: z.string().min(1, "El rol es requerido."),
  // For single selection roles
  condominioId: z.string().optional(),
  addressId: z.string().optional(),
  // For multi-selection roles
  condominioIds: z.array(z.string()).optional(),
  addressIds: z.array(z.string()).optional(),
  dailySalary: z.coerce.number().optional(),
  allowRemoteCheckIn: z.boolean().optional(),
  loanLimit: z.coerce.number().optional(),
  interestRate: z.coerce.number().optional(),
  // For Renta
  leaseStartDate: z.date().optional(),
  leaseEndDate: z.date().optional(),
  numberOfInhabitants: z.coerce.number().int().min(1, "Debe haber al menos un habitante.").optional(),
  inhabitantNames: z.string().optional(),
});

const ALL_ROLES: UserRole[] = ['Administrador', 'Adm. Condo', 'Propietario', 'Renta', 'Guardia'];

interface UsuarioFormProps {
  usuario?: User;
  condominios: Condominio[];
  addresses: Address[];
  currentUser: User | null;
  onSubmit: (values: any) => void;
  onCancel: () => void;
}

export function UsuarioForm({ usuario, condominios, addresses, currentUser, onSubmit, onCancel }: UsuarioFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: usuario?.username || "",
      name: usuario?.name || "",
      email: usuario?.email || "",
      password: "",
      photoUrl: usuario?.photoUrl || "",
      role: usuario?.role || "",
      condominioId: usuario?.condominioId || "",
      addressId: usuario?.addressId || "",
      condominioIds: usuario?.condominioIds || [],
      addressIds: usuario?.addressIds || [],
      dailySalary: usuario?.dailySalary || undefined,
      allowRemoteCheckIn: usuario?.allowRemoteCheckIn || false,
      loanLimit: usuario?.loanLimit || undefined,
      interestRate: usuario?.interestRate || undefined,
      leaseStartDate: usuario?.leaseStartDate ? new Date(usuario.leaseStartDate) : undefined,
      leaseEndDate: usuario?.leaseEndDate ? new Date(usuario.leaseEndDate) : undefined,
      numberOfInhabitants: usuario?.numberOfInhabitants || undefined,
      inhabitantNames: usuario?.inhabitantNames?.join(', ') || "",
    },
  });

  const selectedRole = form.watch("role");
  const selectedCondominioId = form.watch("condominioId"); // For single select
  const selectedCondominioIds = form.watch("condominioIds"); // For multi select
  const photoUrl = form.watch("photoUrl");

  const isMultiCondoRole = selectedRole === 'Propietario';
  const isSingleCondoRole = selectedRole === 'Renta' || selectedRole === 'Guardia' || selectedRole === 'Adm. Condo';

  const availableRoles = ALL_ROLES;

  // Camera state and refs
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // This effect is to reset fields that don't apply to the selected role
    // when the role is changed.
    if (isMultiCondoRole) {
        form.setValue("condominioId", "");
        form.setValue("addressId", "");
        if (selectedRole !== 'Propietario') {
            form.setValue('addressIds', []);
        }
    } else {
        form.setValue("condominioIds", []);
        form.setValue("addressIds", []);
    }

    if (!isSingleCondoRole) {
        form.setValue("condominioId", "");
    }
    
    if (selectedRole !== 'Renta') {
        form.setValue("addressId", "");
        form.setValue("leaseStartDate", undefined);
        form.setValue("leaseEndDate", undefined);
        form.setValue("numberOfInhabitants", undefined);
        form.setValue("inhabitantNames", "");
    }
    
    if (selectedRole !== 'Guardia') {
      form.setValue("dailySalary", undefined);
      form.setValue("allowRemoteCheckIn", false);
      form.setValue("loanLimit", undefined);
      form.setValue("interestRate", undefined);
    }
  }, [selectedRole, form, isMultiCondoRole, isSingleCondoRole]);
  
  // Effect for single-select condo change
  useEffect(() => {
      form.setValue("addressId", "");
  }, [selectedCondominioId, form]);

  // Effect for multi-select condo change
  useEffect(() => {
    const currentAddressIds = form.getValues("addressIds") || [];
    const availableAddressesForSelection = addresses.filter(addr => selectedCondominioIds?.includes(addr.condominioId));
    const validAddressIds = currentAddressIds.filter(id => availableAddressesForSelection.some(addr => addr.id === id));
    form.setValue("addressIds", validAddressIds);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCondominioIds, addresses, form.setValue]);
  
  const handleFinalSubmit = (values: z.infer<typeof formSchema>) => {
    const dataToSubmit: any = { ...values };

    if (values.role === 'Renta') {
      if (values.leaseStartDate) dataToSubmit.leaseStartDate = values.leaseStartDate.toISOString();
      if (values.leaseEndDate) dataToSubmit.leaseEndDate = values.leaseEndDate.toISOString();
      if (values.inhabitantNames) {
        dataToSubmit.inhabitantNames = values.inhabitantNames.split(',').map(name => name.trim()).filter(Boolean);
      }
    } else {
      // Clean up renter fields if role is not Renta
      delete dataToSubmit.leaseStartDate;
      delete dataToSubmit.leaseEndDate;
      delete dataToSubmit.numberOfInhabitants;
      delete dataToSubmit.inhabitantNames;
    }

    onSubmit(dataToSubmit);
  };

  const handleCapture = (dataUrl: string) => {
    form.setValue("photoUrl", dataUrl);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        form.setValue("photoUrl", event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };


  const availableAddressesForSingleSelect = addresses.filter(addr => addr.condominioId === selectedCondominioId);
  const availableAddressesForMultiSelect = addresses.filter(addr => selectedCondominioIds?.includes(addr.condominioId));

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFinalSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />

          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={photoUrl} alt={form.getValues('name')} data-ai-hint="profile picture" />
              <AvatarFallback className="text-3xl">{form.getValues('name')?.split(' ').map(n => n[0]).join('') || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setIsCameraOpen(true)}><Camera className="mr-2 h-4 w-4" />Tomar Foto</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Subir</Button>
              {photoUrl && <Button type="button" size="sm" variant="destructive" onClick={() => form.setValue('photoUrl', '')}><Trash2 className="mr-2 h-4 w-4" />Eliminar</Button>}
            </div>
          </div>
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de Usuario</FormLabel>
                <FormControl>
                  <Input placeholder="ej: jperez" {...field} />
                </FormControl>
                <FormDescription>
                  Este será el identificador único para iniciar sesión. Sin espacios ni caracteres especiales.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre Completo (para mostrar)</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo Electrónico</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="usuario@ejemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{usuario ? "Nueva Contraseña (Opcional)" : "Contraseña"}</FormLabel>
                <FormControl>
                  <Input 
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {usuario ? "Dejar en blanco para no cambiar la contraseña." : "Define una contraseña para el nuevo usuario."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rol</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un rol" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableRoles.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {isMultiCondoRole && (
              <>
                  <FormField
                      control={form.control}
                      name="condominioIds"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Condominios Asignados</FormLabel>
                          <ScrollArea className="h-24 w-full rounded-md border p-2">
                              <div className="space-y-2">
                                  {condominios.map((condo) => (
                                  <FormField
                                      key={condo.id}
                                      control={form.control}
                                      name="condominioIds"
                                      render={({ field }) => (
                                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                          <FormControl>
                                              <Checkbox
                                                  checked={field.value?.includes(condo.id)}
                                                  onCheckedChange={(checked) => {
                                                  return checked
                                                      ? field.onChange([...(field.value || []), condo.id])
                                                      : field.onChange(field.value?.filter((value) => value !== condo.id));
                                                  }}
                                              />
                                          </FormControl>
                                          <FormLabel className="font-normal">{condo.name}</FormLabel>
                                      </FormItem>
                                      )}
                                  />
                                  ))}
                              </div>
                          </ScrollArea>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
                  {selectedRole === 'Propietario' && (
                      <FormField
                          control={form.control}
                          name="addressIds"
                          render={() => (
                              <FormItem>
                              <FormLabel>Domicilios Asignados</FormLabel>
                              <ScrollArea className="h-24 w-full rounded-md border p-2">
                                  <div className="space-y-2">
                                      {availableAddressesForMultiSelect.length > 0 ? availableAddressesForMultiSelect.map((address) => (
                                      <FormField
                                          key={address.id}
                                          control={form.control}
                                          name="addressIds"
                                          render={({ field }) => (
                                          <FormItem className="flex items-center space-x-2 space-y-0">
                                              <FormControl>
                                                  <Checkbox
                                                      checked={field.value?.includes(address.id)}
                                                      onCheckedChange={(checked) => {
                                                      return checked
                                                          ? field.onChange([...(field.value || []), address.id])
                                                          : field.onChange(field.value?.filter((value) => value !== address.id));
                                                      }}
                                                  />
                                              </FormControl>
                                              <FormLabel className="font-normal">{address.fullAddress}</FormLabel>
                                          </FormItem>
                                          )}
                                      />
                                      )) : <p className="text-sm text-muted-foreground text-center py-2">Seleccione un condominio para ver domicilios.</p>}
                                  </div>
                              </ScrollArea>
                              <FormMessage />
                              </FormItem>
                          )}
                      />
                  )}
              </>
          )}

          {isSingleCondoRole && (
            <>
              <FormField
                control={form.control}
                name="condominioId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condominio</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un condominio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {condominios.map(condo => (
                          <SelectItem key={condo.id} value={condo.id}>{condo.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {selectedRole === 'Renta' && selectedCondominioId && (
                <FormField
                  control={form.control}
                  name="addressId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domicilio</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCondominioId || availableAddressesForSingleSelect.length === 0}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={!selectedCondominioId ? "Seleccione un condominio primero" : "Seleccione un domicilio"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableAddressesForSingleSelect.map(address => (
                            <SelectItem key={address.id} value={address.id}>{address.fullAddress}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </>
          )}

          {selectedRole === 'Renta' && (
            <div className="p-4 border rounded-md space-y-4">
              <h3 className="text-sm font-medium text-foreground">Información de Arrendamiento</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="leaseStartDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Inicio de Contrato</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="leaseEndDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fin de Contrato</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="numberOfInhabitants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Habitantes</FormLabel>
                    <FormControl><Input type="number" placeholder="Ej: 2" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="inhabitantNames"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombres de Habitantes Adicionales</FormLabel>
                    <FormControl><Textarea placeholder="Ej: Ana Pérez, Carlos Gómez..." {...field} /></FormControl>
                    <FormDescription>Si hay más habitantes además del principal, anote sus nombres separados por comas.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {selectedRole === 'Guardia' && (
            <>
              <FormField
                control={form.control}
                name="dailySalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salario Diario (MXN)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ej: 500" {...field} />
                    </FormControl>
                    <FormDescription>
                      Este valor se usará para cálculos de nómina.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="loanLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Límite de Préstamo ($)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ej: 5000" {...field} />
                    </FormControl>
                    <FormDescription>
                      El monto máximo que el guardia puede solicitar.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interestRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tasa de Interés para Préstamos (%)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ej: 5" {...field} />
                    </FormControl>
                    <FormDescription>
                      El interés que se aplicará a los préstamos.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                  control={form.control}
                  name="allowRemoteCheckIn"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Permitir Conexión Remota</FormLabel>
                        <FormDescription>
                          Permite al guardia iniciar turno sin estar en la ubicación GPS del condominio.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">{usuario ? "Guardar Cambios" : "Crear Usuario"}</Button>
          </div>
        </form>
      </Form>
      
      <CameraCaptureDialog 
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapture}
        title="Tomar Foto de Perfil"
        description="Asegúrese de que el rostro esté bien iluminado y centrado."
      />
    </>
  );
}
