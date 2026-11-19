const CACHE_NAME = "maynails-admin-v7";
const CACHE_PREFIX = "maynails-";
const PRECACHE_URLS = [
	"./",
	"./index.html",
	"./admin.html",
	"./admin.js",
	"./firebase-config.js",
	"./styles.css",
	"./tema.js",
	"./fidelidad.html",
	"./fidelidad.js",
	"./agenda.html",
	"./agenda.js"
];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then((cache) => cache.addAll(PRECACHE_URLS))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys()
			.then((cacheNames) => Promise.all(
				cacheNames
					.filter((cacheName) => cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME)
					.map((cacheName) => caches.delete(cacheName))
			))
			.then(() => self.clients.claim())
	);
});

self.addEventListener("fetch", (event) => {
	const request = event.request;
	if (request.method !== "GET") return;

	const requestUrl = new URL(request.url);
	if (requestUrl.origin !== self.location.origin) return;

	event.respondWith(
		fetch(request)
			.then(async (response) => {
				if (response.ok) {
					const cache = await caches.open(CACHE_NAME);
					await cache.put(request, response.clone());
				}
				return response;
			})
			.catch(async () => {
				const cached = await caches.match(request, { ignoreSearch: true });
				if (cached) return cached;
				if (request.mode === "navigate") {
					const page = new URL(request.url).pathname.endsWith("/admin.html")
						? "./admin.html"
						: "./index.html";
					const fallback = await caches.match(page);
					if (fallback) return fallback;
				}
				return Response.error();
			})
	);
});
