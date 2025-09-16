// js/main-vegetariano.js
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { auth } from "./firebase.js"; // 👈 corregido: no firebase-config.js
import { cargarCalendarioJSON, guardarCalendarioActual } from "./firestore.js";

let currentUser = null;

// ========================
// SESIÓN DE USUARIO
// ========================
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    console.log("✅ Usuario logueado (vegetariano):", user.uid);
    await cargarCalendarioJSON(user, "vegetariano");
    const contenido = document.getElementById("contenido");
    if (contenido) contenido.style.display = "block";
  } else {
    console.log("⚠️ No autenticado. Redirigiendo a login...");
    window.location.href = "login.html";
  }
});

// ========================
// VALIDAR PLATO (vegetariano)
// ========================
async function validarPlatoVegetariano() {
  const s = getSeleccionados();

  const v = (s.verdura ?? '').trim();
  const p = (s.proteina ?? '').trim();
  const h = (s.hidrato ?? '').trim();
  const c = (s.completo ?? '').trim();

  const hasV = v.length > 0;
  const hasP = p.length > 0;
  const hasH = h.length > 0;
  const hasC = c.length > 0;

  console.log('validarPlato (veg) -> seleccionados:', { v, p, h, c, hasV, hasP, hasH, hasC });

  let valido = false;
  let platoFinal = '';

  // Reglas válidas: completo OR V+P+H
  if (hasC && !hasV && !hasP && !hasH) {
    valido = true; platoFinal = c;
    console.log('Razon: Plato completo solo (veg)');
  } else if (hasV && hasP && hasH && !hasC) {
    valido = true; platoFinal = `${v}+ ${p}+ ${h}`;
    console.log('Razon: Verdura + Proteína + Hidrato (veg)');
  } else {
    console.log('Razon: NO cumple reglas válidas (veg)');
  }

  if (valido) {
    if (seleccion) {
      const { dia, tipo } = seleccion;
      const otroTipo = (tipo === 'almuerzo') ? 'cena' : 'almuerzo';

      if (calendario[dia][otroTipo] === platoFinal) {
        console.log('Error: repetido mismo día (veg)');
        mostrarMensaje(`❌ No podés repetir "${platoFinal}" en ${dia}.`, 'error');
      } else if (contarRepeticiones(platoFinal) >= 2 && calendario[dia][tipo] !== platoFinal) {
        console.log('Error: ya asignado 2 veces en la semana (veg)');
        mostrarMensaje(`❌ El plato "${platoFinal}" ya fue asignado 2 veces esta semana.`, 'error');
      } else {
        calendario[dia][tipo] = platoFinal;
        actualizarCalendario();
        mostrarMensaje(`✅ Plato agregado en ${dia} (${tipo}).`, 'exito');
      }
      seleccion = null;
      limpiarSelects();
    } else {
      const ok = asignarAcalendario(platoFinal);
      if (ok) {
        mostrarMensaje('✅ Plato válido. Asignado correctamente al calendario.', 'exito');
      } else {
        mostrarMensaje(`❌ El plato "${platoFinal}" ya fue asignado 2 veces esta semana.`, 'error');
      }
      limpiarSelects();
    }

    // 👇 Guardamos automáticamente en Firestore
    if (currentUser) {
      try {
        await guardarCalendarioActual(currentUser, "vegetariano");
        console.log("📤 Calendario vegetariano guardado en Firestore");
      } catch (e) {
        console.error("❌ Error guardando calendario vegetariano:", e);
      }
    }

    return;
  }

  // ----- Motivos de invalidez -----
  if (!hasV && !hasP && !hasH && !hasC) {
    mostrarMensaje('❌ No seleccionaste ningún alimento.', 'error');
  } else if (hasC && (hasV || hasP || hasH)) {
    mostrarMensaje('❌ El plato completo no puede combinarse con otros alimentos.', 'error');
  } else if (hasV && (!hasP || !hasH)) {
    mostrarMensaje('❌ Necesitás verdura + proteína + hidrato para un plato válido.', 'error');
  } else if (!hasV && (hasP || hasH)) {
    mostrarMensaje('❌ Falta elegir al menos una verdura u hortaliza.', 'error');
  } else {
    mostrarMensaje('❌ Combinación no válida. Revisá tu selección.', 'error');
  }
}

// ========================
// EVENTOS DEL DOM
// ========================
document.addEventListener("DOMContentLoaded", () => {
  const btnAgregar = document.getElementById("btnAgregarVegetariano");
  if (btnAgregar) {
    btnAgregar.addEventListener("click", validarPlatoVegetariano);
  }
});

// =========================
// INICIO
// =========================
window.onload = () => {
  cargarCalendario(); // 👉 cada main trae su versión (normal o vegetariano)
  actualizarCalendario();
};
