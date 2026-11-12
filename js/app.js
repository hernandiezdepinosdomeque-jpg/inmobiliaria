(() => {
  const CFG = window.APP_CONFIG;
  const PROPS = window.PROPIEDADES;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const eur = (n, dec = 0) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: dec, minimumFractionDigits: dec }).format(n);
  const pct = (n) => `${(n * 100).toFixed(2).replace(".", ",")} %`;
  const precioTxt = (p) => (p.operacion === "Alquiler" ? `${eur(p.precio)}/mes` : eur(p.precio));
  const rentaBruta = (p) => (p.operacion === "Venta" && p.alquilerEstimado ? (p.alquilerEstimado * 12) / p.precio : null);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  /* ---------- Configuración en la página ---------- */
  $$("[data-cfg]").forEach((el) => (el.textContent = CFG[el.dataset.cfg] ?? el.textContent));
  $$("[data-cfg-href]").forEach((el) => {
    const t = el.dataset.cfgHref;
    el.href = t === "tel" ? `tel:${CFG.telefono.replace(/\s/g, "")}` : t === "mailto" ? `mailto:${CFG.email}` : `https://wa.me/${CFG.whatsapp}`;
  });
  $("#year").textContent = new Date().getFullYear();
  document.title = `${CFG.empresa} · Demo`;

  /* ---------- Menú móvil ---------- */
  $("#navToggle").addEventListener("click", () => $("#navLinks").classList.toggle("open"));
  $$("#navLinks a").forEach((a) => a.addEventListener("click", () => $("#navLinks").classList.remove("open")));

  /* ---------- Imagen ilustrada (sin dependencias externas) ---------- */
  function ilustracion(p) {
    const h = p.tono;
    const cielo = `hsl(${h} 45% 88%)`, fachada = `hsl(${h} 30% 62%)`, oscuro = `hsl(${h} 30% 32%)`, ventana = `hsl(${h} 60% 94%)`;
    const pisos = p.tipo === "Chalet" ? 2 : p.tipo === "Local" ? 1 : p.tipo === "Ático" ? 6 : 5;
    const ancho = p.tipo === "Chalet" ? 200 : 150;
    const x0 = (320 - ancho) / 2, alto = pisos * 26 + 20, y0 = 190 - alto;
    let ventanas = "";
    for (let f = 0; f < pisos; f++)
      for (let c = 0; c < (p.tipo === "Chalet" ? 4 : 3); c++) {
        const cols = p.tipo === "Chalet" ? 4 : 3, w = ancho / cols;
        ventanas += `<rect x="${x0 + c * w + w * 0.25}" y="${y0 + 12 + f * 26}" width="${w * 0.5}" height="14" rx="2" fill="${ventana}"/>`;
      }
    const tejado = p.tipo === "Chalet" ? `<polygon points="${x0 - 10},${y0} ${x0 + ancho / 2},${y0 - 40} ${x0 + ancho + 10},${y0}" fill="${oscuro}"/>` : `<rect x="${x0 - 6}" y="${y0 - 8}" width="${ancho + 12}" height="8" fill="${oscuro}"/>`;
    return `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(p.titulo)}">
      <rect width="320" height="200" fill="${cielo}"/><circle cx="262" cy="46" r="20" fill="hsl(40 90% 75%)"/>
      ${tejado}<rect x="${x0}" y="${y0}" width="${ancho}" height="${alto}" fill="${fachada}"/>${ventanas}
      <rect x="0" y="188" width="320" height="12" fill="${oscuro}"/>
      <circle cx="40" cy="170" r="22" fill="hsl(130 30% 45%)"/><rect x="38" y="176" width="4" height="14" fill="${oscuro}"/></svg>`;
  }

  /* ---------- Listado y filtros ---------- */
  const zonas = [...new Set(PROPS.map((p) => p.zona))].sort();
  ["#heroZona", "#filtroZona"].forEach((s) => zonas.forEach((z) => $(s).add(new Option(z, z))));

  const filtrosForm = $("#filters");
  const grid = $("#grid");

  function tarjeta(p) {
    const rb = rentaBruta(p);
    return `<article class="prop">
      <div class="prop__img">${ilustracion(p)}<span class="badge">${p.operacion} · ${p.tipo}</span>${p.destacado ? '<span class="badge badge--hot">Oportunidad</span>' : ""}</div>
      <div class="prop__body">
        <div class="prop__price">${precioTxt(p)}</div>
        <h3 class="prop__title">${esc(p.titulo)}</h3>
        <p class="prop__zone">📍 ${esc(p.zona)}, ${esc(CFG.ciudad)}</p>
        <div class="prop__meta">${p.habitaciones ? `<span>🛏 ${p.habitaciones} hab.</span>` : ""}<span>🛁 ${p.banos}</span><span>📐 ${p.m2} m²</span></div>
        ${rb ? `<div class="prop__yield">Rentabilidad bruta estimada: <strong>${pct(rb)}</strong></div>` : ""}
        <div class="prop__actions">
          <button class="btn btn--small" data-ver="${p.id}">Ver detalles</button>
          ${p.operacion === "Venta" ? `<button class="btn btn--small btn--ghost" data-calc="${p.id}">Calcular</button>` : ""}
        </div>
      </div></article>`;
  }

  function filtrar(f) {
    return PROPS.filter((p) =>
      (!f.operacion || p.operacion === f.operacion) &&
      (!f.zona || p.zona === f.zona) &&
      p.habitaciones >= Number(f.habitaciones || 0) &&
      (!f.precioMax || p.precio <= Number(f.precioMax)));
  }

  function render() {
    const f = Object.fromEntries(new FormData(filtrosForm));
    const lista = filtrar(f);
    grid.innerHTML = lista.length ? lista.map(tarjeta).join("") : `<div class="empty">No hay propiedades con esos filtros. <br>Pregunta al asistente: te avisamos cuando entre una.</div>`;
    $("#resultsCount").textContent = `${lista.length} ${lista.length === 1 ? "propiedad" : "propiedades"}`;
  }
  filtrosForm.addEventListener("input", render);
  render();

  $("#heroSearch").addEventListener("submit", (e) => {
    e.preventDefault();
    const datos = new FormData(e.target);
    for (const [k, v] of datos) filtrosForm.elements[k].value = v;
    render();
    $("#propiedades").scrollIntoView();
  });

  /* ---------- Modal de detalle ---------- */
  const modal = $("#modal");
  function abrirDetalle(id) {
    const p = PROPS.find((x) => x.id === id);
    const rb = rentaBruta(p);
    modal.innerHTML = `<button class="modal__close" aria-label="Cerrar">✕</button>
      <div class="prop__img">${ilustracion(p)}</div>
      <div class="modal__body">
        <div class="prop__price">${precioTxt(p)}</div>
        <h3>${esc(p.titulo)}</h3>
        <p class="prop__zone">📍 ${esc(p.zona)}, ${esc(CFG.ciudad)} · ${p.m2} m² · ${p.habitaciones} hab. · ${p.banos} baños</p>
        <p>${esc(p.descripcion)}</p>
        ${rb ? `<div class="prop__yield">Alquiler estimado ${eur(p.alquilerEstimado)}/mes · Rentabilidad bruta ${pct(rb)}</div>` : ""}
        <div class="prop__actions">
          <button class="btn" data-visita="${p.id}">Solicitar visita</button>
          <a class="btn btn--ghost" target="_blank" rel="noopener" href="https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(`Hola, me interesa: ${p.titulo} (ref. ${p.id})`)}">WhatsApp</a>
        </div>
      </div>`;
    modal.showModal();
  }
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest(".modal__close")) modal.close();
    const v = e.target.closest("[data-visita]");
    if (v) {
      const p = PROPS.find((x) => x.id === Number(v.dataset.visita));
      modal.close();
      $("#contactMsg").value = `Quiero visitar «${p.titulo}» (ref. ${p.id}).`;
      $("#contacto").scrollIntoView();
      $("#contactForm").elements.nombre.focus({ preventScroll: true });
    }
  });

  grid.addEventListener("click", (e) => {
    const ver = e.target.closest("[data-ver]");
    const calc = e.target.closest("[data-calc]");
    if (ver) abrirDetalle(Number(ver.dataset.ver));
    if (calc) cargarEnCalculadora(Number(calc.dataset.calc));
  });

  /* ---------- Calculadora de rentabilidad ---------- */
  const calcForm = $("#calcForm");
  function cuotaHipoteca(capital, interesAnual, anos) {
    if (capital <= 0) return 0;
    const r = interesAnual / 100 / 12, n = anos * 12;
    return r === 0 ? capital / n : (capital * r) / (1 - Math.pow(1 + r, -n));
  }

  function calcular() {
    const v = Object.fromEntries([...new FormData(calcForm)].map(([k, x]) => [k, Number(x) || 0]));
    const gastosCompra = v.precio * (v.gastosCompra / 100);
    const inversionTotal = v.precio + gastosCompra + v.reforma;
    const prestamo = v.precio * (v.financiacion / 100);
    const capitalPropio = inversionTotal - prestamo;
    const cuota = cuotaHipoteca(prestamo, v.interes, v.plazo);
    const ingresos = v.alquiler * 12 * (1 - v.vacio / 100);
    const bruta = v.precio ? (v.alquiler * 12) / v.precio : 0;
    const neta = inversionTotal ? (ingresos - v.gastosAnuales) / inversionTotal : 0;
    const cashflowAnual = ingresos - v.gastosAnuales - cuota * 12;
    const roe = capitalPropio > 0 ? cashflowAnual / capitalPropio : 0;
    const bueno = neta >= 0.05 && cashflowAnual > 0;

    $("#calcResults").innerHTML = `
      <div class="kpis">
        <div class="kpi"><span>Rentabilidad bruta</span><strong>${pct(bruta)}</strong></div>
        <div class="kpi ${neta >= 0.05 ? "kpi--good" : ""}"><span>Rentabilidad neta</span><strong>${pct(neta)}</strong></div>
        <div class="kpi ${cashflowAnual >= 0 ? "kpi--good" : "kpi--bad"}"><span>Flujo de caja mensual</span><strong>${eur(cashflowAnual / 12)}</strong></div>
        <div class="kpi ${roe >= 0 ? "kpi--good" : "kpi--bad"}"><span>Retorno sobre capital propio</span><strong>${pct(roe)}</strong></div>
      </div>
      <table class="breakdown">
        <tr><td>Impuestos y gastos de compra</td><td>${eur(gastosCompra)}</td></tr>
        <tr><td>Inversión total</td><td>${eur(inversionTotal)}</td></tr>
        <tr><td>Préstamo hipotecario</td><td>${eur(prestamo)}</td></tr>
        <tr><td>Capital propio necesario</td><td>${eur(capitalPropio)}</td></tr>
        <tr><td>Cuota de hipoteca</td><td>${eur(cuota, 2)}/mes</td></tr>
        <tr><td>Ingresos netos de vacío</td><td>${eur(ingresos)}/año</td></tr>
      </table>
      <div class="verdict ${bueno ? "" : "verdict--warn"}">${bueno
        ? "✅ La operación tiene buena pinta: rentabilidad neta superior al 5 % y flujo de caja positivo."
        : "⚠️ Revisa los números: la rentabilidad neta no llega al 5 % o el flujo de caja es negativo."}</div>
      <button class="btn btn--block" style="margin-top:16px" id="calcLead">Quiero que me asesoréis con esta inversión</button>`;
    return { ...v, bruta, neta, cashflowMensual: cashflowAnual / 12 };
  }
  calcForm.addEventListener("input", calcular);
  calcular();

  function cargarEnCalculadora(id) {
    const p = PROPS.find((x) => x.id === id);
    calcForm.elements.precio.value = p.precio;
    calcForm.elements.alquiler.value = p.alquilerEstimado;
    calcForm.elements.reforma.value = /reforma/i.test(p.titulo + p.descripcion) ? 35000 : 3000;
    calcular();
    $("#calculadora").scrollIntoView();
  }

  $("#calcResults").addEventListener("click", (e) => {
    if (e.target.id !== "calcLead") return;
    const r = calcular();
    $("#contactMsg").value = `Me interesa invertir. Precio ${eur(r.precio)}, alquiler ${eur(r.alquiler)}/mes, rentabilidad neta ${pct(r.neta)}.`;
    $("#contacto").scrollIntoView();
  });

  /* ---------- Envío de leads (formularios y chatbot) ---------- */
  async function enviarLead(datos) {
    const lead = { ...datos, empresa: CFG.empresa, origen: datos.origen || "web", pagina: location.href, fecha: new Date().toISOString() };
    delete lead.rgpd;
    if (CFG.webhookLeads) {
      const res = await fetch(CFG.webhookLeads, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lead) });
      if (!res.ok) throw new Error(`Webhook respondió ${res.status}`);
    } else {
      try {
        const guardados = JSON.parse(localStorage.getItem("leads") || "[]");
        guardados.push(lead);
        localStorage.setItem("leads", JSON.stringify(guardados));
      } catch { /* almacenamiento no disponible: no pasa nada en la demo */ }
      console.info("[DEMO] Lead capturado (configura webhookLeads en js/config.js para enviarlo a tu CRM):", lead);
    }
    return lead;
  }
  window.enviarLead = enviarLead;

  $$("#leadForm, #contactForm").forEach((form) =>
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = $(".form-msg", form), btn = $("button[type=submit]", form);
      btn.disabled = true;
      msg.className = "form-msg";
      msg.textContent = "Enviando…";
      try {
        await enviarLead({ ...Object.fromEntries(new FormData(form)), tipo: form.dataset.tipo, origen: "formulario" });
        msg.className = "form-msg ok";
        msg.textContent = `¡Gracias! Te contactaremos muy pronto. ${CFG.webhookLeads ? "" : "(Demo: lead guardado en este navegador.)"}`;
        form.reset();
      } catch (err) {
        msg.className = "form-msg err";
        msg.textContent = "No se pudo enviar. Inténtalo de nuevo o escríbenos por WhatsApp.";
        console.error(err);
      } finally {
        btn.disabled = false;
      }
    })
  );

  window.APP_UTILS = { eur, pct, precioTxt, rentaBruta, filtrar, abrirDetalle, cargarEnCalculadora };
})();
