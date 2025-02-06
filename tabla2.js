import { db } from "./firebase.js"; 
import { collection, getDocs, addDoc } from "firebase/firestore";

// Función para ordenar las tablas por flecha
function ordenarTabla(columnaIndex, tipo) {
  const tbody = document.getElementById("tablaVehiculos").querySelector("tbody");
  const filas = Array.from(tbody.rows);
  
  filas.sort((filaA, filaB) => {
    const celdaA = filaA.cells[columnaIndex].innerText;
    const celdaB = filaB.cells[columnaIndex].innerText;
    
    if (tipo === "ascendente") {
      return celdaA > celdaB ? 1 : -1;
    } else {
      return celdaA < celdaB ? 1 : -1;
    }
  });
  
  tbody.innerHTML = "";
  filas.forEach(fila => tbody.appendChild(fila));
}

// Función para listar vehículos
export async function listarVehiculos() {
  const tbody = document.getElementById("tablaVehiculos").querySelector("tbody");
  tbody.innerHTML = ""; // Limpia la tabla antes de rellenarla

  try {
    const querySnapshot = await getDocs(collection(db, "Vehículo"));
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
export async function agregarVehiculo(event) {
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
    await addDoc(collection(db, "Vehículo"), nuevoVehiculo);
    alert("Vehículo agregado correctamente");
    listarVehiculos();
  } catch (error) {
    console.error("Error al agregar el vehículo:", error);
  }
}

// Función para inicializar autocompletado
function initAutocomplete() {
  const comunidadesAutonomas = [
    "Andalucía", "Aragón", "Asturias", "Islas Baleares", "Canarias", "Cantabria", 
    "Castilla-La Mancha", "Castilla y León", "Cataluña", "Comunidad Valenciana", 
    "Extremadura", "Galicia", "La Rioja", "Madrid", "Murcia", "Navarra", "País Vasco", 
    "Ceuta", "Melilla"
  ];

  const combustibles = ["Gasolina", "Diésel", "Eléctrico", "Híbrido", "GLP"];

  const datosVehiculos = {
    "Toyota": ["Corolla", "Hilux", "Yaris"],
    "Volgen": ["Golf", "Polo", "Passat"],
    "Adris": [
      "A110 1.8 S (Aut.7v)",
      "A110 1.8 (Aut.7v) Légende",
      "A110 1.8 (Aut.7v) Pure",
      "A110 1.8 Tce Premium Edition Aut. 7V 252",
      "A110 2P Coupe 185kW (2022-)",
      "A110 GT 2P Coupe 221kW (2022-)",
      "A110 R 2P Coupe 221kW (2023-)",
      "A110 S 2P Coupe 221kW (2022-)",
      "A110 San Remo 73 2P Coupe 221kW (2023-)"
    ]
  };

  const marcas = Object.keys(datosVehiculos);

  // Eliminamos el uso de $(document).ready() y ejecutamos las inicializaciones directamente
  // Autocompletado de comunidades autónomas
  $("#comunidadAutonomaComprador").autocomplete({
    source: comunidadesAutonomas,
    minLength: 0
  }).on('focus', function() {
    $(this).autocomplete("search", "");
  });

  // Autocompletado de combustibles
  $("#combustible").autocomplete({
    source: combustibles,
    minLength: 0
  }).on('focus', function() {
    $(this).autocomplete("search", "");
  });

  // Autocompletado de marcas
  $("#marca").autocomplete({
    source: marcas,
    select: function (event, ui) {
      $(this).val(ui.item.value);
      actualizarModelos(ui.item.value); // Llamamos a la función para actualizar modelos
      return false;
    },
    minLength: 0
  }).on('focus', function() {
    $(this).autocomplete("search", "");
  });

  // Función para actualizar modelos en base a la marca seleccionada
  function actualizarModelos(marcaSeleccionada) {
    let modelosDisponibles = datosVehiculos[marcaSeleccionada] || [];
    
    $("#modelo").val(""); // Limpiar el campo de modelo
    $("#modelo").autocomplete({
      source: modelosDisponibles,
      minLength: 0
    }).on('focus', function() {
      $(this).autocomplete("search", "");
    });
  }
}

// Inicializar el formulario y autocompletado
export function initFormulario() {
  initAutocomplete(); // Inicializamos los autocompletados
  const formulario = document.getElementById("formularioVehiculo");

  formulario.addEventListener("submit", agregarVehiculo); // Agregar vehículo al enviar formulario
}

// Llamamos a las funciones para cargar la tabla y el formulario
listarVehiculos();
initFormulario();
