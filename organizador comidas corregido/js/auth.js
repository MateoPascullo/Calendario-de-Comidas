import { auth, provider } from "./firebase.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

export async function login() {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.error("Error en login:", e);
  }
}

export async function logout() {
  await signOut(auth);
}

export function escucharAuth(callback) {
  onAuthStateChanged(auth, callback);
}


