'use client';

import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function UpdatePostForm({ post, updateItemAction }: { post: { id: string, title: string, content: string }, updateItemAction: (formData: FormData) => void }) {
    
    return (
        <form action={updateItemAction} className="flex flex-col flex-grow">
            <CardHeader>
                <input type="hidden" name="id" value={post.id} />
                <label htmlFor={`title-${post.id}`} className="sr-only">Título</label>
                <Input 
                    id={`title-${post.id}`}
                    name="title"
                    defaultValue={post.title}
                    className="text-2xl font-semibold leading-none tracking-tight border-0 shadow-none focus-visible:ring-0 p-0"
                />
            </CardHeader>
            <CardContent className="flex-grow">
                <label htmlFor={`content-${post.id}`} className="sr-only">Contenido</label>
                <Textarea 
                    id={`content-${post.id}`}
                    name="content"
                    defaultValue={post.content}
                    className="border-0 shadow-none focus-visible:ring-0 p-0 resize-none"
                />
            </CardContent>
             <div className="p-6 pt-0">
                <Button type="submit">Actualizar</Button>
            </div>
        </form>
    )
}
