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

function asignarAcalendario(plato){
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
        calendario[dia][comida]=plato; 
        actualizarCalendario(); 
        return true;
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
  return `${plato} <span class="menu-eliminar" role="button" tabindex="0" aria-label="Eliminar plato" onclick="eliminarPlato(event,'${dia}','${tipo}')">Eliminar</span>`;
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
      // centramos directamente el primer select (más preciso que el h3)
  const target = document.getElementById('verdura') || document.getElementById('form-plato');
  scrollAlCentro(target, 80);
  // opcional: foco para abrir el selector luego del scroll
  setTimeout(() => target?.focus?.(), 700);
}


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
      document.getElementById('form-plato').scrollIntoView({ behavior: 'smooth' });
    }
    return;
  }

  const tmp = JSON.parse(JSON.stringify(calendario));
  tmp[dia][tipo] = pO;
  tmp[o.dia][o.tipo] = pD;

  const noDupMismoDia = d => {
    const a = tmp[d].almuerzo, c = tmp[d].cena;
    return !(a && c && a === c);
  };

  if (!noDupMismoDia(dia) || !noDupMismoDia(o.dia)) {
    mostrarMensaje('❌ No se puede repetir el mismo plato en el mismo día.', 'error');
    seleccion = null;
    actualizarCalendario();
    return;
  }

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

// =========================
// INICIO
// =========================
window.onload=()=>{ 
  cargarCalendario(); // esta función se define en app-normal o app-veg
  actualizarCalendario(); 
};







//CALENDARIO ALEATORIO

// ===== Helpers globales =====
window.getOpciones = function getOpciones(idSelect) {
  const select = document.getElementById(idSelect);
  if (!select) {
    console.warn(`⚠️ No encontré el <select> #${idSelect}.`);
    return [];
  }
  return Array.from(select.options)
    .map(opt => (opt.value ?? "").trim())
    .filter(val => val !== "");
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

// Centra un elemento en pantalla con un pequeño offset para móviles
function scrollAlCentro(el, offset = 0) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const y = rect.top + window.scrollY - (window.innerHeight / 2) + (rect.height / 2) - offset;
  window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
}



