
"use client";

import { format } from "date-fns/format";
import { es } from "date-fns/locale";
import type { BitacoraEntry, User } from "@/lib/definitions";
import { FilePlus, Edit, Car, User as UserIcon, ShieldCheck, Edit3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Button } from "./ui/button";

function getEntryIcon(type: BitacoraEntry['type']) {
    switch (type) {
        case 'Petición Creada': return <FilePlus className="h-4 w-4" />;
        case 'Manual': return <Edit className="h-4 w-4" />;
        case 'Registro Vehicular': return <Car className="h-4 w-4" />;
        case 'Registro Peatonal': return <UserIcon className="h-4 w-4" />;
        case 'Alerta Respondida': return <ShieldCheck className="h-4 w-4" />;
        default: return <Edit className="h-4 w-4" />;
    }
}

export default function BitacoraTimeline({ entries, currentUser, onEdit }: { entries: BitacoraEntry[], currentUser: User | null, onEdit?: (entry: BitacoraEntry) => void }) {
    if (entries.length === 0) {
        return <div className="text-center text-muted-foreground py-10">
            <ShieldCheck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium">No hay entradas en la bitácora</h3>
            <p className="mt-1 text-sm text-gray-500">Aún no se ha registrado ninguna novedad.</p>
        </div>;
    }
    
    return (
        <div className="relative space-y-6">
            <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-border -z-10" />
            {entries.map(entry => (
                <div key={entry.id} className="relative flex items-start gap-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center z-10">
                        {getEntryIcon(entry.type)}
                    </div>
                    <div className="flex-grow pt-1.5">
                        <div className="flex justify-between items-start">
                             <p className="text-sm text-muted-foreground">
                                <span className="font-semibold text-foreground">{entry.authorName}</span>
                                {' - '}
                                {format(new Date(entry.createdAt), "d MMM yyyy, HH:mm'h'", { locale: es })}
                                {entry.updatedAt && (
                                    <span className="text-xs italic text-muted-foreground/80"> (editado)</span>
                                )}
                            </p>
                            {onEdit && entry.type === 'Manual' && (currentUser?.role === 'Administrador' || entry.authorId === currentUser?.id) && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 -mt-1" onClick={() => onEdit(entry)}>
                                    <Edit3 className="h-4 w-4" />
                                    <span className="sr-only">Editar entrada</span>
                                </Button>
                            )}
                        </div>

                        <p className="mt-1">{entry.text}</p>
                        
                        {entry.photos && entry.photos.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {entry.photos.map((photo, index) => (
                                    <div key={index} className="relative aspect-square w-full overflow-hidden rounded-md group">
                                        <Image
                                            src={photo}
                                            alt={`Foto de la bitácora ${index + 1}`}
                                            fill
                                            sizes="(max-width: 768px) 50vw, 33vw"
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            data-ai-hint="security evidence"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <Badge variant="secondary" className="mt-2">{entry.type}</Badge>
                    </div>
                </div>
            ))}
        </div>
    );
}
