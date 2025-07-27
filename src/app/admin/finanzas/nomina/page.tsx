
"use client";

import { useState, useEffect, useMemo } from "react";
import { DateRange } from "react-day-picker";
import { addDays, format, isWithinInterval } from "date-fns";
import { es } from 'date-fns/locale';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, PlusCircle, MinusCircle, DollarSign, TrendingUp, TrendingDown, Archive, FileDown, Eye, Receipt, AlertTriangle, Loader2, ArrowLeft } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { getUsers } from "@/lib/userService";
import { getShiftRecords } from "@/lib/shiftService";
import { getArchivedPayrolls, archivePayroll, getLoans, applyPayrollDeductions } from "@/lib/payrollService";
import type { User, ShiftRecord, PayrollDetails, PayrollData, ArchivedPayroll, PayrollAdjustment, Loan } from "@/lib/definitions";
import { analyzePayroll } from "@/ai/flows/analyze-payroll-flow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PayrollReceipt } from "@/components/admin/payroll-receipt";
import Link from 'next/link';

// --- Sub-component for Adjustment Dialog ---
interface AdjustmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: 'bonus' | 'penalty';
    guardName: string;
    onSave: (amount: number, reason: string) => void;
}

function AdjustmentDialog({ open, onOpenChange, type, guardName, onSave }: AdjustmentDialogProps) {
    const [amount, setAmount] = useState<number | ''>('');
    const [reason, setReason] = useState('');

    const handleSubmit = () => {
        if (typeof amount === 'number' && amount > 0 && reason.trim()) {
            onSave(amount, reason);
            setAmount('');
            setReason('');
        }
    };
    
    const title = type === 'bonus' ? 'Añadir Bono' : 'Añadir Penalización';
    const description = `Añadir un ajuste al salario de ${guardName}.`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                        <Label htmlFor="amount" className="sm:text-right">Monto ($)</Label>
                        <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.valueAsNumber || '')} className="sm:col-span-3"/>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                        <Label htmlFor="reason" className="sm:text-right">Razón</Label>
                        <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} className="sm:col-span-3" placeholder="Describe el motivo del ajuste..."/>
                    </div>
                </div>
                <DialogFooter><Button onClick={handleSubmit}>Guardar Ajuste</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// --- Sub-component for Guard Payroll Details Dialog ---
function GuardDetailsDialog({ details, period, onClose }: { details: PayrollData, period: DateRange, onClose: () => void }) {
    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Detalle de Nómina: {details.name}</DialogTitle>
                    <DialogDescription>
                        Periodo: {period.from && format(period.from, "PPP", { locale: es })} - {period.to && format(period.to, "PPP", { locale: es })}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                    <p><strong>Salario Diario:</strong> ${(details.dailySalary || 0).toFixed(2)}</p>
                    <p><strong>Días Trabajados:</strong> {details.daysWorked}</p>
                    <p><strong>Subtotal:</strong> ${(details.subtotal || 0).toFixed(2)}</p>
                    <p><strong>Deducción Préstamo:</strong> <span className="text-red-600">-${(details.loanDeduction || 0).toFixed(2)}</span></p>
                    <p><strong>Total a Pagar:</strong> <span className="font-bold text-lg">${(details.total || 0).toFixed(2)}</span></p>
                </div>
                <div className="space-y-4 mt-4 max-h-64 overflow-y-auto">
                    <div>
                        <h4 className="font-semibold mb-2">Turnos Registrados ({details.shiftsInPeriod.length})</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {details.shiftsInPeriod.map(shift => (
                                <li key={shift.id}>{format(new Date(shift.startTime), "PPP", { locale: es })} ({shift.turno})</li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Bonos (${(details.totalBonuses || 0).toFixed(2)})</h4>
                        {details.bonuses.length > 0 ? (
                             <Table><TableHeader><TableRow><TableHead>Razón</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader><TableBody>
                                {details.bonuses.map(b => <TableRow key={b.id}><TableCell>{b.reason}</TableCell><TableCell className="text-right text-green-600">${(b.amount || 0).toFixed(2)}</TableCell></TableRow>)}
                             </TableBody></Table>
                        ) : <p className="text-sm text-muted-foreground">No hay bonos.</p>}
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Penalizaciones (${(details.totalPenalties || 0).toFixed(2)})</h4>
                        {details.penalties.length > 0 ? (
                              <Table><TableHeader><TableRow><TableHead>Razón</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader><TableBody>
                                {details.penalties.map(p => <TableRow key={p.id}><TableCell>{p.reason}</TableCell><TableCell className="text-right text-red-600">-${(p.amount || 0).toFixed(2)}</TableCell></TableRow>)}
                              </TableBody></Table>
                        ) : <p className="text-sm text-muted-foreground">No hay penalizaciones.</p>}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function NominaPage() {
    const { toast } = useToast();
    const [guards, setGuards] = useState<User[]>([]);
    const [shifts, setShifts] = useState<ShiftRecord[]>([]);
    const [payrollDetails, setPayrollDetails] = useState<PayrollDetails>({});
    const [date, setDate] = useState<DateRange | undefined>({ from: addDays(new Date(), -15), to: new Date() });
    
    // States for payroll features
    const [viewingGuardDetails, setViewingGuardDetails] = useState<PayrollData | null>(null);
    const [analysisResult, setAnalysisResult] = useState<any | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [viewingReceipt, setViewingReceipt] = useState<PayrollData | null>(null);

    // States for dialogs
    const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
    const [adjustmentType, setAdjustmentType] = useState<'bonus' | 'penalty'>('bonus');
    const [selectedGuard, setSelectedGuard] = useState<User | null>(null);

    const [loans, setLoans] = useState<Loan[]>([]);

    const refreshData = async () => {
        const [guardData, shiftData, loanData] = await Promise.all([
            getUsers(),
            getShiftRecords(),
            getLoans()
        ]);
        setGuards(guardData.filter(u => u.role === 'Guardia'));
        setShifts(shiftData);
        setLoans(loanData);
    }

    useEffect(() => {
        refreshData();
    }, []);

    const { payrollData, totals } = useMemo(() => {
        if (!date?.from || !date?.to) return { payrollData: [], totals: { subtotal: 0, bonuses: 0, penalties: 0, loanDeductions: 0, total: 0 }};

        const normalizedEndDate = new Date(date.to);
        normalizedEndDate.setHours(23, 59, 59, 999);

        const calculatedData: PayrollData[] = guards.map(guard => {
            const shiftsInPeriod = shifts.filter(shift => 
                shift.guardId === guard.id && 
                isWithinInterval(new Date(shift.startTime), { start: date.from!, end: normalizedEndDate })
            );
            const daysWorked = shiftsInPeriod.length;
            const subtotal = daysWorked * (guard.dailySalary || 0);
            
            const guardAdjustments = payrollDetails[guard.id] || { bonuses: [], penalties: [] };
            const totalBonuses = guardAdjustments.bonuses.reduce((acc, b) => acc + b.amount, 0);
            const totalPenalties = guardAdjustments.penalties.reduce((acc, p) => acc + p.amount, 0);
            
            const activeLoan = loans.find(l => l.guardId === guard.id && l.status === 'Aprobado');
            const grossPay = subtotal + totalBonuses - totalPenalties;
            const loanDeduction = activeLoan ? Math.min(activeLoan.balance, grossPay * 0.25) : 0;
            
            const total = grossPay - loanDeduction;

            return {
                guardId: guard.id, name: guard.name, dailySalary: guard.dailySalary || 0,
                shiftsInPeriod, daysWorked, subtotal,
                bonuses: guardAdjustments.bonuses, penalties: guardAdjustments.penalties,
                totalBonuses, totalPenalties, loanDeduction, total,
            };
        });

        const calculatedTotals = calculatedData.reduce((acc, item) => {
            acc.subtotal += item.subtotal || 0;
            acc.bonuses += item.totalBonuses || 0;
            acc.penalties += item.totalPenalties || 0;
            acc.loanDeductions += item.loanDeduction || 0;
            acc.total += item.total || 0;
            return acc;
        }, { subtotal: 0, bonuses: 0, penalties: 0, loanDeductions: 0, total: 0 });

        return { payrollData: calculatedData, totals: calculatedTotals };
    }, [guards, shifts, date, payrollDetails, loans]);

     const handleOpenAdjustmentDialog = (guardId: string, type: 'bonus' | 'penalty') => {
        const guard = guards.find(g => g.id === guardId);
        if (guard) {
            setSelectedGuard(guard);
            setAdjustmentType(type);
            setIsAdjustmentDialogOpen(true);
        }
    };

    const handleSaveAdjustment = (amount: number, reason: string) => {
        if (!selectedGuard) return;
        const newAdjustment: PayrollAdjustment = { id: `${adjustmentType}-${Date.now()}`, amount, reason };
        setPayrollDetails(prev => {
            const guardDetails = prev[selectedGuard.id] || { bonuses: [], penalties: [] };
            const updatedDetails = { ...guardDetails };
            if (adjustmentType === 'bonus') updatedDetails.bonuses.push(newAdjustment);
            else updatedDetails.penalties.push(newAdjustment);
            return { ...prev, [selectedGuard.id]: updatedDetails };
        });
        toast({ title: `${adjustmentType === 'bonus' ? 'Bono' : 'Penalización'} añadido`, description: `Se añadió un ajuste de $${amount.toFixed(2)} a ${selectedGuard.name}.`});
        setIsAdjustmentDialogOpen(false);
        setSelectedGuard(null);
    };

    const handleArchivePayroll = async () => {
        if (!date?.from || !date?.to || payrollData.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'No hay datos de nómina para archivar.' });
            return;
        }
        const newArchive: Omit<ArchivedPayroll, 'id' | 'archivedAt'> = {
            period: { from: date.from.toISOString(), to: date.to.toISOString() },
            payrollData, totals,
        };
        const archived = await archivePayroll(newArchive);
        if (!archived) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo archivar la nómina.' });
            return;
        }
        
        const deductionsToApply = payrollData
            .filter(p => p.loanDeduction > 0)
            .map(p => ({ guardId: p.guardId, amount: p.loanDeduction }));
        
        if (deductionsToApply.length > 0) {
            await applyPayrollDeductions(archived.id, deductionsToApply);
        }
        await refreshData();
        toast({ title: 'Nómina Archivada', description: 'La nómina del periodo actual ha sido guardada y los préstamos actualizados.' });
    };

    const handleExport = () => {
        toast({ variant: "warning", title: "Función en desarrollo", description: "La exportación a CSV/PDF estará disponible próximamente." });
    };

    const handleAnalyzePayroll = async () => {
        if (!date?.from || !date?.to || payrollData.length === 0) {
          toast({ variant: 'destructive', title: 'Error', description: 'No hay datos de nómina para analizar.' });
          return;
        }
        setIsAnalyzing(true);
        setAnalysisResult(null);
    
        const analysisInput = {
          payrollPeriod: `${format(date.from, "d MMM yyyy")} - ${format(date.to, "d MMM yyyy")}`,
          guardsData: payrollData.map(p => ({
            guardName: p.name,
            daysWorked: p.daysWorked,
            subtotal: p.subtotal,
            totalBonuses: p.totalBonuses,
            totalPenalties: p.totalPenalties,
            totalToPay: p.total,
          })),
        };
    
        try {
          const result = await analyzePayroll(analysisInput);
          setAnalysisResult(result);
          if (result.overallStatus === 'Aprobado') {
            toast({ title: "Análisis Completo", description: "No se encontraron anomalías en la nómina." });
          } else {
             toast({ title: "Análisis Completo", description: "Se encontraron posibles anomalías. Por favor revise los resultados.", variant: "warning" });
          }
        } catch (error) {
          console.error("Error analyzing payroll:", error);
          toast({ variant: 'destructive', title: 'Error de Análisis', description: 'No se pudo completar el análisis de la nómina.' });
        } finally {
          setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                 <Link href="/admin/finanzas" passHref>
                    <Button variant="outline" size="icon" aria-label="Volver a Finanzas">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h2 className="text-xl font-bold">Nómina y Cálculo</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Subtotal (Salarios)</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">${(totals.subtotal || 0).toFixed(2)}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Bonos Totales</CardTitle><TrendingUp className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">+${(totals.bonuses || 0).toFixed(2)}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Penalizaciones</CardTitle><TrendingDown className="h-4 w-4 text-red-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">-${(totals.penalties || 0).toFixed(2)}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Deducción Préstamos</CardTitle><TrendingDown className="h-4 w-4 text-red-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">-${(totals.loanDeductions || 0).toFixed(2)}</div></CardContent></Card>
                <Card className="bg-primary text-primary-foreground"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">TOTAL A PAGAR</CardTitle><DollarSign className="h-4 w-4 text-primary-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">${(totals.total || 0).toFixed(2)}</div></CardContent></Card>
            </div>
             <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Cálculo de Nómina</CardTitle>
                            <CardDescription>Calcula la nómina de los guardias en un periodo seleccionado.</CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button id="date" variant={"outline"} className={cn("w-full sm:w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date?.from ? (date.to ? (<>{format(date.from, "LLL dd, y", { locale: es })} - {format(date.to, "LLL dd, y", { locale: es })}</>) : (format(date.from, "LLL dd, y", { locale: es }))) : (<span>Selecciona un periodo</span>)}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} locale={es}/></PopoverContent>
                            </Popover>
                            <div className="flex gap-2">
                                <Button onClick={handleAnalyzePayroll} disabled={isAnalyzing} variant="outline" className="flex-1">
                                    {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
                                    Analizar
                                </Button>
                                <Button onClick={handleArchivePayroll} variant="outline" className="flex-1"><Archive className="mr-2 h-4 w-4" />Archivar</Button>
                                <Button onClick={handleExport} variant="secondary" className="flex-1"><FileDown className="mr-2 h-4 w-4"/>Exportar</Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {analysisResult && (
                        <Alert variant={analysisResult.overallStatus === 'Aprobado' ? 'default' : 'warning'} className="mb-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Resultado del Análisis de IA: {analysisResult.overallStatus}</AlertTitle>
                            <AlertDescription>
                                {analysisResult.anomalies.length > 0 ? (
                                    <ul className="list-disc pl-5 mt-2 space-y-1">
                                        {analysisResult.anomalies.map((anomaly: any, index: number) => (
                                            <li key={index}>
                                                <strong>{anomaly.guardName}:</strong> {anomaly.anomalyDescription} ({anomaly.severity})
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>La IA no ha detectado problemas o anomalías significativas en este cálculo de nómina.</p>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}
                    <div className="border rounded-md overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Guardia</TableHead><TableHead>Días Trab.</TableHead><TableHead>Subtotal</TableHead><TableHead>Bonos</TableHead><TableHead>Penaliz.</TableHead><TableHead>Deduc. Préstamo</TableHead><TableHead>Total a Pagar</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader><TableBody>
                    {payrollData.map(item => (<TableRow key={item.guardId}><TableCell className="font-medium">{item.name}</TableCell><TableCell>{item.daysWorked}</TableCell><TableCell>${(item.subtotal || 0).toFixed(2)}</TableCell><TableCell className="text-green-600">${(item.totalBonuses || 0).toFixed(2)}</TableCell><TableCell className="text-red-600">-${(item.totalPenalties || 0).toFixed(2)}</TableCell><TableCell className="text-red-600">-${(item.loanDeduction || 0).toFixed(2)}</TableCell><TableCell className="font-bold">${(item.total || 0).toFixed(2)}</TableCell><TableCell className="text-right"><div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewingReceipt(item)}><Receipt className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewingGuardDetails(item)}><Eye className="h-4 w-4" /></Button>
                        <Button size="icon" variant="outline" className="h-8 w-8 text-green-600" onClick={() => handleOpenAdjustmentDialog(item.guardId, 'bonus')}><PlusCircle className="h-4 w-4"/></Button>
                        <Button size="icon" variant="outline" className="h-8 w-8 text-red-600" onClick={() => handleOpenAdjustmentDialog(item.guardId, 'penalty')}><MinusCircle className="h-4 w-4"/></Button>
                    </div></TableCell></TableRow>))}
                </TableBody></Table></div></CardContent>
            </Card>
            {selectedGuard && (<AdjustmentDialog open={isAdjustmentDialogOpen} onOpenChange={setIsAdjustmentDialogOpen} type={adjustmentType} guardName={selectedGuard.name} onSave={handleSaveAdjustment}/>)}
            {viewingGuardDetails && date && (<GuardDetailsDialog details={viewingGuardDetails} period={date} onClose={() => setViewingGuardDetails(null)}/>)}
            <Dialog open={!!viewingReceipt} onOpenChange={(open) => !open && setViewingReceipt(null)}>
                <DialogContent className="max-w-3xl p-0">
                    {viewingReceipt && date && (<PayrollReceipt details={viewingReceipt} period={date} />)}
                </DialogContent>
            </Dialog>
        </div>
    );
}
