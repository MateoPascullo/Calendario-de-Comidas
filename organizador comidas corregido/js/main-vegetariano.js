import { login, logout, escucharAuth } from "./auth.js";
import { cargarCalendario, guardarCalendario } from "./firestore.js";

// DOM
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const status = document.getElementById("status");
const contenido = document.getElementById("contenido");

let currentUser = null;
const tipoMenu = "vegetariano"; // ← aquí definimos el tipo

// Botones
loginBtn?.addEventListener("click", login);
logoutBtn?.addEventListener("click", logout);

// Sesión
escucharAuth(async (user) => {
  currentUser = user;
  if (user) {
    status.textContent = `Hola, ${user.displayName}`;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    contenido.style.display = "block";

    // Cargar calendario vegetariano
    await cargarCalendario(user, tipoMenu);

    // Guardar automáticamente al cambiar algo
    document.addEventListener("change", () => guardarCalendario(user, tipoMenu));
    document.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON") guardarCalendario(user, tipoMenu);
    });

  } else {
    status.textContent = "No logueado";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    contenido.style.display = "none";
  }
});



