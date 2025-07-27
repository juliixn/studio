
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { User as UserIcon, Building, FileText, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "./ui/textarea";
import { visitorTypes, allAddresses } from "@/lib/data";
import type { Address, User, Condominio } from "@/lib/definitions";
import { useState, useEffect } from "react";
import { addVisitorNotification } from "@/lib/visitorNotificationService";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  who: z.string().min(1, "El nombre del visitante es requerido."),
  visitorType: z.string().min(1, "El tipo de visitante es requerido."),
  subject: z.string().min(1, "El asunto es requerido."),
  condominioId: z.string().optional(),
  addressId: z.string().min(1, "El domicilio es requerido."),
});

interface VisitorNotificationFormProps {
  user: User;
  condominios: Condominio[];
  addresses: Address[];
  onNotificationCreated: () => void;
}

export default function VisitorNotificationForm({ user, condominios, addresses, onNotificationCreated }: VisitorNotificationFormProps) {
    const { toast } = useToast();
    const [availableAddresses, setAvailableAddresses] = useState<Address[]>([]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            who: "",
            visitorType: "Visitante",
            subject: "",
            condominioId: user.role === 'Administrador' ? '' : user.condominioId,
            addressId: user.role === 'Propietario' || user.role === 'Renta' ? user.addressId : '',
        },
    });

    const selectedCondoId = form.watch("condominioId");

    useEffect(() => {
        if (selectedCondoId) {
            setAvailableAddresses(addresses.filter(a => a.condominioId === selectedCondoId));
        } else {
            setAvailableAddresses([]);
        }
        form.setValue('addressId', '');
    }, [selectedCondoId, addresses, form]);

    const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
        addVisitorNotification({
            ...values,
            residentId: user.id,
        });
        toast({ title: "Notificación Enviada", description: "El guardia ha sido notificado de su próxima visita." });
        onNotificationCreated();
        form.reset();
    };
    
    const showCondoSelector = user.role === 'Administrador';
    const showAddressSelector = user.role === 'Administrador' || user.role === 'Cliente';
    const fixedAddress = user.role === 'Propietario' || user.role === 'Renta' ? addresses.find(a => a.id === user.addressId) : null;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="who"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><UserIcon className="h-4 w-4" />Quién(es) nos visitan</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej: Juan Pérez" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="visitorType"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><Users className="h-4 w-4" />Tipo de Visitante</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un tipo" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {visitorTypes.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 {showCondoSelector && (
                    <FormField
                        control={form.control}
                        name="condominioId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Condominio</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Seleccione condominio" /></SelectTrigger></FormControl>
                                <SelectContent>{condominios.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                )}
                {showAddressSelector && (
                    <FormField
                        control={form.control}
                        name="addressId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Domicilio a Visitar</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCondoId || availableAddresses.length === 0}>
                                <FormControl><SelectTrigger><SelectValue placeholder={!selectedCondoId ? "Seleccione un condominio" : "Seleccione domicilio"} /></SelectTrigger></FormControl>
                                <SelectContent>{availableAddresses.map(a => <SelectItem key={a.id} value={a.id}>{a.fullAddress}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                )}
                {fixedAddress && (
                    <FormItem>
                        <FormLabel>Domicilio a Visitar</FormLabel>
                        <Input value={`${fixedAddress.fullAddress} (${condominios.find(c => c.id === fixedAddress.condominioId)?.name})`} disabled />
                    </FormItem>
                )}
                <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2"><FileText className="h-4 w-4" />Asunto</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Ej: Reunión familiar, entrega de pedido, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end pt-4">
                    <Button type="submit">Enviar Notificación</Button>
                </div>
            </form>
        </Form>
    );
}
