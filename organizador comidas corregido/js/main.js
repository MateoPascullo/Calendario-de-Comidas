// js/main.js  (module)
import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { cargarCalendarioJSON, guardarCalendarioActual } from "./firestore.js";

window.currentUser = null; // accesible globalmente

onAuthStateChanged(auth, async (user) => {
  window.currentUser = user;
  const contenido = document.getElementById("contenido");

  if (user) {
    console.log("✅ Usuario logueado:", user.uid);
    // cargar lo guardado en Firestore (tipo: "tradicional")
    await cargarCalendarioJSON(user, "tradicional");
    // si la función reconstruye el calendario desde DOM, la invocamos:
    if (typeof reconstruirCalendarioDesdeDOM === "function") reconstruirCalendarioDesdeDOM();
    if (typeof actualizarCalendario === "function") actualizarCalendario();

    if (contenido) contenido.style.display = "block";
  } else {
    console.log("⚠️ Usuario no autenticado. Redirigiendo a login...");
    window.location.href = "login.html";
  }
});







