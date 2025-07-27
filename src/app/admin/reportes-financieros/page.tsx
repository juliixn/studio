
"use client";

import { useState, useMemo } from "react";
import { DateRange } from "react-day-picker";
import { addDays, format, isWithinInterval, eachMonthOfInterval, startOfMonth } from "date-fns";
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar as CalendarIcon, DollarSign, TrendingUp, TrendingDown, FileText } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { getArchivedPayrolls } from "@/lib/payrollService";
import { getResidentAccounts } from "@/lib/feeService";
import type { ArchivedPayroll, ResidentAccount, Transaction } from "@/lib/definitions";
import { BarChart, Bar, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ChartTooltipContent, ChartContainer } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";


interface MonthlyData {
    month: string;
    ingresos: number;
    egresos: number;
}

export default function ReportesFinancierosPage() {
    const [date, setDate] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: new Date(),
    });

    const { summary, chartData, transactions } = useMemo(() => {
        if (!date?.from || !date?.to) {
            return { summary: { ingresos: 0, egresos: 0, balance: 0 }, chartData: [], transactions: [] };
        }
        
        const normalizedEndDate = new Date(date.to);
        normalizedEndDate.setHours(23, 59, 59, 999);

        // Calculate Income from resident payments
        const accounts = getResidentAccounts();
        const payments = accounts.flatMap(acc => acc.transactions)
            .filter(tx => tx.type === 'payment' && isWithinInterval(new Date(tx.date), { start: date.from!, end: normalizedEndDate }));
        const totalIngresos = payments.reduce((sum, tx) => sum + tx.amount, 0);

        // Calculate Expenses from payrolls
        const payrolls = getArchivedPayrolls()
            .filter(p => isWithinInterval(new Date(p.archivedAt), { start: date.from!, end: normalizedEndDate }));
        const totalEgresos = payrolls.reduce((sum, p) => sum + p.totals.total, 0);

        const balance = totalIngresos - totalEgresos;

        // Prepare chart data
        const months = eachMonthOfInterval({ start: date.from, end: date.to });
        const monthlyData: MonthlyData[] = months.map(monthStart => {
            const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);
            const monthIngresos = payments
                .filter(p => isWithinInterval(new Date(p.date), { start: monthStart, end: monthEnd }))
                .reduce((sum, p) => sum + p.amount, 0);
            const monthEgresos = payrolls
                .filter(p => isWithinInterval(new Date(p.archivedAt), { start: monthStart, end: monthEnd }))
                .reduce((sum, p) => sum + p.totals.total, 0);
                
            return {
                month: format(monthStart, "MMM yyyy", { locale: es }),
                ingresos: monthIngresos,
                egresos: monthEgresos,
            };
        });
        
        const allTransactions = [
            ...payments.map(p => ({ ...p, date: new Date(p.date) })),
            ...payrolls.map(p => ({ id: p.id, date: new Date(p.archivedAt), type: 'expense' as const, concept: `Nómina ${format(new Date(p.period.from), 'd MMM')} - ${format(new Date(p.period.to), 'd MMM')}`, amount: p.totals.total }))
        ].sort((a,b) => b.date.getTime() - a.date.getTime());

        return {
            summary: { ingresos: totalIngresos, egresos: totalEgresos, balance },
            chartData: monthlyData,
            transactions: allTransactions
        };
    }, [date]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Reportes Financieros</h2>
                    <p className="text-muted-foreground">Analiza los ingresos y egresos de todos los condominios.</p>
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button id="date" variant={"outline"} className={cn("w-full sm:w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (date.to ? (<>{format(date.from, "LLL dd, y", { locale: es })} - {format(date.to, "LLL dd, y", { locale: es })}</>) : (format(date.from, "LLL dd, y", { locale: es }))) : (<span>Selecciona un periodo</span>)}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end"><Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} locale={es} /></PopoverContent>
                </Popover>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle><TrendingUp className="h-4 w-4 text-green-500" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-green-600">${summary.ingresos.toFixed(2)}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Egresos Totales</CardTitle><TrendingDown className="h-4 w-4 text-red-500" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-red-600">${summary.egresos.toFixed(2)}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Balance</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className={cn("text-2xl font-bold", summary.balance >= 0 ? "text-foreground" : "text-destructive")}>${summary.balance.toFixed(2)}</div></CardContent>
                </Card>
            </div>
            
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Resumen Mensual</CardTitle>
                        <CardDescription>Comparación de ingresos y egresos por mes en el periodo seleccionado.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={{}} className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                                    <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                                    <Bar dataKey="ingresos" name="Ingresos" fill="hsl(var(--primary))" radius={4} />
                                    <Bar dataKey="egresos" name="Egresos" fill="hsl(var(--destructive))" radius={4} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Detalle de Transacciones</CardTitle>
                        <CardDescription>Todas las transacciones en el periodo seleccionado.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px] overflow-y-auto">
                           <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Concepto</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell>{format(tx.date, 'dd/MM/yy')}</TableCell>
                                    <TableCell className="text-xs">{tx.concept}</TableCell>
                                    <TableCell
                                    className={cn(
                                        'text-right font-semibold',
                                        tx.type === 'payment' ? 'text-green-600' : 'text-red-600'
                                    )}
                                    >
                                    {tx.type === 'payment' ? '+' : '-'}${tx.amount.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                                ))}
                                {transactions.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No hay transacciones en este periodo.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
