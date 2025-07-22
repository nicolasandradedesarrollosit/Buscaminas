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
var modoOscuro = document.getElementById('modoOscuro');
var modoClaro = document.getElementById('modoClaro');
var nombreJugador = document.getElementById('nombreJugador');
var validacion = document.getElementById('validacion');
var nombreTexto = document.getElementById('nombreTexto');
iniciarJuego.disabled = true; // Deshabilitar el botón al inicio

// Estado global del juego encapsulado
var juego = {
    casillas: [],             // Array de elementos HTML de las casillas
    minasTotales: 0,          // Total de minas del juego actual
    banderasPlantadas: 0      // Cuántas banderas hay actualmente
};

nombreJugador.addEventListener('input', function() {
    if (nombreJugador.value.trim().length <= 3 ) {
        validacion.textContent = "El nombre debe tener más de 3 caracteres.";
        nombreTexto.textContent = "";
    } else {
        validacion.textContent = "";
        nombreTexto.textContent = "Hola " + nombreJugador.value;
        iniciarJuego.disabled = false;
    }
});


modoOscuro.addEventListener('click', function() {
    document.body.classList.add('modo-oscuro');
    modoOscuro.style.display = 'none';
    modoClaro.style.display = 'block';
});

modoClaro.addEventListener('click', function() {
    document.body.classList.remove('modo-oscuro');
    modoClaro.style.display = 'none';
    modoOscuro.style.display = 'block';
});

// Temporizador visual que cuenta regresivamente desde 5 minutos
function iniciarTemporizador() {
    if (temporizadorActivo) return;
    contenedorTemporizador.style.display = "block";
    temporizadorActivo = true;

    intervaloID = setInterval(function() {
        if (tiempoRestante <= 0) {
            clearInterval(intervaloID);
            tiempoSpan.textContent = "00:00";
            gameOver();
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
    }
}

// cuenta las minas alrededor de la casilla seleccionada
function contarMinasAlrededor(casilla) {
    var index = parseInt(casilla.getAttribute('id'));
    var filas = Math.sqrt(juego.casillas.length);
    var minasAlrededor = 0;

    // Verifica las 8 casillas adyacentes
    for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            var vecinoIndex = index + i * filas + j;
            if (vecinoIndex >= 0 && vecinoIndex < juego.casillas.length &&
                juego.casillas[vecinoIndex].classList.contains('bomba')) {
                minasAlrededor++;
            }
        }
    }
    return minasAlrededor;
}

// revela las casilla adyacentes que no tengas minas alrededor
function revelarAdyacentes(casilla) {
    var index = parseInt(casilla.getAttribute('id'));
    var filas = Math.sqrt(juego.casillas.length);

    // Verifica las 8 casillas adyacentes
    for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            var vecinoIndex = index + i * filas + j;
            if (vecinoIndex >= 0 && vecinoIndex < juego.casillas.length) {
                var vecinoCasilla = juego.casillas[vecinoIndex];
                if (!vecinoCasilla.classList.contains('revelada') && !vecinoCasilla.classList.contains('bomba')) {
                    click(vecinoCasilla);
                }
            }
        }
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
// funcion de juego terminado
function gameOver() {
    gameOverDiv.style.display = 'block';
    juego.casillas.forEach(casilla => {
    casilla.style.pointerEvents = 'none'; 
    casilla.style.opacity = '0.6'; 
    });
    gameOverDiv.innerHTML = '<h2 class = "gameOver">¡Perdiste!</h2><h2 class = "gameOver">¡Juego Terminado!</h2>'
    reiniciarTemporizador();
}

function gameWon() {

}