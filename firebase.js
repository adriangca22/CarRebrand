import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage, ref } from "firebase/storage";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD6VwYbDhPiE1I47tmHcZ7P5N8nTT7fhDE",
  authDomain: "burocraciacero-2637.firebaseapp.com",
  projectId: "burocraciacero-2637",
  storageBucket: "burocraciacero-2637.appspot.com", // Corrección aquí
  messagingSenderId: "970776000492",
  appId: "1:970776000492:web:97054ab72b48e63bea32c9",
  measurementId: "G-5EB64EQEFT",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
const db = getFirestore(app);

// Inicializar Firebase Storage
const storage = getStorage(app);
const storageRef = ref(storage, "vehiculos/documentos/"); // Ruta específica

// Exportar los objetos
export { app, db, storage, storageRef };

// Verificar que Firebase se ha inicializado correctamente
console.log("Firebase Initialized:", app);
console.log("Firestore Ready:", db);
console.log("Storage Ready:", storageRef);

// Hacer accesibles globalmente (SOLO EN DESARROLLO)
if (typeof window !== "undefined") {
  window.app = app;
  window.db = db;
  window.storage = storage;
  window.storageRef = storageRef;
}
