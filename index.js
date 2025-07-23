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
var loose = new Audio('loose.mp3'); // Sonido de perder
var win = new Audio('win.wav'); // Sonido de ganar
var ranking = document.getElementById('ranking');

document.addEventListener("DOMContentLoaded", function() {
    mostrarTablaDePartidas();
});

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
    contenido.style.gridTemplateColumns = "repeat(" + columnas + ", 40px)";
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

function obtenerVecinos(index, filas, columnas) {
    var vecinos = [];
    var filaActual = Math.floor(index / columnas);
    var columnaActual = index % columnas;

    for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;

            var nuevaFila = filaActual + i;
            var nuevaColumna = columnaActual + j;

            if (
                nuevaFila >= 0 && nuevaFila < filas &&
                nuevaColumna >= 0 && nuevaColumna < columnas
            ) {
                var vecinoIndex = nuevaFila * columnas + nuevaColumna;
                vecinos.push(vecinoIndex);
            }
        }
    }

    return vecinos;
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

    console.log("Doble click activado sobre: ", casilla);

    var index = parseInt(casilla.getAttribute('id'));
    var filas = Math.sqrt(juego.casillas.length);
    var columnas = filas;

    var vecinos = obtenerVecinos(index, filas, columnas);
    var banderasCerca = 0;

    for (var i = 0; i < vecinos.length; i++) {
        var vecino = juego.casillas[vecinos[i]];
        if (vecino.classList.contains('bandera')) {
            banderasCerca++;
        }
    }

    if (banderasCerca === numeroActual) {
        for (var i = 0; i < vecinos.length; i++) {
            var vecino = juego.casillas[vecinos[i]];
            if (!vecino.classList.contains('bandera') && !vecino.classList.contains('revelada')) {
                click(vecino);
            }
        }
    }

    gameWon(); // también verificamos al final
}


// cuenta las minas alrededor de la casilla seleccionada
function contarMinasAlrededor(casilla) {
    var index = parseInt(casilla.getAttribute('id'));
    var filas = Math.sqrt(juego.casillas.length);
    var columnas = filas;
    var vecinos = obtenerVecinos(index, filas, columnas);

    var minasAlrededor = 0;
    for (var i = 0; i < vecinos.length; i++) {
        if (juego.casillas[vecinos[i]].classList.contains('bomba')) {
            minasAlrededor++;
        }
    }

    return minasAlrededor;
}

// revela las casilla adyacentes que no tengas minas alrededor
function revelarAdyacentes(casilla) {
    var index = parseInt(casilla.getAttribute('id'));
    var filas = Math.sqrt(juego.casillas.length);
    var columnas = filas;

    var vecinos = obtenerVecinos(index, filas, columnas);

    for (var i = 0; i < vecinos.length; i++) {
        var vecino = juego.casillas[vecinos[i]];
        if (!vecino.classList.contains('revelada') && !vecino.classList.contains('bandera')) {
            click(vecino);
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
    gameOverDiv.innerHTML = '<h2 class="gameOver">¡Perdiste!</h2><h2 class="gameOver">¡Juego Terminado!</h2>'
    reiniciarTemporizador();
    loose.play(); // Reproduce el sonido de perder
    
}

function gameWon() {
    var totalReveladas = 0;

    for (var i = 0; i < juego.casillas.length; i++) {
        if (juego.casillas[i].classList.contains('revelada')) {
            totalReveladas++;
        }
    }

    var totalSeguras = juego.casillas.length - juego.minasTotales;

    if (totalReveladas === totalSeguras) {
        var duracion = obtenerDuracionJugando();
        var nombre = nombreJugador.value;

        guardarPartida(nombre, duracion); 
        win.play(); 

        gameOverDiv.style.display = 'block';
        juego.casillas.forEach(function(casilla) {
            casilla.style.pointerEvents = 'none';
            casilla.style.opacity = '0.6';
        });
        gameOverDiv.innerHTML = '<h2 class="gameWon">¡Ganaste!</h2><h2 class="gameWon">¡Juego Terminado!</h2>';
        reiniciarTemporizador();
    }
    mostrarTablaDePartidas();
    
}

function obtenerDuracionJugando() {
    var tiempoUsado = 300 - tiempoRestante; 
    var minutos = Math.floor(tiempoUsado / 60);
    var segundos = tiempoUsado % 60;
    return minutos.toString().padStart(2, '0') + ":" + segundos.toString().padStart(2, '0');
}

// Calcula un puntaje en base a duración
function calcularPuntaje(duracion) {
    var partes = duracion.split(":");
    var minutos = parseInt(partes[0]);
    var segundos = parseInt(partes[1]);
    return 1000 - (minutos * 60 + segundos); 
}

// Guarda la partida en localStorage
function guardarPartida(nombre, duracion) {
    var partidas = JSON.parse(localStorage.getItem("partidas")) || [];

    var nuevaPartida = {
        nombre: nombre,
        fecha: new Date().toLocaleDateString(),
        hora: new Date().toLocaleTimeString(),
        duracion: duracion,
        puntaje: calcularPuntaje(duracion)
    };

    partidas.push(nuevaPartida);
    localStorage.setItem("partidas", JSON.stringify(partidas));
}

function obtenerPartidasComoFetch() {
    return new Promise(function(resolve) {
        var partidas = JSON.parse(localStorage.getItem("partidas")) || [];
        resolve(partidas);
    });
}

function mostrarTablaDePartidas() {
    obtenerPartidasComoFetch().then(function(partidas) {
        if (partidas.length === 0) return;

        var tablaHTML = "<h3 style='text-align:center'>Ranking de Partidas</h3>";
        tablaHTML += "<table>";
        tablaHTML += "<thead><tr><th>Nombre</th><th>Fecha</th><th>Hora</th><th>Duración</th><th>Puntaje</th></tr></thead><tbody>";
        
        partidas.forEach(function(p) {
            tablaHTML += "<tr>" +
                "<td>" + p.nombre + "</td>" +
                "<td>" + p.fecha + "</td>" +
                "<td>" + p.hora + "</td>" +
                "<td>" + p.duracion + "</td>" +
                "<td>" + p.puntaje + "</td>" +
            "</tr>";
        });

        tablaHTML += "</tbody></table>";
        ranking.innerHTML = tablaHTML;


    });
}