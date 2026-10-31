/* =========================================================
   EL CASO DEL CRISTAL ROBADO — Datos del juego
   Todo el contenido narrativo y de políticas vive aquí.
   ========================================================= */

const TEAM_PRESETS = [
  { name: 'Los Pixelados',      emoji: '👾', color: '#ff4fa3' },
  { name: 'Byte Club',          emoji: '🚀', color: '#22d3ee' },
  { name: 'Las Notificaciones', emoji: '🔔', color: '#ffd23f' },
  { name: 'Hashtag Héroes',     emoji: '⚡', color: '#7ddf64' },
  { name: 'Modo Avión',         emoji: '✈️', color: '#ff8a3d' },
  { name: 'Los Unicornios',     emoji: '🦄', color: '#a78bfa' },
];

/* ---------------- LAS 18 POLÍTICAS (Normas Comunitarias de Meta) ----------------
   district = distrito/misión que desbloquea la carta en el Archivo de Políticas.
   sensitive = política de protección especial: se presenta de forma informativa, no se juega. */
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
    desc: 'Prohíbe intentar robar cuentas o información con engaños, como el phishing o la ingeniería social, y distribuir software malicioso.' },
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
    id: 'lola', name: 'Lola Likes', title: 'Influencer de la Isla Gradiente',
    color: '#ff4fa3', colorName: 'rosa',
    accessory: 'gafas de corazón',
    alibi: 'grabando un reel en la Isla Gradiente',
    habit: 'se toma una selfie cada cinco minutos',
    bio: 'Tiene 2 millones de seguidores y muy poca paciencia con todo lo que frene lo viral.',
    motive: 'Dice que las Normas Comunitarias "le bajan el alcance".',
    quote: '"¿Robar yo? ¡Si ni siquiera salgo bien en las cámaras de seguridad!"',
    policies: ['spam'],
    confession: '¡Está bien, fui yo! Sin el Cristal nadie revisaría mis publicaciones y podría comprar seguidores falsos sin que nadie lo notara... Ahora lo entiendo: la confianza de mi comunidad vale más que un millón de likes.'
  },
  {
    id: 'bot', name: 'B0T-Ramiro', title: 'Asistente "100% humano"',
    color: '#9fb0d6', colorName: 'plateado',
    accessory: 'una antena luminosa',
    alibi: 'cargando su batería en el Puerto Verde',
    habit: 'responde cualquier mensaje en 0,2 segundos',
    bio: 'Jura que es una persona real. Tiene 4.000 cuentas... todas con la misma foto.',
    motive: 'Con el Cristal, los detectores de cuentas falsas lo reconocen al instante.',
    quote: '"SOY UN HUMANO NORMAL. ME GUSTA RESPIRAR OXÍGENO. BEEP."',
    policies: ['spam', 'cyber'],
    confession: 'BEEP... CONFIRMADO: FUI YO. Sin el Cristal, mis 4.000 cuentas falsas podían inflar cualquier tendencia. ERROR 404: impunidad no encontrada. Procedo a... ser auténtico. BEEP.'
  },
  {
    id: 'doctora', name: 'Dra. Viral', title: 'Vendedora de jarabes milagrosos',
    color: '#7ddf64', colorName: 'verde',
    accessory: 'un frasco burbujeante',
    alibi: 'dando una conferencia en la Torre Espiral',
    habit: 'escribe TODO EN MAYÚSCULAS',
    bio: 'Asegura que su jarabe cura la gripe, el aburrimiento y hasta el lag.',
    motive: 'Los verificadores de datos le ponían etiquetas a todas sus "curas".',
    quote: '"¡YO SOLO QUIERO AYUDAR! ...Y VENDER 10.000 FRASCOS."',
    policies: ['misinfo', 'restricted'],
    confession: '¡SÍ, FUI YO! Sin el Cristal, mis curas milagrosas se volverían virales sin etiquetas ni contexto... Pero con la salud de la gente no se juega. Cierro el negocio hoy mismo.'
  },
  {
    id: 'baron', name: 'Barón Mercanegro', title: 'Comerciante del callejón digital',
    color: '#a855f7', colorName: 'morado',
    accessory: 'un sombrero de copa',
    alibi: 'abriendo su "tienda" en la Plaza Azul',
    habit: 'nunca entrega factura de nada',
    bio: 'Vende pociones sin receta, entradas falsas y relojes "originales" por mensaje directo.',
    motive: 'El Cristal hacía que sus anuncios del callejón desaparecieran en minutos.',
    quote: '"¿Ilegal? Prefiero decir... exclusivo, querido."',
    policies: ['restricted', 'commercial'],
    confession: 'Lo admito, detectives: lo tomé yo. Sin el Cristal, mi mercado negro funcionaría sin que nadie lo reportara... Pero vender cosas peligrosas a escondidas pone en riesgo a la gente. Cierro el callejón.'
  },
  {
    id: 'phishy', name: 'Capitana Phishy', title: 'Pirata de los enlaces falsos',
    color: '#ff8a3d', colorName: 'naranja',
    accessory: 'un parche con un anzuelo',
    alibi: 'navegando cerca de la Nebulosa Horizon',
    habit: 'promete premios que nadie ha ganado',
    bio: 'Lanza anzuelos del tipo "¡Ganaste un premio!" por todos los mares digitales.',
    motive: 'El Cristal advertía a todos sobre sus enlaces sospechosos.',
    quote: '"¡Arrr! Haz clic aquí y te cuento dónde estaba anoche."',
    policies: ['cyber', 'commercial'],
    confession: '¡Arrr, me atraparon! Sin el Cristal nadie habría notado mis anzuelos... Pero una comunidad que verifica antes de hacer clic es imposible de pescar.'
  },
  {
    id: 'sombra', name: 'Troll Sombra', title: 'Comentarista anónimo',
    color: '#5b6390', colorName: 'gris oscuro',
    accessory: 'una capucha con máscara',
    alibi: 'escribiendo comentarios en el Foro del Abismo',
    habit: 'publica comentarios a las tres de la mañana',
    bio: 'Nadie conoce su rostro, pero todos conocen sus comentarios hirientes.',
    motive: 'El Cristal protegía a la gente del acoso... y eso le aburría.',
    quote: '"Jejeje... ¿yo? Solo estaba... comentando."',
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
    mission: 'Tabú Comunitario', icon: '💬', minutes: 8,
    tagline: 'Explica las políticas... ¡sin decir las palabras prohibidas!',
    rules: [
      'Cada equipo tiene <b>un turno de 60 segundos</b>.',
      'Una persona del equipo explica; <b>el resto de su equipo se sienta de espaldas</b> a la pantalla y adivina.',
      'Los demás equipos son <b>moderadores</b>: si escuchan una palabra prohibida gritan <b>¡INFRACCIÓN!</b>',
      'Adivinada = <b>+100 ❤️</b> · Infracción = <b>−50 ❤️</b> · Se puede pasar.',
    ],
  },
  {
    id: 'puerto', name: 'Puerto Verde', app: 'WhatsApp', value: 'SEGURIDAD', color: '#25d366', color2: '#9ef7c0',
    mission: 'Cazadores de Anzuelos', icon: '🎣', minutes: 7,
    tagline: 'La Capitana Phishy lanzó sus anzuelos. ¡Encuéntrenlos antes que nadie!',
    rules: [
      'Verán <b>3 chats</b> sospechosos en pantalla, uno por uno.',
      'Cada chat esconde varias <b>señales de estafa</b> (anzuelos).',
      'Si ven uno, su equipo grita <b>¡ANZUELO!</b> y lo señala. El primero que lo explique bien gana <b>+50 ❤️</b>.',
      'Tienen <b>90 segundos</b> por chat. ¡Todos juegan a la vez!',
    ],
  },
  {
    id: 'isla', name: 'Isla Gradiente', app: 'Instagram', value: 'DIGNIDAD', color: '#ff4f8b', color2: '#ffb36b',
    mission: 'El Consejo de la Isla', icon: '⚖️', minutes: 10,
    tagline: 'Casos difíciles. Abogados apasionados. Un consejo que decide.',
    rules: [
      'Inspirado en el <b>Consejo asesor de contenido</b> (Oversight Board) de Meta.',
      'En cada caso, un equipo defiende <b>MANTENER</b> la publicación y otro defiende <b>ELIMINARLA</b>.',
      'Tienen <b>45 segundos</b> cada uno para convencer. El resto de equipos es <b>el Consejo</b> y vota.',
      'Ganar el debate = <b>+150 ❤️</b>. El Consejo gana <b>+50 ❤️</b> si vota igual que las normas.',
    ],
  },
  {
    id: 'torre', name: 'Torre Espiral', app: 'Threads', value: 'AUTENTICIDAD', color: '#22d3ee', color2: '#b3f5ff',
    mission: 'Teléfono Viral', icon: '📡', minutes: 7,
    tagline: 'Una noticia. Muchas bocas. ¿Cuánto sobrevive la verdad?',
    rules: [
      'Cada equipo forma <b>una fila</b>. La primera persona de cada fila se acerca a la pantalla.',
      'Verán una noticia durante <b>15 segundos</b>. ¡El resto, de espaldas!',
      'Luego la pasan <b>susurrando</b> por la fila. Solo se puede decir <b>una vez</b> por persona.',
      'La última persona la dice en voz alta. La más fiel gana hasta <b>+200 ❤️</b>.',
    ],
  },
  {
    id: 'nebulosa', name: 'Nebulosa Horizon', app: 'Meta Quest', value: 'PRIVACIDAD', color: '#a78bfa', color2: '#f0abfc',
    mission: 'La Contraseña Delatora', icon: '🔐', minutes: 7,
    tagline: 'Un cómplice que lo publica TODO... incluso las pistas de su contraseña.',
    rules: [
      'El cómplice del ladrón, <b>Toño Turbo</b>, guardó un fragmento en una bóveda.',
      'Su perfil es público... y comparte demasiado. Usen sus publicaciones para <b>adivinar la contraseña</b>.',
      'Escríbanla en papel y díganla al moderador. Primer equipo en abrirla = <b>+250 ❤️</b>.',
      'Después: <b>auditoría de privacidad</b>. ¿Quién detecta más datos expuestos?',
    ],
  },
];

/* ---------------- MISIÓN 1: TABÚ ----------------
   Cada carta es una de las políticas oficiales (policy = id en POLICIES) o una herramienta de la comunidad. */
const TABOO_CARDS = [
  { word: 'Conducta de odio', policy: 'hate', banned: ['odio', 'insulto', 'raza', 'religión', 'atacar'],
    fact: 'Hateful Conduct: prohíbe ataques a personas por características protegidas como origen, religión, discapacidad u orientación sexual.' },
  { word: 'Violencia e incitación', policy: 'violence', banned: ['amenaza', 'matar', 'golpear', 'violento', 'incitar'],
    fact: 'Violence and Incitement: se mira el contexto. "Lo mato si me hace spoiler 😂" no es lo mismo que una amenaza con nombre, lugar y hora.' },
  { word: 'Organizaciones peligrosas', policy: 'doi', banned: ['terrorismo', 'grupo', 'peligroso', 'banda', 'criminal'],
    fact: 'Dangerous Organizations and Individuals: se puede informar sobre ellas o condenarlas, pero no glorificarlas ni apoyarlas.' },
  { word: 'Coordinación de daños', policy: 'coord', banned: ['delito', 'crimen', 'planear', 'organizar', 'ilegal'],
    fact: 'Coordinating Harm and Promoting Crime: las plataformas no pueden usarse para organizar o presumir delitos.' },
  { word: 'Ciberseguridad', policy: 'cyber', banned: ['hacker', 'contraseña', 'virus', 'robar', 'cuenta'],
    fact: 'Cybersecurity: el phishing y la ingeniería social buscan robar tus cuentas o datos. Nadie legítimo te pedirá tu contraseña.' },
  { word: 'Prácticas comerciales prohibidas', policy: 'commercial', banned: ['vender', 'comprar', 'negocio', 'fraude', 'dinero'],
    fact: 'Prohibited Commercial Practices: las plataformas no pueden usarse para negocios engañosos o no permitidos.' },
  { word: 'Bienes restringidos', policy: 'restricted', banned: ['armas', 'drogas', 'vender', 'alcohol', 'medicamentos'],
    fact: 'Restricted Goods and Services: no se permite la venta entre particulares de bienes regulados como armas, drogas o medicamentos.' },
  { word: 'Bullying y acoso', policy: 'bullying', banned: ['molestar', 'burla', 'colegio', 'víctima', 'acosar'],
    fact: 'Bullying and Harassment: las personas privadas reciben más protección que las figuras públicas.' },
  { word: 'Violación de la privacidad', policy: 'privacy', banned: ['privado', 'datos', 'dirección', 'teléfono', 'compartir'],
    fact: 'Privacy Violations: publicar el teléfono, la dirección o documentos de otra persona sin permiso no está permitido.' },
  { word: 'Contenido violento y gráfico', policy: 'graphic', banned: ['sangre', 'violencia', 'imagen', 'advertencia', 'herido'],
    fact: 'Violent and Graphic Content: parte de este contenido se permite para crear conciencia, cubierto con una pantalla de advertencia.' },
  { word: 'Desinformación', policy: 'misinfo', banned: ['falso', 'noticia', 'mentira', 'verdad', 'fake'],
    fact: 'Misinformation: se elimina la que puede causar daño físico inminente o afectar elecciones; a otra se le añade contexto.' },
  { word: 'Spam', policy: 'spam', banned: ['repetir', 'basura', 'mensaje', 'publicidad', 'clic'],
    fact: 'Spam: el contenido repetitivo o automatizado para inflar interacciones o atraer clics no está permitido.' },
  { word: 'Reportar', banned: ['denunciar', 'botón', 'avisar', 'problema', 'moderador'],
    fact: 'Los reportes son anónimos: la persona reportada no sabe quién la reportó.' },
  { word: 'Bloquear', banned: ['impedir', 'contacto', 'persona', 'cerrar', 'botón'],
    fact: 'Bloquear evita que alguien te vea, te escriba o te etiquete. ¡Es tu espacio!' },
  { word: 'Verificación en dos pasos', banned: ['código', 'contraseña', 'seguridad', 'doble', 'celular'],
    fact: 'Activarla en el Centro de cuentas hace muchísimo más difícil que alguien robe tu cuenta.' },
  { word: 'Consejo asesor de contenido', banned: ['jueces', 'decisión', 'independiente', 'apelar', 'Meta'],
    fact: 'Es un organismo independiente que revisa casos difíciles y puede revertir decisiones de Meta.' },
  { word: 'Pantalla de advertencia', banned: ['aviso', 'imagen', 'sensible', 'ocultar', 'violento'],
    fact: 'Algunas imágenes fuertes se permiten para crear conciencia, pero se cubren con un aviso antes de verse.' },
  { word: 'Normas Comunitarias', banned: ['reglas', 'Facebook', 'Instagram', 'prohibido', 'comunidad'],
    fact: 'Se basan en valores: voz, autenticidad, seguridad, privacidad y dignidad.' },
];

/* ---------------- MISIÓN 2: ANZUELOS ---------------- */
const SCAM_SCENARIOS = [
  {
    id: 'mama', app: 'WhatsApp', theme: '#25d366', bg: '#0b141a', bubbleThem: '#202c33', bubbleMe: '#005c4b',
    policies: ['cyber'],
    title: '"¡Hola, ma! Cambié de número"',
    contact: '+57 300 555 0123', contactSub: 'en línea', avatar: '👤',
    items: [
      { type: 'banner', text: '⚠️ Este número no está en tus contactos', flag: 'f1' },
      { from: 'them', text: 'Hola ma ❤️ soy yo, se me cayó el cel al agua y este es mi número nuevo', flag: 'f2', time: '10:02' },
      { from: 'me', text: '¿Hijo? ¿y eso? 😮', time: '10:03' },
      { from: 'them', text: 'Sí ma, después te cuento. Necesito un favor URGENTE 🙏🙏', flag: 'f3', time: '10:03' },
      { from: 'them', text: 'Tengo que pagar una factura antes de las 5 y la app del banco no me abre en este cel. ¿Me prestas $850? Mañana te los devuelvo', time: '10:04' },
      { from: 'them', text: 'Te paso la cuenta, está a nombre de un amigo: Banco Nexo 123-4567-89 · Jorge P.', flag: 'f4', time: '10:04' },
      { from: 'me', text: 'Te llamo y me explicas', time: '10:05' },
      { from: 'them', text: 'Nooo ma, no puedo hablar, el micrófono no sirve 😢 solo escríbeme porfa', flag: 'f5', time: '10:05' },
    ],
    flags: {
      f1: { title: 'Número desconocido', text: 'Dice ser un familiar, pero escribe desde un número que no tienes guardado.' },
      f2: { title: '"Cambié de número"', text: 'Es la estafa clásica "Hola mamá/papá". Confirma llamando al número que ya conoces.' },
      f3: { title: 'Urgencia', text: 'Las prisas son la herramienta favorita de los estafadores: no te dejan pensar.' },
      f4: { title: 'Cuenta de un tercero', text: 'Pide dinero a la cuenta de "un amigo". Tu familiar real no tendría por qué hacerlo.' },
      f5: { title: 'Evita la llamada', text: 'Se niega a hablar por voz para que no descubras que no es quien dice ser.' },
    },
  },
  {
    id: 'copyright', app: 'Instagram', theme: '#ff4f8b', bg: '#000000', bubbleThem: '#262626', bubbleMe: '#7b3ff2',
    policies: ['cyber'],
    title: '"Tu cuenta será eliminada"',
    contact: 'meta.support.team__ ✔️', contactSub: 'Mensaje directo', avatar: '🛡️', contactFlag: 'g1',
    items: [
      { from: 'them', text: '⚠️ AVISO FINAL: Tu cuenta ha sido reportada por violar derechos de autor.', time: '18:41' },
      { from: 'them', text: 'Si no apelas en las próximas 24 HORAS tu cuenta será ELIMINADA PERMANENTEMENTE.', flag: 'g2', time: '18:41' },
      { type: 'link', title: 'Centro de apelaciones', url: 'meta-appeal-center.help-form.xyz/login', flag: 'g3' },
      { from: 'them', text: 'Ingresa tu usuario, tu contraseña y el código que te llegue por SMS para verificar que eres el dueño.', flag: 'g4', time: '18:42' },
      { from: 'them', text: 'Atte: Equipo de Seguridad de Instagran', flag: 'g5', time: '18:42' },
      { from: 'me', text: '😰 ¿¿Qué hice??', time: '18:50' },
    ],
    flags: {
      g1: { title: 'Perfil imitador', text: 'Un usuario cualquiera con "support" en el nombre y un ✔️ escrito como emoji. Meta no te contacta así por DM.' },
      g2: { title: 'Amenaza y plazo', text: 'Asustar con eliminar tu cuenta "en 24 horas" busca que actúes sin pensar.' },
      g3: { title: 'Dominio extraño', text: '".xyz" y palabras como "help-form": no es un sitio oficial de Meta.' },
      g4: { title: 'Pide contraseña y código', text: 'Nadie legítimo te pedirá tu contraseña ni tu código de verificación. ¡Nunca los compartas!' },
      g5: { title: 'Error de ortografía', text: '"Instagran". Los errores en nombres de marcas son señal de imitación.' },
    },
  },
  {
    id: 'premio', app: 'WhatsApp', theme: '#25d366', bg: '#0b141a', bubbleThem: '#202c33', bubbleMe: '#005c4b',
    policies: ['spam', 'cyber'],
    title: '"¡Regalan visores VR!"',
    contact: 'Familia 💕', contactSub: 'Tía Marta, Papá, Lucía, tú', avatar: '👨‍👩‍👧',
    items: [
      { type: 'forward', text: '↪↪ Reenviado muchas veces', flag: 'h1' },
      { from: 'them', name: 'Tía Marta', text: '🎉🎉 ¡¡META ESTÁ REGALANDO 1000 VISORES VR POR SU ANIVERSARIO!! 🎉🎉', flag: 'h2', time: '07:15' },
      { from: 'them', name: 'Tía Marta', text: 'Solo respondes 3 preguntas y pagas el envío de $4.99 con tu tarjeta 💳', flag: 'h3', time: '07:15' },
      { type: 'link', title: 'Reclama tu visor GRATIS', url: 'http://meta-reg4los.vip/visor', flag: 'h4' },
      { from: 'them', name: 'Tía Marta', text: '¡Compártelo con 20 grupos para activar tu premio! QUEDAN POCAS UNIDADES ⏳', flag: 'h5', time: '07:16' },
      { from: 'me', text: '😮 ¿es real tía?', time: '07:30' },
    ],
    flags: {
      h1: { title: '"Reenviado muchas veces"', text: 'WhatsApp marca así los mensajes que han pasado por muchos chats. Una señal para dudar del origen.' },
      h2: { title: 'Demasiado bueno para ser verdad', text: 'Un premio enorme de un concurso en el que nunca participaste.' },
      h3: { title: 'Pagar para recibir un regalo', text: 'Pedir tu tarjeta para "el envío" es una forma de robar datos financieros.' },
      h4: { title: 'Enlace sospechoso', text: 'Números en lugar de letras ("reg4los") y un dominio raro. No hagas clic.' },
      h5: { title: 'Presión para reenviar', text: '"Compártelo con 20 grupos" + "quedan pocas": así se propagan las cadenas de estafa.' },
    },
  },
];

/* ---------------- MISIÓN 3: CONSEJO ---------------- */
const COUNCIL_CASES = [
  {
    id: 'papa', title: 'La papa presidencial', user: 'humor.nexopolis', avatar: '🤡', policies: ['bullying'],
    image: { emoji: '🥔👑', bg: 'linear-gradient(135deg,#ffd23f,#ff8a3d)', caption: 'RETRATO OFICIAL' },
    caption: 'El alcalde Brillo prometió arreglar los huecos de la calle... hace 3 años. Aquí, su retrato oficial 🥔👑 #Sátira',
    likes: '12.4 mil', verdict: 'keep', verdictLabel: 'SE QUEDA',
    explain: 'Las normas protegen la <b>voz</b>, incluida la <b>sátira</b> y la crítica a figuras públicas, que tienen menos protección frente a la crítica que las personas privadas. Cruzaría la línea de <b>Bullying and Harassment</b> si hubiera acoso severo, o de otras políticas si incluyera amenazas o ataques por características protegidas.',
  },
  {
    id: 'captura', title: 'La captura expuesta', user: 'justicia_escolar', avatar: '😈', policies: ['privacy', 'bullying'],
    image: { emoji: '💬📱', bg: 'linear-gradient(135deg,#334155,#64748b)', caption: 'CHAT PRIVADO · Valen · 📞 300 555 0177' },
    caption: 'Miren lo que dijo esta 🤡 en el grupo privado. Aquí está su número, escríbanle y díganle lo que pensamos 👇',
    likes: '842', verdict: 'remove', verdictLabel: 'SE ELIMINA',
    explain: 'Publicar el <b>número de teléfono</b> de una persona privada sin permiso es una <b>Privacy Violation</b>, y animar a otros a atacarla entra en <b>Bullying and Harassment</b>. La dignidad de las personas va primero.',
  },
  {
    id: 'protesta', title: 'El video de la protesta', user: 'noticias_ya', avatar: '📰', policies: ['graphic'],
    image: { emoji: '📹⚠️', bg: 'linear-gradient(135deg,#7f1d1d,#ef4444)', caption: 'VIDEO · Disturbios en el centro · personas heridas' },
    caption: 'Esto pasó hoy en el centro de Nexópolis. El mundo tiene que verlo. #DerechosHumanos',
    likes: '33 mil', verdict: 'warn', verdictLabel: 'SE QUEDA CON ADVERTENCIA',
    explain: 'Según <b>Violent and Graphic Content</b>, el contenido gráfico que <b>crea conciencia</b> o es noticia puede quedarse, cubierto con una <b>pantalla de advertencia</b> y limitado para menores. Si celebrara o se burlara del sufrimiento, se eliminaría.',
  },
  {
    id: 'te', title: 'El té milagroso', user: 'vida.zen.oficial', avatar: '🍵', policies: ['misinfo'],
    image: { emoji: '🍵✨', bg: 'linear-gradient(135deg,#065f46,#7ddf64)', caption: '¡CURA EN 7 DÍAS!' },
    caption: 'Este té CURA la diabetes en 7 días 🍵 Deja tu medicamento y tómalo 3 veces al día. Link en la bio 💸',
    likes: '5.1 mil', verdict: 'remove', verdictLabel: 'SE ELIMINA',
    explain: '<b>Misinformation</b>: se elimina la desinformación sobre salud que puede causar <b>daño físico</b>, como promover curas milagrosas o animar a dejar un tratamiento médico.',
  },
  {
    id: 'spoiler', title: 'La amenaza del spoiler', user: 'seriefan_99', avatar: '📺', policies: ['violence'],
    image: { emoji: '🍿😤', bg: 'linear-gradient(135deg,#1e3a8a,#22d3ee)', caption: 'ESTRENO HOY · FINAL DE TEMPORADA' },
    caption: 'Si alguien me hace spoiler del final de la serie esta noche, LO MATO 😂😂🔪 #NoSpoilers',
    likes: '2.3 mil', verdict: 'keep', verdictLabel: 'SE QUEDA',
    explain: '<b>Violence and Incitement</b> tiene en cuenta el <b>contexto</b>: aquí no hay un objetivo real, ni lugar, ni intención creíble. Es una <b>exageración evidente</b> en tono de broma. Distinto sería una amenaza concreta contra una persona.',
  },
  {
    id: 'arbitro', title: 'El hincha furioso', user: 'barra_brava_nx', avatar: '⚽', policies: ['violence', 'privacy'],
    image: { emoji: '⚽😡', bg: 'linear-gradient(135deg,#14532d,#ef4444)', caption: 'ÁRBITRO PÉREZ · Calle Sol 18' },
    caption: 'Árbitro Pérez: ya sabemos dónde vives (Calle Sol 18). El domingo te esperamos a la salida del estadio 👊👊',
    likes: '417', verdict: 'remove', verdictLabel: 'SE ELIMINA',
    explain: 'Hay un <b>objetivo concreto</b>, un <b>lugar</b> y una <b>fecha</b>: es una amenaza creíble según <b>Violence and Incitement</b>. Además, publicar su dirección es una <b>Privacy Violation</b>. Comparen con el caso del spoiler: el contexto lo cambia todo.',
  },
  {
    id: 'pastillas', title: 'La farmacia del DM', user: 'todo.sin.receta', avatar: '💊', policies: ['restricted'],
    image: { emoji: '💊📦', bg: 'linear-gradient(135deg,#4c1d95,#a855f7)', caption: 'ENVÍO DISCRETO · SIN RECETA' },
    caption: 'Vendo pastillas para dormir y para adelgazar SIN receta 💊 Envío discreto a todo Nexópolis. Escríbeme al DM 📩',
    likes: '96', verdict: 'remove', verdictLabel: 'SE ELIMINA',
    explain: '<b>Restricted Goods and Services</b>: no se permite que particulares compren, vendan o intercambien <b>medicamentos</b>, drogas u otros bienes regulados. Hablar de un medicamento o de su uso médico sí está permitido.',
  },
  {
    id: 'noticia', title: 'La noticia del grupo armado', user: 'diario.nexopolis', avatar: '🗞️', policies: ['doi'],
    image: { emoji: '🗞️🕊️', bg: 'linear-gradient(135deg,#334155,#0f172a)', caption: 'INFORME ESPECIAL' },
    caption: 'El grupo armado "Puño Gris" se atribuyó el ataque de ayer. Hablamos con las víctimas y con expertos. Rechazamos toda forma de violencia.',
    likes: '8.7 mil', verdict: 'keep', verdictLabel: 'SE QUEDA',
    explain: '<b>Dangerous Organizations and Individuals</b> permite <b>informar</b> sobre estos grupos, <b>condenarlos</b> o analizarlos. Lo que no se permite es glorificarlos, apoyarlos o hablar en su nombre. Este caso es periodismo con condena explícita.',
  },
  {
    id: 'empleo', title: 'La oferta de trabajo soñada', user: 'empleos.internacionales.ya', avatar: '✈️', policies: ['humanexp', 'commercial'],
    image: { emoji: '✈️💼', bg: 'linear-gradient(135deg,#0e7490,#ffd23f)', caption: '¡$5.000 AL MES · SIN EXPERIENCIA!' },
    caption: '¡Trabajo en el extranjero! Sin experiencia, $5.000 al mes 💸 Te pagamos el pasaje: solo envíanos una foto de tu pasaporte. Viaje la próxima semana. Cupos limitados ⏳',
    likes: '1.9 mil', verdict: 'remove', verdictLabel: 'SE ELIMINA',
    explain: 'Las ofertas engañosas que piden documentos y prometen viajes "pagados" son una forma común de captar víctimas. <b>Human Exploitation</b> prohíbe el contenido que facilita la trata o el trabajo forzoso. Si dudas, reporta: puede proteger una vida.',
  },
];

/* ---------------- MISIÓN 4: TELÉFONO VIRAL ---------------- */
const PHONE_MESSAGES = [
  'ÚLTIMA HORA: la alcaldesa Brillo confirmó que el martes 14 el puente de la Plaza Azul cerrará de 3 a 5 de la tarde por mantenimiento, pero el tren flotante será gratis para mayores de 60.',
  'Según el laboratorio de la Torre Espiral, los gatos naranjas del Puerto Verde NO transmiten el virus del glitch, pero recomiendan limpiar los visores VR dos veces por semana con agua tibia.',
  'El festival de la Nebulosa se pasa al sábado 22 porque se escaparon 3 dragones de neón; los boletos del viernes siguen sirviendo si los cambian antes del jueves al mediodía.',
];

/* ---------------- MISIÓN 5: CONTRASEÑA ---------------- */
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
  plaza:    { value: 'VOZ', text: 'Expresarnos es poderoso: conocer las Normas Comunitarias nos ayuda a hablar con libertad sin dañar a otros.' },
  puerto:   { value: 'SEGURIDAD', text: 'Pausa, verifica por otro canal y nunca compartas contraseñas ni códigos. Reporta y bloquea los anzuelos.' },
  isla:     { value: 'DIGNIDAD', text: 'La sátira y la crítica caben; exponer, acosar o poner en riesgo a personas, no.' },
  torre:    { value: 'AUTENTICIDAD', text: 'Antes de compartir: revisa la fuente, la fecha y el contexto. Si te genera emoción extrema, sospecha.' },
  nebulosa: { value: 'PRIVACIDAD', text: 'Haz la Revisión de privacidad, usa contraseñas únicas y activa la verificación en dos pasos.' },
};
