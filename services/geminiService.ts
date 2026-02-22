import { GoogleGenAI, Type } from "@google/genai";
import { CATEGORIES } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
            {"date":"D.M.YYYY","vendor":"name","amount":123.4,"vs":"123","category":"selected_category","currency":"PLN_OR_USD_OR_CZK_OR_EUR","isReinvoice":true_or_false}
            
            Contextual Rules: 
            1. Detect vendor (dodavatel) from the document header/stamp accurately.
            2. Detect currency (CZK, EUR, USD, PLN). 
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
    return {
      EUR: 25.30,
      USD: 23.40,
      PLN: 5.85
    };
  } catch (e) {
    return { EUR: 25.30, USD: 23.40, PLN: 5.85 };
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
    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
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

export const generateSEOContent = async (topic: string, targetUrl?: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Generate a comprehensive SEO content package for the topic: "${topic}". 
      Target URL context: ${targetUrl || 'N/A'}.
      
      You MUST provide the content in 4 languages: Czech (cs), German (de), Polish (pl), and Slovak (sk).
      For each language, include:
      1. SEO Title (max 60 chars)
      2. Meta Description (max 160 chars)
      3. H1 Heading
      4. Main Content (approx 300-500 words, SEO optimized, engaging)
      5. List of 5-8 primary keywords
      6. Suggested internal links (3-4 items with anchor text and placeholder URL)

      Return ONLY valid JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cs: { $ref: "#/definitions/seoContent" },
            de: { $ref: "#/definitions/seoContent" },
            pl: { $ref: "#/definitions/seoContent" },
            sk: { $ref: "#/definitions/seoContent" }
          },
          required: ["cs", "de", "pl", "sk"],
          definitions: {
            seoContent: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                metaDescription: { type: Type.STRING },
                h1: { type: Type.STRING },
                content: { type: Type.STRING },
                keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                suggestedLinks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      url: { type: Type.STRING }
                    },
                    required: ["text", "url"]
                  }
                }
              },
              required: ["title", "metaDescription", "h1", "content", "keywords", "suggestedLinks"]
            }
          }
        }
      }
    });

    const text = response.text?.trim();
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error('Error in generateSEOContent:', error);
    return null;
  }
};

export const generateSEOImage = async (topic: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A high-quality, professional, minimalist editorial style image for a blog post about: "${topic}". 
            The style should be clean, modern, and suitable for a premium e-shop. No text in the image. 
            Vibrant but natural colors. 16:9 aspect ratio.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0 || !candidates[0].content?.parts) return null;

    for (const part of candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error('Error in generateSEOImage:', error);
    return null;
  }
};

export const queryBusinessIntelligence = async (question: string, context: any) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `
        You are an expert Business Intelligence Analyst for an e-commerce company called Provencelia.
        
        Here is the current business context (summarized data):
        ${JSON.stringify(context, null, 2)}
        
        User Question: "${question}"
        
        Instructions:
        1. Analyze the provided data to answer the question accurately.
        2. If the data is insufficient, state what is missing.
        3. Provide insights, trends, and actionable recommendations if possible.
        4. Keep the tone professional, concise, and data-driven.
        5. Format the response with Markdown (bolding key figures, using lists).
        6. If asked about Amazon, explain that Amazon integration is currently in beta and requires manual report upload or API configuration in the Data Manager.
      `,
      config: {
        temperature: 0.2, // Low temperature for factual accuracy
      }
    });

    return response.text;
  } catch (error) {
    console.error('Error querying BI:', error);
    return "I'm sorry, I encountered an error while analyzing your business data. Please try again later.";
  }
};