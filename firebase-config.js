import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
	initializeFirestore,
	persistentLocalCache,
	persistentMultipleTabManager
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
	apiKey: "AIzaSyAMt-pkC7Uyu766bGuRlKlA9oSHzxjdkaA",
	authDomain: "maynails-studio.firebaseapp.com",
	projectId: "maynails-studio",
	storageBucket: "maynails-studio.firebasestorage.app",
	messagingSenderId: "606992287930",
	appId: "1:606992287930:web:7307a3f615a3b8ca895a83",
	measurementId: "G-RCQLSRG543"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = initializeFirestore(firebaseApp, {
	localCache: persistentLocalCache({
		tabManager: persistentMultipleTabManager()
	}),
	experimentalAutoDetectLongPolling: true
});
