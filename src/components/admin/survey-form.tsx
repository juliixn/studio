
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Survey, Condominio } from "@/lib/definitions";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "../ui/calendar";

const formSchema = z.object({
  title: z.string().min(1, "El título es requerido."),
  description: z.string().optional(),
  condominioId: z.string().min(1, "El destinatario es requerido."),
  closesAt: z.date({ required_error: "La fecha de cierre es requerida."}),
  options: z.array(z.object({ text: z.string().min(1, "El texto de la opción es requerido.") })).min(2, "Se requieren al menos 2 opciones."),
});

interface SurveyFormProps {
  survey?: Survey;
  condominios: Condominio[];
  onSubmit: (values: any) => void;
  onCancel: () => void;
}

export function SurveyForm({ survey, condominios, onSubmit, onCancel }: SurveyFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: survey?.title || "",
      description: survey?.description || "",
      condominioId: survey?.condominioId || "all",
      closesAt: survey?.closesAt ? new Date(survey.closesAt) : new Date(),
      options: survey?.options?.map(opt => ({text: opt.text})) || [{ text: "" }, { text: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit({
      ...values,
      closesAt: values.closesAt.toISOString(),
      options: values.options.map(opt => ({ text: opt.text }))
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Título</FormLabel><FormControl><Input placeholder="¿De qué color pintamos la fachada?" {...field} /></FormControl><FormMessage /></FormItem> )}/>
        <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea placeholder="Contexto de la encuesta..." {...field} /></FormControl><FormMessage /></FormItem> )}/>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="condominioId" render={({ field }) => ( <FormItem><FormLabel>Para</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="all">Todos</SelectItem>{condominios.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="closesAt" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Fecha de Cierre</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn(!field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Seleccionar fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()} /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
        </div>
        <div>
            <FormLabel>Opciones de Votación</FormLabel>
            <div className="space-y-2 mt-2">
                {fields.map((field, index) => (
                    <FormField
                        key={field.id}
                        control={form.control}
                        name={`options.${index}.text`}
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center gap-2">
                                    <FormControl><Input placeholder={`Opción ${index + 1}`} {...field} /></FormControl>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 2}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ))}
            </div>
             <Button type="button" variant="outline" size="sm" onClick={() => append({ text: "" })} className="mt-2">
                <PlusCircle className="mr-2 h-4 w-4"/> Añadir Opción
            </Button>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">{survey ? "Guardar Cambios" : "Crear Encuesta"}</Button>
        </div>
      </form>
    </Form>
  );
}
