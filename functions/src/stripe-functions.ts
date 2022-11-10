import * as functions from "firebase-functions";
import Stripe from "stripe";
import {
  doctorCol,
  orderCol,
  OrderStatus,
  timeSlotCol,
  usersCol,
} from "./collections";
import { CURRENCY } from "./constants";
import { firestore } from "firebase-admin";
import { PaymentMethod, PaymentStatus } from "./payment-functions";
import { orderedTimeslotNotification } from "./notification-function";
import { refundCol } from "./collections";
import { refundTimeslot } from "./timeslot-function";
const stripe = new Stripe(functions.config().stripe.token, {
  apiVersion: "2020-08-27",
});
exports.purchaseTimeslot = functions.https.onCall(async (request, response) => {
  try {
    const choosedTimeSlot = (
      await timeSlotCol.doc(request.timeSlotId).get()
    ).data();
    if (!choosedTimeSlot) {
      throw "choosed timeslot is not found";
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: choosedTimeSlot.price * 100,
      currency: CURRENCY,
      payment_method_types: ["card"],
    });

    await orderCol.add({
      createdAt: firestore.Timestamp.fromDate(new Date()),
      timeSlotId: request.timeSlotId,
      userId: request.userId,
      charged: false,
      stripePaymentId: paymentIntent.id,
      status: OrderStatus.notPay,
      paymentMethod: PaymentMethod.Stripe,
    });
    return paymentIntent.client_secret;
  } catch (error) {
    throw error;
  }
});

exports.stripeWebhook = functions.https.onRequest(async (request, response) => {
  let event;
  try {
    const stripeWebhookSecret = functions.config().stripe.webhook_secret;
    event = stripe.webhooks.constructEvent(
      request.rawBody,
      request.headers["stripe-signature"]!,
      stripeWebhookSecret
    );
  } catch (error) {
    console.error("Webhook signature verification failed");
    response.sendStatus(400);
    return;
  }

  switch (event.type) {
    case "payment_intent.succeeded":
      try {
        const amount = request.body.data.object.amount_received / 100;
        const currency = request.body.data.object.currency;
        const linkReceipt =
          request.body.data.object.charges.data[0].receipt_url;

        let order = await orderCol
          .where("stripePaymentId", "==", request.body.data.object.id)
          .get();

        let orderRef = order.docs[0];

        orderRef.ref.update({
          charged: true,
          amount: amount,
          status: PaymentStatus.PaymentSuccess,
          linkReceipt: linkReceipt,
          currency: currency,
        });

        //Get user info who book this timeslot
        let bookByWho = (
          await usersCol.doc(orderRef.data().userId).get()
        ).data();

        const timeSlot = await timeSlotCol
          .doc(orderRef.data().timeSlotId)
          .get();
        const timeSlotData = timeSlot.data();
        if (!timeSlotData) {
          throw "selected timeslot is null or undefined";
        }
        const doctor = await doctorCol.doc(timeSlotData.doctorId).get();
        timeSlot.ref.update({
          charged: true,
          available: false,
          bookByWho: {
            userId: orderRef.data().userId,
            displayName: bookByWho?.displayName,
            photoUrl: bookByWho?.photoUrl ? bookByWho?.photoUrl : "",
          },
          status: "booked",
          doctor: {
            doctorName: doctor.data()?.doctorName,
            doctorPicture: doctor.data()?.doctorPicture,
          },
          purchaseTime: firestore.Timestamp.fromDate(new Date()),
        });
        await orderedTimeslotNotification(doctor.id);
        console.log("payment success");
        break;
      } catch (error) {
        console.log("error " + error);
      }
    case "payment_intent.canceled":
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
    const { timeSlotId } = request;
    const orderRef = await orderCol
      .where("timeSlotId", "==", request.timeSlotId)
      .get();
    const order = orderRef.docs[0];
    const refund = await stripe.refunds.create({
      payment_intent: order.data().stripePaymentId,
    });
    if (refund.status === "succeeded") {
      let refundData = await refundCol.add({
        createdAt: firestore.Timestamp.fromDate(new Date()),
        timeSlotId: request.timeSlotId,
        paymentId: order.data().stripePaymentId,
        status: refund.status,
        amount: refund.amount,
        refundId: refund.id,
        currency: refund.currency,
      });
      await refundTimeslot(timeSlotId, refundData.id);
      console.log("refund success : " + JSON.stringify(refund));
    } else {
      throw "refund failed";
    }
  } catch (err) {
    throw err;
  }
});
