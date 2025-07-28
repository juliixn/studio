
interface Post {
    userId: number;
    id: number;
    title: string;
    body: string;
}

async function getPosts(): Promise<Post[]> {
    const res = await fetch('https://jsonplaceholder.typicode.com/posts', { 
        // Esta opción habilita la Regeneración Estática Incremental (ISR).
        // Los datos se cachearán por 3600 segundos (1 hora).
        // Si una petición llega después de ese tiempo, se sirve la versión cacheadada
        // mientras Next.js revalida los datos en segundo plano.
        next: { revalidate: 3600 } 
    });

    if (!res.ok) {
        throw new Error('Failed to fetch posts');
    }

    return res.json();
}


export default async function DataFetchingExamplePage() {
    const posts: Post[] = await getPosts();

    return (
        <div className="container mx-auto p-4 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Data Fetching con Revalidación</h1>
                <p className="text-muted-foreground">
                    Esta página obtiene datos usando `revalidate`. Los datos se cachean por un tiempo específico (en este caso, 1 hora). Si un usuario visita la página después de que el tiempo ha expirado, verá la versión antigua mientras Next.js obtiene los datos actualizados en segundo plano. Las visitas posteriores recibirán la nueva versión.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {posts.slice(0, 6).map((post) => (
                    <div key={post.id} className="border p-4 rounded-lg">
                        <h2 className="text-lg font-semibold mb-2">{post.title}</h2>
                        <p className="text-sm text-muted-foreground">{post.body}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
