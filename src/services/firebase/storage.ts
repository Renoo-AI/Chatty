import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param file The file to upload.
 * @param path The path in the storage bucket.
 * @param onProgress Optional callback for upload progress.
 */
export const uploadFile = async (
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => {
        console.error("Upload failed", error);
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
};

export const uploadChatMessageMedia = async (roomId: string, file: File) => {
  const timestamp = Date.now();
  const path = `rooms/${roomId}/media/${timestamp}_${file.name}`;
  return uploadFile(file, path);
};
