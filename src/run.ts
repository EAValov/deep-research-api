import * as fs from 'fs/promises';
import * as readline from 'readline';

import { getModel } from './ai/providers';
import { runResearchSession } from './session';

// Helper function for consistent logging
function log(...args: any[]) {
  console.log(...args);
}

// run the agent
async function run() {
  console.log('Using model: ', getModel().modelId);

  // Get initial query
  const initialQuery = await new Promise<string>(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('What would you like to research? ', answer => {
      rl.close();
      resolve(answer);
    });
  });

  // Get breath and depth parameters
  const breadth =
    parseInt(
      await new Promise<string>(resolve => {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });
        rl.question(
          'Enter research breadth (recommended 2-10, default 4): ',
          answer => {
            rl.close();
            resolve(answer);
          },
        );
      }),
      10,
    ) || 4;
  const depth =
    parseInt(
      await new Promise<string>(resolve => {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });
        rl.question(
          'Enter research depth (recommended 1-5, default 2): ',
          answer => {
            rl.close();
            resolve(answer);
          },
        );
      }),
      10,
    ) || 2;
  const isReport =
    (await new Promise<string>(resolve => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question(
        'Do you want to generate a long report or a specific answer? (report/answer, default report): ',
        answer => {
          rl.close();
          resolve(answer);
        },
      );
    })) !== 'answer';

  // Use the new session function
  const result = await runResearchSession({
    query: initialQuery,
    breadth,
    depth,
    interactive: true,
  });

  log(`\n\nLearnings:\n\n${result.learnings.join('\n')}`);
  log(`\n\nVisited URLs (${result.visitedUrls.length}):\n\n${result.visitedUrls.join('\n')}`);
  log('Writing final report...');

  if (isReport) {
    await fs.writeFile('report.md', result.reportMarkdown, 'utf-8');
    console.log(`\n\nFinal Report:\n\n${result.reportMarkdown}`);
    console.log('\nReport has been saved to report.md');
  } else {
    // For answer, we need to generate it separately
    const { writeFinalAnswer } = await import('./deep-research');
    const answer = await writeFinalAnswer({
      prompt: result.query,
      learnings: result.learnings,
    });

    await fs.writeFile('answer.md', answer, 'utf-8');
    console.log(`\n\nFinal Answer:\n\n${answer}`);
    console.log('\nAnswer has been saved to answer.md');
  }
}

run().catch(console.error);