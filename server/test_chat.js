import "dotenv/config";
import { ragChain } from "./utils/rag.js";
import { index } from "./utils/pinecone.js";
import { embeddings } from "./utils/gemini.js";
import { PineconeStore } from "@langchain/pinecone";

async function run() {
  const question = "summarise doc";
  console.log("Querying for question:", question);
  
  try {
    // Let's test the vectorStore retrieval directly first
    const vectorStore = await PineconeStore.fromExistingIndex(
      embeddings,
      {
        pineconeIndex: index,
      }
    );
    const docs = await vectorStore.asRetriever({ k: 4 }).invoke(question);
    console.log("Retrieved documents count:", docs.length);
    docs.forEach((doc, idx) => {
      console.log(`\nDoc ${idx + 1} Snippet (first 150 chars):`);
      console.log(doc.pageContent.substring(0, 150));
    });

    console.log("\nInvoking RAG chain...");
    const answer = await ragChain.invoke(question);
    console.log("\nANSWER RECEIVED:");
    console.log(answer);
  } catch (err) {
    console.error("FAILED to run chat test:", err);
  }
}
run();
