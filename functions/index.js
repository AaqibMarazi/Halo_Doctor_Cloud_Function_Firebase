const functions = require("firebase-functions");
const stripeFunction = require("./stripe-function");
const agoraFunction = require("./agora-functions");
const notificationFunction = require("./notification-function");
const doctorFunction = require("./doctor-functions");
const userFunction = require("./user-functions");
const admin = require("firebase-admin");
const db = admin.firestore();
const { firestore } = require("firebase-admin");

exports.doctorAdded = functions.firestore
  .document("/Doctors/{doctorId}")
  .onCreate((snapshot, context) => {
    snapshot.ref.update({ balance: 0 });
    return Promise.resolve();
  });

//Doctor request money withdrawal
exports.withdrawRequest = functions.firestore
  .document("/WithdrawRequest/{withdrawRequestId}")
  .onCreate(async (snapshot, context) => {
    let userId = snapshot.data().userId;
    console.log("user Id : " + userId);
    console.log("snapshot data : " + JSON.stringify(snapshot.data()));
    let doctorId = await db
      .collection("Users")
      .doc(userId)
      .get()
      .then((doc) => {
        return doc.data().doctorId;
      });
    console.log("doctor id : " + doctorId);
    //decrease doctor balance amount
    await db
      .collection("Doctors")
      .doc(doctorId)
      .get()
      .then((querySnapshot) => {
        let doctorBalance = querySnapshot.data().balance;
        console.log("balance : " + doctorBalance);
        let balanceNow = (doctorBalance -= snapshot.data().amount);
        querySnapshot.ref.update({ balance: balanceNow });
        console.log("balance now : " + balanceNow);
      });
    //add transaction
    await db.collection("Transaction").add({
      userId: userId,
      withdrawMethod: snapshot.data().withdrawMethod,
      amount: snapshot.data().amount,
      status: "pending",
      type: "withdraw",
      createdAt: firestore.Timestamp.fromDate(new Date()),
    });
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
        .doc(timeSlot.data().doctorId)
        .get()
        .then((querySnapshot) => {
          let doctorBalance = querySnapshot.data().balance;
          let balanceNow = (doctorBalance += previousValue.amount);
          querySnapshot.ref.update({ balance: balanceNow });
          console.log("balance now : " + balanceNow);
        });

      //get user id by doctor
      let userId = await db
        .collection("Users")
        .where("doctorId", "==", timeSlot.data().doctorId)
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
exports.generateToken = agoraFunction.generateToken;
exports.stripeWebhook = stripeFunction.stripeWebhook;
exports.notificationTest = notificationFunction.notificationTest;
exports.notificationStartAppointment =
  notificationFunction.notificationStartAppointment;
exports.deleteDoctor = doctorFunction.deleteDoctor;
exports.deleteUser = userFunction.deleteUser;
