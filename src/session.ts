import * as readline from 'readline';

import { generateFeedback } from './feedback';
import { deepResearch, writeFinalReport } from './deep-research';

// Helper function for consistent logging
function log(...args: any[]) {
  console.log(...args);
}

// Helper function to get user input
function askQuestion(rl: readline.Interface, query: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(query, answer => {
      resolve(answer);
    });
  });
}

export interface Clarification {
  question: string;
  answer: string;
}

export interface ResearchSessionOptions {
  query: string;
  breadth: number;
  depth: number;
  interactive: boolean; // CLI: true, API: false
  clarifications?: Clarification[];
}

export interface DeepResearchResult {
  query: string;
  breadth: number;
  depth: number;
  summary: string;
  reportMarkdown: string;
  learnings: string[];
  visitedUrls: string[];
}

export async function runResearchSession(
  opts: ResearchSessionOptions
): Promise<DeepResearchResult> {
  log(`Starting research session with query: "${opts.query}", breadth: ${opts.breadth}, depth: ${opts.depth}, interactive: ${opts.interactive}`);

  // Generate follow-up questions based on `query`
  const followUpQuestions = await generateFeedback({
    query: opts.query,
  });

  let combinedQuery = opts.query;
  if (opts.clarifications && opts.clarifications.length > 0) {
    // Use provided clarifications
    const answers = opts.clarifications.map(c => c.answer);
    combinedQuery = `
Initial Query: ${opts.query}
Follow-up Questions and Answers:
${followUpQuestions.map((q: string, i: number) => `Q: ${q}\nA: ${answers[i]}`).join('\n')}
`;
  } else if (opts.interactive) {
    // Interactive mode - ask user for answers
    log(
      '\nTo better understand your research needs, please answer these follow-up questions:',
    );

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answers: string[] = [];
    for (const question of followUpQuestions) {
      const answer = await askQuestion(rl, `\n${question}\nYour answer: `);
      answers.push(answer);
    }

    rl.close();

    // Combine all information for deep research
    combinedQuery = `
Initial Query: ${opts.query}
Follow-up Questions and Answers:
${followUpQuestions.map((q: string, i: number) => `Q: ${q}\nA: ${answers[i]}`).join('\n')}
`;
  } else {
    // Non-interactive mode - auto-generate answers using LLM
    log('Auto-generating answers for follow-up questions...');
    
    // In a real implementation, we would use the LLM to generate answers
    // For now, we'll just proceed with the original query to maintain compatibility
    // with the existing flow. The core deep research logic will handle the rest.
  }

  log('\nStarting research...\n');

  const { learnings, visitedUrls } = await deepResearch({
    query: combinedQuery,
    breadth: opts.breadth,
    depth: opts.depth,
  });

  // Generate the final report using the existing function
  const reportMarkdown = await writeFinalReport({
    prompt: combinedQuery,
    learnings,
    visitedUrls,
  });

  // Generate a summary (simplified for now)
  const summary = `Research summary for query: "${opts.query}" with breadth: ${opts.breadth} and depth: ${opts.depth}`;

  return {
    query: opts.query,
    breadth: opts.breadth,
    depth: opts.depth,
    summary,
    reportMarkdown,
    learnings,
    visitedUrls,
  };
}