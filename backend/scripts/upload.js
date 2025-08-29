import admin from 'firebase-admin';

import serviceAccount from '../serviceAccountKey.json' with { type: 'json' };

import problems from '../data/ProblemsWithHTC.json' with { type: 'json' };

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
const problemsCollection = db.collection('ProblemsWithHTC');

async function uploadProblems() {
  console.log('✅ Starting upload...');
  if (!problems || problems.length === 0) {
    console.error('❌ Error: Problems file is empty or could not be read.');
    return;
  }
  
  for (const problem of problems) {
    try {
      const documentId = slugify(problem.title);
      
      if (!documentId) {
        console.warn(`   -> Skipped a problem with no title.`);
        continue; 
      }

      await problemsCollection.doc(documentId).set(problem);

      console.log(`   -> Successfully added: ${problem.title} (ID: ${documentId})`);
    } catch (error) {
      console.error(`   -> Error adding ${problem.title}: `, error);
    }
  }
  console.log('🎉 Upload complete!');
}

uploadProblems();