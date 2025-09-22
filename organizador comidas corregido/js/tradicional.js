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
           } else if (!mismoDiaValido(dia, platoFinal, calendario, categoriasTradicional)) {
           mostrarMensaje(`❌ No podés asignar "${platoFinal}" en ${dia} Ya hay otra comida o plato muy similar en el día.`, 'error');
           } else if (contarRepeticiones(platoFinal) >= 2 && calendario[dia][tipo] !== platoFinal) {
           mostrarMensaje(`❌ El plato "${platoFinal}" ya fue asignado 2 veces esta semana.`, 'error');
           } else {
             // 🔒 Validar ingredientes restringidos
             const validacionIngredientes = validarIngredientesRestringidos(platoFinal, calendario, restringidosTradicional);
             if (!validacionIngredientes.ok) {
               mostrarMensaje(`❌ El ingrediente "${validacionIngredientes.ingrediente}" ya fue usado ${validacionIngredientes.usoActual} veces esta semana (máximo ${validacionIngredientes.limite}).`, 'error');
             } else {
               calendario[dia][tipo] = platoFinal;
               actualizarCalendario();
               mostrarMensaje(`✅ Plato agregado en ${dia} (${tipo}).`, 'exito');
             }
           }
           

      seleccion = null;
      limpiarSelects();
    } else {
      // 🔒 Validar ingredientes restringidos antes de asignar automáticamente
      const validacionIngredientes = validarIngredientesRestringidos(platoFinal, calendario, restringidosTradicional);
      if (!validacionIngredientes.ok) {
        mostrarMensaje(`❌ El ingrediente "${validacionIngredientes.ingrediente}" ya fue usado ${validacionIngredientes.usoActual} veces esta semana (máximo ${validacionIngredientes.limite}).`, 'error');
        limpiarSelects();
        return;
      }

      const ok = asignarAcalendario(platoFinal, categoriasTradicional);

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





// =========================
// LISTA PARA AGREGAR ALIMENTOS Y PLATOS QUE NO TIENEN QUE REPETIRSE EN EL MISMO DIA POR SER DE GRUPO SIMILAR
// =========================
//IMPORTANTE, CUANDO ES MAS DE UNA LIMITACION SE EESCRIBE ENTRE[] Ej: "Pastel de fuente":["papa", "carne"] 

const categoriasTradicional = {
  "Milanesa vaca": "milanesa",
  "Milanesa pollo": "milanesa",
  "Milanesa cerdo": "milanesa",
  "Milanesa pescado": "milanesa",
  "Nugget de pollo": "milanesa",
  "Milanesas de berenjena gratinadas + guacamole": "milanesa",

  
  "Pastel de fuente (Puré mixto + carne, verdeo, pimiento y cebolla picada + Gratinado)":"papa",
  "Pure de papa":"papa",
  "Papa al horno":"papa",
  
  
  "Costeleta vaca": "costeleta",
  "Costeleta cerdo": "costeleta",
  
  "pollo al horno":"pollo",
  "Pollo asado":"pollo",

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
const restringidosTradicional = {
  
  //PROTEINAS
  "Milanesa vaca": 3,
  "Milanesa pollo": 3,
  "Milanesa cerdo": 3,
  "Milanesa pescado": 3,
  "Milanesa de soja":3,
  "Hamburguesa vacuna":3,
  "Medallon de pollo":3,
  "Medallon de legumbre":3,
  "Nugget de pollo":3,
  "Bife vacuno":3,
  "Filet pollo":3,
  "Pata muslo pollo":3,
  
  "Pechuga pollo":3,
  "Filet pescado":3,
  "pollo al horno":3,
  "Pollo asado":3,
  "Atún":3,
  "Costeleta vaca":3,
  "Costeleta cerdo":3,
  "jamon cocido/crudo":3,

  //HIDRATOS:
  "Arroz(Blanco/ integral/ Yamani)":3,
  "Fideos":3,
  "Pure de papa":3,
  "Papa al horno":3,
  "Batata al horno":3,
  "Choclo":3,
  "Quinoa":3,
  "Cuscus":3,
  "Trigo burgol":3,
  "Lentejas":3,
  "Garbanzos":3,
  "Porotos":3,
};

// =========================
// INGREDIENTES DE PLATOS COMPLETOS PARA LISTA DE COMPRAS
// =========================
const ingredientesPlatosCompletos = {
  "Tarta de espinaca,queso,cebolla,puerro": ["Espinaca", "Queso", "Cebolla", "Puerro", "Masa de tarta"],
  "Tarta capresse ( T. cherry, q. cremoso, albahaca, aceitunas negras)": ["Tomate cherry", "Queso cremoso", "Albahaca", "Aceitunas negras", "Masa de tarta"],
  "Tarta de zapallito,queso,huevo, cebolla": ["Zapallito", "Queso", "Huevo", "Cebolla", "Masa de tarta"],
  "Tarta de atún, q. cremoso, tomate, cebolla, huevo,pimiento,ajo": ["Atún", "Queso cremoso", "Tomate", "Cebolla", "Huevo", "Pimiento", "Ajo", "Masa de tarta"],
  "Pastel de fuente (Puré mixto + carne, verdeo, pimiento y cebolla picada + Gratinado)": ["Papa", "Zapallo", "Carne picada", "Cebolla verdeo", "Pimiento", "Cebolla", "Queso rallado"],
  "Pata muslo + verduras al horno(cebolla,pimiento,zanahoria,papa)": ["Pata muslo de pollo", "Cebolla", "Pimiento", "Zanahoria", "Papa"],
  "Omeltte de queso y espinaca + Ens. Lenteja y tomate": ["Huevo", "Queso", "Espinaca", "Lentejas", "Tomate"],
  "Milanesas de berenjena gratinadas + guacamole": ["Berenjena", "Pan rallado", "Huevo", "Queso rallado", "Palta", "Limón", "Cebolla", "Tomate"],
  "Wok de carne + verduras(pimiento,cebolla,zucchini,zanahoria)": ["Carne", "Pimiento", "Cebolla", "Zucchini", "Zanahoria", "Aceite", "Salsa de soja"],
  "Wok de pollo + verduras(pimiento,cebolla,zucchini,zanahoria)": ["Pollo", "Pimiento", "Cebolla", "Zucchini", "Zanahoria", "Aceite", "Salsa de soja"],
  "Wok de fideos de arroz + verduras(pimiento,cebolla,zucchini,zanahoria)": ["Fideos de arroz", "Pimiento", "Cebolla", "Zucchini", "Zanahoria", "Aceite", "Salsa de soja"],
  "Fajitas de pollo y verduras salteadas(cebolla,pimiento,zanahoria)": ["Pollo", "Tortillas", "Cebolla", "Pimiento", "Zanahoria", "Aceite", "Especias"],
  "Ens. de  atún, huevo, cebolla, tomate, arroz": ["Atún", "Huevo", "Cebolla", "Tomate", "Arroz"],
  "Crepes des espinaca,cebolla, c.verdeo + salsa de morrón y crema": ["Harina", "Huevo", "Leche", "Espinaca", "Cebolla", "Cebolla verdeo", "Morrón", "Crema"],
  "Carne +verduras al horno(calabaza,cebolla, papa)": ["Carne", "Calabaza", "Cebolla", "Papa"],
  "Pescado  al paquete con verduras (cebolla,pimiento,c .verdeo)": ["Pescado", "Cebolla", "Pimiento", "Cebolla verdeo", "Papel aluminio"],
  "Torrejas de arroz + ensalada de zanahoria , rucula, tomate y huevo": ["Arroz", "Huevo", "Pan rallado", "Zanahoria", "Rúcula", "Tomate", "Huevo"],
  "Ravioles con salsa de tomate": ["Ravioles", "Tomate", "Cebolla", "Ajo", "Aceite"],
  "Ravioles con salsa mixta": ["Ravioles", "Tomate", "Cebolla", "Ajo", "Aceite", "Crema"],
  "Ravioles con salsa bolognesa": ["Ravioles", "Carne picada", "Tomate", "Cebolla", "Ajo"],
  "Ñoquis con salsa de tomate": ["Ñoquis", "Tomate", "Cebolla", "Ajo",],
  "Ñoquis con salsa mixta": ["Ñoquis", "Tomate", "Cebolla", "Ajo", "Aceite", "Crema"],
  "Ñoquis con salsa bolognesa": ["Ñoquis", "Carne picada", "Tomate", "Cebolla", "Ajo",]
};
















