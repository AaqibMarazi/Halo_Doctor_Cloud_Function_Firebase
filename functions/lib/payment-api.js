"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentApiCall = void 0;
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
        var digits = "0123456789";
        for (let i = 0; i < 16; i++) {
            const randomIndex = Math.floor(Math.random() * digits.length);
            const digit = digits.charAt(randomIndex);
            uniqueNumber += digit;
            digits = digits.slice(0, randomIndex) + digits.slice(randomIndex + 1);
        }
        return uniqueNumber;
    }
    const unique_txn_uid = generateUniqueNumber();
    console.log("generatewd Unique ID", unique_txn_uid);
    // set UID in the req.body
    req.body.Do_TxnHdr.Merch_Txn_UID = unique_txn_uid;
    console.log(req.body);
    const userId = req.body.Do_PyrDtl.Pyr_UID;
    try {
        const documentRef = admin.firestore().collection("Users").doc(userId);
        documentRef.update({ Merch_Txn_UID: unique_txn_uid }).then(async () => {
            const response = await axios_1.default.post("https://demo.bookeey.com/pgapi/api/payment/requestLink", req.body);
            console.log(response.data, "After call Log");
            return res.status(200).json({ response: response.data });
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