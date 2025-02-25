import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyC2Rb7z7HTqOjmPWCN7ZmyVW3HQ1TOtPqQ");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as Blob | null;
    const prompt = formData.get("prompt") as string;
    const historyStr = formData.get("history") as string | null;

    if (!file || !prompt) {
      return NextResponse.json(
        { error: "Image and prompt are required" },
        { status: 400 }
      );
    }

    // Convert the image file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    // Prepare the image part for Gemini
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: file.type,
      },
    };

    // Combine chat history with the new prompt if available
    let combinedPrompt = prompt;
    if (historyStr) {
      try {
        const history = JSON.parse(historyStr) as { role: string; content: string }[];
        const historyText = history
          .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
          .join("\n");
        combinedPrompt = `${historyText}\nUser: ${prompt}`;
      } catch (e) {
        console.error("Invalid history JSON, ignoring:", e);
      }
    }

    // Call the Gemini model with the combined prompt and image
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent([combinedPrompt, imagePart]);
    let responseText = result.response.text().trim();

    // Attempt to extract a JSON block from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("No valid JSON found in AI response, returning raw text.");
      // Fallback: return the raw text so the UI can display it
      return NextResponse.json({ response: responseText });
    }

    let structuredData;
    try {
      structuredData = JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error("Failed to parse AI response JSON:", jsonMatch[0]);
      return NextResponse.json(
        { error: "JSON parsing error", response: responseText },
        { status: 500 }
      );
    }

    return NextResponse.json({ response: structuredData });
  } catch (error) {
    console.error("Error processing chat analysis:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('imageUrl'); // Get the image URL from the query parameter
    const prompt = searchParams.get('prompt'); // Get the prompt from the query parameter

    // Return the prompt and image URL as a JSON response
    return NextResponse.json({ prompt, imageUrl });
}
