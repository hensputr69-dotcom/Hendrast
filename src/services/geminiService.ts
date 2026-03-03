import { GoogleGenAI, Modality } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";

export const generateImage = async (prompt: string, aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1") => {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio,
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

export const editImage = async (base64Image: string, prompt: string, mimeType: string = "image/png") => {
  const ai = new GoogleGenAI({ apiKey });
  const base64Data = base64Image.split(",")[1] || base64Image;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        { text: prompt },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

export const upscaleImage = async (base64Image: string, mimeType: string = "image/png") => {
  const ai = new GoogleGenAI({ apiKey });
  const base64Data = base64Image.split(",")[1] || base64Image;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        { text: "Upscale this image to 4K resolution, enhance details, and remove noise while maintaining original content." },
      ],
    },
    config: {
      imageConfig: {
        imageSize: "4K",
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

export const removeBackground = async (base64Image: string, mimeType: string = "image/png") => {
  return editImage(base64Image, "Remove the background of this image completely and replace it with a clean, solid white background.", mimeType);
};

export const removeWatermark = async (base64Image: string, mimeType: string = "image/png") => {
  return editImage(base64Image, "Identify and remove any watermarks, logos, or text overlays from this image, seamlessly filling in the background.", mimeType);
};

export const enhanceImage = async (base64Image: string, mimeType: string = "image/png") => {
  return editImage(base64Image, "Enhance this image: improve lighting, color balance, sharpness, and overall quality while keeping it natural.", mimeType);
};
