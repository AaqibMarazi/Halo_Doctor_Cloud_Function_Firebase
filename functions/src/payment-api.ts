import * as functions from "firebase-functions";
import axios from "axios";
import * as admin from "firebase-admin";

export const paymentApiCall = functions.https.onRequest(
  async (req: any, res: any) => {
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

      const amount = purchasedTimeSlot?.price * 100;

      // Setting Amount in req.body
      req.body.Do_TxnDtl[0].Txn_AMT = amount;

      const documentRef = admin.firestore().collection("Users").doc(userId);
      await documentRef.update({ Merch_Txn_UID: unique_txn_uid });

      const response = await axios.post(
        "https://demo.bookeey.com/pgapi/api/payment/requestLink",
        req.body
      );

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
    } catch (error) {
      console.error(error);
      return res.status(300).json({
        message: "Something went wrong while initiating payment",
      });
    }
  }
);
