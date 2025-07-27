
"use client";

import type { PanicAlert } from "@/lib/definitions";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "../ui/button";

interface PanicAlertBannerProps {
    alert: PanicAlert;
    onClear: (alertId: string) => void;
}

export default function PanicAlertBanner({ alert, onClear }: PanicAlertBannerProps) {
    return (
        <div className="sticky top-0 z-50 w-full bg-yellow-400 text-yellow-900 p-2 text-sm text-center font-semibold panic-banner-flash">
            <div className="container mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>
                        ALERTA DE PÁNICO ACTIVA: {alert.guardName} en {alert.condominioId}.
                    </span>
                </div>
                 <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-yellow-900 hover:bg-yellow-500/50"
                    onClick={() => onClear(alert.id)}
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Descartar Alerta</span>
                </Button>
            </div>
        </div>
    );
}
