// Estas dos constantes son el equivalente en JS del ancho de
// .capa-superior en style.css (64.375% del pastel) y del margen
// para que la vela no quede al borde. Al estar en %, la posición
// de las velas escala junto con el pastel en cualquier tamaño de
// pantalla — ya no depende de un ancho de pastel fijo en px.
const ANCHO_CAPA_SUPERIOR_PORCENTAJE = 64.375;
const MARGEN_VELA_PORCENTAJE = 2;
const OFFSET_MAX = ANCHO_CAPA_SUPERIOR_PORCENTAJE / 2 - MARGEN_VELA_PORCENTAJE;

// Prefijo de las claves en localStorage que marcan si el usuario
// ya entró a la sorpresa de un día. Constante aparte para no
// repetir el string armado a mano en dos lugares distintos.
const CLAVE_VISITA = (dia) => `vela-visitada-${dia}`;

// frac: posición relativa de -1 (extremo izquierdo) a 1 (extremo
// derecho) dentro de la capa superior. especial+dia se usan
// recien en pasos 4 y 5, se definen aca porque es donde vive
// la data de cada vela.
const candlesData = [
    { id: 1, especial: false, frac: -1 },
    { id: 2, especial: false, frac: -0.889 },
    { id: 3, especial: true, dia: 1, frac: -0.778 },
    { id: 4, especial: false, frac: -0.667 },
    { id: 5, especial: false, frac: -0.556 },
    { id: 6, especial: true, dia: 2, frac: -0.444 },
    { id: 7, especial: false, frac: -0.333 },
    { id: 8, especial: false, frac: -0.222 },
    { id: 9, especial: true, dia: 3, frac: -0.111 },
    { id: 10, especial: false, frac: 0 },
    { id: 11, especial: false, frac: 0.111 },
    { id: 12, especial: true, dia: 4, frac: 0.222 },
    { id: 13, especial: false, frac: 0.333 },
    { id: 14, especial: false, frac: 0.444 },
    { id: 15, especial: true, dia: 5, frac: 0.556 },
    { id: 16, especial: false, frac: 0.667 },
    { id: 17, especial: false, frac: 0.778 },
    { id: 18, especial: true, dia: 6, frac: 0.889 },
    { id: 19, especial: false, frac: 1 },
];

function crearVelas() {
    const pastel = document.querySelector('.pastel');

    candlesData.forEach((c) => {
        const vela = document.createElement('div');
        vela.className = 'vela';
        vela.dataset.id = c.id;

        if (c.especial) {
            vela.classList.add('especial');
            vela.dataset.dia = c.dia;

            if (!estaDesbloqueada(c.dia)) {
                // Todavía no llegó su fecha: apagada, click muestra mensaje.
                vela.classList.add('bloqueada');
            } else if (haSidoVisitada(c.dia)) {
                // Ya se abrió esta sorpresa antes: apagada, pero se puede reabrir.
                vela.classList.add('apagada');
            }
            // Si está desbloqueada y nunca visitada, no se agrega clase
            // extra: queda con el estilo "encendida" por defecto.

            vela.addEventListener('click', () => manejarClickVela(vela, c.dia));
        }

        const x = c.frac * OFFSET_MAX;
        vela.style.left = `calc(50% + ${x}%)`;

        const llama = document.createElement('div');
        llama.className = 'llama';
        // Delay aleatorio para que las 19 llamas no titilen sincronizadas.
        llama.style.animationDelay = `${(Math.random() * 1.4).toFixed(2)}s`;

        const mecha = document.createElement('div');
        mecha.className = 'mecha';

        const cuerpo = document.createElement('div');
        cuerpo.className = 'cuerpo';

        vela.append(llama, mecha, cuerpo);
        pastel.appendChild(vela);
    });
}

// Un día está desbloqueado si la fecha local del dispositivo ya
// llegó (o pasó) su fecha de desbloqueo. No hace falta un caso
// especial para "después del 6 de septiembre queda todo abierto":
// una vez que hoy >= fecha de desbloqueo, esa comparación sigue
// siendo verdadera para siempre.
function estaDesbloqueada(dia) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // new Date(2026, 8, dia): el mes es 0-indexado en JS, 8 = septiembre.
    const fechaDesbloqueo = new Date(2026, 8, dia);
    fechaDesbloqueo.setHours(0, 0, 0, 0);

    return hoy >= fechaDesbloqueo;
}

function haSidoVisitada(dia) {
    return localStorage.getItem(CLAVE_VISITA(dia)) === 'true';
}

function marcarComoVisitada(dia) {
    localStorage.setItem(CLAVE_VISITA(dia), 'true');
}

function manejarClickVela(vela, dia) {
    if (!estaDesbloqueada(dia)) {
        mostrarMensajeBloqueada(vela);
        return;
    }
    marcarComoVisitada(dia);
    window.location.href = `pages/dia${dia}.html`;
}

function mostrarMensajeBloqueada(vela) {
    // Evita apilar mensajes si el usuario clickea varias veces seguidas.
    if (vela.querySelector('.mensaje-bloqueo')) return;

    const mensaje = document.createElement('div');
    mensaje.className = 'mensaje-bloqueo';
    mensaje.textContent = 'Esta sorpresa todavía no está tendrás que esperar un poquito más...';
    vela.appendChild(mensaje);

    // requestAnimationFrame fuerza el reflow para que la transición
    // de entrada se dispare (si agregás la clase 'visible' en el
    // mismo tick que se crea el elemento, el navegador la ignora).
    requestAnimationFrame(() => mensaje.classList.add('visible'));

    setTimeout(() => {
        mensaje.classList.remove('visible');
        setTimeout(() => mensaje.remove(), 300); // esperar el fade-out
    }, 1800);
}

// Radio de "viento": si el cursor entra en este radio (px) de una
// llama decorativa, se apaga. Un solo listener de mousemove que
// recorre las 13 velas, en vez de un listener por vela.
const RADIO_APAGADO = 45;

function configurarInteraccionCursor() {
    const velasDecorativas = Array.from(document.querySelectorAll('.vela:not(.especial)'));

    document.addEventListener('mousemove', (e) => {
        velasDecorativas.forEach((vela) => {
            if (vela.classList.contains('apagada-cursor')) return;

            const llama = vela.querySelector('.llama');
            const rect = llama.getBoundingClientRect();
            const centroX = rect.left + rect.width / 2;
            const centroY = rect.top + rect.height / 2;
            const distancia = Math.hypot(e.clientX - centroX, e.clientY - centroY);

            if (distancia < RADIO_APAGADO) {
                apagarVelaDecorativa(vela);
            }
        });
    });
}

function apagarVelaDecorativa(vela) {
    vela.classList.add('apagada-cursor');
    crearHumo(vela);
}

function crearHumo(vela) {
    const humo = document.createElement('div');
    humo.className = 'humo';
    vela.appendChild(humo);
    setTimeout(() => humo.remove(), 1500); // debe coincidir con la animación CSS
}

const TOTAL_DIAS_ESPECIALES = 6;

// Recorre los días 1-6 y devuelve el primero que todavía no está
// desbloqueado, reusando la misma estaDesbloqueada() del sistema
// de velas. Si ninguno queda pendiente, devuelve null.
function calcularProximoDiaPendiente() {
    for (let dia = 1; dia <= TOTAL_DIAS_ESPECIALES; dia++) {
        if (!estaDesbloqueada(dia)) return dia;
    }
    return null;
}

let intervaloContador = null;

function actualizarContador() {
    const contadorEl = document.getElementById('contador');
    const tituloEl = document.querySelector('.contador-titulo');
    if (!contadorEl) return;

    const proximoDia = calcularProximoDiaPendiente();

    if (proximoDia === null) {
        if (tituloEl) tituloEl.textContent = '';
        contadorEl.textContent = '¡Todo desbloqueado! 🎉';
        clearInterval(intervaloContador);
        return;
    }

    const fechaObjetivo = new Date(2026, 8, proximoDia, 0, 0, 0);
    const diferencia = fechaObjetivo - new Date();

    // Salvaguarda: si justo cruzó la medianoche entre el chequeo de
    // estaDesbloqueada y este cálculo, el próximo tick del intervalo
    // ya lo va a recalcular bien; acá solo evitamos mostrar negativos.
    if (diferencia <= 0) return;

    const segundosTotales = Math.floor(diferencia / 1000);
    const dias = Math.floor(segundosTotales / 86400);
    const horas = Math.floor((segundosTotales % 86400) / 3600);
    const minutos = Math.floor((segundosTotales % 3600) / 60);
    const segundos = segundosTotales % 60;

    const pad = (n) => String(n).padStart(2, '0');

    if (tituloEl) tituloEl.textContent = `La vela ${proximoDia} se desbloquea en`;
    contadorEl.textContent = `${dias}d ${pad(horas)}h ${pad(minutos)}m ${pad(segundos)}s`;
}

function iniciarContador() {
    actualizarContador(); // pinta el valor inicial sin esperar 1 segundo
    intervaloContador = setInterval(actualizarContador, 1000);
}

crearVelas();
configurarInteraccionCursor();
iniciarContador();
iniciarContador();