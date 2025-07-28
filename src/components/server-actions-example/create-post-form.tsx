'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { createPost } from '@/app/server-actions-example/actions';
import { useRef } from 'react';

export function CreatePostForm() {
    const formRef = useRef<HTMLFormElement>(null);
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Crear un Nuevo Post</CardTitle>
                <CardDescription>
                    Este formulario está en un componente de cliente, pero el botón invoca una Server Action.
                </CardDescription>
            </CardHeader>
            <form ref={formRef} action={async (formData) => {
                await createPost(formData);
                formRef.current?.reset();
            }}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="title">Título</label>
                        <Input 
                            id="title" 
                            name="title" 
                            placeholder="Título de tu post" 
                            required 
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="content">Contenido</label>
                        <Textarea 
                            id="content" 
                            name="content" 
                            placeholder="Escribe tu contenido aquí..." 
                            required 
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit">
                        Crear Post
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
