import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage } from ".";
import { nanoid } from "nanoid";
import { signInAnonymously } from "firebase/auth";

export interface FileUploadInput {
  file: File;
  altText?: string;
  flags: string[];
}

export interface UploadedFileInfo {
  fileId: string;
  name: string;
  url: string;
  height: number;
  width: number;
  size: number;
  thumbnailUrl: string;
  fileType: string;
  filePath: string;
  altText?: string;
  flags: string[];
}

const getImageDimensions = (
  file: File
): Promise<{ width: number; height: number }> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.src = URL.createObjectURL(file);
  });

export async function ensureSignedInAnon() {
  try {
    if (!auth.currentUser) {
      const userCredential = await signInAnonymously(auth);
      return userCredential.user;
    }
    return auth.currentUser;
  } catch (error) {
    throw error;
  }
}

// Extract file extension helper
function getFileExtension(filename: string): string {
    const match = filename.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
    return match ? match[1] : "";
  }
  

export const uploadMultipleFilesWithMetadata = async (
  fUid: string,
  inputs: FileUploadInput[],
  path: string = "uploads"
): Promise<UploadedFileInfo[]> => {
  const uploadTasks = inputs.map(async (item) => {
    const file = item.file;
    const ext = getFileExtension(file.name);
    const fileId = nanoid();
    const filename = `${fileId}.${ext}`;
    const filePath = `${path}/${fUid}/${filename}`;
    const fileRef = ref(storage, filePath);

    const snapshot = await uploadBytes(fileRef, file);
    const url = await getDownloadURL(snapshot.ref);

    const metadata: UploadedFileInfo = {
      url,
      height: 0,
      width: 0,
      filePath,
      fileId: fileId,
      name: filename,
      size: file.size,
      thumbnailUrl: url, // you can modify this if you have a thumbnail generator
      fileType: file.type,
      altText: item.altText,
      flags: item.flags,
    };

    if (file.type.startsWith("image/")) {
      const dimensions = await getImageDimensions(file);
      metadata.height = dimensions.height;
      metadata.width = dimensions.width;
    }

    return metadata;
  });

  return await Promise.all(uploadTasks);
};
