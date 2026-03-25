import admin from 'firebase-admin';
import serviceAccount from '../secrets/serviceAccountKey.json' with { type: 'json' };

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const problemsCollection = db.collection('APPSProblemsWithHTC');

async function cleanDatabase() {
  console.log('🔍 Scanning database for corrupted or empty questions...');
  
  try {
    const snapshot = await problemsCollection.get();
    
    let batch = db.batch();
    let deleteCount = 0;
    let totalScanned = 0;

    snapshot.forEach((doc) => {
      totalScanned++;
      const data = doc.data();
      
      // Identify the outliers
      const missingHidden = !data.hiddenTestCases || data.hiddenTestCases.length === 0;
      const missingSamples = !data.samples || data.samples.length === 0;
      const missingStatement = !data.statement || data.statement.trim() === "";

      if (missingHidden || missingSamples || missingStatement) {
        batch.delete(doc.ref);
        deleteCount++;
        console.log(` 🗑️ Deleting outlier: ${doc.id} (Missing required I/O data)`);
      }

      // Commit in chunks of 400 to respect Firestore limits
      if (deleteCount > 0 && deleteCount % 400 === 0) {
        batch.commit();
        console.log(`   -> Purged a batch of 400 dead questions...`);
        batch = db.batch(); // Reset batch
      }
    });

    // Commit any remaining deletions
    if (deleteCount % 400 !== 0) {
      await batch.commit();
    }

    console.log(`\n📊 Cleanup Report:`);
    console.log(`- Total Questions Scanned: ${totalScanned}`);
    console.log(`- Outliers Deleted: ${deleteCount}`);
    console.log(`- Healthy Questions Remaining: ${totalScanned - deleteCount}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanDatabase();