import admin from 'firebase-admin';
import serviceAccount from '../secrets/serviceAccountKey.json' with { type: 'json' };

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const problemsCollection = db.collection('APPSProblemsWithHTC');

async function auditDatabase() {
  console.log('🔍 Auditing database for questions with weak hidden test cases...');
  
  try {
    const snapshot = await problemsCollection.get();
    
    let totalScanned = 0;
    let weakQuestionsCount = 0;

    snapshot.forEach((doc) => {
      totalScanned++;
      const data = doc.data();
      
      // Safely count the hidden test cases
      const hiddenCount = data.hiddenTestCases ? data.hiddenTestCases.length : 0;

      // Flag questions with fewer than 5 hidden test cases
      if (hiddenCount < 5) {
        weakQuestionsCount++;
      }
    });

    console.log(`\n📊 Test Case Audit Report:`);
    console.log(`- Total Questions Scanned: ${totalScanned}`);
    console.log(`- Questions with < 5 Hidden Test Cases (Weak): ${weakQuestionsCount}`);
    console.log(`- Ready for CodePVP (>= 5 Hidden Test Cases): ${totalScanned - weakQuestionsCount}`);
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
  }
}

auditDatabase();