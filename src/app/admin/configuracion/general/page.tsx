
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Save, Palette, Bell } from "lucide-react";

export default function ConfiguracionPage() {
    const { toast } = useToast();
    // These states would be loaded from a config service in a real app
    const [companyName, setCompanyName] = useState("Glomar Condominio");
    const [contactEmail, setContactEmail] = useState("contacto@glomar.com");
    const [gracePeriod, setGracePeriod] = useState(15);
    const [primaryColor, setPrimaryColor] = useState("217 91% 60%");
    
    const [notifyOnPeticion, setNotifyOnPeticion] = useState(true);
    const [notifyOnReservation, setNotifyOnReservation] = useState(true);

    const handleSaveChanges = () => {
        // Here you would save the settings to a backend or local storage
        console.log({
            companyName,
            contactEmail,
            gracePeriod,
            primaryColor,
            notifyOnPeticion,
            notifyOnReservation
        });
        toast({
            title: "Configuración Guardada",
            description: "Tus cambios han sido guardados exitosamente.",
        });
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Configuración del Sistema</h2>
                    <p className="text-muted-foreground">
                        Ajusta los parámetros generales y las preferencias de la aplicación.
                    </p>
                </div>
                <Button onClick={handleSaveChanges}><Save className="mr-2 h-4 w-4"/> Guardar Cambios</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 grid gap-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Ajustes Generales</CardTitle>
                            <CardDescription>Información básica de la empresa o administración.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Nombre de la Empresa</Label>
                                <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactEmail">Correo de Contacto Principal</Label>
                                <Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gracePeriod">Periodo de Gracia para Retardos (minutos)</Label>
                                <Input id="gracePeriod" type="number" value={gracePeriod} onChange={(e) => setGracePeriod(Number(e.target.value))} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5"/> Personalización</CardTitle>
                             <CardDescription>Cambia la apariencia de la aplicación. Los cambios de color requieren recargar la página.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="primaryColor">Color Primario (HSL)</Label>
                                <Input id="primaryColor" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="217 91% 60%" />
                                <p className="text-xs text-muted-foreground">Usa el formato HSL sin "hsl()". Ej: <span className="font-mono">217 91% 60%</span></p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
               
                <Card className="lg:col-span-1 sticky top-24">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5"/> Notificaciones</CardTitle>
                        <CardDescription>Configura las notificaciones por correo para administradores.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="notify-peticion" className="flex flex-col space-y-1">
                                <span>Nuevas Peticiones</span>
                                <span className="font-normal leading-snug text-muted-foreground">
                                    Recibir un correo cuando un residente o guardia cree una nueva petición.
                                </span>
                            </Label>
                            <Switch id="notify-peticion" checked={notifyOnPeticion} onCheckedChange={setNotifyOnPeticion} />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="notify-reservation" className="flex flex-col space-y-1">
                                <span>Nuevas Reservas</span>
                                 <span className="font-normal leading-snug text-muted-foreground">
                                    Recibir un correo cuando un residente solicite una nueva reserva de área común.
                                </span>
                            </Label>
                            <Switch id="notify-reservation" checked={notifyOnReservation} onCheckedChange={setNotifyOnReservation}/>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
