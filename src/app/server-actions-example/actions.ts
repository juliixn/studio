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
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  const newPost = {
    id: String(Date.now()),
    title,
    content,
  };

  // Simula la escritura en la base de datos
  posts.push(newPost);
  console.log('Post Creado:', newPost);

  // Revalida el caché de la ruta para que Next.js vuelva a renderizar la página con los nuevos datos.
  revalidatePath('/server-actions-example');
}

export async function deletePost(formData: FormData) {
  const id = formData.get('id') as string;

  // Simula la eliminación en la base de datos
  posts = posts.filter((post) => post.id !== id);
  console.log('Post Eliminado:', id);

  // Revalida el caché para actualizar la UI.
  revalidatePath('/server-actions-example');
}