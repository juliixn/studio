
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "../ui/switch";
import { BrainCircuit, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { generateChargeConcept } from "@/ai/flows/generate-charge-concept-flow";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";

const chargeConcepts = ["Cuota de Mantenimiento", "Penalización por Ruido", "Reparación de Daños", "Otro"];

const formSchema = z.object({
  concept: z.string().min(1, "El concepto es requerido."),
  customConcept: z.string().optional(),
  amount: z.coerce.number().positive("El monto debe ser un número positivo."),
  isRecurring: z.boolean().default(false),
  recurringStartDate: z.date().optional(),
  recurringInterval: z.enum(['monthly', 'bimonthly']).optional(),
  recurringCount: z.coerce.number().int().positive().optional(),
}).refine(data => {
    if (data.concept === 'Otro' && (!data.customConcept || data.customConcept.trim() === '')) {
        return false;
    }
    return true;
}, {
    message: "El concepto personalizado es requerido.",
    path: ["customConcept"],
}).refine(data => {
    if (data.isRecurring) {
        return !!data.recurringStartDate && !!data.recurringInterval && !!data.recurringCount;
    }
    return true;
}, {
    message: "Debe completar todos los campos para la programación.",
    path: ["isRecurring"],
});

interface ChargeFormProps {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  onCancel: () => void;
}

export function ChargeForm({ onSubmit, onCancel }: ChargeFormProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      concept: "Cuota de Mantenimiento",
      amount: undefined,
      isRecurring: false,
      recurringStartDate: new Date(),
      recurringInterval: 'monthly',
      recurringCount: 12,
    },
  });

  const selectedConcept = form.watch("concept");
  const isRecurring = form.watch("isRecurring");

  const handleGenerateConcept = async () => {
    setIsGenerating(true);
    try {
        const result = await generateChargeConcept({});
        if (result.concept) {
            form.setValue("concept", "Otro");
            form.setValue("customConcept", result.concept);
        }
    } catch (error) {
        toast({ title: "Error de IA", description: "No se pudo generar el concepto.", variant: "destructive" });
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto pr-2">
        <div className="flex items-end gap-2">
            <FormField
            control={form.control}
            name="concept"
            render={({ field }) => (
                <FormItem className="flex-grow">
                <FormLabel>Concepto del Cargo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                        <SelectTrigger><SelectValue placeholder="Seleccione un concepto" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {chargeConcepts.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <Button type="button" variant="outline" size="icon" onClick={handleGenerateConcept} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
            </Button>
        </div>

        {selectedConcept === 'Otro' && (
            <FormField control={form.control} name="customConcept" render={({ field }) => (<FormItem><FormLabel>Concepto Personalizado</FormLabel><FormControl><Input placeholder="Escriba el concepto..." {...field} /></FormControl><FormMessage /></FormItem>)}/>
        )}
        
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto ($)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="1500.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
            control={form.control}
            name="isRecurring"
            render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                <FormLabel>Programar Cargo Recurrente</FormLabel>
                <FormDescription>
                    Aplica este cargo automáticamente en el futuro.
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
        {isRecurring && (
            <div className="p-4 border rounded-md space-y-4 bg-muted/50">
                <FormField control={form.control} name="recurringStartDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Fecha del Primer Cargo</FormLabel>
                    <Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP", {locale: es}) : <span>Seleccionar fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()} initialFocus /></PopoverContent></Popover>
                    <FormMessage />
                    </FormItem>
                )}/>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="recurringInterval" render={({ field }) => (
                        <FormItem><FormLabel>Frecuencia</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="monthly">Mensual</SelectItem><SelectItem value="bimonthly">Bimestral</SelectItem></SelectContent></Select>
                        <FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="recurringCount" render={({ field }) => (
                         <FormItem><FormLabel>Repetir (veces)</FormLabel><FormControl><Input type="number" placeholder="12" {...field}/></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
            </div>
        )}

        <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit">Añadir Cargo</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
