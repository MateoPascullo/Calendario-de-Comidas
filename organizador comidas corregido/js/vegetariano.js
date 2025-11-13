// =========================
// VALIDACIÓN DE PLATOS (versión vegetariana)
// =========================
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

  let valido = false;
  let platoFinal = '';

  if (hasC && !hasV && !hasP && !hasH) {
    valido = true;
    platoFinal = c;
  } else if (hasV && hasP && hasH && !hasC) {
    valido = true;
    platoFinal = `${v}+ ${p}+ ${h}`;
  }

  if (valido) {
    if (seleccion) {
      const { dia, tipo } = seleccion;
      const otroTipo = (tipo === 'almuerzo') ? 'cena' : 'almuerzo';

      if (calendario[dia][otroTipo] === platoFinal) {
        mostrarMensaje(`❌ No podés repetir "${platoFinal}" en ${dia}.`, 'error');
      } else if (!mismoDiaValido(dia, platoFinal, calendario, categoriasVegetariano)) {
        mostrarMensaje(`❌ No podés asignar "${platoFinal}" en ${dia} porque ya hay un plato de la misma categoría.`, 'error');
      } else if (contarRepeticiones(platoFinal) >= 2 && calendario[dia][tipo] !== platoFinal) {
        mostrarMensaje(`❌ El plato "${platoFinal}" ya fue asignado 2 veces esta semana.`, 'error');
      } else {

        // 🟣 Nuevo → Validación de grupos limitados
        const vGrupo = validarGruposLimitados(platoFinal, calendario, gruposLimitadosVegetariano);
        if (!vGrupo.ok) {
          mostrarMensaje(`❌ Ya usaste demasiado el grupo "${vGrupo.grupo}" (${vGrupo.repeticiones}/3).`, 'error');
          return;
        }

        const validacionIngredientes = validarIngredientesRestringidos(platoFinal, calendario, restringidosVegetariano);
        if (!validacionIngredientes.ok) {
          mostrarMensaje(`❌ El ingrediente "${validacionIngredientes.ingrediente}" ya fue usado ${validacionIngredientes.usoActual} veces esta semana (máximo ${validacionIngredientes.limite}).`, 'error');
        } else {
          calendario[dia][tipo] = platoFinal;
          actualizarCalendario();
          mostrarMensaje(`✅ Plato agregado en ${dia} (${tipo}).`, 'exito');
          limpiarSelects();
          seleccion = null;
        }
      }
    } else {

      const vGrupo = validarGruposLimitados(platoFinal, calendario, gruposLimitadosVegetariano);
      if (!vGrupo.ok) {
        mostrarMensaje(`❌ Ya usaste demasiado el grupo "${vGrupo.grupo}" (${vGrupo.repeticiones}/3).`, 'error');
        return;
      }

      const validacionIngredientes = validarIngredientesRestringidos(platoFinal, calendario, restringidosVegetariano);
      if (!validacionIngredientes.ok) {
        mostrarMensaje(`❌ El ingrediente "${validacionIngredientes.ingrediente}" ya fue usado ${validacionIngredientes.usoActual} veces esta semana (máximo ${validacionIngredientes.limite}).`, 'error');
        return;
      }

      const ok = asignarAcalendario(platoFinal, categoriasVegetariano);
      if (ok) {
        mostrarMensaje('✅ Plato válido. Asignado correctamente al calendario.', 'exito');
        limpiarSelects();
      } else {
        mostrarMensaje(`❌ El plato "${platoFinal}" ya fue asignado 2 veces esta semana.`, 'error');
      }
    }
    return;
  }

  if (!hasV && !hasP && !hasH && !hasC) {
    mostrarMensaje('❌ No seleccionaste ningún alimento.', 'error');
  } else if (hasC && (hasV || hasP || hasH)) {
    mostrarMensaje('❌ El plato completo no puede combinarse con otros alimentos.', 'error');
  } else {
    mostrarMensaje('❌ En esta versión necesitás verdura + proteína + hidrato para un plato válido.', 'error');
  }
}



// =========================
// STORAGE - Solo Firestore
// =========================
function guardarCalendario(){ 
  console.log("guardarCalendario: No hay usuario logueado, no se guarda");
}

function cargarCalendario(){ 
  console.log("cargarCalendario: No hay usuario logueado, usando calendario vacío");
  dias.forEach(dia => calendario[dia] = {almuerzo:null,cena:null});
}



// =========================
// GENERADOR ALEATORIO (Vegetariano con exclusiones)
// =========================
window.getOpciones = window.getOpciones || function (idSelect) {
  const select = document.getElementById(idSelect);
  if (!select) return [];
  return Array.from(select.options)
    .map(opt => (opt.value ?? "").trim())
    .filter(val => val !== "");
};



// Genera un plato aleatorio vegetariano
window.generarPlatoAleatorioVeg = function () {
  const verduras  = window.getOpciones("verdura");
  const proteinas = window.getOpciones("proteina");
  const hidratos  = window.getOpciones("hidrato");
  const completos = window.getOpciones("completo");

  const modo = (completos.length > 0 && Math.random() < 0.5) ? "completo" : "combo";

  if (modo === "completo") {
    return completos[Math.floor(Math.random() * completos.length)];
  }

  if (!verduras.length || !proteinas.length || !hidratos.length) return null;

  let intento = 0;
  while (intento < 50) {
    intento++;

    const v = verduras[Math.floor(Math.random() * verduras.length)];
    const p = proteinas[Math.floor(Math.random() * proteinas.length)];
    const h = hidratos[Math.floor(Math.random() * hidratos.length)];

    const combo = [v, p, h];
    const tieneProhibido = combo.some(alim =>
      alimentosExcluidosVeg.some(prohibido =>
        alim.toLowerCase().includes(prohibido.toLowerCase())
      )
    );

    if (tieneProhibido) continue;

    return `${v}+ ${p}+ ${h}`;
  }

  return null;
};



// Genera calendario aleatorio
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
        if (typeof mismoDiaValido === "function" && !mismoDiaValido(dia, candidato, calendario, categoriasVegetariano)) continue;

        // 🟣 Nuevo → Validación de grupos limitados
        const vGrupo = validarGruposLimitados(candidato, calendario, gruposLimitadosVegetariano);
        if (!vGrupo.ok) continue;

        platoValido = candidato;
      }

      if (platoValido) calendario[dia][tipo] = platoValido;
    });
  });

  if (typeof actualizarCalendario === "function") actualizarCalendario();
  if (typeof guardarCalendario === "function") guardarCalendario();
  if (typeof mostrarMensaje === "function") mostrarMensaje("✅ Calendario vegetariano generado aleatoriamente.", "exito");
};


// =========================
//  FUNCIÓN DE VALIDACION DE GRUPOS LIMITADOS
// =========================
function validarGruposLimitados(plato, calendario, grupos) {
  for (const [grupo, lista] of Object.entries(grupos)) {
    if (lista.includes(plato)) {

      let repeticiones = 0;
      for (const dia in calendario) {
        const { almuerzo, cena } = calendario[dia];
        if (lista.includes(almuerzo)) repeticiones++;
        if (lista.includes(cena)) repeticiones++;
      }

      if (repeticiones >= 3) {
        return {
          ok: false,
          grupo,
          repeticiones
        };
      }
    }
  }
  return { ok: true };
}


// =========================
// CATEGORÍAS SIMILARES
// =========================
const categoriasVegetariano = {
  "Milanesas de berenjena gratinadas + guacamole": "milanesa",
  "Milanesa de legumbre": "milanesa",
  "Medallon de legumbre":"milanesa",
  "Pure de papa":"papa",
  "Papa al horno":"papa",
  "Ravioles con salsa de tomate": "pasta",
  "Ravioles con salsa mixta": "pasta",
  "Ñoquis con salsa de tomate": "pasta",
  "Ñoquis con salsa mixta": "pasta",
  "Fideos": "pasta",
  "Tarta de espinaca, q. cremoso, cebolla y puerro": "tarta",
  "Tarta capresse ( T. cherry, q. cremoso, albahaca, aceitunas negras)": "tarta",
  "Tarta de zapallito, q. cremoso, huevo y cebolla":"tarta"
};



// =========================
// RESTRINGIDOS (3 veces por semana)
// =========================
const restringidosVegetariano = {
  "Medallon de legumbre":3,
  "Milanesa de legumbre":3,
  "Arroz Blanco/ Integral/ Yamani":3,
  "fideos":3,
  "Pure de papa":3,
  "Papa al horno":3,
  "Batata al horno":3,
  "Choclo":3,
  "Quinoa":3,
  "Cuscus":3,
  "Trigo-burgol":3
};




// =========================
// ALIMENTOS EXCLUIDOS DE LA GENERACIÓN ALEATORIA
// =========================
const alimentosExcluidosVeg = [ 
  "Soja texturizada",
  "Tempeh",
  "Ricota",
  "Quesos",
  "Choclo",
];



// =========================
// GRUPOS DE ALIMENTOS LIMITADOS A 3 VECES POR SEMANA (VEGETARIANO)
// ➜ Acá agregás vos los grupos que quieras
// =========================
const gruposLimitadosVegetariano = {
  
   "tarta": [
    "Tarta de espinaca, q. cremoso, cebolla y puerro",
    "Tarta capresse ( T. cherry, q. cremoso, albahaca, aceitunas negras)",
    "Tarta de zapallito, q. cremoso, huevo y cebolla"
  ],
  
  "pasta":[
  "Ravioles con salsa de tomate",
  "Ravioles con salsa mixta",
  "Ñoquis con salsa de tomate",
  "Ñoquis con salsa mixta",
  "Fideos",
  ]
};



















