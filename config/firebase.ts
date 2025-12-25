import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAuth, getReactNativePersistence } from "firebase/auth"; // Alterado getAuth para initializeAuth e adicionado getReactNativePersistence
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'; // Importar Async Storage

const firebaseConfig = {
    apiKey: "AIzaSyB9WTAAoXgsWcMoSpThsvyUj3g1nmzCnEU",
    authDomain: "salao-amanda.firebaseapp.com",
    projectId: "salao-amanda",
    storageBucket: "salao-amanda.firebasestorage.app",
    messagingSenderId: "122058257840",
    appId: "1:122058257840:android:edf070dd9e963ebb5dd275"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const db = getFirestore(app);
export const auth = initializeAuth(app, { // Alterado getAuth para initializeAuth
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
}); 