'use server';

import { revalidatePath } from 'next/cache';

// Esto es una simulación de una base de datos en memoria.
// En una aplicación real, interactuarías con tu base de datos (Firebase, etc.).
let posts = [
  { id: '1', title: 'Post de Ejemplo 1', content: 'Este es el contenido del primer post.' },
  { id: '2', title: 'Post de Ejemplo 2', content: 'Este es el contenido del segundo post.' },
];
let likes = 0;
let views = 1000;

export async function getPosts() {
  return posts;
}

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  if (!title || !content) {
    throw new Error('El título y el contenido son requeridos.');
  }
  const newPost = {
    id: String(Date.now()), // Use timestamp for a more unique ID
    title,
    content
  };
  posts.unshift(newPost); // Add to the beginning of the list
  
  revalidatePath('/server-actions-example');
  return newPost;
}


export async function deletePost(formData: FormData) {
  'use server'
  const id = formData.get('id') as string;

  // Simula la eliminación en la base de datos
  posts = posts.filter((post) => post.id !== id);

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
    
    revalidatePath('/server-actions-example');
}

export async function getLikes() {
    return likes;
}

export async function incrementLike() {
    likes += 1;
    revalidatePath('/server-actions-example');
    return likes;
}

export async function getViews() {
  return views;
}

export async function incrementViews() {
  views += 1;
  revalidatePath('/server-actions-example');
  return views;
}
