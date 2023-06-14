import * as functions from "firebase-functions";
import axios from "axios";

// This same API will work woth requesting Refund, Status of request and revert the request
export const requestRefundApiCall = functions.https.onRequest(
  async (req: any, res: any) => {
    if (req.method !== "POST") {
      return res.status(401).json({
        message: "Not allowed",
      });
    }

    try {
      const response = await axios.post(
        "https://demo.bookeey.com/bkycoreapi/v1/Accounts/request-refund",
        req.body
      );

      console.log(response.data, "After call Log");
      return res.status(200).json({ response: response.data });
    } catch (error) {
      console.error(error);
      return res.status(300).json({
        message: "Something went wrong while refund payment",
      });
    }
  }
);
