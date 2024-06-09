const admin = require("firebase-admin");
const serviceAccount = require("./path-to-your-service-account-file.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = "test-user";
const additionalClaims = {
  role: "User",
};

admin
  .auth()
  .createCustomToken(uid, additionalClaims)
  .then((customToken) => {
    console.log("Generated custom token:", customToken);
  })
  .catch((error) => {
    console.error("Error creating custom token:", error);
  });
