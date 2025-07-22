// Referencias a elementos del DOM
var dificultad = document.getElementById('opcionJuego');
var volverAtras = document.getElementById('volverAtras');
var selectDiv = document.getElementById('select');
var tiempoRestante = 300;
var temporizadorActivo = false;
var intervaloID = null;
var tiempoSpan = document.getElementById('tiempo');
var contenedorTemporizador = document.getElementById('temporizador');
var contenido = document.getElementById('contenido');
var contadorMinas = document.getElementById('contadorMinas');
var gameOverDiv = document.getElementById('gameOver');
var contadorDiferencia = document.getElementById('contadorDiferencia');
var iniciarJuego = document.getElementById('iniciarJuego');

// Estado global del juego encapsulado
var juego = {
    casillas: [],             // Array de elementos HTML de las casillas
    minasTotales: 0,          // Total de minas del juego actual
    banderasPlantadas: 0      // Cuántas banderas hay actualmente
};

// Temporizador visual que cuenta regresivamente desde 5 minutos
function iniciarTemporizador() {
    if (temporizadorActivo) return;
    contenedorTemporizador.style.display = "block";
    temporizadorActivo = true;

    intervaloID = setInterval(function() {
        if (tiempoRestante <= 0) {
            clearInterval(intervaloID);
            tiempoSpan.textContent = "00:00";
            alert("¡Se acabó el tiempo!");
            return;
        }

        tiempoRestante--;
        actualizarDisplay();
    }, 1000);
}

// Actualiza el contenido del temporizador en formato MM:SS
function actualizarDisplay() {
    var minutos = Math.floor(tiempoRestante / 60).toString().padStart(2, '0');
    var segundos = (tiempoRestante % 60).toString().padStart(2, '0');
    tiempoSpan.textContent = minutos + ":" + segundos;
}

// Reinicia el temporizador a 5 min (o el valor que se pase)
function reiniciarTemporizador(segundos) {
    if (segundos === undefined) segundos = 300;
    clearInterval(intervaloID);
    tiempoRestante = segundos;
    actualizarDisplay();
    temporizadorActivo = false;
    contenedorTemporizador.style.display = "none";
}

// Evento al cambiar la dificultad
iniciarJuego.addEventListener('click', function() {
    iniciarJuego.style.display = 'none';
    selectDiv.style.display = 'none';
    crearBuscaminas();
    iniciarTemporizador();
});

// Volver al selector
volverAtras.addEventListener("click", function() {
    selectDiv.style.display = 'flex';
    iniciarJuego.style.display = 'flex';
    reiniciarTemporizador();
    contenido.innerHTML = '';
    gameOverDiv.style.display = 'none';
    gameOverDiv.innerHTML = '';
    contadorDiferencia.textContent = '';
    contadorMinas.textContent = '';
});

// Crea tablero en base a la dificultad seleccionada
function crearBuscaminas() {
    var valueDificultad = dificultad.value;
    var filas, columnas, minas;

    switch (valueDificultad) {
        case 'facil':
            filas = columnas = 8;
            minas = 10;
            break;
        case 'medio':
            filas = columnas = 12;
            minas = 25;
            break;
        case 'dificil':
            filas = columnas = 16;
            minas = 40;
            break;
    }

    juego.minasTotales = minas;
    juego.banderasPlantadas = 0;
    generarTablero(filas, columnas, minas);
}

// Genera los elementos del tablero y les asigna eventos
function generarTablero(filas, columnas, minas) {
    var arrayBombas = Array(minas).fill('bomba');
    var arrayVacios = Array(filas * columnas - minas).fill('vacio');
    var arrayCompleto = arrayVacios.concat(arrayBombas);
    arrayCompleto.sort(function() { return Math.random() - 0.5; });

    juego.casillas = [];
    contadorMinas.textContent = "Minas restantes: " + minas;

    for (var i = 0; i < filas * columnas; i++) {
        var contenedorBuscaminas = document.createElement('div');
        contenedorBuscaminas.setAttribute('id', i);
        contenedorBuscaminas.classList.add(arrayCompleto[i]);
        contenido.appendChild(contenedorBuscaminas);
        juego.casillas.push(contenedorBuscaminas);

        contenedorBuscaminas.addEventListener('click', function(event) {
            click(event.target);
        });

        (function(casilla) {
            casilla.addEventListener('contextmenu', function(event) {
                event.preventDefault();
                añadirBandera(casilla);
            });
        })(contenedorBuscaminas);

        contenedorBuscaminas.addEventListener('dblclick', function(event) {
            dobleClick(event.target);
        });
    }
}

// Muestra cuántas minas faltan por marcar
function actualizarContadorMinas() {
    contadorDiferencia.textContent = "Diferencias de minas y banderas plantadas: " + (juego.minasTotales - juego.banderasPlantadas);
}

// Revela una casilla (click izquierdo)
function click(casilla) {
    if (casilla.classList.contains('revelada') || casilla.classList.contains('bandera')) return;

    casilla.classList.add('revelada');

    if (casilla.classList.contains('bomba')) {
        casilla.textContent = '💣';
        casilla.style.backgroundColor = '#ff4d4d';
        gameOver();
    } else {
        casilla.style.backgroundColor = '#d0d0d0';
        // Lógica de números viene después
    }
}

// Marca o desmarca una bandera (click derecho)
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
    gameOverDiv.style.display = 'block';
    gameOverDiv.innerHTML = '<h2 class = "gameOver">¡Perdiste!</h2><h2 class = "gameOver">¡Juego Terminado!</h2>'
    contenido.innerHTML = '';
    reiniciarTemporizador();
}