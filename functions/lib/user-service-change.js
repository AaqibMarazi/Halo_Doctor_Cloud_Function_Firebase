"use strict";
const admin = require("firebase-admin");
const db = admin.firestore();
async function getUserTokenById(userId) {
    try {
        let user = await db.collection("Users").doc(userId).get();
        let userToken = user.data().token;
        if (!userToken)
            return "";
        return userToken;
    }
    catch (error) {
        throw error;
    }
}
async function getUserByDoctorId(doctorId) {
    try {
        let doctor = await db
            .collection("Users")
            .where("doctorId", "==", doctorId)
            .get();
        console.log("🚀 ~ file: user-service.js ~ line 22 ~ getUserByDoctorId ~ user by doctor id", doctor);
        return doctor.docs[0];
    }
    catch (error) {
        throw error;
    }
}
async function deleteUserInDb(userId) {
    try {
        await db.collection("Users").doc(userId).delete();
        console.log("success delete user in Db");
    }
    catch (error) {
        console.log("fail delete user id Db");
        throw error;
    }
}
async function deleteUserInAuth(userId) {
    try {
        admin.auth().deleteUser(userId);
        console.log("success delete user in auth");
    }
    catch (error) {
        console.log("fail delete user in auth");
        throw error;
    }
}
async function deleteDoctor(doctorId) {
    try {
        let user = await getUserByDoctorId(doctorId);
        console.log("🚀 ~ file: user-service.js ~ line 50 ~ deleteDoctor ~ user", user);
        await db.collection("Doctors").doc(doctorId).delete();
        console.log("🚀 ~ file: user-service.js ~ line 50 ~ deleteDoctor ~ user", user);
        if (user) {
            await deleteUser(user.id);
            console.log("success delete user");
        }
        else {
            console.log("User null " + user);
        }
        console.log("success delete doctor");
    }
    catch (error) {
        console.log("🚀 ~ file: user-service.js ~ line 67 ~ deleteDoctor ~ error", error);
        console.log("success delete doctor");
        throw error;
    }
}
async function deleteUser(userId) {
    try {
        await deleteUserInAuth(userId);
        await deleteUserInDb(userId);
    }
    catch (error) {
        console.log("fail delete user");
        throw error;
    }
}
module.exports.getUserTokenById = getUserTokenById;
module.exports.getUserByDoctorId = getUserByDoctorId;
module.exports.deleteDoctor = deleteDoctor;
module.exports.deleteUser = deleteUser;
//# sourceMappingURL=user-service-change.js.map