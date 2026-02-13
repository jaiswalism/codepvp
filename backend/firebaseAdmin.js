import admin from "firebase-admin";
import fs from "fs";
import "dotenv/config";

let serviceAccount;

if (!admin.apps.length) {

  if (process.env.K_SERVICE) {
    serviceAccount = JSON.parse(
      fs.readFileSync("/secrets/serviceAccountKey", "utf8")
    );
  } else {
    serviceAccount = JSON.parse(
      fs.readFileSync("./secrets/serviceAccountKey.json", "utf8")
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

export { admin, db };
