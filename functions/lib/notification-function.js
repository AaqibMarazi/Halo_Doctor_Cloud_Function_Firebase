"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = exports.rescheduleTimeslotNotification = exports.orderedTimeslotNotification = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const user_service_1 = require("./user-service");
exports.notificationStartAppointment = functions.https.onCall(async (request, response) => {
    console.log("Start appointment notification send");
    let doctorName = request.doctorName;
    let userId = request.userId;
    let userToken = await (0, user_service_1.getUserTokenById)(userId); //await userService.getUserTokenById(userId);
    console.log("token user : " + userToken);
    await sendNotification(userToken, `Hi. ${doctorName} has started the consultation session`, "Please join the room, to start the consultation session");
});
async function orderedTimeslotNotification(doctorId) {
    try {
        let doctorUser = await (0, user_service_1.getUserByDoctorId)(doctorId);
        await sendNotification(doctorUser.token, "Timeslot Ordered!", "one of your timeslots has been booked");
    }
    catch (error) { }
}
exports.orderedTimeslotNotification = orderedTimeslotNotification;
/**
 * send notification to doctor, when timeslot is reschedule
 * @param doctorId the doctor id
 */
async function rescheduleTimeslotNotification(doctorId) {
    try {
        let doctorUser = await (0, user_service_1.getUserByDoctorId)(doctorId);
        await sendNotification(doctorUser.token, "Reschedule Appointment", "one of your timeslots has been rescheduled");
    }
    catch (error) {
        console.log(error);
    }
}
exports.rescheduleTimeslotNotification = rescheduleTimeslotNotification;
async function sendNotification(token, title, message) {
    try {
        const payload = {
            notification: {
                title: title,
                body: message,
            },
            data: {
                personSent: "testing",
            },
        };
        let response = await admin.messaging().sendToDevice(token, payload);
        console.log("Successfully send notification: ", response);
    }
    catch (error) {
        console.log("Error send notification :", error);
    }
}
exports.sendNotification = sendNotification;
//# sourceMappingURL=notification-function.js.map