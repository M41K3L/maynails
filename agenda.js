import { db } from "./firebase-config.js";
import {
	collection,
	doc,
	getDocs,
	query,
	runTransaction,
	serverTimestamp,
	where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const citasRef = collection(db, "citas");
const configRef = collection(db, "config_agenda");
const ocupacionRef = collection(db, "agenda_ocupacion");
const formulario = document.getElementById("agenda-form");
const titularNombreInput = formulario.querySelector("[name='nombre']");
const titularTelefonoInput = formulario.querySelector("[name='telefono']");
const fechaInput = document.getElementById("fecha-cita");
const horaInput = document.getElementById("hora-cita");
const referidasLista = document.getElementById("referidas-lista");
const tiempoTotal = document.getElementById("tiempo-total");
const disponibilidadMensaje = document.getElementById("agenda-disponibilidad");
const agendaMensaje = document.getElementById("agenda-mensaje");
const submitButton = document.getElementById("reservar-cita");
const SERVICIOS_MANOS = new Set(["Manicure", "Nivelación", "Softgel", "Jelly", "Dual", "Acrílico"]);
const SERVICIOS_PIES = new Set(["Pedicure", "Quiropedia", "Láser"]);
let duracionTotal = 0;
let cargaDisponibilidad = 0;
let horaSeleccionada = "";

function fechaLocal() {
	const ahora = new Date();
	return new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function minutosDeHora(hora) {
	const [horas, minutos] = hora.split(":").map(Number);
	return horas * 60 + minutos;
}

function horaTexto(minutos) {
	return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
}

function mostrarMensaje(elemento, texto, esError = false) {
	elemento.textContent = texto;
	elemento.classList.toggle("es-error", esError);
}

function leerServicios(elemento) {
	const selector = elemento === formulario
		? "[name='serviciosTitular']:checked"
		: ".agenda-servicios input[type='checkbox']:checked";
	return [...elemento.querySelectorAll(selector)].map((input) => input.value);
}

function duracionServicios(servicios) {
	const manos = servicios.some((servicio) => SERVICIOS_MANOS.has(servicio));
	const pies = servicios.some((servicio) => SERVICIOS_PIES.has(servicio));
	if (manos && pies) return 180;
	return manos || pies ? 90 : 0;
}

function tipoServicios(servicios) {
	const manos = servicios.some((servicio) => SERVICIOS_MANOS.has(servicio));
	const pies = servicios.some((servicio) => SERVICIOS_PIES.has(servicio));
	if (manos && pies) return "Ambas (Manos y Pies)";
	if (manos) return "Manos";
	if (pies) return "Pies";
	return "Pendiente de selección";
}

function formatoDuracion(minutos) {
	const horas = Math.floor(minutos / 60);
	const resto = minutos % 60;
	return `${horas} ${horas === 1 ? "hora" : "horas"} y ${resto} minutos`;
}

function personasDeReserva() {
	const personas = [{
		nombre: titularNombreInput.value.trim(),
		telefono: titularTelefonoInput.value.replace(/\D/g, ""),
		servicios: leerServicios(formulario)
	}];
	for (const elemento of referidasLista.querySelectorAll(".agenda-acompanante")) {
		personas.push({
			nombre: elemento.querySelector("[name='nombre']").value.trim(),
			telefono: elemento.querySelector("[name='telefono']").value.replace(/\D/g, ""),
			servicios: leerServicios(elemento)
		});
	}
	return personas;
}

function actualizarDuracion() {
	const personas = personasDeReserva();
	duracionTotal = personas.reduce((total, persona) => total + duracionServicios(persona.servicios), 0);
	document.getElementById("servicios-titular-resumen").textContent = `Servicio: ${tipoServicios(personas[0].servicios)}.`;
	for (const [indice, elemento] of [...referidasLista.querySelectorAll(".agenda-acompanante")].entries()) {
		elemento.querySelector(".agenda-resumen-persona").textContent = `Servicio: ${tipoServicios(personas[indice + 1].servicios)}.`;
	}
	tiempoTotal.textContent = `Tiempo total reservado: ${formatoDuracion(duracionTotal)}`;
	actualizarDisponibilidad();
}

function agregarAcompanante() {
	const tarjeta = document.createElement("fieldset");
	tarjeta.className = "agenda-grupo agenda-acompanante";
	tarjeta.innerHTML = `
		<legend>Acompañante</legend>
		<div class="agenda-campos">
			<label>Nombre y apellido
				<input name="nombre" type="text" maxlength="100" autocomplete="off" required>
			</label>
			<label>Teléfono
				<input name="telefono" type="tel" inputmode="tel" maxlength="20" autocomplete="off">
				<small>Opcional si desea acumular sus propios sellos</small>
			</label>
		</div>
		<p class="agenda-ayuda">Selecciona los servicios que se realizará.</p>
		<div class="agenda-servicios">
			<strong class="agenda-servicio-seccion">Manos</strong>
			<label><input type="checkbox" value="Manicure" data-zona="manos"> Manicure</label>
			<label><input type="checkbox" value="Nivelación" data-zona="manos"> Nivelación</label>
			<label><input type="checkbox" value="Softgel" data-zona="manos"> Softgel</label>
			<label><input type="checkbox" value="Jelly" data-zona="manos"> Jelly</label>
			<label><input type="checkbox" value="Dual" data-zona="manos"> Dual</label>
			<label><input type="checkbox" value="Acrílico" data-zona="manos"> Acrílico</label>
			<strong class="agenda-servicio-seccion">Pies</strong>
			<label><input type="checkbox" value="Pedicure" data-zona="pies"> Pedicure</label>
			<label><input type="checkbox" value="Quiropedia" data-zona="pies"> Quiropedia</label>
			<label><input type="checkbox" value="Láser" data-zona="pies"> Láser</label>
		</div>
		<p class="agenda-ayuda agenda-resumen-persona">Servicio: pendiente de selección.</p>
		<button class="agenda-quitar" type="button">Quitar acompañante</button>`;
	tarjeta.querySelector(".agenda-quitar").addEventListener("click", () => {
		tarjeta.remove();
		actualizarDuracion();
	});
	referidasLista.append(tarjeta);
	tarjeta.querySelector("[name='nombre']").focus();
	actualizarDuracion();
}

function hayCruce(inicio, fin, intervalos) {
	return intervalos.some((intervalo) => inicio < intervalo.fin && fin > intervalo.inicio);
}

async function actualizarDisponibilidad() {
	const solicitud = ++cargaDisponibilidad;
	const fecha = fechaInput.value;
	const horaPrevia = horaInput.value || horaSeleccionada;
	horaInput.replaceChildren(new Option("Selecciona fecha y servicios", ""));
	horaInput.disabled = true;
	if (!fecha || !duracionTotal) {
		mostrarMensaje(disponibilidadMensaje, fecha ? "Selecciona al menos un servicio para cada persona." : "");
		return;
	}
	if (fecha < fechaLocal()) {
		mostrarMensaje(disponibilidadMensaje, "Selecciona una fecha de hoy en adelante.");
		return;
	}

	mostrarMensaje(disponibilidadMensaje, "Consultando horarios…");
	const horarioPorDefecto = {
		diasLaborables: [0, 1, 2, 3, 4, 5, 6],
		horaInicio: "08:30",
		horaFin: "18:30",
		bloqueos: []
	};
	let horario = horarioPorDefecto;
	let bloqueosConfigurados = [];

	try {
		const configuracionSnapshot = await getDocs(configRef);
		if (!configuracionSnapshot.empty) {
			const documentos = configuracionSnapshot.docs;
			const documentoHorario = documentos.find((documento) =>
				documento.id === "horario" || documento.data().tipo === "horario"
			);
			if (documentoHorario) {
				const datosHorario = documentoHorario.data();
				horario = {
					diasLaborables: Array.isArray(datosHorario.diasLaborables)
						? datosHorario.diasLaborables
						: horarioPorDefecto.diasLaborables,
					horaInicio: datosHorario.horaInicio || datosHorario.horaApertura || horarioPorDefecto.horaInicio,
					horaFin: datosHorario.horaFin || datosHorario.horaCierre || horarioPorDefecto.horaFin,
					bloqueos: Array.isArray(datosHorario.bloqueos) ? datosHorario.bloqueos : []
				};
			}
			bloqueosConfigurados = documentos
				.map((documento) => documento.data())
				.filter((bloqueo) => bloqueo.tipo === "bloqueo" && bloqueo.fecha === fecha);
		}
	} catch (error) {
		console.error("Detalle error agenda:", error);
		horario = horarioPorDefecto;
		bloqueosConfigurados = [];
	}

	try {
		const citasSnapshot = await getDocs(query(citasRef, where("fecha", "==", fecha)));
		if (solicitud !== cargaDisponibilidad) return;

		const diaSemana = new Date(`${fecha}T12:00:00`).getDay();
		if (!horario.diasLaborables.includes(diaSemana)) {
			mostrarMensaje(disponibilidadMensaje, "El estudio no abre ese día. Selecciona otra fecha.");
			return;
		}

		const apertura = minutosDeHora(horario.horaInicio);
		const cierre = minutosDeHora(horario.horaFin);
		if (!Number.isFinite(apertura) || !Number.isFinite(cierre) || apertura >= cierre) {
			throw new Error("El horario configurado tiene horas de apertura o cierre inválidas.");
		}

		const citasActivas = citasSnapshot.docs
			.map((documento) => documento.data())
			.filter((cita) => cita.estado !== "cancelada" &&
				typeof cita.hora === "string" && Number.isFinite(Number(cita.duracionMin)) && Number(cita.duracionMin) > 0)
			.map((cita) => ({
				inicio: minutosDeHora(cita.hora),
				fin: minutosDeHora(cita.hora) + Number(cita.duracionMin)
			}));
		const bloqueosHorario = horario.bloqueos.filter((bloqueo) =>
			!bloqueo.fecha || bloqueo.fecha === fecha
		);
		const bloqueos = [...bloqueosHorario, ...bloqueosConfigurados]
			.map((bloqueo) => ({
				inicio: bloqueo.diaCompleto ? 0 : minutosDeHora(bloqueo.horaInicio),
				fin: bloqueo.diaCompleto ? 1440 : minutosDeHora(bloqueo.horaFin)
			}))
			.filter((bloqueo) => Number.isFinite(bloqueo.inicio) && Number.isFinite(bloqueo.fin) && bloqueo.fin > bloqueo.inicio);
		const ocupados = [...citasActivas, ...bloqueos];
		const opciones = [];
		const ahora = new Date();
		const ahoraMinutos = ahora.getHours() * 60 + ahora.getMinutes();
		for (let inicio = apertura; inicio + duracionTotal <= cierre; inicio += 30) {
			if (fecha === fechaLocal() && inicio <= ahoraMinutos) continue;
			if (!hayCruce(inicio, inicio + duracionTotal, ocupados)) opciones.push(inicio);
		}
		if (!opciones.length) {
			mostrarMensaje(disponibilidadMensaje, "No hay horarios que puedan cubrir el tiempo total de esta reserva. Prueba otra fecha.");
			return;
		}
		horaInput.replaceChildren(new Option("Selecciona una hora", ""));
		for (const inicio of opciones) {
			const hora = horaTexto(inicio);
			horaInput.add(new Option(hora, hora));
		}
		if (opciones.some((inicio) => horaTexto(inicio) === horaPrevia)) {
			horaInput.value = horaPrevia;
		}
		horaSeleccionada = horaInput.value;
		horaInput.disabled = false;
		mostrarMensaje(disponibilidadMensaje, `${opciones.length} horarios disponibles para ${formatoDuracion(duracionTotal)}.`);
	} catch (error) {
		console.error("Detalle error agenda:", error);
		mostrarMensaje(disponibilidadMensaje, "No se pudo consultar la disponibilidad. Inténtalo de nuevo más tarde.", true);
	}
}

document.getElementById("agregar-referida").addEventListener("click", agregarAcompanante);
formulario.addEventListener("change", (evento) => {
	if (evento.target !== horaInput) actualizarDuracion();
});
horaInput.addEventListener("change", () => {
	horaSeleccionada = horaInput.value;
});
titularNombreInput.addEventListener("input", actualizarDuracion);
titularTelefonoInput.addEventListener("input", actualizarDuracion);
fechaInput.min = fechaLocal();
fechaInput.addEventListener("change", actualizarDisponibilidad);

formulario.addEventListener("submit", async (evento) => {
	evento.preventDefault();
	if (!formulario.reportValidity()) return;
	const personas = personasDeReserva();
	if (personas.some((persona) => !persona.nombre || !persona.servicios.length)) {
		mostrarMensaje(agendaMensaje, "Completa el nombre y al menos un servicio para cada persona.", true);
		return;
	}
	if (!/^\d{7,15}$/.test(personas[0].telefono) ||
		personas.some((persona, indice) => {
			const telefonoCrudo = indice === 0
				? titularTelefonoInput.value
				: referidasLista.querySelectorAll(".agenda-acompanante [name='telefono']")[indice - 1].value;
			return telefonoCrudo.trim() && !/^\d{7,15}$/.test(persona.telefono);
		})) {
		mostrarMensaje(agendaMensaje, "Revisa los teléfonos: deben tener entre 7 y 15 números.", true);
		return;
	}
	const telefonosAcompanantes = personas.slice(1).map((persona) => persona.telefono).filter(Boolean);
	if (telefonosAcompanantes.includes(personas[0].telefono) ||
		new Set(telefonosAcompanantes).size !== telefonosAcompanantes.length) {
		mostrarMensaje(agendaMensaje, "Cada persona debe registrar un teléfono distinto; no repitas el teléfono de la titular.", true);
		return;
	}
	if (!fechaInput.value || !horaInput.value || !duracionTotal) {
		mostrarMensaje(agendaMensaje, "Selecciona los servicios, una fecha y un horario disponible.", true);
		return;
	}
	if (fechaInput.value < fechaLocal()) {
		mostrarMensaje(agendaMensaje, "La fecha de la cita no puede estar en el pasado.", true);
		return;
	}

	submitButton.disabled = true;
	mostrarMensaje(agendaMensaje, "Confirmando disponibilidad y enviando tu solicitud…");
	try {
		const fecha = fechaInput.value;
		const hora = horaInput.value;
		const inicioMinutos = minutosDeHora(hora);
		const finMinutos = inicioMinutos + duracionTotal;
		const idsOcupacion = [];
		for (let minuto = inicioMinutos; minuto < finMinutos; minuto += 30) {
			idsOcupacion.push(`${fecha}_${horaTexto(minuto).replace(":", "")}`);
		}
		const citaRef = doc(citasRef);
		const datosRef = doc(db, "citas_datos", citaRef.id);
		const servicios = personas.flatMap((persona) => persona.servicios);
		await runTransaction(db, async (transaccion) => {
			const ocupaciones = await Promise.all(idsOcupacion.map((id) =>
				transaccion.get(doc(ocupacionRef, id))
			));
			if (ocupaciones.some((ocupacion) => ocupacion.exists())) {
				throw new Error("Ese horario acaba de ser reservado. Selecciona otro horario.");
			}
			transaccion.set(citaRef, {
				fecha,
				hora,
				horaFin: horaTexto(finMinutos),
				duracionMin: duracionTotal,
				estado: "solicitada",
				servicios,
				participantes: personas.length,
				ocupacionIds: idsOcupacion,
				creadaEn: serverTimestamp()
			});
			transaccion.set(datosRef, {
				citaId: citaRef.id,
				titular: personas[0],
				referidas: personas.slice(1)
			});
			for (let indice = 0; indice < idsOcupacion.length; indice += 1) {
				const minuto = inicioMinutos + indice * 30;
				transaccion.set(doc(ocupacionRef, idsOcupacion[indice]), {
					citaId: citaRef.id,
					fecha,
					hora: horaTexto(minuto),
					horaFin: horaTexto(minuto + 30)
				});
			}
		});
		formulario.reset();
		referidasLista.replaceChildren();
		fechaInput.min = fechaLocal();
		horaInput.replaceChildren(new Option("Selecciona primero la fecha y los servicios", ""));
		horaSeleccionada = "";
		horaInput.disabled = true;
		actualizarDuracion();
		mostrarMensaje(agendaMensaje, "¡Solicitud enviada! MayNails Studio confirmará tu cita pronto.");
		mostrarMensaje(disponibilidadMensaje, "");
	} catch (error) {
		console.error("No se pudo guardar la solicitud de cita.", error);
		mostrarMensaje(
			agendaMensaje,
			error.message === "Ese horario acaba de ser reservado. Selecciona otro horario."
				? error.message
				: "No se pudo guardar la reserva. Inténtalo de nuevo o contáctanos por WhatsApp.",
			true
		);
		await actualizarDisponibilidad();
	} finally {
		submitButton.disabled = false;
	}
});
