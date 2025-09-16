// =========================
// VALIDACIÓN DE PLATOS (versión vegetariana)
// =========================
function validarPlato() {
  const s = getSeleccionados();

  // Normalización robusta
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

  // Reglas válidas (vegetariano): solo completo OR V+P+H
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
        if (window.currentUser) guardarCalendarioActual(window.currentUser, "vegetariano").catch(console.error);
        mostrarMensaje(`✅ Plato agregado en ${dia} (${tipo}).`, 'exito');
      }
      seleccion = null;
      limpiarSelects();
    } else {
      const ok = asignarAcalendario(platoFinal);
      if (ok) {
        actualizarCalendario();
        if (window.currentUser) guardarCalendarioActual(window.currentUser, "vegetariano").catch(console.error);
        mostrarMensaje('✅ Plato válido. Asignado correctamente al calendario.', 'exito');
      } else {
        mostrarMensaje(`❌ El plato "${platoFinal}" ya fue asignado 2 veces esta semana.`, 'error');
      }
      limpiarSelects();
    }
    return;
  }

  // ----- Motivos específicos de invalidez (veg mejorados) -----
  if (!hasV && !hasP && !hasH && !hasC) {
    mostrarMensaje('❌ No seleccionaste ningún alimento.', 'error');
  } else if (hasC && (hasV || hasP || hasH)) {
    mostrarMensaje('❌ El plato completo no puede combinarse con otros alimentos.', 'error');
  } else if (hasV && (!hasP || !hasH)) {
    mostrarMensaje('❌ En esta versión necesitás verdura + proteína + hidrato para un plato válido.', 'error');
  } else if (!hasV && (hasP || hasH)) {
    mostrarMensaje('❌ Falta elegir al menos una verdura u hortaliza.', 'error');
  } else {
    mostrarMensaje('❌ Combinación no válida. Revisá tu selección.', 'error');
  }
}


// =========================
// GENERADOR ALEATORIO (Vegetariano)
// =========================
window.generarPlatoAleatorioVeg = function () {
  const verduras  = window.getOpciones("verdura");
  const proteinas = window.getOpciones("proteina");
  const hidratos  = window.getOpciones("hidrato");
  const completos = window.getOpciones("completo");

  const modo = (completos.length > 0 && Math.random() < 0.5) ? "completo" : "combo";

  if (modo === "completo") {
    return completos[Math.floor(Math.random() * completos.length)];
  }

  if (!verduras.length || !proteinas.length || !hidratos.length) {
    console.error("❌ Faltan opciones en los selects (verdura/proteina/hidrato).");
    return null;
  }

  const v = verduras[Math.floor(Math.random() * verduras.length)];
  const p = proteinas[Math.floor(Math.random() * proteinas.length)];
  const h = hidratos[Math.floor(Math.random() * hidratos.length)];
  return `${v}+ ${p}+ ${h}`;
};

window.generarCalendarioAleatorioVeg = function () {
  const dias  = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const tipos = ["almuerzo", "cena"];

  calendario = {};
  dias.forEach(d => (calendario[d] = { almuerzo: "", cena: "" }));

  dias.forEach(dia => {
    tipos.forEach(tipo => {
      let platoValido = null;
      let intentos = 0;

      while (!platoValido && intentos < 50) {
        intentos++;
        const candidato = window.generarPlatoAleatorioVeg();
        if (!candidato) break;

        const otroTipo = (tipo === "almuerzo") ? "cena" : "almuerzo";
        if (calendario[dia][otroTipo] === candidato) continue;
        if (typeof contarRepeticiones === "function" && contarRepeticiones(candidato) >= 2) continue;

        platoValido = candidato;
      }

      if (platoValido) {
        calendario[dia][tipo] = platoValido;
      }
    });
  });

  if (typeof actualizarCalendario === "function") actualizarCalendario();
  if (window.currentUser) guardarCalendarioActual(window.currentUser, "vegetariano").catch(console.error);
  if (typeof mostrarMensaje === "function") {
    mostrarMensaje("✅ Calendario vegetariano generado aleatoriamente.", "exito");
  } else {
    console.log("✅ Calendario vegetariano generado:", calendario);
  }
};








