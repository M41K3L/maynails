import { db } from "./firebase-config.js";
import {
	doc,
	getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const WHATSAPP_NUMBER = "584242079359";
const TOTAL_SELLOS = 4;
const MAX_INTENTOS_PIN = 3;
const BLOQUEO_PIN_MS = 15 * 60 * 1000;
const TEMAS_TARJETA = ["rose-quartz", "champagne-silk", "soft-lavender", "peach-glow", "pearl-nude"];

const consultaForm = document.getElementById("consulta-form");
const telefonoConsulta = document.getElementById("telefono-consulta");
const pinConsulta = document.getElementById("pin-consulta");
const consultaMensaje = document.getElementById("consulta-mensaje");
const consultaBoton = consultaForm.querySelector("button[type='submit']");
const tarjetaResultado = document.getElementById("tarjeta-resultado");
const clientaNombre = document.getElementById("clienta-nombre");
const visitasResumen = document.getElementById("visitas-resumen");
const sellosGrid = document.getElementById("sellos-grid");
const premioEstado = document.getElementById("premio-estado");
const reclamarPremio = document.getElementById("reclamar-premio");
const invitarAmiga = document.getElementById("invitar-amiga");
const servicioSimulador = document.getElementById("servicio-simulador");
const porcentajeSimulador = document.getElementById("porcentaje-simulador");
const montoSimulador = document.getElementById("monto-simulador");
const montoSimuladorValor = document.getElementById("monto-simulador-valor");
const precioNormal = document.getElementById("precio-normal");
const precioPremio = document.getElementById("precio-premio");
const ahorroPremio = document.getElementById("ahorro-premio");
const porcentajePremio = document.getElementById("porcentaje-premio");
const qrPersonalToggle = document.getElementById("ver-qr-personal");
const qrPersonalPanel = document.getElementById("qr-personal-panel");
const qrPersonalImagen = document.getElementById("qr-personal-imagen");
const qrPersonalMensaje = document.getElementById("qr-personal-mensaje");
const visitasProgreso = document.getElementById("visitas-progreso");
const progresoPista = document.querySelector(".fidelidad-progreso-pista");
const porcentajeActual = document.getElementById("porcentaje-actual");
const referidasResumen = document.getElementById("referidas-resumen");
const referidasProgreso = document.getElementById("referidas-progreso");
const referidasPista = document.getElementById("referidas-pista");

let consultaEnCurso = false;
let bloqueoTimer = null;

function normalizarTelefonoVE(rawTelefono) {
	const entrada = String(rawTelefono || "").trim();
	if (!entrada) return "";
	const empiezaConMas = entrada.startsWith("+");
	const digitos = entrada.replace(/\D/g, "");
	let normalizado = "";
	if (empiezaConMas) {
		if (digitos.startsWith("58") && digitos.length === 12) normalizado = `+${digitos}`;
	} else if (digitos.startsWith("58") && digitos.length === 12) {
		normalizado = `+${digitos}`;
	} else if (digitos.startsWith("0") && digitos.length === 11) {
		normalizado = `+58${digitos.slice(1)}`;
	} else if (digitos.length === 10) {
		normalizado = `+58${digitos}`;
	}
	return /^\+58\d{10}$/.test(normalizado) ? normalizado : "";
}

function establecerMensaje(elemento, texto, esError = false) {
	elemento.textContent = texto;
	elemento.classList.toggle("es-error", esError);
}

function telefonoValido(telefono) {
	return /^\+58\d{10}$/.test(telefono);
}

function obtenerDescuentoActual(referidosCiclo, sellos) {
	const bonoReferidas = Math.min(2, Math.max(0, referidosCiclo)) * 2.5;
	const premioBase = sellos >= TOTAL_SELLOS ? 15 : 0;
	return premioBase + bonoReferidas;
}

function porcentajeTexto(porcentaje) {
	return `${String(porcentaje).replace(".", ",")}%`;
}

function claveIntentos(telefono) {
	return `maynails-fidelidad-intentos:${telefono}`;
}

function leerIntentos(telefono) {
	try {
		const guardados = localStorage.getItem(claveIntentos(telefono));
		if (!guardados) return { count: 0, lockedUntil: 0 };
		const intentos = JSON.parse(guardados);
		if (!Number.isInteger(intentos.count) || !Number.isFinite(intentos.lockedUntil)) {
			localStorage.removeItem(claveIntentos(telefono));
			return { count: 0, lockedUntil: 0 };
		}
		return intentos;
	} catch (error) {
		console.error("No se pudo consultar el bloqueo de intentos del navegador.", error);
		throw new Error("No se pudo verificar el bloqueo de seguridad. Habilita el almacenamiento del navegador e inténtalo de nuevo.");
	}
}

function actualizarBloqueoConsulta() {
	if (bloqueoTimer) {
		window.clearInterval(bloqueoTimer);
		bloqueoTimer = null;
	}
	const telefono = normalizarTelefonoVE(telefonoConsulta.value);
	if (!telefonoValido(telefono)) {
		consultaBoton.disabled = consultaEnCurso;
		return;
	}

	let intentos;
	try {
		intentos = leerIntentos(telefono);
	} catch (error) {
		consultaBoton.disabled = true;
		establecerMensaje(consultaMensaje, error.message, true);
		return;
	}

	const mostrarEspera = () => {
		const restante = intentos.lockedUntil - Date.now();
		if (restante <= 0) {
			try {
				localStorage.removeItem(claveIntentos(telefono));
			} catch (error) {
				console.error("No se pudo limpiar el bloqueo vencido.", error);
				establecerMensaje(consultaMensaje, "No se pudo restablecer el bloqueo. Revisa el almacenamiento del navegador.", true);
				consultaBoton.disabled = true;
				return;
			}
			window.clearInterval(bloqueoTimer);
			bloqueoTimer = null;
			consultaBoton.disabled = consultaEnCurso;
			establecerMensaje(consultaMensaje, "Ya puedes intentar consultar tu tarjeta.");
			return;
		}
		const segundos = Math.ceil(restante / 1000);
		const minutosTexto = String(Math.floor(segundos / 60)).padStart(2, "0");
		const segundosTexto = String(segundos % 60).padStart(2, "0");
		consultaBoton.disabled = true;
		establecerMensaje(consultaMensaje, `Demasiados intentos. Podrás volver a consultar en ${minutosTexto}:${segundosTexto}.`, true);
	};

	if (intentos.lockedUntil > Date.now()) {
		mostrarEspera();
		bloqueoTimer = window.setInterval(mostrarEspera, 1000);
	} else {
		consultaBoton.disabled = consultaEnCurso;
	}
}

function registrarIntentoFallido(telefono) {
	const anterior = leerIntentos(telefono);
	const count = anterior.lockedUntil > Date.now() ? MAX_INTENTOS_PIN : anterior.count + 1;
	const estado = {
		count,
		lockedUntil: count >= MAX_INTENTOS_PIN ? Date.now() + BLOQUEO_PIN_MS : 0
	};
	try {
		localStorage.setItem(claveIntentos(telefono), JSON.stringify(estado));
	} catch (error) {
		console.error("No se pudo guardar el bloqueo de intentos.", error);
		throw new Error("No se pudo guardar el control de intentos. Habilita el almacenamiento del navegador.");
	}
	actualizarBloqueoConsulta();
	if (estado.lockedUntil) {
		return;
	}
	const restantes = MAX_INTENTOS_PIN - count;
	establecerMensaje(
		consultaMensaje,
		`El teléfono o el PIN son incorrectos. Te quedan ${restantes} ${restantes === 1 ? "intento" : "intentos"}.`,
		true
	);
}

function reiniciarIntentos(telefono) {
	try {
		localStorage.removeItem(claveIntentos(telefono));
	} catch (error) {
		console.error("No se pudo reiniciar el contador de intentos.", error);
		throw new Error("La tarjeta se encontró, pero no se pudo reiniciar el control de intentos. Revisa el almacenamiento del navegador.");
	}
}

function datosDeTarjeta(documento) {
	const datos = documento.data();
	const sellos = Number(datos.sellos ?? datos.visitas ?? 0);
	return {
		docId: documento.id,
		telefono: normalizarTelefonoVE(datos.telefonoNormalizado || datos.telefono),
		pin: typeof datos.pin === "string" ? datos.pin : "",
		nombre: typeof datos.nombre === "string" && datos.nombre.trim() ? datos.nombre.trim() : "Clienta MayNails",
		referidosCiclo: Number.isFinite(Number(datos.referidosCiclo ?? datos.referidosConfirmados))
			? Math.min(2, Math.max(0, Math.floor(Number(datos.referidosCiclo ?? datos.referidosConfirmados))))
			: 0,
		sellos: Number.isFinite(sellos) ? Math.min(TOTAL_SELLOS, Math.max(0, Math.floor(sellos))) : 0,
		ultimaVisita: datos.ultimaVisita ?? null,
		premioDisponible: datos.premioDisponible === true
	};
}

function temaDeTarjeta(clienta) {
	const fuente = `${clienta.telefono || ""}${clienta.pin || ""}`;
	let hash = 2166136261;
	for (let indice = 0; indice < fuente.length; indice += 1) {
		hash ^= fuente.charCodeAt(indice);
		hash = Math.imul(hash, 16777619);
	}
	return TEMAS_TARJETA[(hash >>> 0) % TEMAS_TARJETA.length];
}

function actualizarSimulador() {
	const monto = Number(montoSimulador.value);
	const porcentaje = Number(porcentajeSimulador.value);
	const descuento = monto * porcentaje / 100;
	const formatoUSD = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2
	});

	montoSimuladorValor.value = formatoUSD.format(monto);
	montoSimuladorValor.textContent = formatoUSD.format(monto);
	precioNormal.textContent = formatoUSD.format(monto);
	precioPremio.textContent = formatoUSD.format(monto - descuento);
	ahorroPremio.textContent = formatoUSD.format(descuento);
	porcentajePremio.textContent = porcentajeTexto(porcentaje);
}

function renderizarTarjeta(clienta) {
	tarjetaResultado.classList.remove(...TEMAS_TARJETA.map((tema) => `tema-${tema}`));
	tarjetaResultado.classList.add(`tema-${temaDeTarjeta(clienta)}`);
	clientaNombre.textContent = clienta.nombre;
	const premioDisponible = clienta.premioDisponible || clienta.sellos >= TOTAL_SELLOS;
	const sellosCompletados = Math.min(clienta.sellos, TOTAL_SELLOS);
	const referidosCiclo = Math.min(2, Math.max(0, Math.floor(clienta.referidosCiclo || 0)));
	const porcentajeDescuento = obtenerDescuentoActual(referidosCiclo, premioDisponible ? TOTAL_SELLOS : sellosCompletados);
	visitasResumen.textContent = `${sellosCompletados} de ${TOTAL_SELLOS} visitas`;
	visitasProgreso.style.width = `${sellosCompletados / TOTAL_SELLOS * 100}%`;
	progresoPista.setAttribute("aria-valuenow", String(sellosCompletados));
	porcentajeActual.textContent = premioDisponible
		? `Premio base activo: 15% OFF${referidosCiclo ? ` + ${porcentajeTexto(referidosCiclo * 2.5)} de bono por referidas = ${porcentajeTexto(porcentajeDescuento)} OFF` : ""}`
		: referidosCiclo
			? `Bono disponible para tu próxima cita: ${porcentajeTexto(porcentajeDescuento)} OFF por referidas. Completa 4 visitas para activar el 15% base.`
			: "Completa 4 visitas para activar tu 15% base en el canje de la 5ta.";
	referidasResumen.textContent = referidosCiclo >= 2
		? "2/2 referidas · +5% disponible"
		: `${referidosCiclo}/2 referidas · +${porcentajeTexto(referidosCiclo * 2.5)} disponible`;
	referidasProgreso.style.width = `${referidosCiclo / 2 * 100}%`;
	referidasPista.setAttribute("aria-valuenow", String(referidosCiclo));
	sellosGrid.replaceChildren();

	for (let indice = 0; indice < TOTAL_SELLOS; indice += 1) {
		const sello = document.createElement("div");
		sello.className = `fidelidad-sello${indice < sellosCompletados ? " esta-completo" : ""}`;
		sello.setAttribute("aria-label", `Visita ${indice + 1}: ${indice < sellosCompletados ? "sellada" : "pendiente"}`);
		sello.textContent = indice < sellosCompletados ? "♥" : String(indice + 1);
		sellosGrid.append(sello);
	}

	const espacioPremio = document.createElement("div");
	espacioPremio.className = `fidelidad-sello fidelidad-sello-premio${premioDisponible ? " premio-desbloqueado" : ""}`;
	espacioPremio.setAttribute("aria-label", `Descuento disponible: ${porcentajeTexto(porcentajeDescuento)}`);
	espacioPremio.innerHTML = `<span>Disponible</span><strong>${porcentajeTexto(porcentajeDescuento)}</strong>`;
	sellosGrid.append(espacioPremio);

	premioEstado.textContent = premioDisponible
		? `¡Premio base desbloqueado! Tienes ${porcentajeTexto(porcentajeDescuento)} disponible para tu próxima cita.`
		: referidosCiclo
			? `Puedes usar tu bono de ${porcentajeTexto(porcentajeDescuento)} en cada cita mientras siga disponible. Te faltan ${TOTAL_SELLOS - sellosCompletados} ${TOTAL_SELLOS - sellosCompletados === 1 ? "visita" : "visitas"} para desbloquear el 15% base.`
			: `Te faltan ${TOTAL_SELLOS - sellosCompletados} ${TOTAL_SELLOS - sellosCompletados === 1 ? "visita" : "visitas"} para desbloquear el 15% base.`;
	const textoInvitacion = `Hola amiga, te invito a agendar tu servicio en MayNails Studio: https://m41k3l.github.io/maynails/agenda.html\n\nIndica que vas de parte de ${clienta.nombre} (teléfono de referencia: ${clienta.telefono}). Cada amiga nueva atendida te da 2,5% de descuento y con 2 amigas acumulas 5% adicional (20% total al tener también el premio base). El bono se puede usar en tus citas aunque aún no completes las 4 visitas del premio base.`;
	invitarAmiga.href = `https://wa.me/?text=${encodeURIComponent(textoInvitacion)}`;

	if (porcentajeDescuento > 0) {
		const textoCanje = premioDisponible
			? `Hola, soy ${clienta.nombre}. Quiero usar mi descuento de ${porcentajeTexto(porcentajeDescuento)} en mi cita de MayNails.`
			: `Hola, soy ${clienta.nombre}. Quiero usar mi bono de referidas de ${porcentajeTexto(porcentajeDescuento)} en mi cita de MayNails.`;
		reclamarPremio.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(textoCanje)}`;
		reclamarPremio.hidden = false;
		reclamarPremio.textContent = premioDisponible ? "Reclamar mi premio por WhatsApp" : "Usar mi bono por WhatsApp";
	} else {
		reclamarPremio.hidden = true;
		reclamarPremio.removeAttribute("href");
	}
	qrPersonalToggle.setAttribute("aria-expanded", "false");
	qrPersonalToggle.textContent = "Ver mi código QR personal";
	qrPersonalPanel.hidden = true;
	qrPersonalImagen.replaceChildren();
	qrPersonalMensaje.textContent = "";
	tarjetaResultado.hidden = false;
	establecerMensaje(consultaMensaje, "");
}

function ocultarTarjeta() {
	tarjetaResultado.hidden = true;
	reclamarPremio.hidden = true;
	reclamarPremio.removeAttribute("href");

	qrPersonalToggle.setAttribute("aria-expanded", "false");
	qrPersonalToggle.textContent = "Ver mi código QR personal";
	qrPersonalPanel.hidden = true;
	qrPersonalImagen.replaceChildren();
	qrPersonalMensaje.textContent = "";
}

qrPersonalToggle.addEventListener("click", () => {
	const mostrar = qrPersonalPanel.hidden;
	qrPersonalPanel.hidden = !mostrar;
	qrPersonalToggle.setAttribute("aria-expanded", String(mostrar));
	qrPersonalToggle.textContent = mostrar ? "Ocultar mi código QR personal" : "Ver mi código QR personal";
	if (!mostrar || qrPersonalImagen.childElementCount > 0) return;

	try {
		if (!window.QRCode) throw new Error("No se pudo cargar la librería de códigos QR.");
		const telefono = normalizarTelefonoVE(telefonoConsulta.value);
		const pin = pinConsulta.value.trim();
		const urlTarjeta = new URL("https://m41k3l.github.io/maynails/fidelidad.html");
		urlTarjeta.searchParams.set("tel", telefono);
		urlTarjeta.searchParams.set("pin", pin);
		new window.QRCode(qrPersonalImagen, {
			text: urlTarjeta.href,
			width: 200,
			height: 200,
			colorDark: "#6E212A",
			colorLight: "#FFFFFF",
			correctLevel: window.QRCode.CorrectLevel.H
		});
		if (!qrPersonalImagen.querySelector("canvas, img")) {
			throw new Error("No se pudo generar el código QR.");
		}
	} catch (error) {
		console.error("No se pudo generar el código QR personal.", error);
		qrPersonalMensaje.textContent = "No se pudo generar el QR. Revisa tu conexión e inténtalo de nuevo.";
	}
});

async function consultarClienta(telefono, pin) {
	const digitosTelefono = telefono.slice(1);
	let errorPermiso = null;
	for (const id of [`${digitosTelefono}_${pin}`, `${telefono}_${pin}`]) {
		try {
			const resultado = await getDoc(doc(db, "fidelidad", id));
			if (resultado.exists() &&
				normalizarTelefonoVE(resultado.data().telefonoNormalizado || resultado.data().telefono) === telefono &&
				resultado.data().pin === pin) {
				const clienta = datosDeTarjeta(resultado);
				renderizarTarjeta(clienta);
				return clienta;
			}
		} catch (error) {
			if (error.code !== "permission-denied") throw error;
			errorPermiso = error;
		}
	}
	if (errorPermiso) throw errorPermiso;
	return null;
}

consultaForm.addEventListener("submit", async (evento) => {
	evento.preventDefault();
	if (consultaEnCurso) return;
	const telefono = normalizarTelefonoVE(telefonoConsulta.value);
	const pin = pinConsulta.value.trim();
	if (!telefonoValido(telefono) || !/^\d{4}$/.test(pin)) {
		ocultarTarjeta();
		establecerMensaje(consultaMensaje, "Ingresa un teléfono venezolano válido (+58 y 10 dígitos) y un PIN de exactamente 4 dígitos.", true);
		return;
	}
	telefonoConsulta.value = telefono;
	actualizarBloqueoConsulta();
	if (consultaBoton.disabled) return;
	consultaEnCurso = true;
	consultaBoton.disabled = true;
	establecerMensaje(consultaMensaje, "Buscando tu tarjeta…");
	try {
		const clienta = await consultarClienta(telefono, pin);
		if (!clienta) {
			registrarIntentoFallido(telefono);
			return;
		}
		reiniciarIntentos(telefono);
		renderizarTarjeta(clienta);
	} catch (error) {
		if (error.code === "permission-denied") {
			try {
				registrarIntentoFallido(telefono);
			} catch (errorIntentos) {
				establecerMensaje(consultaMensaje, errorIntentos.message, true);
			}
			return;
		}
		console.error("No se pudo consultar la tarjeta de fidelidad.", error);
		ocultarTarjeta();
		establecerMensaje(consultaMensaje, error.message || "No se pudo consultar la tarjeta. Inténtalo de nuevo más tarde.", true);
	} finally {
		consultaEnCurso = false;
		actualizarBloqueoConsulta();
	}
});

telefonoConsulta.addEventListener("input", () => {
	ocultarTarjeta();
	actualizarBloqueoConsulta();
});
telefonoConsulta.addEventListener("blur", () => {
	const telefono = normalizarTelefonoVE(telefonoConsulta.value);
	if (telefono) telefonoConsulta.value = telefono;
});
pinConsulta.addEventListener("input", ocultarTarjeta);

servicioSimulador.addEventListener("change", () => {
	montoSimulador.value = servicioSimulador.value;
	actualizarSimulador();
});
porcentajeSimulador.addEventListener("change", actualizarSimulador);
montoSimulador.addEventListener("input", () => {
	const servicioActual = servicioSimulador.selectedOptions[0];
	const servicioCoincidente = servicioActual?.value === montoSimulador.value
		? servicioActual
		: [...servicioSimulador.options].find((opcion) => opcion.value === montoSimulador.value);
	servicioSimulador.value = servicioCoincidente ? servicioCoincidente.value : "";
	actualizarSimulador();
});
actualizarSimulador();

const parametrosIniciales = new URLSearchParams(window.location.search);
const telefonoInicial = parametrosIniciales.get("tel");
const pinInicial = parametrosIniciales.get("pin");
const enlaceNfcValido = telefonoInicial !== null &&
	pinInicial !== null &&
	telefonoValido(normalizarTelefonoVE(telefonoInicial)) &&
	/^\d{4}$/.test(pinInicial);

if (telefonoInicial !== null || pinInicial !== null) {
	parametrosIniciales.delete("tel");
	parametrosIniciales.delete("pin");
	const queryLimpia = parametrosIniciales.toString();
	window.history.replaceState(
		window.history.state,
		"",
		`${window.location.pathname}${queryLimpia ? `?${queryLimpia}` : ""}${window.location.hash}`
	);
}

if (enlaceNfcValido) {
	telefonoConsulta.value = normalizarTelefonoVE(telefonoInicial);
	pinConsulta.value = pinInicial;
	consultaForm.requestSubmit();
} else {
	const telefonoAnterior = parametrosIniciales.get("telefono");
	if (telefonoAnterior) {
		telefonoConsulta.value = normalizarTelefonoVE(telefonoAnterior);
	}
	actualizarBloqueoConsulta();
}
