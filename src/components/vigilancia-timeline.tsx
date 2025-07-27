
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { AlertResponse } from "@/lib/definitions";
import { ShieldCheck, User, Trees, Clock } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";

function PhotoViewer({ src, alt }: { src: string, alt: string }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="relative aspect-square w-full overflow-hidden rounded-md group cursor-pointer">
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint="security photo"
                    />
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <div className="relative aspect-video">
                    <Image src={src} alt={alt} fill className="object-contain" />
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function VigilanciaTimeline({ responses }: { responses: AlertResponse[] }) {
    if (responses.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-10">
                <ShieldCheck className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium">No hay reportes de vigilancia</h3>
                <p className="mt-1 text-sm text-gray-500">Aún no se ha registrado ninguna respuesta a alertas.</p>
            </div>
        );
    }
    
    return (
        <div className="relative space-y-6">
            <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-border -z-10" />
            {responses.map(res => (
                <div key={res.id} className="relative flex items-start gap-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center z-10">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div className="flex-grow pt-1.5">
                        <p className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">{res.guardName}</span>
                            {' - '}
                            {format(new Date(res.createdAt), "d MMM yyyy, HH:mm'h'", { locale: es })}
                        </p>
                        
                        <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                           <Clock className="h-4 w-4 text-primary" />
                           Respuesta en: <span className="font-semibold text-foreground">{res.responseTimeSeconds} segundos</span>
                        </p>

                        <p className="mt-2 text-base bg-muted/50 p-3 rounded-md border">{res.comment}</p>
                        
                        <div className="mt-3 grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><User className="h-3 w-3" />Selfie</p>
                                <PhotoViewer src={res.selfiePhotoUrl} alt={`Selfie de ${res.guardName}`} />
                           </div>
                           <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Trees className="h-3 w-3" />Entorno</p>
                                <PhotoViewer src={res.environmentPhotoUrl} alt={`Entorno de ${res.guardName}`} />
                           </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
