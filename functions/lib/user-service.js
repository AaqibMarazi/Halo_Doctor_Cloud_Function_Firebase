"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.deleteDoctor = exports.getUserByDoctorId = exports.getUserTokenById = void 0;
const collections_1 = require("./collections");
const admin = require("firebase-admin");
async function getUserTokenById(userId) {
    var _a;
    let user = await collections_1.usersCol.doc(userId).get();
    return Promise.resolve((_a = user.data()) === null || _a === void 0 ? void 0 : _a.token);
}
exports.getUserTokenById = getUserTokenById;
async function getUserByDoctorId(doctorId) {
    var userRef = await collections_1.usersCol.where("doctorId", "==", doctorId).get();
    return userRef.docs[0].data();
}
exports.getUserByDoctorId = getUserByDoctorId;
async function deleteUserInDb(userId) {
    try {
        await collections_1.usersCol.doc(userId).delete();
        console.log("success delete user in Db");
    }
    catch (error) {
        console.log("fail delete user in auth");
    }
}
async function deleteUserInAuth(userId) {
    try {
        await admin.auth().deleteUser(userId);
        console.log("success delete user in auth");
    }
    catch (error) {
        console.log("error delete user");
    }
}
async function deleteDoctor(doctorId) {
    try {
        let user = await getUserByDoctorId(doctorId);
        await collections_1.doctorCol.doc(doctorId).delete();
        if (user) {
            await deleteUser(user.uid);
            console.log("success delete user");
        }
        else {
            console.log("User null " + user);
        }
        console.log("success delete doctor");
    }
    catch (error) {
        console.log("🚀 ~ file: user-service.js ~ line 67 ~ deleteDoctor ~ error", error);
        throw error;
    }
}
exports.deleteDoctor = deleteDoctor;
async function deleteUser(userId) {
    try {
        await deleteUserInAuth(userId);
        await deleteUserInDb(userId);
    }
    catch (error) {
        console.log("failed delete user");
        throw error;
    }
}
exports.deleteUser = deleteUser;
//# sourceMappingURL=user-service.js.map