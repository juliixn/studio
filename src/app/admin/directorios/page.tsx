
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { User, Condominio, Address, UserRole } from "@/lib/definitions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home, User as UserIcon, Briefcase, Shield, UserCog, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUsers } from "@/lib/userService";
import { getCondominios } from "@/lib/condominioService";
import { getDomicilios } from "@/lib/domicilioService";

const roleConfig: { [key in UserRole]: { label: string; icon: React.ReactNode } } = {
    Propietario: { label: 'Propietarios', icon: <Home className="h-6 w-6" /> },
    Renta: { label: 'Inquilinos', icon: <UserIcon className="h-6 w-6" /> },
    Guardia: { label: 'Guardias', icon: <Shield className="h-6 w-6" /> },
    Administrador: { label: 'Admins', icon: <UserCog className="h-6 w-6" /> },
    'Adm. Condo': { label: 'Admins Condo', icon: <UserCog className="h-6 w-6" /> },
};

function DirectoryTable({ users, getCondoName, getAddressName }: { users: User[], getCondoName: (id?: string) => string, getAddressName: (id?: string) => string | string[] }) {
    const router = useRouter();

    if (users.length === 0) {
        return <p className="text-muted-foreground text-sm text-center py-8">No hay usuarios para mostrar con los filtros seleccionados.</p>;
    }

    return (
        <div className="border rounded-md overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Condominio(s)</TableHead>
                        <TableHead>Domicilio(s)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => {
                        const condoNames = user.condominioIds ? user.condominioIds.map(id => getCondoName(id)) : [getCondoName(user.condominioId)];
                        const addressNames = getAddressName(user.id);

                        return (
                            <TableRow 
                                key={user.id} 
                                className="cursor-pointer"
                                onClick={() => router.push(`/admin/usuarios/${user.id}`)}
                            >
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 hidden sm:flex">
                                            <AvatarImage src={user.photoUrl} alt={user.name} data-ai-hint="profile picture" />
                                            <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                        </Avatar>
                                        <span>{user.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                       {condoNames.map(name => name !== 'N/A' && <Badge key={name} variant="secondary">{name}</Badge>)}
                                       {condoNames.every(name => name === 'N/A') && 'N/A'}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {Array.isArray(addressNames) ? (
                                        <div className="flex flex-col gap-1">
                                            {addressNames.map(name => <span key={name} className="text-xs">{name}</span>)}
                                        </div>
                                    ) : (
                                        addressNames
                                    )}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    );
}


export default function DirectoriosPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [allCondominios, setAllCondominios] = useState<Condominio[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState<UserRole>('Propietario');
    const [selectedCondo, setSelectedCondo] = useState<string>("all");
    const rolesToShow: UserRole[] = ['Propietario', 'Renta', 'Guardia', 'Administrador', 'Adm. Condo'];
    
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [usersData, condosData, addressesData] = await Promise.all([
                getUsers(),
                getCondominios(),
                getDomicilios()
            ]);
            setUsers(usersData);
            setAllCondominios(condosData);
            setAddresses(addressesData);
            setIsLoading(false);
        };
        fetchData();
    }, []);

    const getCondoName = (condoId?: string) => {
        if (!condoId) return 'N/A';
        return allCondominios.find(c => c.id === condoId)?.name || 'N/A';
    }

    const getAddressName = (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (!user) return 'N/A';
        
        if (user.addressIds && user.addressIds.length > 0) {
            return user.addressIds.map(id => addresses.find(a => a.id === id)?.fullAddress || 'N/A');
        }
        if (user.addressId) {
            return addresses.find(a => a.id === user.addressId)?.fullAddress || 'N/A';
        }
        return 'N/A';
    }

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const roleMatch = user.role === selectedRole;
            const condoMatch = selectedCondo === "all" || user.condominioId === selectedCondo || (user.condominioIds && user.condominioIds.includes(selectedCondo));
            return roleMatch && condoMatch;
        });
    }, [users, selectedRole, selectedCondo]);

    const showCondoFilter = selectedRole !== 'Administrador';
    
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Directorio Unificado</h2>
                <p className="text-muted-foreground">Consulta y gestiona todos los usuarios del sistema por rol y condominio.</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {rolesToShow.map(role => {
                    const config = roleConfig[role];
                    return (
                        <Card 
                            key={role} 
                            onClick={() => setSelectedRole(role)}
                            className={cn(
                                "cursor-pointer hover:border-primary transition-colors",
                                selectedRole === role && "border-primary ring-2 ring-primary"
                            )}
                        >
                            <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center">
                                {config.icon}
                                <span className="font-medium text-sm">{config.label}</span>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
            
             <Card className="mt-4">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle>Directorio de {roleConfig[selectedRole].label}</CardTitle>
                        {showCondoFilter && (
                            <div className="w-full sm:w-auto sm:min-w-[250px]">
                                <Select value={selectedCondo} onValueChange={setSelectedCondo}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filtrar por condominio" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los Condominios</SelectItem>
                                        {allCondominios.map(condo => (
                                            <SelectItem key={condo.id} value={condo.id}>{condo.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <DirectoryTable users={filteredUsers} getCondoName={getCondoName} getAddressName={(id) => getAddressName(id!)}/>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
