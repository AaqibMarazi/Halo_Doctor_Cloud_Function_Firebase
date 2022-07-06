const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();
const { firestore } = require("firebase-admin");
const axios = require("axios");
//Doctor request money withdrawal
exports.requestPaystackPaymentUrl = functions.https.onCall(
  async (request, response) => {
    try {
      //   var paystackSecretKey = functions.config().paystack.secretkey;
      //   const axiosConfig = {
      //     headers: {
      //       "Content-Type": "application/json;charset=UTF-8",
      //       Authorization:
      //         "Bearer sk_test_dccfded876ba3838175aafd6beb16a3b0ba43e60",
      //     },
      //   };
      //   const config = {
      //     headers: {
      //       "Content-Type": "application/json",
      //       Authorization: "Bearer " + paystackSecretKey,
      //     },
      //   };
      //   const body = {
      //     email: "customer@email.com",
      //     amount: 2000,
      //     callback_url: "https://standard.paystack.co/close",
      //   };
      //   let response = await axios.post(
      //     "https://api.paystack.co/transaction/initialize",
      //     body,
      //     axiosConfig
      //   );
      //   let paymentUrl = response.data.data.authorization_url;
      const axiosConfig = {
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          Authorization:
            "Bearer sk_test_dccfded876ba3838175aafd6beb16a3b0ba43e60",
        },
      };
      const body = {
        email: "customer@email.com",
        amount: 2000,
        callback_url: "https://standard.paystack.co/close",
      };
      let response = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        body,
        axiosConfig
      );

      // var s = response.data.substring(0, response.data.indexOf("<"));
      // let myObject = JSON.parse(s);
      console.log(response.data.data.authorization_url);
      return response.data.data.authorization_url;
    } catch (e) {
      throw e;
    }
  }
);
