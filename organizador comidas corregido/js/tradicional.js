// =========================
// VALIDACIÓN DE PLATOS (versión tradicional)
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
    // Asignación al calendario
    if (seleccion) {
      const { dia, tipo } = seleccion;
      const otroTipo = (tipo === 'almuerzo') ? 'cena' : 'almuerzo';

      if (calendario[dia][otroTipo] === platoFinal) {
        mostrarMensaje(`❌ No podés repetir "${platoFinal}" en ${dia}.`, 'error');
      } else if (!mismoDiaValido(dia, platoFinal, calendario, categoriasTradicional)) {
        mostrarMensaje(`❌ No podés asignar "${platoFinal}" en ${dia} porque ya hay una comida similar.`, 'error');
      } else if (contarRepeticiones(platoFinal) >= 2 && calendario[dia][tipo] !== platoFinal) {
        mostrarMensaje(`❌ El plato "${platoFinal}" ya fue asignado 2 veces esta semana.`, 'error');
      } else {

        // =========================
        // NUEVA VALIDACIÓN: GRUPOS LIMITADOS A 3 POR SEMANA
        // =========================
        const validacionGrupo = validarGruposLimitados(platoFinal, calendario, gruposLimitadosTradicional);
        if (!validacionGrupo.ok) {
          mostrarMensaje(`❌ Ya usaste demasiados platos del grupo "${validacionGrupo.grupo}" (máx 3).`, 'error');
          return;
        }

        // Validar ingredientes restringidos
        const validacionIngredientes = validarIngredientesRestringidos(platoFinal, calendario, restringidosTradicional);
        if (!validacionIngredientes.ok) {
          mostrarMensaje(`❌ El ingrediente "${validacionIngredientes.ingrediente}" ya fue usado ${validacionIngredientes.usoActual} veces (máx ${validacionIngredientes.limite}).`, 'error');
        } else {
          calendario[dia][tipo] = platoFinal;
          actualizarCalendario();
          mostrarMensaje(`✅ Plato agregado en ${dia} (${tipo}).`, 'exito');
          limpiarSelects();
          seleccion = null;
        }
      }
    } else {

      // =========================
      // Validación de grupos en asignación automática
      // =========================
      const validacionGrupo = validarGruposLimitados(platoFinal, calendario, gruposLimitadosTradicional);
      if (!validacionGrupo.ok) {
        mostrarMensaje(`❌ Ya usaste demasiados platos del grupo "${validacionGrupo.grupo}" (máx 3).`, 'error');
        return;
      }

      const validacionIngredientes = validarIngredientesRestringidos(platoFinal, calendario, restringidosTradicional);
      if (!validacionIngredientes.ok) {
        mostrarMensaje(`❌ El ingrediente "${validacionIngredientes.ingrediente}" ya fue usado ${validacionIngredientes.usoActual} veces (máx ${validacionIngredientes.limite}).`, 'error');
        return;
      }

      const ok = asignarAcalendario(platoFinal, categoriasTradicional);
      if (ok) {
        mostrarMensaje('✅ Plato válido. Asignado correctamente al calendario.', 'exito');
        limpiarSelects();
      } else {
        mostrarMensaje(`❌ El plato "${platoFinal}" ya fue asignado 2 veces esta semana.`, 'error');
      }
    }
    return;
  }

  // Motivos específicos
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
  console.log("guardarCalendario: No hay usuario logueado, no se guarda");
}

function cargarCalendario(){ 
  console.log("cargarCalendario: No hay usuario logueado, usando calendario vacío");
  dias.forEach(dia => calendario[dia] = {almuerzo:null,cena:null});
}



// =========================
// GENERADOR ALEATORIO (con exclusiones)
// =========================
window.getOpciones = window.getOpciones || function (idSelect) {
  const select = document.getElementById(idSelect);
  if (!select) return [];
  return Array.from(select.options)
    .map(opt => (opt.value ?? "").trim())
    .filter(val => val !== "");
};


// Genera un plato aleatorio
window.generarPlatoAleatorio = function () {
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
      alimentosExcluidosTradicional.some(prohibido =>
        alim.toLowerCase().includes(prohibido.toLowerCase())
      )
    );

    if (tieneProhibido) continue;

    return `${v}+ ${p}+ ${h}`;
  }

  console.warn("⚠️ No se encontró combinación válida sin alimentos excluidos.");
  return null;
};



// =========================
// GENERADOR DE CALENDARIO ALEATORIO
// =========================
window.generarCalendarioAleatorio = function () {
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
        const candidato = window.generarPlatoAleatorio();
        if (!candidato) break;

        const otroTipo = (tipo === "almuerzo") ? "cena" : "almuerzo";

        if (calendario[dia][otroTipo] === candidato) continue;
        if (contarRepeticiones(candidato) >= 2) continue;
        if (!mismoDiaValido(dia, candidato, calendario, categoriasTradicional)) continue;

        // Nueva validación: límite semanal por grupo
        const validacionGrupo = validarGruposLimitados(candidato, calendario, gruposLimitadosTradicional);
        if (!validacionGrupo.ok) continue;

        platoValido = candidato;
      }

      if (platoValido) calendario[dia][tipo] = platoValido;
    });
  });

  actualizarCalendario();
  guardarCalendario();
  mostrarMensaje("✅ Calendario semanal generado correctamente.", "exito");
};




// =========================
// FUNCIÓN DE VALIDACIÓN DE GRUPOS LIMITADOS
// =========================
function validarGruposLimitados(plato, calendario, grupos) {
  for (const grupo in grupos) {
    const lista = grupos[grupo];

    const pertenece = lista.some(nombre => plato.includes(nombre));
    if (!pertenece) continue;

    let contador = 0;

    for (const dia in calendario) {
      const comidas = calendario[dia];
      for (const tipo in comidas) {
        const actual = comidas[tipo];
        if (actual && lista.some(nombre => actual.includes(nombre))) {
          contador++;
        }
      }
    }

    if (contador >= 3) {
      return { ok: false, grupo, usoActual: contador };
    }
  }

  return { ok: true };
}



// =========================
// CATEGORÍAS DE ALIMENTOS SIMILARES (mismo día)
// =========================
const categoriasTradicional = {
  "Milanesa carne": "milanesa",
  "Milanesa pollo": "milanesa",
  "Milanesa cerdo": "milanesa",
  "Milanesa pescado": "milanesa",
  "Nugget de pollo": "milanesa",
  "Milanesas de berenjena gratinadas + guacamole": "milanesa",
  
  "Jamón cocido": "jamon",
  "Jamón crudo": "jamon",

  "Pastel de fuente (Puré mixto + carne, verdeo, pimiento y cebolla picada + Gratinado)": "papa",
  "Pure de papa":"papa",
  "Papa al horno":"papa",
  
  "Costeleta vaca": "costeleta",
  "Costeleta cerdo": "costeleta",
  
  "Pollo al horno":"pollo",
  "Pollo asado":"pollo",
  "Pata muslo pollo": "pollo",

  "Ravioles con salsa de tomate": "pasta",
  "Ravioles con salsa mixta": "pasta",
  "Ravioles con salsa bolognesa": "pasta",
  "Ñoquis con salsa de tomate": "pasta",
  "Ñoquis con salsa mixta": "pasta",
  "Ñoquis con salsa bolognesa": "pasta",
  "Fideos": "pasta",

  "Tarta de espinaca,q. cremoso,cebolla,puerro": "tarta",
  "Tarta capresse ( T. cherry, q. cremoso, albahaca, aceitunas negras)": "tarta",
  "Tarta de zapallito, q. cremoso,huevo, cebolla":"tarta",
  "Tarta de atún, q. cremoso, tomate, cebolla, huevo,pimiento,ajo": "tarta",
};



// =========================
// RESTRICCIONES SEMANALES DE CADA PLATO
// =========================
const restringidosTradicional = {
  "Milanesa carne": 3,
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
  "Pollo al horno":3,
  "Pollo asado":3,
  "Atún":3,
  "Costeleta vaca":3,
  "Costeleta cerdo":3,
  "Jamón cocido":3,
  "jamón crudo":3,

  "Arroz Blanco/ Integral/ Yamani":3,
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
// INGREDIENTES PARA LISTA DE COMPRAS
// =========================
const ingredientesPlatosCompletos = {
  "Tarta de espinaca,q. cremoso,cebolla,puerro": ["Espinaca", "Queso cremoso", "Cebolla", "Puerro", "Masa de tarta"],
  "Tarta capresse ( T. cherry, q. cremoso, albahaca, aceitunas negras)": ["Tomate cherry", "Queso cremoso", "Albahaca", "Aceitunas negras", "Masa de tarta"],
  "Tarta de zapallito, q. cremoso,huevo, cebolla": ["Zapallito", "Queso cremoso", "Huevo", "Cebolla", "Masa de tarta"],
  "Tarta de atún, q. cremoso, tomate, cebolla, huevo,pimiento,ajo": ["Atún", "Queso cremoso", "Tomate", "Cebolla", "Huevo", "Pimiento", "Ajo", "Masa de tarta"],
  "Pastel de fuente (Puré mixto + carne, verdeo, pimiento y cebolla picada + Gratinado)": ["Papa", "Zapallo", "Carne picada", "Cebolla verdeo", "Pimiento", "Cebolla", "Queso cremoso"],
  "Pata muslo + verduras al horno(cebolla,pimiento,zanahoria,papa)": ["Pata muslo pollo", "Cebolla", "Pimiento", "Zanahoria", "Papa"],
  "Omeltte de queso y espinaca + Ens. Lenteja y tomate": ["Huevo", "Queso cremoso", "Espinaca", "Lentejas", "Tomate"],
  "Milanesas de berenjena gratinadas + guacamole": ["Berenjena", "Pan rallado", "Huevo", "Queso cremoso", "Palta", "Limón", "Cebolla", "Tomate"],
  "Wok de carne + verduras(pimiento,cebolla,zucchini,zanahoria)": ["Carne", "Pimiento", "Cebolla", "Zucchini", "Zanahoria", "Aceite", "Salsa de soja"],
  "Wok de pollo + verduras(pimiento,cebolla,zucchini,zanahoria)": ["Pollo", "Pimiento", "Cebolla", "Zucchini", "Zanahoria", "Aceite", "Salsa de soja"],
  "Wok de fideos de arroz + verduras(pimiento,cebolla,zucchini,zanahoria)": ["Fideos de arroz", "Pimiento", "Cebolla", "Zucchini", "Zanahoria", "Aceite", "Salsa de soja"],
  "Fajitas de pollo y verduras salteadas(cebolla,pimiento,zanahoria)": ["Pollo", "Fajitas", "Cebolla", "Pimiento", "Zanahoria", "Aceite", "Especias"],
  "Ens. de  atún, huevo, cebolla, tomate, arroz": ["Atún", "Huevo", "Cebolla", "Tomate", "Arroz"],
  "Crepes des espinaca,cebolla, c.verdeo + salsa de morrón y crema": ["Harina", "Huevo", "Leche", "Espinaca", "Cebolla", "Cebolla verdeo", "Morrón", "Crema"],
  "Carne +verduras al horno(calabaza,cebolla, papa)": ["Carne", "Calabaza", "Cebolla", "Papa"],
  "Pescado  al paquete con verduras (cebolla,pimiento,c .verdeo)": ["Pescado", "Cebolla", "Pimiento", "Cebolla verdeo", "Papel aluminio"],
  "Torrejas de arroz + ensalada de zanahoria , rucula, tomate y huevo": ["Arroz", "Huevo", "Pan rallado", "Zanahoria", "Rúcula", "Tomate", "Huevo"],
  "Ravioles con salsa de tomate": ["Ravioles", "Tomate", "Cebolla", "Ajo", "Aceite"],
  "Ravioles con salsa mixta": ["Ravioles", "Tomate", "Cebolla", "Ajo", "Aceite", "Crema"],
  "Ravioles con salsa bolognesa": ["Ravioles", "Carne picada", "Tomate", "Cebolla", "Ajo"],
  "Ñoquis con salsa de tomate": ["Ñoquis", "Tomate", "Cebolla", "Ajo"],
  "Ñoquis con salsa mixta": ["Ñoquis", "Tomate", "Cebolla", "Ajo", "Aceite", "Crema"],
  "Ñoquis con salsa bolognesa": ["Ñoquis", "Carne picada", "Tomate", "Cebolla", "Ajo"]
};



// =========================
// EXCLUIDOS DEL GENERADOR ALEATORIO
// =========================
const alimentosExcluidosTradicional = [
  "Choclo",
  "Trigo burgol",
  "Porotos",
  "Jamón cocido",
  "jamón crudo",
  
];



// =========================
// GRUPOS DE ALIMENTOS LIMITADOS A 3 VECES POR SEMANA
// =========================
// 🟡 EJEMPLO: vos vas agregando más grupos aquí dentro
const gruposLimitadosTradicional = {
  "pollo": [
    "Milanesa pollo",
    "Medallon de pollo",
    "Nugget de pollo",
    "Filet pollo",
    "Pata muslo pollo",
    "Pechuga pollo",
    "Pollo al horno",
    "Pollo asado",

  ],

  "milanesa":[
   "Milanesa carne",
  "Milanesa pollo",
  "Milanesa cerdo",
  "Milanesa pescado",
  "Nugget de pollo",
  "Milanesas de berenjena gratinadas + guacamole",
  ],

  "tarta":[
  "Tarta de espinaca,q. cremoso,cebolla,puerro",
  "Tarta capresse ( T. cherry, q. cremoso, albahaca, aceitunas negras)",
  "Tarta de zapallito, q. cremoso,huevo, cebolla",
  "Tarta de atún, q. cremoso, tomate, cebolla, huevo,pimiento,ajo",
  ],
   "pasta":[
  "Ravioles con salsa de tomate",
  "Ravioles con salsa mixta",
  "Ravioles con salsa bolognesa",
  "Ñoquis con salsa de tomate",
  "Ñoquis con salsa mixta",
  "Ñoquis con salsa bolognesa",
  "Fideos",
 
  ],
};






























