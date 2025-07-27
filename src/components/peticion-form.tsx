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
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres.").max(100, "El título es demasiado largo."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres.").max(1000, "La descripción es demasiado larga."),
});

interface PeticionFormProps {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  onCancel: () => void;
}

export default function PeticionForm({ onSubmit, onCancel }: PeticionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
      setIsSubmitting(true);
      // Simulate network delay for better UX
      setTimeout(() => {
          onSubmit(values);
          setIsSubmitting(false);
      }, 500);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Crear Nueva Petición</DialogTitle>
        <DialogDescription>
          Describe la situación o solicitud. Esto se enviará al administrador y a los clientes del condominio.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Fuga de agua en área común" {...field} disabled={isSubmitting} />
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
                <FormLabel>Descripción Detallada</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe con el mayor detalle posible la situación, ubicación, y cualquier otra información relevante."
                    className="min-h-[120px]"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Petición
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
