
"use client";

import QRCode from "qrcode.react";
import type { GuestPass } from "@/lib/definitions";
import { Button } from "./ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2, Car, User, Calendar, CalendarOff } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface QrCodeDisplayProps {
    pass: GuestPass;
    onDelete: (passId: string) => void;
}

export default function QrCodeDisplay({ pass, onDelete }: QrCodeDisplayProps) {
    return (
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={pass.id}>
          <AccordionTrigger>
              <div className="flex items-center gap-4 text-left">
                  <div className="p-1 bg-white rounded-md">
                      <QRCode value={pass.id} size={40} />
                  </div>
                  <div>
                      <p className="font-semibold">{pass.guestName}</p>
                      <p className="text-sm text-muted-foreground">
                          {pass.passType === 'permanent' 
                            ? <span className="flex items-center gap-1.5"><CalendarOff className="h-4 w-4 text-green-600"/> Permanente</span> 
                            : <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4"/> Vence: {format(new Date(pass.validUntil!), 'PPP', { locale: es })}</span>
                          }
                      </p>
                  </div>
              </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col items-center gap-4 text-center p-4 border-t">
                <div className="p-4 bg-white rounded-lg border">
                    <QRCode
                        value={pass.id}
                        size={180}
                        level={"H"}
                        includeMargin={true}
                    />
                </div>
                <div className="space-y-1">
                    <p className="font-medium">{pass.guestName}</p>
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                        {pass.accessType === 'vehicular' ? <Car className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        <span>{pass.accessType === 'vehicular' ? `Vehicular (${pass.licensePlate})` : 'Peatonal'}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{pass.visitorType}</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => onDelete(pass.id)}>
                    <Trash2 className="mr-2 h-4 w-4"/>
                    Eliminar Pase
                </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
}
