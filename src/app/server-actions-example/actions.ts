'use server';

import { revalidatePath } from 'next/cache';

// Esto es una simulación de una base de datos en memoria.
// En una aplicación real, interactuarías con tu base de datos (Firebase, etc.).
let posts = [
  { id: '1', title: 'Post de Ejemplo 1', content: 'Este es el contenido del primer post.' },
  { id: '2', title: 'Post de Ejemplo 2', content: 'Este es el contenido del segundo post.' },
];

export async function getPosts() {
  return posts;
}

export async function createPost(formData: FormData) {
  'use server'
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  if (!title || !content) {
    throw new Error('El título y el contenido son requeridos.');
  }
  const newPost = {
    id: String(posts.length + 1),
    title,
    content
  };
  posts.push(newPost);
  console.log('Post creado:', newPost);
  
  revalidatePath('/server-actions-example');
  return newPost;
}


export async function deletePost(formData: FormData) {
  'use server'
  const id = formData.get('id') as string;

  // Simula la eliminación en la base de datos
  posts = posts.filter((post) => post.id !== id);
  console.log('Post Eliminado:', id);

  // Revalida el caché para actualizar la UI.
  revalidatePath('/server-actions-example');
}

export async function updatePost(formData: FormData) {
    'use server'
    const id = formData.get('id') as string;
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;

    const postIndex = posts.findIndex((post) => post.id === id);

    if (postIndex === -1) {
        throw new Error('Post no encontrado.');
    }

    posts[postIndex] = { ...posts[postIndex], title, content };
    console.log('Post actualizado:', posts[postIndex]);
    
    revalidatePath('/server-actions-example');
}
