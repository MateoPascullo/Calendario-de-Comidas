import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { app } from "./firebase-config.js";

const db = getFirestore(app);

// 🔹 Guardar calendario (normal o vegetariano)
export async function guardarCalendarioActual(user, tipo = "normal") {
  try {
    const calendarioBody = document.getElementById("calendario-body");
    const data = calendarioBody.innerHTML;

    // docId será "normal-uidUsuario" o "vegetariano-uidUsuario"
    const docId = `${tipo}-${user.uid}`;

    await setDoc(doc(db, "calendarios", docId), {
      calendario: data,
      actualizado: serverTimestamp()
    });

    console.log(`✅ Calendario (${tipo}) guardado en Firestore`);
  } catch (error) {
    console.error("❌ Error guardando calendario:", error);
  }
}

// 🔹 Cargar calendario (normal o vegetariano)
export async function cargarCalendarioJSON(user, tipo = "normal") {
  try {
    const docId = `${tipo}-${user.uid}`;
    const ref = doc(db, "calendarios", docId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      document.getElementById("calendario-body").innerHTML = snap.data().calendario;
      console.log(`📂 Calendario (${tipo}) cargado de Firestore`);
    } else {
      console.log(`ℹ️ No había calendario guardado (${tipo}) para este usuario`);
    }
  } catch (error) {
    console.error("❌ Error cargando calendario:", error);
  }
}
