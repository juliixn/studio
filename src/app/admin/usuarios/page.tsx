
"use client";

import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, Edit, Trash2, Download, Upload, Eye, Loader2 } from "lucide-react";
import type { User, Condominio, Address } from "@/lib/definitions";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { UsuarioForm } from "@/components/admin/usuario-form";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { UserImportDialog } from "@/components/admin/user-import-dialog";
import { getUsers, addUser, updateUser, deleteUser } from "@/lib/userService";
import { getCondominios } from "@/lib/condominioService";
import { getDomicilios } from "@/lib/domicilioService";


export default function UsuariosPage() {
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [condominios, setCondominios] = useState<Condominio[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Dialog states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    
    // Edit/Delete states
    const [userToEdit, setUserToEdit] = useState<User | undefined>(undefined);
    const [userToDelete, setUserToDelete] = useState<User | undefined>(undefined);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    const refreshData = async () => {
        setIsLoading(true);
        const [allUsers, allCondos, allAddresses] = await Promise.all([
            getUsers(),
            getCondominios(),
            getDomicilios()
        ]);
        
        setAddresses(allAddresses);

        if (currentUser?.role === 'Adm. Condo') {
            const selectedCondoId = sessionStorage.getItem('selectedCondoId') || currentUser.condominioIds?.[0];
            if (selectedCondoId) {
                const condoUsers = allUsers.filter(u => 
                     u.role !== 'Administrador' && // Adm. Condo can't see main admins
                     (u.condominioId === selectedCondoId || (u.condominioIds && u.condominioIds.includes(selectedCondoId)))
                );
                setUsers(condoUsers);
                setCondominios(allCondos.filter(c => c.id === selectedCondoId));
            } else {
                setUsers([]); // No condo selected, show no users.
            }
        } else {
            setUsers(allUsers);
            setCondominios(allCondos);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (currentUser) {
            refreshData();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]);

    const getCondoName = (condoId?: string) => {
        if (!condoId) return 'N/A';
        return condominios.find(c => c.id === condoId)?.name || 'N/A';
    }

    const handleOpenForm = (user?: User) => {
        setUserToEdit(user);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setUserToEdit(undefined);
    };

    const handleSubmit = async (values: any) => {
        if (userToEdit) {
            await updateUser(userToEdit.id, values);
            toast({ title: "Usuario actualizado", description: `El usuario "${values.name}" ha sido actualizado.` });
        } else {
            await addUser(values);
            toast({ title: "Usuario creado", description: `El usuario "${values.name}" ha sido creado.` });
        }
        await refreshData();
        handleCloseForm();
    };

    const handleDelete = async () => {
        if (!userToDelete) return;
        await deleteUser(userToDelete.id);
        toast({ title: "Usuario eliminado", description: `El usuario "${userToDelete.name}" ha sido eliminado.`, variant: 'destructive' });
        setUserToDelete(undefined);
        await refreshData();
    };

    const handleExport = () => {
        const headers = ["id", "username", "name", "email", "role", "condominioId", "addressId", "dailySalary"];
        const csvContent = [
            headers.join(','),
            ...users.map(user => headers.map(header => user[header as keyof User] ?? "").join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.href) {
            URL.revokeObjectURL(link.href);
        }
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', 'usuarios.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Exportación Exitosa", description: "Se ha descargado el archivo de usuarios." });
    };

    const handleImport = async (newUsers: Omit<User, 'id'>[]) => {
        for (const user of newUsers) {
            await addUser(user);
        }
        await refreshData();
        setIsImportOpen(false);
    };
    
    const condosForForm = currentUser?.role === 'Adm. Condo'
        ? condominios
        : condominios;

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Usuarios</CardTitle>
                            <CardDescription>Gestiona los usuarios del sistema y sus roles.</CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                             <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                                <Upload className="mr-2 h-4 w-4" />
                                Importar
                            </Button>
                            <Button variant="outline" onClick={handleExport}>
                                <Download className="mr-2 h-4 w-4" />
                                Exportar
                            </Button>
                            <Button onClick={() => handleOpenForm()}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Crear Usuario
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead>Condominio(s)</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                        </TableCell>
                                    </TableRow>
                                ) : users.map((user, index) => (
                                    <TableRow key={user.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 hidden sm:flex">
                                                    <AvatarImage src={user.photoUrl} alt={user.name} data-ai-hint="profile picture" />
                                                    <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                                </Avatar>
                                                <span>{user.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{user.username}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{user.role}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {user.condominioIds && user.condominioIds.length > 0
                                                ? user.condominioIds.map(id => (
                                                    <Badge key={id} variant="secondary">{getCondoName(id)}</Badge>
                                                ))
                                                : user.condominioId ? <Badge variant="secondary">{getCondoName(user.condominioId)}</Badge> : 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/admin/usuarios/${user.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" /> Ver Perfil
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleOpenForm(user)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setUserToDelete(user)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={(open) => !open && handleCloseForm()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{userToEdit ? "Editar Usuario" : "Crear Nuevo Usuario"}</DialogTitle>
                        <DialogDescription>
                            {userToEdit ? "Modifica los detalles del usuario." : "Completa el formulario para agregar un nuevo usuario."}
                        </DialogDescription>
                    </DialogHeader>
                    <UsuarioForm
                        usuario={userToEdit}
                        condominios={condosForForm}
                        addresses={addresses}
                        onSubmit={handleSubmit}
                        onCancel={handleCloseForm}
                        currentUser={currentUser}
                    />
                </DialogContent>
            </Dialog>
            
            <UserImportDialog 
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onImport={handleImport}
            />

             <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(undefined)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario
                             "{userToDelete?.name}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setUserToDelete(undefined)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
