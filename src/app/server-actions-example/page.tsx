import { revalidatePath } from 'next/cache';
import { getPosts, deletePost } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2 } from 'lucide-react';

export default async function ServerActionsExamplePage() {
  const posts = await getPosts();

  // Server Action definida directamente en el componente del servidor.
  async function createPost(formData: FormData) {
    'use server';
    
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;

    // Aquí iría la lógica para actualizar la base de datos
    console.log('Creando post desde el componente:', { title, content });
    
    // Revalidamos el path para que Next.js actualice la UI
    revalidatePath('/server-actions-example');
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Ejemplo de Server Actions</h1>
        <p className="text-muted-foreground">
          Este ejemplo demuestra cómo usar Server Actions en Next.js para crear y eliminar datos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crear un Nuevo Post</CardTitle>
          <CardDescription>
            Este formulario invoca una Server Action definida dentro del propio componente.
          </CardDescription>
        </CardHeader>
        <form action={createPost}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title">Título</label>
              <Input id="title" name="title" placeholder="Título de tu post" required />
            </div>
            <div className="space-y-2">
              <label htmlFor="content">Contenido</label>
              <Textarea id="content" name="content" placeholder="Escribe tu contenido aquí..." required />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit">Crear Post</Button>
          </CardFooter>
        </form>
      </Card>

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
