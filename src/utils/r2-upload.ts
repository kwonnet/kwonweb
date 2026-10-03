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


// Limit concurrent uploads across all drawers/threads in this browser.
let tail: Promise<unknown> = Promise.resolve();
export async function uploadMultipleFilesWithMetadata(inputs: FileUploadInput[]): Promise<UploadedFileInfo[]> {
  const task = tail.then(async () => {
    const uploaded: UploadedFileInfo[] = [];
    for (const item of inputs) {
      if (!item.file.size || item.file.size > 10 * 1024 * 1024) throw new Error("Images must be between 1 byte and 10 MB.");
      const response = await fetch("/api/uploads/images", { method: "POST", credentials: "same-origin", body: item.file, signal: AbortSignal.timeout(60_000) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Image upload failed.");
      uploaded.push({ ...result, altText: item.altText, flags: item.flags });
    }
    return uploaded;
  });
  tail = task.catch(() => undefined);
  return task;
}
