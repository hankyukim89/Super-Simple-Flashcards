import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDu6Rx9OztT3_1XkJZXwTbZyixrvRCiv0M",
    authDomain: "super-simple-flashcards.firebaseapp.com",
    projectId: "super-simple-flashcards",
    storageBucket: "super-simple-flashcards.firebasestorage.app",
    messagingSenderId: "555056147081",
    appId: "1:555056147081:web:de944beb9672949e94b458",
    measurementId: "G-KZB4QQGCR0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
