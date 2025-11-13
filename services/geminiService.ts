
import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  // This is a safeguard, but the environment is expected to provide the key.
  console.error("API_KEY environment variable not set. The application will not function.");
}

// Initialize the Google AI client.
const ai = new GoogleGenAI({ apiKey: API_KEY! });

/**
 * Sends an image and a prompt to the Gemini API to get an edited image.
 * @param base64ImageData The base64 encoded string of the image (without data URI prefix).
 * @param mimeType The MIME type of the image (e.g., 'image/jpeg').
 * @param prompt The user's text prompt for editing the image.
 * @returns A promise that resolves to the full data URI of the generated image.
 */
export const editImageWithPrompt = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const newMimeType = part.inlineData.mimeType;
        const newBase64Data = part.inlineData.data;
        return `data:${newMimeType};base64,${newBase64Data}`;
      }
    }
    // If no image is returned, throw an error.
    throw new Error("No image data was found in the API response.");

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Re-throw a more user-friendly error.
    throw new Error("Failed to generate the image due to an API error. Please check the console and try again.");
  }
};
