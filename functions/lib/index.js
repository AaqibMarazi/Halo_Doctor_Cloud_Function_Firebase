"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const stripeFunction = require("./stripe-function");
const agoraFunction = require("./agora-functions");
const notificationFunction = require("./notification-function");
const doctorFunction = require("./doctor-functions");
const timeSlotFunction = require("./timeslot-function");
const withdrawFunction = require("./withdraw-functions");
const user_functions_1 = require("./user-functions");
const admin = require("firebase-admin");
const constants_1 = require("./constants");
const payment_api_1 = require("./payment-api");
const requery_api_1 = require("./requery-api");
const request_refund_api_1 = require("./request-refund-api");
const db = admin.firestore();
const { firestore } = require("firebase-admin");
exports.doctorAdded = functions.firestore
    .document("/Doctors/{doctorId}")
    .onCreate((snapshot, context) => {
    snapshot.ref.update({
        balance: 0,
        accountStatus: constants_1.DefaultDoctorAccountStatus,
        doctorBasePrice: constants_1.DoctorDefaultBasePrice,
    });
    return Promise.resolve();
});
exports.userAdded = functions.firestore
    .document("/Users/{doctorId}")
    .onCreate((snapshot, context) => {
    if (snapshot.data().role == "doctor") {
        snapshot.ref.update({ doctorId: snapshot.id });
    }
    return Promise.resolve();
});
// user confirm consultation complete, give money to doctor & create transaction
exports.confirmConsultation = functions.firestore
    .document("/Order/{orderId}")
    .onUpdate(async (change, context) => {
    var _a, _b;
    const newValue = change.after.data();
    const previousValue = change.before.data();
    if (newValue.status == "success" &&
        previousValue.status == "payment_success") {
        //get doctor timeslot
        let timeSlot = await db
            .collection("DoctorTimeslot")
            .doc(previousValue.timeSlotId)
            .get();
        //increase doctor balance by order ammount
        await db
            .collection("Doctors")
            .doc((_a = timeSlot.data()) === null || _a === void 0 ? void 0 : _a.doctorId)
            .get()
            .then((querySnapshot) => {
            var _a;
            let doctorBalance = (_a = querySnapshot.data()) === null || _a === void 0 ? void 0 : _a.balance;
            let balanceNow = (doctorBalance += previousValue.amount);
            querySnapshot.ref.update({ balance: balanceNow });
            console.log("balance now : " + balanceNow);
        });
        //get user id by doctor
        let userId = await db
            .collection("Users")
            .where("doctorId", "==", (_b = timeSlot.data()) === null || _b === void 0 ? void 0 : _b.doctorId)
            .get()
            .then(async (querySnapshot) => {
            let doctorId = {};
            querySnapshot.forEach(function (doc) {
                doctorId = doc.id;
            });
            return doctorId;
        });
        //Create Transaction for doctor, that user already comfirm their consultation
        await db.collection("Transaction").add({
            userId: userId,
            amount: previousValue.amount,
            status: "complete",
            type: "payment",
            timeSlot: previousValue.timeSlotId,
            createdAt: firestore.Timestamp.fromDate(new Date()),
        });
    }
});
exports.purchaseTimeslot = stripeFunction.purchaseTimeslot;
exports.refundTimeslot = stripeFunction.refundTimeslot;
exports.generateToken = agoraFunction.generateToken;
exports.stripeWebhook = stripeFunction.stripeWebhook;
exports.notificationStartAppointment =
    notificationFunction.notificationStartAppointment;
exports.deleteDoctor = doctorFunction.deleteDoctor;
exports.deleteUser = user_functions_1.deleteUserPermanently;
exports.rescheduleTimeslot = timeSlotFunction.rescheduleTimeslot;
exports.withdrawRequiest = withdrawFunction.withdrawRequest;
exports.paymentApiCall = payment_api_1.paymentApiCall;
exports.requeryApiCall = requery_api_1.requeryApiCall;
exports.requestRefundApiCall = request_refund_api_1.requestRefundApiCall;
//# sourceMappingURL=index.js.map