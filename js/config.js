/*
 * CONFIGURACIÓN DE LA DEMO
 * ------------------------
 * Para adaptar la web a un cliente real, cambia estos valores.
 *
 * webhookLeads: URL de un webhook (n8n, Make, Zapier...) que recibirá cada lead
 *               en JSON por POST. Si está vacío, los leads se guardan en el
 *               navegador (localStorage) y se muestran en la consola.
 *
 * webhookChat:  URL de un webhook que recibe {message, history, sessionId} y
 *               devuelve {reply: "texto"}. Ahí conectas tu agente de IA
 *               (OpenAI, Claude, etc.). Si está vacío, el chatbot usa
 *               respuestas locales de demostración.
 *
 * ⚠️ NUNCA pongas aquí una clave de API: este archivo es público.
 *    La clave debe vivir en tu automatización (n8n/Make), no en la web.
 */
window.APP_CONFIG = {
  empresa: "Lumen Inmobiliaria",
  ciudad: "Madrid",
  telefono: "+34 600 000 000",
  email: "hola@lumen-demo.es",
  whatsapp: "34600000000",
  webhookLeads: "",
  webhookChat: "",
};
