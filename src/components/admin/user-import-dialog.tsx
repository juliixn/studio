
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { User, UserRole } from "@/lib/definitions";
import Papa from "papaparse";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ScrollArea } from "../ui/scroll-area";

interface UserImportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (newUsers: User[]) => void;
}

const requiredHeaders = ["name", "email", "password", "role"];

export function UserImportDialog({ isOpen, onClose, onImport }: UserImportDialogProps) {
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [parsedUsers, setParsedUsers] = useState<User[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile) return;

        if (selectedFile.type !== "text/csv") {
            setError("Por favor, seleccione un archivo CSV.");
            setFile(null);
            setParsedUsers([]);
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
                    setParsedUsers([]);
                    return;
                }

                const newUsers = results.data.map((row: any, index: number) => ({
                    id: `import-${Date.now()}-${index}`,
                    name: row.name || "",
                    email: row.email || "",
                    password: row.password || "",
                    role: (row.role as UserRole) || "Propietario",
                    photoUrl: row.photoUrl || "",
                    condominioId: row.condominioId || "",
                    addressId: row.addressId || "",
                    dailySalary: row.dailySalary ? Number(row.dailySalary) : undefined,
                }));
                
                setParsedUsers(newUsers);
            },
            error: (err) => {
                setError(`Error al procesar el archivo: ${err.message}`);
                setParsedUsers([]);
            }
        });
    };

    const handleConfirmImport = () => {
        if (parsedUsers.length === 0) {
            toast({ title: "Nada que importar", description: "El archivo no contiene usuarios válidos.", variant: "destructive" });
            return;
        }
        onImport(parsedUsers);
        toast({ title: "Importación Exitosa", description: `${parsedUsers.length} usuarios han sido añadidos.` });
        resetState();
    };

    const resetState = () => {
        setFile(null);
        setParsedUsers([]);
        setError(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && resetState()}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Importar Usuarios desde CSV</DialogTitle>
                    <DialogDescription>
                        Seleccione un archivo CSV para añadir usuarios masivamente. El archivo debe incluir las columnas: {requiredHeaders.join(", ")}.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="csv-file">Archivo CSV</Label>
                        <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}

                    {parsedUsers.length > 0 && (
                        <div>
                            <h3 className="font-medium mb-2">Vista Previa de Importación ({parsedUsers.length} usuarios)</h3>
                            <ScrollArea className="h-64 w-full rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nombre</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Rol</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedUsers.map(user => (
                                            <TableRow key={user.id}>
                                                <TableCell>{user.name}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>{user.role}</TableCell>
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
                    <Button onClick={handleConfirmImport} disabled={parsedUsers.length === 0 || !!error}>
                        Confirmar Importación
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
