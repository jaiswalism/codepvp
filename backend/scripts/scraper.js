import * as cheerio from 'cheerio';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// --- Configuration ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outputPath = join(__dirname, '..', 'data', 'problems.json');
const API_URL_ALL_PROBLEMS = 'https://leetcode.com/api/problems/all/';
const GRAPHQL_URL = 'https://leetcode.com/graphql';

// --- Helper: A delay to prevent getting blocked ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- GraphQL Query ---
// Added topicTags to the query
const GQL_QUERY = `
query questionDetail($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    content
    difficulty
    categoryTitle
    topicTags {
      name
      slug
    }
    codeSnippets {
      langSlug
      code
    }
    exampleTestcaseList
    metaData
  }
}`;

// --- Main Scraping Function ---
async function fetchFromApi() {
    console.log('🚀 Starting LeetCode API Fetcher...');

    console.log('Fetching problem list...');
    const allProblemsResponse = await fetch(API_URL_ALL_PROBLEMS);
    const allProblemsData = await allProblemsResponse.json();
    
    const problemsToFetch = allProblemsData.stat_status_pairs
        .filter(p => !p.paid_only)
        .map(p => ({
            slug: p.stat.question__title_slug,
            title: p.stat.question__title,
        }));

    console.log(`Found ${problemsToFetch.length} free problems. Starting fetch...`);
    
    let allProblems = [];
    if (existsSync(outputPath)) {
        try {
            allProblems = JSON.parse(readFileSync(outputPath, 'utf8'));
            if (!Array.isArray(allProblems)) allProblems = [];
        } catch { allProblems = []; }
    }

    // Use a standard for loop to track progress
    for (let i = 0; i < problemsToFetch.length; i++) {
        const problem = problemsToFetch[i];
        const progress = `[${i + 1}/${problemsToFetch.length}]`;

        if (allProblems.some(p => p.slug === problem.slug)) {
            console.log(`${progress} 🟡 Skipping "${problem.title}" (already exists)`);
            continue;
        }

        console.log(`${progress} Fetching "${problem.title}"...`);

        try {
            const gqlResponse = await fetch(GRAPHQL_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: GQL_QUERY,
                    variables: { titleSlug: problem.slug },
                    operationName: 'questionDetail'
                })
            });

            const gqlData = await gqlResponse.json();
            const questionData = gqlData.data.question;

            if (!questionData) throw new Error('No question data returned from API.');

            const htmlStmt = questionData.content?.trim() || 'Statement not found.';
            const codeSnippets = questionData.codeSnippets || [];
            const exampleTestcases = questionData.exampleTestcaseList || [];
            
            const starterCodeObject = codeSnippets.reduce((acc, snippet) => {
                acc[snippet.langSlug] = snippet.code;
                return acc;
            }, {});

            if (Object.keys(starterCodeObject).length === 0) {
                throw new Error('Failed to extract any starter code snippets.');
            }

            const $content = cheerio.load(htmlStmt);
            const cleanStmt = $content('body').text().trim();

            const constraints = [];
            $content('p:has(strong:contains("Constraints:"))').next('ul').find('li').each((_, li) => {
                constraints.push($content(li).text().trim());
            });

            const testcases = [];
            $content('strong.example').each((index, el) => {
                const preText = $content(el).parent().next('pre').text();
                const lines = preText.split('\n');
                const inputLine = lines.find(line => line.startsWith('Input:'));
                const outputLine = lines.find(line => line.startsWith('Output:'));
                const displayInput = inputLine ? inputLine.replace('Input:', '').trim() : '';
                const displayOutput = outputLine ? outputLine.replace('Output:', '').trim() : '';
                const expectedOutput = displayOutput.replace(/\[|\]/g, '').replace(/,/g, ' ');

                testcases.push({
                    display: { input: displayInput, output: displayOutput },
                    expected_output: expectedOutput,
                    hidden: false,
                    stdin: exampleTestcases[index] || ''
                });
            });

            // Extract just the names of the topic tags
            const topicTags = questionData.topicTags.map(tag => tag.name);

            const newProblem = {
                title: problem.title,
                slug: problem.slug,
                difficulty: questionData.difficulty,
                category: questionData.categoryTitle,
                tags: topicTags, // Added topic tags
                stmt: cleanStmt,
                constraints: constraints.length > 0 ? constraints : ["No constraints found."],
                starter_code: starterCodeObject,
                testcases: testcases.length > 0 ? testcases : []
            };

            allProblems.push(newProblem);
            writeFileSync(outputPath, JSON.stringify(allProblems, null, 2));
            console.log(`✅ Successfully fetched and saved "${problem.title}"!`);

            await sleep(1000);

        } catch (error) {
            console.error(`❌ Failed to fetch "${problem.title}":`, error.message);
        }
    }

    console.log('✅ Fetching complete!');
}

fetchFromApi();
