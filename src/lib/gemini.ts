import { GoogleGenAI } from '@google/genai';
import { MealAnalysis } from '@/types/fitness';

const ai = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY!,
});

export async function analyzeMealPhoto(imageFile: File): Promise<MealAnalysis> {
  try {
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
            text: `Analyze this meal photo and estimate the calories and protein. Return ONLY a JSON object with this exact structure:

{
  "food_items": [
    {
      "name": "food item name",
      "estimated_calories": number,
      "confidence": "low" | "medium" | "high"
    }
  ],
  "total_calories": number,
  "total_protein": number,
  "meal_type": "breakfast" | "lunch" | "dinner" | "snack" | "unknown",
  "analysis_notes": "brief note about estimation accuracy"
}

Guidelines:
- Be conservative with calorie estimates
- Estimate protein in grams for the entire meal
- Include all visible food items
- Use "low" confidence for unclear/partial items
- Use "medium" for clearly visible standard portions
- Use "high" for items you can measure well
- Keep analysis_notes under 50 characters
- Focus on building healthy tracking habits

Example response:
{
  "food_items": [
    {"name": "Grilled chicken breast", "estimated_calories": 185, "confidence": "medium"},
    {"name": "Brown rice", "estimated_calories": 110, "confidence": "medium"},
    {"name": "Steamed broccoli", "estimated_calories": 25, "confidence": "high"}
  ],
  "total_calories": 320,
  "total_protein": 28,
  "meal_type": "lunch",
  "analysis_notes": "Standard portions, good visibility"
}`,
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

    console.log(fullResponse)
    
    // Parse JSON response
    try {
      const analysis = JSON.parse(fullResponse) as MealAnalysis;
      
      // Validate the response structure
      if (!analysis.food_items || !Array.isArray(analysis.food_items) || typeof analysis.total_calories !== 'number' || typeof analysis.total_protein !== 'number') {
        throw new Error('Invalid response structure');
      }
      
      return analysis;
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', fullResponse);
      throw new Error('Failed to analyze meal - please try again');
    }
    
  } catch (error) {
    console.error('Error analyzing meal photo:', error);
    throw new Error('Failed to analyze meal photo. Please try again.');
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