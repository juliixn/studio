
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { Condominio, Comunicado } from "@/lib/definitions";
import { mockCondominios } from "@/lib/data";
import { Send, Mail, Loader2, History, Sparkles } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { addComunicado, getComunicados } from "@/lib/comunicadoService";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { generateComunicadoDraft } from "@/ai/flows/generate-comunicado-draft-flow";

const formSchema = z.object({
  target: z.string().min(1, "Debe seleccionar un destinatario."),
  subject: z.string().min(5, "El asunto debe tener al menos 5 caracteres."),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres."),
  channels: z.object({
    push: z.boolean().default(false),
    email: z.boolean().default(false),
  }).refine(data => data.push || data.email, {
    message: "Debe seleccionar al menos un canal de comunicación.",
    path: ["push"],
  })
});

export default function ComunicadosPage() {
    const { toast } = useToast();
    const [condominios] = useState<Condominio[]>(mockCondominios);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [history, setHistory] = useState<Comunicado[]>([]);
    const [activeView, setActiveView] = useState('enviar');

    useEffect(() => {
        refreshHistory();
    }, []);

    const refreshHistory = () => {
        setHistory(getComunicados());
    };
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            target: "all",
            subject: "",
            message: "",
            channels: {
                push: true,
                email: false,
            }
        },
    });

    const handleGenerateDraft = async () => {
        const subject = form.getValues("subject");
        if (subject.trim().length < 5) {
            toast({ variant: "destructive", title: "Asunto muy corto", description: "Por favor, escribe un asunto más descriptivo para generar el borrador." });
            return;
        }
        setIsGenerating(true);
        try {
            const result = await generateComunicadoDraft({ subject });
            if (result.draft) {
                form.setValue("message", result.draft, { shouldValidate: true });
                toast({ title: "Borrador generado", description: "La IA ha creado un borrador para tu mensaje." });
            }
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error de IA", description: "No se pudo generar el borrador." });
        } finally {
            setIsGenerating(false);
        }
    };

    function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        // Simulate network delay
        setTimeout(() => {
            const channels: ('Push' | 'Email')[] = [];
            if (values.channels.push) channels.push('Push');
            if (values.channels.email) channels.push('Email');
            
            const targetCondo = condominios.find(c => c.id === values.target);
            const targetName = values.target === 'all' ? 'Todos los Residentes' : `Residentes de ${targetCondo?.name || 'N/A'}`;

            addComunicado({
                subject: values.subject,
                message: values.message,
                target: values.target,
                targetName: targetName,
                channels: channels,
            });

            toast({
                title: "Comunicado Enviado",
                description: "El mensaje ha sido puesto en cola para su envío.",
            });
            form.reset();
            form.setValue("channels", { push: true, email: false });
            form.setValue("target", "all");
            setIsSubmitting(false);
            refreshHistory();
        }, 1000);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
                <Button variant={activeView === 'enviar' ? 'default' : 'outline'} onClick={() => setActiveView('enviar')}>
                    <Send className="mr-2 h-4 w-4" /> Enviar Nuevo
                </Button>
                <Button variant={activeView === 'historial' ? 'default' : 'outline'} onClick={() => setActiveView('historial')}>
                    <History className="mr-2 h-4 w-4" /> Historial
                </Button>
            </div>
            
            {activeView === 'enviar' && (
                <Card className="max-w-3xl mx-auto">
                    <CardHeader>
                        <CardTitle>Enviar Comunicado Masivo</CardTitle>
                        <CardDescription>Redacta y envía mensajes a los residentes a través de múltiples canales.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                control={form.control}
                                name="target"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Destinatarios</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar un grupo de destinatarios" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los Residentes</SelectItem>
                                            {condominios.map(condo => (
                                                <SelectItem key={condo.id} value={condo.id}>Residentes de {condo.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />

                                <FormField
                                control={form.control}
                                name="subject"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Asunto</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Anuncio de Mantenimiento de Alberca" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                
                                <div className="space-y-2">
                                     <div className="flex justify-between items-center">
                                        <FormLabel htmlFor="message">Mensaje</FormLabel>
                                        <Button type="button" variant="outline" size="sm" onClick={handleGenerateDraft} disabled={isGenerating}>
                                            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4" />}
                                            Sugerir Borrador con IA
                                        </Button>
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="message"
                                        render={({ field }) => (
                                            <FormItem className="!mt-0">
                                                <FormControl>
                                                    <Textarea id="message" className="min-h-40" placeholder="Escriba aquí el cuerpo del comunicado..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>


                                <FormField
                                    control={form.control}
                                    name="channels"
                                    render={() => (
                                        <FormItem>
                                            <div className="mb-4">
                                                <FormLabel>Canales de Envío</FormLabel>
                                                <FormDescription>
                                                    Seleccione cómo se enviará el comunicado.
                                                </FormDescription>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                                            <FormField
                                                control={form.control}
                                                name="channels.push"
                                                render={({ field }) => (
                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="font-normal flex items-center gap-2">
                                                        <Send className="h-4 w-4 text-muted-foreground"/> Notificación Push
                                                    </FormLabel>
                                                </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="channels.email"
                                                render={({ field }) => (
                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="font-normal flex items-center gap-2">
                                                        <Mail className="h-4 w-4 text-muted-foreground"/> Correo Electrónico
                                                    </FormLabel>
                                                </FormItem>
                                                )}
                                            />
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-end pt-4">
                                    <Button type="submit" size="lg" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Enviando...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="mr-2 h-4 w-4"/> Enviar Comunicado
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            )}
            {activeView === 'historial' && (
                 <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle>Historial de Comunicados</CardTitle>
                        <CardDescription>Revisa los mensajes que se han enviado anteriormente.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Asunto</TableHead>
                                        <TableHead>Destinatarios</TableHead>
                                        <TableHead>Canales</TableHead>
                                        <TableHead>Fecha</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.subject}</TableCell>
                                            <TableCell>{item.targetName}</TableCell>
                                            <TableCell className="flex gap-1">
                                                {item.channels.map(c => <Badge key={c} variant="secondary">{c}</Badge>)}
                                            </TableCell>
                                            <TableCell>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: es })}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
