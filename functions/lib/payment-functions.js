"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = exports.confirmPayment = exports.PaymentMethod = exports.PaymentStatus = void 0;
// import * as functions from "firebase-functions";
const firebase_admin_1 = require("firebase-admin");
//import * as admin from 'firebase-admin';
//const db = admin.firestore();
const notificationFunction = require("./notification-function");
const collections_1 = require("./collections");
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PaymentSuccess"] = "payment_success";
    PaymentStatus["PaymentFail"] = "payment_failed";
})(PaymentStatus = exports.PaymentStatus || (exports.PaymentStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["Stripe"] = "stripe";
    PaymentMethod["Paystack"] = "paystack";
})(PaymentMethod = exports.PaymentMethod || (exports.PaymentMethod = {}));
var TimeSlotStatus;
(function (TimeSlotStatus) {
    TimeSlotStatus["booked"] = "booked";
    TimeSlotStatus["refund"] = "refund";
    TimeSlotStatus["cancel"] = "cancel";
})(TimeSlotStatus || (TimeSlotStatus = {}));
async function confirmPayment(confirmPayment) {
    try {
        await collections_1.orderCol.doc(confirmPayment.orderId).update({
            charged: true,
            amount: confirmPayment.amount,
            status: confirmPayment.paymentStatus,
            currency: confirmPayment.currency,
            fee: confirmPayment.fee,
            paymentMethod: confirmPayment.paymentMethod,
            paymentType: confirmPayment.paymentType,
        });
        await collections_1.timeSlotCol.doc(confirmPayment.timeSlotId).update({
            charged: true,
            available: false,
            bookByWho: confirmPayment.bookByWho,
            status: TimeSlotStatus.booked,
            doctor: confirmPayment.doctor,
            purchaseTime: firebase_admin_1.firestore.Timestamp.fromDate(new Date()),
        });
        await notificationFunction.orderedTimeslotNotification(confirmPayment.doctorId);
    }
    catch (error) {
        throw error;
    }
}
exports.confirmPayment = confirmPayment;
/**
 * create an order with status not pay, later once client successfully make payment,you can change the order status to pay
 * @param timeSlotId timeslot id that client wanto buy
 * @param userId user id who buy this timeslot
 * @param orderId you can set order id, you get this from your payment provider, like id transaction or reference id, that later you can use to find this particular order id, usually from webhook
 */
async function createOrder(timeSlotId, userId, orderId) {
    try {
        const newOrder = {
            charged: false,
            status: collections_1.OrderStatus.notPay,
            timeSlotId: timeSlotId,
            userId: userId,
            createdAt: firebase_admin_1.firestore.Timestamp.fromDate(new Date()),
        };
        await collections_1.orderCol.doc(orderId).create(newOrder);
        console.log("add new order");
    }
    catch (error) { }
}
exports.createOrder = createOrder;
//# sourceMappingURL=payment-functions.js.map