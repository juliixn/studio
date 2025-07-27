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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EmergencyContact, Condominio } from "@/lib/definitions";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  phone: z.string().min(1, "El teléfono es requerido."),
  description: z.string().optional(),
  condominioId: z.string().min(1, "El condominio es requerido."),
});

interface EmergencyContactFormProps {
  contact?: EmergencyContact;
  condominios: Condominio[];
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  onCancel: () => void;
}

export function EmergencyContactForm({ contact, condominios, onSubmit, onCancel }: EmergencyContactFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: contact?.name || "",
      phone: contact?.phone || "",
      description: contact?.description || "",
      condominioId: contact?.condominioId || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Contacto</FormLabel>
              <FormControl>
                <Input placeholder="Policía Local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Teléfono</FormLabel>
              <FormControl>
                <Input placeholder="911" {...field} />
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
                <Textarea placeholder="Para emergencias generales..." {...field} />
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
          <Button type="submit">{contact ? "Guardar Cambios" : "Crear Contacto"}</Button>
        </div>
      </form>
    </Form>
  );
}
