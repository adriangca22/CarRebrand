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
    return; // No mostrar alertas, simplemente salir de la función
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
    listarVehiculos(); // Actualizar la tabla después de guardar
  } catch (error) {
    console.error("Error al guardar en Firebase:", error);
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















// Función para mostrar el resumen del trámite
function mostrarResumen() {
  // Obtener el total de la sección de Precio
  const total = parseFloat(document.getElementById("total").textContent.replace(" €", ""));

  // Actualizar el total en la sección de Pago
  document.getElementById("pagoTotal").textContent = total.toFixed(2);
  document.getElementById("pagoTotalBoton").textContent = total.toFixed(2);


}

// Función para manejar el envío del formulario de pago
document.getElementById("formPago").addEventListener("submit", function (event) {
  event.preventDefault(); // Evitar el envío del formulario

  // Validar los campos del formulario de pago
  const nombreApellidos = document.getElementById("nombreApellidos").value;
  const telefono = document.getElementById("telefono").value;
  const numeroTarjeta = document.getElementById("numeroTarjeta").value;
  const fechaExpiracion = document.getElementById("fechaExpiracion").value;
  const codigoSeguridad = document.getElementById("codigoSeguridad").value;

  if (!nombreApellidos || !telefono || !numeroTarjeta || !fechaExpiracion || !codigoSeguridad) {
    alert("Por favor, completa todos los campos del formulario de pago.");
    return;
  }

  // Simular el proceso de pago
  const total = parseFloat(document.getElementById("pagoTotal").textContent);
  alert(`Pago realizado con éxito.\nTotal pagado: ${total.toFixed(2)} €`);

  // Limpiar el formulario después del pago
  document.getElementById("formPago").reset();
  document.getElementById("pagoTotal").textContent = "0.00";
  document.getElementById("pagoTotalBoton").textContent = "0.00";
});

// Función para actualizar el total en la sección de pago
function actualizarTotalPago() {
  // Obtener el total de la sección de Precio
  const total = parseFloat(document.getElementById("total").textContent.replace(" €", ""));

  // Actualizar el total en la sección de Pago
  document.getElementById("pagoTotal").textContent = total.toFixed(2);
  document.getElementById("pagoTotalBoton").textContent = total.toFixed(2);
}

// Llamar a actualizarTotalPago cuando se calcule el precio
document.getElementById("calcularPrecioBtn").addEventListener("click", function () {
  calcularPrecioYGuardar();
  actualizarTotalPago(); // Actualizar el total en la sección de pago
});

// Asociar el botón "Ver resumen del trámite" a la función mostrarResumen
document.getElementById("verResumenBtn").addEventListener("click", mostrarResumen);

// Función para calcular el precio y guardar en Firebase
async function calcularPrecioYGuardar() {
  console.log("Función calcularPrecioYGuardar llamada"); // Depuración

  // Primero calcula los precios
  calcularPrecioSinGuardar();

  // Obtener los valores del formulario
  const fechaMatriculacion = document.getElementById("fechaMatriculacion")?.value;
  const comunidadAutonoma = document.getElementById("comunidadAutonomaComprador")?.value;
  const precioContrato = parseFloat(document.getElementById("precioContrato")?.value);
  const combustible = document.getElementById("combustible")?.value;
  const correo = document.getElementById("correo")?.value;
  const marca = document.getElementById("marca")?.value;
  const modelo = document.getElementById("modelo")?.value;

  // Obtener los valores calculados
  const valorFiscal = parseFloat(document.getElementById("valorFiscal").textContent.replace(" €", ""));
  const impuesto = parseFloat(document.getElementById("impuesto").textContent.replace(" €", ""));
  const total = parseFloat(document.getElementById("total").textContent.replace(" €", ""));

  // Guardar los datos en Firebase
  const nuevoRegistro = {
    FechaMatriculacion: fechaMatriculacion,
    ComunidadAutonoma: comunidadAutonoma,
    Combustible: combustible,
    Correo: correo,
    Marca: marca,
    Modelo: modelo,
    PrecioContrato: precioContrato,
    ValorFiscal: valorFiscal,
    ITP: impuesto,
    Total: total,
    FechaRegistro: new Date().toISOString()
  };

  try {
    // Guardar el registro en Firebase
    await addDoc(vehiculosCollection, nuevoRegistro);
    console.log("Datos guardados correctamente en Firebase.");
    listarVehiculos(); // Actualizar la tabla después de guardar
  } catch (error) {
    console.error("Error al guardar en Firebase:", error.message || error);
    alert("Hubo un error al guardar los datos. Detalles: " + (error.message || error));
  }

  showTab('precio');
}

// Función para calcular el precio sin guardar en Firebase
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
























document.addEventListener("DOMContentLoaded", () => {
  // Función para generar la vista previa del documento
  function generarVistaPrevia() {
    const documentoPreview = document.getElementById("documentoPreview");
    if (!documentoPreview) return;
    // Obtener los datos del formulario
    const fechaMatriculacion = document.getElementById("fechaMatriculacion")?.value || "No especificado";
    const marca = document.getElementById("marca")?.value || "No especificado";
    const modelo = document.getElementById("modelo")?.value || "No especificado";
    const comunidadAutonoma = document.getElementById("comunidadAutonomaComprador")?.value || "No especificado";
    const combustible = document.getElementById("combustible")?.value || "No especificado";
    const correo = document.getElementById("correo")?.value || "No especificado";
    const precioContrato = document.getElementById("precioContrato")?.value || "No especificado";
    // Obtener los valores de la sección de pago
    const nombreApellidos = document.getElementById("nombreApellidos")?.value.trim() || "No especificado";
    const telefono = document.getElementById("telefono")?.value.trim() || "No especificado";
   
    const tasasDGT = document.getElementById("tasasDGT")?.textContent || "0 €";
    const gestion = document.getElementById("gestion")?.textContent || "0 €";
    const iva = document.getElementById("iva")?.textContent || "0 €";
    const impuesto = document.getElementById("impuesto")?.textContent || "0 €";
    const total = document.getElementById("total")?.textContent || "0 €";
    // Crear el contenido del documento
    const contenido = `
      <h3>Documento de Trámite</h3>
      <p><strong>Fecha de Matriculación:</strong> ${fechaMatriculacion}</p>
      <p><strong>Marca:</strong> ${marca}</p>
      <p><strong>Modelo:</strong> ${modelo}</p>
      <p><strong>Comunidad Autónoma del Comprador:</strong> ${comunidadAutonoma}</p>
      <p><strong>Combustible:</strong> ${combustible}</p>

      <p><strong>Precio de Compraventa:</strong> ${precioContrato} €</p>
      <hr>
      <h4>Datos de Usuario</h4>
      <p><strong>Nombre y Apellidos:</strong> ${nombreApellidos}</p>
      <p><strong>Teléfono:</strong> ${telefono}</p>
       <p><strong>Correo:</strong> ${correo}</p>

      <hr>
      <h4>Detalles del Cálculo</h4>
      <p><strong>Tasas DGT:</strong> ${tasasDGT}</p>
      <p><strong>Gestión:</strong> ${gestion}</p>
      <p><strong>IVA:</strong> ${iva}</p>
      <p><strong>Impuesto de Transmisiones:</strong> ${impuesto}</p>
      <p><strong>Total:</strong> ${total}</p>
      <hr>
      <p><strong>Envío a domicilio:</strong> Gratuito</p>
    `;
    // Mostrar el contenido en el modal
    documentoPreview.innerHTML = contenido;
    document.getElementById("modalDocumento").style.display = "block";
  }

  // Función para cerrar el modal de vista previa
  function cerrarModalDocumento() {
    const modal = document.getElementById("modalDocumento");
    if (modal) {
      modal.style.display = "none";
    }
  }

  // Función para cerrar el modal al hacer clic fuera o presionar "Esc"
  function cerrarModalFuera(event) {
    const modal = document.getElementById("modalDocumento");
    if (event.target === modal) {
      modal.style.display = "none";
    }
  }

  function cerrarModalConEsc(event) {
    if (event.key === "Escape") {
      cerrarModalDocumento();
    }
  }

  // Función para descargar el documento en PDF con mejor formato
  function descargarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Agregar el logo en la parte superior
    const logoImg = new Image();
    logoImg.src = "logo.png"; // Ruta relativa o absoluta del logo

    // Esperar a que la imagen cargue antes de agregarla al PDF
    logoImg.onload = () => {
      // Agregar el logo en la posición deseada
      doc.addImage(logoImg, "PNG", 10, 10, 50, 20); // x, y, ancho, alto

      // Agregar título
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Documento de Trámite", 10, 40); // Ajustar la posición después del logo

      // Obtener el contenido del documento sin etiquetas HTML
      const documentoTexto = document.getElementById("documentoPreview").innerText.trim();

      // Definir ancho de texto y margen
      const marginLeft = 10;
      const marginTop = 50; // Ajustar margen superior después del logo
      const maxWidth = 180; // Evita que el texto se corte
      const lineHeight = 7;

      // Agregar contenido con ajuste automático
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      const lines = doc.splitTextToSize(documentoTexto, maxWidth);
      doc.text(lines, marginLeft, marginTop + lineHeight);

      // Guardar como archivo PDF
      doc.save("documento_tramite.pdf");
    };

    // Manejar errores si la imagen no se carga correctamente
    logoImg.onerror = () => {
      console.error("Error al cargar el logo.");
    };
  }

  // Asociar eventos a botones
  document.getElementById("verResumenBtn")?.addEventListener("click", generarVistaPrevia);
  document.getElementById("cerrarModalDocumentoBtn")?.addEventListener("click", cerrarModalDocumento);
  document.getElementById("descargarPDFBtn")?.addEventListener("click", descargarPDF);
  document.getElementById("modalDocumento")?.addEventListener("click", cerrarModalFuera);
  document.addEventListener("keydown", cerrarModalConEsc);
});









