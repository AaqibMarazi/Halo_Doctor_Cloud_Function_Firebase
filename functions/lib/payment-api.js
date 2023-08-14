"use strict";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentSuccessApiCall = exports.paymentApiCall = void 0;
const functions = require("firebase-functions");
const axios_1 = require("axios");
const admin = require("firebase-admin");
exports.paymentApiCall = functions.https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
        return res.status(401).json({
            message: "Not allowed",
        });
    }
    function generateUniqueNumber() {
        let uniqueNumber = "";
        let digits = "0123456789";
        for (let i = 0; i < 16; i++) {
            const randomIndex = Math.floor(Math.random() * digits.length);
            const digit = digits.charAt(randomIndex);
            uniqueNumber += digit;
            digits = digits.slice(0, randomIndex) + digits.slice(randomIndex + 1);
        }
        return uniqueNumber;
    }
    try {
        const unique_txn_uid = generateUniqueNumber();
        // Set UID in the req.body
        req.body.Do_TxnHdr.Merch_Txn_UID = unique_txn_uid;
        const userId = req.body.Do_PyrDtl.Pyr_UID;
        const timeSlotId = req.body.Do_PyrDtl.Time_Slot_ID;
        const purchasedTimeSlotSnapshot = await admin
            .firestore()
            .collection("DoctorTimeslot")
            .doc(timeSlotId)
            .get();
        const purchasedTimeSlot = purchasedTimeSlotSnapshot.data();
        const amount = (purchasedTimeSlot === null || purchasedTimeSlot === void 0 ? void 0 : purchasedTimeSlot.price) * 100;
        // Setting Amount in req.body
        req.body.Do_TxnDtl[0].Txn_AMT = amount;
        const documentRef = admin.firestore().collection("Users").doc(userId);
        await documentRef.update({ Merch_Txn_UID: unique_txn_uid });
        const response = await axios_1.default.post("https://demo.bookeey.com/pgapi/api/payment/requestLink", req.body);
        const orderData = {
            createdAt: admin.firestore.Timestamp.fromDate(new Date()),
            timeSlotId: timeSlotId,
            userId: userId,
            charged: false,
            bookeeyPaymentId: unique_txn_uid,
            status: "notPay",
        };
        const orderRef = await admin
            .firestore()
            .collection("Order")
            .add(orderData);
        return res.status(200).json({
            paymentURL: response.data,
            unique_txn_uid,
            bookedTimeSlotId: timeSlotId,
            orderId: orderRef.id,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(300).json({
            message: "Something went wrong while initiating payment",
        });
    }
});
exports.paymentSuccessApiCall = functions.https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
        return res.status(401).json({
            message: "Not allowed",
        });
    }
    const { paidAmount, unique_txn_uid, currency } = req.body;
    let order = await admin
        .firestore()
        .collection("Order")
        .where("bookeeyPaymentId", "==", unique_txn_uid)
        .get()
        .then(async (querySnapshot) => {
        let orderData = {};
        querySnapshot.forEach(function (doc) {
            console.log(doc.id, " => ", doc.data());
            doc.ref.update({
                charged: true,
                amount: Number(paidAmount / 100),
                status: "payment_success",
                // linkReceipt: linkReceipt,
                currency: currency,
            });
            orderData = doc.data();
        });
        return orderData;
    });
    //Get user info who book this timeslot
    let bookByWho = await admin
        .firestore()
        .collection("Users")
        .doc(order === null || order === void 0 ? void 0 : order.userId)
        .get();
    //Update DoctorTimeslot
    let timeSlotRef = await admin
        .firestore()
        .collection("DoctorTimeslot")
        .doc(order.timeSlotId)
        .get();
    //Get doctor detail data
    let doctor = await admin
        .firestore()
        .collection("Doctors")
        .doc(timeSlotRef.data().doctorId)
        .get();
    await timeSlotRef.ref.update({
        charged: true,
        available: false,
        bookByWho: {
            userId: order.userId,
            displayName: bookByWho.data().displayName,
            photoUrl: bookByWho.data().photoUrl ? bookByWho.data().photoUrl : "",
        },
        status: "booked",
        doctor: {
            doctorName: doctor.data().doctorName,
            doctorPicture: doctor.data().doctorPicture,
        },
        purchaseTime: admin.firestore.Timestamp.fromDate(new Date()),
    });
    res
        .status(200)
        .json({ status: "success", message: "Slot Booking Successfully Done" });
});
//# sourceMappingURL=payment-api.js.map