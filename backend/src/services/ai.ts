import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

// Call Gemini API
export async function callGemini(prompt: string): Promise<string | null> {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch (error: any) {
    console.error("Gemini API error:", error.response?.data || error.message);
    return null;
  }
}

// Categorize email using AI
export async function categorizeEmail(email: any): Promise<string | null> {
  const prompt = `Classify this email:
Subject: ${email.subject}
Body: ${email.body}
Return one label: Interested, Meeting Booked, Not Interested, Spam, or Out of Office.`;
  return await callGemini(prompt);
}

// Notify if Interested
export async function maybeNotifyInterested(email: any, category: string | null) {
  if (category === "Interested") {
    console.log(`🔔 Email "${email.subject}" is Interested!`);
    // You can call your webhook here, e.g.:
    // await axios.post(process.env.INTERESTED_WEBHOOK_URL, { email });
  }
}
