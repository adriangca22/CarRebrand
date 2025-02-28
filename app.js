// Importa las funciones necesarias desde Firebase y otros módulos
import { app, db } from "./firebase.js"; // Asegúrate de que en firebase.js esté correctamente inicializado Firebase
import { collection, getDocs, addDoc } from "firebase/firestore";

// Referencia a la colección de vehículos
const vehiculosCollection = collection(db, "Vehículo");

// Coeficientes de depreciación para vehículos de turismo, todo terreno, quads, motocicletas
const coeficientesDepreciacionVehiculos = [
  { años: 1, coef: 1.0 }, // 100%
  { años: 2, coef: 0.84 }, // 84%
  { años: 3, coef: 0.67 }, // 67%
  { años: 4, coef: 0.56 }, // 56%
  { años: 5, coef: 0.47 }, // 47%
  { años: 6, coef: 0.39 }, // 39%
  { años: 7, coef: 0.34 }, // 34%
  { años: 8, coef: 0.28 }, // 28%
  { años: 9, coef: 0.24 }, // 24%
  { años: 10, coef: 0.19 }, // 19%
  { años: 11, coef: 0.17 }, // 17%
  { años: 12, coef: 0.13 }, // 13%
  { años: Infinity, coef: 0.10 } // 10% para más de 12 años
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
  const tbody = document.getElementById("tablaVehiculos")?.querySelector("tbody");
  if (!tbody) return;

  tbody.innerHTML = ""; // Limpia el contenido previo

  try {
    const querySnapshot = await getDocs(vehiculosCollection);
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const row = `
        <tr>
          <td>${data.FechaMatriculacion || "No especificado"}</td>
          <td>${data.ComunidadAutonoma || "No especificado"}</td>
          <td>${data.Combustible || "No especificado"}</td>
          <td>${data.Marca || "No especificado"}</td>
          <td>${data.Modelo || "No especificado"}</td>
          <td>${data.PrecioContrato || "No especificado"} €</td>
        </tr>
      `;
      tbody.innerHTML += row;
    });
  } catch (error) {
    console.error("Error al listar los vehículos:", error.message || error);
    alert("Hubo un error al cargar los vehículos. Detalles: " + (error.message || error));
  }
}

// Función para calcular el valor venal de vehículos
function calcularValorVenal(valorBase, fechaMatriculacion, comunidad) {
  let añoActual = new Date().getFullYear();
  let añoVehiculo = new Date(fechaMatriculacion).getFullYear();
  let antigüedad = añoActual - añoVehiculo;

  // Obtener el coeficiente de depreciación según la antigüedad
  let coefDepreciacion = coeficientesDepreciacionVehiculos.find(c => antigüedad >= c.años)?.coef || 0.10;

  // Obtener el coeficiente de la comunidad autónoma
  let coefComunidad = coeficientesComunidad[comunidad] || 1.0;

  // Calcular el valor venal
  return valorBase * coefDepreciacion * coefComunidad;
}

// Función para calcular el ITP
function calcularITP(valorVenal, porcentajeITP) {
  return valorVenal * (porcentajeITP / 100);
}

// Función para actualizar los valores en el modal
function actualizarModal(valorHacienda, depreciacion, valorFiscal, itp) {
  if (document.getElementById("valorHacienda")) {
    document.getElementById("valorHacienda").textContent = `${valorHacienda.toFixed(2)} €`;
  }
  if (document.getElementById("depreciacion")) {
    document.getElementById("depreciacion").textContent = `${(depreciacion * 100).toFixed(0)} %`;
  }
  if (document.getElementById("valorFiscal")) {
    document.getElementById("valorFiscal").textContent = `${valorFiscal.toFixed(2)} €`;
  }
  if (document.getElementById("itpCalculado")) {
    document.getElementById("itpCalculado").textContent = `${itp.toFixed(2)} €`;
  }
}

// Función para calcular el precio final SIN GUARDAR EN FIREBASE
function calcularPrecioSinGuardar() {
  const fechaMatriculacion = document.getElementById("fechaMatriculacion")?.value;
  const comunidadAutonoma = document.getElementById("comunidadAutonomaComprador")?.value;
  const precioContrato = parseFloat(document.getElementById("precioContrato")?.value);
  const marca = document.getElementById("marca")?.value;
  const modelo = document.getElementById("modelo")?.value;

  if (!validarFormulario()) {
    return;
  }

  // Valor base de Hacienda específico para el modelo Abarth 124 Spider TB Multiair 6V
  const valorBaseHacienda = 32800; // Valor de tablas de Hacienda para el modelo específico

  // Calcular la antigüedad
  const antigüedad = new Date().getFullYear() - new Date(fechaMatriculacion).getFullYear();

  // Obtener el coeficiente de depreciación según la antigüedad
  const depreciacion = coeficientesDepreciacionVehiculos.find(c => antigüedad >= c.años)?.coef || 0.10;

  // Calcular el valor fiscal
  const valorFiscal = calcularValorVenal(valorBaseHacienda, fechaMatriculacion, comunidadAutonoma);

  // Calcular el ITP (4% sobre el valor más alto entre el precio de compraventa y el valor fiscal)
  const porcentajeITP = 4;
  const baseITP = Math.max(precioContrato, valorFiscal); // Usar el valor más alto
  const impuesto = calcularITP(baseITP, porcentajeITP);

  // Calcular el total (incluyendo tasas DGT, gestión, IVA y costos adicionales)
  const tasasDGT = 55.70;
  const gestion = 61.36;
  const iva = 12.89;
  const costoAdicional1 = 12; // Ejemplo: Seguro temporal
  const costoAdicional2 = 9.90; // Ejemplo: Otro servicio
  const total = tasasDGT + gestion + iva + impuesto + costoAdicional1 + costoAdicional2;

  // Mostrar resultados en la interfaz
  document.getElementById("tasasDGT").textContent = `${tasasDGT.toFixed(2)} €`;
  document.getElementById("gestion").textContent = `${gestion.toFixed(2)} €`;
  document.getElementById("iva").textContent = `${iva.toFixed(2)} €`;
  document.getElementById("impuesto").textContent = `${impuesto.toFixed(2)} €`;
  document.getElementById("total").textContent = `${total.toFixed(2)} €`;

  // Actualizar el modal con los valores calculados
  actualizarModal(valorBaseHacienda, depreciacion, valorFiscal, impuesto);
}
// Función para calcular el precio final y enviar datos a Firebase
async function calcularPrecioYGuardar() {
  // Validar el formulario antes de proceder
  if (!validarFormulario()) {
    return;
  }

  calcularPrecioSinGuardar(); // Primero calcula los precios

  // Obtener los valores del formulario
  const fechaMatriculacion = document.getElementById("fechaMatriculacion")?.value || "No especificado";
  const comunidadAutonoma = document.getElementById("comunidadAutonomaComprador")?.value || "No especificado";
  const precioContrato = parseFloat(document.getElementById("precioContrato")?.value) || 0;
  const combustible = document.getElementById("combustible")?.value || "No especificado";
  const marca = document.getElementById("marca")?.value || "No especificado";
  const modelo = document.getElementById("modelo")?.value || "No especificado";

  // Obtener los valores calculados
  const valorFiscal = parseFloat(document.getElementById("valorFiscal")?.textContent.replace(" €", "")) || 0;
  const impuesto = parseFloat(document.getElementById("impuesto")?.textContent.replace(" €", "")) || 0;
  const total = parseFloat(document.getElementById("total")?.textContent.replace(" €", "")) || 0;

  // Crear un nuevo registro para guardar en Firebase
  const nuevoRegistro = {
    FechaMatriculacion: fechaMatriculacion,
    ComunidadAutonoma: comunidadAutonoma,
    Combustible: combustible,
    Marca: marca,
    Modelo: modelo,
    PrecioContrato: precioContrato,
    ValorFiscal: valorFiscal,
    ITP: impuesto,
    Total: total,
    FechaRegistro: new Date().toISOString()
  };

  try {
    // Guardar los datos en Firebase
    await addDoc(vehiculosCollection, nuevoRegistro);
    console.log("Datos guardados correctamente en Firebase.");
    listarVehiculos(); // Actualizar la tabla después de guardar
    alert("Los datos se han guardado correctamente.");
  } catch (error) {
    console.error("Error al guardar en Firebase:", error.message || error);
    alert("Hubo un error al guardar los datos. Detalles: " + (error.message || error));
  }

  // Cambiar a la pestaña de precios
  showTab('precio');
}

// Función para validar el formulario
function validarFormulario() {
  const fechaMatriculacion = document.getElementById("fechaMatriculacion")?.value;
  const comunidadAutonoma = document.getElementById("comunidadAutonomaComprador")?.value;
  const precioContrato = parseFloat(document.getElementById("precioContrato")?.value);
  const combustible = document.getElementById("combustible")?.value;
  const marca = document.getElementById("marca")?.value;
  const modelo = document.getElementById("modelo")?.value;

  // Validar campos obligatorios
  if (
    !fechaMatriculacion ||
    !comunidadAutonoma ||
    isNaN(precioContrato) ||
    !combustible ||
    !marca ||
    !modelo
  ) {
    alert("Por favor, completa todos los campos obligatorios.");
    return false;
  }

  return true;
}

// Asociar eventos a botones y formularios
document.getElementById("calcularPrecioBtn")?.addEventListener("click", calcularPrecioYGuardar);
document.addEventListener("DOMContentLoaded", listarVehiculos);

// Función para cambiar de pestañas
function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active-tab'));
  document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
  document.getElementById(tabId)?.classList.add('active-tab');
  document.querySelector(`.tab-button[onclick="showTab('${tabId}')"]`)?.classList.add('active');
}

// Mostrar modal al hacer clic en "+info"
document.getElementById("mostrarInfo")?.addEventListener("click", function(event) {
  event.preventDefault();
  calcularPrecioSinGuardar(); // Solo calcula los precios, sin guardar en Firebase
  document.getElementById("modalInfo").style.display = "block";
});

// Cerrar modal al hacer clic en la "X"
document.getElementById("cerrarModal")?.addEventListener("click", function() {
  document.getElementById("modalInfo").style.display = "none";
});

// Cerrar modal al hacer clic fuera del contenido
window.onclick = function(event) {
  const modal = document.getElementById("modalInfo");
  if (event.target === modal) {
    modal.style.display = "none";
  }
};





