// js/main.js
import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { cargarCalendarioJSON, guardarCalendarioActual } from "./firestore.js";

let currentUser = null;

// ========================
// VALIDAR PLATO (normal)
// ========================
async function validarPlato() {
  if (!currentUser) return;

  const s = getSeleccionados();
  const v = (s.verdura ?? '').trim();
  const p = (s.proteina ?? '').trim();
  const h = (s.hidrato ?? '').trim();
  const c = (s.completo ?? '').trim();

  const hasV = v.length > 0;
  const hasP = p.length > 0;
  const hasH = h.length > 0;
  const hasC = c.length > 0;

  let valido = false;
  let platoFinal = '';

  if (hasC && !hasV && !hasP && !hasH) {
    valido = true; platoFinal = c;
  } else if (hasV && hasP && hasH && !hasC) {
    valido = true; platoFinal = `${v}+ ${p}+ ${h}`;
  }

  if (valido) {
    if (seleccion) {
      const { dia, tipo } = seleccion;
      const otroTipo = tipo === 'almuerzo' ? 'cena' : 'almuerzo';

      if (calendario[dia][otroTipo] === platoFinal) {
        mostrarMensaje(`❌ No podés repetir "${platoFinal}" en ${dia}.`, 'error');
      } else if (contarRepeticiones(platoFinal) >= 2 && calendario[dia][tipo] !== platoFinal) {
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
      if (ok) mostrarMensaje('✅ Plato válido. Asignado correctamente al calendario.', 'exito');
      else mostrarMensaje(`❌ El plato "${platoFinal}" ya fue asignado 2 veces esta semana.`, 'error');
      limpiarSelects();
    }

    // Guardar automáticamente en Firestore
    try {
      await guardarCalendarioActual(currentUser, "normal");
    } catch (e) {
      console.error("❌ Error guardando calendario:", e);
    }

    return;
  }

  // Mensajes de error por selección inválida
  if (!hasV && !hasP && !hasH && !hasC) mostrarMensaje('❌ No seleccionaste ningún alimento.', 'error');
  else if (hasC && (hasV || hasP || hasH)) mostrarMensaje('❌ El plato completo no puede combinarse con otros alimentos.', 'error');
  else if (hasV && (!hasP || !hasH)) mostrarMensaje('❌ Necesitás verdura + proteína + hidrato para un plato válido.', 'error');
  else if (!hasV && (hasP || hasH)) mostrarMensaje('❌ Falta elegir al menos una verdura u hortaliza.', 'error');
  else mostrarMensaje('❌ Combinación no válida. Revisá tu selección.', 'error');
}

// ========================
// SESIÓN DE USUARIO
// ========================
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  const contenido = document.getElementById("contenido");

  if (user) {
    console.log("✅ Usuario logueado:", user.uid);
    await cargarCalendarioJSON(user, "normal");

    if (contenido) contenido.style.display = "block";

    // Inicializar calendario
    if (typeof cargarCalendario === "function") cargarCalendario();
    if (typeof actualizarCalendario === "function") actualizarCalendario();

  } else {
    console.log("⚠️ Usuario no autenticado. Redirigiendo a login...");
    window.location.href = "login.html";
  }
});

// ========================
// EVENTOS DEL DOM
// ========================
document.addEventListener("DOMContentLoaded", () => {
  const btnAgregar = document.getElementById("btnAgregar");
  if (btnAgregar) btnAgregar.addEventListener("click", validarPlato);
});





