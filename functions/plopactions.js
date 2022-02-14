const admin = require("firebase-admin");

exports.plopActions = async (data) => {
  const serviceAccount = require(data.service_account_path);
  const databaseUrl = data.database_url;
  const email = data.email;
  const password = data.password;

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseUrl,
  });

  console.log("Setting admin account in authentication 🔨");

  const { uid } = await admin.auth().createUser({
    email,
    password,
    emailVerified: true,
  });

  await admin.auth().setCustomUserClaims(uid, {
    isAdmin: true,
  });

  console.log("Created admin account in authentication");

  console.log("Creating admin account in database");

  const user = {
    isAdmin: true,
    name: "Admin",
    createdAt: new Date().toDateString(),
    email,
  };

  await admin.firestore().collection("Users").doc(uid).set(user);
  console.log(`Created admin account in ${database}`);

  let actions = [];
  actions = [
    {
      type: "add",
      path: `./test`,
    },
  ];
  return actions;
};
