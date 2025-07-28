
interface Post {
    userId: number;
    id: number;
    title: string;
    body: string;
}

async function getPosts(): Promise<Post[]> {
    const res = await fetch('https://jsonplaceholder.typicode.com/posts', { 
        // 'force-cache' es el comportamiento por defecto de fetch en Next.js.
        // La respuesta será cacheadada indefinidamente.
        cache: 'force-cache' 
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
                <h1 className="text-3xl font-bold">Data Fetching con `force-cache`</h1>
                <p className="text-muted-foreground">
                    Esta página obtiene datos de una API externa usando `fetch`. La opción `cache: 'force-cache'` (que es la predeterminada) le indica a Next.js que almacene en caché el resultado de forma indefinida. Los datos solo se volverán a obtener si se reconstruye el sitio o se revalida la ruta.
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
