import fs from 'fs';

function parseTestCases(block) {
    if (!block) return [];
    const cases = block.trim().split(/\s*Input:/).filter(Boolean);
    return cases.map(c => {
        const parts = c.trim().split(/\s*Output:/);
        return {
            input: parts[0] ? parts[0].trim() : '',
            output: parts[1] ? parts[1].trim() : ''
        };
    });
}

function parseProblem(problemText) {
    const extractLine = (prefix) => {
        const regex = new RegExp(`^${prefix}\\s*(.*)$`, 'm');
        const match = problemText.match(regex);
        return match ? match[1].trim() : '';
    };

    const extractBetween = (start, end) => {
        const regex = new RegExp(`${start}\\s*([\\s\\S]*?)\\s*${end}`, 's');
        const match = problemText.match(regex);
        return match ? match[1].trim() : '';
    };

    const title = extractLine('Title:');
    const difficulty = extractLine('Difficulty:');
    const tags = extractLine('Tags:').split(',').map(t => t.trim()).filter(Boolean);
    const statement = extractBetween('Statement:', 'Input Format:');
    const inputFormat = extractBetween('Input Format:', 'Output Format:');
    const outputFormat = extractBetween('Output Format:', 'Constraints:');
    const constraints = extractBetween('Constraints:', '--- SAMPLES ---');
    const samplesBlock = extractBetween('--- SAMPLES ---', '--- HIDDEN TEST CASES ---');
    const hiddenCasesBlock = problemText.split('--- HIDDEN TEST CASES ---')[1] || '';

    const samples = parseTestCases(samplesBlock.replace(/Sample Input \d+:/g, 'Input:').replace(/Sample Output \d+:/g, 'Output:'));
    const hiddenTestCases = parseTestCases(hiddenCasesBlock);

    return {
        title,
        difficulty,
        tags,
        statement,
        inputFormat,
        outputFormat,
        constraints,
        samples,
        hiddenTestCases,
    };
}

const problemsText = fs.readFileSync('./data/ProblemsWithHTC.txt', 'utf-8');

const problemBlocks = problemsText.split('--- PROBLEM ').slice(1);
const allProblems = problemBlocks.map(parseProblem);

fs.writeFileSync('./data/ProblemsWithHTC.json', JSON.stringify(allProblems, null, 2));

if (allProblems.length > 0 && allProblems[0].title) {
    console.log(`✅ Success! Created and populated ./data/ProblemsWithHTC.json with ${allProblems.length} problems!`);
} else {
    console.error('❌ Parsing failed. The bug is deeper than anticipated.');
}