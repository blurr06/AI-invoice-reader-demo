import { GoogleGenAI, Type, Schema } from "@google/genai";
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

// Define the exact schema for the model response
// Optimized: Removed row_index (calculated on client) to save tokens
const invoiceSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    invoice_header: {
      type: Type.OBJECT,
      properties: {
        vendor_name: { type: Type.STRING, nullable: true },
        invoice_number: { type: Type.STRING, nullable: true },
        invoice_date: { type: Type.STRING, nullable: true },
        delivery_date: { type: Type.STRING, nullable: true },
        invoice_total: { type: Type.NUMBER, nullable: true },
        page_count: { type: Type.INTEGER, nullable: true },
      },
    },
    line_items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          // row_index removed to save output tokens
          qty: { type: Type.NUMBER, nullable: true },
          item_code: { type: Type.STRING, nullable: true },
          scan_code: { type: Type.STRING, nullable: true },
          item_description: { type: Type.STRING, nullable: true },
          department: { type: Type.STRING, nullable: true },
          price_group: { type: Type.STRING, nullable: true },
          product_category: { type: Type.STRING, nullable: true },
          units: { type: Type.NUMBER, nullable: true },
          case_cost: { type: Type.NUMBER, nullable: true },
          case_discount: { type: Type.NUMBER, nullable: true },
          cost_per_unit_after_discount: { type: Type.NUMBER, nullable: true },
          extended_case_cost: { type: Type.NUMBER, nullable: true },
          unit_retail: { type: Type.NUMBER, nullable: true },
          extended_unit_retail: { type: Type.NUMBER, nullable: true },
          size: { type: Type.STRING, nullable: true },
          default_margin_percent: { type: Type.NUMBER, nullable: true },
          calculated_margin_percent: { type: Type.NUMBER, nullable: true },
          confidence: { type: Type.NUMBER, nullable: true },
          notes: { type: Type.STRING, nullable: true },
        },
      },
    },
  },
};

export const analyzeInvoice = async (invoiceFile: File, priceBookFile: File | null): Promise<InvoiceData> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Prepare the prompt content
  let promptText = "Analyze this invoice image. Extract data into the specified JSON structure.";

  if (priceBookFile) {
    try {
      const priceBookContent = await readFileAsText(priceBookFile);
      // Drastically reduced context to 15,000 chars (approx 3.5k tokens) to improve latency
      // This provides enough context for fuzzy matching without overwhelming the model's attention mechanism
      const truncatedPriceBook = priceBookContent.substring(0, 15000); 
      promptText += `\n\nPRICE BOOK REFERENCE (Top 15k chars):\n${truncatedPriceBook}\n\nINSTRUCTION: Use the Price Book to find matching item codes/descriptions where the invoice is unclear.`;
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
      model: 'gemini-2.5-flash',
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
        responseSchema: invoiceSchema,
        temperature: 0,
        // Explicitly disable thinking budget to prioritize speed for this extraction task
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const responseText = response.text;
    if (!responseText) {
        throw new Error("Received empty response from AI");
    }

    const parsedRaw = JSON.parse(responseText);
    
    // Post-process to ensure type safety and add client-side fields like row_index
    const processedData: InvoiceData = {
        invoice_header: parsedRaw.invoice_header || {},
        line_items: Array.isArray(parsedRaw.line_items) 
            ? parsedRaw.line_items.map((item: any, index: number) => ({
                ...item,
                row_index: index + 1 // Add row_index back since we removed it from schema
              }))
            : []
    };

    return processedData;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "An error occurred while analyzing the invoice.");
  }
};