
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WorkOrder, WorkOrderStatus, Condominio } from "@/lib/definitions";

const formSchema = z.object({
  title: z.string().min(1, "El título es requerido."),
  description: z.string().min(1, "La descripción es requerida."),
  condominioId: z.string().min(1, "El condominio es requerido."),
  address: z.string().min(1, "La dirección o ubicación es requerida."),
  status: z.enum(['Pendiente', 'Asignada', 'En Progreso', 'Completada', 'Cancelada']),
  assignedTo: z.string().optional(),
  cost: z.coerce.number().optional(),
  peticionId: z.string().optional(),
});

interface WorkOrderFormProps {
  workOrder?: WorkOrder;
  condominios: Condominio[];
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  onCancel: () => void;
}

export function WorkOrderForm({ workOrder, condominios, onSubmit, onCancel }: WorkOrderFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: workOrder?.title || "",
      description: workOrder?.description || "",
      condominioId: workOrder?.condominioId || "",
      address: workOrder?.address || "",
      status: workOrder?.status || 'Pendiente',
      assignedTo: workOrder?.assignedTo || "",
      cost: workOrder?.cost || undefined,
      peticionId: workOrder?.peticionId || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Título</FormLabel><FormControl><Input placeholder="Reparar luminaria" {...field} /></FormControl><FormMessage /></FormItem> )}/>
        <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea placeholder="Detalles de la tarea..." {...field} /></FormControl><FormMessage /></FormItem> )}/>
        <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Ubicación Específica</FormLabel><FormControl><Input placeholder="Poste #3, frente a Casa 101" {...field} /></FormControl><FormMessage /></FormItem> )}/>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="condominioId" render={({ field }) => ( <FormItem><FormLabel>Condominio</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione un condominio" /></SelectTrigger></FormControl><SelectContent>{condominios.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="status" render={({ field }) => ( <FormItem><FormLabel>Estado</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Pendiente">Pendiente</SelectItem><SelectItem value="Asignada">Asignada</SelectItem><SelectItem value="En Progreso">En Progreso</SelectItem><SelectItem value="Completada">Completada</SelectItem><SelectItem value="Cancelada">Cancelada</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="assignedTo" render={({ field }) => ( <FormItem><FormLabel>Asignado a (Opcional)</FormLabel><FormControl><Input placeholder="Juan Hernández (Mantenimiento)" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={form.control} name="cost" render={({ field }) => ( <FormItem><FormLabel>Costo ($) (Opcional)</FormLabel><FormControl><Input type="number" placeholder="550.50" {...field} /></FormControl><FormMessage /></FormItem> )}/>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">{workOrder ? "Guardar Cambios" : "Crear Orden"}</Button>
        </div>
      </form>
    </Form>
  );
}
