
"use client";

import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Uploads a file to Firebase Storage.
 * @param path The path where the file will be stored (e.g., 'profile-pictures/user123.jpg').
 * @param dataUrl The file content as a Base64 data URL.
 * @returns The public download URL of the uploaded file.
 */
export async function uploadFile(path: string, dataUrl: string): Promise<string> {
    try {
        const storageRef = ref(storage, path);
        
        // Upload the file as a data URL
        const snapshot = await uploadString(storageRef, dataUrl, 'data_url');
        
        // Get the public URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        return downloadURL;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw new Error("Failed to upload file.");
    }
}
