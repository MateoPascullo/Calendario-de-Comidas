import { db, serverTimestamp } from "./firebase.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

export async function guardarCalendario(user, tipo) {
  const calendarioHTML = document.getElementById("calendario-body").innerHTML;
  await setDoc(doc(db, "calendarios", `${user.uid}_${tipo}`), {
    calendario: calendarioHTML,
    updatedAt: serverTimestamp()
  });
}

export async function cargarCalendario(user, tipo) {
  const snap = await getDoc(doc(db, "calendarios", `${user.uid}_${tipo}`));
  if (snap.exists()) {
    document.getElementById("calendario-body").innerHTML = snap.data().calendario;
  }
}


