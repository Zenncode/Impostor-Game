import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBcWWmar0d_o3STxJ7KGSltqFU46skQNEs",
  authDomain: "impostor-game-1625323148.firebaseapp.com",
  messagingSenderId: "238694939015",
  projectId: "impostor-game-1625323148",
  storageBucket: "impostor-game-1625323148.firebasestorage.app",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
