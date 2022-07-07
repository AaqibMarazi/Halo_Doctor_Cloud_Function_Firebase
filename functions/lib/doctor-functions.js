"use strict";
const functions = require("firebase-functions");
const userServiceFunction = require("./user-service");
exports.deleteDoctor = functions.https.onCall(async (request, response) => {
    try {
        console.log("delete doctor functions : " + request.doctorId);
        await userServiceFunction.deleteDoctor(request.doctorId);
    }
    catch (e) {
        throw e;
    }
});
//# sourceMappingURL=doctor-functions.js.map