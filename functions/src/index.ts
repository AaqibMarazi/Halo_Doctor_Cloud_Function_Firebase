import * as functions from "firebase-functions";
const stripeFunction = require("./stripe-function");
const agoraFunction = require("./agora-functions");
const notificationFunction = require("./notification-function");
const doctorFunction = require("./doctor-functions");
const timeSlotFunction = require("./timeslot-function");
const withdrawFunction = require("./withdraw-functions");
import { deleteUserPermanently } from "./user-functions";
import * as admin from "firebase-admin";
import {
  DoctorDefaultBasePrice,
  DefaultDoctorAccountStatus,
} from "./constants";
import { paymentApiCall } from "./payment-api";
import { requeryApiCall } from "./requery-api";
import { requestRefundApiCall } from "./request-refund-api";
const db = admin.firestore();
const { firestore } = require("firebase-admin");

exports.doctorAdded = functions.firestore
  .document("/Doctors/{doctorId}")
  .onCreate((snapshot, context) => {
    snapshot.ref.update({
      balance: 0,
      accountStatus: DefaultDoctorAccountStatus,
      doctorBasePrice: DoctorDefaultBasePrice,
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
    const newValue = change.after.data();
    const previousValue = change.before.data();

    if (
      newValue.status == "success" &&
      previousValue.status == "payment_success"
    ) {
      //get doctor timeslot
      let timeSlot = await db
        .collection("DoctorTimeslot")
        .doc(previousValue.timeSlotId)
        .get();

      //increase doctor balance by order ammount
      await db
        .collection("Doctors")
        .doc(timeSlot.data()?.doctorId)
        .get()
        .then((querySnapshot) => {
          let doctorBalance = querySnapshot.data()?.balance;
          let balanceNow = (doctorBalance += previousValue.amount);
          querySnapshot.ref.update({ balance: balanceNow });
          console.log("balance now : " + balanceNow);
        });

      //get user id by doctor
      let userId = await db
        .collection("Users")
        .where("doctorId", "==", timeSlot.data()?.doctorId)
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
exports.deleteUser = deleteUserPermanently;
exports.rescheduleTimeslot = timeSlotFunction.rescheduleTimeslot;
exports.withdrawRequiest = withdrawFunction.withdrawRequest;
exports.paymentApiCall = paymentApiCall;
exports.requeryApiCall = requeryApiCall;
exports.requestRefundApiCall = requestRefundApiCall;
