
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Asset, Condominio } from "@/lib/definitions";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "../ui/calendar";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  category: z.string().min(1, "La categoría es requerida."),
  location: z.string().min(1, "La ubicación es requerida."),
  condominioId: z.string().min(1, "El condominio es requerido."),
  status: z.enum(['Operativo', 'En Mantenimiento', 'Requiere Reemplazo']),
  purchaseDate: z.date().optional(),
  lastMaintenanceDate: z.date().optional(),
  nextMaintenanceDate: z.date().optional(),
});

interface AssetFormProps {
  asset?: Asset;
  condominios: Condominio[];
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  onCancel: () => void;
}

const assetCategories = ['Seguridad', 'Plomería', 'Eléctrico', 'General', 'Mobiliario'];

export function AssetForm({ asset, condominios, onSubmit, onCancel }: AssetFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: asset?.name || "",
      category: asset?.category || "",
      location: asset?.location || "",
      condominioId: asset?.condominioId || "",
      status: asset?.status || 'Operativo',
      purchaseDate: asset?.purchaseDate ? new Date(asset.purchaseDate) : undefined,
      lastMaintenanceDate: asset?.lastMaintenanceDate ? new Date(asset.lastMaintenanceDate) : undefined,
      nextMaintenanceDate: asset?.nextMaintenanceDate ? new Date(asset.nextMaintenanceDate) : undefined,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Nombre del Activo</FormLabel> <FormControl><Input placeholder="Cámara Lobby Principal" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        <FormField control={form.control} name="category" render={({ field }) => ( <FormItem><FormLabel>Categoría</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione una categoría" /></SelectTrigger></FormControl><SelectContent>{assetCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
        <FormField control={form.control} name="location" render={({ field }) => ( <FormItem> <FormLabel>Ubicación</FormLabel> <FormControl><Input placeholder="Lobby Torre 1" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        <FormField control={form.control} name="condominioId" render={({ field }) => ( <FormItem><FormLabel>Condominio</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione condominio" /></SelectTrigger></FormControl><SelectContent>{condominios.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
        <FormField control={form.control} name="status" render={({ field }) => ( <FormItem><FormLabel>Estado</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Operativo">Operativo</SelectItem><SelectItem value="En Mantenimiento">En Mantenimiento</SelectItem><SelectItem value="Requiere Reemplazo">Requiere Reemplazo</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="purchaseDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Fecha de Compra</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Seleccionar fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="lastMaintenanceDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Último Mantenimiento</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Seleccionar fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
        </div>
        <FormField control={form.control} name="nextMaintenanceDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Próximo Mantenimiento</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Seleccionar fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>)}/>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">{asset ? "Guardar Cambios" : "Crear Activo"}</Button>
        </div>
      </form>
    </Form>
  );
}
