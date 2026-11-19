(() => {
	const temas = ["claro", "oscuro", "amoled"];
	const iconosTemas = {
		claro: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"></path></svg>',
		oscuro: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"></path></svg>',
		amoled: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"></circle></svg>'
	};
	const nombresTemas = { claro: "Claro", oscuro: "Oscuro", amoled: "AMOLED" };
	const siguienteTemaDe = { claro: "Oscuro", oscuro: "AMOLED", amoled: "Claro" };
	const botonTema = document.getElementById("tema-boton");

	if (!botonTema) return;

	function aplicarTema(tema) {
		document.documentElement.dataset.theme = tema;
		botonTema.innerHTML = iconosTemas[tema];
		botonTema.setAttribute("aria-label", `Tema actual: ${nombresTemas[tema]}. Cambiar a tema ${siguienteTemaDe[tema]}`);
		botonTema.title = `Tema actual: ${nombresTemas[tema]} · Cambiar a ${siguienteTemaDe[tema]}`;
		try {
			localStorage.setItem("maynails-tema", tema);
		} catch (error) {
			console.warn("No se pudo guardar la preferencia del tema.", error);
		}
	}

	let temaGuardado = null;
	try {
		temaGuardado = localStorage.getItem("maynails-tema");
	} catch (error) {
		console.warn("No se pudo leer la preferencia guardada del tema.", error);
	}

	aplicarTema(temas.includes(temaGuardado) ? temaGuardado : "claro");
	botonTema.addEventListener("click", () => {
		const temaActual = document.documentElement.dataset.theme;
		aplicarTema(temas[(temas.indexOf(temaActual) + 1) % temas.length]);
	});
})();
