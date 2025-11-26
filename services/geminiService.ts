import { GoogleGenAI, Type } from "@google/genai";
import { ResumeData, Skill } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const parseResumeData = async (input: string, inputType: 'text' | 'pdf'): Promise<Partial<ResumeData>> => {
  try {
    const schemaStructure = {
        personalInfo: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            linkedin: { type: Type.STRING },
            location: { type: Type.STRING },
            summary: { type: Type.STRING },
            website: { type: Type.STRING },
          }
        },
        experience: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              company: { type: Type.STRING },
              role: { type: Type.STRING },
              startDate: { type: Type.STRING },
              endDate: { type: Type.STRING },
              current: { type: Type.BOOLEAN },
              description: { type: Type.STRING },
            }
          }
        },
        education: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              school: { type: Type.STRING },
              degree: { type: Type.STRING },
              startDate: { type: Type.STRING },
              endDate: { type: Type.STRING },
              current: { type: Type.BOOLEAN },
            }
          }
        },
        skills: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              level: { type: Type.STRING, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
              category: { type: Type.STRING, enum: ['Technical', 'Soft Skills', 'Languages', 'Tools', 'Other'] }
            }
          }
        }
    };

    let response;

    if (inputType === 'pdf') {
        // PDF Input using Inline Data
        const prompt = `
          You are an expert Resume Parser. 
          Extract structured data from the provided PDF resume.
          If a field is missing, leave it as an empty string or empty array.
          Infer 'current' boolean from dates (e.g. 'Present').
          Format dates as 'YYYY-MM' if possible.
          Categorize skills into groups like 'Technical', 'Soft Skills', 'Languages', 'Tools', or 'Other'.
        `;

        response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'application/pdf', data: input } }, // input is base64 string
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: schemaStructure
                }
            }
        });

    } else {
        // Standard Text Parsing with JSON Schema
        const prompt = `
          You are an expert Resume Parser. 
          Extract structured data from the following text.
          If a field is missing, leave it as an empty string or empty array.
          Infer 'current' boolean from dates (e.g. 'Present').
          Format dates as 'YYYY-MM' if possible, otherwise keep original string.
          
          Categorize skills into groups like 'Technical', 'Soft Skills', 'Languages', 'Tools', or 'Other'.
          
          Input Text:
          ${input}
        `;

        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: schemaStructure
            }
          }
        });
    }

    let jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    
    // Clean up markdown if present (handling cases where model returns ```json ... ``` despite instructions)
    jsonText = jsonText.replace(/```json\n?|```/g, '').trim();

    return JSON.parse(jsonText) as Partial<ResumeData>;

  } catch (error) {
    console.error("Gemini Parse Error:", error);
    throw error;
  }
};

export const improveContent = async (
  text: string, 
  type: 'summary' | 'experience',
  options: { tone?: string, industry?: string } = {}
): Promise<string> => {
    try {
        const tone = options.tone || 'Professional';
        const industryContext = options.industry ? ` tailored for the ${options.industry} industry` : '';
        
        let instruction = "";
        if (type === 'summary') {
            instruction = `Rewrite this resume summary to be ${tone}${industryContext}. Make it impactful and concise (under 50 words).`;
        } else {
            instruction = `Rewrite this job description to use strong action verbs, be ${tone}${industryContext}, and improve clarity. Quantify achievements where possible. Use bullet points (•) for separate items if multiple points exist.`;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${instruction}\n\nOriginal Text:\n${text}`
        });

        return response.text || text;
    } catch (error) {
        console.error("Gemini Improve Error:", error);
        return text;
    }
};

export const suggestSkills = async (jobTitle: string): Promise<Skill[]> => {
    try {
        const prompt = `
            List the top 10 most in-demand skills for a "${jobTitle}" role in the current job market.
            Include a mix of Technical skills, Soft Skills, and popular Tools.
            Return a valid JSON object with a "skills" array.
            
            JSON Structure:
            {
                "skills": [
                    { "name": "Skill Name", "category": "Technical", "level": "Intermediate" }
                ]
            }
            
            Categories must be one of: 'Technical', 'Soft Skills', 'Languages', 'Tools', 'Other'.
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        skills: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    category: { type: Type.STRING, enum: ['Technical', 'Soft Skills', 'Languages', 'Tools', 'Other'] },
                                    level: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });
        
        const jsonText = response.text?.replace(/```json\n?|```/g, '').trim();
        if (!jsonText) return [];
        
        const result = JSON.parse(jsonText);
        return result.skills || [];
    } catch (error) {
        console.error("Gemini Skill Suggestion Error:", error);
        return [];
    }
};