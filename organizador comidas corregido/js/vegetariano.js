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
// GENERADOR ALEATORIO (Vegetariano) — CORREGIDO
// =========================
window.getOpciones = window.getOpciones || function (idSelect) {
  const select = document.getElementById(idSelect);
  if (!select) {
    console.warn(`⚠️ No encontré el <select> #${idSelect}.`);
    return [];
  }
  return Array.from(select.options)
    .map(opt => (opt.value ?? "").trim())
    .filter(val => val !== "");
};

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

// ✅ CORREGIDA: evita repetir categoría similar en el mismo día
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

        // ❌ No repetir mismo plato
        if (calendario[dia][otroTipo] === candidato) continue;

        // ❌ No más de 2 veces por semana
        if (typeof contarRepeticiones === "function" && contarRepeticiones(candidato) >= 2) continue;

        // ❌ No repetir categoría similar (pasta, milanesa, tarta, etc.)
        if (typeof mismoDiaValido === "function" && !mismoDiaValido(dia, candidato, calendario, categoriasVegetariano)) continue;

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
    mostrarMensaje("✅ Calendario vegetariano generado aleatoriamente.", "exito");
  } else {
    console.log("✅ Calendario vegetariano generado:", calendario);
  }
};



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
  "Ravioles con salsa bolognesa": "pasta",
  "Ñoquis con salsa de tomate": "pasta",
  "Ñoquis con salsa mixta": "pasta",
  "Ñoquis con salsa bolognesa": "pasta",
  "Fideos": "pasta",

  "Tarta de espinaca, q. cremoso, cebolla y puerro": "tarta",
  "Tarta capresse ( T. cherry, q. cremoso, albahaca, aceitunas negras)": "tarta",
  "Tarta de zapallito, q. cremoso, huevo y cebolla":"tarta"
};



// =========================
// ALIMENTOS QUE SOLO SE PUEDEN REPETIR 3 VECES POR SEMANA
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
// INGREDIENTES DE PLATOS COMPLETOS VEGETARIANOS PARA LISTA DE COMPRAS
// =========================
const ingredientesPlatosCompletosVeg = {
  "Tarta de espinaca, q. cremoso, cebolla y puerro": ["Espinaca", "Queso cremoso", "Cebolla", "Puerro", "Masa de tarta"],
  "Tarta capresse ( T. cherry, q. cremoso, albahaca, aceitunas negras)": ["Tomate cherry", "Queso cremoso", "Albahaca", "Aceitunas negras", "Masa de tarta"],
  "Tarta de zapallito, q. cremoso, huevo y cebolla": ["Zapallito", "Queso cremoso", "Huevo", "Cebolla", "Masa de tarta"],
  "Milanesas de berenjena gratinadas + guacamole": ["Berenjena", "Pan rallado", "Huevo", "Queso cremoso", "Palta", "Limón", "Cebolla", "Tomate"],
  "Pastel de papa y zapallo": ["Papa", "Zapallo", "Queso cremoso"],
  "Omeltte de queso y espinaca + Ens. Lenteja y tomate": ["Huevo", "Queso cremoso", "Espinaca", "Lentejas", "Tomate"],
  "Crepes de espinaca,cebolla, c.verdeo + salsa de morrón y crema": ["Harina", "Huevo", "Leche", "Espinaca", "Cebolla", "Cebolla verdeo", "Morrón", "Crema"],
  "Wok de fideos de arroz + verduras(pimiento,cebolla,zucchini,zanahoria)": ["Fideos de arroz", "Pimiento", "Cebolla", "Zucchini", "Zanahoria", "Aceite", "Salsa de soja"],
  "Fajitas de verduras varias(cebolla, pimiento, zanahoria, berenjena)": ["Fajitas", "Cebolla", "Pimiento", "Zanahoria", "Berenjena", "Aceite", "Especias"],
  "Torrejas de arroz + ensalada de zanahoria , rucula, tomate y huevo": ["Arroz", "Huevo", "Pan rallado", "Zanahoria", "Rúcula", "Tomate", "Huevo"],
  "Ravioles con salsa de tomate": ["Ravioles", "Tomate", "Cebolla", "Ajo", "Aceite"],
  "Ravioles con salsa mixta": ["Ravioles", "Tomate", "Cebolla", "Ajo", "Aceite", "Crema"],
  "Ñoquis con salsa de tomate": ["Ñoquis", "Tomate", "Cebolla", "Ajo", "Aceite"],
  "Ñoquis con salsa mixta": ["Ñoquis", "Tomate", "Cebolla", "Ajo", "Aceite", "Crema"]
};



















