"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Address } from "@/lib/definitions";
import Papa from "papaparse";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ScrollArea } from "../ui/scroll-area";

interface DomicilioImportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (newDomicilios: Omit<Address, "id">[]) => void;
}

const requiredHeaders = ["fullAddress", "condominioId"];

export function DomicilioImportDialog({ isOpen, onClose, onImport }: DomicilioImportDialogProps) {
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [parsedDomicilios, setParsedDomicilios] = useState<Omit<Address, "id">[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile) return;

        if (selectedFile.type !== "text/csv") {
            setError("Por favor, seleccione un archivo CSV.");
            setFile(null);
            setParsedDomicilios([]);
            return;
        }

        setFile(selectedFile);
        setError(null);

        Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const headers = results.meta.fields;
                if (!headers || !requiredHeaders.every(h => headers.includes(h))) {
                    setError(`El archivo CSV debe contener las siguientes columnas: ${requiredHeaders.join(", ")}.`);
                    setParsedDomicilios([]);
                    return;
                }

                const newDomicilios = results.data.map((row: any) => ({
                    fullAddress: row.fullAddress || "",
                    condominioId: row.condominioId || "",
                }));
                
                setParsedDomicilios(newDomicilios);
            },
            error: (err) => {
                setError(`Error al procesar el archivo: ${err.message}`);
                setParsedDomicilios([]);
            }
        });
    };

    const handleConfirmImport = () => {
        if (parsedDomicilios.length === 0) {
            toast({ title: "Nada que importar", description: "El archivo no contiene domicilios válidos.", variant: "destructive" });
            return;
        }
        onImport(parsedDomicilios);
        toast({ title: "Importación Exitosa", description: `${parsedDomicilios.length} domicilios han sido añadidos.` });
        resetState();
    };

    const resetState = () => {
        setFile(null);
        setParsedDomicilios([]);
        setError(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && resetState()}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Importar Domicilios desde CSV</DialogTitle>
                    <DialogDescription>
                        Seleccione un archivo CSV para añadir domicilios masivamente. El archivo debe incluir las columnas: {requiredHeaders.join(", ")}.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="csv-file">Archivo CSV</Label>
                        <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}

                    {parsedDomicilios.length > 0 && (
                        <div>
                            <h3 className="font-medium mb-2">Vista Previa de Importación ({parsedDomicilios.length} domicilios)</h3>
                            <ScrollArea className="h-64 w-full rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Dirección Completa</TableHead>
                                            <TableHead>ID de Condominio</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedDomicilios.map((dom, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{dom.fullAddress}</TableCell>
                                                <TableCell>{dom.condominioId}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={resetState}>Cancelar</Button>
                    <Button onClick={handleConfirmImport} disabled={parsedDomicilios.length === 0 || !!error}>
                        Confirmar Importación
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
