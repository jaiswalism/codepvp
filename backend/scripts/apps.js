import admin from 'firebase-admin';
import fs from 'fs';
import readline from 'readline';
import serviceAccount from '../secrets/serviceAccountKey.json' with { type: 'json' };

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const problemsCollection = db.collection('APPSProblemsWithHTC');

function slugify(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

function generateTitle(row) {
  if (row.url && row.url.includes("codeforces.com/problemset/problem/")) {
    const parts = row.url.split("/");
    const contest = parts[parts.length - 2];
    const letter = parts[parts.length - 1];
    return `Codeforces ${contest} ${letter}`;
  }
  const firstSentence = row.question.split('.')[0].substring(0, 40).replace(/\n/g, " ").trim();
  return firstSentence || `Problem ${row.id}`;
}

function transformToSchema(row) {
  let inputs = [];
  let outputs = [];
  
  try {
    const ioData = JSON.parse(row.input_output);
    inputs = ioData.inputs || [];
    outputs = ioData.outputs || [];
  } catch (error) {
    console.warn(`   -> Warning: Could not parse I/O for Problem ID ${row.id}`);
  }

  const samples = [];
  const hiddenTestCases = [];

  for (let i = 0; i < inputs.length; i++) {
    const inputStr = String(inputs[i]).trim();
    const outputStr = String(outputs[i]).trim();
    
    // DEFENSE: Skip massively bloated test cases to prevent 10MB batch timeouts
    if (inputStr.length > 10000 || outputStr.length > 10000) {
      continue; 
    }

    const testCase = { input: inputStr, output: outputStr };
    
    if (samples.length < 2) { // Ensure we get exactly 2 samples if available
      samples.push(testCase);
    } else {
      hiddenTestCases.push(testCase);
    }
  }

  let statement = row.question;
  let inputFormat = "- Please refer to the problem statement.";
  let outputFormat = "- Please refer to the problem statement.";

  if (row.question.includes("-----Input-----")) {
    const parts = row.question.split("-----Input-----");
    statement = parts[0].trim();
    
    const remaining = parts[1];
    if (remaining.includes("-----Output-----")) {
      const ioParts = remaining.split("-----Output-----");
      inputFormat = ioParts[0].trim();
      
      const outRemaining = ioParts[1];
      if (outRemaining.includes("-----Examples-----")) {
        outputFormat = outRemaining.split("-----Examples-----")[0].trim();
      } else if (outRemaining.includes("-----Note-----")) {
         outputFormat = outRemaining.split("-----Note-----")[0].trim();
      } else {
        outputFormat = outRemaining.trim();
      }
    }
  }

  let targetDifficulty = "Medium";
  if (row.difficulty === "introductory") targetDifficulty = "Easy";
  if (row.difficulty === "interview") targetDifficulty = "Medium";
  if (row.difficulty === "competition") targetDifficulty = "Hard";

  return {
    title: generateTitle(row),
    statement: statement,
    constraints: "- Please refer to the problem statement.", 
    inputFormat: inputFormat,
    outputFormat: outputFormat,
    difficulty: targetDifficulty,
    samples: samples,
    hiddenTestCases: hiddenTestCases.slice(0, 40), // Capped at 40 to be extremely safe
    tags: ["Algorithms", "APPS Dataset"]
  };
}

async function uploadDataset() {
  console.log('✅ Starting Timeout-Proof APPS Dataset Batch Upload...');
  
  const fileStream = fs.createReadStream('../data/test.jsonl'); // Make sure this points to your file
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let batch = db.batch();
  let batchCount = 0;
  let totalProcessed = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;

    let rawProblem, formattedProblem;
    
    try {
      rawProblem = JSON.parse(line);
      formattedProblem = transformToSchema(rawProblem);
    } catch (parseError) {
      continue; 
    }

    const documentId = slugify(formattedProblem.title) || `apps-problem-${rawProblem.id}`;
    const docRef = problemsCollection.doc(documentId);
    
    try {
      batch.set(docRef, formattedProblem);
      batchCount++;
      totalProcessed++;
    } catch (setError) {
      console.warn(`⚠️ Could not queue ${documentId}:`, setError.message);
    }

    // DEFENSE: Batch commit every 50 problems instead of 400
    if (batchCount >= 50) {
      try {
        await batch.commit();
        console.log(`   -> Committed batch of 50. Total uploaded: ${totalProcessed}`);
      } catch (commitError) {
        console.error(`❌ Batch commit failed at ${totalProcessed}. Error:`, commitError.message);
      } finally {
        batch = db.batch(); 
        batchCount = 0;
      }
    }
  }

  if (batchCount > 0) {
    try {
      await batch.commit();
      console.log(`   -> Committed final batch. Total uploaded: ${totalProcessed}`);
    } catch (e) {
      console.error("Final batch failed:", e.message);
    }
  }

  console.log('🎉 APPS Upload Complete! Your database is now populated.');
}

uploadDataset();