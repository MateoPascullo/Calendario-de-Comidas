// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBgyXUiZPdYlWQBclhhH70mfRuIXIuw2EE",
  authDomain: "plato-resuelto.firebaseapp.com",
  projectId: "plato-resuelto",
  storageBucket: "plato-resuelto.firebasestorage.app",
  messagingSenderId: "11080746612",
  appId: "1:11080746612:web:22f488078f01def94ff321",
  measurementId: "G-16RQJ5KB0H"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, db, serverTimestamp };
