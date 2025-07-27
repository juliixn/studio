
"use client";

import { useState, useEffect } from "react";
import type { User, ResidentAccount, Transaction } from "@/lib/definitions";
import { getResidentAccounts } from "@/lib/feeService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function MiEstadoDeCuentaPage() {
    const [user, setUser] = useState<User | null>(null);
    const [account, setAccount] = useState<ResidentAccount | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = sessionStorage.getItem("loggedInUser");
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
        }
    }, []);
    
    useEffect(() => {
        const fetchAccount = async () => {
            if (user) {
                setLoading(true);
                const userAccount = await getResidentAccounts(user.id);
                setAccount(userAccount);
                setLoading(false);
            }
        }
        fetchAccount();
    }, [user])

    const sortedTransactions = account?.transactions?.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];

    if (loading) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-10 w-1/2" />
                <Card><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
                 <Card><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
            </div>
        )
    }

    if (!account) {
        return (
             <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <Link href="/dashboard" passHref>
                        <Button variant="outline" size="icon" aria-label="Volver al panel">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Mi Estado de Cuenta</h2>
                    </div>
                </div>
                <Card className="text-center py-10">
                    <CardHeader>
                        <CardTitle>No Encontrado</CardTitle>
                        <CardDescription>No pudimos encontrar un estado de cuenta asociado a tu usuario.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard" passHref>
                <Button variant="outline" size="icon" aria-label="Volver al panel">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                </Link>
                <div>
                <h2 className="text-2xl font-bold tracking-tight">Mi Estado de Cuenta</h2>
                <p className="text-muted-foreground">
                    Consulta tu historial de cargos, pagos y saldo.
                </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Resumen Financiero</CardTitle>
                    <CardDescription>{account.residentName} - {account.address}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className={cn(
                        "p-6 rounded-lg text-center",
                        account.balance > 0 ? "bg-destructive/10 text-destructive" : "bg-green-600/10 text-green-700"
                    )}>
                        <p className="text-sm font-medium">{account.balance > 0 ? "Saldo Deudor" : "Saldo a Favor"}</p>
                        <p className="text-4xl font-bold">${Math.abs(account.balance).toFixed(2)}</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Transacciones</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Concepto</TableHead>
                                    <TableHead className="text-right">Monto</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedTransactions.length > 0 ? sortedTransactions.map(tx => (
                                    <TableRow key={tx.id}>
                                        <TableCell>{format(new Date(tx.date), "d MMM yyyy", { locale: es })}</TableCell>
                                        <TableCell>
                                            <Badge variant={tx.type === 'charge' ? 'destructive' : 'secondary'} className="gap-1.5">
                                                {tx.type === 'charge' ? <TrendingDown className="h-3.5 w-3.5"/> : <TrendingUp className="h-3.5 w-3.5"/>}
                                                {tx.type === 'charge' ? 'Cargo' : 'Pago'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{tx.concept}</TableCell>
                                        <TableCell className={cn("text-right font-medium", tx.type === 'charge' ? 'text-destructive' : 'text-green-700')}>
                                            {tx.type === 'charge' ? '-' : '+'}${(tx.amount || 0).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={4} className="text-center h-24">No hay transacciones registradas.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
