// js/auth.js
import { auth, provider } from "./firebase.js";
import { signInWithPopup, signOut, onAuthStateChanged } 
  from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

export function login() {
  return signInWithPopup(auth, provider);
}

export function logout() {
  return signOut(auth);
}

export function escucharAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

