// Importa las funciones necesarias desde Firebase y otros módulos
import { app, db } from "./firebase.js"; // Asegúrate de que en firebase.js esté correctamente inicializado Firebase
import { collection, getDocs, addDoc } from "firebase/firestore";
import { listarPagosPorUsuario, iniciarPago } from "./pagos.js";
import { config } from "./config.js";

// Referencia a la colección de vehículos
const vehiculosCollection = collection(db, "Vehículo");

// Coeficientes de depreciación para vehículos de turismo, todo terreno, quads, motocicletas
const coeficientesDepreciacionVehiculos = [
  { años: 1, coef: 0.84 },
  { años: 2, coef: 0.67 },
  { años: 3, coef: 0.56 },
  { años: 4, coef: 0.47 },
  { años: 5, coef: 0.39 },
  { años: 6, coef: 0.34 },
  { años: 7, coef: 0.28 },
  { años: 8, coef: 0.24 },
  { años: 9, coef: 0.19 },
  { años: 10, coef: 0.17 }
];

// Coeficientes de depreciación para embarcaciones
const coeficientesDepreciacionEmbarcaciones = [
  { años: 1, coef: 1.0 },
  { años: 2, coef: 0.95 },
  { años: 3, coef: 0.89 },
  { años: 4, coef: 0.78 },
  { años: 5, coef: 0.70 },
  { años: 6, coef: 0.60 },
  { años: 7, coef: 0.55 },
  { años: 8, coef: 0.40 },
  { años: 9, coef: 0.38 },
  { años: 10, coef: 0.35 },
  { años: 11, coef: 0.30 },
  { años: 12, coef: 0.25 },
  { años: 13, coef: 0.20 },
  { años: 14, coef: 0.15 },
  { años: 15, coef: 0.10 }
];

// Coeficientes de comunidades autónomas
const coeficientesComunidad = {
  "Andalucía": 0.90,
  "Aragón": 0.93,
  "Asturias": 0.94,
  "Islas Baleares": 0.96,
  "Canarias": 0.85,
  "Cantabria": 0.95,
  "Castilla-La Mancha": 0.89,
  "Castilla y León": 0.91,
  "Cataluña": 0.95,
  "Comunidad Valenciana": 0.88,
  "Extremadura": 0.87,
  "Galicia": 0.92,
  "La Rioja": 0.90,
  "Madrid": 1.0,
  "Murcia": 0.89,
  "Navarra": 1.0,
  "País Vasco": 1.0,
  "Ceuta": 0.80,
  "Melilla": 0.80
};

// Función para listar vehículos
async function listarVehiculos() {
  const tbody = document.getElementById("tablaVehiculos").querySelector("tbody");
  tbody.innerHTML = "";

  try {
    const querySnapshot = await getDocs(vehiculosCollection);
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const row = `
        <tr>
          <td>${data.FechaMatriculacion}</td>
          <td>${data.ComunidadAutonoma}</td>
          <td>${data.Combustible}</td>
          <td>${data.Correo}</td>
          <td>${data.Marca}</td>
          <td>${data.Modelo}</td>
          <td>${data.PrecioContrato}</td>
        </tr>
      `;
      tbody.innerHTML += row;
    });
  } catch (error) {
    console.error("Error al listar los vehículos:", error);
  }
}

// Función para calcular el valor venal de vehículos
function calcularValorVenal(valorBase, fechaMatriculacion, comunidad) {
  let añoActual = new Date().getFullYear();
  let añoVehiculo = new Date(fechaMatriculacion).getFullYear();
  let antigüedad = añoActual - añoVehiculo;

  let coefDepreciacion = coeficientesDepreciacionVehiculos.find(c => antigüedad >= c.años)?.coef || 0.17;
  let coefComunidad = coeficientesComunidad[comunidad] || 1.0;

  return valorBase * coefDepreciacion * coefComunidad;
}

// Función para calcular el valor de embarcaciones
function calcularValorEmbarcacion(valorBase, fechaMatriculacion) {
  let añoActual = new Date().getFullYear();
  let añoEmbarcacion = new Date(fechaMatriculacion).getFullYear();
  let antigüedad = añoActual - añoEmbarcacion;

  let coefDepreciacion = coeficientesDepreciacionEmbarcaciones.find(c => antigüedad >= c.años)?.coef || 0.10;

  return valorBase * coefDepreciacion;
}
// Función para calcular el ITP
function calcularITP(precioContrato, valorVenal, porcentajeITP) {
  const baseImponible = Math.max(precioContrato, valorVenal);
  return baseImponible * (porcentajeITP / 100);
}

// Función para calcular el precio final
async function calcularPrecio() {
  const fechaMatriculacion = document.getElementById("fechaMatriculacion").value;
  const comunidadAutonoma = document.getElementById("comunidadAutonomaComprador").value;
  const precioContrato = parseFloat(document.getElementById("precioContrato").value);

  if (!fechaMatriculacion || !comunidadAutonoma || isNaN(precioContrato)) {
    alert("Por favor, completa todos los campos antes de calcular el precio.");
    return;
  }

  const tasasDGT = 55.70;
  const gestion = 61.36;
  const iva = 12.89;
  const valorVenalBase = 129.00;

  const valorVenal = calcularValorVenal(valorVenalBase, fechaMatriculacion, comunidadAutonoma);
  const porcentajeITP = 4;
  const impuesto = calcularITP(precioContrato, valorVenal, porcentajeITP);
  // No incluimos precioContrato en el total
  const total = tasasDGT + gestion + iva + impuesto;

  document.getElementById("tasasDGT").textContent = `${tasasDGT.toFixed(2)} €`;
  document.getElementById("gestion").textContent = `${gestion.toFixed(2)} €`;
  document.getElementById("iva").textContent = `${iva.toFixed(2)} €`;
  document.getElementById("impuesto").textContent = `${impuesto.toFixed(2)} €`;
  document.getElementById("total").textContent = `${total.toFixed(2)} €`;

  showTab('precio');

  // Guardar en Firebase sin sumar el precio de contrato en el total
  const nuevoRegistro = {
    FechaMatriculacion: fechaMatriculacion,
    ComunidadAutonoma: comunidadAutonoma,
    PrecioContrato: precioContrato,  // Guardamos el precio de contrato
    ValorVenal: valorVenal,
    TasasDGT: tasasDGT,
    Gestion: gestion,
    IVA: iva,
    Impuesto: impuesto,
    Total: total,  // Guardamos el total sin incluir el precio de contrato
    Combustible: document.getElementById("combustible").value, // Nuevo campo Combustible
    Correo: document.getElementById("correo").value, // Nuevo campo Correo
    Marca: document.getElementById("marca").value, // Nuevo campo Marca
    Modelo: document.getElementById("modelo").value // Nuevo campo Modelo
  };

  try {
    await addDoc(vehiculosCollection, nuevoRegistro);
 ;
    listarVehiculos();
  } catch (error) {
  ;
  }
}

// Asociar eventos a botones y formularios
document.getElementById("calcularPrecioBtn").addEventListener("click", calcularPrecio);
document.addEventListener("DOMContentLoaded", listarVehiculos);

// Función para cambiar de pestañas
function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active-tab'));
  document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
  document.getElementById(tabId).classList.add('active-tab');
  document.querySelector(`.tab-button[onclick="showTab('${tabId}')"]`).classList.add('active');
}

