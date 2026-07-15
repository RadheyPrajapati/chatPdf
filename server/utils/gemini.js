import "dotenv/config";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export const llm = new ChatGoogleGenerativeAI({
  model: "gemini-3.5-flash",
  temperature: 0,
  apiKey: process.env.GOOGLE_API_KEY,
});

const baseEmbeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-2",
  apiKey: process.env.GOOGLE_API_KEY,
});

class PaddedEmbeddings {
  constructor(embeddingsInstance, targetDimension = 1024) {
    this.embeddings = embeddingsInstance;
    this.targetDimension = targetDimension;
  }

  async embedDocuments(documents) {
    const vectors = await this.embeddings.embedDocuments(documents);
    return vectors.map(v => this.adjustDimension(v));
  }

  async embedQuery(query) {
    const vector = await this.embeddings.embedQuery(query);
    return this.adjustDimension(vector);
  }

  adjustDimension(vector) {
    if (!vector || vector.length === 0) {
      throw new Error("Generated embedding vector is empty or undefined. Please verify that your GOOGLE_API_KEY is active and has access to the text-embedding-004 model in Google AI Studio.");
    }
    if (vector.length === this.targetDimension) {
      return vector;
    }
    if (vector.length > this.targetDimension) {
      return vector.slice(0, this.targetDimension);
    }
    const padded = [...vector];
    while (padded.length < this.targetDimension) {
      padded.push(0);
    }
    return padded;
  }
}

export const embeddings = new PaddedEmbeddings(baseEmbeddings, 1024);