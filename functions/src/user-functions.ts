import * as functions from "firebase-functions";
import { deleteUser } from "./user-service";
export const deleteUserPermanently = functions.https.onCall(
  async (request, context) => {
    try {
      console.log("delete user functions, user id : " + request.userId);
      await deleteUser(request.userId);
    } catch (e) {
      throw new Error("error deleting user");
    }
  }
);
