// Importar dependencias necesarias
import { db } from "./firebase.js"; // Configuración de Firebase
import { collection, addDoc, updateDoc, doc, getDocs, query, where } from "firebase/firestore";

// Referencia a la colección de pagos
const pagosCollection = collection(db, "Pagos");

/**
 * Iniciar un nuevo pago.
 * @param {string} transaccionId - ID de la transacción asociada al pago.
 * @param {number} monto - Monto total del pago.
 * @param {string} metodoPago - Método de pago (ejemplo: "tarjeta de crédito", "transferencia").
 * @param {string} usuarioId - ID del usuario que realiza el pago.
 * @returns {Promise<string>} - Retorna el ID del documento creado.
 */
export async function iniciarPago(transaccionId, monto, metodoPago, usuarioId) {
  const nuevoPago = {
    idTransaccion: transaccionId,
    monto: monto,
    estado: "pendiente", // Estado inicial del pago
    metodoPago: metodoPago,
    fecha: new Date().toISOString(),
    usuarioId: usuarioId,
    detalles: "Pago por transferencia vehicular",
  };

  try {
    const docRef = await addDoc(pagosCollection, nuevoPago);
    console.log("Pago iniciado con ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error al iniciar el pago:", error);
    throw error;
  }
}

/**
 * Actualizar el estado de un pago.
 * @param {string} pagoId - ID del documento del pago.
 * @param {string} nuevoEstado - Nuevo estado del pago (ejemplo: "completado", "fallido").
 * @returns {Promise<void>}
 */
export async function actualizarEstadoPago(pagoId, nuevoEstado) {
  try {
    const pagoRef = doc(db, "Pagos", pagoId);
    await updateDoc(pagoRef, { estado: nuevoEstado });
    console.log("Estado de pago actualizado a:", nuevoEstado);
  } catch (error) {
    console.error("Error al actualizar el estado del pago:", error);
    throw error;
  }
}

/**
 * Listar pagos por usuario.
 * @param {string} usuarioId - ID del usuario.
 * @returns {Promise<Array>} - Retorna un arreglo con los pagos del usuario.
 */
export async function listarPagosPorUsuario(usuarioId) {
  try {
    const q = query(pagosCollection, where("usuarioId", "==", usuarioId));
    const querySnapshot = await getDocs(q);
    const pagos = [];
    querySnapshot.forEach((doc) => {
      pagos.push({ id: doc.id, ...doc.data() });
    });
    return pagos;
  } catch (error) {
    console.error("Error al listar los pagos:", error);
    throw error;
  }
}
