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

// Función para calcular el precio final y enviar datos a Firebase
async function calcularPrecio() {
  const fechaMatriculacion = document.getElementById("fechaMatriculacion").value;
  const comunidadAutonoma = document.getElementById("comunidadAutonomaComprador").value;
  const precioContrato = parseFloat(document.getElementById("precioContrato").value);

  if (!fechaMatriculacion || !comunidadAutonoma || isNaN(precioContrato)) {
    alert("Por favor, completa todos los campos antes de calcular el precio.");
    return;
  }

  // Valor base de Hacienda específico para el modelo Abarth 124 Spider TB Multiair 6V
  const valorBaseHacienda = 32800; // Valor de tablas de Hacienda para el modelo específico

  // Calcular la antigüedad
  const antigüedad = new Date().getFullYear() - new Date(fechaMatriculacion).getFullYear();

  // Obtener el coeficiente de depreciación según la antigüedad
  const depreciacion = coeficientesDepreciacionVehiculos.find(c => antigüedad >= c.años)?.coef || 0.10;

  // Calcular el valor fiscal
  const valorFiscal = valorBaseHacienda * depreciacion;

  // Calcular el ITP (4% sobre el valor más alto entre el precio de compraventa y el valor fiscal)
  const porcentajeITP = 4;
  const baseITP = Math.max(precioContrato, valorFiscal); // Usar el valor más alto
  const impuesto = calcularITP(baseITP, porcentajeITP);

  // Calcular el total (sin incluir el precio de contrato)
  const tasasDGT = 55.70;
  const gestion = 61.36;
  const iva = 12.89;
  const total = tasasDGT + gestion + iva + impuesto;

  // Mostrar resultados en la interfaz
  document.getElementById("tasasDGT").textContent = `${tasasDGT.toFixed(2)} €`;
  document.getElementById("gestion").textContent = `${gestion.toFixed(2)} €`;
  document.getElementById("iva").textContent = `${iva.toFixed(2)} €`;
  document.getElementById("impuesto").textContent = `${impuesto.toFixed(2)} €`;
  document.getElementById("total").textContent = `${total.toFixed(2)} €`;

  // Actualizar el modal con los valores calculados
  actualizarModal(valorBaseHacienda, depreciacion, valorFiscal, impuesto);

  // Guardar los datos en Firebase
  const nuevoRegistro = {
    FechaMatriculacion: fechaMatriculacion,
    ComunidadAutonoma: comunidadAutonoma,
    PrecioContrato: precioContrato,
    ValorFiscal: valorFiscal,
    ITP: impuesto,
    Total: total,
    FechaRegistro: new Date().toISOString()
  };

  try {
    await addDoc(vehiculosCollection, nuevoRegistro);
    alert("Datos guardados correctamente en Firebase.");
    listarVehiculos(); // Actualizar la tabla después de guardar
  } catch (error) {
    console.error("Error al guardar en Firebase:", error);
    alert("Hubo un error al guardar los datos. Por favor, intenta nuevamente.");
  }

  showTab('precio');
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

// Mostrar modal al hacer clic en "+info"
document.getElementById("mostrarInfo").addEventListener("click", function(event) {
  event.preventDefault();
  calcularPrecio(); // Asegura que se calculen los valores antes de abrir el modal
  document.getElementById("modalInfo").style.display = "block";
});

// Cerrar modal al hacer clic en la "X"
document.getElementById("cerrarModal").addEventListener("click", function() {
  document.getElementById("modalInfo").style.display = "none";
});

// Cerrar modal al hacer clic fuera del contenido
window.onclick = function(event) {
  if (event.target == document.getElementById("modalInfo")) {
    document.getElementById("modalInfo").style.display = "none";
  }
};





/ Función para mostrar el resumen del trámite
function mostrarResumen() {
  const total = parseFloat(document.getElementById("total").textContent.replace(" €", ""));
  // Actualizar el total en la sección de pago
  document.getElementById("pagoTotal").textContent = total.toFixed(2);
  document.getElementById("pagoTotalBoton").textContent = total.toFixed(2);
  // Mostrar el resumen
  alert(`Resumen del trámite:\nTotal a pagar: ${total.toFixed(2)} €`);
}

// Función para manejar el envío del formulario de pago con Stripe
document.getElementById("formPago").addEventListener("submit", async function (event) {
  event.preventDefault(); // Evitar el envío del formulario

  // Validar los campos del formulario de pago
  const nombreApellidos = document.getElementById("nombreApellidos").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const total = parseFloat(document.getElementById("pagoTotal").textContent.replace(" €", "")) * 100; // Convertir a céntimos

  if (!nombreApellidos || !telefono || isNaN(total) || total <= 0) {
    alert("Por favor, completa todos los campos y verifica el monto.");
    return;
  }

  try {
    // Llamar a la API backend para crear una sesión de pago en Stripe
    const response = await fetch("http://localhost:3000/crear-sesion-pago", { // Asegúrate de que esta URL sea correcta
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Math.round(total), name: nombreApellidos, phone: telefono }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al procesar el pago");
    }

    const data = await response.json();

    // Redirigir a la página de pago de Stripe
    const stripe = Stripe("pk_live_51OpdmhJaeP6i0xi8L4uF5lVArUwuapOlJwbovJdBec1RqDfCJzjwoDJGiHC5pDypqOyOhHXfPlvjDEZRgorZpRko00oVTCI0Xb"); // Asegúrate de usar la clave pública correcta
    stripe.redirectToCheckout({ sessionId: data.id });
  } catch (error) {
    console.error("Detalles del error:", error);
    alert(`Error al procesar el pago: ${error.message}`);
  }
});

// Función para actualizar el total en la sección de pago
function actualizarTotalPago() {
  const total = parseFloat(document.getElementById("total").textContent.replace(" €", ""));
  document.getElementById("pagoTotal").textContent = total.toFixed(2);
  document.getElementById("pagoTotalBoton").textContent = total.toFixed(2);
}

// Llamar a actualizarTotalPago cuando se calcule el precio
document.getElementById("calcularPrecioBtn").addEventListener("click", function () {
  calcularPrecioYGuardar(); // Solo realiza el cálculo
  actualizarTotalPago();    // Actualiza el total en la vista
});


