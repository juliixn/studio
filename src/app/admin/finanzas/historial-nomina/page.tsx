
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from 'next/link';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getArchivedPayrolls } from "@/lib/payrollService";
import type { ArchivedPayroll, User } from "@/lib/definitions";

export default function HistorialNominaPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [archivedPayrolls, setArchivedPayrolls] = useState<ArchivedPayroll[]>([]);
    
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const data = await getArchivedPayrolls();
            setArchivedPayrolls(data);
            setIsLoading(false);
        };
        fetchData();
    }, []);
    
    if (isLoading) {
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
                <h2 className="text-xl font-bold">Historial de Nómina</h2>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Nóminas Archivadas</CardTitle>
                    <CardDescription>Consulta las nóminas de periodos anteriores.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Periodo</TableHead>
                                    <TableHead>Monto Total Pagado</TableHead>
                                    <TableHead>Fecha de Archivo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></TableCell>
                                    </TableRow>
                                ) : archivedPayrolls.length > 0 ? (
                                    archivedPayrolls.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell>{format(new Date(p.period.from), "d MMM")} - {format(new Date(p.period.to), "d MMM yyyy")}</TableCell>
                                        <TableCell className="font-bold">${(p.totals.total).toFixed(2)}</TableCell>
                                        <TableCell>{format(new Date(p.archivedAt), "PPP p", { locale: es })}</TableCell>
                                    </TableRow>
                                ))) : (
                                     <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24">
                                            No hay nóminas archivadas.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
