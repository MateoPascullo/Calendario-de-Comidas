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
    valido = true; 
    platoFinal = c;
    console.log('Razon: Plato completo solo (veg)');
  } else if (hasV && hasP && hasH && !hasC) {
    valido = true; 
    platoFinal = `${v}+ ${p}+ ${h}`;
    console.log('Razon: Verdura + Proteína + Hidrato (veg)');
  } else {
    console.log('Razon: NO cumple reglas válidas (veg)');
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
        // 🔒 Validar ingredientes restringidos
        const validacionIngredientes = validarIngredientesRestringidos(platoFinal, calendario, restringidosVegetariano);
        if (!validacionIngredientes.ok) {
          mostrarMensaje(`❌ El ingrediente "${validacionIngredientes.ingrediente}" ya fue usado ${validacionIngredientes.usoActual} veces esta semana (máximo ${validacionIngredientes.limite}).`, 'error');
        } else {
          // ✅ Éxito
          calendario[dia][tipo] = platoFinal;
          actualizarCalendario();
          mostrarMensaje(`✅ Plato agregado en ${dia} (${tipo}).`, 'exito');
          limpiarSelects();   // solo limpiar si se agregó bien
          seleccion = null;   // solo borrar selección si se agregó bien
        }
      }

      // 🚫 No reseteamos seleccion ni limpiamos selects en caso de error

    } else {
      // 🔒 Validar ingredientes restringidos antes de asignar automáticamente
      const validacionIngredientes = validarIngredientesRestringidos(platoFinal, calendario, restringidosVegetariano);
      if (!validacionIngredientes.ok) {
        mostrarMensaje(`❌ El ingrediente "${validacionIngredientes.ingrediente}" ya fue usado ${validacionIngredientes.usoActual} veces esta semana (máximo ${validacionIngredientes.limite}).`, 'error');
        return;  // no limpiar selects ni borrar seleccion
      }

      const ok = asignarAcalendario(platoFinal, categoriasVegetariano);
      if (ok) {
        mostrarMensaje('✅ Plato válido. Asignado correctamente al calendario.', 'exito');
        limpiarSelects();  // solo limpiar si fue exitoso
      } else {
        mostrarMensaje(`❌ El plato "${platoFinal}" ya fue asignado 2 veces esta semana.`, 'error');
      }
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
    mostrarMensaje('❌ En esta versión necesitás verdura + proteína + hidrato para un plato válido.', 'error');
  } else {
    mostrarMensaje('❌ En esta versión necesitás verdura + proteína + hidrato para un plato válido.', 'error');
  }
}




// =========================
// STORAGE - Solo Firestore
// =========================
function guardarCalendario(){ 
  // Esta función será sobrescrita por Firebase cuando el usuario esté logueado
  // Si no hay usuario logueado, no guardamos nada
  console.log("guardarCalendario: No hay usuario logueado, no se guarda");
}

function cargarCalendario(){ 
  // Esta función será sobrescrita por Firebase cuando el usuario esté logueado
  // Si no hay usuario logueado, usamos calendario vacío
  console.log("cargarCalendario: No hay usuario logueado, usando calendario vacío");
  dias.forEach(dia => calendario[dia] = {almuerzo:null,cena:null});
}


// =========================
// GENERADOR ALEATORIO (Vegetariano)
// =========================

// Lee las opciones desde los <select> del HTML
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

// Genera un plato aleatorio vegetariano
window.generarPlatoAleatorioVeg = function () {
  const verduras  = window.getOpciones("verdura");
  const proteinas = window.getOpciones("proteina");
  const hidratos  = window.getOpciones("hidrato");
  const completos = window.getOpciones("completo");

  // En vegetariano solo se permite: 
  // 1) un completo, o 
  // 2) Verdura + Proteína + Hidrato
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


// Genera la semana Lun–Vie en almuerzo y cena (vegetariano)
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
    mostrarMensaje("✅ Calendario vegetariano generado aleatoriamente.", "exito");
  } else {
    console.log("✅ Calendario vegetariano generado:", calendario);
  }
};







// =========================
// LISTA PARA AGREGAR ALIMENTOS Y PLATOS QUE NO TIENEN QUE REPETIRSE EN EL MISMO DIA POR SER DE GRUPO SIMILAR
// =========================
//IMPORTANTE, CUANDO ES MAS DE UNA LIMITACION SE EESCRIBE ENTRE[] Ej: "Pastel de fuente":["papa", "carne"] 
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

  "Tarta de espinaca,queso,cebolla,puerro": "tarta",
  "Tarta capresse ( T. cherry, q. cremoso, albahaca, aceitunas negras)": "tarta",
  "Tarta de atún, q. cremoso, tomate, cebolla, huevo,pimiento,ajo": "tarta",



};

// =========================
// ALIMENTOS QUE SOLO SE PUEDEN REPETIR 3 VECES POR SEMANA
// =========================
const restringidosVegetariano = {
  
  //PROTEINAS
  "Medallon de legumbre":3,
  "Milanesa de legumbre":3,
 
 //HIDRATOS
  "Arroz Blanco/ Integral/ Yamani":3,
  "fideos":3,
  "Pure de papa":3,
  "Papa al horno":3,
  "Batata al horno":3,
  "Choclo":3,
  "Quinoa":3,
  "Cuscus":3,
  "Trigo-burgol":3,
  
   
};

// =========================
// INGREDIENTES DE PLATOS COMPLETOS VEGETARIANOS PARA LISTA DE COMPRAS
// =========================
const ingredientesPlatosCompletosVeg = {
  "Tarta de espinaca, queso, cebolla y puerro": ["Espinaca", "Queso", "Cebolla", "Puerro", "Masa de tarta"],
  "Tarta capresse ( T. cherry, q. cremoso, albahaca, aceitunas negras)": ["Tomate cherry", "Queso cremoso", "Albahaca", "Aceitunas negras", "Masa de tarta"],
  "Tarta de zapallito, queso, huevo y cebolla": ["Zapallito", "Queso", "Huevo", "Cebolla", "Masa de tarta"],
  "Milanesas de berenjena gratinadas + guacamole": ["Berenjena", "Pan rallado", "Huevo", "Queso rallado", "Palta", "Limón", "Cebolla", "Tomate"],
  "Pastel de papa y zapallo": ["Papa", "Zapallo", "Queso"],
  "Omeltte de queso y espinaca + Ens. Lenteja y tomate": ["Huevo", "Queso", "Espinaca", "Lentejas", "Tomate"],
  "Crepes de espinaca,cebolla, c.verdeo + salsa de morrón y crema": ["Harina", "Huevo", "Leche", "Espinaca", "Cebolla", "Cebolla verdeo", "Morrón", "Crema"],
  "Wok de fideos de arroz + verduras(pimiento,cebolla,zucchini,zanahoria)": ["Fideos de arroz", "Pimiento", "Cebolla", "Zucchini", "Zanahoria", "Aceite", "Salsa de soja"],
  "Fajitas de verduras varias(cebolla, pimiento, zanahoria, berenjena)": ["Fajitas", "Cebolla", "Pimiento", "Zanahoria", "Berenjena", "Aceite", "Especias"],
  "Torrejas de arroz + ensalada de zanahoria , rucula, tomate y huevo": ["Arroz", "Huevo", "Pan rallado", "Zanahoria", "Rúcula", "Tomate", "Huevo"],
  "Ravioles con salsa de tomate": ["Ravioles", "Tomate", "Cebolla", "Ajo", "Aceite"],
  "Ravioles con salsa mixta": ["Ravioles", "Tomate", "Cebolla", "Ajo", "Aceite", "Crema"],
  "Ñoquis con salsa de tomate": ["Ñoquis", "Tomate", "Cebolla", "Ajo", "Aceite"],
  "Ñoquis con salsa mixta": ["Ñoquis", "Tomate", "Cebolla", "Ajo", "Aceite", "Crema"]
};













