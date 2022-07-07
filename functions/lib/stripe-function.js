"use strict";
const functions = require("firebase-functions");
const stripe = require("stripe")(functions.config().stripe.token);
//const stripe = require('stripe')('testing');
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
const notificationFunction = require("./notification-function");
const timeslotFunction = require("./timeslot-function");
const { firestore } = require("firebase-admin");
exports.purchaseTimeslot = functions.https.onCall(async (request, response) => {
    try {
        let purchasedTimeSlot = await db
            .collection("DoctorTimeslot")
            .doc(request.timeSlotId)
            .get();
        purchasedTimeSlot = purchasedTimeSlot.data();
        const paymentIntent = await stripe.paymentIntents.create({
            amount: purchasedTimeSlot.price * 100,
            currency: "usd",
            payment_method_types: ["card"],
        });
        console.log("user id request : " + request.userId);
        db.collection("Order").add({
            createdAt: firestore.Timestamp.fromDate(new Date()),
            timeSlotId: request.timeSlotId,
            userId: request.userId,
            charged: false,
            stripePaymentId: paymentIntent.id,
            status: "notPay",
        });
        return paymentIntent.client_secret;
    }
    catch (e) {
        throw e;
    }
});
exports.stripeWebhook = functions.https.onRequest(async (request, response) => {
    let event;
    try {
        const stripeWebhookSecret = functions.config().stripe.webhook_secret;
        event = stripe.webhooks.constructEvent(request.rawBody, request.headers["stripe-signature"], stripeWebhookSecret);
    }
    catch (error) {
        console.error("Webhook signature verification failed");
        return response.sendStatus(400);
    }
    // Handle payment successfully event
    switch (event.type) {
        case "payment_intent.succeeded":
            try {
                const amount = request.body.data.object.amount_received / 100;
                const currency = request.body.data.object.currency;
                const linkReceipt = request.body.data.object.charges.data[0].receipt_url;
                //Update Order
                let order = await db
                    .collection("Order")
                    .where("stripePaymentId", "==", request.body.data.object.id)
                    .get()
                    .then(async (querySnapshot) => {
                    let orderData = {};
                    querySnapshot.forEach(function (doc) {
                        console.log(doc.id, " => ", doc.data());
                        doc.ref.update({
                            charged: true,
                            amount: amount,
                            status: "payment_success",
                            linkReceipt: linkReceipt,
                            currency: currency,
                        });
                        orderData = doc.data();
                    });
                    return orderData;
                });
                //Get user info who book this timeslot
                let bookByWho = await db.collection("Users").doc(order.userId).get();
                //Update DoctorTimeslot
                let timeSlotRef = await db
                    .collection("DoctorTimeslot")
                    .doc(order.timeSlotId)
                    .get();
                //Get doctor detail data
                let doctor = await db
                    .collection("Doctors")
                    .doc(timeSlotRef.data().doctorId)
                    .get();
                await timeSlotRef.ref.update({
                    charged: true,
                    available: false,
                    bookByWho: {
                        userId: order.userId,
                        displayName: bookByWho.data().displayName,
                        photoUrl: bookByWho.data().photoUrl
                            ? bookByWho.data().photoUrl
                            : "",
                    },
                    status: "booked",
                    doctor: {
                        doctorName: doctor.data().doctorName,
                        doctorPicture: doctor.data().doctorPicture,
                    },
                    purchaseTime: firestore.Timestamp.fromDate(new Date()),
                });
                //send notification to doctor
                await notificationFunction.orderedTimeslotNotification(doctor.id);
                console.log("payment success");
                break;
            }
            catch (error) {
                console.log("error " + error);
            }
        case "payment_intent.canceled":
            const session = event.data.object;
            // Then define and call a function to handle the event checkout.session.async_payment_succeeded
            console.log("failed payment ");
            break;
        // ... handle other event types
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
    // Return a 200 response to acknowledge receipt of the event
    response.send();
});
exports.refundTimeslot = functions.https.onCall(async (request, response) => {
    try {
        console.log("timeslot id : " + request.timeSlotId);
        let orderSnapshot = await db
            .collection("Order")
            .where("timeSlotId", "==", request.timeSlotId)
            .get();
        let order = orderSnapshot.docs[0];
        console.log("order obejct : " + JSON.stringify(order));
        console.log("stripe payment id : " + order.data().stripePaymentId);
        const refund = await stripe.refunds.create({
            payment_intent: order.data().stripePaymentId,
        });
        console.log("refund object : " + JSON.stringify(refund));
        if (refund.status == "succeeded") {
            let refundData = await db.collection("Refund").add({
                createdAt: firestore.Timestamp.fromDate(new Date()),
                timeSlotId: request.timeSlotId,
                stripePaymentId: order.data().stripePaymentId,
                status: refund.status,
                amount: refund.amount,
                refundId: refund.id,
                currency: refund.currency,
            });
            await timeslotFunction.refundTimeslot(request.timeSlotId, refundData.id);
            console.log("refund success : " + JSON.stringify(refund));
        }
        else {
            throw "refund failed";
        }
    }
    catch (e) {
        throw e;
    }
});
//# sourceMappingURL=stripe-function.js.map