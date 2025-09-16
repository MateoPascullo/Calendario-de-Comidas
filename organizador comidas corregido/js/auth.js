// auth.js → SOLO login/logout

import { auth, provider } from "./firebase.js";
import {
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// Inicia login con redirect
export function loginWithRedirect() {
  return signInWithRedirect(auth, provider);
}

// Finaliza login luego del redirect
export async function finalizeRedirect() {
  return await getRedirectResult(auth);
}

// Logout
export function logout() {
  return signOut(auth);
}

// Escuchar cambios de sesión
export function escucharAuth(callback) {
  return onAuthStateChanged(auth, callback);
}



