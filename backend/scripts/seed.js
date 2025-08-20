import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// --- Configuration ---
// This makes the script runnable from any directory.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename); // This is the /backend/scripts directory

// Resolve paths by going up one level from /scripts to the /backend root
const serviceAccountPath = join(__dirname, '..', 'serviceAccountKey.json');
const problemsPath = join(__dirname, '..', 'data', 'problems.json');

// --- Initialize Firebase Admin SDK ---
// Make sure you have your serviceAccountKey.json in the 'backend' folder.
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const problemsCollection = db.collection('problems');

// --- Main Upload Function ---
const uploadProblems = async () => {
  // 1. Load the data created by your scraper
  const problems = JSON.parse(readFileSync(problemsPath, 'utf8'));

  if (!problems || problems.length === 0) {
    console.log("No problems to upload. Run the scraper first to create problems.json.");
    return;
  }

  console.log(`🚀 Starting upload of ${problems.length} problems to Firestore...`);

  // 2. Loop through each problem and upload it
  for (const problem of problems) {
    try {
      // Use the URL-friendly slug as the unique document ID
      const docId = problem.slug;

      if (!docId) {
        console.warn(`🟡 Skipping question with invalid slug: ${problem.title}`);
        continue;
      }
      
      // Use .set() to create (or overwrite) the document in Firestore
      await problemsCollection.doc(docId).set(problem);
      console.log(`✅ Successfully uploaded: ${problem.title}`);

    } catch (error) {
      console.error(`❌ Error uploading ${problem.title}:`, error);
    }
  }

  console.log("🎉 All problems have been processed!");
};

// --- Run the script ---
uploadProblems();
