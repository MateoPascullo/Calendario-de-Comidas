// =========================
// VALIDACIÓN DE PLATOS (versión tradicional)
// =========================
function validarPlato() {
  const s = getSeleccionados();

  // Normalización robusta (evita undefined/null y espacios)
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

  // Reglas válidas (tradicional)
  if (hasC && !hasV && !hasP && !hasH) {
    valido = true;
    platoFinal = c;
  } else if (hasV && hasP && hasH && !hasC) {
    valido = true;
    platoFinal = `${v}+ ${p}+ ${h}`;
  } else if (hasV && hasP && !hasH && !hasC) {
    valido = true;
    platoFinal = `${v}+ ${p}`;
  } else if (hasV && hasH && !hasP && !hasC) {
    valido = true;
    platoFinal = `${v}+ ${h}`;
  }

  if (valido) {
    // Asignación al calendario (igual que antes)
    if (seleccion) {
      const { dia, tipo } = seleccion;
      const otroTipo = (tipo === 'almuerzo') ? 'cena' : 'almuerzo';

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
      if (ok) {
        mostrarMensaje('✅ Plato válido. Asignado correctamente al calendario.', 'exito');
      } else {
        mostrarMensaje(`❌ El plato "${platoFinal}" ya fue asignado 2 veces esta semana.`, 'error');
      }
      limpiarSelects();
    }
    return;
  }

  // ----- Motivos específicos de invalidez (mejorados) -----
if (!hasV && !hasP && !hasH && !hasC) {
  mostrarMensaje('❌ No seleccionaste ningún alimento.', 'error');
} else if (hasC && (hasV || hasP || hasH)) {
  mostrarMensaje('❌ El plato completo no puede combinarse con otros alimentos.', 'error');
} else if (hasV && !hasP && !hasH) {
  mostrarMensaje('❌ Faltan más opciones: agregá proteína o hidrato.', 'error');
} else if (!hasV && (hasP || hasH)) {
  mostrarMensaje('❌ Falta elegir al menos una verdura u hortaliza.', 'error');
} else if (hasV && hasP && hasH) {
  mostrarMensaje('❌ Esta combinación no es válida. Probá con: verdura+proteína, verdura+hidrato o las tres juntas.', 'error');
} else {
  mostrarMensaje('❌ Combinación no válida. Revisá tu selección.', 'error');
}

}



// =========================
// STORAGE
// =========================
function guardarCalendario(){ 
  localStorage.setItem('calendario', JSON.stringify(calendario)); 
}
function cargarCalendario(){ 
  const g = localStorage.getItem('calendario'); 
  if(g){ 
    try{ calendario = JSON.parse(g);}catch(e){console.error("Error al cargar calendario:",e);} 
  } 
}






window.generarCalendarioAleatorio = function () {
  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const tipos = ["almuerzo", "cena"];

  calendario = {};
  dias.forEach(dia => {
    calendario[dia] = { almuerzo: "", cena: "" };
  });

  dias.forEach(dia => {
    tipos.forEach(tipo => {
      let platoValido = null;
      let intentos = 0;

      while (!platoValido && intentos < 50) {
        intentos++;
        const candidato = generarPlatoAleatorio();
        if (!candidato) break;

        const otroTipo = tipo === "almuerzo" ? "cena" : "almuerzo";
        if (calendario[dia][otroTipo] === candidato) continue;
        if (contarRepeticiones(candidato) >= 2) continue;

        platoValido = candidato;
      }

      if (platoValido) {
        calendario[dia][tipo] = platoValido;
      }
    });
  });

  actualizarCalendario();
  guardarCalendario();
  mostrarMensaje("✅ Calendario generado aleatoriamente.", "exito");
};



//CALENDARIO ALEATORIO

// Genera 1 plato aleatorio usando las <option> del HTML
window.generarPlatoAleatorio = function () {
  const verduras  = window.getOpciones("verdura");
  const proteinas = window.getOpciones("proteina");
  const hidratos  = window.getOpciones("hidrato");
  const completos = window.getOpciones("completo");

  // 50% plato completo, si hay. Si no, combo V+P+H
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


// Genera semana Lun–Vie en almuerzo y cena
window.generarCalendarioAleatorio = function () {
  const dias  = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const tipos = ["almuerzo", "cena"];

  // Reinicio calendario base
  calendario = {};
  dias.forEach(d => (calendario[d] = { almuerzo: "", cena: "" }));

  dias.forEach(dia => {
    tipos.forEach(tipo => {
      let platoValido = null;
      let intentos = 0;

      while (!platoValido && intentos < 50) {
        intentos++;
        const candidato = window.generarPlatoAleatorio();
        if (!candidato) break;

        const otroTipo = (tipo === "almuerzo") ? "cena" : "almuerzo";
        // no repetir mismo plato en el mismo día
        if (calendario[dia][otroTipo] === candidato) continue;
        // máximo 2 veces por semana
        if (typeof contarRepeticiones === "function" && contarRepeticiones(candidato) >= 2) continue;

        platoValido = candidato;
      }

      if (platoValido) {
        calendario[dia][tipo] = platoValido;
      } else {
        console.warn(`⚠️ No se pudo asignar plato para ${dia} (${tipo})`);
      }
    });
  });

  if (typeof actualizarCalendario === "function") actualizarCalendario();
  if (typeof guardarCalendario === "function") guardarCalendario();
  if (typeof mostrarMensaje === "function") {
    mostrarMensaje("✅ Calendario generado aleatoriamente.", "exito");
  } else {
    console.log("✅ Calendario generado:", calendario);
  }
};





