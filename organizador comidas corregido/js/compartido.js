// =========================
// VARIABLES Y ESTADO COMÚN
// =========================
const dias = ['Lunes','Martes','Miércoles','Jueves','Viernes']; 
let calendario = {}; 
let seleccion = null;
dias.forEach(dia => calendario[dia] = { almuerzo:null, cena:null });

// =========================
// ENSALADA CUSTOM
// =========================
document.getElementById('verdura').addEventListener('change', function () {
  const isSalad = this.value === 'ensaladas';
  document.getElementById('ensalada').style.display = isSalad ? 'block' : 'none';
});

function copiarEnsalada() {
  const coccion = document.querySelector('input[name="coccion"]:checked');
  if (!coccion) {
    mostrarMensaje('❌ Falta elegir método de cocción.','error');
    return;
  }

  const checks = document.querySelectorAll('#ensalada input[type="checkbox"]:checked');
  const seleccion = Array.from(checks).map(c => c.value);
  if (!seleccion.length) {
    mostrarMensaje('❌ Seleccioná al menos una verdura.','error');
    return;
  }

  const finalStr = `${coccion.value} (<span class="verduras-paren">${seleccion.join(', ')}</span>)`;

  const optCustom = document.getElementById('verduraCustom');
  optCustom.value = `${coccion.value} (${seleccion.join(', ')})`;
  optCustom.innerHTML = `🥗 Ensalada: ${finalStr}`;
  optCustom.style.display = '';
  optCustom.selected = true;

  document.getElementById('ensalada').style.display = 'none';
  document.querySelectorAll('#ensalada input[type="checkbox"]').forEach(c => c.checked = false);
  document.querySelectorAll('#ensalada input[name="coccion"]').forEach(r => r.checked = false);

  // scroll de arma tu ensalada
    // mover scroll arriba al título principal
  irAPlatoSemana();



}


// =========================
// SELECTORES Y RESET
// =========================
function getSeleccionados(){
  const vb=document.getElementById('verdura').value;
  const sub=document.getElementById('ensalada').value;
  const verdura=(vb==='ensaladas' && sub)?sub:vb;
  return { 
    verdura, 
    proteina:document.getElementById('proteina').value, 
    hidrato:document.getElementById('hidrato').value, 
    completo:document.getElementById('completo').value 
  };
}

function limpiarSelects(){ 
  ['verdura','proteina','hidrato','completo'].forEach(id=>document.getElementById(id).value=''); 
  document.getElementById('ensalada').style.display='none'; 
}

// =========================
// VALIDACIONES DE FRECUENCIA
// =========================
function contarRepeticiones(plato) {
  let rep = 0;
  dias.forEach(d => {
    if (calendario[d].almuerzo === plato) rep++;
    if (calendario[d].cena === plato) rep++;
  });
  return rep;
}


// =========================
// FUNCIONES PARA DETECTAR INGREDIENTES EN PLATOS COMBINADOS
// =========================

// Normaliza texto para comparaciones (quita acentos, espacios extra, etc.)
function normalizarTexto(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Extrae todas las partes de un plato (ingredientes individuales)
function plateToParts(plate) {
  if (!plate) return [];
  const raw = String(plate).trim();
  const set = new Set();

  // Agregar el plato completo
  set.add(raw);
  
  // Dividir por "+" (combinaciones principales)
  raw.split('+').forEach(p => { 
    if (p && p.trim()) set.add(p.trim()); 
  });
  
  // Extraer contenido de paréntesis
  const parenRe = /\(([^)]+)\)/g;
  let m;
  while ((m = parenRe.exec(raw)) !== null) {
    m[1].split(',').forEach(p => { 
      if (p && p.trim()) set.add(p.trim()); 
    });
  }
  
  // Dividir por "/" (alternativas)
  raw.split('/').forEach(p => { 
    if (p && p.trim()) set.add(p.trim()); 
  });
  
  // Dividir por "," (listas)
  raw.split(',').forEach(p => { 
    if (p && p.trim()) set.add(p.trim()); 
  });

  return Array.from(set)
    .filter(Boolean)
    .map(s => normalizarTexto(s));
}

// Verifica si un plato contiene un ingrediente específico
function plateContainsIngredient(plate, ingredient) {
  const ingNorm = normalizarTexto(ingredient);
  const parts = plateToParts(plate);
  
  // Verificación exacta
  if (parts.includes(ingNorm)) return true;
  
  // Verificación parcial (para ingredientes que pueden estar dentro de otros)
  return parts.some(p => p.indexOf(ingNorm) !== -1);
}

// Cuenta cuántas veces aparece un ingrediente específico en el calendario
function contarIngredienteEnCalendario(ingrediente, calendario) {
  let contador = 0;
  
  dias.forEach(dia => {
    if (calendario[dia].almuerzo && plateContainsIngredient(calendario[dia].almuerzo, ingrediente)) {
      contador++;
    }
    if (calendario[dia].cena && plateContainsIngredient(calendario[dia].cena, ingrediente)) {
      contador++;
    }
  });
  
  return contador;
}

// Valida si un plato excede los límites de ingredientes restringidos
function validarIngredientesRestringidos(plato, calendario, restringidos) {
  // Separar por partes en caso de combinados
  const partes = plato.split('+').map(p => p.trim());

  for (const parte of partes) {
    if (restringidos[parte]) {
      // Contar cuántas veces aparece este ingrediente en todo el calendario
      let count = 0;
      for (const dia in calendario) {
        for (const tipo in calendario[dia]) {
          const platoDia = calendario[dia][tipo];
          if (platoDia) {
            const partesDia = platoDia.split('+').map(p => p.trim());
            if (partesDia.includes(parte)) {
              count++;
            }
          }
        }
      }
      if (count >= restringidos[parte]) {
        return {
          ok: false,
          ingrediente: parte,
          usoActual: count,
          limite: restringidos[parte]
        };
      }
    }
  }

  return { ok: true };
}



function contarRepeticionesAlimento(alimento, calendario) {
  let rep = 0;
  dias.forEach(d => {
    if (calendario[d].almuerzo === alimento) rep++;
    if (calendario[d].cena === alimento) rep++;
  });
  return rep;
}

// Revisa si un plato excede su límite en la lista de restringidos
function validarRestriccion(plato, calendario, listaRestringidos) {
  if (!listaRestringidos || !listaRestringidos[plato]) return { ok: true };
  const limite = listaRestringidos[plato];
  if (contarRepeticionesAlimento(plato, calendario) >= limite) {
    return { ok: false, reason: 'overRestricted', plate: plato, limite };
  }
  return { ok: true };
}


function agregarPlato(dia, tipo, plato, categoriasMapeadas) {
  if (!plato) return false;

  const otroTipo = (tipo === 'almuerzo') ? 'cena' : 'almuerzo';

  // ❌ No repetir mismo plato exacto en el mismo día
  if (calendario[dia][otroTipo] === plato) {
    mostrarMensaje(`❌ No podés repetir "${plato}" en ${dia}.`, 'error', 6000);
    return false;
  }

  // ❌ No repetir categorías en el mismo día
  if (!mismoDiaValido(dia, plato, calendario, categoriasMapeadas)) {
    mostrarMensaje(`❌ Ya hay un plato similar en ${dia}.`, 'error', 6000);
    return false;
  }

  // ❌ No más de 2 veces por semana
  if (contarRepeticiones(plato) >= 2 && calendario[dia][tipo] !== plato) {
    mostrarMensaje(`❌ El plato "${plato}" ya fue asignado 2 veces esta semana.`, 'error', 6000);
    return false;
  }

  // 🔒 Validar ingredientes restringidos según versión
  const listaRestringidos = (typeof restringidosTradicional !== "undefined") 
    ? restringidosTradicional 
    : (typeof restringidosVegetariano !== "undefined") 
      ? restringidosVegetariano 
      : null;

  if (listaRestringidos) {
    const validacionIngredientes = validarIngredientesRestringidos(plato, calendario, listaRestringidos);
    if (!validacionIngredientes.ok) {
      mostrarMensaje(`❌ El ingrediente "${validacionIngredientes.ingrediente}" ya fue usado ${validacionIngredientes.usoActual} veces esta semana (máximo ${validacionIngredientes.limite}).`, 'error', 6000);
      return false;
    }
  }

  // ✅ Si pasa todas, asignar
  calendario[dia][tipo] = plato;
  return true;
}


function asignarAcalendario(plato, categorias){
  let rep=0; 
  dias.forEach(d=>{ 
    if(calendario[d].almuerzo===plato) rep++; 
    if(calendario[d].cena===plato) rep++; 
  });
  if(rep>=2) return false;
  let disp=[...dias];
  while(disp.length){
    let dia=disp[Math.floor(Math.random()*disp.length)];
    let comida=Math.random()<.5?'almuerzo':'cena';
    if(!calendario[dia][comida]){
      if(calendario[dia].almuerzo!==plato && calendario[dia].cena!==plato){
        // ✅ validación extra por categorías
        if (!categorias || mismoDiaValido(dia, plato, calendario, categorias)) {
          calendario[dia][comida]=plato; 
          actualizarCalendario(); 
          return true;
        }
      }
    }
    disp.splice(disp.indexOf(dia),1);
  }
  return false;
}


function resetearCalendario(){ 
  dias.forEach(d=>calendario[d]={almuerzo:null,cena:null}); 
  actualizarCalendario(); 
}

// =========================
// RENDER DEL CALENDARIO
// =========================
function actualizarCalendario(){
  guardarCalendario(); // esta función se define en app-normal o app-veg
  const cuerpo=document.getElementById('calendario-body'); 
  cuerpo.innerHTML='';
  const hoy=new Date(); 
  let indiceHoy=hoy.getDay()-1; 
  if(indiceHoy<0||indiceHoy>4) indiceHoy=null;
  dias.forEach((dia,i)=>{
    const esHoy = i===indiceHoy;
    cuerpo.innerHTML+=`
      <tr${esHoy?' style="background-color:#fff8dc;"':''}>
        <td data-label="Día">${dia}</td>
        <td data-label="Almuerzo" onclick="seleccionarCelda('${dia}','almuerzo')">${crearContenidoCelda(dia,'almuerzo')}</td>
        <td data-label="Cena" onclick="seleccionarCelda('${dia}','cena')">${crearContenidoCelda(dia,'cena')}</td>
      </tr>`;
  });
}

function crearContenidoCelda(dia, tipo) {
  const plato = calendario[dia][tipo];
  if (!plato) {
    return '<span style="font-size:12px; color:#999;">Click para agregar un plato</span>';
  }
  const contenido = insertarQuiebresLegibles(plato);
  return `${contenido} <span class="menu-eliminar" role="button" tabindex="0" aria-label="Eliminar plato" onclick="eliminarPlato(event,'${dia}','${tipo}')">Eliminar</span>`;
}

// Inserta puntos de quiebre sin cortar palabras: tras comas y barras
function insertarQuiebresLegibles(texto) {
  if (texto == null) return '';
  return String(texto)
    .replace(/,/g, ',<wbr>')
    .replace(/\//g, '/<wbr>');
}

function eliminarPlato(e,dia,tipo){ 
  e.stopPropagation(); 
  calendario[dia][tipo]=null; 
  actualizarCalendario(); 
}

function seleccionarCelda(dia, tipo) {
  document.querySelectorAll('#calendario-body td').forEach(td => td.classList.remove('selected'));

  if (!seleccion) {
    seleccion = { dia, tipo };
    marcarCeldaSeleccionada(dia, tipo);
    if (!calendario[dia][tipo]) {
  irAPlatoSemana();
}

    return;
  }

  const o = seleccion;
  const pO = calendario[o.dia][o.tipo];
  const pD = calendario[dia][tipo];

  if (o.dia === dia && o.tipo === tipo) {
    seleccion = null;
    actualizarCalendario();
    return;
  }

  if (!pO) {
    seleccion = { dia, tipo };
    marcarCeldaSeleccionada(dia, tipo);
   if (!pD) {
  irAPlatoSemana();
}

    return;
  }

  // Creamos el calendario propuesto (swap/move)
const tmp = JSON.parse(JSON.stringify(calendario));
tmp[dia][tipo] = pO;
tmp[o.dia][o.tipo] = pD;

// Merge simple de mapas de categorías (por si usás tradicional o veg o ambos)
const categoriasMerged = Object.assign({},
  (typeof categoriasTradicional !== 'undefined' ? categoriasTradicional : {}),
  (typeof categoriasVegetariano !== 'undefined' ? categoriasVegetariano : {})
);

// Validamos el calendario propuesto
const valid = validarPropuestaCambio(tmp, categoriasMerged);

if (!valid.ok) {
  // Mensajes amigables según la razón
  let msg = '❌ Movimiento no permitido.';
  if (valid.reason === 'samePlateDay') {
    msg = `❌ No podés dejar el mismo plato dos veces en ${valid.day}.`;
  } else if (valid.reason === 'categoryConflict') {
    msg = `❌ Ya hay un plato similar (${valid.category}) en ${valid.day}.`;
  } else if (valid.reason === 'overWeekly') {
    msg = `❌ El plato "${valid.plate}" excede el máximo de 2 veces por semana.`;
  } else if (valid.reason === 'overRestricted') {
    msg = `❌ El ingrediente "${valid.ingrediente}" superó su límite semanal (${valid.usoActual}/${valid.limite} veces).`;
  }
   
  

  mostrarMensaje(msg, 'error');
  seleccion = null;
  actualizarCalendario();
  return;
}

// Si pasa validación, aplicamos el calendario propuesto
calendario = tmp;
seleccion = null;
actualizarCalendario();


}

function marcarCeldaSeleccionada(dia,tipo){ 
  document.querySelectorAll('#calendario-body tr').forEach(f=>{ 
    const c=f.children; 
    if(c[0].innerText===dia){ 
      if(tipo==='almuerzo') c[1].classList.add('selected'); 
      if(tipo==='cena') c[2].classList.add('selected'); 
    } 
  }); 
}

// =========================
// MENSAJES TOAST
// =========================
function mostrarMensaje(texto,tipo){ 
  const m=document.getElementById('mensaje'); 
  m.className="mensaje-toast"; 
  m.classList.add(tipo); 
  m.innerText=texto; 
  m.style.display='block'; 
  setTimeout(()=>{ m.style.display='none'; },4000); 
}

// =========================
// EXPORTAR PDF
// =========================
function descargarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("🍴 Menú semanal", 14, 20);

  const cabecera = [["Día", "Almuerzo", "Cena"]];
  const filas = dias.map(dia => [
    dia,
    calendario[dia].almuerzo || "-",
    calendario[dia].cena || "-"
  ]);

  doc.autoTable({
    head: cabecera,
    body: filas,
    startY: 30,
    theme: "grid",
    headStyles: { fillColor: [143, 157, 104] },
    styles: { halign: "center" }
  });

  doc.save("menu-semanal.pdf");
}



// SCROLL HACIA ARMAR PLATO
function irAPlatoSemana() {
  const target = document.getElementById("plato-semana");
  if (target) {
    const y = target.getBoundingClientRect().top + window.scrollY - 100; // 👈 offset de 100px
    window.scrollTo({ top: y, behavior: "smooth" });
  }
}


// =========================
// LISTA DE COMPRAS
// =========================

// Sincroniza la lista de compras con el calendario actual (versión simplificada)
function sincronizarListaComprasConCalendario() {
  // Solo sincronizar si el modal está abierto
  const modal = document.getElementById('modalListaCompras');
  if (!modal || modal.style.display === 'none') return;
  
  // Simplemente regenerar la lista cuando se abra el modal
  // La sincronización real se hace en mostrarListaCompras()
}

// Mapeos editables para ingredientes base
// Permiten definir cómo descomponer verduras/proteínas/hidratos en ingredientes
// El valor puede ser una string (se usa tal cual) o un array de strings (varias entradas)
const ingredientesVerduras = {
  // ejemplos base; editá libremente
  "Ens.(tomate,lechuga,cebolla)": ["Tomate", "Lechuga", "Cebolla"],
  "Ens.(lechuga,tomate,cebolla,palta)": ["Lechuga", "Tomate", "Cebolla", "Palta"],
  "Salteado(cebolla,pimiento,zanahoria)": ["Cebolla", "Pimiento", "Zanahoria"],
  "Horno(cebolla,zanahoria,pimiento,calabaza)": ["Cebolla", "Zanahoria", "Pimiento", "Calabaza"],
};

const ingredientesProteinas = {
  "Milanesa vaca": "Milanesa de carne",
  "Milanesa pollo": "Milanesa de pollo",
  "Milanesa cerdo": "Milanesa de cerdo",
  "Milanesa pescado": "Milanesa de pescado",
  "Medallon de legumbre": "Medallón de legumbres",
  "Huevo (Duro/ Revuelto/ a la plancha)": "Huevo",
  "Atún": "Atún",
};

const ingredientesHidratos = {
  "Arroz(Blanco/ integral/ Yamani)": "Arroz",
  "Fideos": "Fideos",
  "Pure de papa": "Papa",
  "Papa al horno": "Papa",
  "Batata al horno": "Batata",
  "Quinoa": "Quinoa",
};

// Extrae ingredientes de un plato (combinado o completo)
// Extrae ingredientes de un plato (combinado o completo, incluye ensaladas custom)
function extraerIngredientesDePlato(plato) {
  if (!plato) return [];

  // 1. Si está definido en los ingredientes completos
  const ingredientesCompletos = (typeof ingredientesPlatosCompletos !== "undefined") 
    ? ingredientesPlatosCompletos 
    : (typeof ingredientesPlatosCompletosVeg !== "undefined") 
      ? ingredientesPlatosCompletosVeg 
      : null;
  if (ingredientesCompletos && ingredientesCompletos[plato]) {
    return ingredientesCompletos[plato];
  }

  // 2. Si no, procesar combinados
  const ingredientes = [];
  const partes = plato.split('+').map(p => p.trim());

  partes.forEach(parte => {
    // 🔹 Detectar ensalada custom o cualquier plato con paréntesis
    const matchParen = parte.match(/\(([^)]+)\)/);
    if (matchParen) {
      const verduras = matchParen[1].split(',').map(v => v.trim());
      ingredientes.push(...verduras);
      return;
    }

    // 🔹 Para Ens./Salteado/Horno/Crudo/etc. sin paréntesis
    if (
      parte.startsWith('Ens.') ||
      parte.startsWith('Salteado') ||
      parte.startsWith('Horno') ||
      parte.startsWith('Crudo')
    ) {
      const match = parte.match(/\(([^)]+)\)/);
      if (match) {
        const verduras = match[1].split(',').map(v => v.trim());
        ingredientes.push(...verduras);
      }
    } else {
      // 🔹 Mapeo directo con categorías conocidas
      const base =
        ingredientesProteinas[parte] ??
        ingredientesHidratos[parte] ??
        ingredientesVerduras[parte] ??
        parte;

      if (Array.isArray(base)) ingredientes.push(...base);
      else if (base) ingredientes.push(base);
    }
  });

  return ingredientes;
}


// Genera la lista de compras basada en el calendario
function generarListaCompras() {
  const listaCompras = {};
  
  // Recorrer todo el calendario
  dias.forEach(dia => {
    ['almuerzo', 'cena'].forEach(tipo => {
      const plato = calendario[dia][tipo];
      if (plato) {
        const ingredientes = extraerIngredientesDePlato(plato);
        
        ingredientes.forEach(ingrediente => {
          if (listaCompras[ingrediente]) {
            listaCompras[ingrediente]++;
          } else {
            listaCompras[ingrediente] = 1;
          }
        });
      }
    });
  });
  
  return listaCompras;
}

// Muestra la lista de compras en el modal
function mostrarListaCompras() {
  const listaCompras = generarListaCompras();
  const modal = document.getElementById('modalListaCompras');
  const contenido = document.getElementById('listaComprasContenido');
  
  // Cargar elementos guardados previamente (solo extras del usuario)
  const elementosGuardados = cargarElementosGuardados();
  
  if (Object.keys(listaCompras).length === 0 && elementosGuardados.length === 0) {
    contenido.innerHTML = '<p style="text-align: center; color: #666;">No hay platos en el calendario para generar la lista de compras.</p>';
  } else {
    // Ordenar ingredientes alfabéticamente
    const ingredientesOrdenados = Object.keys(listaCompras).sort();
    
    // UI de extras + lista (los generados del calendario tendrán botón Tachar; los extras, Eliminar)
    let html = `
      <div style="margin-bottom:12px;">
        <label for="extraCompras" style="font-weight:600; display:block; margin-bottom:6px;">Agregar extras</label>
        <input id="extraCompras" type="text" placeholder="Ej.: Aceite, sal, frutas..." style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px;" />
        <button id="btnAgregarExtra" class="btn-descargar" style="margin-top:8px;">Agregar</button>
      </div>
      <ul class="lista-compras" id="listaComprasUl">`;
    
    // Agregar elementos del calendario (solo botón Tachar)
    ingredientesOrdenados.forEach(ingrediente => {
      const cantidad = listaCompras[ingrediente];
      const textoCantidad = cantidad > 1 ? `(comprar para ${cantidad} comidas)` : '';
      
      html += `
        <li data-source="calendario" data-ingrediente="${ingrediente}">
          <span class="ingrediente-nombre">${ingrediente}</span>
          <span class="ingrediente-cantidad">${textoCantidad}</span>
          <span class="menu-eliminar" role="button" tabindex="0" data-action="tachar" data-ingrediente="${ingrediente}">Tachar</span>
        </li>
      `;
    });
    
    // Agregar elementos extras guardados (botones Eliminar + Tachar)
    elementosGuardados.forEach(elemento => {
      const claseTachado = elemento.tachado ? 'tachado' : '';
      html += `
        <li class="${claseTachado}" data-source="usuario" data-ingrediente="${elemento.nombre}">
          <span class="ingrediente-nombre">${elemento.nombre}</span>
          <span class="ingrediente-cantidad">${elemento.detalle || ''}</span>
          <span class="acciones">
            <span class="menu-eliminar" role="button" tabindex="0" data-action="eliminar" data-ingrediente="${elemento.nombre}">Eliminar</span>
            <span class="menu-eliminar" role="button" tabindex="0" data-action="tachar" data-ingrediente="${elemento.nombre}">Tachar</span>
          </span>
        </li>
      `;
    });
    
    html += '</ul>';
    
    contenido.innerHTML = html;

    // listeners: agregar extra
    const extraInput = document.getElementById('extraCompras');
    const btnExtra = document.getElementById('btnAgregarExtra');
    const ul = document.getElementById('listaComprasUl');
    if (btnExtra && extraInput && ul) {
      btnExtra.addEventListener('click', () => {
        const val = (extraInput.value || '').trim();
        if (!val) return;
        const li = document.createElement('li');
        li.setAttribute('data-source', 'usuario');
        li.setAttribute('data-ingrediente', val);
        // extras de usuario: botón Eliminar (remueve)
        li.innerHTML = `
          <span class="ingrediente-nombre">${val}</span>
          <span class="ingrediente-cantidad"></span>
          <span class="acciones">
            <span class="menu-eliminar" role="button" tabindex="0" data-action="eliminar" data-ingrediente="${val}">Eliminar</span>
            <span class="menu-eliminar" role="button" tabindex="0" data-action="tachar" data-ingrediente="${val}">Tachar</span>
          </span>
        `;

        ul.appendChild(li);
        extraInput.value = '';
        guardarListaComprasDesdeDOM();

        // bind listeners para el nuevo item
        const del = li.querySelector('.menu-eliminar[data-action="eliminar"]');
        if (del) {
          del.addEventListener('click', (e2) => {
            const li2 = e2.target.closest('li');
            if (li2 && li2.parentNode) li2.parentNode.removeChild(li2);
            guardarListaComprasDesdeDOM();
          });
        }
        
        const chk = li.querySelector('.menu-eliminar[data-action="tachar"]');
        if (chk) {
          chk.addEventListener('click', (e2) => {
            const li2 = e2.target.closest('li');
            li2.classList.toggle('tachado');
            guardarListaComprasDesdeDOM();
          });
        }
      });
    }

    // listeners: tachar (para elementos del calendario)
    ul.querySelectorAll('.menu-eliminar[data-action="tachar"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        li.classList.toggle('tachado');
        guardarListaComprasDesdeDOM();
      });
    });

    // listeners: eliminar (solo para elementos del usuario)
    ul.querySelectorAll('.menu-eliminar[data-action="eliminar"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (li && li.parentNode) li.parentNode.removeChild(li);
        guardarListaComprasDesdeDOM();
      });
    });
  }
  
  modal.style.display = 'flex';
}

// Descarga la lista de compras como archivo de texto
function descargarListaCompras() {
  const listaCompras = generarListaCompras();
  const ingredientesOrdenados = Object.keys(listaCompras).sort();
  
  let contenido = '🛒 LISTA DE COMPRAS - Plato Resuelto\n';
  contenido += '=====================================\n\n';
  
  ingredientesOrdenados.forEach(ingrediente => {
    const cantidad = listaCompras[ingrediente];
    const textoCantidad = cantidad > 1 ? ` (comprar para ${cantidad} comidas)` : '';
    contenido += `• ${ingrediente}${textoCantidad}\n`;
  });
  
  // Crear y descargar archivo
  const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'lista-compras.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Variables globales para manejar la lista de compras desde Firestore
let listaComprasFirestore = [];

// Cargar elementos guardados desde Firestore (función que será sobrescrita por Firebase)
function cargarElementosGuardados() {
  // Esta función será sobrescrita por Firebase cuando el usuario esté logueado
  // Si no hay usuario logueado, retorna array vacío
  console.log("cargarElementosGuardados: No hay usuario logueado, usando lista vacía");
  return window.listaComprasFirestore || [];
}

// Persistencia en Firestore de la lista mostrada en el modal
function guardarListaComprasDesdeDOM() {
  const ul = document.getElementById('listaComprasUl');
  if (!ul) return;
  
  // Solo guardar elementos del usuario (data-source="usuario")
  const items = Array.from(ul.querySelectorAll('li[data-source="usuario"]')).map(li => ({
    nombre: li.querySelector('.ingrediente-nombre')?.textContent || '',
    detalle: li.querySelector('.ingrediente-cantidad')?.textContent || '',
    tachado: li.classList.contains('tachado')
  }));
  
  // Actualizar la variable global
  listaComprasFirestore = items;
  window.listaComprasFirestore = items;
  
  // notificar a listeners externos (Firestore en index)
  document.dispatchEvent(new CustomEvent('listaCompras:cambiada', { detail: items }));
}

function cargarListaComprasADOMSiExiste() {
  const items = cargarElementosGuardados();
  if (!items || items.length === 0) return false;
  const modal = document.getElementById('modalListaCompras');
  const contenido = document.getElementById('listaComprasContenido');
  if (!contenido) return false;

  let html = `
    <div style="margin-bottom:12px;">
      <label for="extraCompras" style="font-weight:600; display:block; margin-bottom:6px;">Agregar extras</label>
      <input id="extraCompras" type="text" placeholder="Ej.: Aceite, sal, frutas..." style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px;" />
      <button id="btnAgregarExtra" class="btn-descargar" style="margin-top:8px;">Agregar</button>
    </div>
    <ul class="lista-compras" id="listaComprasUl">`;
  
  // Solo cargar elementos del usuario (extras manuales)
  items.forEach(it => {
    const claseTachado = it.tachado ? 'tachado' : '';
    html += `<li class="${claseTachado}" data-source="usuario" data-ingrediente="${it.nombre}">
      <span class="ingrediente-nombre">${it.nombre}</span>
      <span class="ingrediente-cantidad">${it.detalle || ''}</span>
      <span class="acciones">
        <span class="menu-eliminar" role="button" tabindex="0" data-action="eliminar" data-ingrediente="${it.nombre}">Eliminar</span>
        <span class="menu-eliminar" role="button" tabindex="0" data-action="tachar" data-ingrediente="${it.nombre}">Tachar</span>
      </span>
    </li>`;
  });
  
  html += '</ul>';
  contenido.innerHTML = html;

  // volver a conectar listeners
  const extraInput = document.getElementById('extraCompras');
  const btnExtra = document.getElementById('btnAgregarExtra');
  const ul = document.getElementById('listaComprasUl');
  
  if (btnExtra && extraInput && ul) {
    btnExtra.addEventListener('click', () => {
      const val = (extraInput.value || '').trim();
      if (!val) return;
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="ingrediente-nombre">${val}</span>
        <span class="ingrediente-cantidad"></span>
        <span class="acciones">
          <span class="menu-eliminar" role="button" tabindex="0" data-action="eliminar" data-ingrediente="${val}">Eliminar</span>
          <span class="menu-eliminar" role="button" tabindex="0" data-action="tachar" data-ingrediente="${val}">Tachar</span>
        </span>
      `;
      ul.appendChild(li);
      extraInput.value = '';
      guardarListaComprasDesdeDOM();
      
      // Conectar listeners para el nuevo elemento
      const delBtn = li.querySelector('.menu-eliminar[data-action="eliminar"]');
      const tacharBtn = li.querySelector('.menu-eliminar[data-action="tachar"]');
      
      if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          const li2 = e.target.closest('li');
          if (li2 && li2.parentNode) li2.parentNode.removeChild(li2);
          guardarListaComprasDesdeDOM();
        });
      }
      
      if (tacharBtn) {
        tacharBtn.addEventListener('click', (e) => {
          const li2 = e.target.closest('li');
          li2.classList.toggle('tachado');
          guardarListaComprasDesdeDOM();
        });
      }
    });
  }
  
  // Conectar listeners para elementos existentes
  ul.querySelectorAll('.menu-eliminar[data-action="tachar"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      li.classList.toggle('tachado');
      guardarListaComprasDesdeDOM();
    });
  });
  
  ul.querySelectorAll('.menu-eliminar[data-action="eliminar"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (li && li.parentNode) li.parentNode.removeChild(li);
      guardarListaComprasDesdeDOM();
    });
  });
  
  return true;
}

// =========================
// INICIO
// =========================
window.onload=()=>{ 
  cargarCalendario(); // esta función se define en app-normal o app-veg
  actualizarCalendario(); 
  
  // Event listeners para lista de compras
  const btnListaCompras = document.getElementById('btnListaCompras');
  const modal = document.getElementById('modalListaCompras');
  const btnCerrar = document.getElementById('cerrarModal');
  const btnDescargar = document.getElementById('descargarLista');
  
  // No cargar elementos precargados al inicio - solo cuando se abra el modal


  if (btnListaCompras) {
    btnListaCompras.addEventListener('click', mostrarListaCompras);
  }
  
  if (btnCerrar) {
    btnCerrar.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }
  
  if (btnDescargar) {
    btnDescargar.addEventListener('click', descargarListaCompras);
  }
  
  // Cerrar modal al hacer clic fuera
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }
};




//CALENDARIO ALEATORIO

// ===== Helpers globales =====
window.getOpciones = function getOpciones(idSelect) {
  const select = document.getElementById(idSelect);
  if (!select) return [];
  return Array.from(select.options)
    .map(opt => (opt.value ?? "").trim())
    // 👇 filtramos vacíos, "ensaladas" y lo que esté oculto
    .filter(val => val !== "" && val !== "ensaladas");
};



//BOTON FLOTANTE
// Botón flotante: ir al día de hoy
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnHoy");
  if (btn) {
    btn.addEventListener("click", () => {
      const hoy = new Date();
      let indiceHoy = hoy.getDay() - 1; // Lunes=0
      if (indiceHoy < 0 || indiceHoy > 4) {
        mostrarMensaje("📅 Hoy no es un día de semana configurado (Lun-Vie).", "error");
        return;
      }
      const fila = document.querySelectorAll("#calendario-body tr")[indiceHoy];
      if (fila) {
        fila.scrollIntoView({ behavior: "smooth", block: "center" });
        fila.classList.add("selected");
        setTimeout(() => fila.classList.remove("selected"), 3000);
      }
    });
  }
});


// =========================
// scroll mas preciso para boton
// =========================
document.getElementById("btnHoy").addEventListener("click", function (e) {
  e.preventDefault();
  const hoy = new Date();
  const indiceHoy = hoy.getDay() - 1; // Lunes=0
  if (indiceHoy >= 0 && indiceHoy <= 4) {
    const filaHoy = document.querySelectorAll("#calendario-body tr")[indiceHoy];
    if (filaHoy) {
      filaHoy.scrollIntoView({
        behavior: "smooth",
        block: "center"  // 👈 lo centra en pantalla (mejor en móvil)
      });
    }
  }
});




// tutorial.js
const pasos = [
  "👋 Bienvenido a <strong>Plato Resuelto!</strong><br>Acá organizás tu menú de la semana o de un solo día de forma fácil y rápida.",
  " Armá tu plato eligiendo <em>verduras</em>, <em>proteínas</em>, <em>hidratos</em> o un <em>plato completo</em>.",
  " Hacé clic en <strong>“Agregá el plato al calendario”</strong> y se asignará automáticamente a un día.",
  " También podés hacer clic en cualquier celda del calendario para <em> agregar, mover, rotar, o eliminar</em> un plato.",
  "⚡ Usá las funciones rápidas: <br> - 🎲 Generar semana aleatoria <br> - 🔄 Resetear calendario <br> - 📥 Descargar PDF",
  "📲 ¡Tip! Agregá esta app web a la pantalla de inicio de tu celular."
];

let pasoActual = 0;

function mostrarPaso() {
  const stepEl = document.getElementById("tutorial-step");
  const indicator = document.getElementById("tutorial-indicator");

  stepEl.innerHTML = pasos[pasoActual];
  indicator.textContent = `Paso ${pasoActual + 1} de ${pasos.length}`;

  // Botón "Atrás"
  const prevBtn = document.getElementById("tutorial-prev");
  prevBtn.style.display = pasoActual > 0 ? "inline-flex" : "none";
  prevBtn.innerHTML = "← Atrás";

  // Botón "Continuar / Empezar"
  const nextBtn = document.getElementById("tutorial-next");
  nextBtn.innerHTML = (pasoActual === pasos.length - 1) ? "Empezar →" : "Continuar →";
}

window.addEventListener("DOMContentLoaded", () => {
  const tutorial = document.getElementById("tutorial");
  if (!localStorage.getItem("tutorialVisto")) {
    tutorial.style.display = "flex";
    mostrarPaso();
  }

  document.getElementById("tutorial-prev").addEventListener("click", () => {
    if (pasoActual > 0) {
      pasoActual--;
      mostrarPaso();
    }
  });

  document.getElementById("tutorial-next").addEventListener("click", () => {
    if (pasoActual < pasos.length - 1) {
      pasoActual++;
      mostrarPaso();
    } else {
      localStorage.setItem("tutorialVisto", "true");
      tutorial.style.display = "none";
    }
  });
});

window.mostrarTutorial = function() {
  pasoActual = 0;
  document.getElementById("tutorial").style.display = "flex";
  mostrarPaso();
};






// =========================
// VALIDACIÓN POR CATEGORÍAS POR PLATOS O ALIMENTOS QUE SON SIMILARES
// =========================

// Dada la string de un plato ("Verdura + Proteína + Hidrato")
// devuelve las categorías de cada parte según el mapeo
function obtenerCategoriasDePlato(plato, categoriasMapeadas) {
  let cats = [];

  // 1️⃣ Primero: si el plato completo está en el mapeo, usar eso
  if (categoriasMapeadas[plato]) {
    const cat = categoriasMapeadas[plato];
    if (Array.isArray(cat)) {
      cats.push(...cat);
    } else {
      cats.push(cat);
    }
    return cats; // 👈 importante: si ya lo encontramos, no seguimos
  }

  // 2️⃣ Si no existe como plato entero, lo partimos por "+"
  const partes = plato.split("+").map(p => p.trim());

  partes.forEach(parte => {
    if (categoriasMapeadas[parte]) {
      const cat = categoriasMapeadas[parte];
      if (Array.isArray(cat)) {
        cats.push(...cat);
      } else {
        cats.push(cat);
      }
    }
  });

  return cats;
}


// Valida que un nuevo plato no comparta categorías con los que ya tiene ese día
function mismoDiaValido(dia, nuevoPlato, calendario, categoriasMapeadas) {
  const categoriasNuevo = obtenerCategoriasDePlato(nuevoPlato, categoriasMapeadas);

  for (let comida in calendario[dia]) {
    const platoExistente = calendario[dia][comida];
    if (!platoExistente) continue;

    const categoriasExistente = obtenerCategoriasDePlato(platoExistente, categoriasMapeadas);

    // ❌ Si alguna categoría coincide, no es válido
    if (categoriasNuevo.some(cat => categoriasExistente.includes(cat))) {
      return false;
    }
  }
  return true;
}



// Valida un calendario "propuesto" (tmpCalendar) antes de aplicarlo.
// Devuelve { ok: true } o { ok: false, reason: '...', detail: ... }
function validarPropuestaCambio(tmpCalendar, categoriasMapeadas) {
  // 1) Validaciones por día (mismo plato exacto en alm+cen y conflicto de categorías)
  for (let d of dias) {
    const alm = tmpCalendar[d].almuerzo;
    const cen = tmpCalendar[d].cena;

    // mismo plato exacto en el mismo día (no permitido)
    if (alm && cen && alm === cen) {
      return { ok: false, reason: 'samePlateDay', day: d, plate: alm };
    }

    // conflicto de categorías entre almuerzo y cena
    const catsA = alm ? obtenerCategoriasDePlato(alm, categoriasMapeadas) : [];
    const catsC = cen ? obtenerCategoriasDePlato(cen, categoriasMapeadas) : [];

    for (let cat of catsA) {
      if (catsC.includes(cat)) {
        return { ok: false, reason: 'categoryConflict', day: d, category: cat };
      }
    }
  }

  // 2) Validación de máximo 2 apariciones por semana (conteo en tmpCalendar)
  const counts = {};
  for (let d of dias) {
    ['almuerzo', 'cena'].forEach(tipo => {
      const p = tmpCalendar[d][tipo];
      if (!p) return;
      counts[p] = (counts[p] || 0) + 1;
      if (counts[p] > 2) {
        return { ok: false, reason: 'overWeekly', plate: p };
      }
    });
  }

  // 3) Validar ingredientes restringidos según versión
  const listaRestringidos = (typeof restringidosTradicional !== "undefined") 
    ? restringidosTradicional 
    : (typeof restringidosVegetariano !== "undefined") 
      ? restringidosVegetariano 
      : null;

  if (listaRestringidos) {
    // Contar ingredientes restringidos en el calendario temporal
    const countsIngredientes = {};
    
    for (let d of dias) {
      ['almuerzo','cena'].forEach(tipo => {
        const p = tmpCalendar[d][tipo];
        if (!p) return;
        
        // Verificar cada ingrediente restringido en este plato
        for (const [ingrediente, limite] of Object.entries(listaRestringidos)) {
          if (plateContainsIngredient(p, ingrediente)) {
            countsIngredientes[ingrediente] = (countsIngredientes[ingrediente] || 0) + 1;
            if (countsIngredientes[ingrediente] > limite) {
              return { 
                ok: false, 
                reason: 'overRestricted', 
                ingrediente: ingrediente, 
                limite: limite,
                usoActual: countsIngredientes[ingrediente]
              };
            }
          }
        }
      });
    }
  }


  // Si llega hasta acá, está OK
  return { ok: true };

  
}






  
































