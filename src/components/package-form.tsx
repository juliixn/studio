
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Building, User, Edit, AlertTriangle, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Address, TurnoInfo, User as UserType } from "@/lib/definitions";
import { addPackage } from "@/lib/packageService";
import { useToast } from "@/hooks/use-toast";
import { mockUsers } from "@/lib/data";
import { Checkbox } from "./ui/checkbox";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";

const formSchema = z.object({
  recipientAddressId: z.string().min(1, "El domicilio es requerido."),
  courierName: z.string().min(1, "El nombre del repartidor es requerido."),
  courierCompany: z.string().min(1, "La empresa de paquetería es requerida."),
  reportDamage: z.boolean().default(false).optional(),
  damageNotes: z.string().optional(),
}).refine(data => {
    if (data.reportDamage && (!data.damageNotes || data.damageNotes.trim() === '')) {
        return false;
    }
    return true;
}, {
    message: "Las notas de daño son requeridas si reporta un daño.",
    path: ["damageNotes"],
});

interface PackageFormProps {
    user: UserType;
    turnoInfo: TurnoInfo;
    addresses: Address[];
    onUpdate: () => void;
}

export function PackageForm({ user, turnoInfo, addresses, onUpdate }: PackageFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientAddressId: "",
      courierName: "",
      courierCompany: "",
      reportDamage: false,
      damageNotes: "",
    },
  });

  const reportDamage = form.watch("reportDamage");

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    const address = addresses.find(a => a.id === values.recipientAddressId);
    const recipient = mockUsers.find(u => u.addressId === values.recipientAddressId);

    if (!address || !recipient) {
        toast({ title: "Error", description: "No se pudo encontrar el destinatario para ese domicilio.", variant: "destructive" });
        return;
    }

    addPackage({
        recipientAddressId: values.recipientAddressId,
        recipientAddress: address.fullAddress,
        recipientName: recipient.name,
        courierName: values.courierName,
        courierCompany: values.courierCompany,
        damageNotes: values.damageNotes,
        receivedByGuardId: user.id,
        receivedByGuardName: user.name,
        condominioId: turnoInfo.condominioId,
    });
    
    toast({ title: "Paquete Registrado", description: `Se ha registrado un paquete para ${recipient.name}.`});
    onUpdate();
    form.reset();
  };

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
            control={form.control}
            name="recipientAddressId"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="flex items-center gap-2"><Building className="h-4 w-4" />Domicilio del Destinatario</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={addresses.length === 0}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder={addresses.length > 0 ? "Seleccione un domicilio" : "No hay domicilios"} />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {addresses.map(address => (
                        <SelectItem key={address.id} value={address.id}>{address.fullAddress}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="courierCompany"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2"><Truck className="h-4 w-4" />Empresa</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej: Estafeta" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="courierName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2"><User className="h-4 w-4" />Repartidor</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej: Pedro Páramo" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <FormField
              control={form.control}
              name="reportDamage"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Reportar daño o desperfecto
                    </FormLabel>
                    <FormDescription>
                      Marque esta casilla si el paquete llegó abierto, golpeado o con algún daño visible.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
             {reportDamage && (
                <FormField
                    control={form.control}
                    name="damageNotes"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" />Notas sobre el daño</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Ej: La caja está abierta en una esquina, el contenido parece estar bien." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
             )}
            <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" className="w-full">
                    <Edit className="mr-2 h-4 w-4" /> Registrar Paquete
                </Button>
            </div>
        </form>
    </Form>
  );
}
