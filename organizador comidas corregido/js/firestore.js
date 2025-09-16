// firestore.js → Guardar y cargar calendario

import { db, serverTimestamp } from "./firebase.js";
import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// Guarda calendario actual (HTML del tbody)
export async function guardarCalendarioActual(user, tipo) {
  const calendarioHTML = document.getElementById("calendario-body").innerHTML;
  await setDoc(doc(db, "calendarios", `${user.uid}_${tipo}`), {
    calendario: calendarioHTML,
    updatedAt: serverTimestamp()
  });
}

// Carga calendario y lo inserta en el tbody
export async function cargarCalendarioJSON(user, tipo) {
  const snap = await getDoc(doc(db, "calendarios", `${user.uid}_${tipo}`));
  if (snap.exists()) {
    document.getElementById("calendario-body").innerHTML = snap.data().calendario;
  }
}

