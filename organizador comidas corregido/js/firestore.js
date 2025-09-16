// js/firestore.js
import { db, serverTimestamp } from "./firebase.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

export async function guardarCalendarioUsuario(user, tipo, calendarioHTML) {
  await setDoc(doc(db, "calendarios", `${user.uid}_${tipo}`), {
    calendario: calendarioHTML,
    updatedAt: serverTimestamp()
  });
}

export async function cargarCalendarioUsuario(user, tipo) {
  const snap = await getDoc(doc(db, "calendarios", `${user.uid}_${tipo}`));
  return snap.exists() ? snap.data().calendario : null;
}
