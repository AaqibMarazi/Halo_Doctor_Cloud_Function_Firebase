import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { getUserByDoctorId, getUserTokenById } from "./user-service";

exports.notificationStartAppointment = functions.https.onCall(
  async (request, response) => {
    console.log("Start appointment notification send");
    let doctorName = request.doctorName;
    let userId = request.userId;
    let userToken = await getUserTokenById(userId); //await userService.getUserTokenById(userId);
    console.log("token user : " + userToken);
    await sendNotification(
      userToken,
      `Hi. ${doctorName} has started the consultation session`,
      "Please join the room, to start the consultation session"
    );
  }
);

export async function orderedTimeslotNotification(doctorId: string) {
  try {
    let doctorUser = await getUserByDoctorId(doctorId);
    await sendNotification(
      doctorUser.token,
      "Timeslot Ordered!",
      "one of your timeslots has been booked"
    );
  } catch (error) {}
}

/**
 * send notification to doctor, when timeslot is reschedule
 * @param doctorId the doctor id
 */
export async function rescheduleTimeslotNotification(doctorId: string) {
  try {
    let doctorUser = await getUserByDoctorId(doctorId);
    await sendNotification(
      doctorUser.token,
      "Reschedule Appointment",
      "one of your timeslots has been rescheduled"
    );
  } catch (error) {
    console.log(error);
  }
}

export async function sendNotification(
  token: string,
  title: string,
  message: string
) {
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
  } catch (error) {
    console.log("Error send notification :", error);
  }
}
