import cors from 'cors';
import express, { Request, Response } from 'express';

import { runResearchSession } from './session';

const app = express();
const port = process.env.PORT || 3051;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function for consistent logging
function log(...args: any[]) {
  console.log(...args);
}

// API endpoint to run research
app.post('/api/research', async (req: Request, res: Response) => {
  try {
    const { query, depth = 3, breadth = 3 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Use the new session function
    const result = await runResearchSession({
      query,
      breadth,
      depth,
      interactive: false,
    });

    // Return the results
    return res.json({
      success: true,
      answer: result.summary, // Using summary as the answer for now
      learnings: result.learnings,
      visitedUrls: result.visitedUrls,
    });
  } catch (error: unknown) {
    console.error('Error in research API:', error);
    return res.status(500).json({
      error: 'An error occurred during research',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// generate report API
app.post('/api/generate-report',async(req:Request,res:Response)=>{
  try{
    const {query,depth = 3,breadth=3 } = req.body;
    if(!query){
      return res.status(400).json({error:'Query is required'});
    }
    
    // Use the new session function
    const result = await runResearchSession({
      query,
      breadth,
      depth,
      interactive: false,
    });

    return res.json({
      success: true,
      report: result.reportMarkdown,
      learnings: result.learnings,
      visitedUrls: result.visitedUrls,
    });
    
  }catch(error:unknown){
    console.error("Error in generate report API:",error)
    return res.status(500).json({
      error:'An error occurred during research',
      message:error instanceof Error? error.message: String(error),
    })
  }
})



// Start the server
app.listen(port, () => {
  console.log(`Deep Research API running on port ${port}`);
});

export default app;