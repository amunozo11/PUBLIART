/**
 * WhatsApp Service — PUBLIART
 * Genera links wa.me con mensajes pre-escritos para notificar a los clientes.
 * No requiere API oficial de Meta; simplemente abre WhatsApp en el dispositivo.
 */

export interface WhatsAppPayload {
  numero: string;
  mensaje: string;
  link: string;
}

/**
 * Limpia el número de teléfono para formato wa.me:
 * elimina espacios, guiones, paréntesis y agrega prefijo de país si es necesario.
 */
export const limpiarNumero = (telefono: string): string => {
  let num = telefono.replace(/[\s\-().+]/g, '');
  // Si el número no empieza con código de país (asumimos Colombia +57)
  if (num.startsWith('0')) num = num.slice(1);
  if (num.length === 10 && !num.startsWith('57')) {
    num = `57${num}`;
  }
  return num;
};

/**
 * Genera link wa.me para avisar que el trabajo está terminado.
 */
export const generarMensajeTerminado = (
  clienteNombre: string,
  archivoNombre: string,
  telefono: string
): WhatsAppPayload => {
  const numero = limpiarNumero(telefono);
  const mensaje =
    `Hola ${clienteNombre}, ¡te tenemos una buena noticia! 🎨\n` +
    `Tu trabajo *"${archivoNombre}"* ya está listo para retirar en Publiart.\n` +
    `Por favor avísanos cuándo puedes pasar. ¡Gracias por tu preferencia! 😊`;

  return {
    numero,
    mensaje,
    link: `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`,
  };
};

/**
 * Genera link wa.me para confirmar entrega.
 */
export const generarMensajeEntregado = (
  clienteNombre: string,
  archivoNombre: string,
  telefono: string
): WhatsAppPayload => {
  const numero = limpiarNumero(telefono);
  const mensaje =
    `Hola ${clienteNombre}, confirmamos que tu pedido *"${archivoNombre}"* fue entregado correctamente. ✅\n` +
    `¡Gracias por confiar en Publiart! Cualquier novedad, escríbenos aquí. 🙌`;

  return {
    numero,
    mensaje,
    link: `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`,
  };
};

/**
 * Genera link wa.me genérico para contactar a un cliente desde su perfil.
 */
export const generarLinkContacto = (
  clienteNombre: string,
  telefono: string
): WhatsAppPayload => {
  const numero = limpiarNumero(telefono);
  const mensaje = `Hola ${clienteNombre}, te contactamos desde Publiart. `;

  return {
    numero,
    mensaje,
    link: `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`,
  };
};
