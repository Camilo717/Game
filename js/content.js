/* =========================================================
   GENERADOR DE CONTENIDO — cambia en cada partida.
   Todo es FICTICIO: no pegues aquí jobs reales ni contenido
   de colas de trabajo o del cliente.
   · Plantillas por política (las 18) con huecos {lugar}, {nombre}...
   · Banco de minijuegos: cada partida sortea 5.
   · Perfil del escáner/bóveda generado con la semilla de la sala.
   ========================================================= */
const Content = (() => {
  /* ---------- Azar con semilla (mulberry32) ---------- */
  const rng = seed => { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const shuffle = (r, a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const hash = s => [...String(s)].reduce((h, c) => (Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0), 2166136261);

  /* ---------- Palabras para rellenar huecos ---------- */
  const W = {
    lugar: ['la Plaza Azul', 'el Puerto Verde', 'la Torre Espiral', 'el barrio Neón', 'la estación Central', 'el mercado Flotante', 'el parque Aurora', 'la calle Luna', 'el centro comercial Nexo', 'el Muelle 7'],
    nombre: ['Juan Pérez', 'Valen Ríos', 'Sofi Mar', 'Kevin Luz', 'Dani Sol', 'Martina Gil', 'Tomás Vera', 'Lucía Paz', 'Andrés Cruz', 'Caro Nieto'],
    grupo: ['valdorianos', 'kremios', 'fieles del Templo Azul', 'isleños del Sur', 'nómadas del Este'],
    grupoAdj: ['valdoriana', 'kremia', 'isleña', 'del Este'],
    url: ['meta-ayuda.xyz', 'seguridad-cuenta.click', 'verifica-ya.top', 'premios-nexo.vip', 'bit.ly/s3gu1d0r3s', 'insta-soporte.help'],
    monto: ['$50', '$80', '$120', '$300', '$500', '$850'],
    n: ['3', '5', '7', '10', '12', '20', '24', '42'],
    num4: ['0177', '4821', '1234', '9090', '5566', '7310'],
    hora: ['6', '7', '8', '5:30', '9'],
    serie: ['Los Dragones de Neón', 'Crimen en la Torre', 'Amor en el Puerto', 'La Nebulosa'],
    comida: ['arepas con queso', 'empanadas', 'sancocho', 'tamales', 'pan de bono', 'ajiaco'],
    mascota: ['Firulais', 'Michi', 'Toby', 'Luna', 'Rocco', 'Canela'],
  };
  const N2 = () => String(10 + Math.floor(Math.random() * 89));
  const fill = (r, s) => s.replace(/\{(\w+)\}/g, (_, k) => (k === 'n2' ? String(10 + Math.floor(r() * 89)) : W[k] ? pick(r, W[k]) : k));

  /* ---------- Plantillas de publicaciones por política ----------
     d: 'delete' | 'noaction'.  Los 'noaction' con política son casos
     que PARECEN infracción pero no lo son (sátira, noticia, contradiscurso). */
  const P = [
    // ===== Plaza Azul =====
    { p: 'hate', d: 'delete', av: ['😡', '🤬'], u: ['patriota_{n2}', 'verdad.pura{n2}'], why: 'Ataca a un grupo por su origen o religión (característica protegida).', t: [
      'Los {grupo} son unas ratas. Hay que sacarlos a todos de {lugar} 🤬',
      'No contraten {grupo}: son flojos y ladrones por naturaleza.',
      'Los {grupo} no son personas, son una plaga. Que se vayan.'] },
    { p: 'hate', d: 'noaction', av: ['🥟', '🙌'], u: ['cronica.local', 'vecina_{n2}'], why: 'Habla de un grupo con respeto o critica el odio (contradiscurso): no hay ataque.', t: [
      'Hoy fui al festival de comida {grupoAdj} en {lugar}. ¡Increíble! 🥟',
      'Hay gente insultando a los {grupo} en los comentarios. Eso NO está bien: reportemos.'] },
    { p: 'violence', d: 'delete', av: ['👊', '🔪'], u: ['el_parcero{n2}', 'barra_brava_{n2}'], why: 'Amenaza creíble: objetivo concreto, lugar y momento.', t: [
      '{nombre}, sé que sales del trabajo a las {hora}. Mañana te espero en {lugar} y te rompo la cara.',
      'Árbitro {nombre}: sabemos dónde vives. El domingo te esperamos a la salida 👊',
      'Al que vuelva a parquear en mi puesto en {lugar} le quemo el carro. Ya saben.'] },
    { p: 'violence', d: 'noaction', av: ['📺', '💀'], u: ['seriefan_{n2}', 'gym.rata'], why: 'Exageración evidente o broma: no hay amenaza real a nadie.', t: [
      'Si alguien me cuenta el final de {serie}, ¡lo mato! 😂😂',
      'Hoy en el gimnasio casi me muero haciendo sentadillas 💀'] },
    { p: 'doi', d: 'delete', av: ['🏴', '🔥'], u: ['hermandad.gris', 'frente_ceniza{n2}'], why: 'Glorifica o recluta para una organización violenta.', t: [
      '¡Únete a la Hermandad Puño Gris! Gloria a los héroes del ataque de {lugar} 🔥',
      'El Frente Ceniza tiene razón. Hay que seguir su ejemplo. Reclutamiento abierto: escribe al privado.'] },
    { p: 'doi', d: 'noaction', av: ['🕊️', '🗞️'], u: ['memoria.nx', 'diario.nexopolis'], why: 'Informa o condena a la organización: eso está permitido.', t: [
      'Hace un año el grupo Puño Gris atacó {lugar}. Recordamos a las víctimas. Nunca más.',
      'Investigación: así recluta en redes el Frente Ceniza. Hilo 🧵 para que nadie caiga.'] },
    { p: 'coord', d: 'delete', av: ['🧤', '🔦'], u: ['golpe_perfecto', 'nocturno_{n2}'], why: 'Organiza o presume un delito.', t: [
      '¿Quién se apunta esta noche a vaciar el supermercado de {lugar}? Ya tengo las herramientas 🔦',
      'Miren cómo le robé el celular a ese señor en el metro jajaja 😂📱 [video]',
      'Vendo tutorial para abrir carros sin llave. Funciona en {lugar}, probado anoche.'] },
    { p: 'coord', d: 'noaction', av: ['🚨'], u: ['alerta.vecinal'], why: 'Advierte sobre un delito para proteger a otros.', t: [
      'Alerta: están robando celulares en el metro de {lugar}. ¡Cuidado con sus cosas!'] },
    // ===== Puerto Verde =====
    { p: 'cyber', d: 'delete', av: ['🛡️', '🔓'], u: ['soporte.meta.oficial', 'seguridad_insta{n2}'], why: 'Phishing o ingeniería social para robar cuentas o datos.', t: [
      'Tu cuenta será bloqueada hoy. Verifica tu contraseña aquí 👉 {url}',
      'Descarga esta app para ver quién visitó tu perfil 👀 {url}',
      'Te enseño a entrar a la cuenta de tu pareja sin que se dé cuenta 🤫 Escríbeme.'] },
    { p: 'cyber', d: 'noaction', av: ['🔐'], u: ['tips.seguridad'], why: 'Consejo de seguridad legítimo.', t: [
      'Consejo: activen la verificación en dos pasos. A mí casi me roban la cuenta la semana pasada.'] },
    { p: 'commercial', d: 'delete', av: ['💸', '📈'], u: ['gana.desde.casa', 'cripto_nexo{n2}'], why: 'Negocio engañoso: pirámide, inversión "garantizada" o venta de reseñas falsas.', t: [
      'Gana {monto} diarios: paga $50 de inscripción y recluta 5 amigos 🤑',
      'Duplica tu dinero en 1 hora con Cripto Nexo. ¡Garantizado! 📈',
      'Vendo 1.000 reseñas de 5 estrellas para tu negocio por $10. Nadie se da cuenta.'] },
    { p: 'commercial', d: 'noaction', av: ['🥐', '🛍️'], u: ['panaderia.aurora', 'tienda.del.muelle'], why: 'Comercio legítimo.', t: [
      'Abrimos nuestra panadería en {lugar} 🥐 ¡Los esperamos el sábado con descuento!'] },
    { p: 'restricted', d: 'delete', av: ['📦', '💊', '🍃'], u: ['armas.ya', 'farmacia.secreta', 'envios.verdes'], why: 'Venta entre particulares de bienes regulados (armas, drogas, medicamentos).', t: [
      'Vendo pistola sin papeles. Entrega en mano en {lugar}, solo efectivo.',
      'Pastillas para adelgazar SIN receta. Envío discreto 📩',
      'Marihuana de la buena 🍃 envío a domicilio en {lugar}. Escribe al privado.'] },
    { p: 'restricted', d: 'noaction', av: ['🩺', '🎯'], u: ['farmaceutica.ana', 'club.tiro.deportivo'], why: 'Información de salud o actividad legal, sin venta entre particulares.', t: [
      'Recuerden: los antibióticos solo con receta médica. ¡Cuídense!',
      'Hoy fui por primera vez al club de tiro deportivo, con instructor y todo 🎯'] },
    { p: 'humanexp', d: 'delete', av: ['✈️', '💼'], u: ['trabajo.exterior', 'modelos.intl{n2}'], why: 'Oferta engañosa para captar víctimas de trata o tráfico de personas.', t: [
      'Trabajo en el extranjero, sin experiencia. Envía foto de tu pasaporte y viajas el lunes ✈️',
      'Busco chicas de 18 a 25 para "modelaje" en otro país. Pasaje pagado, papeles los guardamos nosotros.',
      'Cruzo personas por la frontera sin papeles. {monto} por persona. Escríbeme.'] },
    { p: 'humanexp', d: 'noaction', av: ['⚠️'], u: ['ong.alerta'], why: 'Concientización para prevenir la trata.', t: [
      'Ojo con las ofertas de trabajo que piden tu pasaporte: así captan víctimas de trata. Compartan.'] },
    // ===== Isla Gradiente =====
    { p: 'bullying', d: 'delete', av: ['🎭', '🤮'], u: ['anonimo_{n2}', 'chismes.colegio'], why: 'Ataca y humilla a una persona privada.', t: [
      '@valen{n2} eres tan fea que das asco. Nadie te quiere en el colegio 🤮',
      'Encuesta: ¿quién es el más perdedor del salón? Todos sabemos que es {nombre} 😂',
      'Miren el video de {nombre} cayéndose. Compártanlo para que todo el colegio se burle 😂'] },
    { p: 'bullying', d: 'noaction', av: ['🥔', '🎬'], u: ['humor.nexopolis', 'critico.de.cine'], why: 'Sátira o crítica a una figura pública u obra: está permitida.', t: [
      'El alcalde prometió arreglar las calles hace 3 años. Aquí su retrato oficial 🥔👑 #sátira',
      'La película de anoche fue malísima. Dos horas de mi vida que no vuelven 🙄'] },
    { p: 'graphic', d: 'delete', av: ['🩸', '📹'], u: ['sin.censura{n2}', 'morbo.total'], why: 'Contenido gráfico extremo compartido para burlarse o celebrar el sufrimiento.', t: [
      '[Video] Imágenes sin censura del accidente de {lugar}, se ven los cuerpos. Miren esto jajaja 😂',
      '[Imagen] Así quedó el ladrón después de que lo agarramos. Se lo merecía 🩸😂'] },
    { p: 'graphic', d: 'noaction', av: ['🚑'], u: ['noticias.nx'], why: 'Noticia sin imágenes extremas y sin celebrar la violencia.', t: [
      'Así quedó la avenida en {lugar} tras el choque de hoy (solo daños materiales). Manejen con cuidado.'] },
    { p: 'suicide', d: 'delete', av: ['🖤'], u: ['reto.extremo', 'thin.goals{n2}'], why: 'Promueve autolesiones o trastornos alimentarios.', t: [
      'Reto: no comer nada por 5 días. El que aguante más gana 💀 #thinspo',
      'Escríbanme y les paso un método para hacerse daño sin que nadie lo note.'] },
    { p: 'suicide', d: 'noaction', av: ['💚'], u: ['paso.a.paso', 'salud.mental.nx'], why: 'Comparte una recuperación o busca apoyo: se permite y se acompaña.', t: [
      'Hace un año pasé por una depresión fuerte. Pedir ayuda me salvó. Si lo necesitas, habla con alguien 💚',
      'Hoy hablé con mi psicóloga y me siento mejor. Pedir ayuda está bien.'] },
    { p: 'nudity', d: 'delete', av: ['🔞'], u: ['contenido.xxx{n2}'], why: 'Desnudo o actividad sexual explícita de adultos.', t: [
      '[Imagen] Foto de desnudo explícito de una persona adulta, sin censura.',
      '[Video] Video sexual explícito subido como "humor".'] },
    { p: 'nudity', d: 'noaction', av: ['🤱', '🗿'], u: ['mama.feliz', 'museo.nexopolis'], why: 'Excepción permitida: lactancia, salud o arte.', t: [
      '[Imagen] Mamá amamantando a su bebé en el parque 🤱 #lactancia',
      '[Imagen] Estatua clásica (desnuda) de la nueva sala del museo de {lugar} 🗿'] },
    { p: 'solicitation', d: 'delete', av: ['😘', '💋'], u: ['compania.vip', 'citas.discretas{n2}'], why: 'Ofrece o pide servicios sexuales.', t: [
      'Ofrezco servicios sexuales en {lugar}, tarifas por privado 😘',
      'Pago bien por "compañía íntima" esta noche. Escríbeme al DM 💸'] },
    { p: 'solicitation', d: 'noaction', av: ['🩺'], u: ['salud.joven'], why: 'Educación en salud sexual: está permitida.', t: [
      'Charla gratuita sobre salud sexual y anticonceptivos este jueves en {lugar}.'] },
    // ===== Torre Espiral =====
    { p: 'misinfo', d: 'delete', av: ['🍋', '🗳️', '🍵'], u: ['salud.natural.ya', 'info.electoral{n2}', 'vida.zen'], why: 'Desinformación que puede causar daño físico o afectar una elección.', t: [
      'El agua con limón cura el cáncer en 3 días. ¡Los médicos lo ocultan!',
      'OJO: las elecciones se cambiaron para el lunes. ¡No vayan el domingo!',
      'Deja tu medicamento para la diabetes y toma este té 3 veces al día 🍵'] },
    { p: 'misinfo', d: 'noaction', av: ['🌉'], u: ['opinologo'], why: 'Es una opinión, no una afirmación falsa dañina.', t: [
      'Para mí el nuevo puente de {lugar} quedó feísimo. Un mal gasto, opino yo.'] },
    { p: 'spam', d: 'delete', av: ['🔁', '📨'], u: ['te.sigo.si.me.sigues', 'cadena.de.la.suerte'], why: 'Contenido repetitivo o engañoso para atraer clics o seguidores.', t: [
      '¡¡SÍGUEME Y TE SIGO!! 1.000 seguidores GRATIS 👉 {url} 👉 {url}',
      'COMPARTE EN 10 GRUPOS O TENDRÁS 7 AÑOS DE MALA SUERTE 😱😱',
      'Gana un celular 👉 {url} 👉 {url} 👉 {url}'] },
    { p: 'spam', d: 'noaction', av: ['🎂'], u: ['pasteleria.luna'], why: 'Promoción normal de un negocio, sin engaño ni repetición.', t: [
      'Sorteo: comenta tu sabor favorito y participa por un pastel 🎂 (bases en la bio)'] },
    // ===== Nebulosa Horizon =====
    { p: 'privacy', d: 'delete', av: ['🤡', '🪪'], u: ['chismes.nx', 'justicia_escolar'], why: 'Expone datos privados (teléfono, dirección, documento) sin permiso.', t: [
      'Este es el número de mi ex: 300 555 {num4}. Vive en {lugar}. ¡Escríbanle!',
      '[Imagen] Foto de la cédula de {nombre} con el número a la vista. "Para que la encuentren".'] },
    { p: 'privacy', d: 'noaction', av: ['🏪'], u: ['ferreteria.muelle'], why: 'Comparte sus PROPIOS datos de negocio: está permitido.', t: [
      'Nuestra ferretería queda en {lugar}. Escríbenos al número del negocio en la bio 🔧'] },
    { p: 'adultexp', d: 'delete', av: ['📸', '😈'], u: ['venganza{n2}', 'ex.traicionado'], why: 'Comparte o amenaza con compartir imágenes íntimas sin consentimiento (sextorsión).', t: [
      'Si no me mandas más plata, publico tus fotos íntimas. Tienes hasta mañana.',
      '[Imagen] Comparto fotos íntimas de mi ex sin su permiso, por traicionera.'] },
    { p: 'adultexp', d: 'noaction', av: ['🤝'], u: ['red.de.apoyo'], why: 'Orienta a víctimas: concientización permitida.', t: [
      'Si alguien te amenaza con publicar tus fotos íntimas: no pagues, guarda pruebas y repórtalo. No estás solo/a.'] },
    { p: 'cse', d: 'delete', av: ['🚫'], u: ['perfil_{n2}'], why: 'Pone en riesgo a menores: tolerancia cero. Se elimina y se escala.', t: [
      '[Caso] Perfil adulto que le pide fotos en ropa interior a una niña de 12 años por mensaje.',
      '[Caso] Grupo privado donde ofrecen intercambiar imágenes de menores.'] },
    { p: 'cse', d: 'noaction', av: ['👨‍👩‍👧'], u: ['crianza.digital'], why: 'Guía para proteger a los menores.', t: [
      'Guía para padres: cómo configurar la privacidad de las cuentas de sus hijos 👨‍👩‍👧'] },
    // ===== Sin política: contenido normal =====
    { p: null, d: 'noaction', av: ['⚽', '🫓', '🌅', '📚', '💼', '♻️', '🏘️', '🐕', '🎉', '🎸'], u: ['futbolero{n2}', 'la.abuela.cocina', 'atardeceres', 'lectora.feliz', 'nuevo.empleo', 'reciclaje.nx', 'vecinos.unidos', 'perrito.perdido', 'cumple.de.sofi', 'banda.de.garaje'], why: 'Contenido cotidiano sin ninguna infracción.', t: [
      '¡Qué partidazo! {n}-0 y a la final 🔥🔥', 'Receta de la abuela: {comida}. ¡Quedan perfectas! ❤️', 'Atardecer en {lugar}. Sin filtro 😍',
      '¿Me recomiendan libros de misterio? 🕵️', 'Primer día en el trabajo nuevo. ¡Deséenme suerte!', '¿Dónde reciclo pilas en {lugar}?',
      'Reunión de vecinos el jueves a las {hora} pm para hablar de seguridad del barrio.', 'Se perdió {mascota} cerca de {lugar}. ¡Ayúdennos a encontrarlo! 🐕',
      'Hoy cumplo años y lo celebro con {comida} 🎉', 'Tocamos el sábado en {lugar}. ¡Entrada libre! 🎸'] },
  ];

  const mkPost = (r, g, t) => { const i = g.t.indexOf(t), same = g.u.length === g.t.length; return { u: fill(r, same ? g.u[i] : pick(r, g.u)), av: same && g.av.length === g.t.length ? g.av[i] : pick(r, g.av), t: fill(r, t), d: g.d, policy: g.p, why: g.why }; };
  /* Mazo de publicaciones sin repetir plantilla. focus = políticas del distrito (60 % de peso). */
  function deck(n = 60, { focus = [], rnd = Math.random, ratio = .55 } = {}) {
    const items = [];
    P.forEach(g => g.t.forEach(t => items.push({ g, t, w: (focus.includes(g.p) ? 2.4 : 1) * (g.p ? 1 : .55) })));
    const del = shuffle(rnd, items.filter(x => x.g.d === 'delete')), ok = shuffle(rnd, items.filter(x => x.g.d === 'noaction'));
    const draw = arr => { const tot = arr.reduce((s, x) => s + x.w, 0); let v = rnd() * tot; for (let i = 0; i < arr.length; i++) { v -= arr[i].w; if (v <= 0) return arr.splice(i, 1)[0]; } return arr.pop(); };
    const out = [];
    for (let i = 0; i < n; i++) {
      let src = rnd() < ratio ? del : ok;
      if (!src.length) src = src === del ? ok : del;
      if (!src.length) break;
      const x = draw(src); out.push(mkPost(rnd, x.g, x.t));
    }
    return out;
  }
  /* Par para el Duelo: uno se va (DELETE) y otro se queda (NO ACTION). */
  function duelPairs(n = 30, { focus = [], rnd = Math.random } = {}) {
    const bad = deck(80, { focus, rnd, ratio: 1 }), good = deck(80, { focus, rnd, ratio: 0 });
    return Array.from({ length: Math.min(n, bad.length, good.length) }, (_, i) => [bad[i], good[i]]);
  }

  /* ---------- Mensajes del mar (Caza de Anzuelos) ---------- */
  const SCAMS = [
    { from: 'Soporte Meta 🛡️', text: 'Tu cuenta será eliminada. Verifica aquí 👉 {url}', policy: 'cyber' },
    { from: '+57 300 ••• {num4}', text: 'Hola ma, cambié de número. Necesito {monto} URGENTE 🙏', policy: 'cyber' },
    { from: 'Banco Nexo', text: 'Envíanos el código de 6 dígitos que te llegó 🔢', policy: 'cyber' },
    { from: 'Seguridad Instagran', text: 'Violaste derechos de autor. Apela en 24 h 👉 {url}', policy: 'cyber' },
    { from: 'Paquetería 📦', text: 'Tu paquete está retenido. Paga $2 en {url}', policy: 'cyber' },
    { from: '¿Quién te vio? 👀', text: 'Descarga esta app y mira quién visita tu perfil: {url}', policy: 'cyber' },
    { from: 'Premios VR', text: '¡Ganaste un visor VR! Solo paga el envío 💳', policy: 'commercial' },
    { from: 'Gana Ya 💸', text: 'Gana {monto} al día. Inscripción $50 + 5 amigos', policy: 'commercial' },
    { from: 'Lotería Nexo', text: '¡Ganaste $10.000.000! 🎉 Envía tus datos bancarios', policy: 'commercial' },
    { from: 'Cripto Rápido 🚀', text: 'Duplica tu dinero en 1 hora. ¡Garantizado! 📈', policy: 'commercial' },
    { from: 'Farmacia Secreta', text: 'Pastillas sin receta, envío discreto 💊', policy: 'restricted' },
    { from: 'Armería Express', text: 'Arma sin papeles, entrega hoy en {lugar} 📦', policy: 'restricted' },
    { from: 'Empleo Soñado ✈️', text: 'Trabajo en el exterior: envía foto de tu pasaporte', policy: 'humanexp' },
    { from: 'Agencia Modelos', text: 'Viaja gratis a trabajar de "modelo". Nosotros guardamos tus papeles', policy: 'humanexp' },
    { from: 'Desconocido', text: 'Tengo tus fotos íntimas. Paga {monto} o las publico 😈', policy: 'adultexp' },
    { from: 'Seguidores Gratis', text: '1.000 seguidores GRATIS 👉 {url}', policy: 'spam' },
    { from: 'Cadena ✉️', text: 'Reenvía esto a 20 grupos o tendrás mala suerte 😱', policy: 'spam' },
    { from: 'Salud Total 🍋', text: 'El limón cura el cáncer. ¡Reenvía antes de que lo borren!', policy: 'misinfo' },
    { from: 'Info Electoral', text: 'Las elecciones se pasaron al lunes. ¡No vayas el domingo!', policy: 'misinfo' },
  ];
  const LEGIT = [
    { from: 'Mamá ❤️', text: '¿Vienes a cenar? Hice {comida} 🫓' }, { from: 'Lucía', text: 'Te mando las fotos del paseo a {lugar} 📸' },
    { from: 'Jefa', text: 'La reunión pasó a las {hora} pm 📅' }, { from: 'Abuelo', text: '¡Feliz cumpleaños, mijo! 🎂' },
    { from: 'Grupo Fútbol ⚽', text: '¿Partido el sábado a las {hora}?' }, { from: 'Papá', text: 'Llegué bien a la casa 🏠' },
    { from: 'Carlos', text: 'Jajaja mira este meme 😂' }, { from: 'Vecina Rosa', text: '¿Me prestas una taza de azúcar? 🍬' },
    { from: 'Profe Ana', text: 'Mañana hay examen. ¡Estudien! 📚' }, { from: 'Club de lectura', text: 'Este mes leemos un misterio 🕵️' },
    { from: 'Hermana', text: '¿Me recoges a las {hora}? 🚗' }, { from: 'Tía Marta', text: 'Bendiciones para todos 🌻' },
    { from: 'Veterinaria', text: 'Recuerda la vacuna de {mascota} el viernes 🐶' }, { from: 'Banco Nexo', text: 'Nunca te pediremos tu clave. Tu extracto ya está en la app oficial.' },
  ];
  function sea(rnd = Math.random) {
    const f = m => ({ ...m, from: fill(rnd, m.from), text: fill(rnd, m.text) });
    return { scam: shuffle(rnd, SCAMS).map(f), legit: shuffle(rnd, LEGIT).map(f) };
  }

  /* ---------- Casos del Consejo (se muestran 6 al azar por partida) ---------- */
  const CASES = [
    { id: 'papa', title: 'La papa presidencial', user: 'humor.nexopolis', avatar: '🤡', policies: ['bullying'], image: { emoji: '🥔👑', bg: 'linear-gradient(135deg,#ffd23f,#ff8a3d)', caption: 'RETRATO OFICIAL' },
      caption: 'El alcalde prometió arreglar las calles hace 3 años. Aquí su retrato oficial 🥔👑 #sátira', verdict: 'noaction', explain: 'La sátira y la crítica a figuras públicas se permiten. Sin amenazas ni acoso severo, no hay infracción.' },
    { id: 'captura', title: 'La captura expuesta', user: 'justicia_escolar', avatar: '😈', policies: ['privacy', 'bullying'], image: { emoji: '💬📱', bg: 'linear-gradient(135deg,#334155,#64748b)', caption: 'CHAT PRIVADO · Valen · 📞 300 555 0177' },
      caption: 'Miren lo que dijo esta 🤡. Aquí está su número: escríbanle y díganle lo que pensamos 👇', verdict: 'delete', explain: 'Publica el teléfono de una persona privada y anima a atacarla.' },
    { id: 'protesta', title: 'El video de la protesta', user: 'noticias_ya', avatar: '📰', policies: ['graphic'], image: { emoji: '📹📰', bg: 'linear-gradient(135deg,#7f1d1d,#ef4444)', caption: 'VIDEO · Protesta en el centro' },
      caption: 'Esto pasó hoy en el centro de Nexópolis. Hubo heridos. El mundo tiene que verlo.', verdict: 'noaction', explain: 'Documenta un hecho de interés público sin celebrar la violencia: se queda. (En la plataforma real, además, se cubriría con una pantalla de advertencia.)' },
    { id: 'linchamiento', title: 'El ladrón golpeado', user: 'justicia.ya', avatar: '😂', policies: ['graphic', 'violence'], image: { emoji: '🩸📹', bg: 'linear-gradient(135deg,#450a0a,#991b1b)', caption: 'VIDEO SIN CENSURA' },
      caption: 'Así dejamos al ladrón del barrio. ¡Que aprenda! Compartan jajaja 😂🩸', verdict: 'delete', explain: 'Celebra la violencia y se burla del sufrimiento de una persona: se elimina.' },
    { id: 'te', title: 'El té milagroso', user: 'vida.zen.oficial', avatar: '🍵', policies: ['misinfo'], image: { emoji: '🍵✨', bg: 'linear-gradient(135deg,#065f46,#7ddf64)', caption: '¡CURA EN 7 DÍAS!' },
      caption: 'Este té CURA la diabetes en 7 días 🍵 Deja tu medicamento y tómalo 3 veces al día.', verdict: 'delete', explain: 'Desinformación de salud que puede causar daño físico: animar a dejar un tratamiento.' },
    { id: 'spoiler', title: 'La amenaza del final', user: 'seriefan_99', avatar: '📺', policies: ['violence'], image: { emoji: '🍿😤', bg: 'linear-gradient(135deg,#1e3a8a,#22d3ee)', caption: 'ESTRENO HOY · FINAL DE TEMPORADA' },
      caption: 'Si alguien me cuenta el final de la serie esta noche, ¡LO MATO! 😂😂', verdict: 'noaction', explain: 'Exageración evidente en broma: no hay objetivo real ni intención creíble.' },
    { id: 'arbitro', title: 'El hincha furioso', user: 'barra_brava_nx', avatar: '⚽', policies: ['violence', 'privacy'], image: { emoji: '⚽😡', bg: 'linear-gradient(135deg,#14532d,#ef4444)', caption: 'ÁRBITRO PÉREZ · Calle Sol 18' },
      caption: 'Árbitro Pérez: sabemos dónde vives (Calle Sol 18). El domingo te esperamos a la salida 👊', verdict: 'delete', explain: 'Objetivo, lugar y fecha concretos: es una amenaza creíble. Y expone su dirección.' },
    { id: 'pastillas', title: 'La farmacia del chat', user: 'todo.sin.receta', avatar: '💊', policies: ['restricted'], image: { emoji: '💊📦', bg: 'linear-gradient(135deg,#4c1d95,#a855f7)', caption: 'ENVÍO DISCRETO · SIN RECETA' },
      caption: 'Vendo pastillas para dormir y para adelgazar SIN receta 💊 Escríbeme por mensaje directo.', verdict: 'delete', explain: 'Venta entre particulares de medicamentos: no está permitida.' },
    { id: 'noticia', title: 'La noticia del grupo armado', user: 'diario.nexopolis', avatar: '🗞️', policies: ['doi'], image: { emoji: '🗞️🕊️', bg: 'linear-gradient(135deg,#334155,#0f172a)', caption: 'INFORME ESPECIAL' },
      caption: 'El grupo armado "Puño Gris" se atribuyó el ataque de ayer. Hablamos con las víctimas. Rechazamos toda violencia.', verdict: 'noaction', explain: 'Informar sobre estos grupos o condenarlos está permitido; glorificarlos, no.' },
    { id: 'empleo', title: 'La oferta de trabajo soñada', user: 'empleos.internacionales.ya', avatar: '✈️', policies: ['humanexp', 'commercial'], image: { emoji: '✈️💼', bg: 'linear-gradient(135deg,#0e7490,#ffd23f)', caption: '¡$5.000 AL MES · SIN EXPERIENCIA!' },
      caption: '¡Trabajo en el extranjero! Te pagamos el pasaje: solo envía foto de tu pasaporte. Cupos limitados ⏳', verdict: 'delete', explain: 'Las ofertas engañosas que piden documentos son una forma común de captar víctimas de trata.' },
    { id: 'lactancia', title: 'La foto del parque', user: 'mama.feliz', avatar: '🤱', policies: ['nudity'], image: { emoji: '🤱🌳', bg: 'linear-gradient(135deg,#fde68a,#86efac)', caption: '#LactanciaLibre' },
      caption: 'Primera vez que doy pecho en público y nadie me miró raro 💛 #lactancia', verdict: 'noaction', explain: 'La lactancia es una excepción explícita de la política de desnudos: se permite.' },
    { id: 'sextorsion', title: 'El mensaje amenazante', user: 'desconocido_77', avatar: '😈', policies: ['adultexp'], image: { emoji: '📸🔒', bg: 'linear-gradient(135deg,#1f2937,#7c3aed)', caption: 'PAGA O LO PUBLICO' },
      caption: 'Tengo tus fotos íntimas. Si no me pagas mañana, se las mando a toda tu familia.', verdict: 'delete', explain: 'Amenazar con difundir imágenes íntimas (sextorsión) se elimina siempre. A la víctima se le ofrecen recursos.' },
    { id: 'recuperacion', title: 'El hilo de la recuperación', user: 'paso.a.paso', avatar: '💚', policies: ['suicide'], image: { emoji: '💚🌱', bg: 'linear-gradient(135deg,#14532d,#86efac)', caption: '1 AÑO LIMPIO' },
      caption: 'Hace un año me autolesionaba. Hoy cumplo un año sin hacerlo gracias a terapia. Si estás ahí, pide ayuda 💚', verdict: 'noaction', explain: 'Compartir una experiencia de recuperación sin detalles ni promoción está permitido y ayuda a otros.' },
    { id: 'ayuno', title: 'El reto del ayuno', user: 'thin.goals', avatar: '🖤', policies: ['suicide'], image: { emoji: '🍽️🚫', bg: 'linear-gradient(135deg,#111827,#be185d)', caption: '#RETO5DÍAS' },
      caption: 'Reto: 5 días sin comer nada. Suban sus fotos de la báscula. El que más baje gana 💀', verdict: 'delete', explain: 'Promueve un trastorno alimentario: se elimina.' },
    { id: 'compania', title: 'La "compañía" de la noche', user: 'citas.vip', avatar: '😘', policies: ['solicitation'], image: { emoji: '🌙💋', bg: 'linear-gradient(135deg,#4c0519,#e11d48)', caption: 'TARIFAS POR PRIVADO' },
      caption: 'Ofrezco compañía íntima para esta noche en el centro. Tarifas por DM 😘', verdict: 'delete', explain: 'Ofrecer servicios sexuales no está permitido.' },
    { id: 'contradiscurso', title: 'La captura del insulto', user: 'cronica.vecinal', avatar: '✊', policies: ['hate'], image: { emoji: '🗯️✊', bg: 'linear-gradient(135deg,#1e3a8a,#facc15)', caption: '"Los kremios son una plaga"' },
      caption: 'Esto me escribieron hoy por ser kremia. No vamos a callarnos. #NoAlOdio', verdict: 'noaction', explain: 'Cita un insulto para denunciarlo (contradiscurso): no ataca a nadie, se permite.' },
    { id: 'meme', title: 'El meme del vecino', user: 'risas.nx', avatar: '🐀', policies: ['hate'], image: { emoji: '🐀😂', bg: 'linear-gradient(135deg,#365314,#a3e635)', caption: 'LOS VALDORIANOS SEGÚN YO' },
      caption: 'Los valdorianos son como ratas: llegan, se reproducen y lo dañan todo 😂', verdict: 'delete', explain: 'Comparar a un grupo protegido con plagas es deshumanizante, aunque se presente como "humor".' },
    { id: 'appespia', title: 'La app espía', user: 'tips.hacker', avatar: '🕵️', policies: ['cyber'], image: { emoji: '📲👁️', bg: 'linear-gradient(135deg,#0f172a,#22d3ee)', caption: 'MIRA SUS MENSAJES' },
      caption: 'Con esta app ves los mensajes de tu pareja sin que lo sepa. Link en la bio 🤫', verdict: 'delete', explain: 'Promueve el acceso no autorizado a cuentas ajenas.' },
    { id: 'cadena', title: 'La cadena de la suerte', user: 'tia.marta', avatar: '🌻', policies: ['spam'], image: { emoji: '📨😱', bg: 'linear-gradient(135deg,#7c2d12,#fb923c)', caption: 'COMPARTE EN 10 GRUPOS' },
      caption: 'Si no compartes esto en 10 grupos en una hora tendrás 7 años de mala suerte 😱😱', verdict: 'delete', explain: 'Las cadenas que presionan para reenviar masivamente son spam.' },
  ];
  const casesFor = (seed, n = 6) => shuffle(rng(hash('cases' + seed)), CASES).slice(0, n);

  /* ---------- Perfil del escáner y la bóveda (igual para todos en la sala) ---------- */
  const PEOPLE = [['Toño Turbo', 'tono.turbo', '🧑‍🎤', 'Guitarrista de garaje 🎸'], ['Vale Vórtex', 'vale.vortex', '👩‍🎤', 'Bailarina de salsa 💃'], ['Kike Kosmos', 'kike.kosmos', '🧑‍🚀', 'Fan de las estrellas 🔭'],
    ['Lu Lumen', 'lu.lumen', '👩‍🎨', 'Pinto murales 🎨'], ['Rocky Rayo', 'rocky.rayo', '🧑‍🍳', 'Chef de fin de semana 🍳'], ['Mía Meteoro', 'mia.meteoro', '👩‍💻', 'Gamer y programadora 🎮']];
  const PETS = [['Pelusa', '🐶', 'perrita'], ['Michi', '🐱', 'gatita'], ['Toby', '🐶', 'perrito'], ['Copito', '🐰', 'conejito'], ['Rocco', '🐶', 'perrito'], ['Nube', '🐱', 'gatita'], ['Kiwi', '🦜', 'lorito']];
  const SYMS = [['*', 'el asterisco *', 'parece una estrellita ✨'], ['!', 'el signo !', 'porque soy muy intensa/o 😆'], ['#', 'el numeral #', 'amo los hashtags'], ['$', 'el signo $', 'algún día seré millonario 💸'], ['&', 'el ampersand &', 'se ve elegante'], ['@', 'la arroba @', 'parece un caracolito 🐌']];
  const RISKS = [
    { k: 'viaje', emoji: '✈️', bg: 'linear-gradient(135deg,#7dd3fc,#2563eb)', label: 'Viaje anunciado', caption: '¡Me voy 2 semanas a la Isla Gradiente! La casa queda solita 🏠😎' },
    { k: 'boleto', emoji: '🎫', bg: 'linear-gradient(135deg,#f0abfc,#a21caf)', label: 'Código del boleto', caption: 'Mi boleto para Los Rayos de Neón 🤘 (¡se ve el código de barras!)' },
    { k: 'casa', emoji: '🏠', bg: 'linear-gradient(135deg,#86efac,#16a34a)', label: 'Dirección de casa', caption: 'Nuevo hogar dulce hogar 🔑 Calle Luna 42, apto 301' },
    { k: 'placa', emoji: '🚗', bg: 'linear-gradient(135deg,#fca5a5,#dc2626)', label: 'Placa del carro', caption: 'Mi primer carro 😍 placa NXP-777' },
    { k: 'abordar', emoji: '🛫', bg: 'linear-gradient(135deg,#bae6fd,#0369a1)', label: 'Pase de abordar', caption: '¡Rumbo a la playa! Foto del pase de abordar con el QR y mi nombre completo ✈️' },
    { k: 'tarjeta', emoji: '💳', bg: 'linear-gradient(135deg,#fde68a,#b45309)', label: 'Tarjeta bancaria', caption: 'Me llegó la tarjeta nueva 💳 (foto de frente y de reverso)' },
    { k: 'colegio', emoji: '🎒', bg: 'linear-gradient(135deg,#fecaca,#f97316)', label: 'Colegio del menor', caption: 'Primer día de mi sobrino en el Colegio Faro, sale a las 3 pm 🎒' },
    { k: 'ubicacion', emoji: '📍', bg: 'linear-gradient(135deg,#ddd6fe,#6d28d9)', label: 'Ubicación en vivo', caption: 'Solo/a en casa todo el finde. Ubicación en vivo activada 📍' },
    { k: 'cedula', emoji: '🪪', bg: 'linear-gradient(135deg,#e2e8f0,#475569)', label: 'Documento de identidad', caption: 'Renové mi cédula, ¡qué foto tan fea! 🪪 (se ve el número)' },
  ];
  const SAFE = [['🌅', 'linear-gradient(135deg,#fed7aa,#ea580c)', 'Atardecer increíble hoy 🌅'], ['🍕', 'linear-gradient(135deg,#fecaca,#b91c1c)', 'Pizza de domingo con amigos 🍕'], ['🌵', 'linear-gradient(135deg,#bbf7d0,#15803d)', 'Mi plantita sigue viva 🌵']];
  function profile(seed) {
    const r = rng(hash('profile' + seed));
    const [name, user, avatar, hobby] = pick(r, PEOPLE), [pet, petEmoji, petKind] = pick(r, PETS), [sym, symName, symWhy] = pick(r, SYMS);
    const year = 1984 + Math.floor(r() * 20), day = String(1 + Math.floor(r() * 28)).padStart(2, '0'), month = String(1 + Math.floor(r() * 12)).padStart(2, '0');
    const risks = shuffle(r, RISKS).slice(0, 3), safe = pick(r, SAFE);
    const posts = shuffle(r, [
      { emoji: petEmoji, bg: 'linear-gradient(135deg,#fde68a,#f59e0b)', caption: `¡Feliz cumple a mi ${petKind} ${pet}! Lo mejor del universo 💛`, risk: 'mascota' },
      { emoji: '⭐', bg: 'linear-gradient(135deg,#c4b5fd,#6d28d9)', caption: `Dato random: mi símbolo favorito es ${symName} porque ${symWhy}` },
      { emoji: safe[0], bg: safe[1], caption: safe[2] },
      ...risks.map(x => ({ emoji: x.emoji, bg: x.bg, caption: x.caption, risk: x.k })),
    ]);
    const riskLabels = { nacimiento: 'Fecha de nacimiento', mascota: 'Nombre de la mascota' };
    risks.forEach(x => (riskLabels[x.k] = x.label));
    return {
      name, user: `${user}${String(year).slice(2)}`, avatar,
      bio: [{ text: hobby }, { text: `🎂 ${day}/${month}/${year}`, risk: 'nacimiento' }, { text: `${petEmoji} Orgulloso/a de ${pet}`, risk: 'mascota' }, { text: '📍 Nexópolis' }],
      posts, hint: '[nombre de mi mascota] + [año en que nací] + [mi símbolo favorito]',
      answer: `${pet}${year}${sym}`.toLowerCase(), display: `${pet}${year}${sym}`, riskLabels,
    };
  }

  /* ---------- Banco de minijuegos: cada partida sortea 5 ---------- */
  const GAMES = {
    feed: { mission: 'Feed Frenético', gi: 'stamper', seconds: 60, shifts: 3, kind: 'arcade', controls: 'two', tagline: '¡El feed se desborda! Sellen cada publicación antes de que se acumule.',
      steps: [['stamper', 'Sellen cada publicación: DELETE o NO ACTION'], ['bright-explosion', 'Aciertos seguidos = combo'], ['robot-antennas', 'Ojo: la IA asistente a veces se equivoca']] },
    belt: { mission: 'Cinta Transportadora', gi: 'stack', seconds: 56, shifts: 2, kind: 'arcade', controls: 'belt', tagline: 'Las publicaciones avanzan por la cinta. ¡Sellen solo las que deben irse!',
      steps: [['stack', 'Las publicaciones pasan por la cinta'], ['stamper', 'Cuando una infracción entre en la zona roja: ¡DELETE!'], ['check-mark', 'Las que están bien, déjenlas pasar']] },
    sort: { mission: 'Archivo Express', gi: 'full-folder', seconds: 56, shifts: 2, kind: 'arcade', controls: 'sort', tagline: 'Cada caso va al cajón de su política. ¿O no viola ninguna?',
      steps: [['files', 'Lean el caso reportado'], ['full-folder', 'Archívenlo en la política correcta (teclas 1–4)'], ['check-mark', 'Si no viola nada: cajón NO ACTION']] },
    duel: { mission: 'Duelo de Publicaciones', gi: 'scales', seconds: 50, shifts: 2, kind: 'arcade', controls: 'duel', tagline: 'Dos publicaciones, una sola se va. ¿Cuál?',
      steps: [['scales', 'Aparecen dos publicaciones'], ['stamper', 'Elijan con ← o → la que debe ser DELETE'], ['stopwatch', 'Más rápido = más puntos']] },
    sea: { mission: 'Caza de Anzuelos', gi: 'fishing-hook', seconds: 60, shifts: 3, kind: 'arcade', controls: 'mouse', tagline: 'Llegan mensajes flotando por el puerto nocturno.',
      steps: [['envelope', 'Los mensajes llegan flotando: léanlos con calma'], ['fishing-hook', 'Toquen SOLO las estafas'], ['love-letter', 'Los mensajes reales restan puntos']] },
    chain: { mission: 'Rompe la Cadena', gi: 'mesh-network', seconds: 46, shifts: 2, kind: 'arcade', controls: 'mouse', bonus: 'chain', tagline: 'Un rumor falso corre por la red. ¡Córtenlo antes de que llegue a todos!',
      steps: [['fire', 'El rumor salta de usuario en usuario'], ['checked-shield', 'Toquen usuarios para verificarlos'], ['hourglass', 'La energía es limitada: ¡elijan bien!']] },
    scanner: { mission: 'Escáner de Privacidad', gi: 'flashlight', seconds: 56, shifts: 2, kind: 'arcade', controls: 'mouse', vault: true, tagline: 'Un cómplice del ladrón publica TODO. Encuentren sus datos con la linterna.',
      steps: [['flashlight', 'Muevan la linterna por el perfil oculto'], ['cut-diamond', 'Toquen los datos que no deberían ser públicos'], ['combination-lock', 'Después: ¡carrera para abrir la bóveda!']] },
    council: { mission: 'El Consejo', gi: 'gavel', kind: 'council', controls: 'write', tagline: 'Casos difíciles. Cada equipo decide, argumenta... y vota el mejor argumento.',
      steps: [['stamper', 'Elijan DELETE o NO ACTION y escriban por qué'], ['vote', 'Voten el argumento más convincente'], ['gavel', 'Se revela la decisión correcta']] },
  };
  const DEFAULT_PLAN = { plaza: 'feed', puerto: 'sea', isla: 'council', torre: 'chain', nebulosa: 'scanner' };
  function plan(rnd = Math.random, ids = Object.keys(DEFAULT_PLAN)) {
    const games = shuffle(rnd, Object.keys(GAMES)).slice(0, ids.length);
    return Object.fromEntries(ids.map((id, i) => [id, games[i]]));
  }

  return { rng, hash, shuffle, deck, duelPairs, sea, CASES, casesFor, profile, GAMES, DEFAULT_PLAN, plan, templates: P };
})();
