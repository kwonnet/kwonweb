'use server';

import { bunnyStorageApiKey, bunnyStorageBaseHostName, bunnyStorageRegion, bunnyStorageUrl, bunnyStorageZone, bunnyStreamKey, bunnyStreamUrl, bunnyVideoLibraryId } from '@/config/bunny';
import { BunnyVideoStream } from '@/types/bunny';
import crypto from 'crypto';
// import { AppVideo, BunnyVideoStream } from '@/types';
// import VideoModel from '@/models/VideoModel';
// import { formatVideoData } from '@/utils';
// import UserModel from '@/models/UserModel';
// import mongoose from 'mongoose';

type BunnyResponse = {
    success: boolean;
    message: string;
    statusCode: number;
  };

  const bunnyStorageHostName =
  bunnyStorageRegion.trim().length > 0
    ? `${bunnyStorageRegion}.${bunnyStorageBaseHostName}`
    : bunnyStorageBaseHostName;

export async function getPresignedSignature( videoId: string, expiresIn: number) {
    const data =
      bunnyVideoLibraryId + bunnyStreamKey + expiresIn.toString() + videoId;
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  export async function createVideo(title: string, path = "videos") {
    const res = await fetch(
      `${bunnyStreamUrl}/library/${bunnyVideoLibraryId}/${path}`,
      {
        method: "POST",
        body: JSON.stringify({ title }),
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          AccessKey: bunnyStreamKey,
        },
      }
    );
    if (!res.ok) {
      return { message: res.statusText };
    }
    const result = (await res.json()) as BunnyVideoStream;
    return { data: result, message: "success" };
  }

  export async function uploadVideoThumbnail(
    file: File,
    videoId: string,
    filename: string,
    prevThumbnail?: string | null
  ) {
    try {
      const res = await fetch(
        `https://${bunnyStorageHostName}/${bunnyStorageZone}/${videoId}/${filename}`,
        {
          method: "PUT",
          body: file, // Upload raw binary data
          headers: {
            AccessKey: bunnyStorageApiKey,
            "Content-Type": "application/octet-stream",
          },
        }
      );
  
      if (!res.ok) {
        return { message: res.statusText };
      }
      const fileUrl = `${bunnyStorageUrl}/${videoId}/${filename}`;
      const result = await updateVideoThumbnail(videoId, fileUrl);
      if (!result.data) {
        await deleteBunnyFile(videoId, filename);
        return { message: "Error updating video thumbnail" };
      }
      // delete previous file if it exists
      prevThumbnail && deleteBunnyFile(videoId, prevThumbnail);
      return {
        data: {
          videoId,
          filename,
          url: fileUrl,
          thumbnail: `${videoId}/${filename}`,
        },
        message: "Video thumbnail updated",
      };
    } catch (error: any) {
      return { message: error?.message };
    }
  }

  export async function updateVideoThumbnail(
    videoId: string,
    thumbnailUrl: string
  ) {
    const res = await fetch(
      `${bunnyStreamUrl}/library/${bunnyVideoLibraryId}/videos/${videoId}/thumbnail?thumbnailUrl=${thumbnailUrl}`,
      {
        method: "POST",
        body: JSON.stringify({}),
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          AccessKey: bunnyStreamKey,
        },
      }
    );
  
    if (!res.ok) {
      return { message: res.statusText };
    }
    const result = (await res.json()) as BunnyResponse;
    return { data: result, message: result.message };
  }

  export async function deleteBunnyFile(path: string, filename: string) {
    const res = await fetch(
      `https://${bunnyStorageHostName}/${bunnyStorageZone}/${path}/${filename}`,
      {
        method: "DELETE",
        headers: {
          AccessKey: bunnyStorageApiKey,
        },
      }
    );
    if (!res.ok) {
      return { message: res.statusText };
    }
    return { data: { path, filename }, message: "File deleted successfully" };
  }

  // export default async function fetchStreamVideoList({
  //   page = 1,
  //   itemsPerPage = 21,
  //   orderBy = "views",
  // }: {
  //   page?: number;
  //   itemsPerPage?: number;
  //   orderBy?: string;
  // }) {
  //   try {
  //     const res = await fetch(
  //       `${bunnyStreamUrl}/library/${bunnyVideoLibraryId}/videos?page=${page}&itemsPerPage=${itemsPerPage}&orderBy=${orderBy}`,
  //       {
  //         method: "GET",
  //         headers: { accept: "application/json", AccessKey: bunnyStreamKey },
  //       }
  //     );
  
  //     if (!res.ok) return { message: "Error fetching video list" };
  
  //     const result = await res.json();
  
  //     const bVideoList: BunnyVideoStream[] = result.items;
  
  //     // console.log("bVideoList ", bVideoList)
  //     const ids = bVideoList.map((item) => item.guid);
  //     // Map Bunny video GUIDs to their corresponding database entries
  //     const dbVideos = await VideoModel.find({
  //       videoId: { $in: ids },
  //     }).populate("user", "name _id image username");
  
  //     const dbVideoMap = formatVideoData(dbVideos);
  //     // Merge Bunny video data with database video details
  //     const videoList = bVideoList.map((item) => {
  //       const dbVideo = dbVideoMap.find(
  //         (v) => v.videoId === item.guid
  //       ) as unknown as AppVideo;
  //       if(!dbVideo) return null
  //       return { ...dbVideo, item };
  //     }).filter((v) => !!v)
  
  //     return { data: videoList, message: "success" };
  //   } catch (error: any) {
  //     return { message: "Error fetching trending videos" };
  //   }
  // }
  

  // export async function uploadUserFile({
  //   file,
  //   userId,
  //   filename,
  //   kind,
  // }: {
  //   file: File;
  //   userId: string;
  //   filename: string;
  //   kind: "banner" | "image";
  // }) {
  //   try {
  //     const res = await fetch(
  //       `https://${bunnyStorageHostName}/${bunnyStorageZone}/${userId}/${filename}`,
  //       {
  //         method: "PUT",
  //         body: file, // Upload raw binary data
  //         headers: {
  //           AccessKey: bunnyStorageApiKey,
  //           "Content-Type": "application/octet-stream",
  //         },
  //       }
  //     );
  
  //     if (!res.ok) {
  //       return { message: res.statusText };
  //     }
  //     const fileUrl = `${bunnyStorageUrl}/${userId}/${filename}`;
  //     console.log("about to update user db ", userId)
  //     const update = {
  //       [kind]: filename,
  //     }
  //     // get user to retrieve old avatar
  //     const user = await UserModel.findOne(new mongoose.Types.ObjectId(userId))
  //     // update user avatar
  //     const result = await UserModel.updateOne(
  //       { _id: new mongoose.Types.ObjectId(userId) },
  //       update
  //     );
  //     console.log('updated user result ',result)
  //     if (!result) {
  //       // if error, delete currently uploaded file
  //       await deleteBunnyFile(userId, filename);
  //       return { message: `Error updating ${kind}` };
  //     }
  //     const prevFile = kind === "banner" ? user.banner : user.image
  //     // delete previous file if it exists
  //     prevFile && deleteBunnyFile(userId, prevFile);
  //     // return response
  //     return {
  //       data: {
  //         userId,
  //         filename,
  //         url: fileUrl,
  //         [kind]: `${userId}/${filename}`,
  //       },
  //       message: `${kind} updated successfully`,
  //     };
  //   } catch (error: any) {
  //     return { message: error?.message };
  //   }
  // }

  export async function getBunnyVideo(videoId: string) {
    const res = await fetch(
      `${bunnyStreamUrl}/library/${bunnyVideoLibraryId}/videos/${videoId}/`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          AccessKey: bunnyStreamKey,
        },
      }
    );
    if (!res.ok) {
      return { message: res.statusText };
    }
    const result = (await res.json()) as BunnyVideoStream;
    return { data: result, message: "success" };
  }