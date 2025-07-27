
"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import type { User, ChatMessage } from "@/lib/definitions";
import { updateUser } from "@/lib/userService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Camera, Trash2, KeyRound, MessageSquare, Users, Send } from "lucide-react";
import { getChatMessages, sendChatMessage } from "@/lib/chatService";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea } from "../ui/scroll-area";
import DirectMessageView from "./direct-message-view";


// Schema for changing password
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida."),
  newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres."),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

// Schema for changing photo
const photoFormSchema = z.object({
    photoUrl: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
});


function GuardChat({ user }: { user: User }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchMessages = () => {
            setMessages(getChatMessages());
        };
        fetchMessages();
        const interval = setInterval(fetchMessages, 2000); // Poll for new messages
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Scroll to bottom when new messages arrive
        if (scrollAreaRef.current) {
             const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }, [messages]);
    
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        sendChatMessage({
            authorId: user.id,
            authorName: user.name,
            text: newMessage.trim()
        });
        setNewMessage("");
        setMessages(getChatMessages()); // Refresh immediately
    };

    return (
        <div className="flex flex-col h-[450px] pt-4">
            <ScrollArea className="flex-grow pr-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.authorId === user.id ? 'justify-end' : 'justify-start'}`}>
                            {msg.authorId !== user.id && (
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>{msg.authorName.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                                </Avatar>
                            )}
                            <div className={`max-w-[75%] p-3 rounded-lg ${msg.authorId === user.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                <p className="text-sm">{msg.text}</p>
                                <p className={`text-xs mt-1 ${msg.authorId === user.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                    {msg.authorName.split(' ')[0]} - {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: es })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
             <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                />
                <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
            </form>
        </div>
    );
}

export default function ProfileSettingsDialog({ user, onClose }: { user: User, onClose: () => void }) {
  const { toast } = useToast();
  
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  
  const photoForm = useForm<z.infer<typeof photoFormSchema>>({
    resolver: zodResolver(photoFormSchema),
    defaultValues: { photoUrl: user.photoUrl || "" },
  });

  const photoUrl = photoForm.watch("photoUrl");

  const onPasswordSubmit = (values: z.infer<typeof passwordFormSchema>) => {
    if (user.password !== values.currentPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'La contraseña actual es incorrecta.' });
      return;
    }
    updateUser(user.id, { password: values.newPassword });
    toast({ title: 'Éxito', description: 'Tu contraseña ha sido actualizada.' });
    passwordForm.reset();
  };
  
  const onPhotoSubmit = (values: z.infer<typeof photoFormSchema>) => {
    updateUser(user.id, { photoUrl: values.photoUrl });
    toast({ title: 'Éxito', description: 'Tu foto de perfil ha sido actualizada.' });
  };
  
  // Camera and file refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Mi Perfil y Ajustes</DialogTitle>
        <DialogDescription>
          Gestiona tu información personal y de comunicación.
        </DialogDescription>
      </DialogHeader>
      
      <Tabs defaultValue="password">
        <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="password"><KeyRound className="h-4 w-4"/></TabsTrigger>
            <TabsTrigger value="photo"><Camera className="h-4 w-4"/></TabsTrigger>
            <TabsTrigger value="guard-chat"><Users className="h-4 w-4"/></TabsTrigger>
            <TabsTrigger value="messages"><MessageSquare className="h-4 w-4"/></TabsTrigger>
        </TabsList>
        
        <TabsContent value="password">
            <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 pt-4">
                    <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => ( <FormItem><FormLabel>Contraseña Actual</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={passwordForm.control} name="newPassword" render={({ field }) => ( <FormItem><FormLabel>Nueva Contraseña</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => ( <FormItem><FormLabel>Confirmar Nueva Contraseña</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <div className="flex justify-end"><Button type="submit">Cambiar Contraseña</Button></div>
                </form>
            </Form>
        </TabsContent>
        
        <TabsContent value="photo">
             <Form {...photoForm}>
                <form onSubmit={photoForm.handleSubmit(onPhotoSubmit)} className="space-y-4 pt-4">
                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-32 w-32"><AvatarImage src={photoUrl} alt={user.name} /><AvatarFallback className="text-4xl">{user.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback></Avatar>
                        <input type="file" ref={fileInputRef} accept="image/*" className="hidden" />
                    </div>
                     <div className="flex justify-end"><Button type="submit">Guardar Foto</Button></div>
                </form>
            </Form>
        </TabsContent>

        <TabsContent value="guard-chat">
           <GuardChat user={user} />
        </TabsContent>

        <TabsContent value="messages">
            <DirectMessageView currentUser={user} />
        </TabsContent>

      </Tabs>

    </DialogContent>
  );
}
