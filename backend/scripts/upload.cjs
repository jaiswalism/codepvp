const admin = require('firebase-admin');

const serviceAccount = require('../serviceAccountKey.json');

const problems = require('../data/ProblemsWithHTC.json');


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
      await problemsCollection.add(problem);
      console.log(`   -> Successfully added: ${problem.title}`);
    } catch (error) {
      console.error(`   -> Error adding ${problem.title}: `, error);
    }
  }
  console.log('🎉 Upload complete!');
}
uploadProblems();