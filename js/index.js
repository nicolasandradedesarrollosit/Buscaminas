// =========================
// Estado / referencias DOM
// =========================
var dificultad            = document.getElementById('opcionJuego');
var volverAtras           = document.getElementById('volverAtras');
var selectDiv             = document.getElementById('select');
var tiempoSpan            = document.getElementById('tiempo');
var contenedorTemporizador= document.getElementById('temporizador');
var contenido             = document.getElementById('contenido');
var contadorMinas         = document.getElementById('contadorMinas');
var contadorDiferencia    = document.getElementById('contadorDiferencia');
var iniciarJuego          = document.getElementById('iniciarJuego');
var modoOscuro            = document.getElementById('modoOscuro');
var modoClaro             = document.getElementById('modoClaro');
var nombreJugador         = document.getElementById('nombreJugador');
var validacion            = document.getElementById('validacion');
var nombreTexto           = document.getElementById('nombreTexto');
var ranking               = document.getElementById('ranking');

iniciarJuego.disabled = true;

var win   = new Audio('public/win.wav');
var loose = new Audio('public/loose.mp3');

var tiempoRestante    = 300;
var intervaloID       = null;
var temporizadorActivo= false;

var juego = {
  casillas: [],
  minasTotales: 0,
  banderasPlantadas: 0
};

// ===============
// Inicialización
// ===============
document.addEventListener('DOMContentLoaded', function () {
  mostrarTablaDePartidas();
});

nombreJugador.addEventListener('input', function () {
  if (nombreJugador.value.trim().length <= 3) {
    validacion.textContent = 'El nombre debe tener más de 3 caracteres.';
    nombreTexto.textContent = '';
    iniciarJuego.disabled = true;
  } else {
    validacion.textContent = '';
    nombreTexto.textContent = 'Hola ' + nombreJugador.value;
    iniciarJuego.disabled = false;
  }
});

iniciarJuego.addEventListener('click', function () {
  iniciarJuego.style.display = 'none';
  selectDiv.style.display = 'none';
  crearBuscaminas();
});

volverAtras.addEventListener('click', function () {
  selectDiv.style.display = 'flex';
  iniciarJuego.style.display = 'flex';
  reiniciarTemporizador();
  contenido.innerHTML = '';
  contadorDiferencia.textContent = '';
  contadorMinas.textContent = '';
});

modoOscuro.addEventListener('click', function () {
  document.body.classList.add('modo-oscuro');
  modoOscuro.style.display = 'none';
  modoClaro.style.display = 'block';
});

modoClaro.addEventListener('click', function () {
  document.body.classList.remove('modo-oscuro');
  modoClaro.style.display = 'none';
  modoOscuro.style.display = 'block';
});

// ==========================
// Temporizador (solo lógica)
// ==========================
function iniciarTemporizador() {
  if (temporizadorActivo) return;
  contenedorTemporizador.style.display = 'block';
  temporizadorActivo = true;

  intervaloID = setInterval(function () {
    if (tiempoRestante <= 0) {
      clearInterval(intervaloID);
      tiempoSpan.textContent = '00:00';
      gameOver();
      return;
    }
    tiempoRestante--;
    actualizarDisplay();
  }, 1000);
}

function actualizarDisplay() {
  var minutos = Math.floor(tiempoRestante / 60).toString().padStart(2, '0');
  var segundos = (tiempoRestante % 60).toString().padStart(2, '0');
  tiempoSpan.textContent = minutos + ':' + segundos;
}

function reiniciarTemporizador(segundos) {
  if (segundos === undefined) segundos = 300;
  clearInterval(intervaloID);
  tiempoRestante = segundos;
  actualizarDisplay();
  temporizadorActivo = false;
  contenedorTemporizador.style.display = 'none';
}

function obtenerDuracionJugando() {
  var tiempoUsado = 300 - tiempoRestante;
  var minutos = Math.floor(tiempoUsado / 60);
  var segundos = tiempoUsado % 60;
  return minutos.toString().padStart(2, '0') + ':' + segundos.toString().padStart(2, '0');
}

// ==========================
// Core del juego
// ==========================
function crearBuscaminas() {
  var filas, columnas, minas;

  switch (dificultad.value) {
    case 'facil':
      filas = columnas = 8;  minas = 10; break;
    case 'medio':
      filas = columnas = 12; minas = 25; break;
    case 'dificil':
      filas = columnas = 16; minas = 40; break;
  }

  juego.minasTotales = minas;
  juego.banderasPlantadas = 0;
  generarTablero(filas, columnas, minas);
}

function generarTablero(filas, columnas, minas) {
  contenido.innerHTML = '';
  contenido.style.gridTemplateColumns = `repeat(${columnas}, 40px)`;

  var arrayBombas  = Array(minas).fill('bomba');
  var arrayVacios  = Array(filas * columnas - minas).fill('vacio');
  var arrayCompleto= arrayVacios.concat(arrayBombas).sort(function () { return Math.random() - 0.5; });

  juego.casillas = [];
  contadorMinas.textContent = 'Minas: ' + minas;

  for (var i = 0; i < filas * columnas; i++) {
    var c = document.createElement('div');
    c.setAttribute('id', i);
    c.classList.add(arrayCompleto[i]);
    contenido.appendChild(c);
    juego.casillas.push(c);

    c.addEventListener('click', function (e) { click(e.target); });
    c.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      añadirBandera(this);
    });
    c.addEventListener('dblclick', function (e) { dobleClick(e.target); });
  }
}

function click(casilla) {
  if (!temporizadorActivo) iniciarTemporizador();

  if (casilla.classList.contains('revelada') || casilla.classList.contains('bandera')) return;

  casilla.classList.add('revelada');

  if (casilla.classList.contains('bomba')) {
    casilla.textContent = '💣';
    casilla.style.backgroundColor = '#ff4d4d';
    gameOver();
    return;
  }

  casilla.style.backgroundColor = '#d0d0d0';

  var minasAlrededor = contarMinasAlrededor(casilla);
  if (minasAlrededor > 0) {
    casilla.textContent = minasAlrededor;
    casilla.style.color =
      minasAlrededor === 1 ? 'blue' :
      minasAlrededor === 2 ? 'green' :
      'red';
  } else {
    casilla.textContent = '';
    revelarAdyacentes(casilla);
  }
  
  gameWon();
}

function dobleClick(casilla) {
  if (!casilla.classList.contains('revelada')) return;

  var numeroActual = parseInt(casilla.textContent);
  if (isNaN(numeroActual)) return;

  var index     = parseInt(casilla.getAttribute('id'));
  var size      = Math.sqrt(juego.casillas.length);
  var vecinos   = obtenerVecinos(index, size, size);
  var banderasCerca = 0;

  for (var i = 0; i < vecinos.length; i++) {
    if (juego.casillas[vecinos[i]].classList.contains('bandera')) banderasCerca++;
  }

  if (banderasCerca === numeroActual) {
    for (var j = 0; j < vecinos.length; j++) {
      var vecino = juego.casillas[vecinos[j]];
      if (!vecino.classList.contains('bandera') && !vecino.classList.contains('revelada')) {
        click(vecino);
      }
    }
  }

  gameWon();
}

function añadirBandera(casilla) {
  if (casilla.classList.contains('revelada')) return;

  if (casilla.classList.contains('bandera')) {
    casilla.classList.remove('bandera');
    casilla.textContent = '';
    juego.banderasPlantadas--;
  } else {
    casilla.classList.add('bandera');
    casilla.textContent = '🚩';
    juego.banderasPlantadas++;
  }

  actualizarContadorMinas();
}

function gameOver() {
  bloquearTablero();
  mostrarModalResultado('¡Perdiste!', false);
  reiniciarTemporizador();
  loose.play();
}

function gameWon() {
  var totalReveladas = 0;
  for (var i = 0; i < juego.casillas.length; i++) {
    if (juego.casillas[i].classList.contains('revelada')) totalReveladas++;
  }

  var totalSeguras = juego.casillas.length - juego.minasTotales;
  if (totalReveladas !== totalSeguras) return;

  var duracion = obtenerDuracionJugando();
  var nombre   = nombreJugador.value;

  guardarPartida(nombre, duracion);
  win.play();

  bloquearTablero();
  mostrarModalResultado('¡Ganaste!', true);
  reiniciarTemporizador();

  mostrarTablaDePartidas();
}

function bloquearTablero() {
  for (var i = 0; i < juego.casillas.length; i++) {
    juego.casillas[i].style.pointerEvents = 'none';
    juego.casillas[i].style.opacity = '0.6';
  }
}
// ==========================
// Lógica de minas y adyacentes
/**
 * Devuelve los índices de las casillas vecinas (8 direcciones) válidas.
 */
function obtenerVecinos(index, filas, columnas) {
  var vecinos = [];
  var fila = Math.floor(index / columnas);
  var col  = index % columnas;

  for (var i = -1; i <= 1; i++) {
    for (var j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      var nf = fila + i;
      var nc = col + j;
      if (nf >= 0 && nf < filas && nc >= 0 && nc < columnas) {
        vecinos.push(nf * columnas + nc);
      }
    }
  }
  return vecinos;
}

function contarMinasAlrededor(casilla) {
  var index   = parseInt(casilla.getAttribute('id'));
  var size    = Math.sqrt(juego.casillas.length);
  var vecinos = obtenerVecinos(index, size, size);

  var minas = 0;
  for (var i = 0; i < vecinos.length; i++) {
    if (juego.casillas[vecinos[i]].classList.contains('bomba')) minas++;
  }
  return minas;
}

/**
 * Expande recursivamente celdas vacías sin minas alrededor.
 */
function revelarAdyacentes(casilla) {
  var index   = parseInt(casilla.getAttribute('id'));
  var size    = Math.sqrt(juego.casillas.length);
  var vecinos = obtenerVecinos(index, size, size);

  for (var i = 0; i < vecinos.length; i++) {
    var v = juego.casillas[vecinos[i]];
    if (!v.classList.contains('revelada') && !v.classList.contains('bandera')) {
      click(v);
    }
  }
}

function actualizarContadorMinas() {
  contadorDiferencia.textContent = 'Diferencias de minas y banderas plantadas: ' + (juego.minasTotales - juego.banderasPlantadas);
}

// ==========================
// Persistencia / Ranking
// ==========================
function calcularPuntaje(duracion) {
  var partes   = duracion.split(':');
  var minutos  = parseInt(partes[0]);
  var segundos = parseInt(partes[1]);
  return 1000 - (minutos * 60 + segundos);
}

function guardarPartida(nombre, duracion) {
  var partidas = JSON.parse(localStorage.getItem('partidas')) || [];
  partidas.push({
    nombre   : nombre,
    fecha    : new Date().toLocaleDateString(),
    hora     : new Date().toLocaleTimeString(),
    duracion : duracion,
    puntaje  : calcularPuntaje(duracion)
  });
  localStorage.setItem('partidas', JSON.stringify(partidas));
}

function obtenerPartidasComoFetch() {
  return Promise.resolve(JSON.parse(localStorage.getItem('partidas')) || []);
}

function mostrarTablaDePartidas() {
  obtenerPartidasComoFetch().then(function (partidas) {
    if (partidas.length === 0) return;

    var tablaHTML = "<h3 style='text-align:center'>Ranking de Partidas</h3>";
    tablaHTML += '<table>';
    tablaHTML += '<thead><tr><th>Nombre</th><th>Fecha</th><th>Hora</th><th>Duración</th><th>Puntaje</th></tr></thead><tbody>';

    partidas.forEach(function (p) {
      tablaHTML += '<tr>' +
        '<td>' + p.nombre   + '</td>' +
        '<td>' + p.fecha    + '</td>' +
        '<td>' + p.hora     + '</td>' +
        '<td>' + p.duracion + '</td>' +
        '<td>' + p.puntaje  + '</td>' +
      '</tr>';
    });

    tablaHTML += '</tbody></table>';
    ranking.innerHTML = tablaHTML;
  });
}

// ==========================
// Modal
// ==========================
/**
 * Muestra el modal de resultado durante 3s.
 */
function mostrarModalResultado(texto, gano) {
  var modal     = document.getElementById('modalResultado');
  var mensaje   = document.getElementById('mensajeResultado');
  var contenido = modal.querySelector('.modal-contenido');

  mensaje.textContent = texto;

  contenido.classList.remove('ganado', 'perdido');
  contenido.classList.add(gano ? 'ganado' : 'perdido');

  modal.classList.remove('oculto');

  setTimeout(function () {
    modal.classList.add('oculto');
  }, 3000);
}
