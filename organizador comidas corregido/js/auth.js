// js/auth.js
import { auth, provider } from "./firebase-config.js";
import {
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// Login
export function loginWithRedirect() {
  return signInWithRedirect(auth, provider);
}
export function loginWithPopup() {
  return signInWithPopup(auth, provider);
}

// Finalizar redirect al volver
export function finalizeRedirect() {
  return getRedirectResult(auth);
}

// Logout
export function logout() {
  return signOut(auth);
}

// Escuchar cambios de auth
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
