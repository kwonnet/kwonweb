import { bunnyTusEndpoint, bunnyVideoLibraryId } from "@/config/bunny";
import { createVideo, getPresignedSignature } from "@/lib/actions/bunny";
import { nanoid } from "nanoid";
import * as tus from "tus-js-client";


interface FileUploadInput {
  file: File;
  altText?: string;
  flags?: string[];
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

const getVideoDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      resolve({ width: video.videoWidth, height: video.videoHeight });
    };
    video.onerror = reject;
  });
};


const getVideoId = async (title: string, path?: string) => {
    const result = await createVideo(title, path);
    if (!result.data) throw new Error(result.message);
    return result.data.guid;
};

// Extract file extension helper
function getFileExtension(filename: string): string {
    const match = filename.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
    return match ? match[1] : "";
  }

export const uploadBunnyFilesWithMetadata = async (body: FileUploadInput[]): Promise<UploadedFileInfo[]> => {
  const uploadedFiles: UploadedFileInfo[] = [];

  for (const item of body) {
    const file = item.file;
    const ext = getFileExtension(file.name);
    const uid = nanoid();
    const title = file.name;
    const filename = `${uid}.${ext}`;
    const path = "videos"; // or any other path you want to use
    const videoId = await getVideoId(title, path);
    const expiresIn = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
    const signature = await getPresignedSignature(videoId, expiresIn);

    const uploadedFile = await new Promise<UploadedFileInfo>((resolve, reject) => {
      const upload = new tus.Upload(file, {
        endpoint: bunnyTusEndpoint,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          AuthorizationSignature: signature,
          AuthorizationExpire: expiresIn.toString(),
          VideoId: videoId,
          LibraryId: bunnyVideoLibraryId,
        },
        metadata: {
          filename,
          filetype: file.type,
          title,
          thumbnailTime: "2",
        },
        onError(error) {
          console.error("Tus Upload Error:", error);
          reject(error);
        },
        async onSuccess() {
           // replace with actual CDN playback URL if you have one
           const dimen = await getVideoDimensions(file)
          resolve({
            fileId: videoId,
            name: filename,
            url: `${videoId}/${filename}`,
            height: dimen.height, // Bunny doesn't return this directly, mock or retrieve later
            width: dimen.width,
            size: file.size,
            thumbnailUrl: "thumbnail.jpg",
            fileType: file.type,
            filePath: `${path}/${videoId}/${filename}`,
            altText: item.altText || '',
            flags: item.flags || [],
          });
        },
      });

      upload.findPreviousUploads().then((previousUploads) => {
        if (previousUploads.length) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }
        upload.start();
      });
    });

    uploadedFiles.push(uploadedFile);
  }

  return uploadedFiles;
};
