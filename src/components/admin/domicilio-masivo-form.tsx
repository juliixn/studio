"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Condominio } from "@/lib/definitions";

const formSchema = z.object({
  condominioId: z.string().min(1, "El condominio es requerido."),
  prefix: z.string().min(1, "El prefijo es requerido (ej: Casa, Lote)."),
  startNumber: z.coerce.number().int().positive("El número inicial debe ser positivo."),
  endNumber: z.coerce.number().int().positive("El número final debe ser positivo."),
  suffix: z.string().optional(),
}).refine(data => data.endNumber >= data.startNumber, {
    message: "El número final debe ser mayor o igual al número inicial.",
    path: ["endNumber"],
});

interface DomicilioMasivoFormProps {
  condominios: Condominio[];
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  onCancel: () => void;
}

export function DomicilioMasivoForm({ condominios, onSubmit, onCancel }: DomicilioMasivoFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prefix: "Casa",
      startNumber: 101,
      endNumber: 110,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <FormDescription>El condominio al que se asignarán los nuevos domicilios.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="prefix"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prefijo</FormLabel>
              <FormControl><Input placeholder="Casa, Departamento, Lote" {...field} /></FormControl>
              <FormDescription>Texto que va antes del número (ej: **Casa** 101).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name="startNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Número Inicial</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="endNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Número Final</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <FormField
          control={form.control}
          name="suffix"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sufijo (Opcional)</FormLabel>
              <FormControl><Input placeholder=", Calle Principal" {...field} /></FormControl>
               <FormDescription>Texto que va después del número (ej: Casa 101**, Calle Ficus**).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">Generar Domicilios</Button>
        </div>
      </form>
    </Form>
  );
}
