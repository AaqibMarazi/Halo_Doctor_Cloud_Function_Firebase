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

async function refundTimeslot(timeSlotId, refundId) {
  try {
    var timeslotSnapshot = await db
      .collection("DoctorTimeslot")
      .doc(timeSlotId)
      .get();
    if (
      timeslotSnapshot.data().available == false &&
      timeslotSnapshot.data().charged == true
    ) {
      let refundObject = {
        status: "refund",
        refundId: refundId,
      };
      //update Timeslot Status
      await timeslotSnapshot.ref.update(refundObject);
      //update Order collection status
      let orderSnapshot = await db
        .collection("Order")
        .where("timeSlotId", "==", timeSlotId)
        .get();
      let order = orderSnapshot.docs[0];
      order.ref.update(refundObject);

      console.log("update timeslot refund success");
    } else {
      throw "timeslot available, not purchase yet";
    }
  } catch (error) {
    throw error;
  }
}

module.exports.refundTimeslot = refundTimeslot;
