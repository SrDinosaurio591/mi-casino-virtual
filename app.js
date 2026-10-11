// Inicializar fichas usando localStorage
let fichas = parseInt(localStorage.getItem('fichas_casino')) || 1000;
actualizarPantallaFichas();

function actualizarPantallaFichas() {
    document.getElementById('balance-fichas').innerText = fichas;
    localStorage.setItem('fichas_casino', fichas);
}

function obtenerApuestaValida() {
    let cantidad = parseInt(document.getElementById('cantidad-apuesta').value);
    if (isNaN(cantidad) || cantidad <= 0) {
        alert("Por favor introduce una apuesta válida.");
        return 0;
    }
    if (cantidad > fichas) {
        alert("¡No tienes suficientes fichas para esta apuesta!");
        return 0;
    }
    return cantidad;
}

function recargarFichas() {
    fichas += 500;
    actualizarPantallaFichas();
}

// --- AUXILIAR: CREAR BARAJA DE CARTAS ---
let baraja = [];
let manoJugador = [];
let manoBanca = [];
let apuestaActualBJ = 0;

function crearBaraja() {
    const palos = ['❤️', '💎', '♣️', '♠️'];
    const valores = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let nuevaBaraja = [];
    for (let palo of palos) {
        for (let valor of valores) {
            nuevaBaraja.push({ valor, palo });
        }
    }
    for (let i = nuevaBaraja.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [nuevaBaraja[i], nuevaBaraja[j]] = [nuevaBaraja[j], nuevaBaraja[i]];
    }
    return nuevaBaraja;
}

// --- JUEGO 1: TRAGAMONEDAS ---
function jugarTragamonedas() {
    let apuesta = obtenerApuestaValida();
    if (apuesta === 0) return;

    fichas -= apuesta;
    const opciones = ['🍒', '🍋', '💎', '🔔'];
    let r1 = opciones[Math.floor(Math.random() * opciones.length)];
    let r2 = opciones[Math.floor(Math.random() * opciones.length)];
    let r3 = opciones[Math.floor(Math.random() * opciones.length)];

    document.getElementById('slot-resultado').innerText = `${r1} | ${r2} | ${r3}`;

    if (r1 === r2 && r2 === r3) {
        let premio = apuesta * 5;
        fichas += premio;
        alert(`🎉 ¡JACKPOT! Ganaste ${premio} fichas.`);
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
        fichas += Math.floor(apuesta * 1.5);
    }
    actualizarPantallaFichas();
}

// --- JUEGO 2: RULETA ---
function jugarRuleta(colorApostado) {
    let apuesta = obtenerApuestaValida();
    if (apuesta === 0) return;

    fichas -= apuesta;
    let resultadoColor = Math.random() < 0.5 ? 'rojo' : 'negro';
    let txtResultado = document.getElementById('ruleta-resultado');

    if (resultadoColor === colorApostado) {
        fichas += apuesta * 2;
        txtResultado.innerText = `🟢 Cayó ${resultadoColor.toUpperCase()}. ¡Ganaste!`;
        txtResultado.style.color = "#4caf50";
    } else {
        txtResultado.innerText = `🔴 Cayó ${resultadoColor.toUpperCase()}. Perdiste.`;
        txtResultado.style.color = "#f44336";
    }
    actualizarPantallaFichas();
}

// --- JUEGO 3: BLACKJACK ---
function calcularPuntos(mano) {
    let puntos = 0;
    let ases = 0;
    for (let carta of mano) {
        if (['J', 'Q', 'K'].includes(carta.valor)) puntos += 10;
        else if (carta.valor === 'A') { ases += 1; puntos += 11; }
        else puntos += parseInt(carta.valor);
    }
    while (puntos > 21 && ases > 0) { puntos -= 10; ases -= 1; }
    return puntos;
}

function mostrarMano(mano) {
    return mano.map(c => `${c.valor}${c.palo}`).join(' ');
}

function iniciarBlackjack() {
    apuestaActualBJ = obtenerApuestaValida();
    if (apuestaActualBJ === 0) return;

    fichas -= apuestaActualBJ;
    actualizarPantallaFichas();

    baraja = crearBaraja();
    manoJugador = [baraja.pop(), baraja.pop()];
    manoBanca = [baraja.pop(), baraja.pop()];

    document.getElementById('btn-bj-iniciar').disabled = true;
    document.getElementById('btn-bj-pedir').disabled = false;
    document.getElementById('btn-bj-plantarse').disabled = false;
    document.getElementById('bj-resultado').innerText = "¡Tu turno! ¿Pides o te plantas?";

    actualizarMesaBJ(true);
}

function actualizarMesaBJ(ocultarBanca) {
    document.getElementById('bj-cartas-jugador').innerText = mostrarMano(manoJugador);
    document.getElementById('bj-puntos-jugador').innerText = calcularPuntos(manoJugador);

    if (ocultarBanca) {
        document.getElementById('bj-cartas-banca').innerText = `${manoBanca[0].valor}${manoBanca[0].palo} 🂠`;
        document.getElementById('bj-puntos-banca').innerText = "?";
    } else {
        document.getElementById('bj-cartas-banca').innerText = mostrarMano(manoBanca);
        document.getElementById('bj-puntos-banca').innerText = calcularPuntos(manoBanca);
    }
}

function pedirCartaBJ() {
    manoJugador.push(baraja.pop());
    actualizarMesaBJ(true);
    if (calcularPuntos(manoJugador) > 21) {
        finalizarBJ("perdiste", "Te pasaste de 21. ¡La banca gana!");
    }
}

function plantarseBJ() {
    while (calcularPuntos(manoBanca) < 17) {
        manoBanca.push(baraja.pop());
    }
    actualizarMesaBJ(false);
    
    let ptsJugador = calcularPuntos(manoJugador);
    let ptsBanca = calcularPuntos(manoBanca);

    if (ptsBanca > 21) finalizarBJ("ganaste", `La banca se pasó. ¡Ganaste $${apuestaActualBJ * 2}!`);
    else if (ptsJugador > ptsBanca) finalizarBJ("ganaste", `¡Ganaste! ${ptsJugador} vs ${ptsBanca}.`);
    else if (ptsJugador < ptsBanca) finalizarBJ("perdiste", `Perdiste. La banca gana con ${ptsBanca}.`);
    else finalizarBJ("empate", `Empate a ${ptsJugador}. Recuperas tu apuesta.`);
}

function finalizarBJ(resultado, mensaje) {
    if (resultado === "ganaste") fichas += apuestaActualBJ * 2;
    else if (resultado === "empate") fichas += apuestaActualBJ;
    
    document.getElementById('bj-resultado').innerText = mensaje;
    document.getElementById('btn-bj-iniciar').disabled = false;
    document.getElementById('btn-bj-pedir').disabled = true;
    document.getElementById('btn-bj-plantarse').disabled = true;
    actualizarPantallaFichas();
}

// --- JUEGO 4: PÓKER ---
function jugarPoker() {
    let apuesta = obtenerApuestaValida();
    if (apuesta === 0) return;

    fichas -= apuesta;
    let pokerBaraja = crearBaraja();
    let mano = [pokerBaraja.pop(), pokerBaraja.pop(), pokerBaraja.pop(), pokerBaraja.pop(), pokerBaraja.pop()];

    document.getElementById('poker-mano').innerText = mostrarMano(mano);

    let conteoValores = {};
    let conteoPalos = {};
    mano.forEach(c => {
        conteoValores[c.valor] = (conteoValores[c.valor] || 0) + 1;
        conteoPalos[c.palo] = (conteoPalos[c.palo] || 0) + 1;
    });

    let frecuencias = Object.values(conteoValores);
    let txtResultado = document.getElementById('poker-resultado');

    if (Object.values(conteoPalos).includes(5)) {
        fichas += apuesta * 5;
        txtResultado.innerText = "🔥 ¡COLOR! Ganaste 5x.";
    } else if (frecuencias.includes(4)) {
        fichas += apuesta * 8;
        txtResultado.innerText = "⭐ ¡PÓKER! Ganaste 8x.";
    } else if (frecuencias.includes(3) && frecuencias.includes(2)) {
        fichas += apuesta * 4;
        txtResultado.innerText = "🏠 ¡FULL HOUSE! Ganaste 4x.";
    } else if (frecuencias.includes(3)) {
        fichas += apuesta * 2;
        txtResultado.innerText = "✨ ¡TERNA! Ganaste 2x.";
    } else if (frecuencias.filter(x => x === 2).length === 2) {
        fichas += Math.floor(apuesta * 1.5);
        txtResultado.innerText = "👥 ¡DOBLE PAREJA! Ganaste 1.5x.";
    } else if (frecuencias.includes(2)) {
        fichas += apuesta;
        txtResultado.innerText = "🔹 ¡PAREJA! Recuperas tu apuesta.";
    } else {
        txtResultado.innerText = "❌ Carta alta. Sin combinaciones.";
    }
    actualizarPantallaFichas();
}
