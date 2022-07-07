import { firestore } from "firebase-admin";

export enum OrderStatus {
  notPay = "notPay",
  pay = "pay",
}

export enum Role {
  Doctor = "doctor",
  User = "user",
  Admin = "admin",
}

export type OrderModel = {
  charged: boolean;
  status: OrderStatus;
  timeSlotId: string;
  userId: string;
  createdAt: firestore.Timestamp;
};

type TimeSlotModel = {
  available: boolean;
  doctorId: string;
  duration: number;
  userId: string;
  charged: boolean | undefined;
  parentTimeslotId: string | null | undefined;
  price: number;
  timeSlot: firestore.Timestamp;
  bookByWho: BookByWho | undefined;
  doctor: DoctorModel | undefined;
};

type DoctorModel = {
  doctorName: string;
  doctorPicture: string;
  accountStatus: boolean;
  balance: number;
  createdAt: firestore.Timestamp;
  updatedAt: firestore.Timestamp;
  doctorBasePrice: number;
  doctorBiography: string;
  doctorCategory: DoctorCategoryModel;
  doctorHospital: string;
};

type DoctorCategoryModel = {
  categoryName: string;
  iconUrl: string;
  categoryId: string;
};

type UserModel = {
  createdAt: firestore.Timestamp;
  displayName: string;
  doctorId: string;
  role: Role;
  token: string;
  uid: string;
  email: string;
};

export type BookByWho = {
  displayName: string;
  photoUrl: string;
  userId: string;
};

const createCollection = <T = firestore.DocumentData>(
  collectionName: string
) => {
  return firestore().collection(
    collectionName
  ) as firestore.CollectionReference<T>;
};

export const orderCol = createCollection<OrderModel>("Order");
export const timeSlotCol = createCollection<TimeSlotModel>("DoctorTimeslot");
export const doctorCol = createCollection<DoctorModel>("Doctors");
export const usersCol = createCollection<UserModel>("Users");
