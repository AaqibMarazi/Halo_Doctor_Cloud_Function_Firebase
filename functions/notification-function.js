const functions = require("firebase-functions");
const admin = require("firebase-admin");
const userService = require("./user-service");

exports.notificationTest = functions.https.onCall(async (request, response) => {
  // console.log("Test notification");
  // let doctorUser = await userService.getUserByDoctorId("fcsLbxAIPXIYypnszNRo");
  // let doctorToken = await userService.getUserTokenById(doctorUser.id);
  // await sendNotification(
  //   doctorToken,
  //   "Timeslot Ordered!",
  //   "one of your timeslots has been booked"
  // );
  //await testNotification();
});
/** Send notification to user, when doctor start appointment
 *
 */
exports.notificationStartAppointment = functions.https.onCall(
  async (request, response) => {
    // console.log("Test notification");
    // let doctorUser = await userService.getUserByDoctorId("fcsLbxAIPXIYypnszNRo");
    // let doctorToken = await userService.getUserTokenById(doctorUser.id);
    console.log("Start appointment notification send");
    let doctorName = request.doctorName;
    let userId = request.userId;
    let userToken = await userService.getUserTokenById(userId);
    console.log("token user : " + userToken);
    await sendNotification(
      userToken,
      `Hi. ${doctorName} has started the consultation session`,
      "Please join the room, to start the consultation session"
    );
  }
);

/**
 * send notification to doctor, when his timeslot is ordered
 * @param doctorId the doctor id
 */
async function orderedTimeslotNotification(doctorId) {
  let doctorUser = await userService.getUserByDoctorId(doctorId);
  let doctorToken = await userService.getUserTokenById(doctorUser.id);
  await sendNotification(
    doctorToken,
    "Timeslot Ordered!",
    "one of your timeslots has been booked"
  );
}
/**
 * send notification to doctor, when timeslot is reschedule
 * @param doctorId the doctor id
 */
async function rescheduleTimeslotNotification(doctorId) {
  let doctorUser = await userService.getUserByDoctorId(doctorId);
  let doctorToken = await userService.getUserTokenById(doctorUser.id);
  await sendNotification(
    doctorToken,
    "Reschedule Appointment",
    "one of your timeslots has been rescheduled"
  );
}

async function sendNotification(token, title, message) {
  const payload = {
    notification: {
      title: title,
      body: message,
    },
    data: {
      personSent: "testing",
    },
  };
  admin
    .messaging()
    .sendToDevice(token, payload)
    .then(function (response) {
      console.log("Successfully send notification: ", response);
    })
    .catch(function (error) {
      console.log("Error send notification :", error);
    });
}
module.exports.sendNotification = sendNotification;
module.exports.orderedTimeslotNotification = orderedTimeslotNotification;
module.exports.rescheduleTimeslotNotification = rescheduleTimeslotNotification;
