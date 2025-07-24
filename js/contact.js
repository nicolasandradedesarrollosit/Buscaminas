var modoOscuro = document.getElementById('modoOscuro');
var modoClaro = document.getElementById('modoClaro');

modoClaro.style.display = 'none'; 

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

document.getElementById("contactForm").addEventListener("submit", function (e) {
  e.preventDefault();

  document.getElementById("errorNombre").textContent = "";
  document.getElementById("errorEmail").textContent = "";
  document.getElementById("errorMensaje").textContent = "";

  var nombre = document.getElementById("nombre").value.trim();
  var email = document.getElementById("email").value.trim();
  var mensaje = document.getElementById("mensaje").value.trim();

  var valido = true;

  var regexNombre = /^[a-zA-Z0-9\s]+$/;
  if (nombre === "" || !regexNombre.test(nombre)) {
    document.getElementById("errorNombre").textContent =
      "El nombre debe ser alfanumérico.";
    valido = false;
  }

  var regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regexEmail.test(email)) {
    document.getElementById("errorEmail").textContent =
      "El email no es válido.";
    valido = false;
  }

  if (mensaje.length <= 5) {
    document.getElementById("errorMensaje").textContent =
      "El mensaje debe tener más de 5 caracteres.";
    valido = false;
  }

  if (valido) {
    var asunto = encodeURIComponent("Consulta desde el Buscaminas");
    var cuerpo = encodeURIComponent(
      `${mensaje}`
    );
    window.location.href = `mailto:nicolasandradedesarrollos@gmail.com?subject=${asunto}&body=${cuerpo}`;
  }
});

