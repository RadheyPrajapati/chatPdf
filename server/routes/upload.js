import express from "express";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PineconeStore } from "@langchain/pinecone";

import upload from "../middleware/upload.js";
import { embeddings } from "../utils/gemini.js";
import { index, pineconeState } from "../utils/pinecone.js";

const router = express.Router();


router.post("/", upload.single("pdf"), async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        message: "PDF file required"
      });
    }

    // 0. Clear previous active namespace to free up space (asynchronous, non-blocking)
    const oldNamespace = pineconeState.activeNamespace;
    if (oldNamespace && oldNamespace !== "default") {
      index.namespace(oldNamespace).deleteMany({ deleteAll: true })
        .then(() => console.log(`[Upload] Wiped old namespace: ${oldNamespace}`))
        .catch(err => console.warn(`[Upload] Non-blocking warning clearing old namespace:`, err.message));
    }

    // Generate a fresh unique namespace for this new PDF upload
    pineconeState.activeNamespace = "pdf_" + Date.now();
    console.log(`[Upload] Created new active namespace: ${pineconeState.activeNamespace}`);

    // 1. Load PDF from memory buffer
    const blob = new Blob([req.file.buffer]);
    const loader = new PDFLoader(blob);

    const docs = await loader.load();


    // 2. Split text into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });


    const chunks = await splitter.splitDocuments(docs);

    if (chunks.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No text content could be extracted from this PDF. Please try a different PDF."
      });
    }

    // 3. Store embeddings in Pinecone in the new namespace
    await PineconeStore.fromDocuments(
      chunks,
      embeddings,
      {
        pineconeIndex: index,
        namespace: pineconeState.activeNamespace,
      }
    );

    res.status(200).json({
      success: true,
      message: "PDF processed successfully"
    });

  } catch (error) {
    console.error("PDF Upload Error:", error);
    res.status(500).json({
      success: false,
      message: "PDF processing failed: " + (error.message || error)
    });
  }
});


export default router;