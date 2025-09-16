// firestore.js
import { db, serverTimestamp } from "./firebase.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// Guardar calendario actual en Firestore
export async function guardarCalendarioActual(user, tipo) {
  if (!user) return;
  const calendarioHTML = document.getElementById("calendario-body").innerHTML;
  await setDoc(doc(db, "calendarios", `${user.uid}_${tipo}`), {
    calendario: calendarioHTML,
    updatedAt: serverTimestamp()
  });
}

// Cargar calendario desde Firestore
export async function cargarCalendarioJSON(user, tipo) {
  if (!user) return;
  const snap = await getDoc(doc(db, "calendarios", `${user.uid}_${tipo}`));
  if (snap.exists()) {
    document.getElementById("calendario-body").innerHTML = snap.data().calendario;
  }
}




