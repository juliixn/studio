
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, ArrowLeft, Loader2 } from "lucide-react";
import Link from 'next/link';
import { addMonths, format, es } from 'date-fns';

import { useToast } from "@/hooks/use-toast";
import { getResidentAccounts, addCharge, addPayment } from "@/lib/feeService";
import type { User, ResidentAccount } from "@/lib/definitions";
import { ChargeForm } from "@/components/admin/charge-form";
import { PaymentForm } from "@/components/admin/payment-form";
import { Skeleton } from "@/components/ui/skeleton";

function AdmCondoFinanzasView({ accounts, onCharge, onPayment }: { accounts: ResidentAccount[], onCharge: (account: ResidentAccount) => void, onPayment: (account: ResidentAccount) => void }) {
    const router = useRouter();

    const getStatusVariant = (balance: number): "destructive" | "default" | "secondary" => {
        if (balance > 0) return 'destructive';
        if (balance < 0) return 'default';
        return 'secondary';
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Cuentas de Residentes</CardTitle>
                <CardDescription>
                    Gestiona los cargos y pagos de los residentes de tu condominio.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-md overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Residente</TableHead>
                                <TableHead>Domicilio</TableHead>
                                <TableHead>Saldo</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {accounts.length > 0 ? accounts.map((account) => (
                                <TableRow key={account.residentId}>
                                    <TableCell className="font-medium">{account.residentName}</TableCell>
                                    <TableCell>{account.address}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(account.balance)}>
                                            ${account.balance.toFixed(2)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onCharge(account)}>Añadir Cargo</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onPayment(account)}>Registrar Pago</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => router.push(`/admin/usuarios/${account.residentId}`)}>Ver Historial</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )) : <TableRow><TableCell colSpan={4} className="text-center h-24">No hay cuentas de residentes para mostrar.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

export default function CuotasPage() {
    const { toast } = useToast();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [residentAccounts, setResidentAccounts] = useState<ResidentAccount[]>([]);
    const [selectedResident, setSelectedResident] = useState<ResidentAccount | null>(null);
    const [isChargeFormOpen, setIsChargeFormOpen] = useState(false);
    const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
    
    const refreshData = async (userCondoId?: string) => {
        setIsLoading(true);
        const allAccounts = await getResidentAccounts();
        setResidentAccounts(userCondoId ? allAccounts.filter(a => a.condominioId === userCondoId) : allAccounts);
        setIsLoading(false);
    }

    useEffect(() => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setCurrentUser(user);
        }
    }, []);

    useEffect(() => {
        if (currentUser) {
            const userCondoId = currentUser.role === 'Adm. Condo' ? currentUser.condominioId : undefined;
            refreshData(userCondoId);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]);

    const handleOpenChargeForm = (account: ResidentAccount) => {
        setSelectedResident(account);
        setIsChargeFormOpen(true);
    };

    const handleAddCharge = async (values: any) => {
        if (!selectedResident) return;

        const concept = values.concept === 'Otro' ? values.customConcept : values.concept;
        const userCondoId = currentUser?.role === 'Adm. Condo' ? currentUser.condominioId : undefined;
        let chargesCreated = 0;

        if (values.isRecurring) {
            let currentDate = values.recurringStartDate;
            const interval = values.recurringInterval === 'monthly' ? 1 : 2;
            for (let i = 0; i < values.recurringCount; i++) {
                const chargeConcept = `${concept} - ${format(currentDate, "MMMM yyyy", { locale: es })}`;
                await addCharge(selectedResident.residentId, chargeConcept, values.amount, currentDate.toISOString());
                currentDate = addMonths(currentDate, interval);
                chargesCreated++;
            }
             toast({ title: "Cargos Programados", description: `Se han programado ${chargesCreated} cargos para ${selectedResident.residentName}.` });
        } else {
            await addCharge(selectedResident.residentId, concept, values.amount);
            toast({ title: "Cargo Añadido", description: `Se ha añadido un cargo de $${values.amount.toFixed(2)} a ${selectedResident.residentName}.` });
        }
        
        await refreshData(userCondoId);
        setIsChargeFormOpen(false);
        setSelectedResident(null);
    };
    
    const handleOpenPaymentForm = (account: ResidentAccount) => {
        setSelectedResident(account);
        setIsPaymentFormOpen(true);
    };

    const handleAddPayment = async (values: { concept: string, amount: number }) => {
        if (selectedResident) {
            await addPayment(selectedResident.residentId, values.concept, values.amount);
            toast({ title: "Pago Registrado", description: `Se ha registrado un pago de $${values.amount.toFixed(2)} de ${selectedResident.residentName}.` });
            const userCondoId = currentUser?.role === 'Adm. Condo' ? currentUser.condominioId : undefined;
            await refreshData(userCondoId);
            setIsPaymentFormOpen(false);
            setSelectedResident(null);
        }
    };
    
    if (!currentUser) {
        return <Skeleton className="h-96 w-full" />;
    }
    
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                 <Link href="/admin/finanzas" passHref>
                    <Button variant="outline" size="icon" aria-label="Volver a Finanzas">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h2 className="text-xl font-bold">Cuotas y Pagos</h2>
            </div>
            
            {isLoading ? (
                <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin"/></div>
            ) : (
                <AdmCondoFinanzasView accounts={residentAccounts} onCharge={handleOpenChargeForm} onPayment={handleOpenPaymentForm} />
            )}

            <Dialog open={isChargeFormOpen} onOpenChange={setIsChargeFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Añadir Cargo a {selectedResident?.residentName}</DialogTitle>
                    </DialogHeader>
                    <ChargeForm onSubmit={handleAddCharge} onCancel={() => setIsChargeFormOpen(false)} />
                </DialogContent>
            </Dialog>
            <Dialog open={isPaymentFormOpen} onOpenChange={setIsPaymentFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Pago de {selectedResident?.residentName}</DialogTitle>
                    </DialogHeader>
                    <PaymentForm onSubmit={handleAddPayment} onCancel={() => setIsPaymentFormOpen(false)} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
