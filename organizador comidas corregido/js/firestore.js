// js/firestore.js
import { db, serverTimestamp } from "./firebase.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

export async function guardarCalendarioActual(user, tipo) {
  if (!user) return;
  const body = document.getElementById('calendario-body');
  if (!body) return;
  await setDoc(doc(db, "calendarios", `${user.uid}_${tipo}`), {
    calendarioHTML: body.innerHTML,
    updatedAt: serverTimestamp()
  });
}

export async function cargarCalendarioJSON(user, tipo) {
  if (!user) return;
  const snap = await getDoc(doc(db, "calendarios", `${user.uid}_${tipo}`));
  if (snap.exists()) {
    const data = snap.data();
    const body = document.getElementById('calendario-body');
    if (body && data.calendarioHTML) {
      body.innerHTML = data.calendarioHTML;
      // Llamamos a la función que reconstruye la variable `calendario` desde el DOM
      if (typeof reconstruirCalendarioDesdeDOM === "function") reconstruirCalendarioDesdeDOM();
    }
  }
}





