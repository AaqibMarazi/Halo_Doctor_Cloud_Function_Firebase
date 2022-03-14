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

async function sendNotification(token, title, message) {
  console.log("------- Test notification function start ----------");
  //   let token =
  //     "fjch85HORgisi_8ujM84fs:APA91bFoAFvKgfZXo0ymAqmnK1nTcsK_pEpQ6FiOnZYs61zSsBFv8y2e_mgg1Y7-Nt7qTZ8J7ltJcqePTAFnoX3ioPIZiT49cTQ_EtQdwc_E584WRRY2-EKUyDqyeOSH4JW_SFgiKeCV";

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
