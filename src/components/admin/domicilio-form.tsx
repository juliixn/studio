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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Address, Condominio } from "@/lib/definitions";

const formSchema = z.object({
  fullAddress: z.string().min(1, "La dirección es requerida."),
  condominioId: z.string().min(1, "El condominio es requerido."),
});

interface DomicilioFormProps {
  domicilio?: Address;
  condominios: Condominio[];
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  onCancel: () => void;
}

export function DomicilioForm({ domicilio, condominios, onSubmit, onCancel }: DomicilioFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullAddress: domicilio?.fullAddress || "",
      condominioId: domicilio?.condominioId || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección Completa</FormLabel>
              <FormControl>
                <Input placeholder="Casa 101, Calle Ficus" {...field} />
              </FormControl>
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
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">{domicilio ? "Guardar Cambios" : "Crear Domicilio"}</Button>
        </div>
      </form>
    </Form>
  );
}
