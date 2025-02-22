// Importa las funciones necesarias desde Firebase y otros módulos
import { app, db } from "./firebase.js"; 
import { collection, getDocs, addDoc } from "firebase/firestore";
import { listarPagosPorUsuario, iniciarPago } from "./pagos.js";
import { config } from "./config.js";

const vehiculosCollection = collection(db, "Vehículo");

// Coeficientes de depreciación
const coefDepreciacion = [
  { años: 1, coef: 0.84 }, { años: 2, coef: 0.67 }, { años: 3, coef: 0.56 },
  { años: 4, coef: 0.47 }, { años: 5, coef: 0.39 }, { años: 6, coef: 0.34 },
  { años: 7, coef: 0.28 }, { años: 8, coef: 0.24 }, { años: 9, coef: 0.19 },
  { años: 10, coef: 0.17 }
];

const coefComunidad = {
  "Andalucía": 0.90, "Aragón": 0.93, "Asturias": 0.94, "Islas Baleares": 0.96,
  "Canarias": 0.85, "Cantabria": 0.95, "Castilla-La Mancha": 0.89, "Castilla y León": 0.91,
  "Cataluña": 0.95, "Comunidad Valenciana": 0.88, "Extremadura": 0.87, "Galicia": 0.92,
  "La Rioja": 0.90, "Madrid": 1.0, "Murcia": 0.89, "Navarra": 1.0, "País Vasco": 1.0,
  "Ceuta": 0.80, "Melilla": 0.80
};

// Calcula el valor venal del vehículo
function calcularValorVenal(valorBase, fechaMatriculacion, comunidad) {
  let años = new Date().getFullYear() - new Date(fechaMatriculacion).getFullYear();
  let coefDep = coefDepreciacion.find(c => años >= c.años)?.coef || 0.17;
  return valorBase * coefDep * (coefComunidad[comunidad] || 1.0);
}

// Calcula el ITP
const calcularITP = (valorVenal, porcentaje) => valorVenal * (porcentaje / 100);

// Calcula y muestra el precio total
async function calcularPrecio() {
  const fechaMatriculacion = document.getElementById("fechaMatriculacion").value;
  const comunidad = document.getElementById("comunidadAutonomaComprador").value;
  const precioContrato = parseFloat(document.getElementById("precioContrato").value);

  if (!fechaMatriculacion || !comunidad || isNaN(precioContrato)) {
    return alert("Completa todos los campos antes de calcular.");
  }

  const tasasDGT = 55.70, gestion = 61.36, iva = 12.89;
  const valorVenal = calcularValorVenal(5508, fechaMatriculacion, comunidad);
  const impuesto = calcularITP(valorVenal, 4);
  const total = tasasDGT + gestion + iva + impuesto;

  ["tasasDGT", "gestion", "iva", "impuesto", "total"].forEach(id => {
    document.getElementById(id).textContent = `${eval(id).toFixed(2)} €`;
  });

  showTab('precio');

  try {
    await addDoc(vehiculosCollection, {
      FechaMatriculacion: fechaMatriculacion, ComunidadAutonoma: comunidad,
      PrecioContrato: precioContrato, ValorVenal: valorVenal, TasasDGT: tasasDGT,
      Gestion: gestion, IVA: iva, Impuesto: impuesto, Total: total,
      Combustible: document.getElementById("combustible").value,
      Correo: document.getElementById("correo").value,
      Marca: document.getElementById("marca").value,
      Modelo: document.getElementById("modelo").value
    });
    listarVehiculos();
  } catch (error) {
    console.error("Error al guardar en Firebase:", error);
  }
}

// Eventos
document.getElementById("calcularPrecioBtn").addEventListener("click", calcularPrecio);
document.addEventListener("DOMContentLoaded", listarVehiculos);

// Cambia de pestaña
function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active-tab'));
  document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
  document.getElementById(tabId).classList.add('active-tab');
  document.querySelector(`.tab-button[onclick="showTab('${tabId}')"]`).classList.add('active');
}
