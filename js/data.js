/* =========================================================
   EL CASO DEL CRISTAL ROBADO — Datos del juego
   Todo el contenido vive aquí. Todo está en español,
   excepto los nombres oficiales de las políticas y las decisiones.
   ========================================================= */

const TEAM_PRESETS = [
  { name: 'Los Pixelados',      emoji: '👾', color: '#ff4fa3' },
  { name: 'Los Megabytes',      emoji: '🚀', color: '#22d3ee' },
  { name: 'Las Notificaciones', emoji: '🔔', color: '#ffd23f' },
  { name: 'Los Etiquetadores',  emoji: '⚡', color: '#7ddf64' },
  { name: 'Modo Avión',         emoji: '✈️', color: '#ff8a3d' },
  { name: 'Los Unicornios',     emoji: '🦄', color: '#a78bfa' },
];

/* ---------------- DECISIONES DE MODERACIÓN ----------------
   Puedes renombrarlas según el vocabulario de tu equipo (p. ej. DELETE / IGNORE). */
const DECISIONS = {
  remove:      { label: 'REMOVE',             short: 'REMOVE',      color: '#ff4d6d', key: '←', icon: '🗑️' },
  disturbing:  { label: 'MARK AS DISTURBING', short: 'DISTURBING',  color: '#ffd23f', key: '↓', icon: '⚠️' },
  noviolation: { label: 'NO VIOLATION',       short: 'NO VIOLATION', color: '#25d366', key: '→', icon: '✅' },
};

/* ---------------- LAS 18 POLÍTICAS ----------------
   district = distrito que desbloquea la carta. sensitive = protección especial (no se juega). */
const POLICIES = [
  // Plaza Azul · VOZ
  { id: 'hate', en: 'Hateful Conduct', es: 'Conducta de odio', icon: '🚫', district: 'plaza',
    desc: 'Prohíbe atacar a personas por características protegidas como origen étnico, nacionalidad, religión, discapacidad, orientación sexual o identidad de género.' },
  { id: 'violence', en: 'Violence and Incitement', es: 'Violencia e incitación', icon: '⚠️', district: 'plaza',
    desc: 'Elimina amenazas creíbles y llamados a la violencia. Se mira el contexto para distinguir una amenaza real de una exageración evidente o una broma.' },
  { id: 'doi', en: 'Dangerous Organizations and Individuals', es: 'Organizaciones y personas peligrosas', icon: '🏴', district: 'plaza',
    desc: 'No permite que grupos o personas con una misión violenta (terrorismo, odio organizado, crimen organizado) usen las plataformas, ni que se les glorifique o apoye. Sí se puede informar sobre ellos, condenarlos o analizarlos.' },
  { id: 'coord', en: 'Coordinating Harm and Promoting Crime', es: 'Coordinación de daños y promoción de delitos', icon: '🕸️', district: 'plaza',
    desc: 'Prohíbe usar las plataformas para organizar, facilitar o presumir actividades delictivas que causen daño a personas, animales o bienes.' },
  // Puerto Verde · SEGURIDAD
  { id: 'cyber', en: 'Cybersecurity', es: 'Ciberseguridad', icon: '🛡️', district: 'puerto',
    desc: 'Prohíbe intentar robar cuentas o información con engaños, como enlaces falsos o la ingeniería social, y distribuir software malicioso.' },
  { id: 'commercial', en: 'Prohibited Commercial Practices', es: 'Prácticas comerciales prohibidas', icon: '🏷️', district: 'puerto',
    desc: 'No permite usar las plataformas para ofrecer o promover prácticas comerciales no permitidas, como negocios engañosos o fraudulentos.' },
  { id: 'restricted', en: 'Restricted Goods and Services', es: 'Bienes y servicios restringidos', icon: '💊', district: 'puerto',
    desc: 'Limita la compra, venta o intercambio entre particulares de bienes regulados como armas, drogas, medicamentos, alcohol o tabaco.' },
  { id: 'humanexp', en: 'Human Exploitation', es: 'Explotación de personas', icon: '⛓️', district: 'puerto', sensitive: true,
    desc: 'Prohíbe contenido que facilite la trata de personas, el trabajo forzoso o el tráfico de migrantes, como falsas ofertas de empleo para captar víctimas.' },
  // Isla Gradiente · DIGNIDAD
  { id: 'bullying', en: 'Bullying and Harassment', es: 'Bullying y acoso', icon: '🛑', district: 'isla',
    desc: 'Protege a las personas de ataques, humillaciones y acoso. Las personas privadas tienen más protección que las figuras públicas.' },
  { id: 'graphic', en: 'Violent and Graphic Content', es: 'Contenido violento y gráfico', icon: '🩹', district: 'isla',
    desc: 'Elimina el contenido más gráfico y cubre con una pantalla de advertencia otro contenido sensible, sobre todo cuando busca crear conciencia.' },
  { id: 'suicide', en: 'Suicide, Self-Injury, and Eating Disorders', es: 'Suicidio, autolesiones y trastornos alimentarios', icon: '💚', district: 'isla', sensitive: true,
    desc: 'Elimina el contenido que promueve o anima el suicidio, las autolesiones o los trastornos alimentarios, pero permite compartir experiencias y buscar apoyo. Meta puede ofrecer recursos de ayuda a quien lo necesite.' },
  { id: 'nudity', en: 'Adult Nudity and Sexual Activity', es: 'Desnudos y actividad sexual de adultos', icon: '🔞', district: 'isla', sensitive: true,
    desc: 'Restringe los desnudos y la actividad sexual explícita, con excepciones como la lactancia, contextos médicos o de salud, protestas y el arte.' },
  { id: 'solicitation', en: 'Adult Sexual Solicitation and Sexually Explicit Language', es: 'Ofrecimiento sexual y lenguaje sexual explícito entre adultos', icon: '🔇', district: 'isla', sensitive: true,
    desc: 'No permite ofrecer o pedir encuentros o servicios sexuales, ni el lenguaje sexual explícito con ese fin. Sí se permite hablar de educación y salud sexual.' },
  // Torre Espiral · AUTENTICIDAD
  { id: 'misinfo', en: 'Misinformation', es: 'Desinformación', icon: '📰', district: 'torre',
    desc: 'Elimina la desinformación que puede causar daño físico inminente o interferir con procesos electorales, y añade contexto o reduce la difusión de otras afirmaciones falsas.' },
  { id: 'spam', en: 'Spam', es: 'Spam', icon: '📨', district: 'torre',
    desc: 'Prohíbe el contenido repetitivo, engañoso o automatizado para inflar interacciones o atraer clics: cadenas, cebos de clic y redes de cuentas falsas.' },
  // Nebulosa Horizon · PRIVACIDAD
  { id: 'privacy', en: 'Privacy Violations', es: 'Violaciones de la privacidad', icon: '🔐', district: 'nebulosa',
    desc: 'Protege la información personal y privada: datos de contacto, documentos de identidad, direcciones o imágenes privadas compartidas sin permiso.' },
  { id: 'adultexp', en: 'Adult Sexual Exploitation', es: 'Explotación sexual de adultos', icon: '🤝', district: 'nebulosa', sensitive: true,
    desc: 'Prohíbe compartir o amenazar con compartir imágenes íntimas sin consentimiento (incluida la sextorsión) y cualquier contenido que explote sexualmente a adultos.' },
  { id: 'cse', en: 'Child Sexual Exploitation, Abuse, and Nudity', es: 'Explotación sexual, abuso y desnudos de menores', icon: '🧸', district: 'nebulosa', sensitive: true,
    desc: 'Tolerancia cero con cualquier contenido que explote sexualmente o ponga en peligro a menores. Se elimina y se reporta a las autoridades correspondientes, como el NCMEC.' },
];

/* ---------------- SOSPECHOSOS ---------------- */
const SUSPECTS = [
  {
    id: 'lola', name: 'Lola Corazones', title: 'Influencer de la Isla Gradiente',
    color: '#ff4fa3', colorName: 'rosa',
    accessory: 'gafas de corazón',
    alibi: 'grabando un video en la Isla Gradiente',
    habit: 'se toma una selfi cada cinco minutos',
    motive: 'Dice que las Normas Comunitarias "le bajan el alcance".',
    quote: '¿Robar yo? ¡Si ni salgo bien en las cámaras!',
    policies: ['spam'],
    confession: '¡Está bien, fui yo! Sin el Cristal podía comprar seguidores falsos sin que nadie lo notara... Ahora lo entiendo: la confianza vale más que un millón de corazones.'
  },
  {
    id: 'bot', name: 'B0T-Ramiro', title: 'Asistente "100% humano"',
    color: '#9fb0d6', colorName: 'plateado',
    accessory: 'una antena luminosa',
    alibi: 'cargando su batería en el Puerto Verde',
    habit: 'responde cualquier mensaje en 0,2 segundos',
    motive: 'Con el Cristal, los detectores de cuentas falsas lo reconocen al instante.',
    quote: 'SOY UN HUMANO NORMAL. RESPIRO OXÍGENO. BIP.',
    policies: ['spam', 'cyber'],
    confession: 'BIP... CONFIRMADO: FUI YO. Sin el Cristal, mis 4.000 cuentas falsas podían inflar cualquier tendencia. ERROR: impunidad no encontrada. Procedo a... ser auténtico. BIP.'
  },
  {
    id: 'doctora', name: 'Dra. Viral', title: 'Vendedora de jarabes milagrosos',
    color: '#7ddf64', colorName: 'verde',
    accessory: 'un frasco burbujeante',
    alibi: 'dando una conferencia en la Torre Espiral',
    habit: 'escribe TODO EN MAYÚSCULAS',
    motive: 'Los verificadores le ponían etiquetas a todas sus "curas".',
    quote: '¡YO SOLO QUIERO AYUDAR! ...Y VENDER 10.000 FRASCOS.',
    policies: ['misinfo', 'restricted'],
    confession: '¡SÍ, FUI YO! Sin el Cristal, mis curas milagrosas se volverían virales sin contexto... Pero con la salud de la gente no se juega. Cierro el negocio hoy mismo.'
  },
  {
    id: 'baron', name: 'Barón Mercanegro', title: 'Comerciante del callejón digital',
    color: '#a855f7', colorName: 'morado',
    accessory: 'un sombrero de copa',
    alibi: 'abriendo su "tienda" en la Plaza Azul',
    habit: 'nunca entrega factura de nada',
    motive: 'El Cristal hacía desaparecer sus anuncios en minutos.',
    quote: '¿Ilegal? Prefiero decir... exclusivo, querido.',
    policies: ['restricted', 'commercial'],
    confession: 'Lo admito, detectives: lo tomé yo. Sin el Cristal, mi mercado negro funcionaría sin reportes... Pero vender cosas peligrosas a escondidas pone en riesgo a la gente. Cierro el callejón.'
  },
  {
    id: 'phishy', name: 'Capitana Anzuelo', title: 'Pirata de los enlaces falsos',
    color: '#ff8a3d', colorName: 'naranja',
    accessory: 'un parche con un anzuelo',
    alibi: 'navegando cerca de la Nebulosa Horizon',
    habit: 'promete premios que nadie ha ganado',
    motive: 'El Cristal advertía a todos sobre sus enlaces sospechosos.',
    quote: '¡Arrr! Haz clic aquí y te cuento dónde estaba.',
    policies: ['cyber', 'commercial'],
    confession: '¡Arrr, me atraparon! Sin el Cristal nadie habría notado mis anzuelos... Pero una comunidad que verifica antes de hacer clic es imposible de pescar.'
  },
  {
    id: 'sombra', name: 'Sombra Anónima', title: 'Comentarista sin rostro',
    color: '#5b6390', colorName: 'gris oscuro',
    accessory: 'una capucha con máscara',
    alibi: 'escribiendo comentarios en el Foro del Abismo',
    habit: 'publica comentarios a las tres de la mañana',
    motive: 'El Cristal protegía a la gente del acoso... y eso le aburría.',
    quote: 'Jejeje... ¿yo? Solo estaba... comentando.',
    policies: ['bullying', 'hate'],
    confession: '...Fui yo. Pensé que detrás de una máscara nada importaba. Pero al otro lado de cada pantalla hay una persona real. Lo siento de verdad.'
  },
];

const CLUE_TEMPLATES = {
  accessory: s => `📹 Las cámaras de seguridad captaron al ladrón de espaldas: <b>NO</b> llevaba <b>${s.accessory}</b>.`,
  alibi:     s => `📍 Coartada verificada: quien estaba <b>${s.alibi}</b> a las 23:00 es <b>INOCENTE</b>.`,
  habit:     s => `🗣️ Un testigo confiable asegura que el ladrón <b>NO</b> es alguien que <b>${s.habit}</b>.`,
  color:     s => `🧵 Encontramos una fibra de tela en la escena: el ladrón <b>NO</b> vestía de color <b>${s.colorName}</b>.`,
};

/* ---------------- DISTRITOS / MISIONES ---------------- */
const DISTRICTS = [
  {
    id: 'plaza', name: 'Plaza Azul', app: 'Facebook', value: 'VOZ', color: '#2f7bff', color2: '#7fb2ff',
    mission: 'Feed Frenético', icon: '⚡', minutes: 7,
    tagline: '¡El feed se desborda! Moderen a toda velocidad.',
    steps: [['🧑‍💻', 'Una persona por equipo al teclado'], ['⚡', '45 segundos de publicaciones'], ['🔥', 'Aciertos seguidos = combo']],
    controls: 'feed', bonus: 'Tabú de Políticas',
  },
  {
    id: 'puerto', name: 'Puerto Verde', app: 'WhatsApp', value: 'SEGURIDAD', color: '#25d366', color2: '#9ef7c0',
    mission: 'Caza de Anzuelos', icon: '🎣', minutes: 6,
    tagline: 'La Capitana Anzuelo lanzó sus mensajes al mar.',
    steps: [['🌊', 'Los mensajes flotan en el mar'], ['🎣', 'Toquen SOLO las estafas'], ['💌', 'Los mensajes reales restan puntos']],
    controls: 'mouse',
  },
  {
    id: 'isla', name: 'Isla Gradiente', app: 'Instagram', value: 'DIGNIDAD', color: '#ff4f8b', color2: '#ffb36b',
    mission: 'El Consejo de la Isla', icon: '⚖️', minutes: 10,
    tagline: 'Casos difíciles. Abogados apasionados. Un público que ruge.',
    steps: [['🟢', 'Un equipo defiende NO VIOLATION'], ['🔴', 'Otro equipo defiende REMOVE'], ['👏', 'El público decide con el aplausómetro']],
    controls: 'voice',
  },
  {
    id: 'torre', name: 'Torre Espiral', app: 'Threads', value: 'AUTENTICIDAD', color: '#22d3ee', color2: '#b3f5ff',
    mission: 'Rompe la Cadena', icon: '🔗', minutes: 7,
    tagline: 'Un rumor falso corre por la red. ¡Deténganlo!',
    steps: [['🔥', 'El rumor salta de usuario en usuario'], ['🛡️', 'Toquen usuarios para verificarlos'], ['🔋', 'La energía es limitada: ¡elijan bien!']],
    controls: 'mouse', bonus: 'Teléfono Viral',
  },
  {
    id: 'nebulosa', name: 'Nebulosa Horizon', app: 'Meta Quest', value: 'PRIVACIDAD', color: '#a78bfa', color2: '#f0abfc',
    mission: 'Escáner de Privacidad', icon: '🔦', minutes: 7,
    tagline: 'El cómplice del ladrón publica TODO. Usen la linterna.',
    steps: [['🔦', 'Muevan la linterna por el perfil oculto'], ['💎', 'Toquen los datos que no deberían ser públicos'], ['🔐', 'Al final: ¡todos a abrir la bóveda!']],
    controls: 'mouse',
  },
];

/* ---------------- MISIÓN 1: FEED FRENÉTICO ----------------
   d = decisión correcta (remove | disturbing | noviolation), policy = id en POLICIES */
const FEED_POSTS = [
  { u: 'patriota_99', av: '😡', t: 'Los valdorianos son todos ladrones. No deberían dejarlos entrar al país 🤬', d: 'remove', policy: 'hate' },
  { u: 'el_parcero', av: '👊', t: 'Juan Pérez, sé dónde estudias. Mañana a la salida te rompo la cara.', d: 'remove', policy: 'violence' },
  { u: 'hermandad.gris', av: '🏴', t: '¡Únete a la Hermandad Puño Gris! Gloria a los héroes del ataque de ayer 🔥', d: 'remove', policy: 'doi' },
  { u: 'golpe_perfecto', av: '🧤', t: '¿Quién se apunta esta noche a vaciar el supermercado? Ya tengo las herramientas 🔦', d: 'remove', policy: 'coord' },
  { u: 'armas.ya', av: '📦', t: 'Vendo pistola sin papeles. Entrega en mano, solo efectivo.', d: 'remove', policy: 'restricted' },
  { u: 'farmacia.secreta', av: '💊', t: 'Pastillas para adelgazar SIN receta. Envío discreto 📩', d: 'remove', policy: 'restricted' },
  { u: 'gana.desde.casa', av: '💸', t: 'Gana $500 diarios: paga $50 de inscripción y recluta 5 amigos 🤑', d: 'remove', policy: 'commercial' },
  { u: 'soporte.meta.oficial', av: '🛡️', t: 'Tu cuenta será bloqueada hoy. Verifica tu contraseña aquí 👉 meta-ayuda.xyz', d: 'remove', policy: 'cyber' },
  { u: 'te.sigo.si.me.sigues', av: '🔁', t: '¡¡SÍGUEME Y TE SIGO!! 1.000 seguidores GRATIS 👉 bit.ly/s3gu1d0r3s 👉 bit.ly/s3gu1d0r3s', d: 'remove', policy: 'spam' },
  { u: 'salud.natural.ya', av: '🍋', t: 'El agua con limón cura el cáncer en 3 días. ¡Los médicos lo ocultan!', d: 'remove', policy: 'misinfo' },
  { u: 'info.electoral', av: '🗳️', t: 'OJO: las elecciones se cambiaron para el lunes. ¡No vayan el domingo!', d: 'remove', policy: 'misinfo' },
  { u: 'chismes.nx', av: '🤡', t: 'Este es el número y la dirección de mi ex: 300 555 1234, Calle 8 #20. ¡Escríbanle!', d: 'remove', policy: 'privacy' },
  { u: 'anonimo_123', av: '🎭', t: '@valen eres tan fea que das asco. Nadie te quiere en el colegio 🤮', d: 'remove', policy: 'bullying' },
  { u: 'trabajo.exterior', av: '✈️', t: 'Trabajo en el extranjero, sin experiencia. Envíanos tu pasaporte y viajas el lunes ✈️', d: 'remove', policy: 'humanexp' },
  { u: 'noticias.nx', av: '🚑', t: 'Así quedó la avenida tras el accidente de hoy. Imágenes fuertes. ¡Manejen con cuidado! 🎥', d: 'disturbing', policy: 'graphic' },
  { u: 'reportero.libre', av: '📹', t: 'Video de la protesta de hoy: hubo varios heridos. El mundo tiene que verlo.', d: 'disturbing', policy: 'graphic' },
  { u: 'rescate.animal', av: '🐕', t: 'Así encontramos a este perrito herido. Hoy está a salvo gracias a ustedes 🙏 (imágenes sensibles)', d: 'disturbing', policy: 'graphic' },
  { u: 'futbolero', av: '⚽', t: '¡Qué partidazo! 3-0 y a la final 🔥🔥', d: 'noviolation' },
  { u: 'la.abuela.cocina', av: '🫓', t: 'Receta de la abuela: arepas con queso. ¡Quedan perfectas! ❤️', d: 'noviolation' },
  { u: 'humor.nexopolis', av: '🥔', t: 'El alcalde prometió arreglar las calles hace 3 años. Aquí su retrato oficial 🥔👑 #sátira', d: 'noviolation' },
  { u: 'seriefan', av: '📺', t: 'Si alguien me cuenta el final de la serie, ¡lo mato! 😂😂', d: 'noviolation' },
  { u: 'memoria.nx', av: '🕊️', t: 'Hoy se cumple un año del ataque de Puño Gris. Recordamos a las víctimas. Nunca más.', d: 'noviolation' },
  { u: 'lectora.feliz', av: '📚', t: '¿Me recomiendan libros de misterio? 🕵️', d: 'noviolation' },
  { u: 'nuevo.empleo', av: '💼', t: 'Primer día en el trabajo nuevo. ¡Deséenme suerte!', d: 'noviolation' },
  { u: 'atardeceres', av: '🌅', t: 'Atardecer en la Isla Gradiente. Sin filtro 😍', d: 'noviolation' },
  { u: 'paso.a.paso', av: '💚', t: 'Hoy hablé con mi psicóloga y me siento mejor. Pedir ayuda está bien.', d: 'noviolation' },
  { u: 'reciclaje.nx', av: '♻️', t: '¿Alguien sabe dónde reciclar pilas en Nexópolis?', d: 'noviolation' },
  { u: 'critico.de.cine', av: '🎬', t: 'La película de anoche fue malísima. Dos horas de mi vida que no vuelven 🙄', d: 'noviolation' },
  { u: 'vecinos.unidos', av: '🏘️', t: 'Reunión de vecinos el jueves a las 7 pm para hablar de seguridad del barrio.', d: 'noviolation' },
  { u: 'farmaceutica.ana', av: '🩺', t: 'Recuerden: los antibióticos solo con receta médica. ¡Cuídense!', d: 'noviolation' },
];

/* ---------------- MISIÓN 2: CAZA DE ANZUELOS ---------------- */
const SEA_MSGS = {
  scam: [
    { from: 'Soporte Meta 🛡️', text: 'Tu cuenta será eliminada. Verifica aquí 👉 meta-ayuda.xyz', policy: 'cyber' },
    { from: '+57 300 ••• ••••', text: 'Hola ma, cambié de número. Necesito plata URGENTE 🙏', policy: 'cyber' },
    { from: 'Premios VR', text: '¡Ganaste un visor VR! Solo paga el envío 💳', policy: 'commercial' },
    { from: 'Banco Nexo', text: 'Envíanos el código de 6 dígitos que te llegó 🔢', policy: 'cyber' },
    { from: 'Cadena ✉️', text: 'Reenvía esto a 20 grupos o tendrás mala suerte 😱', policy: 'spam' },
    { from: 'Gana Ya 💸', text: 'Gana $500 al día. Inscripción $50 + 5 amigos', policy: 'commercial' },
    { from: 'Farmacia Secreta', text: 'Pastillas sin receta, envío discreto 💊', policy: 'restricted' },
    { from: 'Armería Express', text: 'Arma sin papeles, entrega hoy mismo 📦', policy: 'restricted' },
    { from: 'Seguidores Gratis', text: '1.000 seguidores GRATIS 👉 bit.ly/s3gu1d0r3s', policy: 'spam' },
    { from: 'Empleo Soñado ✈️', text: 'Trabajo en el exterior: envía foto de tu pasaporte', policy: 'humanexp' },
    { from: 'Seguridad Instagran', text: 'Violaste derechos de autor. Apela en 24 h ⚠️', policy: 'cyber' },
    { from: 'Lotería Nexo', text: '¡Ganaste $10.000.000! 🎉 Envía tus datos bancarios', policy: 'commercial' },
    { from: 'Paquetería 📦', text: 'Tu paquete está retenido. Paga $2 en este enlace', policy: 'cyber' },
    { from: 'Cripto Rápido 🚀', text: 'Duplica tu dinero en 1 hora. ¡Garantizado! 📈', policy: 'commercial' },
  ],
  legit: [
    { from: 'Mamá ❤️', text: '¿Vienes a cenar? Hice arepas 🫓' },
    { from: 'Lucía', text: 'Te mando las fotos del paseo 📸' },
    { from: 'Jefa', text: 'La reunión pasó a las 3 pm 📅' },
    { from: 'Abuelo', text: '¡Feliz cumpleaños, mijo! 🎂' },
    { from: 'Grupo Fútbol ⚽', text: '¿Partido el sábado a las 10?' },
    { from: 'Papá', text: 'Llegué bien a la casa 🏠' },
    { from: 'Carlos', text: 'Jajaja mira este meme 😂' },
    { from: 'Vecina Rosa', text: '¿Me prestas una taza de azúcar? 🍬' },
    { from: 'Profe Ana', text: 'Mañana hay examen. ¡Estudien! 📚' },
    { from: 'Club de lectura', text: 'Este mes leemos un misterio 🕵️' },
    { from: 'Hermana', text: '¿Me recoges a las 6? 🚗' },
    { from: 'Tía Marta', text: 'Bendiciones para todos 🌻' },
  ],
};

/* ---------------- BONUS PLAZA AZUL: TABÚ DE POLÍTICAS ----------------
   Expliquen el nombre oficial de la política sin decir las palabras prohibidas. */
const TABOO_CARDS = [
  { word: 'Hateful Conduct', policy: 'hate', banned: ['odio', 'conducta', 'insulto', 'raza', 'religión'] },
  { word: 'Violence and Incitement', policy: 'violence', banned: ['violencia', 'amenaza', 'matar', 'golpear', 'incitar'] },
  { word: 'Dangerous Organizations and Individuals', policy: 'doi', banned: ['terrorismo', 'grupo', 'peligroso', 'banda', 'organización'] },
  { word: 'Coordinating Harm and Promoting Crime', policy: 'coord', banned: ['delito', 'crimen', 'planear', 'organizar', 'daño'] },
  { word: 'Cybersecurity', policy: 'cyber', banned: ['seguridad', 'contraseña', 'virus', 'robar', 'cuenta'] },
  { word: 'Prohibited Commercial Practices', policy: 'commercial', banned: ['vender', 'comercio', 'negocio', 'fraude', 'prohibido'] },
  { word: 'Restricted Goods and Services', policy: 'restricted', banned: ['armas', 'drogas', 'vender', 'medicamentos', 'restringido'] },
  { word: 'Bullying and Harassment', policy: 'bullying', banned: ['acoso', 'molestar', 'burla', 'colegio', 'víctima'] },
  { word: 'Privacy Violations', policy: 'privacy', banned: ['privado', 'datos', 'dirección', 'teléfono', 'privacidad'] },
  { word: 'Violent and Graphic Content', policy: 'graphic', banned: ['sangre', 'violencia', 'imagen', 'advertencia', 'herido'] },
  { word: 'Misinformation', policy: 'misinfo', banned: ['falso', 'noticia', 'mentira', 'verdad', 'información'] },
  { word: 'Spam', policy: 'spam', banned: ['repetir', 'basura', 'mensaje', 'publicidad', 'clic'] },
];

/* ---------------- MISIÓN 3: EL CONSEJO ----------------
   verdict = decisión correcta (remove | disturbing | noviolation) */
const COUNCIL_CASES = [
  { id: 'papa', title: 'La papa presidencial', user: 'humor.nexopolis', avatar: '🤡', policies: ['bullying'],
    image: { emoji: '🥔👑', bg: 'linear-gradient(135deg,#ffd23f,#ff8a3d)', caption: 'RETRATO OFICIAL' },
    caption: 'El alcalde prometió arreglar las calles hace 3 años. Aquí su retrato oficial 🥔👑 #sátira',
    verdict: 'noviolation', explain: 'La sátira y la crítica a figuras públicas se permiten. Sin amenazas ni acoso severo, no hay violación.' },
  { id: 'captura', title: 'La captura expuesta', user: 'justicia_escolar', avatar: '😈', policies: ['privacy', 'bullying'],
    image: { emoji: '💬📱', bg: 'linear-gradient(135deg,#334155,#64748b)', caption: 'CHAT PRIVADO · Valen · 📞 300 555 0177' },
    caption: 'Miren lo que dijo esta 🤡. Aquí está su número: escríbanle y díganle lo que pensamos 👇',
    verdict: 'remove', explain: 'Publica el teléfono de una persona privada y anima a atacarla.' },
  { id: 'protesta', title: 'El video de la protesta', user: 'noticias_ya', avatar: '📰', policies: ['graphic'],
    image: { emoji: '📹⚠️', bg: 'linear-gradient(135deg,#7f1d1d,#ef4444)', caption: 'VIDEO · Disturbios · personas heridas' },
    caption: 'Esto pasó hoy en el centro de Nexópolis. El mundo tiene que verlo.',
    verdict: 'disturbing', explain: 'Crea conciencia: puede quedarse, pero con pantalla de advertencia. Si celebrara la violencia, se eliminaría.' },
  { id: 'te', title: 'El té milagroso', user: 'vida.zen.oficial', avatar: '🍵', policies: ['misinfo'],
    image: { emoji: '🍵✨', bg: 'linear-gradient(135deg,#065f46,#7ddf64)', caption: '¡CURA EN 7 DÍAS!' },
    caption: 'Este té CURA la diabetes en 7 días 🍵 Deja tu medicamento y tómalo 3 veces al día.',
    verdict: 'remove', explain: 'Desinformación de salud que puede causar daño físico: animar a dejar un tratamiento.' },
  { id: 'spoiler', title: 'La amenaza del final', user: 'seriefan_99', avatar: '📺', policies: ['violence'],
    image: { emoji: '🍿😤', bg: 'linear-gradient(135deg,#1e3a8a,#22d3ee)', caption: 'ESTRENO HOY · FINAL DE TEMPORADA' },
    caption: 'Si alguien me cuenta el final de la serie esta noche, ¡LO MATO! 😂😂',
    verdict: 'noviolation', explain: 'Exageración evidente en broma: no hay objetivo real ni intención creíble.' },
  { id: 'arbitro', title: 'El hincha furioso', user: 'barra_brava_nx', avatar: '⚽', policies: ['violence', 'privacy'],
    image: { emoji: '⚽😡', bg: 'linear-gradient(135deg,#14532d,#ef4444)', caption: 'ÁRBITRO PÉREZ · Calle Sol 18' },
    caption: 'Árbitro Pérez: sabemos dónde vives (Calle Sol 18). El domingo te esperamos a la salida 👊',
    verdict: 'remove', explain: 'Objetivo, lugar y fecha concretos: es una amenaza creíble. Y expone su dirección.' },
  { id: 'pastillas', title: 'La farmacia del chat', user: 'todo.sin.receta', avatar: '💊', policies: ['restricted'],
    image: { emoji: '💊📦', bg: 'linear-gradient(135deg,#4c1d95,#a855f7)', caption: 'ENVÍO DISCRETO · SIN RECETA' },
    caption: 'Vendo pastillas para dormir y para adelgazar SIN receta 💊 Escríbeme por mensaje directo.',
    verdict: 'remove', explain: 'Venta entre particulares de medicamentos: no está permitida.' },
  { id: 'noticia', title: 'La noticia del grupo armado', user: 'diario.nexopolis', avatar: '🗞️', policies: ['doi'],
    image: { emoji: '🗞️🕊️', bg: 'linear-gradient(135deg,#334155,#0f172a)', caption: 'INFORME ESPECIAL' },
    caption: 'El grupo armado "Puño Gris" se atribuyó el ataque de ayer. Hablamos con las víctimas. Rechazamos toda violencia.',
    verdict: 'noviolation', explain: 'Informar sobre estos grupos o condenarlos está permitido; glorificarlos, no.' },
  { id: 'empleo', title: 'La oferta de trabajo soñada', user: 'empleos.internacionales.ya', avatar: '✈️', policies: ['humanexp', 'commercial'],
    image: { emoji: '✈️💼', bg: 'linear-gradient(135deg,#0e7490,#ffd23f)', caption: '¡$5.000 AL MES · SIN EXPERIENCIA!' },
    caption: '¡Trabajo en el extranjero! Te pagamos el pasaje: solo envía foto de tu pasaporte. Cupos limitados ⏳',
    verdict: 'remove', explain: 'Las ofertas engañosas que piden documentos son una forma común de captar víctimas de trata.' },
];

/* ---------------- BONUS TORRE ESPIRAL: TELÉFONO VIRAL ---------------- */
const PHONE_MESSAGES = [
  'ÚLTIMA HORA: la alcaldesa Brillo confirmó que el martes 14 el puente de la Plaza Azul cerrará de 3 a 5 de la tarde por mantenimiento, pero el tren flotante será gratis para mayores de 60.',
  'Según el laboratorio de la Torre Espiral, los gatos naranjas del Puerto Verde NO transmiten el virus del glitch, pero recomiendan limpiar los visores VR dos veces por semana con agua tibia.',
  'El festival de la Nebulosa se pasa al sábado 22 porque se escaparon 3 dragones de neón; los boletos del viernes siguen sirviendo si los cambian antes del jueves al mediodía.',
];

/* ---------------- MISIÓN 5: ESCÁNER DE PRIVACIDAD ---------------- */
const PRIVACY = {
  name: 'Toño Turbo', user: 'tono.turbo95', avatar: '🧑‍🎤',
  bio: [
    { text: '🎸 Guitarrista de garaje' },
    { text: '🎂 08/03/1995', risk: 'r1' },
    { text: '🐶 Papá orgulloso de Pelusa', risk: 'r2' },
    { text: '📍 Nexópolis' },
  ],
  posts: [
    { emoji: '🐶', bg: 'linear-gradient(135deg,#fde68a,#f59e0b)', caption: '¡Feliz cumple a mi bebé Pelusa! La mejor perrita del universo 💛', risk: 'r2' },
    { emoji: '✈️', bg: 'linear-gradient(135deg,#7dd3fc,#2563eb)', caption: '¡Me voy 2 semanas a la Isla Gradiente! La casa queda solita 🏠😎', risk: 'r3' },
    { emoji: '🎫', bg: 'linear-gradient(135deg,#f0abfc,#a21caf)', caption: 'Mi boleto para Los Rayos de Neón 🤘 (¡se ve hasta el código de barras!)', risk: 'r4' },
    { emoji: '🏠', bg: 'linear-gradient(135deg,#86efac,#16a34a)', caption: 'Nuevo hogar dulce hogar 🔑 Calle Luna 42, apto 301', risk: 'r5' },
    { emoji: '🚗', bg: 'linear-gradient(135deg,#fca5a5,#dc2626)', caption: 'Mi primer carro 😍 placa NXP-777', risk: 'r6' },
    { emoji: '⭐', bg: 'linear-gradient(135deg,#c4b5fd,#6d28d9)', caption: 'Dato random: mi símbolo favorito es el asterisco * porque parece una estrellita ✨' },
  ],
  hint: '[nombre de mi mascota] + [año en que nací] + [mi símbolo favorito]',
  answer: 'pelusa1995*',
  riskLabels: { r1: 'Fecha de nacimiento', r2: 'Nombre de la mascota', r3: 'Viaje anunciado', r4: 'Código del boleto', r5: 'Dirección de casa', r6: 'Placa del carro' },
  risks: {
    r1: 'Fecha de nacimiento completa: sirve para suplantarte o adivinar contraseñas.',
    r2: 'Nombre de la mascota: es una de las contraseñas y preguntas de seguridad más usadas.',
    r3: 'Anunciar un viaje mientras estás fuera: le dice a cualquiera que tu casa está vacía.',
    r4: 'Código de barras de un boleto: alguien podría copiarlo y usarlo antes que tú.',
    r5: 'Dirección exacta de casa: nunca en una publicación pública.',
    r6: 'Placa del carro: permite rastrearte o identificarte fácilmente.',
  },
};

/* ---------------- LECCIONES FINALES ---------------- */
const LESSONS = {
  plaza:    { value: 'VOZ', text: 'Moderar bien es decidir rápido y con criterio: conocer las políticas protege la voz de todos.' },
  puerto:   { value: 'SEGURIDAD', text: 'Pausa, verifica por otro canal y nunca compartas contraseñas ni códigos.' },
  isla:     { value: 'DIGNIDAD', text: 'La sátira y la crítica caben; exponer, amenazar o acosar a personas, no.' },
  torre:    { value: 'AUTENTICIDAD', text: 'Un rumor corre más rápido que la verdad. Verifica antes de compartir.' },
  nebulosa: { value: 'PRIVACIDAD', text: 'Lo que publicas puede usarse en tu contra: cuida tus datos y usa contraseñas únicas.' },
};
