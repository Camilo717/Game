# 🔎 El Caso del Cristal Robado

**Un misterio por equipos, en red, sobre las Normas Comunitarias de Meta.**
Cada equipo juega desde **su propia computadora**, en lugares distintos y sin necesidad de videollamada. Una persona **moderadora** crea la sala y dirige el ritmo. Dura unos 45 minutos y admite de 2 a 8 equipos (recomendado: de 3 a 6).

> Nexópolis, 23:00. Alguien robó el **Cristal de la Confianza**, que se rompió en 5 fragmentos: **Voz, Seguridad, Dignidad, Autenticidad y Privacidad**.
> Los equipos (la Liga de Guardianes) juegan misiones para recuperarlos, ganan **pistas secretas** que llegan en privado a su pantalla, negocian en el **Mercado de Pistas**... y acusan a uno de 6 sospechosos.

Estilo visual: **cómic noir de detectives**, con papel envejecido, semitonos, tablero de corcho con polaroids y onomatopeyas. Todo está en español, excepto los **nombres oficiales de las políticas** y las **decisiones de moderación** (**REMOVE**, **NO VIOLATION** y **MARK AS DISTURBING**).

---

## 🎮 Las misiones

Todas se juegan **a la vez**: cada equipo en su computadora, con un marcador en vivo para la persona moderadora.

| Distrito | Misión | Cómo se juega | Inspiración |
|---|---|---|---|
| Plaza Azul | **Feed Frenético** | Llegan publicaciones reportadas y se sellan con las flechas: ← REMOVE · ↓ MARK AS DISTURBING · → NO VIOLATION. Hay combos, apelaciones de usuarios y una "IA asistente" que sugiere decisiones y **a veces se equivoca** | *Papers, Please*, *Moderator Mayhem* |
| Puerto Verde | **Caza de Anzuelos** | Mensajes que flotan en un puerto nocturno: hay que tocar **solo las estafas**. Tocar un mensaje real resta puntos | Juegos de reflejos |
| Isla Gradiente | **El Consejo** | Cada equipo elige la decisión para un caso difícil y escribe un argumento. Luego todos votan, en anónimo, el argumento más convincente. Al final se revela la decisión correcta | *Quiplash* (Jackbox) |
| Torre Espiral | **Rompe la Cadena** | Un rumor salta de usuario en usuario por una red: hay que verificarlos con energía limitada para frenarlo. **Bonus:** *Teléfono en cadena*, en el que cada equipo reescribe de memoria la noticia que le pasó el anterior | *Gartic Phone*, *Bad News* |
| Nebulosa Horizon | **Escáner de Privacidad** | Una linterna recorre un perfil a oscuras para encontrar los datos expuestos. Después viene una **carrera para abrir la bóveda** adivinando la contraseña con lo que publicó el cómplice | Juegos de objetos ocultos |

Además:
- **Capitanes y rotación:** cada equipo registra a su capitán ⭐ y a sus integrantes. En cada minijuego el juego anuncia **¡CAMBIO!** y dice a quién le toca, empezando por el capitán, así todos pasan por los controles bajo presión. También rota quién escribe en El Consejo.
- **Medición:** el juego registra la **precisión** y el **tiempo por decisión** de cada equipo y de cada integrante.
- **Reporte de oportunidades:** al final (o desde el menú ☰) la persona moderadora abre un reporte con las políticas con más errores del grupo, de cada equipo y de cada integrante. Se puede copiar, descargar en CSV o imprimir como PDF. Cada equipo ve además "Sus oportunidades" en la pantalla final.
- **Pistas privadas:** el mejor equipo de cada misión recibe su pista solo en su pantalla, y queda guardada en su *Libreta*.
- **Mercado de Pistas (en silencio):** se negocia por escrito, sin hablar de mesa a mesa, para no generar ruido en piso. Un equipo **ofrece** una pista verificada a cambio de corazones y el otro pulsa Aceptar o Rechazar: el juego hace el intercambio solo. Cada equipo tiene además solo **3 mensajes libres**, que llegan con el sello **SIN VERIFICAR** (ahí se puede mentir). Dura 3 minutos y la moderadora puede saltarlo.
- **Insignias:** se ganan logros como "Ojo de halcón", "Más listo que la IA" o "Hacker ético".
- **Archivo de Políticas:** cada misión desbloquea las políticas de su distrito.

---

## ▶️ Cómo jugar

### Opción A: ensayar en una sola computadora (sin configurar nada)
1. Abre `index.html` en Chrome.
2. Pulsa **Crear sala**: esa pestaña es la del moderador.
3. Abre el enlace del equipo en **otras pestañas del mismo navegador** (cada pestaña es un equipo).

Así funciona el **modo prueba**, ideal para conocer el juego antes del evento.

### Opción B: partida real, cada equipo en su computadora
Hacen falta dos cosas:
1. **Conectar Firebase** (gratis, unos 10 minutos; ver abajo).
2. **Publicar el juego en internet** para que todos abran el mismo enlace. Lo más fácil es GitHub Pages: en el repositorio, entra a **Settings → Pages → Deploy from a branch → `main` / `(root)`**. Quedará en `https://<tu-usuario>.github.io/<repositorio>/`. Si el repositorio es privado, GitHub Pages requiere un plan de pago.

El día del juego:
1. La persona moderadora abre el enlace y pulsa **Crear sala**. Aparece un **código de 4 letras**, un **código QR** y un enlace.
2. Cada equipo abre el enlace (o escribe el código) y registra su nombre, su **capitán**, sus integrantes, insignia y color.
3. En la sala de espera, la persona moderadora elige el **ritmo** de los minijuegos (Tranquilo, Normal o Rápido) y si habrá **rotación** de integrantes.
4. La persona moderadora controla todo desde la barra inferior: historia, mapa, misiones, pistas, mercado, acusación y final. El menú ☰ permite ajustar puntos o saltar al Mercado si el tiempo apremia.

> ⚠️ El artefacto de Claude no permite conexiones externas, así que ahí el juego solo funciona en modo prueba. Para jugar en red, usa GitHub Pages u otro hosting.

---

## 🔥 Conectar Firebase (paso a paso)

1. Entra a <https://console.firebase.google.com> con una cuenta de Google y pulsa **Crear un proyecto** (por ejemplo, `cristal-robado`). Google Analytics no hace falta.
2. En el menú izquierdo: **Compilación → Realtime Database → Crear base de datos**. Elige una ubicación y empieza en **modo bloqueado**.
3. En la pestaña **Reglas** de la base de datos, pega esto y pulsa **Publicar**:
   ```json
   {
     "rules": {
       "rooms": {
         "$code": { ".read": true, ".write": true }
       }
     }
   }
   ```
4. Ve a **Configuración del proyecto** (el engranaje) → **Tus apps** → el ícono **`</>`** (Web) → registra la app con cualquier nombre. Firebase te mostrará un bloque `firebaseConfig`.
5. Copia esos valores en **`js/config.js`**:
   ```js
   window.FIREBASE_CONFIG = {
     apiKey: 'AIza...',
     authDomain: 'cristal-robado.firebaseapp.com',
     databaseURL: 'https://cristal-robado-default-rtdb.firebaseio.com',
     projectId: 'cristal-robado',
     appId: '1:...:web:...',
   };
   ```
   Si `databaseURL` no aparece, cópiala de la parte superior de la página de Realtime Database.
6. Sube el cambio a GitHub. La portada ya no mostrará el aviso de "Modo prueba".

**Sobre la privacidad:** las reglas anteriores permiten que cualquiera que conozca el código de una sala lea y escriba en ella. Para un juego está bien: solo se guardan nombres de equipos, puntos y mensajes del juego. Después del evento puedes borrar los datos desde la consola de Firebase. El plan gratuito alcanza de sobra para varias partidas.

---

## 🗺️ Estructura (~45 min)

| Momento | Duración |
|---|---|
| Registro de equipos + historia en cómic + sospechosos + reglas | 6′ |
| Feed Frenético (60 s de juego, 3 turnos) | 4′ |
| Caza de Anzuelos (60 s de juego, 3 turnos; ritmo pausado para leer) | 4′ |
| El Consejo (2 o 3 casos) | 9′ |
| Rompe la Cadena (+ bonus opcional: Teléfono en cadena) | 4–8′ |
| Escáner de Privacidad (56 s, 2 turnos) + bóveda | 6′ |
| Mercado de Pistas (3 min) + acusación + revelación + podio | 7′ |
| Reporte de oportunidades y cierre | 3′ |

Los tiempos corresponden al ritmo **Normal**. Con **Tranquilo**, cada minijuego dura un 35 % más y los contenidos permanecen más tiempo en pantalla.

---

## 🧭 Recomendaciones para la sesión

- **Armar los equipos según resultados:** conviene mezclar perfiles y nombrar **capitanes a las personas con más oportunidad** en sus indicadores de calidad. Como capitanes juegan primero, confirman la acusación y se exponen más al proceso, que es donde más se aprende.
- **Contenido ficticio:** todo el contenido del juego es inventado. No se usan casos reales ni contenido de las colas de trabajo, así que la dinámica no afecta los requisitos de seguridad del cliente. Al personalizar `js/data.js`, mantengan esa regla.
- **Ruido en piso:** el Mercado de Pistas está pensado para jugarse en silencio. Si aun así se desordena, se puede saltar directo a la acusación.
- **Cierre:** usen el Reporte de oportunidades para dar feedback: qué políticas costaron más al grupo y a cada equipo, y cómo le fue a cada integrante en precisión y tiempo.

---

## 📚 Las 18 políticas

Cada misión desbloquea las de su distrito en el **Archivo de Políticas**:

| Distrito | Políticas |
|---|---|
| Plaza Azul | Hateful Conduct · Violence and Incitement · Dangerous Organizations and Individuals · Coordinating Harm and Promoting Crime |
| Puerto Verde | Cybersecurity · Prohibited Commercial Practices · Restricted Goods and Services · Human Exploitation 🛡️ |
| Isla Gradiente | Bullying and Harassment · Violent and Graphic Content · Suicide, Self-Injury, and Eating Disorders 🛡️ · Adult Nudity and Sexual Activity 🛡️ · Adult Sexual Solicitation and Sexually Explicit Language 🛡️ |
| Torre Espiral | Misinformation · Spam |
| Nebulosa Horizon | Privacy Violations · Adult Sexual Exploitation 🛡️ · Child Sexual Exploitation, Abuse, and Nudity 🛡️ |

🛡️ **Protección especial:** por respeto, estas políticas **no se juegan**. Aparecen en el Archivo con una explicación seria. Es un buen momento para que la persona moderadora haga una pausa y las comente.

---

## 🛠️ Personalizar

Todo el contenido está en **`js/data.js`**:
- las 18 políticas (`POLICIES`);
- las decisiones (`DECISIONS`): si tu equipo usa otros nombres, como DELETE o IGNORE, se cambian aquí;
- las publicaciones del Feed (`FEED_POSTS`) y los mensajes del mar (`SEA_MSGS`);
- los casos del Consejo (`COUNCIL_CASES`) y las noticias del teléfono (`PHONE_MESSAGES`);
- sospechosos, insignias (`BADGES`) y lecciones.

```
index.html          → estructura de la página
css/styles.css      → estilo cómic noir
js/config.js        → configuración de Firebase
js/data.js          → TODO el contenido del juego
js/net.js           → sincronización en red (Firebase o modo prueba)
js/games.js         → minijuegos arcade
js/art.js           → ilustraciones SVG (sospechosos y cristal)
js/icons.js         → íconos de game-icons.net
js/app.js           → flujo del juego (moderador y equipos)
vendor/             → Firebase y generador de códigos QR
```

---

## 🙏 Créditos

- Íconos: [game-icons.net](https://game-icons.net) (Lorc, Delapouite y colaboradores), licencia **CC BY 3.0**.
- Tipografías: Bangers, Special Elite, Permanent Marker y Barlow (Google Fonts, licencia OFL).
- Firebase JS SDK (Apache 2.0) y qrcode-generator (MIT).
- Ideas de diseño inspiradas en *Papers, Please*, *Moderator Mayhem* (Techdirt/Engine), *Quiplash* (Jackbox), *Gartic Phone*, *Bad News* (Universidad de Cambridge) y *Shadows of Doubt*.

## ⚠️ Aviso

Juego educativo de ficción. Nexópolis, sus personajes y sus casos son inventados, y no se usan logotipos oficiales. Las explicaciones son simplificaciones de las **Normas Comunitarias públicas de Meta**. Para la versión oficial y actualizada, consulta el **Centro de Transparencia de Meta**: <https://transparency.meta.com>.
