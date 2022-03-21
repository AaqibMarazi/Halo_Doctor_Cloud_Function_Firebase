const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();
const { firestore } = require("firebase-admin");

exports.timeslotAdded = functions.firestore
  .document("/DoctorTimeslot/{doctorTimeslotId}")
  .onCreate((snapshot, context) => {
    //snapshot.ref.update({ balance: 0 });
    const newValue = snapshot.data();
    if (newValue.repeat === "weekly on the same day and time") {
      console.log("weekly on the same day and time");
    }
    return Promise.resolve();
  });
