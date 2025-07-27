
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, Power, PowerOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Survey, Condominio } from "@/lib/definitions";
import { getSurveys, addSurvey, updateSurvey, deleteSurvey, voteOnSurvey } from "@/lib/surveyService";
import { getCondominios } from "@/lib/condominioService";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SurveyForm } from "@/components/admin/survey-form";
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import { ChartTooltipContent, ChartContainer } from "@/components/ui/chart";

export default function EncuestasPage() {
    const { toast } = useToast();
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [condominios, setCondominios] = useState<Condominio[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [surveyToEdit, setSurveyToEdit] = useState<Survey | undefined>(undefined);
    const [surveyToDelete, setSurveyToDelete] = useState<Survey | undefined>(undefined);
    const [surveyToToggle, setSurveyToToggle] = useState<Survey | undefined>(undefined);

    useEffect(() => {
        refreshData();
        setCondominios(getCondominios());
    }, []);

    const refreshData = () => setSurveys(getSurveys());

    const handleOpenForm = (survey?: Survey) => {
        setSurveyToEdit(survey);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSurveyToEdit(undefined);
        setIsFormOpen(false);
    };

    const handleSubmit = (values: any) => {
        if (surveyToEdit) {
            updateSurvey(surveyToEdit.id, values);
            toast({ title: "Encuesta actualizada" });
        } else {
            addSurvey(values);
            toast({ title: "Encuesta creada" });
        }
        refreshData();
        handleCloseForm();
    };

    const handleDelete = () => {
        if (!surveyToDelete) return;
        deleteSurvey(surveyToDelete.id);
        toast({ title: "Encuesta eliminada", variant: 'destructive' });
        refreshData();
        setSurveyToDelete(undefined);
    };

    const handleToggleStatus = () => {
        if (!surveyToToggle) return;
        const newStatus = surveyToToggle.status === 'Abierta' ? 'Cerrada' : 'Abierta';
        updateSurvey(surveyToToggle.id, { status: newStatus });
        toast({ title: "Estado actualizado", description: `La encuesta ahora está ${newStatus.toLowerCase()}.` });
        refreshData();
        setSurveyToToggle(undefined);
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Encuestas y Votaciones</h2>
                        <p className="text-muted-foreground">Crea y gestiona encuestas para tomar decisiones en la comunidad.</p>
                    </div>
                    <Button onClick={() => handleOpenForm()}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Crear Encuesta
                    </Button>
                </div>
                
                 <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                    {surveys.map((survey) => (
                        <Card key={survey.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start gap-2">
                                    <CardTitle className="flex-grow">{survey.title}</CardTitle>
                                    <Badge variant={survey.status === 'Abierta' ? 'default' : 'secondary'}>{survey.status}</Badge>
                                </div>
                                <CardDescription>{survey.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <ChartContainer config={{}} className="h-40 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={survey.options} layout="vertical" margin={{ left: 10, right: 10 }}>
                                            <CartesianGrid horizontal={false} />
                                            <XAxis type="number" hide />
                                            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                                            <Bar dataKey="votes" name="Votos" layout="vertical" fill="hsl(var(--primary))" radius={4}>
                                                {survey.options.map((option, index) => (
                                                    <text key={index} x={5} y={index * (35) + 20} fill="hsl(var(--primary-foreground))" textAnchor="start" dominantBaseline="middle" className="text-xs font-medium">
                                                        {option.text}
                                                    </text>
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </CardContent>
                             <CardFooter className="flex justify-between items-center text-xs text-muted-foreground">
                                <span>Cierra: {format(new Date(survey.closesAt), "PPP", { locale: es })}</span>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => setSurveyToToggle(survey)}>
                                        {survey.status === 'Abierta' ? <PowerOff className="h-4 w-4 text-amber-600" /> : <Power className="h-4 w-4 text-green-600" />}
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenForm(survey)}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setSurveyToDelete(survey)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                    {surveys.length === 0 && <p className="col-span-full text-center text-muted-foreground py-10">No hay encuestas creadas.</p>}
                 </div>
            </div>

            <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{surveyToEdit ? "Editar Encuesta" : "Crear Nueva Encuesta"}</DialogTitle>
                    </DialogHeader>
                    <SurveyForm
                        survey={surveyToEdit}
                        condominios={condominios}
                        onSubmit={handleSubmit}
                        onCancel={handleCloseForm}
                    />
                </DialogContent>
            </Dialog>
            
            <AlertDialog open={!!surveyToDelete} onOpenChange={(open) => !open && setSurveyToDelete(undefined)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>Se eliminará la encuesta "{surveyToDelete?.title}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Sí, eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={!!surveyToToggle} onOpenChange={(open) => !open && setSurveyToToggle(undefined)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Cambiar estado?</AlertDialogTitle>
                        <AlertDialogDescription>Se {surveyToToggle?.status === 'Abierta' ? 'cerrará' : 'abrirá'} la encuesta "{surveyToToggle?.title}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleToggleStatus}>Sí, confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
