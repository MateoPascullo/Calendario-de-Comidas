// =========================
// VARIABLES Y ESTADO COMÚN
// =========================
const dias = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
let calendario = {};
let seleccion = null;
dias.forEach(dia => calendario[dia] = { almuerzo:null, cena:null });

// =========================
// FUNCIONES AUXILIARES
// =========================
function actualizarCalendario() {
  const tbody = document.getElementById("calendario-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  dias.forEach(dia => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${dia}</td>
      <td>${calendario[dia].almuerzo || ''}</td>
      <td>${calendario[dia].cena || ''}</td>
    `;
    tbody.appendChild(fila);
  });
}

function resetearCalendario() {
  dias.forEach(dia => calendario[dia] = { almuerzo:null, cena:null });
  actualizarCalendario();
  if (typeof guardarCalendario === 'function') {
    const user = (typeof auth !== 'undefined' && auth.currentUser) ? auth.currentUser : null;
    if (user) guardarCalendario(user);
  }
}

// =========================
// INGREDIENTES Y CATEGORÍAS
// =========================
function extraerIngredientesDePlato(plato) {
  if (!plato) return [];

  const ingredientesCompletos = (typeof ingredientesPlatosCompletos !== "undefined")
    ? ingredientesPlatosCompletos
    : (typeof ingredientesPlatosCompletosVeg !== "undefined")
      ? ingredientesPlatosCompletosVeg
      : null;

  if (ingredientesCompletos && ingredientesCompletos[plato]) {
    return ingredientesCompletos[plato];
  }

  const ingredientes = [];
  const partes = String(plato).split('+').map(p => p.trim());

  partes.forEach(parte => {
    if (/^(Ens\.|Salteado|Horno)/i.test(parte)) {
      const match = parte.match(/\(([^)]+)\)/);
      if (match) {
        const verduras = match[1].split(',').map(v => v.trim());
        ingredientes.push(...verduras);
      }
      return;
    }

    let ingrediente = parte.replace(/\([^)]*\)/g, '').trim();
    const base = ingredientesProteinas?.[ingrediente] ?? ingredientesHidratos?.[ingrediente] ?? ingredientesVerduras?.[ingrediente] ?? ingrediente;
    if (Array.isArray(base)) ingredientes.push(...base);
    else if (base) ingredientes.push(base);
  });

  return ingredientes;
}

function obtenerCategoriasDePlato(plato, categoriasMapeadas) {
  let cats = [];
  if (!plato || !categoriasMapeadas) return cats;

  if (categoriasMapeadas[plato]) {
    const cat = categoriasMapeadas[plato];
    if (Array.isArray(cat)) cats.push(...cat);
    else cats.push(cat);
    return cats;
  }

  const partes = String(plato).split("+").map(p => p.trim());
  partes.forEach(parte => {
    if (categoriasMapeadas[parte]) {
      const cat = categoriasMapeadas[parte];
      if (Array.isArray(cat)) cats.push(...cat);
      else cats.push(cat);
    }
  });

  return cats;
}

// =========================
// CALENDARIO ALEATORIO
// =========================
function asignarAcalendario(plato, categorias){
  let rep = 0;
  dias.forEach(d => {
    if (calendario[d].almuerzo === plato) rep++;
    if (calendario[d].cena === plato) rep++;
  });
  if (rep >= 2) return false;

  let disp = [...dias];
  while (disp.length) {
    let dia = disp[Math.floor(Math.random() * disp.length)];
    let comida = Math.random() < 0.5 ? 'almuerzo' : 'cena';
    if (!calendario[dia][comida]) {
      if (calendario[dia].almuerzo !== plato && calendario[dia].cena !== plato) {
        if (!categorias || mismoDiaValido(dia, plato, calendario, categorias)) {
          calendario[dia][comida] = plato;
          actualizarCalendario();
          return true;
        }
      }
    }
    disp.splice(disp.indexOf(dia), 1);
  }
  return false;
}

// =========================
// LISTA DE COMPRAS
// =========================
function mostrarListaCompras() {
  const listaGenerada = generarListaCompras();
  const modal = document.getElementById('modalListaCompras');
  const contenido = document.getElementById('listaComprasContenido');

  let guardados = [];
  try {
    const raw = localStorage.getItem('listaCompras');
    guardados = raw ? JSON.parse(raw) : [];
  } catch (e) {
    guardados = [];
  }

  const norm = (typeof normalizarTexto === 'function') ? normalizarTexto : (s) => String(s || '').toLowerCase().trim();
  const mapa = {};

  Object.keys(listaGenerada).forEach(nombre => {
    const cantidad = listaGenerada[nombre];
    const detalle = cantidad > 1 ? `(comprar para ${cantidad} comidas)` : '';
    mapa[norm(nombre)] = { nombre, detalle, tachado: false, source: 'calendar' };
  });

  guardados.forEach(it => {
    const k = norm(it.nombre);
    if (mapa[k]) {
      if (it.detalle && String(it.detalle).trim()) mapa[k].detalle = it.detalle;
      mapa[k].tachado = !!it.tachado;
    } else {
      mapa[k] = { nombre: it.nombre, detalle: it.detalle || '', tachado: !!it.tachado, source: (it.detalle ? 'calendar' : 'extra') };
    }
  });

  const entries = Object.values(mapa).sort((a,b) => a.nombre.localeCompare(b.nombre, 'es'));
  if (entries.length === 0) {
    contenido.innerHTML = '<p style="text-align: center; color: #666;">No hay platos en el calendario ni items guardados para la lista.</p>';
    modal.style.display = 'flex';
    return;
  }

  let html = `
    <div style="margin-bottom:12px;">
      <label for="extraCompras" style="font-weight:600; display:block; margin-bottom:6px;">Agregar extras</label>
      <input id="extraCompras" type="text" placeholder="Ej.: Aceite, sal, frutas..." style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px;" />
      <button id="btnAgregarExtra" class="btn-descargar" style="margin-top:8px;">Agregar</button>
    </div>
    <ul class="lista-compras" id="listaComprasUl">`;

  entries.forEach(item => {
    const accion = item.source === 'calendar' ? 'tachar' : 'eliminar';
    const rotulo = accion === 'tachar' ? 'Tachar' : 'Eliminar';
    html += `
      <li class="${item.tachado ? 'tachado' : ''}">
        <span class="ingrediente-nombre">${item.nombre}</span>
        <span class="ingrediente-cantidad">${item.detalle || ''}</span>
        <span class="menu-eliminar" role="button" tabindex="0" data-action="${accion}" data-ingrediente="${item.nombre}">${rotulo}</span>
      </li>`;
  });

  html += '</ul>';
  contenido.innerHTML = html;

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
        </span>`;
      ul.appendChild(li);
      extraInput.value = '';
      guardarListaComprasDesdeDOM();

      const del = li.querySelector('.menu-eliminar[data-action="eliminar"]');
      if (del) del.addEventListener('click', (e2) => {
        const li2 = e2.target.closest('li');
        if (li2 && li2.parentNode) li2.parentNode.removeChild(li2);
        guardarListaComprasDesdeDOM();
      });
      const chk = li.querySelector('.menu-eliminar[data-action="tachar"]');
      if (chk) chk.addEventListener('click', (e2) => {
        const li2 = e2.target.closest('li');
        li2.classList.toggle('tachado');
        guardarListaComprasDesdeDOM();
      });
    });
  }

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

  modal.style.display = 'flex';
}
          





















