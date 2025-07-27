
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ArrowLeft, Check, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { User, Survey, SurveyOption, CommunityEvent } from "@/lib/definitions";
import { getSurveys, voteOnSurvey } from "@/lib/surveyService";
import { getEvents } from "@/lib/eventService";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function SurveyCard({ survey, onVote }: { survey: Survey, onVote: (surveyId: string, optionId: string) => void }) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    const handleVote = () => {
        if (selectedOption) {
            onVote(survey.id, selectedOption);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{survey.title}</CardTitle>
                <CardDescription>{survey.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <RadioGroup value={selectedOption || undefined} onValueChange={setSelectedOption}>
                    {survey.options.map(option => (
                        <div key={option.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.id} id={`${survey.id}-${option.id}`} />
                            <Label htmlFor={`${survey.id}-${option.id}`} className="font-normal">{option.text}</Label>
                        </div>
                    ))}
                </RadioGroup>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2">
                <p className="text-xs text-muted-foreground">Cierra: {format(new Date(survey.closesAt), "PPP", { locale: es })}</p>
                <Button onClick={handleVote} disabled={!selectedOption}>
                    <Check className="mr-2 h-4 w-4"/>Votar
                </Button>
            </CardFooter>
        </Card>
    )
}

function EventCard({ event }: { event: CommunityEvent }) {
    const formatEventDate = (start: string, end: string, isAllDay: boolean) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (isAllDay) {
            return format(startDate, "PPP", { locale: es });
        }
        return `${format(startDate, "PPP p", { locale: es })} - ${format(endDate, "p", { locale: es })}`;
    };
    
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>{event.title}</CardTitle>
                <CardDescription>{event.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground"/> {formatEventDate(event.start, event.end, event.isAllDay)}
                </p>
                {event.location && <p className="text-sm font-medium flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground"/> Ubicación: {event.location}</p>}
            </CardContent>
        </Card>
    )
}


export default function ComunidadPage() {
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [events, setEvents] = useState<CommunityEvent[]>([]);
    const [votedSurveyIds, setVotedSurveyIds] = useState<string[]>([]);
    
    useEffect(() => {
        const storedUser = sessionStorage.getItem("loggedInUser");
        if (storedUser) {
            const parsedUser: User = JSON.parse(storedUser);
            setUser(parsedUser);
            if(parsedUser.condominioId) {
                setSurveys(getSurveys(parsedUser.condominioId));
                setEvents(getEvents(parsedUser.condominioId));
            }
        }
        const storedVotedIds = JSON.parse(localStorage.getItem('votedSurveyIds') || '[]');
        setVotedSurveyIds(storedVotedIds);
    }, []);

    const handleVote = (surveyId: string, optionId: string) => {
        voteOnSurvey(surveyId, optionId);
        toast({ title: "Voto registrado", description: "¡Gracias por tu participación!" });
        const updatedVotedIds = [...votedSurveyIds, surveyId];
        setVotedSurveyIds(updatedVotedIds);
        localStorage.setItem('votedSurveyIds', JSON.stringify(updatedVotedIds));
    }

    const activeSurveys = surveys.filter(s => s.status === 'Abierta' && !votedSurveyIds.includes(s.id));

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard" passHref>
                    <Button variant="outline" size="icon" aria-label="Volver al panel">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Comunidad</h2>
                    <p className="text-muted-foreground">Participa en encuestas y mantente informado de los eventos.</p>
                </div>
            </div>

            <Tabs defaultValue="surveys">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="surveys">Encuestas y Votaciones</TabsTrigger>
                    <TabsTrigger value="events">Eventos</TabsTrigger>
                </TabsList>
                <TabsContent value="surveys">
                    <div className="space-y-4">
                        {activeSurveys.length > 0 ? activeSurveys.map(survey => (
                            <SurveyCard key={survey.id} survey={survey} onVote={handleVote} />
                        )) : (
                            <Card className="text-center py-10">
                                <CardHeader>
                                    <CardTitle>No hay encuestas activas</CardTitle>
                                    <CardDescription>No hay encuestas disponibles para votar en este momento.</CardDescription>
                                </CardHeader>
                            </Card>
                        )}
                    </div>
                </TabsContent>
                <TabsContent value="events">
                     <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                         {events.length > 0 ? events.map(event => (
                            <EventCard key={event.id} event={event} />
                         )) : (
                            <Card className="text-center py-10 md:col-span-2 lg:col-span-3">
                                <CardHeader>
                                    <CardTitle>No hay eventos próximos</CardTitle>
                                    <CardDescription>No se han programado eventos recientemente.</CardDescription>
                                </CardHeader>
                            </Card>
                         )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
