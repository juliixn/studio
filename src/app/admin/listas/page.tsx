
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListChecks, ArrowRight, QrCode, Shield } from "lucide-react";
import Link from "next/link";

export default function ListasPage() {
    const formGroups = [
        {
            title: "Formularios de Registro de Acceso",
            description: "Gestiona las listas de opciones para los registros vehiculares y peatonales que se realizan en la caseta de vigilancia.",
            icon: <ListChecks className="w-8 h-8 text-primary"/>,
            link: "/admin/listas/gestionar?form=registro"
        },
        {
            title: "Formularios de Pases de Invitado",
            description: "Edita las listas de opciones utilizadas por los residentes y administradores al generar pases de invitado con código QR.",
            icon: <QrCode className="w-8 h-8 text-primary"/>,
            link: "/admin/listas/gestionar?form=pases"
        },
        {
            title: "Formularios de Guardia",
            description: "Edita listas relacionadas con los guardias, como equipo y categorías de incidentes.",
            icon: <Shield className="w-8 h-8 text-primary" />,
            link: "/admin/listas/gestionar?form=guardia"
        }
    ]

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Gestión de Listas</h2>
                <p className="text-muted-foreground">
                    Seleccione un grupo de formularios para editar las listas de opciones que utilizan.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {formGroups.map(group => (
                     <Card key={group.title} className="flex flex-col transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
                        <CardHeader className="flex-row items-start gap-4 space-y-0">
                            <div className="flex-shrink-0">{group.icon}</div>
                            <div className="flex-grow">
                                <CardTitle>{group.title}</CardTitle>
                                <CardDescription className="mt-2">
                                    {group.description}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="mt-auto flex justify-end">
                            <Link href={group.link} passHref>
                                <Button>
                                    Gestionar Listas <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
