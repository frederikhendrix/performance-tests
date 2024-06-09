const admin = require("firebase-admin");
const fs = require("fs");

// Read service account credentials from file
const serviceAccount = JSON.parse(
  fs.readFileSync("./service-account-file.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = "test-user";
const additionalClaims = {
  role: process.env.USER_ROLE || "User",
};

admin
  .auth()
  .createCustomToken(uid, additionalClaims)
  .then((customToken) => {
    console.log(`::set-output name=token::${customToken}`);
  })
  .catch((error) => {
    console.error("Error creating custom token:", error);
    process.exit(1);
  });
