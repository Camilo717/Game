/* =========================================================
   EL CASO DEL CRISTAL ROBADO — Datos del juego
   Todo el contenido vive aquí. Todo está en español,
   excepto los nombres oficiales de las políticas y las decisiones.
   IMPORTANTE: todo el contenido es FICTICIO a propósito. No pegues aquí
   jobs reales, contenido de colas ni datos del cliente: así la dinámica
   funciona sin afectar los requisitos de seguridad.
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
   Solo dos decisiones. Puedes renombrarlas según el vocabulario de tu equipo. */
const DECISIONS = {
  delete:   { label: 'DELETE',    color: '#ff4d6d', key: '←', icon: '🗑️' },
  noaction: { label: 'NO ACTION', color: '#25d366', key: '→', icon: '✅' },
};

/* ---------------- LAS 18 POLÍTICAS ----------------
   district = distrito que desbloquea la carta.
   sensitive = protección especial: en el juego aparece solo como descripción del caso, sin contenido explícito. */
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

/* ---------------- DISTRITOS ----------------
   El minijuego de cada distrito se sortea en cada partida (ver js/content.js). */
const DISTRICTS = [
  { id: 'plaza', name: 'Plaza Azul', app: 'Facebook', value: 'VOZ', color: '#3a86ff', color2: '#9cc3ff', ico: 'newspaper' },
  { id: 'puerto', name: 'Puerto Verde', app: 'WhatsApp', value: 'SEGURIDAD', color: '#2ec4b6', color2: '#9ff0e7', ico: 'lighthouse' },
  { id: 'isla', name: 'Isla Gradiente', app: 'Instagram', value: 'DIGNIDAD', color: '#ff5d8f', color2: '#ffb3c9', ico: 'photo-camera' },
  { id: 'torre', name: 'Torre Espiral', app: 'Threads', value: 'AUTENTICIDAD', color: '#ffcf33', color2: '#ffe999', ico: 'radio-tower' },
  { id: 'nebulosa', name: 'Nebulosa Horizon', app: 'Meta Quest', value: 'PRIVACIDAD', color: '#9b5de5', color2: '#d2b6f5', ico: 'vr-headset' },
];

/* ---------------- BONUS TORRE ESPIRAL: TELÉFONO VIRAL ---------------- */
const PHONE_MESSAGES = [
  'La alcaldesa confirmó que el martes 14 el puente de la Plaza Azul cerrará de 3 a 5 de la tarde, pero el tren flotante será gratis para mayores de 60.',
  'Según el laboratorio de la Torre Espiral, los gatos naranjas del puerto NO transmiten el virus del glitch, pero hay que limpiar los visores dos veces por semana.',
  'El festival de la Nebulosa se pasa al sábado 22 porque se escaparon 3 dragones de neón; los boletos del viernes sirven si los cambian antes del jueves.',
  'La biblioteca de Nexópolis abrirá los domingos desde marzo, de 9 a 1, y prestará visores de realidad virtual a quien lleve su carné azul.',
  'Mañana a las 7 habrá un simulacro en el Puerto Verde: sonará la sirena 2 veces, pero los ferris seguirán saliendo cada 20 minutos.',
  'El concurso de memes del colegio Faro se canceló por lluvia; el premio de 500 corazones se entregará el viernes en la cafetería del tercer piso.',
];

/* ---------------- LECCIONES FINALES ---------------- */
const LESSONS = {
  plaza:    { value: 'VOZ', text: 'Moderar bien es decidir rápido y con criterio: conocer las políticas protege la voz de todos.' },
  puerto:   { value: 'SEGURIDAD', text: 'Pausa, verifica por otro canal y nunca compartas contraseñas ni códigos.' },
  isla:     { value: 'DIGNIDAD', text: 'La sátira y la crítica caben; exponer, amenazar o acosar a personas, no.' },
  torre:    { value: 'AUTENTICIDAD', text: 'Un rumor corre más rápido que la verdad. Verifica antes de compartir.' },
  nebulosa: { value: 'PRIVACIDAD', text: 'Lo que publicas puede usarse en tu contra: cuida tus datos y usa contraseñas únicas.' },
};

/* ---------------- INSIGNIAS (inspiradas en "Bad News") ---------------- */
const BADGES = {
  ojo:       { name: 'Ojo de halcón',   icon: 'eye-target',       desc: 'Ronda sin errores (mín. 8 decisiones)' },
  archivero: { name: 'Archivista experto', icon: 'full-folder',   desc: 'Archivó 8 casos en la política correcta' },
  racha:     { name: 'Racha imparable', icon: 'bright-explosion', desc: 'Combo de 6 o más' },
  antiia:    { name: 'Más listo que la IA', icon: 'robot-antennas', desc: 'Corrigió a la IA asistente 3 veces' },
  pescador:  { name: 'Pescador experto', icon: 'fishing-hook',    desc: '8 estafas atrapadas sin tocar mensajes reales' },
  cortafuego:{ name: 'Cortafuegos',     icon: 'checked-shield',   desc: 'Terminó con la red sana al 75% o más' },
  linterna:  { name: 'Linterna de oro', icon: 'flashlight',       desc: 'Encontró todos los datos expuestos' },
  hacker:    { name: 'Hacker ético',    icon: 'combination-lock', desc: 'Primer equipo en abrir la bóveda' },
  orador:    { name: 'Pico de oro',     icon: 'microphone',       desc: 'El argumento más votado en un caso del Consejo' },
  juez:      { name: 'Juez certero',    icon: 'gavel',            desc: 'Acertó todas las decisiones del Consejo' },
  detective: { name: 'Gran detective',  icon: 'sherlock-holmes',  desc: 'Descubrió al culpable' },
};
