import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { db, firebaseApp } from "./firebase-config.js";
import {
	getAuth,
	GoogleAuthProvider,
	onAuthStateChanged,
	signInWithPopup,
	signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	onSnapshot,
	query,
	runTransaction,
	serverTimestamp,
	setDoc,
	updateDoc,
	increment,
	writeBatch,
	where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const auth = getAuth(firebaseApp);
const proveedorGoogle = new GoogleAuthProvider();
const CORREOS_ADMIN = new Set([
	"mayracmarin25@gmail.com",
	"riveromaikel65@gmail.com"
]);
const METODO_FIADO = "Fiado / Cuenta por cobrar";
const METODOS = ["Binance Pay", "Pago Móvil", "Efectivo", "Efectivo Bs", "Efectivo Euro", "Efectivo USDT", METODO_FIADO];
const TOTAL_SELLOS = 4;
const WHATSAPP_NUMBER = "584242079359";
const TEMAS_TARJETA = ["rose-quartz", "champagne-silk", "soft-lavender", "peach-glow", "pearl-nude"];
const METODOS_BS = ["Pago Móvil", "Efectivo Bs"];
const CATEGORIAS = [
	"Manicure",
	"Nivelación",
	"Sistema Softgel",
	"Sistema Acrílico",
	"Láser",
	"Retiro de Sistema",
	"Uña adicional",
	"Manicura",
	"Sistema Jelly",
	"Sistema Dual",
	"Pedicure",
	"Quiropedia",
	"Tratamiento Láser",
	"Insumos/Gastos"
];
const CATEGORIAS_GASTO = [
	"Limpieza",
	"Café / Atención al cliente",
	"Materiales e insumos",
	"Herramientas y equipos",
	"Otros gastos"
];
const CATEGORIAS_CLIENTA = ["Clienta Antigua", "Clienta Fija", "Clienta Nueva"];
const DIVISAS_TASA = { BCV: "USD", EURO: "EUR", USDT: "USDT" };
const formatoDinero = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	minimumFractionDigits: 2
});

const app = document.getElementById("admin-main");
const loginButton = document.getElementById("admin-login");
const logoutButton = document.getElementById("admin-logout");
const authStatus = document.getElementById("admin-auth-status");
const form = document.getElementById("form-movimiento");
const fechaResumen = document.getElementById("fecha-resumen");
const tabla = document.getElementById("movimientos-lista");
const historialVacio = document.getElementById("historial-vacio");
const mensaje = document.getElementById("caja-mensaje");
const tasasForm = document.getElementById("tasas-form");
const tasaBcvInput = document.getElementById("tasa-bcv");
const tasaEuroInput = document.getElementById("tasa-euro");
const tasaUsdtInput = document.getElementById("tasa-usdt");
const tasasMensaje = document.getElementById("tasas-mensaje");
const montoUsdCampo = document.getElementById("monto-usd-campo");
const montoBsCampos = document.getElementById("monto-bs-campos");
const montoUsdPreview = document.getElementById("monto-usd-calculado");
const montoBsPreview = document.getElementById("monto-bs-calculado");
const montoUsdDivisaPreview = document.getElementById("monto-usd-divisa-calculado");
const categoriaGastoCampo = document.getElementById("categoria-gasto-campo");
const formularioEdicion = document.getElementById("editar-movimiento-form");
const filtroTipoMovimiento = document.getElementById("filtro-tipo-movimiento");
const filtroFechaMovimiento = document.getElementById("filtro-fecha-movimiento");
const filtroMesMovimiento = document.getElementById("filtro-mes-movimiento");
const historialContenido = document.getElementById("historial-contenido");
const toggleHistorial = document.getElementById("toggle-historial-movimientos");
const movimientosRef = collection(db, "movimientos");
const TASAS_STORAGE_KEY = "maynails-tasas-caja";
let movimientos = [];
let historialAbierto = false;
let ultimoCampoMontoEditado = "montoUsd";
let usuarioActual = null;
let cancelarMovimientos = null;
let movimientoEditandoId = null;
let guardandoEdicionMovimiento = false;
let inicioSesionEnCurso = false;
let tasasPorFecha = {};

const panelCaja = document.getElementById("panel-caja");
const panelClub = document.getElementById("panel-club");
const panelAgenda = document.getElementById("panel-agenda");
const tabCaja = document.getElementById("tab-caja");
const tabClub = document.getElementById("tab-club");
const tabAgenda = document.getElementById("tab-agenda");
const agendaConfigForm = document.getElementById("agenda-config-form");
const agendaBloqueoForm = document.getElementById("agenda-bloqueo-form");
const agendaConfigMensaje = document.getElementById("agenda-config-mensaje");
const agendaBloqueosLista = document.getElementById("agenda-bloqueos-lista");
const agendaCitasLista = document.getElementById("agenda-citas-lista");
const agendaCitasVacio = document.getElementById("agenda-citas-vacio");
const citasAdminMensaje = document.getElementById("citas-admin-mensaje");
const agendaEstadisticasMensaje = document.getElementById("agenda-estadisticas-mensaje");
let cancelarCitas = null;
let cancelarConfigAgenda = null;
let citasAgenda = [];
let mensajeCitaPersistente = "";
const clubAdminForm = document.getElementById("club-admin-form");
const clubSugerencias = document.getElementById("club-sugerencias");
const clubAdminMensaje = document.getElementById("club-admin-mensaje");
const clubTelefonoInput = document.getElementById("club-telefono-admin");
const clubNombreInput = document.getElementById("club-nombre-admin");
const clubCategoriaInput = document.getElementById("club-categoria-admin");
const clubNotaInput = document.getElementById("club-nota-admin");
const clubReferidaPorInput = document.getElementById("club-referida-por-admin");
const clubGuardarPerfil = document.getElementById("club-guardar-perfil");
const clubTarjeta = document.getElementById("club-tarjeta-resultado");
const clubClientaNombre = document.getElementById("club-clienta-nombre");
const clubClientaCategoria = document.getElementById("club-clienta-categoria");
const clubClientaNota = document.getElementById("club-clienta-nota");
const clubClientaPin = document.getElementById("club-clienta-pin");
const clubReferidasResumen = document.getElementById("club-referidas-resumen");
const clubReferidasProgreso = document.getElementById("club-referidas-progreso");
const clubReferidosPorcentaje = document.getElementById("club-referidos-porcentaje");
const clubReferidaPor = document.getElementById("club-referida-por");
const clubQrCode = document.getElementById("club-qr-code");
const clubQrDescargar = document.getElementById("club-qr-descargar");
const clubQrMensaje = document.getElementById("club-qr-mensaje");
const clubVisitasResumen = document.getElementById("club-visitas-resumen");
const clubVisitasProgreso = document.getElementById("club-visitas-progreso");
const clubProgresoPista = panelClub.querySelector(".fidelidad-progreso-pista");
const clubSellosGrid = document.getElementById("club-sellos-grid");
const clubPremioEstado = document.getElementById("club-premio-estado");
const clubWhatsApp = document.getElementById("club-enviar-whatsapp");
const clubCopiarNfc = document.getElementById("club-copiar-nfc");
const clubSumarVisita = document.getElementById("club-sumar-visita");
const clubSumarReferida = document.getElementById("club-sumar-referida");
const clubCanjearPremio = document.getElementById("club-canjear-premio");
const clubMostrarCambioPin = document.getElementById("club-mostrar-cambio-pin");
const clubCambioPinForm = document.getElementById("club-cambio-pin-form");
const clubNuevoPinInput = document.getElementById("club-nuevo-pin");
const clubDeudaEstado = document.getElementById("club-deuda-estado");
const clubDeudaResumen = document.getElementById("club-deuda-resumen");
const clubSaldoPendienteInput = document.getElementById("club-saldo-pendiente");
const clubDetalleDeudaInput = document.getElementById("club-detalle-deuda");
const clubFechaDeudaInput = document.getElementById("club-fecha-deuda");
const clubAbonoMontoInput = document.getElementById("club-abono-monto");
const clubAbonoMetodoInput = document.getElementById("club-abono-metodo");
const clubAbonoACajaInput = document.getElementById("club-abono-a-caja");
const clubRegistrarAbonoButton = document.getElementById("club-registrar-abono");
const clientasDeudaLista = document.getElementById("clientas-deuda-lista");
const clientasDeudaVacio = document.getElementById("clientas-deuda-vacio");
const filtroDeudaClientas = document.getElementById("filtro-deuda-clientas");
const clientaFiadoCampo = document.getElementById("clienta-fiado-campo");
const clientaFiadoSelect = document.getElementById("clienta-fiado");
const fidelidadRef = collection(db, "fidelidad");
const configRef = collection(db, "config_agenda");
const citasRef = collection(db, "citas");
let clientaClubActual = null;
let clubEnCurso = false;
let clientas = [];
let cancelarFidelidad = null;

isSupported()
	.then((soportado) => {
		if (soportado) getAnalytics(firebaseApp);
	})
	.catch((error) => {
		console.warn("Firebase Analytics no está disponible en este navegador.", error);
	});

function fechaLocal() {
	const ahora = new Date();
	const zona = ahora.getTimezoneOffset() * 60000;
	return new Date(ahora.getTime() - zona).toISOString().slice(0, 10);
}

function normalizarDecimal(valor) {
	const numero = Number.parseFloat(String(valor ?? "").replace(/,/g, "."));
	return Number.isFinite(numero) ? numero : NaN;
}

window.normalizarDecimal = normalizarDecimal;

function limitarEntradaDecimal(evento) {
	const campo = evento.currentTarget;
	const valorAnterior = campo.value;
	const cursorAnterior = campo.selectionStart;
	const normalizado = valorAnterior.replace(/,/g, ".");
	const valorLimpio = normalizado
		.replace(/[^\d.]/g, "")
		.split("")
		.filter((caracter, indice, caracteres) => caracter !== "." || indice === caracteres.indexOf("."))
		.join("");
	if (valorLimpio !== valorAnterior) {
		campo.value = valorLimpio;
		if (cursorAnterior !== null) {
			const nuevoCursor = Math.max(0, cursorAnterior + (valorLimpio.length - valorAnterior.length));
			campo.setSelectionRange(nuevoCursor, nuevoCursor);
		}
	}
}

for (const campo of document.querySelectorAll('input[inputmode="decimal"]')) {
	campo.addEventListener("input", limitarEntradaDecimal);
}

function tasasDeFecha(fecha) {
	const tasas = tasasPorFecha[fecha];
	const BCV = normalizarDecimal(tasas?.BCV);
	const EURO = normalizarDecimal(tasas?.EURO);
	const USDT = normalizarDecimal(tasas?.USDT);
	return Number.isFinite(BCV) && BCV > 0
		? {
			BCV,
			EURO: Number.isFinite(EURO) && EURO > 0 ? EURO : BCV,
			USDT: Number.isFinite(USDT) && USDT > 0 ? USDT : BCV
		}
		: null;
}

function cargarTasasGuardadas(fecha) {
	try {
		const guardadas = localStorage.getItem(TASAS_STORAGE_KEY);
		tasasPorFecha = guardadas ? JSON.parse(guardadas) : {};
		if (!tasasPorFecha || typeof tasasPorFecha !== "object" || Array.isArray(tasasPorFecha)) {
			throw new Error("El formato guardado de tasas no es válido.");
		}
		const tasas = tasasDeFecha(fecha);
		tasaBcvInput.value = tasas ? String(tasas.BCV) : "";
		tasaEuroInput.value = tasas ? String(tasas.EURO) : "";
		tasaUsdtInput.value = tasas ? String(tasas.USDT) : "";
		tasasMensaje.textContent = tasas
			? `Tasas guardadas para ${formatearFecha(fecha)}.`
			: `Aún no hay tasas guardadas para ${formatearFecha(fecha)}.`;
		tasasMensaje.classList.remove("es-error");
	} catch (error) {
		console.error("No se pudieron leer las tasas guardadas.", error);
		tasasPorFecha = {};
		tasaBcvInput.value = "";
		tasaEuroInput.value = "";
		tasaUsdtInput.value = "";
		mostrarEstadoTasas("No se pudieron leer las tasas guardadas en este navegador.", true);
	}
	actualizarMontoConvertido();
}

async function cargarTasasFirestore(usuario, fecha) {
	if (!fecha || tasasDeFecha(fecha)) return;
	try {
		const snapshot = await getDoc(doc(db, "tasas_caja", fecha));
		if (!snapshot.exists()) return;
		if (!usuarioActual || usuarioActual.uid !== usuario.uid || form.elements.fecha.value !== fecha) return;
		const datos = snapshot.data();
		const tasaBcv = normalizarDecimal(datos.tasaBcv);
		const euroGuardado = normalizarDecimal(datos.tasaEuro);
		const usdtGuardado = normalizarDecimal(datos.tasaUsdt);
		const tasas = {
			BCV: tasaBcv,
			EURO: Number.isFinite(euroGuardado) && euroGuardado > 0 ? euroGuardado : tasaBcv,
			USDT: Number.isFinite(usdtGuardado) && usdtGuardado > 0 ? usdtGuardado : tasaBcv
		};
		if (!Number.isFinite(tasaBcv) || tasaBcv <= 0 || tasaBcv > 100000000 ||
			!["EURO", "USDT"].every((tipo) =>
				Number.isFinite(tasas[tipo]) && tasas[tipo] > 0 && tasas[tipo] <= 100000000
			)) {
			throw new Error("Firestore contiene una Tasa BCV inválida para esta fecha.");
		}
		tasasPorFecha[fecha] = tasas;
		try {
			localStorage.setItem(TASAS_STORAGE_KEY, JSON.stringify(tasasPorFecha));
		} catch (error) {
			console.warn("No se pudieron guardar localmente las tasas recuperadas de Firestore.", error);
		}
		tasaBcvInput.value = String(tasas.BCV);
		tasaEuroInput.value = String(tasas.EURO);
		tasaUsdtInput.value = String(tasas.USDT);
		mostrarEstadoTasas(`Tasas recuperadas de Firestore para ${formatearFecha(fecha)}.`, false);
		actualizarMontoConvertido();
	} catch (error) {
		console.error("No se pudieron recuperar las tasas desde Firestore.", error);
		const code = error?.code ? ` (${error.code})` : "";
		mostrarEstadoTasas(`No se pudieron recuperar las tasas de Firestore${code}; se conserva el almacenamiento local.`, true);
	}
}

function actualizarEstadoTasasEditadas() {
	const fecha = form.elements.fecha.value;
	const tasasGuardadas = tasasDeFecha(fecha);
	if (!tasasGuardadas) {
		mostrarEstadoTasas(`Aún no hay tasas guardadas para ${formatearFecha(fecha)}.`, false);
		return;
	}
	const BCV = normalizarDecimal(tasaBcvInput.value);
	const USDT = normalizarDecimal(tasaUsdtInput.value);
	const EURO = normalizarDecimal(tasaEuroInput.value);
	const cambiaron = BCV !== tasasGuardadas.BCV || EURO !== tasasGuardadas.EURO || USDT !== tasasGuardadas.USDT;
	mostrarEstadoTasas(
		cambiaron
			? "Hay cambios sin guardar. Guarda las tasas del día para usarlas en movimientos."
			: `Tasas guardadas para ${formatearFecha(fecha)}.`,
		false
	);
}

function mostrarEstadoTasas(texto, esError) {
	tasasMensaje.textContent = texto;
	tasasMensaje.classList.toggle("es-error", Boolean(esError));
}

function obtenerTasa(tipoTasa) {
	const campo = { BCV: tasaBcvInput, EURO: tasaEuroInput, USDT: tasaUsdtInput }[tipoTasa];
	if (!campo) return null;
	const tasa = normalizarDecimal(campo.value);
	if (Number.isFinite(tasa) && tasa > 0) return tasa;
	return tipoTasa === "BCV" ? null : obtenerTasa("BCV");
}

function esMetodoEnBolivares(metodo = form.elements.metodo.value) {
	return METODOS_BS.includes(metodo);
}

function actualizarCamposMoneda() {
	const usaBolivares = esMetodoEnBolivares();
	montoUsdCampo.hidden = false;
	montoUsdCampo.querySelector("input").required = true;
	montoBsCampos.hidden = !usaBolivares;
	form.elements.montoBs.required = usaBolivares;
	form.elements.tipoTasa.required = usaBolivares;
	document.getElementById("tipo-tasa-divisa-campo").hidden = usaBolivares;
	document.getElementById("tipo-tasa-divisa-campo").querySelector("select").required = !usaBolivares;
	document.getElementById("monto-divisa-preview").hidden = usaBolivares;
	actualizarEtiquetaDivisa();
	actualizarMontoConvertido();
}

function actualizarTasaSegunMetodo() {
	if (esMetodoEnBolivares()) return;
	const metodo = form.elements.metodo.value;
	const tipoTasa = metodo === "Efectivo Euro" ? "EURO"
		: metodo === "Efectivo USDT" || metodo === "Binance Pay" ? "USDT"
			: "BCV";
	form.elements.tipoTasaDivisa.value = tipoTasa;
}

function actualizarEtiquetaDivisa() {
	const tipoTasa = esMetodoEnBolivares()
		? form.elements.tipoTasa.value
		: form.elements.tipoTasaDivisa.value;
	const divisa = DIVISAS_TASA[tipoTasa] || "USD";
	document.getElementById("monto-usd-etiqueta").textContent = `Monto en ${divisa}`;
}

function actualizarMontoConvertido(origenMonto = "") {
	let montoBs = 0;
	if (esMetodoEnBolivares()) {
		const tipoTasa = form.elements.tipoTasa.value;
		const tasaActiva = obtenerTasa(tipoTasa);
		const origen = origenMonto || ultimoCampoMontoEditado;
		const montoBsEntrada = normalizarDecimal(form.elements.montoBs.value);
		const montoDivisaEntrada = normalizarDecimal(form.elements.montoUsd.value);
		if (tasaActiva && origen === "montoUsd") {
			montoBs = Number.isFinite(montoDivisaEntrada) && montoDivisaEntrada > 0
				? montoDivisaEntrada * tasaActiva
				: 0;
			form.elements.montoBs.value = montoBs > 0 ? String(montoBs) : "";
		} else if (tasaActiva && origen === "montoBs") {
			montoBs = Number.isFinite(montoBsEntrada) && montoBsEntrada > 0 ? montoBsEntrada : 0;
			form.elements.montoUsd.value = montoBs > 0 ? String(montoBs / tasaActiva) : "";
		} else {
			montoBs = Number.isFinite(montoBsEntrada) && montoBsEntrada > 0 ? montoBsEntrada : 0;
			if (tasaActiva && montoBs > 0 && !Number.isFinite(montoDivisaEntrada)) {
				form.elements.montoUsd.value = String(montoBs / tasaActiva);
			}
		}
		const tasaBcv = obtenerTasa("BCV");
		const equivalenteUsd = montoBs > 0 && tasaBcv ? montoBs / tasaBcv : 0;
		montoUsdPreview.value = formatoDinero.format(Number.isFinite(equivalenteUsd) ? equivalenteUsd : 0);
	} else {
		const montoEntrada = normalizarDecimal(form.elements.montoUsd.value);
		const montoDivisa = Number.isFinite(montoEntrada) && montoEntrada > 0 ? montoEntrada : 0;
		const tipoTasa = form.elements.tipoTasaDivisa.value;
		const tasa = obtenerTasa(tipoTasa);
		const tasaBcv = obtenerTasa("BCV");
		const montoBsCalculado = montoDivisa > 0 && tasa ? montoDivisa * tasa : 0;
		montoBs = Number.isFinite(montoBsCalculado) ? montoBsCalculado : 0;
		montoBsPreview.value = formatoBolivares(montoBs);
		const equivalenteUsd = montoBs > 0 && tasaBcv ? montoBs / tasaBcv : 0;
		montoUsdDivisaPreview.value = formatoDinero.format(Number.isFinite(equivalenteUsd) ? equivalenteUsd : 0);
	}
	const tasas = {
		BCV: obtenerTasa("BCV"),
		EURO: obtenerTasa("EURO"),
		USDT: obtenerTasa("USDT")
	};
	const equivalenteBcv = Number.isFinite(tasas.BCV) && tasas.BCV > 0 ? montoBs / tasas.BCV : null;
	const equivalenteEuro = Number.isFinite(tasas.EURO) && tasas.EURO > 0 ? montoBs / tasas.EURO : null;
	const equivalenteUsdt = Number.isFinite(tasas.USDT) && tasas.USDT > 0 ? montoBs / tasas.USDT : null;
	document.getElementById("equivalente-bcv").textContent =
		Number.isFinite(equivalenteBcv) ? formatoDinero.format(equivalenteBcv) : "—";
	document.getElementById("equivalente-euro").textContent = Number.isFinite(equivalenteEuro)
		? new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(equivalenteEuro)
		: "—";
	document.getElementById("equivalente-usdt").textContent =
		Number.isFinite(equivalenteUsdt) ? `${equivalenteUsdt.toFixed(2)} USDT` : "—";
}

function establecerHistorialAbierto(abierto) {
	historialAbierto = Boolean(abierto);
	historialContenido.classList.toggle("is-open", historialAbierto);
	toggleHistorial.setAttribute("aria-expanded", String(historialAbierto));
	toggleHistorial.textContent = historialAbierto
		? "Ocultar historial"
		: `Ver historial de movimientos (${movimientos.length} ${movimientos.length === 1 ? "registro" : "registros"})`;
}

function mostrarMensaje(texto, esError) {
	mensaje.textContent = texto;
	mensaje.classList.toggle("es-error", Boolean(esError));
}

function crearCelda(texto, clase) {
	const celda = document.createElement("td");
	celda.textContent = texto;
	if (clase) celda.className = clase;
	return celda;
}

function normalizarFechaMovimiento(valor) {
	if (valor && typeof valor.toDate === "function") {
		valor = valor.toDate();
	}
	if (valor instanceof Date && Number.isFinite(valor.getTime())) {
		return [
			String(valor.getFullYear()).padStart(4, "0"),
			String(valor.getMonth() + 1).padStart(2, "0"),
			String(valor.getDate()).padStart(2, "0")
		].join("-");
	}
	if (typeof valor !== "string") return "";
	const fecha = valor.trim();
	const coincidencia = fecha.match(/^(\d{4}-\d{2}-\d{2})(?:$|[T\s])/);
	if (coincidencia) return coincidencia[1];
	const fechaConvertida = new Date(fecha);
	return Number.isFinite(fechaConvertida.getTime())
		? normalizarFechaMovimiento(fechaConvertida)
		: "";
}

function renderizarHistorial() {
	const tipoFiltro = filtroTipoMovimiento.value;
	const fechaFiltro = filtroFechaMovimiento.value;
	const mesFiltro = filtroMesMovimiento.value;
	if (tipoFiltro || fechaFiltro || mesFiltro) establecerHistorialAbierto(true);
	const filtrados = movimientos.filter((movimiento) =>
		(!tipoFiltro || tipoFiltro === "todos" || movimiento.tipo === tipoFiltro) &&
		(!fechaFiltro || normalizarFechaMovimiento(movimiento.fecha) === fechaFiltro) &&
		(!mesFiltro || normalizarFechaMovimiento(movimiento.fecha).startsWith(mesFiltro))
	);
	const ordenados = [...filtrados].sort((a, b) =>
		normalizarFechaMovimiento(b.fecha).localeCompare(normalizarFechaMovimiento(a.fecha)) ||
		(timestampMs(b.createdAt) - timestampMs(a.createdAt)) ||
		b.id.localeCompare(a.id)
	);
	tabla.replaceChildren();
	historialVacio.hidden = ordenados.length > 0;
	historialVacio.textContent = movimientos.length && !ordenados.length
		? "No hay movimientos que coincidan con los filtros seleccionados."
		: "Todavía no hay movimientos registrados.";

	for (const movimiento of ordenados) {
		const fila = document.createElement("tr");
		const tipoEtiqueta = movimiento.esFiado
			? "Fiado pendiente"
			: movimiento.tipo === "ingreso"
				? "Ingreso"
				: movimiento.tipo === "gasto"
					? "Gasto"
					: "Movimiento";
		fila.append(
			crearCelda(formatearFecha(normalizarFechaMovimiento(movimiento.fecha)) || "—"),
			crearCelda(tipoEtiqueta, `caja-tipo${["ingreso", "gasto"].includes(movimiento.tipo) ? ` caja-tipo-${movimiento.tipo}` : ""}`),
			crearCelda(movimiento.concepto),
			crearCelda(movimiento.tipo === "gasto" ? movimiento.categoriaGasto || movimiento.categoria : movimiento.categoria),
			crearCelda(movimiento.metodo),
			crearCelda(formatoDinero.format(movimiento.montoUsd), "caja-monto-col"),
			crearCelda(Number.isFinite(movimiento.montoBs) ? formatoBolivares(movimiento.montoBs) : "—", "caja-monto-col"),
			crearCelda(movimiento.tasaUsada && movimiento.tipoTasa
				? `${movimiento.tipoTasa} ${formatoTasa(movimiento.tasaUsada)}`
				: "—", "caja-monto-col")
		);

		const accion = document.createElement("td");
		const botonEditar = document.createElement("button");
		botonEditar.type = "button";
		botonEditar.className = "caja-editar";
		botonEditar.textContent = "Editar";
		botonEditar.setAttribute("aria-label", `Editar movimiento: ${movimiento.concepto}`);
		botonEditar.disabled = Boolean(movimiento.esFiado);
		botonEditar.title = movimiento.esFiado ? "Los fiados se editan desde el saldo de la ficha de la clienta." : "";
		if (!movimiento.esFiado) botonEditar.addEventListener("click", () => editarMovimiento(movimiento.id));
		const botonEliminar = document.createElement("button");
		botonEliminar.type = "button";
		botonEliminar.className = "caja-eliminar";
		botonEliminar.textContent = "Eliminar";
		botonEliminar.setAttribute("aria-label", `Eliminar movimiento: ${movimiento.concepto}`);
		botonEliminar.disabled = Boolean(movimiento.esFiado);
		botonEliminar.title = movimiento.esFiado ? "No se puede eliminar un fiado desde el historial para evitar desajustar la deuda." : "";
		if (!movimiento.esFiado) botonEliminar.addEventListener("click", () => eliminarMovimiento(movimiento.id));
		accion.append(botonEditar, botonEliminar);
		fila.append(accion);
		tabla.append(fila);
	}
	establecerHistorialAbierto(historialAbierto);
}

function formatoBolivares(monto) {
	return `Bs ${new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(monto)}`;
}

function formatoTasa(tasa) {
	return new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(tasa);
}

function timestampMs(timestamp) {
	return timestamp && typeof timestamp.toMillis === "function" ? timestamp.toMillis() : 0;
}

function formatearFecha(fecha) {
	const partes = fecha.split("-");
	return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : fecha;
}

function actualizarResumen() {
	const fecha = fechaResumen.value;
	const delDia = movimientos.filter((movimiento) => normalizarFechaMovimiento(movimiento.fecha) === fecha);
	const ingresos = delDia.filter((movimiento) =>
		movimiento.tipo === "ingreso" && !movimiento.esFiado && movimiento.metodo !== METODO_FIADO
	);
	const gastos = delDia.filter((movimiento) => movimiento.tipo === "gasto");
	const totalIngresos = ingresos.reduce((total, movimiento) =>
		total + Number(movimiento.montoUsd || movimiento.equivalenteUsd || 0), 0);
	const totalGastos = gastos.reduce((total, movimiento) =>
		total + Number(movimiento.montoUsd || movimiento.equivalenteUsd || 0), 0);

	document.getElementById("total-ingresos").textContent = formatoDinero.format(totalIngresos);
	document.getElementById("total-gastos").textContent = formatoDinero.format(totalGastos);
	document.getElementById("balance-neto").textContent = formatoDinero.format(totalIngresos - totalGastos);
	document.getElementById("metodo-binance").textContent = formatoDinero.format(sumarMetodo(ingresos, "Binance Pay"));
	document.getElementById("metodo-movil").textContent = formatoDinero.format(sumarMetodo(ingresos, "Pago Móvil"));
	document.getElementById("metodo-efectivo").textContent = formatoDinero.format(
		sumarMetodo(ingresos, "Efectivo") + sumarMetodo(ingresos, "Efectivo Bs")
	);
	document.getElementById("metodo-euro").textContent = formatoDinero.format(sumarMetodo(ingresos, "Efectivo Euro"));
	document.getElementById("metodo-usdt").textContent = formatoDinero.format(sumarMetodo(ingresos, "Efectivo USDT"));
	const totalesGastos = gastos.reduce((totales, movimiento) => {
		const categoria = CATEGORIAS_GASTO.includes(movimiento.categoriaGasto)
			? movimiento.categoriaGasto
			: "Otros gastos";
		totales[categoria] += Number(movimiento.montoUsd || movimiento.equivalenteUsd || 0);
		return totales;
	}, Object.fromEntries(CATEGORIAS_GASTO.map((categoria) => [categoria, 0])));
	document.getElementById("gasto-limpieza").textContent = formatoDinero.format(totalesGastos["Limpieza"]);
	document.getElementById("gasto-cafe").textContent = formatoDinero.format(totalesGastos["Café / Atención al cliente"]);
	document.getElementById("gasto-materiales").textContent = formatoDinero.format(totalesGastos["Materiales e insumos"]);
	document.getElementById("gasto-herramientas").textContent = formatoDinero.format(totalesGastos["Herramientas y equipos"]);
	document.getElementById("gasto-otros").textContent = formatoDinero.format(totalesGastos["Otros gastos"]);
}

function sumarMetodo(lista, metodo) {
	return lista.reduce((total, movimiento) =>
		total + (movimiento.metodo === metodo
			? Number(movimiento.montoUsd || movimiento.equivalenteUsd || 0)
			: 0), 0
	);
}

function renderizar() {
	actualizarResumen();
	renderizarHistorial();
}

function exportarXlsx() {
	if (!window.XLSX) {
		mostrarMensaje("No se pudo cargar el módulo de exportación Excel. Recarga la página e inténtalo de nuevo.", true);
		return;
	}
	const XLSX = window.XLSX;
	const movimientosOrdenados = [...movimientos].sort((a, b) =>
		normalizarFechaMovimiento(b.fecha).localeCompare(normalizarFechaMovimiento(a.fecha)) ||
		timestampMs(b.createdAt) - timestampMs(a.createdAt)
	);
	const fecha = fechaResumen.value;
	const delDia = movimientos.filter((movimiento) => normalizarFechaMovimiento(movimiento.fecha) === fecha);
	const gastosDelDia = delDia.filter((movimiento) => movimiento.tipo === "gasto");
	const totalesGastos = Object.fromEntries(CATEGORIAS_GASTO.map((categoria) => [categoria, 0]));
	for (const gasto of gastosDelDia) {
		const categoria = CATEGORIAS_GASTO.includes(gasto.categoriaGasto) ? gasto.categoriaGasto : "Otros gastos";
		totalesGastos[categoria] += gasto.montoUsd;
	}
	const ingresosDelDia = delDia.filter((movimiento) =>
		movimiento.tipo === "ingreso" && !movimiento.esFiado && movimiento.metodo !== METODO_FIADO
	);
	const hojaResumen = XLSX.utils.aoa_to_sheet([
		["MayNails Studio · Resumen de caja"],
		["Fecha consultada", fecha],
		[],
		["Resumen", "Monto USD"],
		["Total ingresos", ingresosDelDia.reduce((total, item) => total + item.montoUsd, 0)],
		["Total gastos", gastosDelDia.reduce((total, item) => total + item.montoUsd, 0)],
		["Balance neto", ingresosDelDia.reduce((total, item) => total + item.montoUsd, 0) - gastosDelDia.reduce((total, item) => total + item.montoUsd, 0)],
		[],
		["Gastos por categoría", "Monto USD"],
		...CATEGORIAS_GASTO.map((categoria) => [categoria, totalesGastos[categoria]])
	]);
	hojaResumen["!cols"] = [{ wch: 34 }, { wch: 20 }];
	hojaResumen["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
	for (const address of ["B5", "B6", "B7", "B10", "B11", "B12", "B13", "B14"]) {
		if (hojaResumen[address]) hojaResumen[address].z = '"$"#,##0.00';
	}

	const filasMovimientos = [
		["Fecha", "Tipo", "Concepto / Clienta", "Categoría / Servicio", "Categoría de gasto", "Método de pago", "Monto USD equivalente", "Monto en divisa", "Divisa", "Monto Bs", "Tasa aplicada", "Tipo de tasa"],
		...movimientosOrdenados.map((item) => [
			item.fecha,
			item.esFiado ? "Fiado pendiente" : item.tipo === "ingreso" ? "Ingreso" : "Egreso / Gasto",
			item.concepto,
			item.categoria,
			item.categoriaGasto || "",
			item.metodo,
			item.montoUsd,
			Number.isFinite(item.montoDivisa) ? item.montoDivisa : item.montoUsd,
			item.divisa || "USD",
			Number.isFinite(item.montoBs) ? item.montoBs : "",
			Number.isFinite(item.tasaUsada) ? item.tasaUsada : "",
			item.tipoTasa ?? ""
		])
	];
	const hojaMovimientos = XLSX.utils.aoa_to_sheet(filasMovimientos);
	hojaMovimientos["!cols"] = [
		{ wch: 13 }, { wch: 16 }, { wch: 30 }, { wch: 24 }, { wch: 30 }, { wch: 20 },
		{ wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 14 }
	];
	hojaMovimientos["!autofilter"] = { ref: `A1:L${filasMovimientos.length}` };
	for (let fila = 2; fila <= filasMovimientos.length; fila += 1) {
		for (const columna of ["G", "H", "J", "K"]) {
			const celda = hojaMovimientos[`${columna}${fila}`];
			if (celda && typeof celda.v === "number") celda.z = "#,##0.00";
		}
	}
	const libro = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(libro, hojaResumen, "Resumen de caja");
	XLSX.utils.book_append_sheet(libro, hojaMovimientos, "Movimientos");
	try {
		XLSX.writeFile(libro, `maynails-caja-${fechaLocal()}.xlsx`);
	} catch (error) {
		console.error("No se pudo generar el archivo Excel.", error);
		mostrarMensaje("No se pudo generar el archivo Excel. Inténtalo de nuevo.", true);
	}
}

function escucharMovimientos(usuario) {
	if (cancelarMovimientos) cancelarMovimientos();
	movimientos = [];
	renderizar();
	mostrarMensaje("Cargando movimientos…", false);

	cancelarMovimientos = onSnapshot(collection(db, "movimientos"), (snapshot) => {
		if (!usuarioActual || usuarioActual.uid !== usuario.uid) return;
		movimientos = snapshot.docs
			.map((documento) => {
				const datos = documento.data();
				const montoUsd = Number(datos.montoUsd || datos.equivalenteUsd || datos.monto || 0);
				return {
					...datos,
					id: documento.id,
					fecha: normalizarFechaMovimiento(datos.fecha),
					tipo: typeof datos.tipo === "string" ? datos.tipo : "",
					concepto: typeof datos.concepto === "string" ? datos.concepto : "Sin concepto",
					categoria: typeof datos.categoria === "string" ? datos.categoria : "",
					metodo: typeof datos.metodo === "string" ? datos.metodo : "—",
					montoUsd: Number.isFinite(montoUsd) ? montoUsd : 0,
					montoBs: Number.isFinite(datos.montoBs) ? datos.montoBs : null,
					montoDivisa: Number.isFinite(datos.montoDivisa) ? datos.montoDivisa : null,
					divisa: typeof datos.divisa === "string" ? datos.divisa : null,
					categoriaGasto: typeof datos.categoriaGasto === "string" ? datos.categoriaGasto : "",
					tasaUsada: Number.isFinite(datos.tasaUsada) ? datos.tasaUsada : null,
					tipoTasa: typeof datos.tipoTasa === "string" ? datos.tipoTasa : null,
					esFiado: datos.esFiado === true
				};
			})
			.sort((a, b) =>
				normalizarFechaMovimiento(b.fecha).localeCompare(normalizarFechaMovimiento(a.fecha)) ||
				timestampMs(b.createdAt) - timestampMs(a.createdAt) ||
				b.id.localeCompare(a.id)
			);
		console.log("Movimientos recibidos en UI:", movimientos.length);
		actualizarResumen();
		renderizarHistorial();
		mostrarMensaje("", false);
	}, (error) => {
		console.error("No se pudieron cargar los movimientos de Firestore.", error);
		mostrarMensaje("No se pudieron cargar los movimientos. Revisa las reglas de seguridad de Firestore.", true);
		authStatus.textContent = "No se pudo acceder a los datos de caja.";
	});
}

async function eliminarMovimiento(id) {
	if (!usuarioActual) return;
	const movimiento = movimientos.find((item) => item.id === id);
	if (!movimiento || !window.confirm(`¿Eliminar el movimiento "${movimiento.concepto}"?`)) return;

	try {
		await deleteDoc(doc(db, "movimientos", id));
		mostrarMensaje("Movimiento eliminado.", false);
	} catch (error) {
		console.error("No se pudo eliminar el movimiento de Firestore.", error);
		mostrarMensaje("No se pudo eliminar el movimiento. Revisa tu conexión y los permisos de Firestore.", true);
	}
}

function calcularImportes({ metodo, fecha, tipoTasa, montoEntrada, montoBsEntrada, tasaOverride }) {
	const tasasGuardadas = tasasDeFecha(fecha);
	if (!tasasGuardadas) {
		throw new Error(`Guarda las tasas BCV, Euro y USDT de ${formatearFecha(fecha)} antes de registrar o editar el movimiento.`);
	}
	const tasaUsada = Number.isFinite(tasaOverride) && tasaOverride > 0
		? tasaOverride
		: tasasGuardadas[tipoTasa];
	if (!Number.isFinite(tasaUsada) || tasaUsada <= 0 || tasaUsada > 100000000) {
		throw new Error("Selecciona una tasa válida para este movimiento.");
	}
	const usaBolivares = esMetodoEnBolivares(metodo);
	const montoBs = usaBolivares ? normalizarDecimal(montoBsEntrada) : normalizarDecimal(montoEntrada) * tasaUsada;
	const montoDivisa = usaBolivares ? montoBs / tasaUsada : normalizarDecimal(montoEntrada);
	const tasaBcv = tipoTasa === "BCV" ? tasaUsada : tasasGuardadas.BCV;
	const montoUsd = montoBs / tasaBcv;
	if (!Number.isFinite(montoBs) || montoBs <= 0 || montoBs > 100000000000 ||
		!Number.isFinite(montoDivisa) || montoDivisa <= 0 || montoDivisa > 1000000 ||
		!Number.isFinite(montoUsd) || montoUsd <= 0 || montoUsd > 1000000) {
		throw new Error("Ingresa un monto válido dentro de los límites permitidos.");
	}
	return {
		montoBs: Math.round((montoBs + Number.EPSILON) * 100) / 100,
		montoDivisa: Math.round((montoDivisa + Number.EPSILON) * 100) / 100,
		montoUsd: Math.round((montoUsd + Number.EPSILON) * 100) / 100,
		divisa: DIVISAS_TASA[tipoTasa],
		tasaUsada,
		tipoTasa
	};
}

function mostrarCategoriaGasto(formulario, campo, valor) {
	const esGasto = formulario.elements.tipo.value === "gasto";
	campo.hidden = !esGasto;
	formulario.elements.categoriaGasto.required = esGasto;
	if (!esGasto) formulario.elements.categoriaGasto.value = "";
	if (formulario === form) {
		if (esGasto) formulario.elements.categoria.value = "Insumos/Gastos";
	}
	if (valor && esGasto) formulario.elements.categoriaGasto.value = valor;
}

function actualizarCamposEdicion() {
	const usaBolivares = esMetodoEnBolivares(formularioEdicion.elements.metodo.value);
	const montoDivisaCampo = document.getElementById("editar-monto-usd-campo");
	const montoBsGrupo = document.getElementById("editar-monto-bs-campos");
	montoDivisaCampo.hidden = usaBolivares;
	montoDivisaCampo.querySelector("input").required = !usaBolivares;
	montoBsGrupo.hidden = !usaBolivares;
	formularioEdicion.elements.montoBs.required = usaBolivares;
	formularioEdicion.elements.tipoTasa.required = usaBolivares;
	document.getElementById("editar-tipo-tasa-divisa-campo").hidden = usaBolivares;
	formularioEdicion.elements.tipoTasaDivisa.required = !usaBolivares;
}

function actualizarTasaEdicionDesdeFecha() {
	const fecha = formularioEdicion.elements.fecha.value;
	const tipoTasa = esMetodoEnBolivares(formularioEdicion.elements.metodo.value)
		? formularioEdicion.elements.tipoTasa.value
		: formularioEdicion.elements.tipoTasaDivisa.value;
	const tasas = tasasDeFecha(fecha);
	formularioEdicion.elements.tasaUsada.value = tasas ? String(tasas[tipoTasa] ?? "") : "";
}

function editarMovimiento(id) {
	if (guardandoEdicionMovimiento) return;
	const movimiento = movimientos.find((item) => item.id === id);
	if (!movimiento) return;
	establecerHistorialAbierto(true);
	const tipoNormalizado = String(movimiento.tipo || "").trim().toLowerCase();
	if (!["ingreso", "gasto"].includes(tipoNormalizado)) {
		const texto = "No se puede editar: el tipo de movimiento guardado no es válido.";
		mostrarMensaje(texto, true);
		window.alert(texto);
		return;
	}
	movimientoEditandoId = movimiento.id;
	formularioEdicion.hidden = false;
	formularioEdicion.elements.id.value = movimiento.id;
	formularioEdicion.elements.fecha.value = movimiento.fecha;
	formularioEdicion.elements.tipo.value = tipoNormalizado;
	formularioEdicion.elements.concepto.value = movimiento.concepto;
	formularioEdicion.elements.categoria.value = CATEGORIAS.includes(movimiento.categoria)
		? movimiento.categoria
		: "Insumos/Gastos";
	formularioEdicion.elements.categoriaGasto.value = movimiento.categoriaGasto || "";
	formularioEdicion.elements.metodo.value = movimiento.metodo;
	formularioEdicion.elements.montoUsd.value = movimiento.montoDivisa ?? movimiento.montoUsd;
	formularioEdicion.elements.montoBs.value = Number.isFinite(movimiento.montoBs) ? movimiento.montoBs : "";
	formularioEdicion.elements.tipoTasa.value = movimiento.tipoTasa || "BCV";
	formularioEdicion.elements.tipoTasaDivisa.value = movimiento.tipoTasa || "BCV";
	formularioEdicion.elements.tasaUsada.value = Number.isFinite(movimiento.tasaUsada) ? movimiento.tasaUsada : "";
	mostrarCategoriaGasto(formularioEdicion, document.getElementById("editar-categoria-gasto-campo"), movimiento.categoriaGasto);
	actualizarCamposEdicion();
	formularioEdicion.scrollIntoView({ behavior: "smooth", block: "center" });
}

function cancelarEdicion() {
	if (guardandoEdicionMovimiento) return;
	formularioEdicion.reset();
	formularioEdicion.hidden = true;
	movimientoEditandoId = null;
}

form.elements.tipo.addEventListener("change", () => mostrarCategoriaGasto(form, categoriaGastoCampo));
formularioEdicion.elements.tipo.addEventListener("change", () =>
	mostrarCategoriaGasto(formularioEdicion, document.getElementById("editar-categoria-gasto-campo"))
);
formularioEdicion.elements.metodo.addEventListener("change", () => {
	actualizarCamposEdicion();
	actualizarTasaEdicionDesdeFecha();
});
formularioEdicion.elements.fecha.addEventListener("change", actualizarTasaEdicionDesdeFecha);
formularioEdicion.elements.tipoTasa.addEventListener("change", actualizarTasaEdicionDesdeFecha);
formularioEdicion.elements.tipoTasaDivisa.addEventListener("change", () => {
	formularioEdicion.elements.tipoTasa.value = formularioEdicion.elements.tipoTasaDivisa.value;
	actualizarTasaEdicionDesdeFecha();
});

form.addEventListener("submit", async (evento) => {
	evento.preventDefault();
	if (!usuarioActual) {
		const texto = "Inicia sesión con una cuenta autorizada antes de guardar el movimiento.";
		mostrarMensaje(texto, true);
		window.alert(texto);
		return;
	}
	if (!form.reportValidity()) {
		const texto = "Completa los campos obligatorios del movimiento antes de guardarlo.";
		mostrarMensaje(texto, true);
		window.alert(texto);
		return;
	}

	const datos = new FormData(form);
	const metodo = String(datos.get("metodo"));
	const fecha = String(datos.get("fecha"));
	if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
		const texto = "Selecciona una fecha válida en formato YYYY-MM-DD.";
		mostrarMensaje(texto, true);
		window.alert(texto);
		return;
	}
	const tipoTasa = String(datos.get(esMetodoEnBolivares(metodo) ? "tipoTasa" : "tipoTasaDivisa"));
	const tipo = String(datos.get("tipo"));
	const clientaFiado = metodo === METODO_FIADO
		? clientas.find((clienta) => clienta.docId === clientaFiadoSelect.value)
		: null;
	if (metodo === METODO_FIADO && tipo !== "ingreso") {
		const texto = "El método Fiado / Cuenta por cobrar solo se puede registrar como ingreso.";
		mostrarMensaje(texto, true);
		window.alert(texto);
		return;
	}
	if (metodo === METODO_FIADO && !clientaFiado) {
		const texto = "Selecciona una clienta registrada para asociar el fiado.";
		mostrarMensaje(texto, true);
		window.alert(texto);
		return;
	}
	let importes;
	try {
		importes = calcularImportes({
			metodo,
			fecha,
			tipoTasa,
			montoEntrada: normalizarDecimal(datos.get("montoUsd")),
			montoBsEntrada: datos.get("montoBs")
		});
	} catch (error) {
		mostrarMensaje(error.message || "No se pudieron validar los importes del movimiento.", true);
		window.alert(`No se pudo validar el movimiento: ${error.message || String(error)}`);
		return;
	}
	const categoriaGasto = tipo === "gasto" ? String(datos.get("categoriaGasto")) : "";
	if (tipo === "gasto" && !CATEGORIAS_GASTO.includes(categoriaGasto)) {
		const texto = "Selecciona una categoría de gasto válida.";
		mostrarMensaje(texto, true);
		window.alert(texto);
		return;
	}

	const concepto = String(datos.get("concepto")).trim();
	if (!concepto) {
		const texto = "Escribe un concepto o nombre de clienta.";
		mostrarMensaje(texto, true);
		window.alert(texto);
		return;
	}
	const tasaBcvActual = obtenerTasa("BCV");
	if (!Number.isFinite(tasaBcvActual) || tasaBcvActual <= 0) {
		const texto = "Guarda primero la Tasa BCV del día antes de registrar un movimiento.";
		mostrarMensaje(texto, true);
		window.alert(texto);
		return;
	}
	const tasas = {
		tasaBcv: tasaBcvActual,
		tasaEuro: obtenerTasa("EURO") || tasaBcvActual,
		tasaUsdt: obtenerTasa("USDT") || tasaBcvActual
	};
	if (![importes.montoBs, importes.montoUsd, importes.montoDivisa, importes.tasaUsada].every(Number.isFinite)) {
		const texto = "No se pudo preparar el movimiento: revisa el monto ingresado; debe ser un valor numérico válido.";
		mostrarMensaje(texto, true);
		window.alert(texto);
		return;
	}
	const movimiento = {
		userId: usuarioActual.uid,
		tipo,
		concepto,
		categoria: String(datos.get("categoria")),
		categoriaGasto,
		metodo,
		...importes,
		...tasas,
		equivalenteUsd: importes.montoUsd,
		fecha,
		createdAt: serverTimestamp(),
		...(clientaFiado ? {
			esFiado: true,
			clientaDocId: clientaFiado.docId
		} : {})
	};

	try {
		if (clientaFiado) {
			const saldoActual = Number.isFinite(clientaFiado.saldoPendienteUsd) ? clientaFiado.saldoPendienteUsd : 0;
			const batch = writeBatch(db);
			const movimientoRef = doc(collection(db, "movimientos"));
			console.log("Intentando guardar:", movimiento);
			batch.set(movimientoRef, movimiento);
			batch.update(doc(db, "fidelidad", clientaFiado.docId), {
				saldoPendienteUsd: increment(importes.montoUsd),
				detalleDeuda: [clientaFiado.detalleDeuda, concepto].filter(Boolean).join("; ").slice(0, 500),
				fechaDeuda: fecha,
				actualizadoEn: serverTimestamp()
			});
			await batch.commit();
			clientaFiado.saldoPendienteUsd = Math.round((saldoActual + importes.montoUsd + Number.EPSILON) * 100) / 100;
			clientaFiado.detalleDeuda = [clientaFiado.detalleDeuda, concepto].filter(Boolean).join("; ").slice(0, 500);
			clientaFiado.fechaDeuda = fecha;
			renderizarClientasDeuda();
			actualizarTotalCuentasPorCobrar();
			mostrarMensaje("✅ Fiado registrado y agregado a la cuenta por cobrar; no se sumó a caja.", false);
		} else {
			console.log("Intentando guardar:", movimiento);
			await addDoc(collection(db, "movimientos"), movimiento);
			mostrarMensaje("✅ Movimiento registrado correctamente", false);
		}
		form.reset();
		form.elements.fecha.value = fechaLocal();
		form.elements.tipo.value = "ingreso";
		clientaFiadoCampo.hidden = true;
		clientaFiadoSelect.required = false;
		clientaFiadoSelect.value = "";
		mostrarCategoriaGasto(form, categoriaGastoCampo);
		actualizarTasaSegunMetodo();
		cargarTasasGuardadas(form.elements.fecha.value);
		actualizarMontoConvertido();
	} catch (error) {
		console.error("No se pudo guardar el movimiento en Firestore.", error);
		const code = error?.code || "sin código";
		const detail = error?.message || String(error);
		mostrarMensaje(`Error de Firebase: ${code} - ${detail}`, true);
		window.alert(`Error de Firebase: ${code} - ${detail}`);
	}
});

formularioEdicion.addEventListener("submit", async (evento) => {
	evento.preventDefault();
	if (!esAdministradora()) {
		window.alert("Inicia sesión con una cuenta autorizada antes de guardar los cambios.");
		return;
	}
	if (!formularioEdicion.reportValidity()) {
		window.alert("Completa los campos obligatorios de la edición antes de guardar.");
		return;
	}
	const datos = new FormData(formularioEdicion);
	const id = movimientoEditandoId;
	if (!id) {
		mostrarMensaje("No hay un movimiento seleccionado para editar. Vuelve a abrir la edición.", true);
		window.alert("No hay un movimiento seleccionado para editar. Vuelve a abrir la edición.");
		return;
	}
	const metodo = String(formularioEdicion.elements.metodo.value).trim();
	const tipoTasa = String(datos.get(esMetodoEnBolivares(metodo) ? "tipoTasa" : "tipoTasaDivisa"));
	const tipo = String(formularioEdicion.elements.tipo.value || "").trim().toLowerCase();
	const fecha = String(formularioEdicion.elements.fecha.value || "").trim();
	const concepto = String(formularioEdicion.elements.concepto.value || "").trim();
	const categoria = String(formularioEdicion.elements.categoria.value || "").trim();
	const categoriaGasto = tipo === "gasto" ? String(datos.get("categoriaGasto")) : "";
	if (!["ingreso", "gasto"].includes(tipo) || !fecha || !concepto ||
		!CATEGORIAS.includes(categoria) ||
		(tipo === "gasto" && !CATEGORIAS_GASTO.includes(categoriaGasto))) {
		const texto = "Revisa el tipo, la fecha, el concepto y las categorías del movimiento.";
		mostrarMensaje(texto, true);
		window.alert(texto);
		return;
	}
	const tasasGuardadas = tasasDeFecha(fecha);
	if (!tasasGuardadas) {
		const texto = `No hay una Tasa BCV válida guardada para ${formatearFecha(fecha)}.`;
		mostrarMensaje(texto, true);
		window.alert(texto);
		return;
	}
	const tasaIngresada = normalizarDecimal(formularioEdicion.elements.tasaUsada.value);
	const tasaRespaldo = tasasGuardadas[tipoTasa] || tasasGuardadas.BCV;
	let importes;
	try {
		importes = calcularImportes({
			metodo,
			fecha,
			tipoTasa,
			montoEntrada: formularioEdicion.elements.montoUsd.value,
			montoBsEntrada: formularioEdicion.elements.montoBs.value,
			tasaOverride: Number.isFinite(tasaIngresada) && tasaIngresada > 0
				? tasaIngresada
				: tasaRespaldo
		});
	} catch (error) {
		const texto = error instanceof Error ? error.message : String(error);
		mostrarMensaje(texto, true);
		window.alert(texto);
		return;
	}
	const botonGuardar = formularioEdicion.querySelector("button[type='submit']");
	const botonCancelar = document.getElementById("cancelar-edicion-movimiento");
	guardandoEdicionMovimiento = true;
	botonGuardar.disabled = true;
	botonCancelar.disabled = true;
	try {
		const payload = {
			fecha,
			tipo,
			concepto,
			categoria,
			categoriaGasto,
			metodo,
			...importes,
			tasaBcv: tasasGuardadas.BCV,
			tasaEuro: tasasGuardadas.EURO,
			tasaUsdt: tasasGuardadas.USDT,
			equivalenteUsd: importes.montoUsd,
			updatedAt: serverTimestamp()
		};
		console.log("Intentando guardar:", payload);
		await updateDoc(doc(db, "movimientos", id), payload);
		movimientos = movimientos.map((movimiento) =>
			movimiento.id === id
				? { ...movimiento, ...payload, updatedAt: new Date(), createdAt: movimiento.createdAt }
				: movimiento
		);
		guardandoEdicionMovimiento = false;
		botonCancelar.disabled = false;
		cancelarEdicion();
		actualizarResumen();
		renderizarHistorial();
		mostrarMensaje("Movimiento actualizado correctamente.", false);
	} catch (error) {
		console.error("No se pudo actualizar el movimiento de Firestore.", error);
		const code = error?.code || "sin código";
		const detail = error?.message || String(error);
		mostrarMensaje(`Error de Firebase: ${code} - ${detail}`, true);
		window.alert(`Error de Firebase: ${code} - ${detail}`);
	} finally {
		guardandoEdicionMovimiento = false;
		botonCancelar.disabled = false;
		botonGuardar.disabled = false;
	}
});

form.elements.fecha.value = fechaLocal();
fechaResumen.value = fechaLocal();
filtroTipoMovimiento.value = "";
filtroFechaMovimiento.value = "";
filtroMesMovimiento.value = "";
cargarTasasGuardadas(form.elements.fecha.value);
actualizarTasaSegunMetodo();
actualizarCamposMoneda();
mostrarCategoriaGasto(form, categoriaGastoCampo);
form.elements.metodo.addEventListener("change", () => {
	actualizarTasaSegunMetodo();
	actualizarCamposMoneda();
	const esFiado = form.elements.metodo.value === METODO_FIADO;
	clientaFiadoCampo.hidden = !esFiado;
	clientaFiadoSelect.required = esFiado;
});
form.elements.montoUsd.addEventListener("input", () => {
	ultimoCampoMontoEditado = "montoUsd";
	actualizarMontoConvertido("montoUsd");
});
form.elements.montoBs.addEventListener("input", () => {
	ultimoCampoMontoEditado = "montoBs";
	actualizarMontoConvertido("montoBs");
});
form.elements.tipoTasa.addEventListener("change", () => {
	actualizarEtiquetaDivisa();
	actualizarMontoConvertido();
});
form.elements.tipoTasaDivisa.addEventListener("change", () => {
	actualizarEtiquetaDivisa();
	actualizarMontoConvertido();
});
for (const input of [tasaBcvInput, tasaEuroInput, tasaUsdtInput]) {
	input.addEventListener("input", () => {
		actualizarEstadoTasasEditadas();
		actualizarMontoConvertido();
	});
}
form.elements.fecha.addEventListener("change", () => {
	cargarTasasGuardadas(form.elements.fecha.value);
	if (usuarioActual) void cargarTasasFirestore(usuarioActual, form.elements.fecha.value);
});
tasasForm.addEventListener("submit", async (evento) => {
	evento.preventDefault();
	if (!usuarioActual) {
		const texto = "Inicia sesión con una cuenta autorizada antes de guardar las tasas.";
		mostrarEstadoTasas(texto, true);
		window.alert(texto);
		return;
	}
	if (!tasasForm.reportValidity()) {
		const texto = "Ingresa una Tasa BCV válida antes de guardar; Euro y USDT pueden quedar vacías.";
		mostrarEstadoTasas(texto, true);
		window.alert(texto);
		return;
	}

	const fecha = form.elements.fecha.value;
	if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
		const texto = "Selecciona una fecha válida para guardar las tasas.";
		mostrarEstadoTasas(texto, true);
		window.alert(texto);
		return;
	}
	const BCV = obtenerTasa("BCV");
	if (!Number.isFinite(BCV) || BCV <= 0 || BCV > 100000000) {
		const texto = "Ingresa una Tasa BCV válida mayor que cero.";
		mostrarEstadoTasas(texto, true);
		window.alert(texto);
		return;
	}
	const EURO = obtenerTasa("EURO") ?? BCV;
	const USDT = obtenerTasa("USDT") ?? BCV;

	const tasasAnteriores = tasasPorFecha[fecha];
	tasasPorFecha[fecha] = { BCV, EURO, USDT };
	try {
		localStorage.setItem(TASAS_STORAGE_KEY, JSON.stringify(tasasPorFecha));
		mostrarEstadoTasas(`Tasas guardadas localmente; sincronizando con Firestore…`, false);
	} catch (error) {
		console.error("No se pudieron guardar localmente las tasas del día.", error);
		if (tasasAnteriores) {
			tasasPorFecha[fecha] = tasasAnteriores;
		} else {
			delete tasasPorFecha[fecha];
		}
		const detalle = error instanceof Error ? error.message : String(error);
		const texto = `No se pudieron guardar localmente las tasas: ${detalle}`;
		mostrarEstadoTasas(texto, true);
		window.alert(texto);
		return;
	}
	tasaBcvInput.value = String(BCV);
	tasaEuroInput.value = String(EURO);
	tasaUsdtInput.value = String(USDT);
	actualizarMontoConvertido();
	const payload = {
		fecha,
		tasaBcv: BCV,
		tasaEuro: EURO,
		tasaUsdt: USDT,
		userId: usuarioActual.uid,
		updatedAt: serverTimestamp()
	};
	console.log("Intentando guardar:", payload);
	try {
		await setDoc(doc(db, "tasas_caja", fecha), payload, { merge: true });
		mostrarEstadoTasas(`Tasas guardadas en Firestore para ${formatearFecha(fecha)}.`, false);
		mostrarMensaje("", false);
	} catch (error) {
		console.error("No se pudieron guardar las tasas en Firestore.", error);
		const code = error?.code || "sin código";
		const detail = error?.message || String(error);
		mostrarEstadoTasas(`Guardadas en este dispositivo, pero Firestore rechazó la sincronización (${code}).`, true);
		window.alert(`Error de Firebase: ${code} - ${detail}\nLas tasas quedaron guardadas localmente en este dispositivo.`);
	}
});
fechaResumen.addEventListener("change", actualizarResumen);
document.getElementById("exportar-xlsx").addEventListener("click", exportarXlsx);
toggleHistorial.addEventListener("click", () => establecerHistorialAbierto(!historialAbierto));
for (const filtro of [filtroTipoMovimiento, filtroFechaMovimiento, filtroMesMovimiento]) {
	filtro.addEventListener("change", renderizarHistorial);
}
document.getElementById("limpiar-filtros-movimiento").addEventListener("click", () => {
	filtroTipoMovimiento.value = "";
	filtroFechaMovimiento.value = "";
	filtroMesMovimiento.value = "";
	renderizarHistorial();
});
establecerHistorialAbierto(false);
document.getElementById("cancelar-edicion-movimiento").addEventListener("click", cancelarEdicion);
filtroDeudaClientas.addEventListener("change", renderizarClientasDeuda);
clubRegistrarAbonoButton.addEventListener("click", async () => {
	if (!clientaClubActual || clubRegistrarAbonoButton.disabled) return;
	clubRegistrarAbonoButton.disabled = true;
	await registrarAbonoClienta(
		clientaClubActual,
		clubAbonoMontoInput.value,
		clubAbonoMetodoInput.value,
		clubAbonoACajaInput.checked
	);
	clubRegistrarAbonoButton.disabled = clientaClubActual.saldoPendienteUsd <= 0 || clubEnCurso;
});

let cuentaRechazada = false;

function esAdministradora() {
	return Boolean(usuarioActual?.email && CORREOS_ADMIN.has(usuarioActual.email.toLowerCase()));
}

function seleccionarPestana(pestana) {
	const verCaja = pestana === "caja";
	const verClub = pestana === "club";
	tabCaja.setAttribute("aria-selected", String(verCaja));
	tabClub.setAttribute("aria-selected", String(verClub));
	tabAgenda.setAttribute("aria-selected", String(!verCaja && !verClub));
	tabCaja.tabIndex = verCaja ? 0 : -1;
	tabClub.tabIndex = verClub ? 0 : -1;
	tabAgenda.tabIndex = !verCaja && !verClub ? 0 : -1;
	panelCaja.hidden = !verCaja;
	panelClub.hidden = !verClub;
	panelAgenda.hidden = verCaja || verClub;
}

const pestanasAdmin = [[tabCaja, "caja"], [tabClub, "club"], [tabAgenda, "agenda"]];
for (const [tab, nombre] of pestanasAdmin) {
	tab.addEventListener("click", () => seleccionarPestana(nombre));
	tab.addEventListener("keydown", (evento) => {
		if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(evento.key)) return;
		evento.preventDefault();
		const indice = pestanasAdmin.findIndex(([pestana]) => pestana === tab);
		const siguienteIndice = evento.key === "Home"
			? 0
			: evento.key === "End"
				? pestanasAdmin.length - 1
				: (indice + (evento.key === "ArrowRight" ? 1 : -1) + pestanasAdmin.length) % pestanasAdmin.length;
		const [siguiente, siguienteNombre] = pestanasAdmin[siguienteIndice];
		seleccionarPestana(siguienteNombre);
		siguiente.focus();
	});
}

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

function telefonoValido(telefono) {
	return /^\+58\d{10}$/.test(telefono);
}

async function buscarFichasPorTelefono(telefono, excluirDocId = "") {
	const normalizado = normalizarTelefonoVE(telefono);
	if (!telefonoValido(normalizado)) return [];
	const fichas = new Map(
		clientas
			.filter((clienta) =>
				clienta.docId !== excluirDocId &&
				normalizarTelefonoVE(clienta.telefonoNormalizado || clienta.telefono) === normalizado
			)
			.map((clienta) => [clienta.docId, clienta])
	);
	for (const campo of ["telefonoNormalizado", "telefono"]) {
		const valores = campo === "telefono"
			? [normalizado, normalizado.slice(1), `0${normalizado.slice(3)}`]
			: [normalizado];
		for (const valor of valores) {
			const encontrados = await getDocs(query(fidelidadRef, where(campo, "==", valor)));
			for (const documento of encontrados.docs) {
				if (documento.id === excluirDocId) continue;
				if (normalizarTelefonoVE(documento.data().telefonoNormalizado || documento.data().telefono) !== normalizado) continue;
				fichas.set(documento.id, datosDeTarjeta(documento));
			}
		}
	}
	return [...fichas.values()];
}

function obtenerDescuentoActual(referidosCiclo, sellos) {
	const bonoReferidas = Math.min(2, Math.max(0, referidosCiclo)) * 2.5;
	const premioBase = sellos >= TOTAL_SELLOS ? 15 : 0;
	return premioBase + bonoReferidas;
}

function porcentajeTexto(porcentaje) {
	return `${String(porcentaje).replace(".", ",")}%`;
}

function establecerMensajeClub(texto, esError = false) {
	clubAdminMensaje.textContent = texto;
	clubAdminMensaje.classList.toggle("es-error", esError);
}

function generarPin() {
	const limite = Math.floor(0x100000000 / 10000) * 10000;
	const valorAleatorio = new Uint32Array(1);
	do {
		crypto.getRandomValues(valorAleatorio);
	} while (valorAleatorio[0] >= limite);
	return String(valorAleatorio[0] % 10000).padStart(4, "0");
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

function datosDeTarjeta(documento) {
	const datos = documento.data();
	const sellos = Number(datos.sellos ?? datos.visitas ?? 0);
	return {
		docId: documento.id,
		telefono: normalizarTelefonoVE(datos.telefonoNormalizado || datos.telefono),
		telefonoNormalizado: normalizarTelefonoVE(datos.telefonoNormalizado || datos.telefono),
		pin: typeof datos.pin === "string" ? datos.pin : "",
		nombre: typeof datos.nombre === "string" && datos.nombre.trim() ? datos.nombre.trim() : "Clienta MayNails",
		categoriaClienta: CATEGORIAS_CLIENTA.includes(datos.categoriaClienta) ? datos.categoriaClienta : "Clienta Nueva",
		notaTarifa: typeof datos.notaTarifa === "string" ? datos.notaTarifa.trim().slice(0, 160) : "",
		referidosCiclo: Number.isFinite(Number(datos.referidosCiclo ?? datos.referidosConfirmados))
			? Math.min(2, Math.max(0, Math.floor(Number(datos.referidosCiclo ?? datos.referidosConfirmados))))
			: 0,
		referidaPor: typeof datos.referidaPor === "string" ? normalizarTelefonoVE(datos.referidaPor) : "",
		sellos: Number.isFinite(sellos) ? Math.min(TOTAL_SELLOS, Math.max(0, Math.floor(sellos))) : 0,
		ultimaVisita: datos.ultimaVisita ?? null,
		premioDisponible: datos.premioDisponible === true,
		saldoPendienteUsd: Number.isFinite(Number(datos.saldoPendienteUsd))
			? Math.max(0, Math.round((Number(datos.saldoPendienteUsd) + Number.EPSILON) * 100) / 100)
			: 0,
		detalleDeuda: typeof datos.detalleDeuda === "string" ? datos.detalleDeuda.trim().slice(0, 500) : "",
		fechaDeuda: typeof datos.fechaDeuda === "string" && /^\d{4}-\d{2}-\d{2}$/.test(datos.fechaDeuda)
			? datos.fechaDeuda
			: ""
	};
}

function actualizarEstadoDeudaFicha(clienta) {
	const tieneDeuda = clienta.saldoPendienteUsd > 0;
	clubDeudaEstado.textContent = tieneDeuda ? "⚠️ Debe / Fiado" : "Al día";
	clubDeudaEstado.classList.toggle("tiene-deuda", tieneDeuda);
	clubDeudaResumen.textContent = tieneDeuda
		? `Saldo pendiente: ${formatoDinero.format(clienta.saldoPendienteUsd)}${clienta.fechaDeuda ? ` · Desde ${formatearFecha(clienta.fechaDeuda)}` : ""}`
		: "Sin saldo pendiente.";
	clubSaldoPendienteInput.value = clienta.saldoPendienteUsd ? clienta.saldoPendienteUsd.toFixed(2) : "0.00";
	clubDetalleDeudaInput.value = clienta.detalleDeuda;
	clubFechaDeudaInput.value = clienta.fechaDeuda;
	clubRegistrarAbonoButton.disabled = !tieneDeuda || clubEnCurso;
}

function renderizarTarjetaClub(clienta) {
	clientaClubActual = clienta;
	clubTarjeta.classList.remove(...TEMAS_TARJETA.map((tema) => `tema-${tema}`));
	clubTarjeta.classList.add(`tema-${temaDeTarjeta(clienta)}`);
	clubClientaNombre.textContent = clienta.nombre;
	clubClientaPin.textContent = clienta.pin || "No disponible";
	clubClientaCategoria.textContent = clienta.categoriaClienta;
	clubClientaCategoria.className = `club-categoria-badge club-categoria-${clienta.categoriaClienta.toLowerCase().replaceAll(" ", "-")}`;
	clubClientaNota.textContent = clienta.notaTarifa ? `Nota / Tarifa acordada: ${clienta.notaTarifa}` : "";
	clubClientaNota.hidden = !clienta.notaTarifa;
	actualizarEstadoDeudaFicha(clienta);
	const premioDisponible = clienta.premioDisponible || clienta.sellos >= TOTAL_SELLOS;
	const sellos = Math.min(clienta.sellos, TOTAL_SELLOS);
	const referidosCiclo = Math.min(2, Math.max(0, Math.floor(clienta.referidosCiclo || 0)));
	const premioBaseDisponible = clienta.premioDisponible || sellos >= TOTAL_SELLOS;
	const porcentajeDescuento = obtenerDescuentoActual(referidosCiclo, premioBaseDisponible ? TOTAL_SELLOS : sellos);
	clubVisitasResumen.textContent = `${sellos} de ${TOTAL_SELLOS} visitas`;
	clubVisitasProgreso.style.width = `${sellos / TOTAL_SELLOS * 100}%`;
	clubProgresoPista.setAttribute("aria-valuenow", String(sellos));
	clubReferidasResumen.textContent = referidosCiclo >= 2
		? "2/2 · +5% disponible"
		: `${referidosCiclo}/2 · +${porcentajeTexto(referidosCiclo * 2.5)} disponible`;
	clubReferidasProgreso.style.width = `${referidosCiclo / 2 * 100}%`;
	clubTarjeta.querySelector(".admin-club-referidas .fidelidad-progreso-pista")
		.setAttribute("aria-valuenow", String(referidosCiclo));
	clubReferidosPorcentaje.textContent = porcentajeDescuento > 0
		? `${porcentajeTexto(porcentajeDescuento)}${referidosCiclo ? " con Bono Referidas" : ""}`
		: "0% (completa 4 visitas para el 15% base)";
	clubReferidaPor.textContent = clienta.referidaPor ? `Referida por: ${clienta.referidaPor}` : "";
	clubReferidaPor.hidden = !clienta.referidaPor;
	clubSellosGrid.replaceChildren();

	for (let indice = 0; indice < TOTAL_SELLOS; indice += 1) {
		const sello = document.createElement("div");
		const completado = indice < sellos;
		sello.className = `fidelidad-sello${completado ? " esta-completo" : ""}`;
		sello.setAttribute("aria-label", `Visita ${indice + 1}: ${completado ? "sellada" : "pendiente"}`);
		sello.textContent = completado ? "♥" : String(indice + 1);
		clubSellosGrid.append(sello);
	}

	const espacioPremio = document.createElement("div");
	espacioPremio.className = `fidelidad-sello fidelidad-sello-premio${porcentajeDescuento > 0 ? " premio-desbloqueado" : ""}`;
	espacioPremio.setAttribute("aria-label", `Descuento disponible: ${porcentajeTexto(porcentajeDescuento)}`);
	espacioPremio.innerHTML = `<span>Disponible</span><strong>${porcentajeTexto(porcentajeDescuento)}</strong>`;
	clubSellosGrid.append(espacioPremio);
	clubPremioEstado.textContent = premioBaseDisponible
		? `¡Premio base desbloqueado! Puede canjear ${porcentajeTexto(porcentajeDescuento)} en su próxima cita.`
		: referidosCiclo
			? `Bono disponible: ${porcentajeTexto(porcentajeDescuento)} para usar en cada cita. Faltan ${TOTAL_SELLOS - sellos} ${TOTAL_SELLOS - sellos === 1 ? "visita" : "visitas"} para activar el 15% base.`
			: `Faltan ${TOTAL_SELLOS - sellos} ${TOTAL_SELLOS - sellos === 1 ? "visita" : "visitas"} para activar el 15% base.`;

	const urlTarjeta = new URL("https://m41k3l.github.io/maynails/fidelidad.html");
	urlTarjeta.searchParams.set("tel", clienta.telefono);
	urlTarjeta.searchParams.set("pin", clienta.pin);
	clubQrCode.replaceChildren();
	clubQrDescargar.disabled = true;
	clubQrMensaje.textContent = "";
	try {
		if (!window.QRCode) throw new Error("No se pudo cargar la librería de códigos QR.");
		new window.QRCode(clubQrCode, {
			text: urlTarjeta.href,
			width: 200,
			height: 200,
			colorDark: "#6E212A",
			colorLight: "#FFFFFF",
			correctLevel: window.QRCode.CorrectLevel.H
		});
		if (!clubQrCode.querySelector("canvas, img")) {
			throw new Error("No se pudo generar el código QR.");
		}
		clubQrDescargar.disabled = false;
	} catch (error) {
		console.error("No se pudo generar el código QR de la clienta.", error);
		clubQrMensaje.textContent = "No se pudo generar el QR. Revisa tu conexión e inténtalo de nuevo.";
	}
	const textoTarjeta = `Hola, ${clienta.nombre}. Aquí está tu tarjeta de fidelidad de MayNails: ${urlTarjeta.href}\n\nTeléfono: ${clienta.telefono}\nPIN de acceso: ${clienta.pin}\n\n${premioDisponible ? `¡Lista para canjear ${porcentajeTexto(porcentajeDescuento)} de descuento en su 5ta visita!` : `Al completar 4 visitas, tendrás ${porcentajeTexto(porcentajeDescuento)} de descuento en tu 5ta visita. Invita amigas para subirlo hasta 20%.`}`;
	clubWhatsApp.href = `https://wa.me/${clienta.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(textoTarjeta)}`;
	clubSumarVisita.disabled = premioDisponible || clubEnCurso;
	clubCanjearPremio.disabled = porcentajeDescuento <= 0 || clubEnCurso;
	clubCanjearPremio.textContent = premioBaseDisponible ? "Canjear premio (reiniciar ciclo)" : "Aplicar bono de referidas";
	clubMostrarCambioPin.disabled = clubEnCurso;
	clubCambioPinForm.querySelector("button[type='submit']").disabled = clubEnCurso;
	clubTarjeta.hidden = false;
}

function actualizarTotalCuentasPorCobrar() {
	const total = clientas.reduce((suma, clienta) => suma + (clienta.saldoPendienteUsd || 0), 0);
	document.getElementById("metric-cuentas-por-cobrar").textContent = formatoDinero.format(total);
}

function llenarSelectorClientasFiado() {
	const seleccionado = clientaFiadoSelect.value;
	clientaFiadoSelect.replaceChildren(new Option("Selecciona una clienta registrada", ""));
	for (const clienta of [...clientas].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))) {
		clientaFiadoSelect.add(new Option(`${clienta.nombre} · ${clienta.telefono || "Sin teléfono"} · Debe ${formatoDinero.format(clienta.saldoPendienteUsd)}`, clienta.docId));
	}
	if (clientas.some((clienta) => clienta.docId === seleccionado)) clientaFiadoSelect.value = seleccionado;
}

function crearControlAbono(clienta) {
	const seccion = document.createElement("div");
	seccion.className = "admin-lista-abono";
	const montoLabel = document.createElement("label");
	montoLabel.textContent = "Abono (USD)";
	const montoInput = document.createElement("input");
	montoInput.type = "text";
	montoInput.inputMode = "decimal";
	montoInput.placeholder = "0.00";
	montoInput.setAttribute("aria-label", `Monto del abono para ${clienta.nombre}, en USD`);
	montoInput.addEventListener("input", limitarEntradaDecimal);
	montoLabel.append(montoInput);
	const metodoLabel = document.createElement("label");
	metodoLabel.textContent = "Método de pago";
	const metodoSelect = document.createElement("select");
	for (const metodo of METODOS.filter((item) => item !== METODO_FIADO)) {
		metodoSelect.add(new Option(metodo === "Efectivo" ? "Efectivo (USD)" : metodo, metodo));
	}
	metodoLabel.append(metodoSelect);
	const cajaLabel = document.createElement("label");
	cajaLabel.className = "admin-deuda-checkbox";
	const cajaCheckbox = document.createElement("input");
	cajaCheckbox.type = "checkbox";
	cajaCheckbox.checked = true;
	cajaLabel.append(cajaCheckbox, document.createTextNode("Registrar también como ingreso en caja"));
	const boton = document.createElement("button");
	boton.type = "button";
	boton.className = "caja-exportar";
	boton.textContent = "Registrar Abono / Saldar Deuda";
	boton.disabled = clienta.saldoPendienteUsd <= 0;
	boton.addEventListener("click", async () => {
		boton.disabled = true;
		await registrarAbonoClienta(clienta, montoInput.value, metodoSelect.value, cajaCheckbox.checked);
		boton.disabled = clienta.saldoPendienteUsd <= 0;
	});
	seccion.append(montoLabel, metodoLabel, cajaLabel, boton);
	return seccion;
}

function renderizarClientasDeuda() {
	llenarSelectorClientasFiado();
	const filtro = filtroDeudaClientas.value;
	const filtradas = [...clientas]
		.filter((clienta) => filtro === "todas" || (filtro === "deuda" ? clienta.saldoPendienteUsd > 0 : clienta.saldoPendienteUsd <= 0))
		.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
	clientasDeudaLista.replaceChildren();
	clientasDeudaVacio.hidden = filtradas.length > 0;
	for (const clienta of filtradas) {
		const tarjeta = document.createElement("article");
		tarjeta.className = `admin-clienta-cuenta${clienta.saldoPendienteUsd > 0 ? " tiene-deuda" : ""}`;
		const encabezado = document.createElement("div");
		encabezado.className = "admin-clienta-cuenta-cabecera";
		const identidad = document.createElement("div");
		const nombre = document.createElement("h4");
		nombre.textContent = clienta.nombre;
		const telefono = document.createElement("p");
		telefono.textContent = clienta.telefono || "Sin teléfono registrado";
		identidad.append(nombre, telefono);
		const estado = document.createElement("strong");
		estado.className = "admin-deuda-estado";
		estado.textContent = clienta.saldoPendienteUsd > 0 ? "⚠️ Debe / Fiado" : "Al día";
		encabezado.append(identidad, estado);
		const saldo = document.createElement("p");
		saldo.className = "admin-clienta-saldo";
		saldo.textContent = clienta.saldoPendienteUsd > 0
			? `Saldo pendiente: ${formatoDinero.format(clienta.saldoPendienteUsd)}`
			: "Sin saldo pendiente";
		tarjeta.append(encabezado, saldo);
		if (clienta.detalleDeuda) {
			const detalle = document.createElement("p");
			detalle.className = "admin-clienta-detalle";
			detalle.textContent = clienta.detalleDeuda;
			tarjeta.append(detalle);
		}
		if (clienta.fechaDeuda) {
			const fecha = document.createElement("small");
			fecha.textContent = `Fecha de deuda: ${formatearFecha(clienta.fechaDeuda)}`;
			tarjeta.append(fecha);
		}
		const abono = crearControlAbono(clienta);
		tarjeta.append(abono);
		const abrirFicha = document.createElement("button");
		abrirFicha.type = "button";
		abrirFicha.className = "caja-exportar";
		abrirFicha.textContent = "Abrir ficha de clienta";
		abrirFicha.addEventListener("click", () => {
			seleccionarPestana("club");
			abrirFichaClienta(clienta);
		});
		tarjeta.append(abrirFicha);
		clientasDeudaLista.append(tarjeta);
	}
	actualizarTotalCuentasPorCobrar();
}

function escucharFidelidad(usuario) {
	if (cancelarFidelidad) cancelarFidelidad();
	clientas = [];
	renderizarClientasDeuda();
	cancelarFidelidad = onSnapshot(fidelidadRef, (snapshot) => {
		if (!usuarioActual || usuarioActual.uid !== usuario.uid) return;
		clientas = snapshot.docs.map(datosDeTarjeta);
		renderizarClientasDeuda();
		if (clientaClubActual) {
			const actualizada = clientas.find((clienta) => clienta.docId === clientaClubActual.docId);
			if (actualizada) {
				clientaClubActual = actualizada;
				actualizarEstadoDeudaFicha(actualizada);
			}
		}
	}, (error) => {
		console.error("No se pudieron cargar las fichas de fidelidad.", error);
		establecerMensajeClub("No se pudieron cargar las clientas y sus saldos. Revisa la conexión y los permisos de Firestore.", true);
	});
}

async function registrarAbonoClienta(clienta, valor, metodo, registrarEnCaja) {
	if (!esAdministradora()) return;
	const abono = Math.round((normalizarDecimal(valor) + Number.EPSILON) * 100) / 100;
	const saldoActual = Number.isFinite(clienta.saldoPendienteUsd) ? clienta.saldoPendienteUsd : 0;
	if (!Number.isFinite(abono) || abono <= 0 || abono > saldoActual) {
		const texto = "Ingresa un abono mayor que $0 y no superior al saldo pendiente.";
		establecerMensajeClub(texto, true);
		mostrarMensaje(texto, true);
		return;
	}
	if (registrarEnCaja && (!METODOS.includes(metodo) || metodo === METODO_FIADO)) {
		establecerMensajeClub("Selecciona un método de pago válido para recibir el abono.", true);
		return;
	}
	const saldoRestante = Math.max(0, Math.round((saldoActual - abono + Number.EPSILON) * 100) / 100);
	const fecha = fechaLocal();
	const tasasGuardadas = tasasDeFecha(fecha);
	const tasaBcv = tasasGuardadas?.BCV ?? 0;
	const tasaEuro = tasasGuardadas?.EURO ?? 0;
	const tasaUsdt = tasasGuardadas?.USDT ?? 0;
	const tipoTasa = metodo === "Efectivo Euro" ? "EURO"
		: metodo === "Efectivo USDT" || metodo === "Binance Pay" ? "USDT"
			: "BCV";
	const tasaUsada = tipoTasa === "EURO" ? tasaEuro : tipoTasa === "USDT" ? tasaUsdt : tasaBcv;
	if (registrarEnCaja && METODOS_BS.includes(metodo) && tasaBcv <= 0) {
		const texto = "Guarda primero la tasa BCV de hoy para registrar en caja un abono recibido en bolívares.";
		establecerMensajeClub(texto, true);
		return;
	}
	if (registrarEnCaja &&
		(metodo === "Efectivo Euro" || metodo === "Efectivo USDT" || metodo === "Binance Pay") &&
		tasaUsada <= 0) {
		const texto = "Guarda las tasas de hoy para registrar un abono recibido en euros o USDT.";
		establecerMensajeClub(texto, true);
		return;
	}
	const montoBs = tasaBcv > 0 ? Math.round((abono * tasaBcv + Number.EPSILON) * 100) / 100 : 0;
	const montoDivisa = metodo === "Efectivo" || metodo === "Pago Móvil" || metodo === "Efectivo Bs"
		? abono
		: tasaUsada > 0 ? montoBs / tasaUsada : abono;
	const batch = writeBatch(db);
	batch.update(doc(db, "fidelidad", clienta.docId), {
		saldoPendienteUsd: increment(-abono),
		actualizadoEn: serverTimestamp(),
	});
	if (registrarEnCaja) {
		const movimientoRef = doc(collection(db, "movimientos"));
		const payload = {
			userId: usuarioActual.uid,
			tipo: "ingreso",
			concepto: `Abono de deuda — ${clienta.nombre}`,
			categoria: "Abono de deuda",
			categoriaGasto: "",
			metodo,
			montoUsd: abono,
			equivalenteUsd: abono,
			montoBs,
			montoDivisa: Number.isFinite(montoDivisa) ? montoDivisa : abono,
			divisa: DIVISAS_TASA[tipoTasa] || "USD",
			tasaUsada: Number.isFinite(tasaUsada) ? tasaUsada : 0,
			tasaBcv,
			tasaEuro,
			tasaUsdt,
			tipoTasa,
			fecha,
			esAbonoDeuda: true,
			clientaDocId: clienta.docId,
			createdAt: serverTimestamp()
		};
		console.log("Intentando guardar:", payload);
		batch.set(movimientoRef, payload);
	}
	try {
		await batch.commit();
		clienta.saldoPendienteUsd = saldoRestante;
		if (clientaClubActual?.docId === clienta.docId) {
			clientaClubActual.saldoPendienteUsd = saldoRestante;
			clubSaldoPendienteInput.value = saldoRestante.toFixed(2);
			actualizarEstadoDeudaFicha(clientaClubActual);
		}
		clubAbonoMontoInput.value = "";
		mostrarMensaje(registrarEnCaja
			? "✅ Abono registrado y agregado como ingreso en caja."
			: "✅ Abono aplicado al saldo pendiente.", false);
		establecerMensajeClub(registrarEnCaja
			? "Abono registrado correctamente y reflejado en caja."
			: "Abono aplicado correctamente al saldo de la clienta.");
		renderizarClientasDeuda();
		actualizarResumen();
	} catch (error) {
		console.error("No se pudo registrar el abono de la clienta.", error);
		const code = error?.code || "sin código";
		const detail = error?.message || String(error);
		const texto = `Error de Firebase: ${code} - ${detail}`;
		establecerMensajeClub(texto, true);
		mostrarMensaje(texto, true);
		window.alert(texto);
	}
}

clubQrDescargar.addEventListener("click", () => {
	if (!clientaClubActual || clubQrDescargar.disabled) return;
	try {
		const canvas = clubQrCode.querySelector("canvas");
		const imagen = clubQrCode.querySelector("img");
		const dataUrl = canvas?.toDataURL("image/png") || imagen?.src;
		if (!dataUrl || !dataUrl.startsWith("data:image/png")) {
			throw new Error("El código QR todavía no está disponible como imagen PNG.");
		}
		const nombreSeguro = clientaClubActual.nombre
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/[^a-zA-Z0-9_-]+/g, "_")
			.replace(/^_+|_+$/g, "") || "Clienta";
		const enlace = document.createElement("a");
		enlace.href = dataUrl;
		enlace.download = `QR_MayNails_${nombreSeguro}.png`;
		document.body.append(enlace);
		enlace.click();
		enlace.remove();
		clubQrMensaje.textContent = "";
	} catch (error) {
		console.error("No se pudo descargar el código QR de la clienta.", error);
		clubQrMensaje.textContent = "No se pudo descargar el QR. Inténtalo de nuevo.";
	}
});

function deshabilitarControlesClub(deshabilitado) {
	clubAdminForm.querySelector("button[type='submit']").disabled = deshabilitado;
	clubGuardarPerfil.disabled = deshabilitado || !clientaClubActual;
	clubSumarVisita.disabled = deshabilitado ||
		!clientaClubActual || clientaClubActual.premioDisponible || clientaClubActual.sellos >= TOTAL_SELLOS;
	clubSumarReferida.disabled = deshabilitado || !clientaClubActual;
	clubCanjearPremio.disabled = deshabilitado ||
		!clientaClubActual || obtenerDescuentoActual(
			clientaClubActual.referidosCiclo || 0,
			clientaClubActual.sellos || 0
		) <= 0;
	clubMostrarCambioPin.disabled = deshabilitado || !clientaClubActual;
	clubCambioPinForm.querySelector("button[type='submit']").disabled = deshabilitado || !clientaClubActual;
	clubCopiarNfc.disabled = deshabilitado || !clientaClubActual;
	clubRegistrarAbonoButton.disabled = deshabilitado ||
		!clientaClubActual || clientaClubActual.saldoPendienteUsd <= 0;
}

function establecerMensajeAgenda(texto, esError = false) {
	agendaConfigMensaje.textContent = texto;
	agendaConfigMensaje.classList.toggle("es-error", esError);
}

function fechaLegible(fecha) {
	const partes = fecha.split("-");
	return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : fecha;
}

async function cargarConfiguracionAgenda() {
	try {
		const horario = await getDoc(doc(db, "config_agenda", "horario"));
		if (horario.exists()) {
			const datos = horario.data();
			agendaConfigForm.elements.horaApertura.value = datos.horaApertura || "09:00";
			agendaConfigForm.elements.horaCierre.value = datos.horaCierre || "18:00";
			for (const dia of agendaConfigForm.querySelectorAll("[name='dias']")) {
				dia.checked = Array.isArray(datos.diasLaborables) && datos.diasLaborables.includes(Number(dia.value));
			}
		} else {
			for (const dia of agendaConfigForm.querySelectorAll("[name='dias']")) {
				dia.checked = Number(dia.value) >= 1 && Number(dia.value) <= 6;
			}
			establecerMensajeAgenda("Horario inicial sugerido: lunes a sábado, 09:00–18:00. Guarda para publicarlo en la agenda.");
		}
	} catch (error) {
		console.error("No se pudo cargar la disponibilidad de la agenda.", error);
		establecerMensajeAgenda("No se pudo cargar la configuración. Revisa las reglas de Firestore.", true);
	}
}

function escucharConfigAgenda(usuario) {
	if (cancelarConfigAgenda) cancelarConfigAgenda();
	cancelarConfigAgenda = onSnapshot(configRef, (snapshot) => {
		if (!usuarioActual || usuarioActual.uid !== usuario.uid) return;
		renderizarBloqueos(snapshot.docs);
	}, (error) => {
		console.error("No se pudo escuchar la configuración de agenda en Firestore.", error);
		establecerMensajeAgenda("No se pudo actualizar la lista de bloqueos. Revisa las reglas de Firestore.", true);
	});
}

function renderizarBloqueos(documentos) {
	agendaBloqueosLista.replaceChildren();
	const bloqueos = documentos
		.filter((documento) => documento.data().tipo === "bloqueo")
		.sort((a, b) => String(a.data().fecha).localeCompare(String(b.data().fecha)));
	if (!bloqueos.length) {
		const vacio = document.createElement("li");
		vacio.textContent = "No hay bloqueos puntuales.";
		agendaBloqueosLista.append(vacio);
		return;
	}
	for (const documento of bloqueos) {
		const datos = documento.data();
		const item = document.createElement("li");
		const detalle = document.createElement("span");
		detalle.textContent = `${fechaLegible(datos.fecha)} · ${datos.diaCompleto ? "Día completo" : `${datos.horaInicio}–${datos.horaFin}`}`;
		const eliminar = document.createElement("button");
		eliminar.type = "button";
		eliminar.className = "caja-eliminar";
		eliminar.textContent = "Eliminar";
		eliminar.addEventListener("click", async () => {
			eliminar.disabled = true;
			try {
				await deleteDoc(doc(db, "config_agenda", documento.id));
				await cargarConfiguracionAgenda();
				establecerMensajeAgenda("Bloqueo eliminado.");
			} catch (error) {
				console.error("No se pudo eliminar el bloqueo de agenda.", error);
				establecerMensajeAgenda("No se pudo eliminar el bloqueo.", true);
				eliminar.disabled = false;
			}
		});
		item.append(detalle, eliminar);
		agendaBloqueosLista.append(item);
	}
}

agendaConfigForm.addEventListener("submit", async (evento) => {
	evento.preventDefault();
	if (!esAdministradora()) return;
	const diasLaborables = [...agendaConfigForm.querySelectorAll("[name='dias']:checked")]
		.map((dia) => Number(dia.value));
	const horaApertura = agendaConfigForm.elements.horaApertura.value;
	const horaCierre = agendaConfigForm.elements.horaCierre.value;
	if (!diasLaborables.length || !horaApertura || !horaCierre || horaApertura >= horaCierre) {
		establecerMensajeAgenda("Elige al menos un día laborable y un rango de horas válido.", true);
		return;
	}
	try {
		await setDoc(doc(db, "config_agenda", "horario"), {
			diasLaborables,
			horaApertura,
			horaCierre,
			intervaloMinutos: 30,
			actualizadoEn: serverTimestamp()
		});
		establecerMensajeAgenda("Horario guardado y publicado.");
	} catch (error) {
		console.error("No se pudo guardar el horario de agenda.", error);
		establecerMensajeAgenda("No se pudo guardar el horario. Revisa los permisos de Firestore.", true);
	}
});

agendaBloqueoForm.elements.diaCompleto.addEventListener("change", () => {
	const bloqueoCompleto = agendaBloqueoForm.elements.diaCompleto.checked;
	agendaBloqueoForm.elements.horaInicio.disabled = bloqueoCompleto;
	agendaBloqueoForm.elements.horaFin.disabled = bloqueoCompleto;
	agendaBloqueoForm.elements.horaInicio.required = !bloqueoCompleto;
	agendaBloqueoForm.elements.horaFin.required = !bloqueoCompleto;
});

agendaBloqueoForm.addEventListener("submit", async (evento) => {
	evento.preventDefault();
	if (!esAdministradora()) return;
	const fecha = agendaBloqueoForm.elements.fecha.value;
	const diaCompleto = agendaBloqueoForm.elements.diaCompleto.checked;
	const horaInicio = agendaBloqueoForm.elements.horaInicio.value;
	const horaFin = agendaBloqueoForm.elements.horaFin.value;
	if (!fecha || (!diaCompleto && (!horaInicio || !horaFin || horaInicio >= horaFin))) {
		establecerMensajeAgenda("Selecciona una fecha y un rango horario válido.", true);
		return;
	}
	try {
		await addDoc(configRef, {
			tipo: "bloqueo",
			fecha,
			diaCompleto,
			...(diaCompleto ? {} : { horaInicio, horaFin }),
			creadoEn: serverTimestamp()
		});
		agendaBloqueoForm.reset();
		agendaBloqueoForm.elements.horaInicio.disabled = false;
		agendaBloqueoForm.elements.horaFin.disabled = false;
		agendaBloqueoForm.elements.horaInicio.required = true;
		agendaBloqueoForm.elements.horaFin.required = true;
		await cargarConfiguracionAgenda();
		establecerMensajeAgenda("Bloqueo guardado.");
	} catch (error) {
		console.error("No se pudo guardar el bloqueo de agenda.", error);
		establecerMensajeAgenda("No se pudo guardar el bloqueo. Revisa los permisos de Firestore.", true);
	}
});

function celdaTabla(texto) {
	const celda = document.createElement("td");
	celda.textContent = texto;
	return celda;
}

function googleCalendarUrlCita(cita, titular) {
	const duracion = Number(cita.duracionMin);
	if (!/^\d{4}-\d{2}-\d{2}$/.test(cita.fecha) ||
		typeof cita.hora !== "string" ||
		!Number.isFinite(duracion) || duracion <= 0) return "";
	const [hora, minuto] = cita.hora.split(":").map(Number);
	if (!Number.isInteger(hora) || !Number.isInteger(minuto)) return "";
	const inicio = new Date(`${cita.fecha}T00:00:00`);
	inicio.setHours(hora, minuto, 0, 0);
	const fin = new Date(inicio.getTime() + duracion * 60000);
	const formatoGoogle = (fecha) =>
		`${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, "0")}${String(fecha.getDate()).padStart(2, "0")}T${String(fecha.getHours()).padStart(2, "0")}${String(fecha.getMinutes()).padStart(2, "0")}00`;
	const detalles = [
		`Clienta: ${titular.nombre || "Clienta"}`,
		`Teléfono: ${normalizarTelefonoVE(titular.telefonoNormalizado || titular.telefono)}`,
		`Servicios: ${Array.isArray(cita.servicios) ? cita.servicios.join(", ") : ""}`,
		`Duración: ${duracion} minutos`
	].join("\n");
	const url = new URL("https://calendar.google.com/calendar/render");
	url.search = new URLSearchParams({
		action: "TEMPLATE",
		text: "Cita en MayNails Studio",
		dates: `${formatoGoogle(inicio)}/${formatoGoogle(fin)}`,
		ctz: "America/Caracas",
		details: detalles
	}).toString();
	return url.href;
}

function renderizarCitas() {
	const ordenadas = [...citasAgenda].sort((a, b) =>
		a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora)
	);
	agendaCitasLista.replaceChildren();
	agendaCitasVacio.hidden = ordenadas.length > 0;
	for (const cita of ordenadas) {
		const fila = document.createElement("tr");
		const datos = cita.datos || {};
		const titular = datos.titular || {};
		fila.append(
			celdaTabla(`${fechaLegible(cita.fecha)} · ${cita.hora}`),
			celdaTabla(titular.nombre || "Clienta"),
			celdaTabla(Array.isArray(cita.servicios) ? [...new Set(cita.servicios)].join(", ") : "—"),
			celdaTabla(`${cita.duracionMin || 0} min${Number(cita.participantes) > 1 ? ` · ${cita.participantes} personas` : ""}`)
		);
		const estadoCelda = document.createElement("td");
		const estado = document.createElement("select");
		estado.setAttribute("aria-label", `Estado de la cita de ${titular.nombre || "clienta"} del ${fechaLegible(cita.fecha)}`);
		for (const [valor, etiqueta] of [
			["solicitada", "Solicitada"],
			["confirmada", "Confirmada"],
			["atendida", "Atendida"],
			["cancelada", "Cancelada"]
		]) estado.add(new Option(etiqueta, valor));
		estado.value = cita.estado;
		estadoCelda.append(estado);
		const accionCelda = document.createElement("td");
		const urlGoogleCalendar = googleCalendarUrlCita(cita, titular);
		if (urlGoogleCalendar) {
			const googleCalendar = document.createElement("a");
			googleCalendar.className = "caja-exportar";
			googleCalendar.href = urlGoogleCalendar;
			googleCalendar.target = "_blank";
			googleCalendar.rel = "noopener";
			googleCalendar.textContent = "Google Calendar";
			accionCelda.append(googleCalendar);
		}
		const telefonoClienta = normalizarTelefonoVE(titular.telefonoNormalizado || titular.telefono);
		if (telefonoClienta) {
			const resumenWhatsApp = `Hola ${titular.nombre || ""}, te escribimos de MayNails Studio por tu cita del ${fechaLegible(cita.fecha)} a las ${cita.hora}. Servicios: ${Array.isArray(cita.servicios) ? cita.servicios.join(", ") : "por confirmar"}. Duración: ${cita.duracionMin || 0} minutos.`;
			const whatsapp = document.createElement("a");
			whatsapp.className = "caja-exportar";
			whatsapp.href = `https://wa.me/${telefonoClienta.replace(/\D/g, "")}?text=${encodeURIComponent(resumenWhatsApp)}`;
			whatsapp.target = "_blank";
			whatsapp.rel = "noopener";
			whatsapp.textContent = "WhatsApp";
			accionCelda.append(whatsapp);
		}
		const clientaExistente = clientas.find((clienta) =>
			telefonoClienta &&
			normalizarTelefonoVE(clienta.telefonoNormalizado || clienta.telefono) === telefonoClienta
		);
		if (clientaExistente) {
			const abrirFicha = document.createElement("button");
			abrirFicha.type = "button";
			abrirFicha.className = "caja-exportar";
			abrirFicha.textContent = "Abrir ficha";
			abrirFicha.addEventListener("click", () => {
				seleccionarPestana("club");
				abrirFichaClienta(clientaExistente);
			});
			accionCelda.append(abrirFicha);
		}
		const guardar = document.createElement("button");
		guardar.type = "button";
		guardar.className = "caja-exportar";
		guardar.textContent = "Guardar";
		guardar.disabled = estado.value === cita.estado;
		estado.addEventListener("change", () => {
			guardar.disabled = estado.value === cita.estado;
		});
		guardar.addEventListener("click", async () => {
			guardar.disabled = true;
			mensajeCitaPersistente = "";
			try {
				await cambiarEstadoCita(cita, estado.value);
				citasAdminMensaje.textContent = "Estado actualizado.";
				citasAdminMensaje.classList.remove("es-error");
			} catch (error) {
				console.error("No se pudo cambiar el estado de la cita.", error);
				citasAdminMensaje.textContent = error.message || "No se pudo actualizar la cita.";
				citasAdminMensaje.classList.add("es-error");
				guardar.disabled = false;
			}
		});
		const eliminar = document.createElement("button");
		eliminar.type = "button";
		eliminar.className = "caja-cita-eliminar";
		eliminar.textContent = "Eliminar";
		eliminar.setAttribute("aria-label", `Eliminar cita de ${titular.nombre || "clienta"} del ${fechaLegible(cita.fecha)} a las ${cita.hora}`);
		eliminar.addEventListener("click", async () => {
			eliminar.disabled = true;
			try {
				const eliminada = await eliminarCita(cita);
				if (!eliminada) eliminar.disabled = false;
			} catch (error) {
				console.error("No se pudo eliminar la cita.", error);
				mensajeCitaPersistente = "";
				citasAdminMensaje.textContent = error.message || "No se pudo eliminar la cita.";
				citasAdminMensaje.classList.add("es-error");
				eliminar.disabled = false;
			}
		});
		accionCelda.append(guardar, eliminar);
		fila.append(estadoCelda, accionCelda);
		agendaCitasLista.append(fila);
	}
}

async function eliminarCita(cita) {
	if (!esAdministradora()) throw new Error("Inicia sesión con una cuenta autorizada antes de eliminar una cita.");
	const titular = cita.datos?.titular || {};
	const nombre = titular.nombre || "Clienta";
	const fechaHora = `${fechaLegible(cita.fecha)} ${cita.hora}`;
	if (!window.confirm(`¿Seguro que deseas eliminar definitivamente esta cita de ${nombre} (${fechaHora})?`)) {
		return false;
	}

	const ocupacionIds = [...new Set(Array.isArray(cita.ocupacionIds) ? cita.ocupacionIds : [])];
	if (ocupacionIds.some((id) => typeof id !== "string" || !id || id.includes("/"))) {
		throw new Error("La cita contiene identificadores de horario inválidos; no se eliminó ningún documento.");
	}
	const batch = writeBatch(db);
	batch.delete(doc(db, "citas", cita.id));
	batch.delete(doc(db, "citas_datos", cita.id));
	for (const ocupacionId of ocupacionIds) {
		batch.delete(doc(db, "agenda_ocupacion", ocupacionId));
	}
	await batch.commit();

	citasAgenda = citasAgenda.filter((item) => item.id !== cita.id);
	renderizarCitas();
	mensajeCitaPersistente = "✅ Cita eliminada correctamente y horario liberado";
	citasAdminMensaje.textContent = mensajeCitaPersistente;
	citasAdminMensaje.classList.remove("es-error");
	return true;
}

function incrementarHistorial(datos, titular, referidaPor = "") {
	const sellosActuales = Math.min(TOTAL_SELLOS, Math.max(0, Math.floor(Number(datos.sellos ?? datos.visitas ?? 0))));
	const nuevoSello = Math.min(TOTAL_SELLOS, sellosActuales + 1);
	const totalHistorico = Number.isFinite(Number(datos.totalVisitasHistoricas))
		? Number(datos.totalVisitasHistoricas)
		: Number(datos.visitas ?? datos.sellos ?? 0);
	return {
		nombre: titular.nombre,
		telefono: normalizarTelefonoVE(titular.telefono),
		telefonoNormalizado: normalizarTelefonoVE(titular.telefono),
		...(datos.pin || titular.pin ? { pin: datos.pin || titular.pin } : {}),
		sellos: nuevoSello,
		visitas: nuevoSello,
		totalVisitasHistoricas: Math.max(0, Math.floor(totalHistorico)) + 1,
		ultimaVisita: serverTimestamp(),
		premioDisponible: datos.premioDisponible === true || nuevoSello >= TOTAL_SELLOS,
		...(referidaPor && !datos.referidaPor ? { referidaPor } : {}),
		actualizadoEn: serverTimestamp()
	};
}

async function cambiarEstadoCita(cita, nuevoEstado) {
	if (!esAdministradora()) throw new Error("Inicia sesión con una cuenta autorizada.");
	const citaRef = doc(db, "citas", cita.id);
	const datosCitaRef = doc(db, "citas_datos", cita.id);
	const datosReserva = cita.datos;
	if (!datosReserva?.titular?.telefono) throw new Error("La cita no tiene los datos de su clienta titular.");

	const titular = datosReserva.titular;
	const referidas = Array.isArray(datosReserva.referidas) ? datosReserva.referidas : [];
	const phones = [...new Set([titular, ...referidas]
		.map((persona) => normalizarTelefonoVE(persona.telefonoNormalizado || persona.telefono))
		.filter(Boolean))];
	if (!normalizarTelefonoVE(titular.telefonoNormalizado || titular.telefono) ||
		referidas.some((persona) => persona.telefono && !normalizarTelefonoVE(persona.telefonoNormalizado || persona.telefono))) {
		throw new Error("La cita contiene un teléfono venezolano incompleto o inválido; corrige sus datos antes de cambiar el estado.");
	}
	if (referidas.some((persona) =>
		persona.telefono &&
		normalizarTelefonoVE(persona.telefonoNormalizado || persona.telefono) ===
			normalizarTelefonoVE(titular.telefonoNormalizado || titular.telefono))) {
		throw new Error("La clienta titular no puede figurar también como su propia referida.");
	}

	const perfiles = new Map();
	await Promise.all(phones.map(async (telefono) => {
		const encontrados = await buscarFichasPorTelefono(telefono);
		if (encontrados.length > 1) throw new Error(`Hay varias fichas de fidelidad para el teléfono ${telefono}. Corrige el duplicado.`);
		if (encontrados.length === 1) {
			perfiles.set(telefono, { ref: doc(db, "fidelidad", encontrados[0].docId) });
		} else {
			const pin = generarPin();
			perfiles.set(telefono, { ref: doc(db, "fidelidad", `${telefono}_${pin}`), pin });
		}
	}));
	const referidasSinTelefono = referidas
		.filter((persona) => !persona.telefono)
		.map((persona, indice) => ({
			persona,
			ref: doc(db, "fidelidad", `no-tel-${Date.now()}-${indice}-${crypto.randomUUID()}`)
		}));
	const idsOcupacion = Array.isArray(cita.ocupacionIds) ? cita.ocupacionIds : [];
	const ocupacionRefs = idsOcupacion.map((id) => doc(db, "agenda_ocupacion", id));

	await runTransaction(db, async (transaccion) => {
		const reservaSnapshot = await transaccion.get(citaRef);
		const datosSnapshot = await transaccion.get(datosCitaRef);
		if (!reservaSnapshot.exists() || !datosSnapshot.exists()) throw new Error("No se encontraron todos los datos de esta cita.");
		const estadoAnterior = reservaSnapshot.data().estado;
		if (estadoAnterior === "atendida") {
			throw new Error("Esta cita ya fue atendida; no se puede volver a registrar para evitar visitas duplicadas.");
		}
		const perfilSnapshots = new Map();
		for (const [telefono, perfil] of perfiles) {
			perfilSnapshots.set(telefono, await transaccion.get(perfil.ref));
		}
		const sinTelefonoSnapshots = [];
		for (const referida of referidasSinTelefono) {
			sinTelefonoSnapshots.push(await transaccion.get(referida.ref));
		}
		const ocupacionSnapshots = [];
		if (nuevoEstado === "cancelada" || estadoAnterior === "cancelada") {
			for (const ref of ocupacionRefs) ocupacionSnapshots.push(await transaccion.get(ref));
		}

		if (nuevoEstado === "atendida") {
			if (estadoAnterior === "cancelada") throw new Error("Una cita cancelada debe reactivarse antes de marcarse como atendida.");
			const titularTelefono = normalizarTelefonoVE(titular.telefonoNormalizado || titular.telefono);
			const perfilTitular = perfiles.get(titularTelefono);
			const snapshotTitular = perfilSnapshots.get(titularTelefono);
			const datosTitular = snapshotTitular.exists() ? snapshotTitular.data() : {};

			let referidasNuevas = 0;
			for (const referida of referidas) {
				const telefono = normalizarTelefonoVE(referida.telefonoNormalizado || referida.telefono);
				if (telefono) {
					if (telefono === titularTelefono) continue;
					const perfil = perfiles.get(telefono);
					const snapshot = perfilSnapshots.get(telefono);
					const datos = snapshot.exists() ? snapshot.data() : {};
					const esNuevaReferida = !snapshot.exists() || !datos.referidaPor;
					if (esNuevaReferida) referidasNuevas += 1;
					transaccion.set(perfil.ref, {
						...(snapshot.exists() ? {} : {
							categoriaClienta: "Clienta Nueva",
							notaTarifa: "",
							referidosCiclo: 0,
							creadoEn: serverTimestamp()
						}),
						...incrementarHistorial({ ...datos, pin: datos.pin || perfil.pin }, referida, titularTelefono),
						...(snapshot.exists() && !perfil.ref.id.startsWith("+58")
							? { telefono: perfil.ref.id.split("_")[0], telefonoNormalizado: telefono }
							: {})
					}, { merge: true });
				}
			}
			for (let indice = 0; indice < referidasSinTelefono.length; indice += 1) {
				const referida = referidasSinTelefono[indice];
				if (sinTelefonoSnapshots[indice].exists()) throw new Error("Se produjo una colisión al guardar el registro sin teléfono. Inténtalo otra vez.");
				transaccion.set(referida.ref, {
					nombre: referida.persona.nombre,
					telefono: "",
					sinTelefono: true,
					referidaPor: titularTelefono,
					sellos: 1,
					visitas: 1,
					totalVisitasHistoricas: 1,
					ultimaVisita: serverTimestamp(),
					premioDisponible: false,
					creadoEn: serverTimestamp(),
					actualizadoEn: serverTimestamp()
				});
				referidasNuevas += 1;
			}
			const referidosCiclo = Math.min(2, Math.max(0, Math.floor(Number(datosTitular.referidosCiclo ?? datosTitular.referidosConfirmados) || 0)));
			transaccion.set(perfilTitular.ref, {
				...(snapshotTitular.exists() ? {} : {
					categoriaClienta: "Clienta Nueva",
					notaTarifa: "",
					creadoEn: serverTimestamp()
				}),
				...incrementarHistorial({ ...datosTitular, pin: datosTitular.pin || perfilTitular.pin }, titular),
				...(snapshotTitular.exists() && !perfilTitular.ref.id.startsWith("+58")
					? { telefono: perfilTitular.ref.id.split("_")[0], telefonoNormalizado: titularTelefono }
					: {}),
				referidosCiclo: Math.min(2, referidosCiclo + referidasNuevas)
			}, { merge: true });
			transaccion.update(citaRef, { estado: nuevoEstado, atendidaEn: serverTimestamp(), actualizadaEn: serverTimestamp() });
		} else if (nuevoEstado === "cancelada") {
			for (let indice = 0; indice < ocupacionRefs.length; indice += 1) {
				if (ocupacionSnapshots[indice].exists()) transaccion.delete(ocupacionRefs[indice]);
			}
			transaccion.update(citaRef, { estado: nuevoEstado, actualizadaEn: serverTimestamp() });
		} else {
			if (estadoAnterior === "cancelada") {
				for (const ocupacion of ocupacionSnapshots) {
					if (ocupacion.exists() && ocupacion.data().citaId !== cita.id) {
						throw new Error("El horario fue reservado por otra clienta mientras esta cita estaba cancelada.");
					}
				}
				for (let indice = 0; indice < ocupacionRefs.length; indice += 1) {
					const minutosInicio = Number(cita.hora.slice(0, 2)) * 60 + Number(cita.hora.slice(3, 5)) + indice * 30;
					const horaOcupada = `${String(Math.floor(minutosInicio / 60)).padStart(2, "0")}:${String(minutosInicio % 60).padStart(2, "0")}`;
					const minutosFin = minutosInicio + 30;
					const horaFinOcupada = `${String(Math.floor(minutosFin / 60)).padStart(2, "0")}:${String(minutosFin % 60).padStart(2, "0")}`;
					transaccion.set(ocupacionRefs[indice], {
						citaId: cita.id,
						fecha: cita.fecha,
						hora: horaOcupada,
						horaFin: horaFinOcupada
					});
				}
			}
			transaccion.update(citaRef, { estado: nuevoEstado, actualizadaEn: serverTimestamp() });
		}
	});
}

function escucharCitas(usuario) {
	if (cancelarCitas) cancelarCitas();
	citasAdminMensaje.textContent = "Cargando citas…";
	cancelarCitas = onSnapshot(citasRef, async (snapshot) => {
		if (!usuarioActual || usuarioActual.uid !== usuario.uid) return;
		try {
			const cargadas = await Promise.all(snapshot.docs.map(async (documento) => {
				const datos = documento.data();
				const privado = await getDoc(doc(db, "citas_datos", documento.id));
				return { ...datos, id: documento.id, datos: privado.exists() ? privado.data() : null };
			}));
			if (!usuarioActual || usuarioActual.uid !== usuario.uid) return;
			citasAgenda = cargadas;
			renderizarCitas();
			citasAdminMensaje.textContent = mensajeCitaPersistente;
			await cargarEstadisticasAgenda(citasAgenda);
		} catch (error) {
			console.error("No se pudieron cargar los datos de agenda.", error);
			citasAdminMensaje.textContent = "No se pudieron cargar las citas y sus datos privados.";
			citasAdminMensaje.classList.add("es-error");
		}
	}, (error) => {
		console.error("No se pudieron consultar las citas.", error);
		citasAdminMensaje.textContent = "No se pudieron cargar las citas. Revisa las reglas de Firestore.";
		citasAdminMensaje.classList.add("es-error");
	});
}

async function cargarEstadisticasAgenda(citas = citasAgenda) {
	try {
		const [perfilesSnapshot] = await Promise.all([getDocs(fidelidadRef)]);
		const perfiles = perfilesSnapshot.docs.map((documento) => ({
			...documento.data(),
			id: documento.id,
			nombre: typeof documento.data().nombre === "string" && documento.data().nombre.trim()
				? documento.data().nombre.trim()
				: "Clienta sin nombre",
			telefono: typeof documento.data().telefono === "string" ? documento.data().telefono : ""
		}));
		const unicas = new Set(perfiles.map((perfil) => perfil.telefono || perfil.id));
		const referidas = perfiles.filter((perfil) => perfil.sinTelefono === true || Boolean(perfil.referidaPor));
		const mesActual = fechaLocal().slice(0, 7);
		const atendidasMes = citas.filter((cita) =>
			cita.estado === "atendida" && typeof cita.fecha === "string" && cita.fecha.startsWith(mesActual)
		).length;
		document.getElementById("metric-clientas-unicas").textContent = String(unicas.size);
		document.getElementById("metric-citas-mes").textContent = String(atendidasMes);
		document.getElementById("metric-clientas-referidas").textContent = String(referidas.length);

		const top = perfiles
			.map((perfil) => ({
				nombre: perfil.nombre,
				total: Math.max(0, Number(perfil.totalVisitasHistoricas) || Number(perfil.visitas ?? perfil.sellos ?? 0)),
				ultima: perfil.ultimaVisita
			}))
			.sort((a, b) => b.total - a.total || timestampMs(b.ultima) - timestampMs(a.ultima))
			.slice(0, 5);
		const topLista = document.getElementById("agenda-top-clientas");
		topLista.replaceChildren();
		for (const perfil of top) {
			const item = document.createElement("li");
			const fecha = perfil.ultima && typeof perfil.ultima.toDate === "function"
				? perfil.ultima.toDate().toLocaleDateString("es-VE")
				: "Sin visitas";
			item.textContent = `${perfil.nombre} · ${perfil.total} atenciones · última visita: ${fecha}`;
			topLista.append(item);
		}

		const distribucion = new Map();
		for (const cita of citas.filter((item) => item.estado === "atendida")) {
			for (const servicio of Array.isArray(cita.servicios) ? cita.servicios : []) {
				distribucion.set(servicio, (distribucion.get(servicio) || 0) + 1);
			}
		}
		const distribucionLista = document.getElementById("agenda-distribucion-servicios");
		distribucionLista.replaceChildren();
		for (const [servicio, total] of [...distribucion.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
			const item = document.createElement("li");
			item.textContent = `${servicio}: ${total}`;
			distribucionLista.append(item);
		}
		if (!top.length) {
			const item = document.createElement("li");
			item.textContent = "Todavía no hay atenciones registradas.";
			topLista.append(item);
		}
		if (!distribucion.size) {
			const item = document.createElement("li");
			item.textContent = "Todavía no hay servicios atendidos.";
			distribucionLista.append(item);
		}
		agendaEstadisticasMensaje.textContent = `Actualizado desde ${perfiles.length} fichas de fidelidad y ${citas.length} citas.`;
		agendaEstadisticasMensaje.classList.remove("es-error");
	} catch (error) {
		console.error("No se pudieron calcular las estadísticas de agenda.", error);
		agendaEstadisticasMensaje.textContent = "No se pudieron cargar las estadísticas desde Firestore.";
		agendaEstadisticasMensaje.classList.add("es-error");
	}
}

function abrirFichaClienta(clienta) {
	clientaClubActual = clienta;
	clubTelefonoInput.value = clienta.telefono;
	clubNombreInput.value = clienta.nombre;
	clubCategoriaInput.value = clienta.categoriaClienta;
	clubNotaInput.value = clienta.notaTarifa;
	clubReferidaPorInput.value = "";
	clubGuardarPerfil.hidden = false;
	clubSugerencias.hidden = true;
	renderizarTarjetaClub(clienta);
	clubTarjeta.scrollIntoView({ behavior: "smooth", block: "start" });
}

function actualizarSugerenciasClientas(campo) {
	const texto = campo.value.trim();
	const digitos = texto.replace(/\D/g, "");
	const termino = texto.toLocaleLowerCase("es");
	if (texto.length < 2) {
		clubSugerencias.replaceChildren();
		clubSugerencias.hidden = true;
		return;
	}
	const coincidencias = clientas.filter((clienta) => {
		const telefono = normalizarTelefonoVE(clienta.telefonoNormalizado || clienta.telefono);
		const digitosTelefono = telefono.replace(/\D/g, "");
		return clienta.nombre.toLocaleLowerCase("es").includes(termino) ||
			(digitos.length >= 2 && digitosTelefono.includes(digitos));
	}).slice(0, 8);
	clubSugerencias.replaceChildren();
	for (const clienta of coincidencias) {
		const boton = document.createElement("button");
		boton.type = "button";
		boton.className = "club-sugerencia";
		boton.setAttribute("role", "option");
		const nombre = document.createElement("strong");
		nombre.textContent = clienta.nombre;
		const detalle = document.createElement("small");
		detalle.textContent = `${clienta.telefono || "Sin teléfono"} · ${clienta.categoriaClienta}${clienta.saldoPendienteUsd > 0 ? ` · Debe ${formatoDinero.format(clienta.saldoPendienteUsd)}` : " · Al día"}`;
		boton.append(nombre, detalle);
		boton.addEventListener("mousedown", (evento) => evento.preventDefault());
		boton.addEventListener("click", () => abrirFichaClienta(clienta));
		clubSugerencias.append(boton);
	}
	clubSugerencias.hidden = coincidencias.length === 0;
}

for (const campo of [clubTelefonoInput, clubNombreInput]) {
	campo.addEventListener("input", () => actualizarSugerenciasClientas(campo));
	campo.addEventListener("focus", () => actualizarSugerenciasClientas(campo));
	campo.addEventListener("blur", () => {
		window.setTimeout(() => {
			if (!clubSugerencias.matches(":hover")) clubSugerencias.hidden = true;
		}, 150);
	});
}
for (const campo of [clubTelefonoInput, clubReferidaPorInput]) {
	campo.addEventListener("blur", () => {
		const telefono = normalizarTelefonoVE(campo.value);
		if (telefono) campo.value = telefono;
	});
}

clubAdminForm.addEventListener("submit", async (evento) => {
	evento.preventDefault();
	if (!esAdministradora() || clubEnCurso) return;
	const telefono = normalizarTelefonoVE(clubTelefonoInput.value);
	const nombre = clubNombreInput.value.trim();
	const telefonoReferidora = normalizarTelefonoVE(clubReferidaPorInput.value);
	if (!telefonoValido(telefono)) {
		establecerMensajeClub("Ingresa un teléfono venezolano válido: 10 dígitos, 0 + 10 dígitos o +58 + 10 dígitos.", true);
		return;
	}
	if (clubReferidaPorInput.value.trim() && !telefonoValido(telefonoReferidora)) {
		establecerMensajeClub("El teléfono de quien invita no es válido. Usa 10 dígitos locales o el formato +58.", true);
		return;
	}
	if (telefonoReferidora && telefonoReferidora === telefono) {
		establecerMensajeClub("La clienta no puede indicarse a sí misma como referidora.", true);
		return;
	}
	clubTelefonoInput.value = telefono;
	clubReferidaPorInput.value = telefonoReferidora;
	clientaClubActual = null;
	clubTarjeta.hidden = true;
	clubGuardarPerfil.hidden = true;
	clubEnCurso = true;
	deshabilitarControlesClub(true);
	establecerMensajeClub("Buscando clienta…");
	try {
		const fichasExistentes = await buscarFichasPorTelefono(telefono);
		if (fichasExistentes.length > 1) {
			establecerMensajeClub("Ya existen varias fichas para ese teléfono. Elige la ficha correcta en las sugerencias y corrige los duplicados.", true);
			clubSugerencias.hidden = false;
			return;
		}
		if (fichasExistentes.length === 1) {
			const clienta = fichasExistentes[0];
			abrirFichaClienta(clienta);
			establecerMensajeClub("Tarjeta encontrada.");
			return;
		}
		if (!nombre) {
			establecerMensajeClub("Clienta no encontrada. Escribe su nombre para registrar una tarjeta nueva.");
			return;
		}

		let referidora = null;
		if (telefonoReferidora) {
			const fichasReferidora = await buscarFichasPorTelefono(telefonoReferidora);
			if (fichasReferidora.length === 0) {
				throw new Error("No se encontró una tarjeta registrada con el teléfono de quien invita.");
			}
			if (fichasReferidora.length > 1) {
				throw new Error("Hay más de una tarjeta con el teléfono de quien invita. Corrige el duplicado en Firestore.");
			}
			referidora = doc(db, "fidelidad", fichasReferidora[0].docId);
		}

		let clientaNueva = null;
		for (let intento = 0; intento < 10; intento += 1) {
			const pin = generarPin();
			const ref = doc(db, "fidelidad", `${telefono}_${pin}`);
			try {
				const datosClientaNueva = {
					telefono,
					telefonoNormalizado: telefono,
					pin,
					nombre,
					categoriaClienta: CATEGORIAS_CLIENTA.includes(clubCategoriaInput.value) ? clubCategoriaInput.value : "Clienta Nueva",
					notaTarifa: clubNotaInput.value.trim(),
					referidosCiclo: 0,
					...(telefonoReferidora ? { referidaPor: telefonoReferidora } : {}),
					sellos: 0,
					visitas: 0,
					saldoPendienteUsd: 0,
					detalleDeuda: "",
					fechaDeuda: "",
					ultimaVisita: null,
					premioDisponible: false,
					creadoEn: serverTimestamp(),
					actualizadoEn: serverTimestamp()
				};
				const infoReferidora = await runTransaction(db, async (transaccion) => {
					const existente = await transaccion.get(ref);
					if (existente.exists()) throw new Error("El PIN ya existe.");
					let invitadora = { nombre: "", bonoActivo: false, referidosCiclo: 0 };
					if (referidora) {
						const actualReferidora = await transaccion.get(referidora.ref);
						if (!actualReferidora.exists() ||
							normalizarTelefonoVE(actualReferidora.data().telefonoNormalizado || actualReferidora.data().telefono) !== telefonoReferidora) {
							throw new Error("La tarjeta de quien invita ya no está disponible.");
						}
						const datosReferidora = actualReferidora.data();
						const referidosCiclo = Number.isFinite(Number(datosReferidora.referidosCiclo ?? datosReferidora.referidosConfirmados))
							? Math.min(2, Math.max(0, Math.floor(Number(datosReferidora.referidosCiclo ?? datosReferidora.referidosConfirmados))))
							: 0;
						const referidosActualizados = Math.min(2, referidosCiclo + 1);
						if (referidosCiclo < 2) {
							transaccion.update(referidora.ref, {
								referidosCiclo: referidosActualizados,
								actualizadoEn: serverTimestamp()
							});
						}
						invitadora = {
							nombre: typeof datosReferidora.nombre === "string" ? datosReferidora.nombre : telefonoReferidora,
							bonoActivo: referidosCiclo >= 2,
							referidosCiclo: referidosActualizados
						};
					}
					transaccion.set(ref, datosClientaNueva);
					return invitadora;
				});
				clientaNueva = {
					...datosClientaNueva,
					docId: ref.id,
					referidaPor: telefonoReferidora
				};
				clientaNueva.nombreReferidora = infoReferidora.nombre;
				clientaNueva.bonoReferidoraActivo = infoReferidora.bonoActivo;
				clientaNueva.referidosCicloReferidora = infoReferidora.referidosCiclo;
				break;
			} catch (error) {
				if (error.message !== "El PIN ya existe.") throw error;
			}
		}
		if (!clientaNueva) throw new Error("No se pudo generar un PIN único. Inténtalo otra vez.");
		clubGuardarPerfil.hidden = false;
		clubReferidaPorInput.value = "";
		establecerMensajeClub(clientaNueva.nombreReferidora
			? clientaNueva.bonoReferidoraActivo
				? `Clienta registrada como referida de ${clientaNueva.nombreReferidora}. La invitadora ya tiene el bono +5% activo para usar en sus citas; con el premio base alcanzará 20%.`
				: `Clienta registrada como referida de ${clientaNueva.nombreReferidora}. Progreso de la invitadora: ${clientaNueva.referidosCicloReferidora}/2; bono disponible ${porcentajeTexto(clientaNueva.referidosCicloReferidora * 2.5)}.`
			: "Clienta registrada. Comparte su tarjeta y PIN.");
		renderizarTarjetaClub(clientaNueva);
	} catch (error) {
		console.error("No se pudo buscar o registrar la clienta.", error);
		establecerMensajeClub(error.message || "No se pudo buscar o guardar la tarjeta. Comprueba los permisos de Firestore.", true);
	} finally {
		clubEnCurso = false;
		deshabilitarControlesClub(false);
	}
});

clubGuardarPerfil.addEventListener("click", async () => {
	if (!esAdministradora() || !clientaClubActual || clubEnCurso) return;
	const telefono = normalizarTelefonoVE(clubTelefonoInput.value);
	const nombre = clubNombreInput.value.trim();
	const categoriaClienta = clubCategoriaInput.value;
	const notaTarifa = clubNotaInput.value.trim();
	const saldoPendienteUsd = normalizarDecimal(clubSaldoPendienteInput.value);
	const detalleDeuda = clubDetalleDeudaInput.value.trim().slice(0, 500);
	const fechaDeuda = clubFechaDeudaInput.value;
	if (!telefonoValido(telefono)) {
		establecerMensajeClub("Ingresa un teléfono venezolano válido antes de guardar el perfil.", true);
		return;
	}
	if (!nombre || !CATEGORIAS_CLIENTA.includes(categoriaClienta) || notaTarifa.length > 160 ||
		!Number.isFinite(saldoPendienteUsd) || saldoPendienteUsd < 0 ||
		(saldoPendienteUsd > 0 && !/^\d{4}-\d{2}-\d{2}$/.test(fechaDeuda))) {
		establecerMensajeClub("Completa un nombre, una categoría válida, una nota y una fecha para cada saldo pendiente.", true);
		return;
	}
	let fichasDuplicadas;
	try {
		fichasDuplicadas = await buscarFichasPorTelefono(telefono, clientaClubActual.docId);
	} catch (error) {
		console.error("No se pudo validar el teléfono de la ficha.", error);
		establecerMensajeClub("No se pudo comprobar si ese teléfono ya está registrado. Inténtalo otra vez.", true);
		return;
	}
	if (fichasDuplicadas.length) {
		establecerMensajeClub(`Ya existe otra ficha para ${telefono}. Abre o selecciona esa ficha en las sugerencias antes de guardar.`, true);
		clubSugerencias.hidden = false;
		return;
	}
	const docIdAnterior = clientaClubActual.docId;
	const docIdNuevo = `${telefono}_${clientaClubActual.pin}`;
	clubEnCurso = true;
	deshabilitarControlesClub(true);
	clubGuardarPerfil.disabled = true;
	try {
		const datosActualizados = {
			telefono,
			telefonoNormalizado: telefono,
			nombre,
			categoriaClienta,
			notaTarifa,
			saldoPendienteUsd: Math.round((saldoPendienteUsd + Number.EPSILON) * 100) / 100,
			detalleDeuda,
			fechaDeuda: saldoPendienteUsd > 0 ? fechaDeuda : "",
			actualizadoEn: serverTimestamp()
		};
		if (docIdNuevo === docIdAnterior) {
			await setDoc(doc(db, "fidelidad", docIdAnterior), datosActualizados, { merge: true });
		} else {
			const refAnterior = doc(db, "fidelidad", docIdAnterior);
			const refNuevo = doc(db, "fidelidad", docIdNuevo);
			await runTransaction(db, async (transaccion) => {
				const [anterior, destino] = await Promise.all([
					transaccion.get(refAnterior),
					transaccion.get(refNuevo)
				]);
				if (!anterior.exists()) throw new Error("No se encontró la ficha actualizada.");
				if (destino.exists()) throw new Error("El número nuevo ya tiene una ficha asociada.");
				transaccion.set(refNuevo, { ...anterior.data(), ...datosActualizados });
				transaccion.delete(refAnterior);
			});
		}
		const clientaActualizada = {
			...clientaClubActual,
			docId: docIdNuevo,
			telefono,
			telefonoNormalizado: telefono,
			nombre,
			categoriaClienta,
			notaTarifa,
			saldoPendienteUsd: Math.round((saldoPendienteUsd + Number.EPSILON) * 100) / 100,
			detalleDeuda,
			fechaDeuda: saldoPendienteUsd > 0 ? fechaDeuda : ""
		};
		clientaClubActual = clientaActualizada;
		clubTelefonoInput.value = telefono;
		renderizarTarjetaClub(clientaActualizada);
		establecerMensajeClub("Perfil y estado de cuenta guardados.");
		renderizarClientasDeuda();
	} catch (error) {
		console.error("No se pudo actualizar el perfil de la clienta.", error);
		establecerMensajeClub(error.message || "No se pudo actualizar el perfil. Revisa los permisos de Firestore.", true);
	} finally {
		clubEnCurso = false;
		clubGuardarPerfil.disabled = false;
		deshabilitarControlesClub(false);
	}
});

async function sumarReferidaClub() {
	if (!esAdministradora() || !clientaClubActual || clubEnCurso) return;
	clubEnCurso = true;
	deshabilitarControlesClub(true);
	try {
		const ref = doc(db, "fidelidad", clientaClubActual.docId);
		const clienta = await runTransaction(db, async (transaccion) => {
			const actual = await transaccion.get(ref);
			if (!actual.exists()) throw new Error("La tarjeta ya no existe.");
			const datos = actual.data();
			const referidosCiclo = Number.isFinite(Number(datos.referidosCiclo ?? datos.referidosConfirmados))
				? Math.min(2, Math.max(0, Math.floor(Number(datos.referidosCiclo ?? datos.referidosConfirmados))))
				: 0;
			if (referidosCiclo >= 2) {
				return { ...datos, referidosCiclo, bonoYaActivo: true };
			}
			const actualizados = referidosCiclo + 1;
			transaccion.update(ref, {
				referidosCiclo: actualizados,
				actualizadoEn: serverTimestamp()
			});
			return { ...datos, referidosCiclo: actualizados, bonoYaActivo: false };
		});
		renderizarTarjetaClub({
			...clientaClubActual,
			referidosCiclo: clienta.referidosCiclo,
			referidaPor: typeof clienta.referidaPor === "string" ? clienta.referidaPor : ""
		});
		establecerMensajeClub(clienta.bonoYaActivo
			? "La clienta ya tiene el bono +5% activo para usar en sus citas; el progreso se mantiene en 2/2."
			: `Referida confirmada. La clienta ahora tiene ${clienta.referidosCiclo}/2; su bono disponible es ${porcentajeTexto(clienta.referidosCiclo * 2.5)}.`);
	} catch (error) {
		console.error("No se pudo sumar la referida de la clienta.", error);
		establecerMensajeClub(error.message || "No se pudo sumar la referida. Revisa los permisos de Firestore.", true);
	} finally {
		clubEnCurso = false;
		deshabilitarControlesClub(false);
	}
}

async function cambiarVisitasClub(accion) {
	if (!esAdministradora() || !clientaClubActual || clubEnCurso) return;
	clubEnCurso = true;
	deshabilitarControlesClub(true);
	try {
		const ref = doc(db, "fidelidad", clientaClubActual.docId);
		const tarjeta = await runTransaction(db, async (transaccion) => {
			const actual = await transaccion.get(ref);
			if (!actual.exists()) throw new Error("La tarjeta ya no existe.");
			const datos = actual.data();
			const sellosActuales = Math.min(TOTAL_SELLOS, Math.max(0, Math.floor(Number(datos.sellos ?? datos.visitas ?? 0))));
			const referidosCiclo = Number.isFinite(Number(datos.referidosCiclo ?? datos.referidosConfirmados))
				? Math.min(2, Math.max(0, Math.floor(Number(datos.referidosCiclo ?? datos.referidosConfirmados))))
				: 0;
			const tienePremioBase = datos.premioDisponible === true || sellosActuales >= TOTAL_SELLOS;
			const porcentajeDescuento = obtenerDescuentoActual(referidosCiclo, tienePremioBase ? TOTAL_SELLOS : sellosActuales);
			if (accion === "sumar") {
				if (tienePremioBase) throw new Error("Esta clienta ya tiene un premio base pendiente de canje.");
				const sellos = Math.min(sellosActuales + 1, TOTAL_SELLOS);
				transaccion.update(ref, {
					sellos,
					visitas: sellos,
					ultimaVisita: serverTimestamp(),
					premioDisponible: sellos >= TOTAL_SELLOS,
					actualizadoEn: serverTimestamp()
				});
				return {
					...datos,
					sellos,
					visitas: sellos,
					ultimaVisita: new Date(),
					premioDisponible: sellos >= TOTAL_SELLOS,
					referidosCiclo
				};
			}
			if (porcentajeDescuento <= 0) throw new Error("La clienta aún no tiene un descuento disponible.");
			if (!tienePremioBase) {
				transaccion.update(ref, {
					ultimoBonoReferidasPorcentaje: porcentajeDescuento,
					ultimoBonoReferidasEn: serverTimestamp(),
					actualizadoEn: serverTimestamp()
				});
				return {
					...datos,
					sellos: sellosActuales,
					visitas: sellosActuales,
					premioDisponible: false,
					referidosCiclo,
					porcentajeDescuento,
					bonoReferidasAplicado: true,
					cicloReiniciado: false
				};
			}
			transaccion.update(ref, {
				sellos: 0,
				visitas: 0,
				referidosCiclo: 0,
				premioDisponible: false,
				ultimoCanjePorcentaje: porcentajeDescuento,
				ultimoCanjeEn: serverTimestamp(),
				actualizadoEn: serverTimestamp()
			});
			return {
				...datos,
				sellos: 0,
				visitas: 0,
				premioDisponible: false,
				referidosCiclo: 0,
				porcentajeDescuento,
				bonoReferidasAplicado: false,
				cicloReiniciado: true
			};
		});
		renderizarTarjetaClub({
			...clientaClubActual,
			nombre: tarjeta.nombre || clientaClubActual.nombre,
			sellos: tarjeta.sellos ?? tarjeta.visitas ?? 0,
			ultimaVisita: tarjeta.ultimaVisita,
			premioDisponible: tarjeta.premioDisponible === true,
			referidosCiclo: tarjeta.referidosCiclo ?? clientaClubActual.referidosCiclo,
			referidaPor: typeof tarjeta.referidaPor === "string" ? tarjeta.referidaPor : clientaClubActual.referidaPor
		});
		establecerMensajeClub(accion === "sumar"
			? "Visita actualizada."
			: tarjeta.bonoReferidasAplicado
				? `Bono de ${porcentajeTexto(tarjeta.porcentajeDescuento)} aplicado. El bono sigue disponible y las visitas se mantienen en ${tarjeta.visitas}/${TOTAL_SELLOS}.`
				: `Premio de ${porcentajeTexto(tarjeta.porcentajeDescuento)} canjeado; las visitas y el ciclo de referidas volvieron a cero.`);
	} catch (error) {
		console.error("No se pudo actualizar la tarjeta de fidelidad.", error);
		establecerMensajeClub(error.message || "No se pudo actualizar la tarjeta. Revisa los permisos de Firestore.", true);
	} finally {
		clubEnCurso = false;
		deshabilitarControlesClub(false);
	}
}

async function cambiarPinClub() {
	if (!esAdministradora() || !clientaClubActual || clubEnCurso) return;
	const pinPersonalizado = clubNuevoPinInput.value.trim();
	if (pinPersonalizado && !/^\d{4}$/.test(pinPersonalizado)) {
		establecerMensajeClub("El nuevo PIN debe tener exactamente 4 dígitos.", true);
		return;
	}
	clubEnCurso = true;
	deshabilitarControlesClub(true);
	establecerMensajeClub("Actualizando PIN…");
	try {
		let nuevoPin = pinPersonalizado || generarPin();
		let nuevaRef;
		let resultado;
		for (let intento = 0; intento < 10; intento += 1) {
			nuevaRef = doc(db, "fidelidad", `${clientaClubActual.telefono}_${nuevoPin}`);
			if (nuevaRef.id === clientaClubActual.docId) {
				if (pinPersonalizado) throw new Error("Ese ya es el PIN actual de la clienta.");
				nuevoPin = generarPin();
				continue;
			}
			const refAnterior = doc(db, "fidelidad", clientaClubActual.docId);
			try {
				resultado = await runTransaction(db, async (transaccion) => {
					const anterior = await transaccion.get(refAnterior);
					if (!anterior.exists()) throw new Error("No se encontró la tarjeta actual.");
					const destino = await transaccion.get(nuevaRef);
					if (destino.exists()) throw new Error("El PIN ya está en uso para este teléfono.");
					const datos = anterior.data();
					const sellos = Math.min(TOTAL_SELLOS, Math.max(0, Math.floor(Number(datos.sellos ?? datos.visitas ?? 0))));
					const nuevosDatos = {
						...datos,
						telefono: clientaClubActual.telefono,
						pin: nuevoPin,
						sellos,
						ultimaVisita: datos.ultimaVisita ?? null,
						actualizadoEn: serverTimestamp()
					};
					delete nuevosDatos.visitas;
					transaccion.set(nuevaRef, nuevosDatos);
					transaccion.delete(refAnterior);
					return nuevosDatos;
				});
				break;
			} catch (error) {
				if (error.message !== "El PIN ya está en uso para este teléfono." || pinPersonalizado) throw error;
				nuevoPin = generarPin();
			}
		}
		if (!resultado) throw new Error("No se pudo encontrar un PIN disponible. Inténtalo otra vez.");
		const clienta = {
			docId: nuevaRef.id,
			telefono: clientaClubActual.telefono,
			pin: nuevoPin,
			nombre: resultado.nombre || clientaClubActual.nombre,
			categoriaClienta: CATEGORIAS_CLIENTA.includes(resultado.categoriaClienta)
				? resultado.categoriaClienta
				: clientaClubActual.categoriaClienta,
			notaTarifa: typeof resultado.notaTarifa === "string" ? resultado.notaTarifa : clientaClubActual.notaTarifa,
			referidosCiclo: Number.isFinite(Number(resultado.referidosCiclo ?? resultado.referidosConfirmados))
				? Math.min(2, Math.max(0, Math.floor(Number(resultado.referidosCiclo ?? resultado.referidosConfirmados))))
				: 0,
			referidaPor: typeof resultado.referidaPor === "string" ? resultado.referidaPor : "",
			sellos: Number(resultado.sellos ?? 0),
			ultimaVisita: resultado.ultimaVisita ?? null,
			premioDisponible: resultado.premioDisponible === true
		};
		clubNuevoPinInput.value = "";
		clubCambioPinForm.hidden = true;
		renderizarTarjetaClub(clienta);
		establecerMensajeClub("PIN actualizado. Indícale el nuevo PIN a la clienta.");
	} catch (error) {
		console.error("No se pudo cambiar el PIN de la tarjeta.", error);
		establecerMensajeClub(error.message || "No se pudo cambiar el PIN. Comprueba los permisos de Firestore.", true);
	} finally {
		clubEnCurso = false;
		deshabilitarControlesClub(false);
	}
}

clubSumarVisita.addEventListener("click", () => cambiarVisitasClub("sumar"));
clubSumarReferida.addEventListener("click", sumarReferidaClub);
clubCanjearPremio.addEventListener("click", () => cambiarVisitasClub("canjear"));
clubMostrarCambioPin.addEventListener("click", () => {
	clubCambioPinForm.hidden = !clubCambioPinForm.hidden;
	if (!clubCambioPinForm.hidden) {
		clubNuevoPinInput.value = "";
		clubNuevoPinInput.focus();
	}
});
clubCambioPinForm.addEventListener("submit", (evento) => {
	evento.preventDefault();
	cambiarPinClub();
});
clubCopiarNfc.addEventListener("click", async () => {
	if (!esAdministradora() || !clientaClubActual) return;
	const urlNfc = new URL("https://m41k3l.github.io/maynails/fidelidad.html");
	urlNfc.searchParams.set("tel", clientaClubActual.telefono);
	urlNfc.searchParams.set("pin", clientaClubActual.pin);
	try {
		await navigator.clipboard.writeText(urlNfc.href);
		establecerMensajeClub("Enlace NFC copiado al portapapeles.");
	} catch (error) {
		console.error("No se pudo copiar el enlace NFC.", error);
		establecerMensajeClub("No se pudo copiar el enlace. Comprueba los permisos del portapapeles.", true);
	}
});

loginButton.addEventListener("click", async () => {
	if (inicioSesionEnCurso) return;
	inicioSesionEnCurso = true;
	loginButton.disabled = true;
	authStatus.textContent = "Abriendo inicio de sesión de Google…";

	try {
		await signInWithPopup(auth, proveedorGoogle);
	} catch (error) {
		console.error("No se pudo iniciar sesión con Google.", error);
		authStatus.textContent = error.code === "auth/popup-closed-by-user"
			? "Se cerró la ventana de inicio de sesión."
			: "No se pudo iniciar sesión. Revisa la configuración de Firebase Authentication.";
	} finally {
		inicioSesionEnCurso = false;
		loginButton.disabled = false;
	}
});

logoutButton.addEventListener("click", async () => {
	logoutButton.disabled = true;
	try {
		await signOut(auth);
		authStatus.textContent = "Sesión cerrada.";
	} catch (error) {
		console.error("No se pudo cerrar la sesión de Firebase.", error);
		authStatus.textContent = "No se pudo cerrar sesión. Inténtalo de nuevo.";
	} finally {
		logoutButton.disabled = false;
	}
});

onAuthStateChanged(auth, (user) => {
	if (cancelarMovimientos) {
		cancelarMovimientos();
		cancelarMovimientos = null;
	}
	if (cancelarCitas) {
		cancelarCitas();
		cancelarCitas = null;
	}
	if (cancelarConfigAgenda) {
		cancelarConfigAgenda();
		cancelarConfigAgenda = null;
	}
	if (cancelarFidelidad) {
		cancelarFidelidad();
		cancelarFidelidad = null;
	}

	if (user && !CORREOS_ADMIN.has((user.email || "").toLowerCase())) {
		cuentaRechazada = true;
		usuarioActual = null;
		app.hidden = true;
		app.setAttribute("inert", "");
		loginButton.hidden = false;
		loginButton.disabled = false;
		logoutButton.hidden = true;
		authStatus.textContent = "Esta cuenta no está autorizada para administrar MayNails.";
		signOut(auth).catch((error) => {
			console.error("No se pudo cerrar la sesión de una cuenta no autorizada.", error);
			authStatus.textContent = "Cuenta no autorizada. No se pudo cerrar su sesión automáticamente.";
		});
		return;
	}

	usuarioActual = user;
	if (!user) {
		movimientos = [];
		clientas = [];
		renderizarClientasDeuda();
		citasAgenda = [];
		tabla.replaceChildren();
		agendaCitasLista.replaceChildren();
		agendaCitasVacio.hidden = false;
		historialVacio.hidden = false;
		clientaClubActual = null;
		clubTarjeta.hidden = true;
		clubAdminForm.reset();
		clubGuardarPerfil.hidden = true;
		clubCambioPinForm.hidden = true;
		clubAdminMensaje.textContent = "";
		clubAdminMensaje.classList.remove("es-error");
		app.hidden = true;
		app.setAttribute("inert", "");
		loginButton.hidden = false;
		loginButton.disabled = false;
		logoutButton.hidden = true;
		authStatus.textContent = cuentaRechazada
			? "Esta cuenta no está autorizada. Inicia sesión con una cuenta autorizada."
			: "Inicia sesión con tu cuenta de Google.";
		cuentaRechazada = false;
		return;
	}

	loginButton.hidden = true;
	logoutButton.hidden = false;
	authStatus.textContent = `Sesión iniciada: ${user.email ?? "Google"}`;
	app.hidden = false;
	app.removeAttribute("inert");
	void cargarTasasFirestore(user, form.elements.fecha.value);
	escucharMovimientos(user);
	escucharCitas(user);
	escucharFidelidad(user);
	cargarConfiguracionAgenda();
	escucharConfigAgenda(user);
}, (error) => {
	console.error("No se pudo verificar la sesión de Firebase Authentication.", error);
	usuarioActual = null;
	app.hidden = true;
	app.setAttribute("inert", "");
	loginButton.hidden = false;
	loginButton.disabled = false;
	logoutButton.hidden = true;
	authStatus.textContent = "No se pudo verificar la sesión. Recarga la página e inténtalo de nuevo.";
});

if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		navigator.serviceWorker.register("./sw.js")
			.catch((error) => {
				console.error("No se pudo registrar el Service Worker de MayNails.", error);
			});
	});
}
