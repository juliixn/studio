
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Ban, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { getLoans, updateLoanStatus } from "@/lib/payrollService";
import type { Loan } from "@/lib/definitions";
import { Badge } from "@/components/ui/badge";

export default function PrestamosPage() {
    const { toast } = useToast();
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loanToUpdate, setLoanToUpdate] = useState<{loan: Loan, status: 'Aprobado' | 'Rechazado'} | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshData = async () => {
        setIsLoading(true);
        const data = await getLoans();
        setLoans(data);
        setIsLoading(false);
    }

    useEffect(() => {
        refreshData();
    }, []);

    const handleUpdateLoan = async () => {
        if (!loanToUpdate) return;
        await updateLoanStatus(loanToUpdate.loan.id, loanToUpdate.status);
        toast({ title: "Préstamo Actualizado", description: `El préstamo de ${loanToUpdate.loan.guardName} ha sido ${loanToUpdate.status.toLowerCase()}.` });
        await refreshData();
        setLoanToUpdate(null);
    }
    
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                 <Link href="/admin/finanzas" passHref>
                    <Button variant="outline" size="icon" aria-label="Volver a Finanzas">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h2 className="text-xl font-bold">Préstamos y Adelantos</h2>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Gestión de Préstamos</CardTitle>
                    <CardDescription>Aprueba o rechaza las solicitudes de préstamos de los guardias.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Guardia</TableHead>
                                    <TableHead>Monto Solicitado</TableHead>
                                    <TableHead>Saldo Pendiente</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={6} className="text-center h-24"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></TableCell></TableRow>
                                ) : loans.map(loan => (
                                    <TableRow key={loan.id}>
                                        <TableCell className="font-medium">{loan.guardName}</TableCell>
                                        <TableCell>${(loan.amount).toFixed(2)}</TableCell>
                                        <TableCell className="font-semibold">${(loan.balance).toFixed(2)}</TableCell>
                                        <TableCell>{format(new Date(loan.requestedAt), "PPP", { locale: es })}</TableCell>
                                        <TableCell><Badge variant={loan.status === 'Aprobado' ? 'default' : (loan.status === 'Pagado' ? 'secondary' : 'outline')}>{loan.status}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            {loan.status === 'Pendiente' && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => setLoanToUpdate({loan, status: 'Aprobado'})} className="text-green-600 focus:text-green-700">
                                                            <CheckCircle className="mr-2 h-4 w-4"/> Aprobar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setLoanToUpdate({loan, status: 'Rechazado'})} className="text-destructive focus:text-destructive">
                                                            <Ban className="mr-2 h-4 w-4"/> Rechazar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={!!loanToUpdate} onOpenChange={(open) => !open && setLoanToUpdate(null)}>
                 <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar acción?</AlertDialogTitle>
                        <AlertDialogDescription>
                           Se va a {loanToUpdate?.status.toLowerCase()} el préstamo de {loanToUpdate?.loan.guardName}. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleUpdateLoan}>Sí, confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                 </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
