
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CommunityEvent, Condominio } from "@/lib/definitions";
import { Switch } from "../ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "../ui/calendar";

const formSchema = z.object({
  title: z.string().min(1, "El título es requerido."),
  description: z.string().optional(),
  condominioId: z.string().min(1, "El destinatario es requerido."),
  start: z.date({ required_error: "La fecha de inicio es requerida."}),
  end: z.date({ required_error: "La fecha de fin es requerida."}),
  isAllDay: z.boolean().default(false),
  location: z.string().optional(),
});

interface EventFormProps {
  event?: CommunityEvent;
  condominios: Condominio[];
  onSubmit: (values: any) => void;
  onCancel: () => void;
}

export function EventForm({ event, condominios, onSubmit, onCancel }: EventFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: event?.title || "",
      description: event?.description || "",
      condominioId: event?.condominioId || "all",
      start: event?.start ? new Date(event.start) : new Date(),
      end: event?.end ? new Date(event.end) : new Date(),
      isAllDay: event?.isAllDay || false,
      location: event?.location || "",
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
      onSubmit({
          ...values,
          start: values.start.toISOString(),
          end: values.end.toISOString(),
      });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Título del Evento</FormLabel><FormControl><Input placeholder="Junta de Condóminos" {...field} /></FormControl><FormMessage /></FormItem> )}/>
        <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea placeholder="Detalles del evento..." {...field} /></FormControl><FormMessage /></FormItem> )}/>
        <FormField control={form.control} name="condominioId" render={({ field }) => ( <FormItem><FormLabel>Para</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="all">Todos los Condominios</SelectItem>{condominios.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
        <FormField control={form.control} name="isAllDay" render={({ field }) => (<FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Todo el día</FormLabel><FormDescription>Marcar si el evento dura todo el día.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="start" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Inicio</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn(!field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Seleccionar fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="end" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Fin</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn(!field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Seleccionar fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
        </div>
         <FormField control={form.control} name="location" render={({ field }) => ( <FormItem> <FormLabel>Ubicación (Opcional)</FormLabel> <FormControl><Input placeholder="Salón de Eventos" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">{event ? "Guardar Cambios" : "Crear Evento"}</Button>
        </div>
      </form>
    </Form>
  );
}
