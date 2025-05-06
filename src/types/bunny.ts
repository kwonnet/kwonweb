export interface BunnyVideoStream {
    videoLibraryId: number;
    guid: string;
    title: string;
    dateUploaded: string;
    views: number;
    isPublic: boolean;
    length: number;
    status: number;
    framerate: number;
    rotation: number;
    width: number;
    height: number;
    availableResolutions: string;
    outputCodecs: string;
    thumbnailCount: number;
    encodeProgress: number;
    storageSize: number;
    captions: Caption[];
    hasMP4Fallback: boolean;
    collectionId: string;
    thumbnailFileName: string;
    averageWatchTime: number;
    totalWatchTime: number;
    category: string;
    chapters: Chapter[];
    moments: Moment[];
    metaTags: MetaTag[];
    transcodingMessages: TranscodingMessage[];
  }


interface Caption {
  srclang: string;
  label: string;
}

interface Chapter {
  title: string;
  start: number;
  end: number;
}

interface Moment {
  label: string;
  timestamp: number;
}

interface MetaTag {
  property: string;
  value: string;
}

interface TranscodingMessage {
  timeStamp: string;
  level: number;
  issueCode: number;
  message: string;
  value: string;
}