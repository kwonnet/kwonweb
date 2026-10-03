"use client";
import { useEffect, useRef, useState } from "react";
import {
  uploadStreamVideo,
  type VideoInput,
  type VideoUploadControls,
  type VideoUploadProgress,
} from "@/utils/stream-upload";
export function useVideoUploads(owner?: string) {
  const [uploads, setUploads] = useState<VideoUploadProgress[]>([]);
  const controller = useRef(new AbortController());
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const controls = useRef<VideoUploadControls | null>(null);
  useEffect(() => () => controller.current.abort(), []);
  const busy = uploads.some((u) => !["ready", "error"].includes(u.phase));
  useEffect(() => {
    if (!busy) return;
    const prevent = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [busy]);
  return {
    uploads,
    reset() {
      setUploads([]);
    },
    begin() {
      controller.current.abort();
      controller.current = new AbortController();
      queue.current = Promise.resolve();
      setUploads([]);
    },
    cancel() {
      controller.current.abort();
      controls.current = null;
      setUploads((previous) =>
        previous.map((u) =>
          ["ready", "error"].includes(u.phase)
            ? u
            : {
                ...u,
                phase: "error",
                message: "Canceled. Submit your draft again to resume.",
              },
        ),
      );
    },
    pause() {
      void controls.current?.pause().catch(() => {});
    },
    resume() {
      controls.current?.resume();
    },
    async upload(files: VideoInput[]) {
      const signal = controller.current.signal;
      return Promise.all(
        files.map((input) => {
          const id = crypto.randomUUID();
          setUploads((previous) => [
            ...previous,
            { id, name: input.file.name, phase: "queued", percent: 0 },
          ]);
          const task = queue.current.then(async () => {
            try {
              return await uploadStreamVideo(input, {
                owner: owner || "",
                signal,
                onProgress: (progress) =>
                  setUploads((previous) =>
                    previous.map((u) =>
                      u.id === id
                        ? { ...u, message: undefined, ...progress }
                        : u,
                    ),
                  ),
                controls: (value) => {
                  controls.current = value;
                },
              });
            } catch (error) {
              setUploads((previous) =>
                previous.map((u) =>
                  u.id === id
                    ? {
                        ...u,
                        phase: "error",
                        message:
                          error instanceof Error
                            ? error.message
                            : "Video upload failed.",
                      }
                    : u,
                ),
              );
              throw error;
            }
          });
          queue.current = task;
          return task;
        }),
      );
    },
  };
}
