import { GoogleGenAI } from '@google/genai';
import { MealAnalysis } from '@/types/fitness';

const ai = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY!,
});

export async function analyzeMealPhoto(imageFile: File): Promise<MealAnalysis> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Analyzing meal photo (attempt ${attempt}/${maxRetries})`);
      
      const config = {
        thinkingConfig: {
          thinkingBudget: 0,
        },
        responseMimeType: 'text/plain',
      };
      
      const model = 'gemini-2.5-flash-lite-preview-06-17';
      
      // Convert file to base64
      const imageBase64 = await fileToBase64(imageFile);
      const mimeType = imageFile.type || 'image/jpeg';
      
      const contents = [
        {
          role: 'user' as const,
          parts: [
            {
              text: `Analyze this meal photo and estimate the calories, protein, carbs, and fat. You MUST respond with ONLY valid JSON, no markdown formatting, no code blocks, no backticks.

Return this exact JSON structure:

{
  "meal_title": "Simple descriptive meal name",
  "food_items": [
    {
      "name": "food item name",
      "estimated_calories": number,
      "confidence": "low" | "medium" | "high"
    }
  ],
  "total_calories": number,
  "total_protein": number,
  "total_carbs": number,
  "total_fat": number,
  "meal_type": "breakfast" | "lunch" | "dinner" | "snack" | "unknown",
  "analysis_notes": "brief note about estimation accuracy"
}

IMPORTANT: 
- Response must be valid JSON only, no markdown
- Do not wrap in code blocks or backticks
- Create a simple meal_title (e.g., "Cheeseburger", "Chicken Salad", "Pasta Bowl")
- Group foods logically - don't break down composite items unnecessarily
- For single items like burgers, pizza slices, sandwiches: treat as one food item
- For plates with distinct separate items: list each main component
- Be conservative with calorie estimates
- Estimate protein, carbs, and fat in grams for the entire meal
- Use "low" confidence for unclear/partial items
- Use "medium" for clearly visible standard portions
- Use "high" for items you can measure well
- Keep analysis_notes under 50 characters
- Focus on building healthy tracking habits`,
            },
            {
              inlineData: {
                data: imageBase64,
                mimeType: mimeType,
              },
            },
          ],
        },
      ];

      const response = await ai.models.generateContentStream({
        model,
        config,
        contents,
      });

      let fullResponse = '';
      for await (const chunk of response) {
        if (chunk.text) {
          fullResponse += chunk.text;
        }
      }

      console.log('Raw Gemini response:', fullResponse);
      
      // Clean and parse JSON response
      const analysis = parseGeminiResponse(fullResponse);
      
      // Validate the response structure
      if (!analysis.meal_title || typeof analysis.meal_title !== 'string' || 
          !analysis.food_items || !Array.isArray(analysis.food_items) || 
          typeof analysis.total_calories !== 'number' || 
          typeof analysis.total_protein !== 'number' ||
          typeof analysis.total_carbs !== 'number' ||
          typeof analysis.total_fat !== 'number') {
        throw new Error('Invalid response structure from Gemini');
      }
      
      console.log('Successfully parsed meal analysis:', analysis);
      return analysis;
      
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.log(`Retrying in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All attempts failed
  console.error('All attempts failed. Last error:', lastError);
  throw new Error(`Failed to analyze meal after ${maxRetries} attempts. Please try again.`);
}

function parseGeminiResponse(response: string): MealAnalysis {
  try {
    // Remove any markdown code block formatting
    let cleanedResponse = response.trim();
    
    // Remove ```json and ``` if present
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '');
    }
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '');
    }
    if (cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/\s*```$/, '');
    }
    
    // Remove any extra whitespace
    cleanedResponse = cleanedResponse.trim();
    
    // Parse the JSON
    const parsed = JSON.parse(cleanedResponse);
    
    return parsed as MealAnalysis;
  } catch (parseError) {
    console.error('JSON parsing failed for response:', response);
    throw new Error('Failed to parse AI response as valid JSON');
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
} 