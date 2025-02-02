// Importa las funciones necesarias desde Firebase y otros módulos
import { app, db } from "./firebase.js"; // Asegúrate de que en firebase.js esté correctamente inicializado Firebase
import { collection, getDocs, addDoc } from "firebase/firestore";
import { listarPagosPorUsuario, iniciarPago } from "./pagos.js";
import { config } from "./config.js";

// Referencia a la colección de vehículos
const vehiculosCollection = collection(db, "Vehículo");

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

// Función para calcular la depreciación según la tabla de Hacienda
function calcularDepreciacion(fechaMatriculacion) {
  const hoy = new Date();
  const anoMatriculacion = new Date(fechaMatriculacion).getFullYear();
  const anosTranscurridos = hoy.getFullYear() - anoMatriculacion;

  const tablaDepreciacion = [
    { años: 1, porcentaje: 100 },
    { años: 2, porcentaje: 84 },
    { años: 3, porcentaje: 67 },
    { años: 4, porcentaje: 56 },
    { años: 5, porcentaje: 47 },
    { años: 6, porcentaje: 39 },
    { años: 7, porcentaje: 34 },
    { años: 8, porcentaje: 28 },
    { años: 9, porcentaje: 24 },
    { años: 10, porcentaje: 19 },
    { años: 11, porcentaje: 17 },
    { años: 12, porcentaje: 13 },
    { años: 13, porcentaje: 10 }
  ];

  // Buscar el porcentaje de depreciación correspondiente
  let porcentajeValorInicial = 10; // Mínimo después de 12 años
  for (let i = 0; i < tablaDepreciacion.length; i++) {
    if (anosTranscurridos < tablaDepreciacion[i].años) {
      porcentajeValorInicial = tablaDepreciacion[i].porcentaje;
      break;
    }
  }

  return porcentajeValorInicial / 100; // Convertimos a decimal (ejemplo: 67% -> 0.67)
}

// Función para calcular el ITP basado en el valor venal y el precio de contrato
function calcularITP(precioContrato, valorVenal, porcentajeITP) {
  const baseImponible = Math.max(precioContrato, valorVenal);
  return baseImponible * (porcentajeITP / 100);
}

// Función para calcular el precio con depreciación
async function calcularPrecio() {
  const fechaMatriculacion = document.getElementById("fechaMatriculacion").value;
  const comunidadAutonoma = document.getElementById("comunidadAutonomaComprador").value;
  const combustible = document.getElementById("combustible").value;
  const correo = document.getElementById("correo").value;
  const marca = document.getElementById("marca").value;
  const modelo = document.getElementById("modelo").value;
  const precioContrato = parseFloat(document.getElementById("precioContrato").value);

  if (!fechaMatriculacion || !comunidadAutonoma || !combustible || !correo || !marca || !modelo || isNaN(precioContrato)) {
    alert("Por favor, completa todos los campos antes de calcular el precio.");
    return;
  }

  const tasasDGT = 55.70;
  const gestion = 61.36;
  const iva = 12.89;

  const valorVenalBase = 35000; // Suponemos un valor venal inicial antes de depreciación

  // Calcular depreciación basada en la fecha de matriculación
  const factorDepreciacion = calcularDepreciacion(fechaMatriculacion);
  const valorVenal = valorVenalBase * factorDepreciacion;

  // Definir el porcentaje ITP según la Comunidad Autónoma (esto podría hacerse dinámicamente)
  const porcentajeITP = 4; // Ejemplo: 4% ITP

  // Calcular el ITP con el valor venal ajustado
  const impuesto = calcularITP(precioContrato, valorVenal, porcentajeITP);

  // Calcular el total
  const total = precioContrato + tasasDGT + gestion + iva + impuesto;

  // Actualizar los valores en el DOM
  document.getElementById("tasasDGT").textContent = `${tasasDGT.toFixed(2)} €`;
  document.getElementById("gestion").textContent = `${gestion.toFixed(2)} €`;
  document.getElementById("iva").textContent = `${iva.toFixed(2)} €`;
  document.getElementById("impuesto").textContent = `${impuesto.toFixed(2)} €`;
  document.getElementById("total").textContent = `${total.toFixed(2)} €`;
  document.getElementById("totalCambio").textContent = `${total.toFixed(2)} €`;

  showTab('precio');

  // Guardar en Firebase
  const nuevoRegistro = {
    FechaMatriculacion: fechaMatriculacion,
    ComunidadAutonoma: comunidadAutonoma,
    Combustible: combustible,
    Correo: correo,
    Marca: marca,
    Modelo: modelo,
    PrecioContrato: precioContrato,
    ValorVenal: valorVenal,
    TasasDGT: tasasDGT,
    Gestion: gestion,
    IVA: iva,
    Impuesto: impuesto,
    Total: total,
  };

  try {
    await addDoc(vehiculosCollection, nuevoRegistro);
    alert("Precio y datos del vehículo guardados correctamente en Firebase");
    listarVehiculos();
  } catch (error) {
    console.error("Error al guardar el precio en Firebase:", error);
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
