
"use client";

import { useState, useEffect, useRef } from "react";
import type { User, Conversation, DirectMessage } from "@/lib/definitions";
import { getUsersForMessaging, getConversationsForUser, addDirectMessage } from "@/lib/directMessageService";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Send, ArrowLeft, PlusCircle } from "lucide-react";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../ui/dialog";

function ChatWindow({ conversation, currentUser, onBack, onMessageSent }: { conversation: Conversation; currentUser: User; onBack: () => void; onMessageSent: (recipient: User) => void }) {
    const [newMessage, setNewMessage] = useState("");
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const recipient = conversation.participantIds[0] === currentUser.id 
        ? getUsersForMessaging(currentUser.id).find(u => u.id === conversation.participantIds[1])
        : getUsersForMessaging(currentUser.id).find(u => u.id === conversation.participantIds[0]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }, [conversation.messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !recipient) return;
        addDirectMessage(currentUser, recipient, newMessage);
        setNewMessage("");
        onMessageSent(recipient);
    };

    if (!recipient) {
        return <div className="p-4 text-center">Error: No se pudo encontrar al destinatario.</div>
    }

    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center gap-2 p-2 border-b">
                <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4"/></Button>
                <Avatar className="h-8 w-8"><AvatarFallback>{recipient.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback></Avatar>
                <span className="font-semibold">{recipient.name}</span>
            </header>
            <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
                 <div className="space-y-4">
                    {conversation.messages.map((msg) => (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.authorId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                            {msg.authorId !== currentUser.id && (
                                <Avatar className="h-8 w-8"><AvatarFallback>{msg.authorName.split(' ')[0][0]}</AvatarFallback></Avatar>
                            )}
                            <div className={`max-w-[75%] p-3 rounded-lg ${msg.authorId === currentUser.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                <p className="text-sm">{msg.text}</p>
                                <p className={`text-xs mt-1 ${msg.authorId === currentUser.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: es })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
             <form onSubmit={handleSendMessage} className="p-2 border-t flex gap-2">
                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Escribe un mensaje..."/>
                <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
            </form>
        </div>
    );
}

function NewConversationDialog({ currentUser, onConversationStarted, onCancel }: { currentUser: User; onConversationStarted: (conversation: Conversation) => void; onCancel: () => void; }) {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>("");

    useEffect(() => {
        setAllUsers(getUsersForMessaging(currentUser.id));
    }, [currentUser.id]);
    
    const handleStart = () => {
        const recipient = allUsers.find(u => u.id === selectedUserId);
        if (recipient) {
            const conversation = addDirectMessage(currentUser, recipient, `Hola, he iniciado un chat contigo.`);
            onConversationStarted(conversation);
        }
    };
    
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Iniciar Nueva Conversación</DialogTitle>
                <DialogDescription>Selecciona un usuario para comenzar a chatear.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar usuario..." /></SelectTrigger>
                    <SelectContent>
                        {allUsers.map(user => <SelectItem key={user.id} value={user.id}>{user.name} ({user.role})</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button disabled={!selectedUserId} onClick={handleStart}>Iniciar Chat</Button>
            </DialogFooter>
        </DialogContent>
    );
}

export default function DirectMessageView({ currentUser }: { currentUser: User }) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [isNewConvoOpen, setIsNewConvoOpen] = useState(false);

    useEffect(() => {
        setConversations(getConversationsForUser(currentUser.id));
        const interval = setInterval(() => setConversations(getConversationsForUser(currentUser.id)), 2000);
        return () => clearInterval(interval);
    }, [currentUser.id]);

    const handleMessageSent = (recipient: User) => {
        const conversationId = [currentUser.id, recipient.id].sort().join('--');
        setConversations(getConversationsForUser(currentUser.id));
    };

    if (selectedConversation) {
        return <ChatWindow conversation={selectedConversation} currentUser={currentUser} onBack={() => setSelectedConversation(null)} onMessageSent={handleMessageSent} />;
    }

    return (
        <div className="flex flex-col h-[450px] pt-4">
            <div className="px-2 pb-2 flex justify-between items-center">
                 <h3 className="font-semibold">Conversaciones</h3>
                 <Dialog open={isNewConvoOpen} onOpenChange={setIsNewConvoOpen}>
                    <DialogTrigger asChild><Button size="sm" variant="outline"><PlusCircle className="mr-2 h-4 w-4"/>Nuevo</Button></DialogTrigger>
                    <NewConversationDialog 
                        currentUser={currentUser} 
                        onCancel={() => setIsNewConvoOpen(false)}
                        onConversationStarted={(convo) => {
                            setIsNewConvoOpen(false);
                            setSelectedConversation(convo);
                            setConversations(getConversationsForUser(currentUser.id));
                        }}
                    />
                 </Dialog>
            </div>
            <ScrollArea className="flex-grow pr-4">
                {conversations.length > 0 ? (
                    <div className="space-y-2">
                        {conversations.map(convo => {
                            const otherParticipantName = convo.participantNames.find(name => name !== currentUser.name) || 'Desconocido';
                            const lastMessage = convo.messages[convo.messages.length - 1];
                            return (
                                <button key={convo.id} onClick={() => setSelectedConversation(convo)} className="w-full text-left p-3 rounded-md hover:bg-muted flex items-center gap-3">
                                    <Avatar><AvatarFallback>{otherParticipantName[0]}</AvatarFallback></Avatar>
                                    <div className="flex-grow overflow-hidden">
                                        <p className="font-semibold">{otherParticipantName}</p>
                                        <p className="text-sm text-muted-foreground truncate">{lastMessage.authorId === currentUser.id ? 'Tú: ' : ''}{lastMessage.text}</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground flex-shrink-0">{formatDistanceToNow(new Date(convo.lastMessageAt), { locale: es })}</span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-center text-muted-foreground">
                        <p>No tienes conversaciones.<br/>Inicia una nueva para comenzar.</p>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
