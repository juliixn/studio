
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { PayrollData } from "@/lib/definitions";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Building2, Download } from "lucide-react";

interface PayrollReceiptProps {
  details: PayrollData;
  period: DateRange;
  companyName?: string;
}

export function PayrollReceipt({
  details,
  period,
  companyName = "Glomar Condominio",
}: PayrollReceiptProps) {
    const formatCurrency = (amount: number) => {
        return `$${amount.toFixed(2)}`;
    };

    const handlePrint = () => {
        window.print();
    };

  return (
    <div className="bg-background text-foreground p-2 sm:p-4 lg:p-6 print:p-0">
      <Card className="w-full max-w-2xl mx-auto print:shadow-none print:border-none">
        <CardHeader className="text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">{companyName}</CardTitle>
          </div>
          <CardDescription>Comprobante de Nómina</CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="font-semibold">Empleado:</p>
              <p>{details.name}</p>
            </div>
            <div>
              <p className="font-semibold">Periodo:</p>
              <p>
                {period.from && format(period.from, "PPP", { locale: es })} -{" "}
                {period.to && format(period.to, "PPP", { locale: es })}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Percepciones</h3>
            <div className="flow-root">
              <dl className="space-y-1">
                <div className="flex justify-between">
                  <dt>Salario ({details.daysWorked} días)</dt>
                  <dd>{formatCurrency(details.subtotal)}</dd>
                </div>
                {details.bonuses.map((bonus) => (
                  <div key={bonus.id} className="flex justify-between">
                    <dt>Bono: {bonus.reason}</dt>
                    <dd className="text-green-600">{formatCurrency(bonus.amount)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Deducciones</h3>
             <div className="flow-root">
              <dl className="space-y-1">
                {details.loanDeduction > 0 && (
                    <div className="flex justify-between">
                        <dt>Abono a Préstamo</dt>
                        <dd className="text-red-600">-{formatCurrency(details.loanDeduction)}</dd>
                    </div>
                )}
                 {details.penalties.map((penalty) => (
                  <div key={penalty.id} className="flex justify-between">
                    <dt>Penalización: {penalty.reason}</dt>
                    <dd className="text-red-600">-{formatCurrency(penalty.amount)}</dd>
                  </div>
                ))}
                {details.loanDeduction === 0 && details.penalties.length === 0 && (
                    <p className="text-muted-foreground text-xs">Sin deducciones</p>
                )}
              </dl>
            </div>
          </div>

          <Separator />
          
           <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 font-bold text-base">
                <p>Total Percepciones:</p>
                <p className="text-right">{formatCurrency(details.subtotal + details.totalBonuses)}</p>
                <p>Total Deducciones:</p>
                <p className="text-right text-red-600">-{formatCurrency(details.loanDeduction + details.totalPenalties)}</p>
                <p className="text-lg">Neto a Pagar:</p>
                <p className="text-right text-lg">{formatCurrency(details.total)}</p>
           </div>
           
        </CardContent>
        <CardFooter className="print:hidden flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <Button onClick={handlePrint} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Imprimir o Guardar como PDF
            </Button>
            <p className="text-xs text-muted-foreground text-center sm:text-left">
              La opción "Guardar como PDF" está disponible en el diálogo de impresión de su navegador.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
