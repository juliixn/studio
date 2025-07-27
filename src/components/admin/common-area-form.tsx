"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CommonArea, Condominio } from "@/lib/definitions";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  description: z.string().min(1, "La descripción es requerida."),
  capacity: z.coerce.number().int().positive("La capacidad debe ser un número positivo."),
  condominioId: z.string().min(1, "El condominio es requerido."),
  imageUrl: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
  rules: z.string().optional(),
  cost: z.coerce.number().min(0, "El costo no puede ser negativo.").optional(),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
});

interface CommonAreaFormProps {
  area?: CommonArea;
  condominios: Condominio[];
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  onCancel: () => void;
}

export function CommonAreaForm({ area, condominios, onSubmit, onCancel }: CommonAreaFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: area?.name || "",
      description: area?.description || "",
      capacity: area?.capacity || 0,
      condominioId: area?.condominioId || "",
      imageUrl: area?.imageUrl || "",
      rules: area?.rules || "",
      cost: area?.cost || 0,
      openingTime: area?.openingTime || "",
      closingTime: area?.closingTime || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto pr-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Área</FormLabel>
              <FormControl>
                <Input placeholder="Salón de Eventos" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea placeholder="Área para fiestas y reuniones..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacidad (personas)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="50" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de la Imagen</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/image.png" {...field} />
              </FormControl>
              <FormDescription>URL de una imagen representativa del área.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="openingTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horario Apertura</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="closingTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horario Cierre</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <FormField
          control={form.control}
          name="cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Costo de Reserva ($)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} />
              </FormControl>
              <FormDescription>Dejar en 0 si no tiene costo.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

         <FormField
          control={form.control}
          name="rules"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reglas de Uso</FormLabel>
              <FormControl>
                <Textarea placeholder="1. ...&#10;2. ..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">{area ? "Guardar Cambios" : "Crear Área"}</Button>
        </div>
      </form>
    </Form>
  );
}
