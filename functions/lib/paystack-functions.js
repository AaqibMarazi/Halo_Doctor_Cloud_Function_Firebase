"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
//import * as admin from 'firebase-admin';
// const db = admin.firestore();
// const { firestore } = require("firebase-admin");
//const axios = require("axios");
//const axios = require('axios').default;
//Doctor request money withdrawal
const axios_1 = require("axios");
const payment_functions_1 = require("./payment-functions");
const collections_1 = require("./collections");
// type PaystackSuccessData = {
//   id: number;
//   domain: string;
//   amount: number;
//   currency: string;
//   due_date: string | null;
//   has_invoice: boolean;
//   invoice_number: string | null;
//   description: string;
//   pdf_url: string | null;
//   line_items: [];
//   tax: [];
//   request_code: string;
//   status: string;
//   paid: boolean;
//   paid_at: string;
//   metadata: string | null;
//   offline_reference: string;
//   customer: number;
//   created_at: string;
// };
// type PaystackWebhookSuccessModel = {
//   event: string;
//   data: PaystackSuccessData;
// };
exports.requestPaystackPaymentUrl = functions.https.onCall(async (request, response) => {
    var _a, _b;
    try {
        console.log("timeslot id : " + request.timeSlotId);
        console.log("user id : " + request.userId);
        const selectedTimeslot = await collections_1.timeSlotCol.doc(request.timeSlotId).get();
        const selectedUser = await collections_1.usersCol.doc(request.userId).get();
        const axiosConfig = {
            headers: {
                "Content-Type": "application/json;charset=UTF-8",
                Authorization: "Bearer sk_test_dccfded876ba3838175aafd6beb16a3b0ba43e60",
            },
        };
        const body = {
            email: (_a = selectedUser.data()) === null || _a === void 0 ? void 0 : _a.email,
            amount: (_b = selectedTimeslot.data()) === null || _b === void 0 ? void 0 : _b.price,
            callback_url: "https://standard.paystack.co/close",
        };
        const { data } = await axios_1.default.post("https://api.paystack.co/transaction/initialize", body, axiosConfig);
        await (0, payment_functions_1.createOrder)(request.timeSlotId, request.userId, data.data.reference);
        return data.data.authorization_url;
    }
    catch (e) {
        throw e;
    }
});
exports.paystackWebhook = functions.https.onRequest(async (request, response) => {
    var _a, _b, _c, _d, _e, _f;
    try {
        const { amount, currency, fees, channel, reference } = request.body.data;
        const myOrder = await collections_1.orderCol.doc(reference).get();
        if (myOrder.data() === undefined) {
            throw "order is undefined";
        }
        const timeSlot = await collections_1.timeSlotCol.doc((_a = myOrder.data()) === null || _a === void 0 ? void 0 : _a.timeSlotId).get();
        const doctor = await collections_1.doctorCol.doc((_b = timeSlot.data()) === null || _b === void 0 ? void 0 : _b.doctorId).get();
        const user = (await collections_1.usersCol.doc((_c = myOrder.data()) === null || _c === void 0 ? void 0 : _c.userId).get()).data();
        const bookByWho = {
            displayName: user === null || user === void 0 ? void 0 : user.displayName,
            photoUrl: "",
            userId: (_d = myOrder.data()) === null || _d === void 0 ? void 0 : _d.userId,
        };
        const confirmPaymentData = {
            orderId: myOrder.id,
            timeSlotId: timeSlot.id,
            paymentMethod: payment_functions_1.PaymentMethod.Paystack,
            paymentStatus: payment_functions_1.PaymentStatus.PaymentSuccess,
            amount: amount,
            currency: currency,
            fee: fees,
            paymentType: channel,
            bookByWho: bookByWho,
            doctor: {
                doctorName: (_e = doctor.data()) === null || _e === void 0 ? void 0 : _e.doctorName,
                doctorPicture: (_f = doctor.data()) === null || _f === void 0 ? void 0 : _f.doctorPicture,
            },
            doctorId: doctor.id,
        };
        await (0, payment_functions_1.confirmPayment)(confirmPaymentData);
        console.log("payment success");
        response.send();
    }
    catch (err) {
        throw err;
    }
});
//# sourceMappingURL=paystack-functions.js.map