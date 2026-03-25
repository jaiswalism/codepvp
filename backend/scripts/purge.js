import admin from 'firebase-admin';
import serviceAccount from '../secrets/serviceAccountKey.json' with { type: 'json' };

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const problemsCollection = db.collection('APPSProblemsWithHTC');

async function executePurge() {
  console.log('🧹 Executing final purge of weak questions...');
  
  try {
    const snapshot = await problemsCollection.get();
    
    let batch = db.batch();
    let deleteCount = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const hiddenCount = data.hiddenTestCases ? data.hiddenTestCases.length : 0;

      // If it has less than 5 hidden test cases, mark it for deletion
      if (hiddenCount < 5) {
        batch.delete(doc.ref);
        deleteCount++;
      }

      // Commit in chunks of 400
      if (deleteCount > 0 && deleteCount % 400 === 0) {
        batch.commit();
        console.log(`   -> Purged 400 weak questions...`);
        batch = db.batch(); // Reset batch
      }
    });

    // Commit the remainder
    if (deleteCount % 400 !== 0) {
      await batch.commit();
    }

    console.log(`\n🎉 Purge Complete! Deleted ${deleteCount} questions.`);
    console.log(`CodePVP is now running on a pure, high-quality dataset.`);
    
  } catch (error) {
    console.error('❌ Error during purge:', error);
  }
}

executePurge();