"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserPermanently = void 0;
const functions = require("firebase-functions");
const user_service_1 = require("./user-service");
exports.deleteUserPermanently = functions.https.onCall(async (request, context) => {
    try {
        console.log("delete user functions, user id : " + request.userId);
        await (0, user_service_1.deleteUser)(request.userId);
    }
    catch (e) {
        throw new Error("error deleting user");
    }
});
//# sourceMappingURL=user-functions.js.map