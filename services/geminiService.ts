import { GoogleGenAI } from "@google/genai";
import { InvoiceData } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

// Helper to convert File to base64 for Gemini
const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Content = base64String.split(',')[1];
      resolve(base64Content);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const readFileAsText = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

export const analyzeInvoice = async (invoiceFile: File, priceBookFile: File | null): Promise<InvoiceData> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Prepare the prompt content
  let promptText = "Please analyze this invoice image and extract the data according to the system instructions.";

  if (priceBookFile) {
    try {
      const priceBookContent = await readFileAsText(priceBookFile);
      // Limit pricebook content length to avoid context window issues.
      // Gemini 2.5 Flash has a large context window, but keeping it efficient is good.
      const truncatedPriceBook = priceBookContent.substring(0, 200000); 
      promptText += `\n\nHERE IS THE PRICE BOOK DATA (CSV format):\n${truncatedPriceBook}\n\nUse this to look up item details.`;
    } catch (e) {
      console.warn("Failed to read price book file", e);
      promptText += "\n\n(Note: A price book file was provided but could not be read.)";
    }
  }

  const imageBase64 = await fileToGenerativePart(invoiceFile);
  
  // Determine mime type (simple check)
  const mimeType = invoiceFile.type === 'application/pdf' ? 'application/pdf' : invoiceFile.type;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Switched to 2.5 Flash for much faster processing (10-30s)
      contents: [
        {
          role: 'user',
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: mimeType,
                data: imageBase64
              }
            }
          ]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        temperature: 0.1, // Low temperature for factual extraction
      }
    });

    const responseText = response.text;
    if (!responseText) {
        throw new Error("Received empty response from AI");
    }

    const parsedData = JSON.parse(responseText) as InvoiceData;
    
    // Basic validation
    if (!parsedData.line_items || !Array.isArray(parsedData.line_items)) {
        throw new Error("Invalid JSON structure received from AI");
    }

    return parsedData;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "An error occurred while analyzing the invoice.");
  }
};