"use strict";
const functions = require("firebase-functions");
const userServiceFunction = require("./user-service");
exports.deleteUser = functions.https.onCall(async (request, response) => {
    try {
        console.log("delete user functions : " + request.userId);
        await userServiceFunction.deleteUser(request.userId);
    }
    catch (e) {
        throw e;
    }
});
//# sourceMappingURL=user-functions.js.map