const admin = require("firebase-admin");
const db = admin.firestore();

async function getUserTokenById(userId) {
  try {
    let user = await db.collection("Users").doc(userId).get();

    let userToken = user.data().token;
    if (!userToken) return "";
    return userToken;
  } catch (error) {
    throw error;
  }
}

async function getUserByDoctorId(doctorId) {
  try {
    let doctor = await db
      .collection("Users")
      .where("doctorId", "==", doctorId)
      .get();
    return doctor.docs[0];
  } catch (error) {
    throw error;
  }
}

module.exports.getUserTokenById = getUserTokenById;
module.exports.getUserByDoctorId = getUserByDoctorId;
