// =========================
// VALIDACIÓN DE PLATOS (versión tradicional)
// =========================
function validarPlato() {
  const s = getSeleccionados();
  let valido = false, platoFinal = '';

  if (s.completo && !s.verdura && !s.proteina && !s.hidrato) {
    valido = true;
    platoFinal = s.completo;
  } 
  else if (s.verdura && s.proteina && s.hidrato && !s.completo) {
    valido = true;
    platoFinal = `${s.verdura}+ ${s.proteina}+ ${s.hidrato}`;
  } 
  else if (s.verdura && s.proteina && !s.hidrato && !s.completo) {
    valido = true;
    platoFinal = `${s.verdura}+ ${s.proteina}`;
  } 
  else if (s.verdura && s.hidrato && !s.proteina && !s.completo) {
    valido = true;
    platoFinal = `${s.verdura}+ ${s.hidrato}`;
  }

  if (valido) {
    if (seleccion) {
      const { dia, tipo } = seleccion;
      const otroTipo = (tipo === 'almuerzo') ? 'cena' : 'almuerzo';

      if (calendario[dia][otroTipo] === platoFinal) {
        mostrarMensaje(`❌ No podés repetir "${platoFinal}" en ${dia}.`, 'error');
      }
      else if (contarRepeticiones(platoFinal) >= 2 && calendario[dia][tipo] !== platoFinal) {
        mostrarMensaje(`❌ El plato "${platoFinal}" ya fue asignado 2 veces esta semana.`, 'error');
      }
      else {
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
  } else {
    if (!s.verdura && s.proteina && s.hidrato) {
      mostrarMensaje('❌ Faltan verduras u hortalizas en el plato.', 'error');
    } else {
      mostrarMensaje('❌ Combinación no válida. Volvé a intentarlo.', 'error');
    }
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
