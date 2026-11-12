# Lumen Inmobiliaria · Web de demostración

Web inmobiliaria de muestra para enseñar a clientes potenciales qué automatizaciones con IA se les pueden instalar. La empresa y las propiedades son ficticias.

## Qué incluye

- **Listado de propiedades** con filtros por operación, zona, habitaciones y precio, ficha de detalle y botón de WhatsApp.
- **Calculadora de rentabilidad**: rentabilidad bruta y neta, cuota de la hipoteca, flujo de caja y retorno sobre el capital propio.
- **Captación de leads**: formulario de valoración de vivienda y formulario de contacto.
- **Chatbot**: busca viviendas, recomienda inversiones y capta nombre y teléfono. Se abre solo a los 20 segundos.

Está hecha en HTML, CSS y JavaScript, sin dependencias ni compilación.

## Cómo verla

Abre `index.html` en el navegador o publícala gratis con GitHub Pages: *Settings → Pages → Deploy from branch → main / root*.

## Cómo adaptarla a un cliente real

1. **`js/config.js`**: nombre de la empresa, ciudad, teléfono, email y WhatsApp.
2. **`js/data.js`**: las propiedades del cliente.
3. **Leads → automatización**: pon en `webhookLeads` la URL de un webhook de n8n, Make o Zapier. Cada lead llega en JSON (nombre, teléfono, tipo, origen, fecha y conversación del chat). Desde ahí puedes enviarlo al CRM, a Google Sheets, por email o por WhatsApp.
4. **Chatbot con IA real**: pon en `webhookChat` la URL de un flujo que reciba `{message, history, sessionId}`, llame al modelo de IA y devuelva `{"reply": "..."}`. Si está vacío, el chatbot usa respuestas locales de demostración.

> ⚠️ Nunca pongas claves de API en estos archivos, porque son públicos. Las claves van dentro de n8n o Make.

## Estructura

```
index.html        Página
css/styles.css    Estilos (los colores de marca están en :root)
js/config.js      Datos de la empresa y webhooks
js/data.js        Propiedades
js/app.js         Listado, calculadora y envío de leads
js/chatbot.js     Asistente
```
