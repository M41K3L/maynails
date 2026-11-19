document.addEventListener("contextmenu", (event) => {
	if (event.target instanceof Element && event.target.closest(".media-shield")) {
		event.preventDefault();
	}
});

document.addEventListener("dragstart", (event) => {
	if (event.target instanceof Element && event.target.closest(".media-shield")) {
		event.preventDefault();
	}
});

document.addEventListener(
	"keydown",
	(event) => {
		const key = event.key.toLowerCase();
		const modified = event.ctrlKey || event.metaKey;
		const blocked =
			(modified && (key === "s" || key === "u")) ||
			(modified && event.shiftKey && key === "i") ||
			event.key === "F12";

		if (blocked) {
			event.preventDefault();
			event.stopPropagation();
		}
	},
	true
);

const dialog = document.createElement("dialog");
dialog.className = "media-lightbox";
dialog.setAttribute("aria-label", "Vista ampliada de imagen");

const closeButton = document.createElement("button");
closeButton.className = "media-lightbox-cerrar";
closeButton.type = "button";
closeButton.textContent = "Cerrar";
closeButton.addEventListener("click", () => dialog.close());

const figure = document.createElement("figure");
figure.className = "media-lightbox-figura";

const enlargedImage = document.createElement("img");
const title = document.createElement("p");
title.className = "media-lightbox-titulo";
title.setAttribute("aria-live", "polite");

const toolbar = document.createElement("div");
toolbar.className = "media-lightbox-barra";
toolbar.append(title, closeButton);

const watermark = document.createElement("span");
watermark.className = "media-lightbox-marca";
watermark.setAttribute("aria-hidden", "true");
watermark.textContent = "MayNails Studio";

figure.append(enlargedImage, watermark);
const reserveLink = document.createElement("a");
reserveLink.className = "media-lightbox-reservar";
reserveLink.href = "/agenda";
reserveLink.textContent = "Reservar este estilo";

dialog.append(toolbar, figure, reserveLink);
document.body.append(dialog);

let lastFocusedImage = null;

document.querySelectorAll(".media-shield.is-image img").forEach((image) => {
	image.tabIndex = 0;
	image.setAttribute("role", "button");
});

document.addEventListener("click", (event) => {
	if (!(event.target instanceof HTMLImageElement)) return;
	if (!event.target.closest(".media-shield.is-image")) return;

	lastFocusedImage = event.target;
	enlargedImage.src = event.target.currentSrc || event.target.src;
	enlargedImage.alt = event.target.alt;
	title.textContent = event.target.closest(".galeria-card")?.querySelector("h2")?.textContent ||
		event.target.alt;
	dialog.showModal();
	closeButton.focus();
});

document.addEventListener("keydown", (event) => {
	if (!(event.target instanceof HTMLImageElement)) return;
	if (!event.target.closest(".media-shield.is-image")) return;
	if (event.key !== "Enter" && event.key !== " ") return;

	event.preventDefault();
	event.target.click();
});

dialog.addEventListener("click", (event) => {
	if (event.target === dialog) dialog.close();
});

dialog.addEventListener("close", () => {
	enlargedImage.removeAttribute("src");
	title.textContent = "";
	lastFocusedImage?.focus();
});

document.querySelectorAll(".galeria-filtro").forEach((filterButton) => {
	filterButton.addEventListener("click", () => {
		const selectedCategory = filterButton.dataset.filtro;

		document.querySelectorAll(".galeria-filtro").forEach((button) => {
			const selected = button === filterButton;
			button.classList.toggle("activo", selected);
			button.setAttribute("aria-pressed", String(selected));
		});

		document.querySelectorAll(".galeria-card").forEach((card) => {
			card.hidden = selectedCategory !== "Todos" && card.dataset.categoria !== selectedCategory;
		});
	});
});

document.querySelectorAll(".video-portada").forEach((videoCard) => {
	const video = videoCard.querySelector("video");
	const playButton = videoCard.querySelector(".media-video-play");
	const errorMessage = videoCard.querySelector(".media-video-error");

	if (!(video instanceof HTMLVideoElement) || !(playButton instanceof HTMLButtonElement)) {
		return;
	}

	playButton.addEventListener("click", async () => {
		errorMessage.hidden = true;
		try {
			await video.play();
			videoCard.classList.add("reproduciendo");
		} catch {
			errorMessage.hidden = false;
		}
	});

	video.addEventListener("playing", () => {
		videoCard.classList.add("reproduciendo");
		errorMessage.hidden = true;
	});

	video.addEventListener("error", () => {
		errorMessage.hidden = false;
	});
});
