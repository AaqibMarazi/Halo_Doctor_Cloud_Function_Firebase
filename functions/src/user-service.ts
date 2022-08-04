import { usersCol, UserModel, doctorCol } from "./collections";
import * as admin from "firebase-admin";
export async function getUserTokenById(userId: string): Promise<string> {
  let user = await usersCol.doc(userId).get();
  return Promise.resolve(user.data()?.token!);
}

export async function getUserByDoctorId(doctorId: string): Promise<UserModel> {
  var userRef = await usersCol.where("doctorId", "==", doctorId).get();
  return userRef.docs[0].data();
}

async function deleteUserInDb(userId: string) {
  try {
    await usersCol.doc(userId).delete();
    console.log("success delete user in Db");
  } catch (error) {
    console.log("fail delete user in auth");
  }
}

async function deleteUserInAuth(userId: string) {
  try {
    await admin.auth().deleteUser(userId);
    console.log("success delete user in auth");
  } catch (error) {
    console.log("error delete user");
  }
}

export async function deleteDoctor(doctorId: string) {
  try {
    let user = await getUserByDoctorId(doctorId);
    await doctorCol.doc(doctorId).delete();
    if (user) {
      await deleteUser(user.uid);
      console.log("success delete user");
    } else {
      console.log("User null " + user);
    }

    console.log("success delete doctor");
  } catch (error) {
    console.log(
      "🚀 ~ file: user-service.js ~ line 67 ~ deleteDoctor ~ error",
      error
    );
    throw error;
  }
}

export async function deleteUser(userId: string) {
  try {
    await deleteUserInAuth(userId);
    await deleteUserInDb(userId);
  } catch (error) {
    console.log("failed delete user");
    throw error;
  }
}
