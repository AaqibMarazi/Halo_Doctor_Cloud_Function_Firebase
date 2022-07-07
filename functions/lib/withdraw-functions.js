"use strict";
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();
const { firestore } = require("firebase-admin");
//Doctor request money withdrawal
exports.withdrawRequest = functions.firestore
    .document("/WithdrawRequest/{withdrawRequestId}")
    .onCreate(async (snapshot, context) => {
    let userId = snapshot.data().userId;
    console.log("user Id : " + userId);
    console.log("snapshot data : " + JSON.stringify(snapshot.data()));
    let withdrawSettings = await db
        .collection("Settings")
        .doc("withdrawSetting")
        .get();
    let doctorId = await db
        .collection("Users")
        .doc(userId)
        .get()
        .then((doc) => {
        return doc.data().doctorId;
    });
    console.log("doctor id : " + doctorId);
    //decrease doctor balance amount
    let doctor = await db.collection("Doctors").doc(doctorId).get();
    let doctorBalance = doctor.data().balance;
    console.log("balance : " + doctorBalance);
    if (doctorBalance <= 0) {
        snapshot.ref.delete();
        return Promise.reject();
    }
    let adminFee = (doctorBalance / 100) * withdrawSettings.data().percentage;
    let taxCut = (doctorBalance / 100) * withdrawSettings.data().tax;
    let totalAmount = doctorBalance - (adminFee + taxCut);
    await snapshot.ref.update({
        amount: doctorBalance,
        adminFee: adminFee.toFixed(2),
        tax: taxCut.toFixed(2),
        totalWithdraw: totalAmount.toFixed(2),
        status: "pending",
        createdAt: firestore.Timestamp.fromDate(new Date()),
    });
    //let balanceNow = (doctorBalance -= snapshot.data().amount);
    await doctor.ref.update({ balance: 0 });
    //add transaction
    await db.collection("Transaction").add({
        userId: userId,
        withdrawMethod: snapshot.data().withdrawMethod,
        amount: doctorBalance,
        status: "pending",
        type: "withdraw",
        createdAt: firestore.Timestamp.fromDate(new Date()),
        withdrawRequestId: snapshot.id,
    });
    return Promise.resolve();
});
//# sourceMappingURL=withdraw-functions.js.map