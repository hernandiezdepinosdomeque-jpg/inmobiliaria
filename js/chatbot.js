/*
 * Chatbot de la demo.
 * - Si APP_CONFIG.webhookChat tiene una URL, cada mensaje se envía ahí y se muestra
 *   la respuesta ({reply}). Ahí conectas el agente de IA real (n8n + OpenAI/Claude...).
 * - Si no, usa respuestas locales: busca propiedades, recomienda inversiones y
 *   capta leads (nombre + teléfono), que se envían con window.enviarLead.
 */
(() => {
  const CFG = window.APP_CONFIG;
  const PROPS = window.PROPIEDADES;
  const U = window.APP_UTILS;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  const fab = $("#chatFab"), chat = $("#chat"), body = $("#chatBody"), form = $("#chatForm"), input = $("#chatInput"), quick = $("#chatQuick");
  const sessionId = Math.random().toString(36).slice(2);
  const historial = [];
  let flujo = null; // captación de lead en curso: { motivo, paso, datos }
  let iniciado = false;

  function anadir(texto, quien, html = false) {
    const div = document.createElement("div");
    div.className = `msg msg--${quien}`;
    html ? (div.innerHTML = texto) : (div.textContent = texto);
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    historial.push({ role: quien === "user" ? "user" : "assistant", content: div.textContent });
    return div;
  }

  function sugerencias(lista) {
    quick.innerHTML = "";
    lista.forEach((t) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = t;
      b.onclick = () => enviar(t);
      quick.appendChild(b);
    });
  }

  const enlaceProp = (p) =>
    `• <a href="#" data-prop="${p.id}">${esc(p.titulo)}</a> — ${esc(p.zona)}, ${U.precioTxt(p)}${U.rentaBruta(p) ? ` (${U.pct(U.rentaBruta(p))} bruta)` : ""}`;

  /* ---------- Respuestas locales ---------- */
  function buscar(t) {
    const f = { operacion: "", zona: "", habitaciones: 0, precioMax: "" };
    if (/alquil|rent(a|ar)\b/.test(t) && !/rentabil/.test(t)) f.operacion = "Alquiler";
    if (/compr|venta/.test(t)) f.operacion = "Venta";
    const zona = [...new Set(PROPS.map((p) => p.zona))].find((z) => t.includes(norm(z)));
    if (zona) f.zona = zona;
    const hab = t.match(/(\d)\s*(hab|dorm)/);
    if (hab) f.habitaciones = Number(hab[1]);
    const precio = t.match(/(\d+[.,]?\d*)\s*(mil|k|€|euros)/);
    if (precio) {
      let n = Number(precio[1].replace(/\./g, "").replace(",", "."));
      if (/mil|k/.test(precio[2])) n *= 1000;
      f.precioMax = n;
    }
    return U.filtrar(f);
  }

  function respuestaLocal(texto) {
    const t = norm(texto);

    if (flujo) return continuarFlujo(texto);

    if (/^(hola|buenas|hey|buenos)/.test(t))
      return { html: `¡Hola! 👋 Soy el asistente de ${esc(CFG.empresa)}. Puedo buscarte viviendas, calcular la rentabilidad de una inversión o pedir una valoración de tu casa. ¿Qué necesitas?`,
        quick: ["Busco piso en alquiler", "Quiero invertir", "Valorar mi vivienda"] };

    if (/valora|vender|tasa|cuanto vale/.test(t)) return iniciarFlujo("valoración de vivienda", "¡Genial! Para preparar la valoración gratuita necesito unos datos. ¿Cómo te llamas?");

    if (/visita|ver el piso|quedar|cita/.test(t)) return iniciarFlujo("solicitud de visita", "¡Perfecto! Organizamos la visita. ¿Cuál es tu nombre?");

    if (/invert|rentab|inversion|inquilino/.test(t)) {
      const top = PROPS.filter((p) => U.rentaBruta(p)).sort((a, b) => U.rentaBruta(b) - U.rentaBruta(a)).slice(0, 3);
      return { html: `Estas son las viviendas con mejor rentabilidad bruta ahora mismo:<br>${top.map(enlaceProp).join("<br>")}<br><br>Puedes ver la rentabilidad neta y la cuota de la hipoteca en la <a href="#calculadora" data-cerrar>calculadora</a>. ¿Quieres que un asesor te llame?`,
        quick: ["Sí, que me llamen", "Busco algo de menos de 200 mil"] };
    }

    if (/llam|contact|asesor|si, que/.test(t)) return iniciarFlujo("llamada de asesor", "¡Claro! ¿Cómo te llamas?");

    if (/horario|abiert|direcci|donde esta|telefono|email/.test(t))
      return { html: `Atendemos de lunes a viernes de 9:00 a 20:00 y los sábados de 10:00 a 14:00. Este asistente responde las 24 horas.<br>📞 ${esc(CFG.telefono)}<br>✉️ ${esc(CFG.email)}` };

    if (/piso|casa|chalet|atico|estudio|local|propiedad|vivienda|busco|alquil|compr|hab|zona|precio|mil|€/.test(t)) {
      const r = buscar(t);
      if (!r.length) return iniciarFlujo("alerta de búsqueda", "Ahora mismo no tengo nada que encaje 😕, pero entran viviendas nuevas cada semana. Si me dejas tu nombre, te aviso en cuanto llegue una. ¿Cómo te llamas?");
      return { html: `He encontrado ${r.length} ${r.length === 1 ? "opción" : "opciones"}:<br>${r.slice(0, 4).map(enlaceProp).join("<br>")}<br><br>¿Quieres visitar alguna?`,
        quick: ["Solicitar visita", "Quiero invertir"] };
    }

    if (/gracias|perfecto|vale|ok\b/.test(t)) return { html: "¡A ti! Si necesitas algo más, aquí estoy. 😊" };

    return { html: "No estoy seguro de haberte entendido. Puedo ayudarte con:<br>• Buscar viviendas (por ejemplo: «piso de 2 habitaciones en Chamberí»)<br>• Inversiones y rentabilidad<br>• Valorar tu vivienda<br>• Pedir una visita o una llamada",
      quick: ["Busco piso en alquiler", "Quiero invertir", "Valorar mi vivienda"] };
  }

  function iniciarFlujo(motivo, pregunta) {
    flujo = { motivo, paso: "nombre", datos: {} };
    return { html: pregunta, quick: [] };
  }

  function continuarFlujo(texto) {
    if (/^(cancelar|salir|no)$/i.test(texto.trim())) {
      flujo = null;
      return { html: "Sin problema, lo dejamos aquí. ¿Te ayudo con otra cosa?" };
    }
    if (flujo.paso === "nombre") {
      flujo.datos.nombre = texto.trim().slice(0, 60);
      flujo.paso = "telefono";
      return { html: `Encantado, ${esc(flujo.datos.nombre)}. ¿A qué teléfono te llamamos o escribimos por WhatsApp?` };
    }
    if (flujo.paso === "telefono") {
      const tel = texto.replace(/[^\d+]/g, "");
      if (tel.length < 9) return { html: "Parece que falta algún número. ¿Puedes escribirlo de nuevo? (por ejemplo: 612 345 678)" };
      flujo.datos.telefono = tel;
      flujo.paso = "detalle";
      return { html: flujo.motivo === "valoración de vivienda" ? "¿Cuál es la dirección o zona de la vivienda y cuántos metros tiene más o menos?" : "¿Quieres añadir algún detalle? (zona, presupuesto, horario para llamarte…)",
        quick: ["Nada más"] };
    }
    if (flujo.paso === "detalle") {
      const datos = { ...flujo.datos, detalle: texto, tipo: flujo.motivo, origen: "chatbot", conversacion: historial.map((m) => `${m.role}: ${m.content}`).join("\n") };
      const nombre = flujo.datos.nombre;
      flujo = null;
      window.enviarLead(datos).catch(console.error);
      return { html: `✅ ¡Listo, ${esc(nombre)}! Un asesor te contactará en menos de 1 hora en horario laboral.${CFG.webhookLeads ? "" : "<br><small>(Demo: en la versión real este lead llegaría a tu CRM, email o WhatsApp al instante.)</small>"}`,
        quick: ["Ver propiedades", "Quiero invertir"] };
    }
  }

  /* ---------- Envío ---------- */
  async function enviar(texto) {
    texto = texto.trim();
    if (!texto) return;
    anadir(texto, "user");
    input.value = "";
    quick.innerHTML = "";
    const escribiendo = anadir("Escribiendo…", "bot");
    escribiendo.classList.add("msg--typing");
    historial.pop();

    let r;
    if (CFG.webhookChat) {
      try {
        const res = await fetch(CFG.webhookChat, { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: texto, history: historial, sessionId, empresa: CFG.empresa }) });
        const json = await res.json();
        r = { text: json.reply || json.output || "…" };
      } catch (e) {
        console.error("Fallo del webhook del chat; uso respuestas locales.", e);
        r = respuestaLocal(texto);
      }
    } else {
      await new Promise((ok) => setTimeout(ok, 500 + Math.random() * 500));
      r = respuestaLocal(texto);
    }
    escribiendo.remove();
    r.text ? anadir(r.text, "bot") : anadir(r.html, "bot", true);
    if (r.quick) sugerencias(r.quick);
  }

  form.addEventListener("submit", (e) => { e.preventDefault(); enviar(input.value); });

  body.addEventListener("click", (e) => {
    const a = e.target.closest("[data-prop]");
    if (a) { e.preventDefault(); U.abrirDetalle(Number(a.dataset.prop)); }
    if (e.target.closest("[data-cerrar]")) chat.hidden = true;
  });

  function abrir() {
    chat.hidden = false;
    $(".chat-fab__dot")?.remove();
    if (!iniciado) {
      iniciado = true;
      const r = respuestaLocal("hola");
      anadir(r.html, "bot", true);
      sugerencias(r.quick);
    }
    input.focus();
  }
  fab.addEventListener("click", () => (chat.hidden ? abrir() : (chat.hidden = true)));
  $("#chatClose").addEventListener("click", () => (chat.hidden = true));
  // Mensaje proactivo a los 20 segundos (técnica clásica de captación)
  setTimeout(() => { if (!iniciado && window.innerWidth > 700) abrir(); }, 20000);
})();
