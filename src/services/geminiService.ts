import { GoogleGenAI, Type } from "@google/genai";
import { CATEGORIES } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const extractInvoiceDataFromSingleFile = async (fileName: string, fileId: string, base64Data: string) => {
  try {
    if (!base64Data || base64Data.length < 100) {
      console.warn(`Base64 data for ${fileName} seems too short.`);
      return null;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Data
            }
          },
          {
            text: `Analyze the attached PDF document and extract billing data. 
            STRICT RULE: The document content ALWAYS takes precedence over the filename (${fileName}). 
            If the filename says 'Vendor A' but the header of the PDF says 'Vendor B', you MUST return 'Vendor B'.

            Return ONLY valid JSON in this schema:
            {"date":"D.M.YYYY","vendor":"name","amount":123.4,"vs":"123","category":"selected_category","currency":"PLN_OR_USD_OR_CZK_OR_EUR_OR_HUF","isReinvoice":true_or_false}
            
            Contextual Rules: 
            1. Detect vendor (dodavatel) from the document header/stamp accurately.
            2. Detect currency (CZK, EUR, USD, PLN, HUF). 
            3. Choose category ONLY from [${CATEGORIES.join(", ")}]. 
            4. For 'vs' (variabilní symbol), look for 'Variabilní symbol', 'Invoice number' or 'Symbol'.
            5. Set 'isReinvoice' to true if you see words like 'přefakturace', 'reinvoice', 'refakturace' or if the document structure clearly suggests it is a pass-through expense.
            6. FORMAT DATE: Use Czech format without leading zeros, e.g., '1.1.2024' not '01.01.2024'.`
          }
        ]
      },
      config: {
        systemInstruction: "You are a professional accountant and OCR specialist. Your task is to extract structured data from invoice PDFs with 100% accuracy. You ignore metadata and filenames if they contradict the visual information in the document.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            vendor: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            vs: { type: Type.STRING },
            category: { type: Type.STRING },
            currency: { type: Type.STRING },
            isReinvoice: { type: Type.BOOLEAN }
          },
          required: ["date", "vendor", "amount", "vs", "category", "currency", "isReinvoice"]
        }
      }
    });

    const text = response.text?.trim();
    if (!text) return null;
    
    const data = JSON.parse(text);
    return {
      ...data,
      driveId: fileId,
      fileName: fileName
    };
  } catch (error) {
    console.error(`Error extracting data for ${fileName}:`, error);
    return null;
  }
};

export const getCnbRates = async () => {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/CZK');
    if (!response.ok) throw new Error("Failed to fetch");
    const data = await response.json();
    const rates = data.rates;
    
    return {
      EUR: 1 / (rates['EUR'] || 0.0395),
      USD: 1 / (rates['USD'] || 0.0427),
      PLN: 1 / (rates['PLN'] || 0.1709),
      HUF: 1 / (rates['HUF'] || 15.625)
    };
  } catch (e) {
    // Fallback to approximate rates without logging an error to the console
    return { EUR: 25.30, USD: 23.40, PLN: 5.85, HUF: 0.064 };
  }
};

export const interpretScript = async (script: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this script: ${script}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            purpose: { type: Type.STRING },
            summary: { type: Type.STRING },
            uiSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["purpose", "summary", "uiSuggestions"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) { return null; }
};

export const runScriptLogic = async (script: string, data: any[]) => {
  return data;
};

export const chatWithScript = async (script: string, message: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Script Context: ${script}\nUser Question: ${message}`,
  });
  return response.text;
};