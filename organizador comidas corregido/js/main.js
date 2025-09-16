// js/main.js
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { auth } from "./firebase.js"; // 👈 corregido: no firebase-config.js
import { cargarCalendarioJSON, guardarCalendarioActual } from "./firestore.js";

let currentUser = null;

// ========================
// VALIDAR PLATO (normal)
// ========================
function validarPlato() {
  const s = getSeleccionados();

  const v = (s.verdura ?? '').trim();
  const p = (s.proteina ?? '').trim();
  const h = (s.hidrato ?? '').trim();
  const c = (s.completo ?? '').trim();

  const hasV = v.length > 0;
  const hasP = p.length > 0;
  const hasH = h.length > 0;
  const hasC = c.length > 0;

  console.log('validarPlato (normal) -> seleccionados:', { v, p, h, c, hasV, hasP, hasH, hasC });

  let valido = false;
  let platoFinal = '';

  // Reglas válidas: completo OR V+P+H
  if (hasC && !hasV && !hasP && !hasH) {
    valido = true; platoFinal = c;
    console.log('Razon: Plato completo solo (normal)');
  } else if (hasV && hasP && hasH && !hasC) {
    valido = true; platoFinal = `${v}+ ${p}+ ${h}`;
    console.log('Razon: Verdura + Proteína + Hidrato (normal)');
  } else {
    console.log('Razon: NO cumple reglas válidas (normal)');
  }

  if (valido) {
    if (seleccion) {
      const { dia, tipo } = seleccion;
      const otroTipo = (tipo === 'almuerzo') ? 'cena' : 'almuerzo';

      if (calendario[dia][otroTipo] === platoFinal) {
        console.log('Error: repetido mismo día (normal)');
        mostrarMensaje(`❌ No podés repetir "${platoFinal}" en ${dia}.`, 'error');
      } else if (contarRepeticiones(platoFinal) >= 2 && calendario[dia][tipo] !== platoFinal) {
        console.log('Error: ya asignado 2 veces en la semana (normal)');
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
      guardarCalendarioActual(currentUser, "normal");
    }

    return;
  }

  // ----- Motivos específicos de invalidez -----
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
// SESIÓN DE USUARIO
// ========================
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    console.log("Usuario logueado:", user.email);
    await cargarCalendarioJSON(user, "normal");
    document.getElementById("contenido").style.display = "block";
  } else {
    console.log("Usuario NO logueado");
    window.location.href = "login.html";
  }
});

// ========================
// EVENTOS DEL DOM
// ========================
document.addEventListener("DOMContentLoaded", () => {
  const btnAgregar = document.getElementById("btnAgregar");
  if (btnAgregar) {
    btnAgregar.addEventListener("click", validarPlato);
  }
});

// =========================
// INICIO
// =========================
window.onload = () => {
  cargarCalendario(); // 👉 cada main trae su versión (normal o vegetariano)
  actualizarCalendario();
};


