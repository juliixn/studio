
"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, PlusCircle, ArrowLeft, TriangleAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { Skeleton } from "@/components/ui/skeleton";
import { getList, updateList, type ListKey } from "@/lib/listService";

function EditableList({ title, listKey }: { title: string, listKey: ListKey }) {
    const { toast } = useToast();
    const [items, setItems] = useState<string[]>([]);
    const [newItem, setNewItem] = useState("");

    useEffect(() => {
        setItems(getList(listKey));
    }, [listKey]);

    const handleAddItem = () => {
        if (newItem.trim() === "") {
            toast({ title: "Error", description: "El campo no puede estar vacío.", variant: "destructive" });
            return;
        }
        if (items.some(item => item.toLowerCase() === newItem.trim().toLowerCase())) {
            toast({ title: "Error", description: "Este elemento ya existe en la lista.", variant: "destructive" });
            return;
        }
        const updatedItems = [...items, newItem.trim()];
        updateList(listKey, updatedItems);
        setItems(updatedItems);
        setNewItem("");
        toast({ title: "Éxito", description: `"${newItem.trim()}" ha sido añadido a la lista.` });
    };

    const handleDeleteItem = (itemToDelete: string) => {
        const updatedItems = items.filter(item => item !== itemToDelete);
        updateList(listKey, updatedItems);
        setItems(updatedItems);
        toast({ title: "Eliminado", description: `"${itemToDelete}" ha sido eliminado.` });
    };

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Hay {items.length} elementos en esta lista.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 flex-grow max-h-72 overflow-y-auto">
                {items.length > 0 ? items.map(item => (
                    <div key={item} className="flex justify-between items-center bg-muted p-2 rounded-md text-sm">
                        <span>{item}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteItem(item)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar {item}</span>
                        </Button>
                    </div>
                )) : (
                    <p className="text-muted-foreground text-sm text-center py-4">No hay elementos en esta lista.</p>
                )}
            </CardContent>
            <CardFooter>
                <div className="flex w-full items-center space-x-2">
                    <Input 
                        value={newItem} 
                        onChange={(e) => setNewItem(e.target.value)} 
                        placeholder="Añadir nuevo elemento..."
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddItem();
                            }
                        }}
                    />
                    <Button onClick={handleAddItem}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Añadir
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}

// A wrapper component to handle client-side logic with Suspense
function GestionarListasContent() {
    const searchParams = useSearchParams();
    const formType = searchParams.get('form');

    const formConfig = {
        registro: {
            title: "Listas para Formularios de Registro",
            description: "Edite las opciones para los registros vehiculares y peatonales.",
            lists: [
                { title: "Tipos de Visitante (Peatonal)", listKey: 'visitorTypes' as ListKey },
                { title: "Tipos de Visitante (Vehicular)", listKey: 'vehicleVisitorTypes' as ListKey },
                { title: "Tipos de Vehículo", listKey: 'vehicleTypes' as ListKey },
                { title: "Marcas de Vehículo", listKey: 'vehicleBrands' as ListKey },
                { title: "Colores de Vehículo", listKey: 'vehicleColors' as ListKey },
            ]
        },
        pases: {
            title: "Listas para Formularios de Pases de Invitado",
            description: "Edite las opciones que se muestran al generar pases con código QR.",
            lists: [
                { title: "Tipos de Visitante", listKey: 'visitorTypes' as ListKey },
                { title: "Tipos de Vehículo", listKey: 'vehicleTypes' as ListKey },
                { title: "Marcas de Vehículo", listKey: 'vehicleBrands' as ListKey },
                { title: "Colores de Vehículo", listKey: 'vehicleColors' as ListKey },
            ]
        },
        guardia: {
            title: "Listas para Formularios de Guardia",
            description: "Edite las opciones para el equipo y el reporte de incidentes de los guardias.",
            lists: [
                { title: "Equipo de Guardia", listKey: 'equipment' as ListKey },
                { title: "Categorías de Incidente", listKey: 'incidentCategories' as ListKey },
            ]
        }
    };
    
    const currentConfig = formConfig[formType as keyof typeof formConfig];

    if (!currentConfig) {
        return (
             <div className="flex flex-col items-center justify-center text-center py-16">
                <TriangleAlert className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-xl font-bold">Formulario no especificado</h2>
                <p className="text-muted-foreground mt-2">Por favor, vuelva a la página anterior y seleccione un grupo de formularios para gestionar.</p>
                <Link href="/admin/listas" passHref>
                    <Button variant="outline" className="mt-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la selección
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                 <Link href="/admin/listas" passHref>
                    <Button variant="outline" size="icon" aria-label="Volver a listas">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{currentConfig.title}</h2>
                    <p className="text-muted-foreground">{currentConfig.description}</p>
                </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {currentConfig.lists.map(list => (
                    <EditableList key={list.listKey} title={list.title} listKey={list.listKey} />
                ))}
            </div>
        </div>
    );
}


export default function GestionarListasPage() {
    return (
        <Suspense fallback={<Skeleton className="w-full h-96" />}>
            <GestionarListasContent />
        </Suspense>
    )
}
