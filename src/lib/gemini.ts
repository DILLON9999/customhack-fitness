import { GoogleGenAI } from '@google/genai';
import { MealAnalysis } from '@/types/fitness';

export interface FormAnalysis {
  exercise_name: string;
  rep_count: number;
  strengths: string[];
  weaknesses: string[];
  final_verdict: string;
}

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

export async function analyzeWorkoutForm(videoFile: File): Promise<FormAnalysis> {
  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Analyzing workout form (attempt ${attempt}/${maxRetries})`);
      
      const config = {
        thinkingConfig: {
          thinkingBudget: -1,
        },
        responseMimeType: 'application/json',
                  responseSchema: {
            type: 'object',
            properties: {
              exercise_name: { type: 'string' },
              rep_count: { type: 'number' },
              strengths: { 
                type: 'array',
                items: { type: 'string' },
                minItems: 1,
                maxItems: 3
              },
              weaknesses: { 
                type: 'array',
                items: { type: 'string' },
                minItems: 1,
                maxItems: 3
              },
              final_verdict: { type: 'string', maxLength: 100 }
            },
            required: ['exercise_name', 'rep_count', 'strengths', 'weaknesses', 'final_verdict']
          }
      };
      
      const model = 'gemini-2.5-pro';
      
      // Convert file to base64
      const videoBase64 = await fileToBase64(videoFile);
      const mimeType = videoFile.type || 'video/mp4';
      
      const contents = [
        {
          role: 'user' as const,
          parts: [
                         {
               text: `TASK: Analyze this workout video as a professional weightlifting coach.

REQUIREMENTS:
1. Watch the entire video carefully
2. Identify the specific exercise being performed  
3. Count the number of complete repetitions
4. Analyze the form and technique
5. Provide constructive feedback

OUTPUT FORMAT: You MUST respond with ONLY a JSON object. Do not include any descriptions, timestamps, markdown, or other text.

REQUIRED JSON STRUCTURE:
{
  "exercise_name": "exact name of exercise",
  "rep_count": number_of_reps,
  "strengths": ["array of strengths"],
  "weaknesses": ["array of weaknesses"],
  "final_verdict": "brief overall assessment"
}

INSTRUCTIONS:
- Do NOT provide timestamps or video descriptions
- Do NOT use markdown formatting or code blocks
- Provide 1-3 strengths (whatever is appropriate)
- Provide 1-3 weaknesses (whatever is appropriate)
- If form is perfect, strengths can be ["Perfect form!"] and weaknesses can be ["No issues detected"]
- If form has major issues, focus on the most important problems
- Be specific and actionable in feedback
- Include rep count as a number (not text)
- Keep final_verdict under 100 characters

EXAMPLE OUTPUT:
{
  "exercise_name": "Dumbbell Bicep Curls",
  "rep_count": 12,
  "strengths": ["Controlled eccentric movement", "Full range of motion"],
  "weaknesses": ["Using momentum on later reps", "Slight shoulder elevation"],
  "final_verdict": "Good technique overall. Focus on reducing momentum when fatigued."
}`,
             },
            {
              inlineData: {
                data: videoBase64,
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

      console.log('Raw Gemini form analysis response:', fullResponse);
      
      // Clean and parse JSON response
      const analysis = parseFormAnalysisResponse(fullResponse);
      
      // Validate the response structure
      if (!analysis.exercise_name || typeof analysis.exercise_name !== 'string' || 
          !analysis.strengths || !Array.isArray(analysis.strengths) || analysis.strengths.length === 0 ||
          !analysis.weaknesses || !Array.isArray(analysis.weaknesses) || analysis.weaknesses.length === 0 ||
          typeof analysis.rep_count !== 'number' ||
          !analysis.final_verdict || typeof analysis.final_verdict !== 'string') {
        throw new Error('Invalid response structure from Gemini');
      }
      
      console.log('Successfully parsed form analysis:', analysis);
      return analysis;
      
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying
      const delay = Math.pow(2, attempt) * 2000; // 4s, 8s
      console.log(`Retrying in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All attempts failed
  console.error('All attempts failed. Last error:', lastError);
  throw new Error(`Failed to analyze workout form after ${maxRetries} attempts. Please try again.`);
}

function parseFormAnalysisResponse(response: string): FormAnalysis {
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
    
    // Try to find JSON object in the response if it's mixed with other text
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }
    
    // Parse the JSON
    const parsed = JSON.parse(cleanedResponse);
    
    // Check if this is the wrong format (like timestamp-based analysis)
    if (Array.isArray(parsed) || (parsed.start && parsed.end && parsed.label)) {
      console.warn('Received wrong format from Gemini (timestamp-based), providing fallback');
      throw new Error('Wrong response format');
    }
    
    return parsed as FormAnalysis;
  } catch (parseError) {
    console.error('JSON parsing failed for response:', response);
    console.log('Providing fallback response due to parsing failure');
    
    // Provide a fallback response when parsing fails
    return {
      exercise_name: "Unable to identify exercise",
      rep_count: 0,
      strengths: ["Video uploaded successfully", "Exercise movement detected", "Analysis attempted"],
      weaknesses: ["Unable to analyze form details", "Video quality may be insufficient", "AI analysis failed"],
      final_verdict: "The AI was unable to properly analyze this video. Please ensure good lighting, clear view of the exercise, and try uploading again. For best results, record from the side with the full movement visible."
    };
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