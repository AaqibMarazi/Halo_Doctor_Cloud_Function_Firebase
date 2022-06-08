const fs = require("fs");
const admin = require("firebase-admin");

const checkServiceAccountExist = (path) => {
  try {
    if (fs.existsSync(path)) {
      console.log(" (service file exist)");
      return true;
    }
    return false;
  } catch (err) {
    console.error(err);
  }
};

const config = function (plop) {
  plop.setActionType("registerAuth", async function (answers, config, plop) {
    // do something
    console.log("Setting admin account in authentication 🔨");
    const serviceAccount = require(`${__dirname}/${config.data.service_account_path}`);
    const databaseUrl = config.data.database_url;
    const email = config.data.email;
    const password = config.data.password;
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseUrl,
    });

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
    let success = true;
    return new Promise((resolve, reject) => {
      if (success) {
        resolve("Success created account in authentication");
      } else {
        reject("error message");
      }
    });
  });

  plop.setActionType("dataSeed", async function (answers, config, plop) {
    console.log("Add Category");
    let categoryName = "DoctorCategory";
    let rawdata = fs.readFileSync(`${__dirname}/db_seed/DoctorCategory.json`);
    let category = JSON.parse(rawdata);
    return category.forEach(function (obj) {
      admin
        .firestore()
        .collection(categoryName)
        .add(obj)
        .then(function (docRef) {
          console.log(`🚀 Add ${obj.categoryName} Category to Firestore`);
          //resolve(`🚀 Add ${obj.categoryName} Category to Firestore`);
        })
        .catch(function (error) {
          console.error("Error adding document: ", error);
          //reject(error.message);
        });
    });
  });

  plop.setGenerator("Setup Firebase", {
    description: "Setup Project",
    prompts: [
      {
        type: "confirm",
        name: "wantoSetupEmailPass",
        default: true,
        message: "Do you want to setup Admin Email & Password",
      },
      {
        type: "confirm",
        name: "wantoAddDefaultCategory",
        default: true,
        message:
          "Do you want to add default Category in database, you can change it later in Admin Dashboard",
      },
      {
        type: "input",
        name: "service_account_path",
        message:
          "Enter the path to the service account key file: (eg myserviceacount.json) : ",
        when: ({ wantoSetupEmailPass, wantoAddDefaultCategory }) => {
          return wantoSetupEmailPass || wantoAddDefaultCategory;
        },
        validate: (value) => {
          if (!checkServiceAccountExist(value)) {
            return "there is no service account in that path, make sure there is a file name";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "database_url",
        message: "Enter database URL: ",
        when: ({ wantoSetupEmailPass, wantoAddDefaultCategory }) => {
          return wantoSetupEmailPass || wantoAddDefaultCategory;
        },
      },
      {
        type: "input",
        name: "email",
        message:
          "Enter Admin Email: (will be used to login to the Web Admin Dashboard) : ",
        when: ({ wantoSetupEmailPass }) => {
          return wantoSetupEmailPass;
        },
      },
      {
        type: "input",
        name: "password",
        message: "Enter Admin Password : (minimum 6 character)",
        mask: "*",
        when: ({ wantoSetupEmailPass }) => {
          return wantoSetupEmailPass;
        },
        validate: (value) => {
          if (value.length < 6) {
            return "Password must be more than 6 characters";
          }
          return true;
        },
      },
    ],
    actions: (data) => {
      const action = [];
      if (data.wantoSetupEmailPass) {
        action.push({
          type: "registerAuth",
          speed: "slow",
          data: data,
        });
      }
      if (data.wantoAddDefaultCategory) {
        action.push({
          type: "dataSeed",
          speed: "slow",
          data: data,
        });
      }
      return action;
    },
  });
};

module.exports = config;
