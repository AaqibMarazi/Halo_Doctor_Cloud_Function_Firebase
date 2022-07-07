"use strict";
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();
const { firestore } = require("firebase-admin");
const notificationFunction = require("./notification-function");
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
        if (timeslotSnapshot.data().available == false &&
            timeslotSnapshot.data().charged == true) {
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
        }
        else {
            throw "timeslot available, not purchase yet";
        }
    }
    catch (error) {
        throw error;
    }
}
exports.rescheduleTimeslot = functions.https.onCall(async (request, response) => {
    var timeSlotNow = await db
        .collection("DoctorTimeslot")
        .doc(request.timeSlotIdNow)
        .get();
    var timeSlotChanged = await db
        .collection("DoctorTimeslot")
        .doc(request.timeslotChanged)
        .get();
    console.log("timeslot now data : " + JSON.stringify(timeSlotNow.data()));
    if (timeSlotNow.data().status == "complete") {
        throw new functions.https.HttpsError("unknown", "The appointment has been marked as complete, and cannot be rescheduled");
    }
    if (timeSlotNow.data().status == "refund") {
        throw new functions.https.HttpsError("unknown", "The appointment has been refunded, and cannot be rescheduled");
    }
    if (timeSlotChanged.data().available == false) {
        throw new functions.https.HttpsError("unknown", "The selected timeslot is no longer available");
    }
    if (timeSlotNow.data().pastTimeSlot) {
        throw new functions.https.HttpsError("unknown", "The appointment has been rescheduled once, and cannot be rescheduled again");
    }
    //Update Timeslot
    await timeSlotNow.ref.update({
        timeSlot: timeSlotChanged.data().timeSlot,
        price: timeSlotChanged.data().price,
        duration: timeSlotChanged.data().duration,
        pastTimeSlot: timeSlotNow.data().timeSlot,
        pastDuration: timeSlotNow.data().duration,
        pastPrice: timeSlotNow.data().price,
    });
    await timeSlotChanged.ref.update({
        available: false,
        timseSlotChanged: true,
        timeSlotChangedTo: timeSlotNow.id,
    });
    var timeSlotNow2 = await db
        .collection("DoctorTimeslot")
        .doc(request.timeSlotIdNow)
        .get();
    var timeSlotChanged2 = await db
        .collection("DoctorTimeslot")
        .doc(request.timeSlotIdNow)
        .get();
    console.log("successfully reschedule appointment");
    console.log("timeslot now data after change : " + JSON.stringify(timeSlotNow2.data()));
    console.log("timeslot changed data after change : " +
        JSON.stringify(timeSlotChanged2.data()));
    await notificationFunction.rescheduleTimeslotNotification(timeSlotNow.data().doctorId);
});
module.exports.refundTimeslot = refundTimeslot;
//# sourceMappingURL=timeslot-function.js.map