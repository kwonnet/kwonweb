import { constant } from "@/config";
import { axiosAPI } from "@/config/axios";
import { generateImagkitFilename, getFileExtension } from "@/utils";
import { IKCore } from "imagekitio-react";
import { nanoid } from "nanoid";
import { toast } from "react-toastify";

type AuthResult = {
    token: string;
    expire: number;
    signature: string;
}

const ikCore = new IKCore({
    urlEndpoint: String(process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT), 
    publicKey: String(process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY)
});

export const imagekitAuthenticator = async (accessToken?: string | undefined) => {
    axiosAPI.accessToken = accessToken;
    try {
        const date = new Date();
        const result = await axiosAPI.post(`/v1/imagekit?u_t=${date.getTime()}`,{})
        return result.data as AuthResult;
    } catch (error:any) {
        throw new Error(`Authentication request failed: ${error.message}`);
    }
};

export const getImagekitThumbnail = (filename: string) => {
    // return "/tr:n-ik_ml_thumbnail" + filename
    return `/tr:n-ik_ml_thumbnail/${process.env.NEXT_PUBLIC_IMAGEKIT_UPLOAD_DIR}/${filename}`

}

export const getImagekitThumbnailUrl = (filename: string) => {
    // return process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT + "/tr:n-ik_ml_thumbnail" + filePath
    return `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/tr:n-ik_ml_thumbnail/${process.env.NEXT_PUBLIC_IMAGEKIT_UPLOAD_DIR}/${filename}`
}

// export const getImagekitFilelUrl = (filename: string) => {
//     if(filename.startsWith("https://") || filename.startsWith("http://")) return filename
//     if(filename.startsWith("/")) return `${constant.siteUrl}${filename}`
//     return `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/${process.env.NEXT_PUBLIC_IMAGEKIT_UPLOAD_DIR}/${filename}`
// }

export const imagekitDeleteFile = async (fileId: string, accessToken?: string | undefined) => {
    axiosAPI.accessToken = accessToken;
    try {
        const _fileId = fileId?.split('/')?.slice(-1)[0]
        const result = await axiosAPI.delete(`/imagekit/${_fileId}`)
        return result.data;
    } catch (error:any) {
        throw new Error(`Authentication request failed: ${error.message}`);
    }
};

export const handleImagikPostFileUpload = async(userId: string, files: { altText: string, flags: string[], file: File}[], accessToken: string | undefined) => {
    try {
        
        const uploadPromises = files.map( async item => {
            const imagekitAuth = await imagekitAuthenticator(accessToken)
            const fileEx = getFileExtension(item?.file.name)
            const name = generateImagkitFilename(userId, 10, constant.siteName)
            const id = generateImagkitFilename(userId)
            const fileName = name + `_${nanoid(10)}.` + fileEx
            const result = await ikCore.upload({
                ...imagekitAuth, 
                folder: process.env.NEXT_PUBLIC_IMAGEKIT_UPLOAD_DIR?.toLocaleLowerCase(), fileName, 
                file: item.file, 
                customMetadata: {id},
                useUniqueFileName: false
            })
            return {
                fileId: result.fileId,
                name: result.name,
                url: result.url,
                height: result.height,
                width: result.width,
                size: result.size,
                thumbnailUrl: result.thumbnailUrl,
                fileType: result.fileType,
                filePath: result.filePath,
                altText: item.altText,
                flags: item.flags
            }
        })
        return await Promise.all(uploadPromises)
    } catch (error) {
        throw error
    }
}

export const handleImagikFileUpload = async(userId: string, files: File[], accessToken: string | undefined) => {
    try {
        const filesArray = files.filter(file => file.size <= 512000)
        if(filesArray.length === 0) {
            toast.warn("File(s) size is greater than 500kb")
            throw new Error("File(s) size is greater than 500kb")
        }
        const uploadPromises = filesArray.map( async file => {
            const imagekitAuth = await imagekitAuthenticator(accessToken)
            const fileEx = getFileExtension(file.name)
            const name = generateImagkitFilename(userId, 10, constant.siteName)
            const id = generateImagkitFilename(userId)
            const fileName = name + "_" + fileEx
            const result = await ikCore.upload({
                ...imagekitAuth, 
                folder: process.env.NEXT_PUBLIC_IMAGEKIT_UPLOAD_DIR?.toLocaleLowerCase(), fileName, file, customMetadata: {id}})
            return result
        })
        return await Promise.all(uploadPromises)
    } catch (error) {
        throw error
    }
}

export const handleImagikProfileFileUpload = async(userId: string, file: File | Blob, accessToken: string | undefined) => {
    try {
        const imagekitAuth = await imagekitAuthenticator(accessToken)
        const trimId = userId?.substring(userId?.length - 10)
        const fileName = trimId + "_avatar.jpg" 
        const result = await ikCore.upload({
            ...imagekitAuth, 
            folder: process.env.NEXT_PUBLIC_IMAGEKIT_UPLOAD_DIR?.toLocaleLowerCase(), 
            fileName, file, customMetadata: {id: trimId}})
        return result
    } catch (error) {
        throw error
    }
}
