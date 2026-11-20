/* Lee textos, unidades, secciones y archivos desde Supabase y los muestra en index.html */
(function(){
  const C = window.PORTAFOLIO;
  if(!C || !window.supabase) return;
  const sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_KEY);
  const CAMPOS = ["curso-portada","institucion","estudiante","biografia-texto","mision-texto","vision-texto","descripcion-curso","competencia","metodologia"];

  function el(tag, cls, txt){
    const e = document.createElement(tag);
    if(cls) e.className = cls;
    if(txt !== undefined) e.textContent = txt;
    return e;
  }

  function enlaceArchivo(f){
    const enlace = el("a", "", "📎 " + f.nombre);
    enlace.href = sb.storage.from("portafolio").getPublicUrl(f.ruta).data.publicUrl;
    enlace.target = "_blank";
    enlace.rel = "noopener";
    return enlace;
  }

  async function mostrarContenido(){
    const {data, error} = await sb.from("portafolio_contenido").select("campo,valor");
    if(error || !data) return;
    data.forEach(f => {
      const nodo = CAMPOS.includes(f.campo) && document.getElementById(f.campo);
      if(nodo && f.valor) nodo.textContent = f.valor;
    });
  }

  async function mostrarUnidades(){
    const contenedor = document.getElementById("lista-unidades");
    if(!contenedor) return;
    const [u, s, a] = await Promise.all([
      sb.from("portafolio_unidades").select("*").order("orden"),
      sb.from("portafolio_secciones").select("*").order("orden"),
      sb.from("portafolio_archivos").select("*")
    ]);
    if(u.error || s.error || a.error){
      contenedor.textContent = "No se pudieron cargar las unidades por ahora.";
      return;
    }
    contenedor.replaceChildren();
    if(!u.data.length){
      contenedor.appendChild(el("p", "", "Todavía no hay unidades registradas."));
      return;
    }
    u.data.forEach((unidad, i) => {
      const tarjeta = el("article", "unit");
      tarjeta.style.setProperty("--i", i);
      tarjeta.appendChild(el("h3", "", "Unidad " + (i + 1) + ": " + unidad.nombre));
      if(unidad.descripcion) tarjeta.appendChild(el("p", "", unidad.descripcion));

      s.data.filter(x => x.unidad_id === unidad.id).forEach(sec => {
        const cab = el("div", "ses");
        cab.style.marginBottom = "10px";
        cab.appendChild(el("span", "", sec.titulo || "Sección"));
        tarjeta.appendChild(cab);

        const archivos = a.data.filter(f => f.seccion_id === sec.id);
        if(archivos.length){
          const caja = el("div", "arch");
          caja.style.marginTop = "0";
          caja.style.marginBottom = "18px";
          archivos.forEach(f => caja.appendChild(enlaceArchivo(f)));
          tarjeta.appendChild(caja);
        }
      });

      // Archivos antiguos que no pertenecen a ninguna sección
      const sueltos = a.data.filter(f => f.unidad_id === unidad.id && !f.seccion_id);
      if(sueltos.length){
        const caja = el("div", "arch");
        sueltos.forEach(f => caja.appendChild(enlaceArchivo(f)));
        tarjeta.appendChild(caja);
      }
      contenedor.appendChild(tarjeta);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    mostrarContenido().catch(console.error);
    mostrarUnidades().catch(console.error);
  });
})();