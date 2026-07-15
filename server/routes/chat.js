import express from "express";
import { ragChain } from "../utils/rag.js";

const router = express.Router();


router.post("/", async (req, res) => {

  try {

    const { question } = req.body;


    if (!question) {
      return res.status(400).json({
        success:false,
        message:"Question is required"
      });
    }


    const answer = await ragChain.invoke(question);

    res.status(200).json({
      success: true,
      answer: answer
    });


  } catch(error){

    console.error(error);

    res.status(500).json({

      success:false,

      message:"Chat failed"

    });

  }

});


export default router;