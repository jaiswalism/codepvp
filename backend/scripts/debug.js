import admin from 'firebase-admin';

import serviceAccount from '../secrets/serviceAccountKey.json' with { type: 'json' };
import debugProblems from '../data/debugproblem.json' with { type: 'json' };

function slugify(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 🔥 CHANGE: new collection
const problemsCollection = db.collection('DebugProblems');

async function uploadDebugProblems() {
  console.log('🛠️ Starting DebugProblems upload...');

  if (!debugProblems || debugProblems.length === 0) {
    console.error('❌ Error: DebugProblems file is empty or missing.');
    return;
  }

  for (const problem of debugProblems) {
    try {
      const documentId = slugify(problem.title);

      if (!documentId) {
        console.warn(`   -> Skipped problem with no title.`);
        continue;
      }

      // ✅ Optional validation (VERY useful)
      if (!problem.buggyTemplateByLanguage?.cpp) {
        console.warn(`   -> Skipped ${problem.title} (missing C++ template)`);
        continue;
      }

      await problemsCollection.doc(documentId).set({
        ...problem,
        mode: "debug", // 🔥 helpful for filtering later
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`   -> Added: ${problem.title} (ID: ${documentId})`);

    } catch (error) {
      console.error(`   -> Error adding ${problem.title}:`, error);
    }
  }

  console.log('🎉 DebugProblems upload complete!');
}

uploadDebugProblems();