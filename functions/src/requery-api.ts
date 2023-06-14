import * as functions from "firebase-functions";
import axios from "axios";
const crypto = require("crypto");

export const requeryApiCall = functions.https.onRequest(
  async (req: any, res: any) => {
    if (req.method !== "POST") {
      return res.status(401).json({
        message: "Not allowed",
      });
    }

    const secret = "7462459";

    // Need Mid and MerchantTxnRefNo from req.body
    const { Mid, MerchantTxnRefNo } = req.body;

    console.log(Mid, "merchant Id");
    console.log(MerchantTxnRefNo, "taxRefNo");

    const dataToDigest = `${Mid}|${secret}`;

    const hmac = crypto.createHmac("sha512", secret);
    hmac.update(dataToDigest);

    const HashMac = hmac.digest("hex");

    console.log(HashMac, "Calculated hash mac");

    const dataToPost = {
      Mid,
      HashMac,
      MerchantTxnRefNo,
    };

    console.log(dataToPost);

    // API is not working directly.
    try {
      const response = await axios.post(
        "https://demo.bookeey.com/pgapi/api/payment/paymentstatus",
        dataToPost
      );

      console.log(response.data, "After call Log");
      return res.status(200).json({ response: response.data });
    } catch (error) {
      console.error(error);
      return res.status(300).json({
        message: "Something went wrong while checking payment status",
      });
    }
  }
);
