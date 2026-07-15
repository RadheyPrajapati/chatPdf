import "dotenv/config";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

async function run() {
  console.log("Testing gemini-embedding-2 model...");
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-2",
    apiKey: process.env.GOOGLE_API_KEY,
  });
  
  try {
    const res = await embeddings.embedQuery("hello world");
    console.log("SUCCESS! Embedding vector length:", res.length);
    console.log("Sample values:", res.slice(0, 5));
  } catch (err) {
    console.error("FAILED to generate embedding:", err);
  }
}
run();
