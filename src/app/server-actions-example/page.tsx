import { getPosts, deletePost } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { CreatePostForm } from '@/components/server-actions-example/create-post-form';

export default async function ServerActionsExamplePage() {
  const posts = await getPosts();

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Ejemplo de Server Actions</h1>
        <p className="text-muted-foreground">
          Este ejemplo demuestra cómo usar Server Actions en Next.js para crear y eliminar datos.
        </p>
      </div>

      <CreatePostForm />

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Posts Existentes</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Card key={post.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{post.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p>{post.content}</p>
              </CardContent>
              <CardFooter>
                {/* Este formulario invoca la Server Action desde el archivo `actions.ts` */}
                <form action={deletePost} className="ml-auto">
                  <input type="hidden" name="id" value={post.id} />
                  <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Eliminar Post</span>
                  </Button>
                </form>
              </CardFooter>
            </Card>
          ))}
           {posts.length === 0 && (
            <p className="text-muted-foreground md:col-span-2 lg:col-span-3 text-center">
              No hay posts. ¡Crea uno nuevo!
            </p>
           )}
        </div>
      </div>
    </div>
  );
}
