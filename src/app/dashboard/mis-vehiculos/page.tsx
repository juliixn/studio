
"use client";

import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ArrowLeft, PlusCircle, Car, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vehicleBrands, vehicleColors, vehicleTypes } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import type { User, VehicleInfo } from "@/lib/definitions";
import { getUserVehicles, addUserVehicle, updateUserVehicle, deleteUserVehicle } from "@/lib/vehicleService";

const formSchema = z.object({
  alias: z.string().optional(),
  licensePlate: z.string().min(1, "La placa es requerida."),
  brand: z.string().min(1, "La marca es requerida."),
  color: z.string().min(1, "El color es requerido."),
  type: z.string().min(1, "El tipo es requerido."),
});

function VehicleForm({
  vehicle,
  onSubmit,
  onCancel,
}: {
  vehicle?: VehicleInfo;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  onCancel: () => void;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      alias: vehicle?.alias || "",
      licensePlate: vehicle?.licensePlate || "",
      brand: vehicle?.brand || "",
      color: vehicle?.color || "",
      type: vehicle?.type || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField control={form.control} name="alias" render={({ field }) => ( <FormItem> <FormLabel>Alias (Ej: Mi Coche, Coche de Esposa)</FormLabel> <FormControl> <Input placeholder="Mi Coche" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
        <FormField control={form.control} name="licensePlate" render={({ field }) => ( <FormItem> <FormLabel>Placas</FormLabel> <FormControl> <Input placeholder="ABC-123" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField control={form.control} name="brand" render={({ field }) => (<FormItem><FormLabel>Marca</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Marca" /></SelectTrigger></FormControl><SelectContent>{vehicleBrands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="color" render={({ field }) => (<FormItem><FormLabel>Color</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Color" /></SelectTrigger></FormControl><SelectContent>{vehicleColors.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger></FormControl><SelectContent>{vehicleTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
        </div>
        <DialogFooter className="pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">{vehicle ? "Guardar Cambios" : "Añadir Vehículo"}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function MisVehiculosPage() {
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [vehicles, setVehicles] = useState<VehicleInfo[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [vehicleToEdit, setVehicleToEdit] = useState<VehicleInfo | undefined>(undefined);

    useEffect(() => {
        const storedUser = sessionStorage.getItem("loggedInUser");
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setVehicles(getUserVehicles(parsedUser.id));
        }
    }, []);

    const refreshVehicles = () => {
        if (user) {
            setVehicles(getUserVehicles(user.id));
        }
    };
    
    const handleOpenForm = (vehicle?: VehicleInfo) => {
        setVehicleToEdit(vehicle);
        setIsFormOpen(true);
    }
    
    const handleCloseForm = () => {
        setVehicleToEdit(undefined);
        setIsFormOpen(false);
    }

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        if (!user) return;
        if (vehicleToEdit) {
            updateUserVehicle(user.id, vehicleToEdit.id, values);
            toast({ title: "Vehículo actualizado" });
        } else {
            addUserVehicle(user.id, values);
            toast({ title: "Vehículo añadido" });
        }
        refreshVehicles();
        handleCloseForm();
    };
    
    const handleDelete = (vehicleId: string) => {
        if (!user) return;
        deleteUserVehicle(user.id, vehicleId);
        toast({ title: "Vehículo eliminado", variant: "destructive" });
        refreshVehicles();
    }

  return (
    <>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/dashboard" passHref>
          <Button variant="outline" size="icon" aria-label="Volver al panel" className="flex-shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-grow">
          <h2 className="text-2xl font-bold tracking-tight">Mis Vehículos</h2>
          <p className="text-muted-foreground">
            Añade tus vehículos frecuentes para agilizar la creación de pases de invitado.
          </p>
        </div>
        <Button onClick={() => handleOpenForm()} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Añadir Vehículo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehículos Registrados</CardTitle>
          <CardDescription>
            Tienes {vehicles.length} vehículo(s) guardado(s).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alias / Placa</TableHead>
                  <TableHead>Marca y Tipo</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.length > 0 ? vehicles.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">
                        {v.alias || v.licensePlate}
                        {v.alias && <p className="text-xs text-muted-foreground font-mono">{v.licensePlate}</p>}
                    </TableCell>
                    <TableCell>{v.brand} {v.type}</TableCell>
                    <TableCell>{v.color}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenForm(v)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            No has registrado ningún vehículo.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
    
    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{vehicleToEdit ? 'Editar Vehículo' : 'Añadir Nuevo Vehículo'}</DialogTitle>
            </DialogHeader>
            <VehicleForm vehicle={vehicleToEdit} onSubmit={handleSubmit} onCancel={handleCloseForm} />
        </DialogContent>
    </Dialog>
    </>
  );
}
