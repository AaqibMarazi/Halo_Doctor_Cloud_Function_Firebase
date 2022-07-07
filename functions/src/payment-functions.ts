// import * as functions from "firebase-functions";
import { firestore } from "firebase-admin";
//import * as admin from 'firebase-admin';
//const db = admin.firestore();
const notificationFunction = require("./notification-function");
import {
  BookByWho,
  orderCol,
  OrderModel,
  OrderStatus,
  timeSlotCol,
} from "./collections";

export enum PaymentStatus {
  PaymentSuccess = "payment_success",
  PaymentFail = "payment_failed",
}

export enum PaymentMethod {
  Stripe = "stripe",
  Paystack = "paystack",
}

enum TimeSlotStatus {
  booked = "booked",
  refund = "refund",
  cancel = "cancel",
}
type DoctorTimeslot = {
  doctorName: string;
  doctorPicture: string;
};

export interface ConfirmPayment {
  orderId: string;
  timeSlotId: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  amount: number;
  currency: string;
  fee: string;
  paymentType: string;
  bookByWho: BookByWho;
  doctor: DoctorTimeslot;
  doctorId: string;
}
export async function confirmPayment(confirmPayment: ConfirmPayment) {
  try {
    await orderCol.doc(confirmPayment.orderId).update({
      charged: true,
      amount: confirmPayment.amount,
      status: confirmPayment.paymentStatus,
      currency: confirmPayment.currency,
      fee: confirmPayment.fee,
      paymentMethod: confirmPayment.paymentMethod,
      paymentType: confirmPayment.paymentType,
    });
    await timeSlotCol.doc(confirmPayment.timeSlotId).update({
      charged: true,
      available: false,
      bookByWho: confirmPayment.bookByWho,
      status: TimeSlotStatus.booked,
      doctor: confirmPayment.doctor,
      purchaseTime: firestore.Timestamp.fromDate(new Date()),
    });

    await notificationFunction.orderedTimeslotNotification(
      confirmPayment.doctorId
    );
  } catch (error) {
    throw error;
  }
}
/**
 * create an order with status not pay, later once client successfully make payment,you can change the order status to pay
 * @param timeSlotId timeslot id that client wanto buy
 * @param userId user id who buy this timeslot
 * @param orderId you can set order id, you get this from your payment provider, like id transaction or reference id, that later you can use to find this particular order id, usually from webhook
 */
export async function createOrder(
  timeSlotId: string,
  userId: string,
  orderId: string
) {
  try {
    const newOrder = {
      charged: false,
      status: OrderStatus.notPay,
      timeSlotId: timeSlotId,
      userId: userId,
      createdAt: firestore.Timestamp.fromDate(new Date()),
    } as OrderModel;

    await orderCol.doc(orderId).create(newOrder);
    console.log("add new order");
  } catch (error) {}
}
