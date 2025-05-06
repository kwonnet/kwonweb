import { bunnyVideoLibraryId, bunnyWebhookApiKey } from "@/config/bunny";
// import VideoModel, { VideoStatus } from "@/models/VideoModel";
import { NextResponse, NextRequest } from "next/server";

type BunnyWebhookRes = {
  VideoLibraryId: number;
  VideoGuid: string;
  Status: number;
};
export const POST = async (req: NextRequest) => {
  try {
    const searchParams = req.nextUrl.searchParams
    const apiKey = searchParams.get("key"); // Replace "key" with your query parameter name
    if (!apiKey || apiKey !== bunnyWebhookApiKey) {
      return NextResponse.json(
        { message: "Authentication failed" },
        { status: 401 }
      );
    }
    // Parse the incoming request body
    const body = (await req.json()) as BunnyWebhookRes;
    console.log("Bunny webhook payload", body);
    console.log("Checking video library");
    if ( body.VideoLibraryId !== parseInt(bunnyVideoLibraryId ?? "")
    ) {
      return NextResponse.json(
        { message: "Invalid video library" },
        { status: 401 }
      );
    }
    // Perform some logic (e.g., save data to the database, call an external API, etc.)
    // const obj = body.Status === 3 ? { status: VideoStatus.PUBLIC, isReady: true } : {};
    if(body.Status === 3){
      // await VideoModel.updateOne(
      //   { videoId: body.VideoGuid },
      //   { status: VideoStatus.PUBLIC, isReady: true }
      // );
      console.log("Updated db successfully");
    }
    // Example response
    return NextResponse.json(
      { message: "Data received successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error handling POST request:", error?.message);
    // Return an error response
    return NextResponse.json(
      { error: "An error occurred while processing the request" },
      { status: 500 }
    );
  }
};
