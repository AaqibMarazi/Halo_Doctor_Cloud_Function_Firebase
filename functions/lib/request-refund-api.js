"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestRefundApiCall = void 0;
const functions = require("firebase-functions");
const axios_1 = require("axios");
// This same API will work woth requesting Refund, Status of request and revert the request
exports.requestRefundApiCall = functions.https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
        return res.status(401).json({
            message: "Not allowed",
        });
    }
    try {
        const response = await axios_1.default.post("https://demo.bookeey.com/bkycoreapi/v1/Accounts/request-refund", req.body);
        console.log(response.data, "After call Log");
        return res.status(200).json({ response: response.data });
    }
    catch (error) {
        console.error(error);
        return res.status(300).json({
            message: "Something went wrong while refund payment",
        });
    }
});
//# sourceMappingURL=request-refund-api.js.map