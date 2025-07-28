'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { createPost } from '@/app/server-actions-example/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function CreatePostForm() {
    const { toast } = useToast();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content) {
            toast({
                title: 'Error',
                description: 'El título y el contenido son requeridos.',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await createPost(title, content);
            toast({
                title: 'Éxito',
                description: 'El post ha sido creado.',
            });
            setTitle('');
            setContent('');
        } catch (error) {
             toast({
                title: 'Error',
                description: 'No se pudo crear el post.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    return (
        <Card>
            <CardHeader>
            <CardTitle>Crear un Nuevo Post</CardTitle>
            <CardDescription>
                Este formulario invoca una Server Action desde un componente de cliente.
            </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="title">Título</label>
                        <Input 
                            id="title" 
                            name="title" 
                            placeholder="Título de tu post" 
                            required 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="content">Contenido</label>
                        <Textarea 
                            id="content" 
                            name="content" 
                            placeholder="Escribe tu contenido aquí..." 
                            required 
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Crear Post
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
