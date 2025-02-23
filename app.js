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
  tbody.innerHTML = ""; // Limpia la tabla antes de rellenarla

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

// Función para agregar un vehículo
async function agregarVehiculo(event) {
  event.preventDefault();

  const nuevoVehiculo = {
    FechaMatriculacion: document.getElementById("fechaMatriculacion").value,
    ComunidadAutonoma: document.getElementById("comunidadAutonomaComprador").value,
    Combustible: document.getElementById("combustible").value,
    Correo: document.getElementById("correo").value,
    Marca: document.getElementById("marca").value,
    Modelo: document.getElementById("modelo").value,
    PrecioContrato: parseFloat(document.getElementById("precioContrato").value),
  };

  try {
    await addDoc(vehiculosCollection, nuevoVehiculo);
    alert("Vehículo agregado correctamente");
    listarVehiculos();
  } catch (error) {
    console.error("Error al agregar el vehículo:", error);
  }
}



 // Función para calcular el precio y agregarlo a Firebase junto con los datos del vehículo
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

  const tasasDGT = 55.70; // Valor fijo
  const gestion = 61.36; // Valor fijo
  const iva = (precioContrato + tasasDGT + gestion) * 0.21; // 21% de IVA

  // Calcular años de antigüedad del vehículo
  const fechaActual = new Date();
  const fechaMatriculacionDate = new Date(fechaMatriculacion);
  const antigüedad = fechaActual.getFullYear() - fechaMatriculacionDate.getFullYear();
  if (fechaMatriculacionDate > fechaActual) {
    alert("La fecha de matriculación no puede ser futura.");
    return;
  }

  // Ajustar el impuesto dependiendo de la antigüedad
  let impuesto;
  if (antigüedad > 10) {
    impuesto = precioContrato * 0.03; // 3% si tiene más de 10 años
  } else if (antigüedad > 5) {
    impuesto = precioContrato * 0.05; // 5% si tiene entre 5 y 10 años
  } else {
    impuesto = precioContrato * 0.07; // 7% si tiene menos de 5 años
  }

  const total = precioContrato + tasasDGT + gestion + iva + impuesto;

  // Actualizar los valores en el DOM
  document.getElementById("tasasDGT").textContent = `${tasasDGT.toFixed(2)} €`;
  document.getElementById("gestion").textContent = `${gestion.toFixed(2)} €`;
  document.getElementById("iva").textContent = `${iva.toFixed(2)} €`;
  document.getElementById("impuesto").textContent = `${impuesto.toFixed(2)} €`;
  document.getElementById("total").textContent = `${total.toFixed(2)} €`;

  // Cambiar a la pestaña "Precio"
  showTab('precio');

  // Guardar los datos del vehículo y el cálculo del precio en Firebase
  const nuevoRegistro = {
    FechaMatriculacion: fechaMatriculacion,
    ComunidadAutonoma: comunidadAutonoma,
    Combustible: combustible,
    Correo: correo,
    Marca: marca,
    Modelo: modelo,
    PrecioContrato: precioContrato,
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


// Función principal para inicializar la aplicación
function initApp() {
  console.log("Iniciando aplicación...");

  // Inicializar secciones principales
  listarVehiculos();

  // Manejo de eventos para pagos
  document.getElementById("iniciarPagoBtn").addEventListener("click", () => {
    const transaccionId = document.getElementById("transaccionId").value;
    const monto = parseFloat(document.getElementById("monto").value);
    const metodoPago = document.getElementById("metodoPago").value;
    const usuarioId = config.usuarioId; // Usamos un valor global desde config.js

    if (!transaccionId || isNaN(monto) || !metodoPago) {
      alert("Por favor, completa todos los campos de pago.");
      return;
    }

    iniciarPago(transaccionId, monto, metodoPago, usuarioId)
      .then((pagoId) => alert(`Pago iniciado correctamente. ID: ${pagoId}`))
      .catch((error) => alert(`Error al iniciar el pago: ${error.message}`));
  });

  // Mostrar los pagos del usuario
  listarPagosPorUsuario(config.usuarioId)
    .then((pagos) => console.log("Pagos del usuario:", pagos))
    .catch((error) => console.error("Error al listar pagos:", error));
}

// Asociar eventos a botones y formularios
document.getElementById("formVehiculo").addEventListener("submit", (event) => {
  event.preventDefault();
  agregarVehiculo(event);
});

document.getElementById("calcularPrecioBtn").addEventListener("click", calcularPrecio);

// Función para cambiar de pestañas
function showTab(tabId) {
  const tabs = document.querySelectorAll('.tab-content');
  const buttons = document.querySelectorAll('.tab-button');

  tabs.forEach(tab => tab.classList.remove('active-tab'));
  buttons.forEach(button => button.classList.remove('active'));

  document.getElementById(tabId).classList.add('active-tab');
  document.querySelector(`.tab-button[onclick="showTab('${tabId}')"]`).classList.add('active');
}

// Inicializar la aplicación al cargar la página
document.addEventListener("DOMContentLoaded", initApp);

// Opciones de autocompletado al cargar     js.