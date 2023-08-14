"use strict";
// import * as functions from "firebase-functions";
// import axios from "axios";
// const admin = require("firebase-admin");
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentApiCall = void 0;
// export const paymentApiCall = functions.https.onRequest(
//   async (req: any, res: any) => {
//     if (req.method !== "POST") {
//       return res.status(401).json({
//         message: "Not allowed",
//       });
//     }
//     function generateUniqueNumber() {
//       let uniqueNumber = "";
//       var digits = "0123456789";
//       for (let i = 0; i < 16; i++) {
//         const randomIndex = Math.floor(Math.random() * digits.length);
//         const digit = digits.charAt(randomIndex);
//         uniqueNumber += digit;
//         digits = digits.slice(0, randomIndex) + digits.slice(randomIndex + 1);
//       }
//       return uniqueNumber;
//     }
//     const unique_txn_uid = generateUniqueNumber();
//     // set UID in the req.body
//     req.body.Do_TxnHdr.Merch_Txn_UID = unique_txn_uid;
//     console.log(req.body);
//     const userId = req.body.Do_PyrDtl.Pyr_UID;
//     const timeSlotId = req.body.Do_PyrDtl.Time_Slot_ID;
//     try {
//       let purchasedTimeSlot = await admin
//         .firestore()
//         .collection("DoctorTimeslot")
//         .doc(timeSlotId)
//         .get();
//       purchasedTimeSlot = purchasedTimeSlot.data();
//       console.log(purchasedTimeSlot, "Time Slot Data");
//       let amount = purchasedTimeSlot.price * 100;
//       console.log(amount, "Total Apyable Amount");
//       req.body.Do_TxnDtl[0].Txn_AMT = amount.toString();
//       console.log(req.body);
//       const documentRef = admin.firestore().collection("Users").doc(userId);
//       documentRef
//         .update({ Merch_Txn_UID: unique_txn_uid }, { merge: true })
//         .then(async () => {
//           const response = await axios.post(
//             "https://demo.bookeey.com/pgapi/api/payment/requestLink",
//             req.body
//           );
//           console.log(response, "API response");
//           console.log(
//             admin.firestore.Timestamp.fromDate(new Date()),
//             "Time Stepmp Log"
//           );
//           await admin
//             .firestore()
//             .collection("Order")
//             .add({
//               createdAt: admin.firestore.Timestamp.fromDate(new Date()),
//               timeSlotId: timeSlotId,
//               userId: userId,
//               charged: false,
//               bookeeyPaymentId: unique_txn_uid,
//               status: "notPay",
//             });
//           return res.status(200).json({
//             paymentURL: response.data,
//             unique_txn_uid,
//             bookedTimeSlotId: timeSlotId,
//           });
//         });
//     } catch (error) {
//       console.error(error);
//       return res.status(300).json({
//         message: "Something went wrong while initiating payment",
//       });
//     }
//   }
// );
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
        console.log(purchasedTimeSlot, "Time Slot Data");
        const amount = (purchasedTimeSlot === null || purchasedTimeSlot === void 0 ? void 0 : purchasedTimeSlot.price) * 100;
        console.log(amount, "Total Payable Amount");
        req.body.Do_TxnDtl[0].Txn_AMT = amount;
        console.log(req.body.Do_TxnDtl[0].Txn_AMT);
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
//# sourceMappingURL=payment-api.js.map