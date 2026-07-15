import { PineconeStore } from "@langchain/pinecone";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";

import { embeddings, llm } from "./gemini.js";
import { index, pineconeState } from "./pinecone.js";

const prompt = ChatPromptTemplate.fromTemplate(`
Answer the user's question directly, factually, and objectively based ONLY on the provided context.

Follow these strict guidelines:
- DO NOT include any greetings, pleasantries, or introductory fluff (e.g., do not say "Hello", "I would be happy to help", "Here is the summary").
- DO NOT include any concluding remarks or closing offers (e.g., do not say "Let me know if you need more help").
- Start answering the question directly from the very first sentence.
- Use bullet points, bold text, and lists where appropriate to make the facts easy to read.
- If the answer is not in the context, state: "The requested information is not available in the uploaded document."

Context:
{context}

Question:
{input}
`);

// Helper to format documents into a single text block
const formatDocuments = (docs) => {
  return docs.map((doc) => doc.pageContent).join("\n\n");
};

// Dynamic context retriever that fetches documents from the currently active namespace
const retrieveContext = async (query) => {
  const vectorStore = await PineconeStore.fromExistingIndex(
    embeddings,
    {
      pineconeIndex: index,
      namespace: pineconeState.activeNamespace,
    }
  );
  const retriever = vectorStore.asRetriever({ k: 4 });
  const docs = await retriever.invoke(query);
  return formatDocuments(docs);
};

// LCEL Chain: Retrieves context dynamically from the active namespace, pipes to prompt, llm, and parses string output
export const ragChain = RunnableSequence.from([
  {
    context: retrieveContext,
    input: new RunnablePassthrough(),
  },
  prompt,
  llm,
  new StringOutputParser(),
]);