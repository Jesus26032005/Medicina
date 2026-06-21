# Estructura del Proyecto LifeSaver Arcade

## 1. Árbol de Directorios

```text
LifeSaver Arcade/
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.js
├── vercel.json
├── public/
│   ├── favicon.svg
│   └── audio/
│       ├── calm-down.mp3
│       ├── dynamite.mp3
│       ├── levitating.mp3
│       ├── sorry.mp3
│       ├── stayin-alive.mp3
│       └── uptown-funk.mp3
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── lib/
│   │   └── supabaseClient.js
│   └── components/
│       ├── auth/
│       │   ├── AuthPage.jsx
│       │   └── ProtectedRoute.jsx
│       ├── common/
│       │   ├── ClinicalEvidenceDisclosure.jsx
│       │   ├── Footer.jsx
│       │   ├── MedicalBackingModal.jsx
│       │   ├── MedicalBackingPage.jsx
│       │   ├── MedicalDisclaimer.jsx
│       │   ├── ScrollToTop.jsx
│       │   ├── ThemeToggle.jsx
│       │   └── VideoTutorialModal.jsx
│       ├── dashboard/
│       │   ├── GlobalEvidence.jsx
│       │   └── UserDashboard.jsx
│       └── games/
│           ├── BurnLab.jsx
│           ├── ChokingExpress.jsx
│           ├── RcpHero.jsx
│           ├── TacticalTriage.jsx
│           └── TourniquetCode.jsx
├── Auditoria_Medica_LifeSaver_Arcade.md
├── Documento_Auditoria_Aval_Clinico_LifeSaver_Arcade.md
├── Documento_Auditoria_Validacion_Medica_LifeSaver_Arcade_Sin_URLs.md
├── Directorio_Evidencia_y_Minijuegos.md
├── Respaldo_Medico_Enlaces.md
└── Validacion_Medica.md
```

## 2. Desglose Visual y Técnico por Archivo

### `src/App.jsx`

**¿Qué ve el usuario? (UI/UX)**

Es el contenedor principal de la aplicación. Define la navegación entre Login, Dashboard personal, Dashboard global, respaldo médico y minijuegos. También mantiene el `Footer` global visible al final de la app y evita el scroll horizontal con `max-w-[100vw] overflow-x-hidden`.

Si un usuario entra a una ruta de juego desconocida, se muestra una tarjeta protegida con el mensaje “Módulo de juego” y un botón para volver al dashboard.

**¿Qué hace el código? (Lógica)**

Usa `BrowserRouter`, `Routes`, `Route`, `Navigate` y `useParams` de React Router. Envuelve todo con `AuthProvider`, inserta `ScrollToTop` para reiniciar el scroll al cambiar de página y usa `ProtectedRoute` para bloquear `/dashboard` y `/games/:gameKey` si no hay sesión activa.

El `GameRouter` traduce el `gameKey` de la URL al componente correcto:

- `rcp_hero` → `RcpHero`
- `burn_lab` → `BurnLab`
- `tourniquet_code` → `TourniquetCode`
- `choking_express` → `ChokingExpress`
- `tactical_triage` → `TacticalTriage`

### `src/components/dashboard/UserDashboard.jsx`

**¿Qué ve el usuario? (UI/UX)**

El dashboard personal muestra una bienvenida, métricas individuales, gráfica de progreso, tarjetas de los minijuegos, ideas útiles generadas por IA o fallback local, acceso al dashboard global, testimonio público y buzón de sugerencias/quejas.

Visualmente usa tarjetas oscuras con bordes sutiles, gráficos de Recharts, botones con iconos de `lucide-react` y layout responsivo. El historial de progreso puede limitarse a las últimas 10, 25, 50 o 100 partidas.

**¿Qué hace el código? (Lógica)**

Usa `useAuth` para leer el usuario autenticado. Hace una consulta a Supabase:

```js
supabase
  .from('game_sessions')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: true });
```

Después calcula datos derivados con `useMemo`: progreso inicial/final, mejores puntajes, sesiones recientes y métricas por juego. También elimina duplicados consecutivos con una firma basada en `game_key`, precisión, errores y score.

Integra Gemini con `@google/generative-ai` para generar datos útiles y moderar testimonios. Si Gemini falla o no hay API key, usa datos locales de respaldo. El formulario de sugerencias envía un `POST` JSON a FormSubmit y el testimonio aprobado se guarda en Supabase.

### `src/components/games/RcpHero.jsx`

**¿Qué ve el usuario? (UI/UX)**

RCP Hero tiene una pantalla de briefing médico, selector de duración, selector de canción y una vista tipo monitor ECG. Durante el juego se ve un corazón animado, un anillo de ritmo, barra de progreso, pista seleccionada, telemetría en vivo y botón `Comprimir`.

La pantalla final muestra retroalimentación clínica, precisión inicial, precisión final, ritmo promedio, fallos, spam y score. Incluye botones para salir al dashboard o reintentar.

**¿Qué hace el código? (Lógica)**

El motor convierte el BPM de la canción en intervalo objetivo:

```text
intervalo_ms = 60000 / BPM
```

La playlist local incluye canciones como `Stayin' Alive`, `Levitating`, `Calm Down`, `Dynamite`, `Uptown Funk` y `Sorry`. El usuario puede elegir duración de 30, 60 o 120 segundos.

Usa `requestAnimationFrame` para actualizar el tiempo y detectar latidos. Cada compresión registra:

- tiempo transcurrido
- latido objetivo
- diferencia en ms contra el latido ideal
- precisión
- éxito/fallo

Tiene protección anti-spam con `MIN_INTERVAL_BETWEEN_PRESSES_MS = 250`. Si hay menos de 5 pulsaciones válidas, el score se fuerza a 0 por inactividad.

El score se calcula con una fórmula especializada:

- 65% precisión mecánica
- 35% adherencia al ritmo BPM
- penalización por errores, spam y latidos perdidos

Guarda en Supabase dentro de `game_sessions` con `game_key: 'rcp_hero'`, `initial_precision`, `final_precision`, `errors_count`, `score` y un objeto `telemetry`.

### `src/components/games/ChokingExpress.jsx`

**¿Qué ve el usuario? (UI/UX)**

Ahogo Express presenta primero una evaluación inicial del caso: descripción del paciente, recomendación clínica y dos botones principales:

- `Aplicar maniobra indicada`
- `No aplicar (animar a toser)`

Si la decisión es correcta y el caso requiere intervención, pasa a una fase interactiva con barra vertical, indicador móvil y figura del paciente. La zona de acción se marca visualmente sobre abdomen, pecho o pecho de bebé. El texto indica con claridad dónde actuar.

La pantalla final muestra decisión, precisión inicial/final, precisión mecánica, tiempo, score y nota clínica.

**¿Qué hace el código? (Lógica)**

El generador procedural combina:

- 4 contextos: restaurante, comedor de casa, calle, parque
- 4 tipos de paciente: adulto promedio, mujer embarazada, persona obesa, bebé menor de 1 año
- 2 niveles de obstrucción: parcial o completa

Esto produce 32 combinaciones base. Si la obstrucción es parcial, la respuesta correcta es no aplicar maniobra y animar a toser. Si es completa, la respuesta correcta es aplicar la maniobra indicada.

La zona mecánica cambia según el tipo de paciente:

- adulto promedio → abdomen
- embarazada/persona obesa → pecho
- bebé → golpes en espalda y compresiones en pecho

La barra QTE usa animación CSS pura (`heimlich-qte-sweep`) y el acierto se calcula leyendo la posición real del DOM con `getBoundingClientRect`. Requiere 5 aciertos.

Guarda resultados en Supabase con `game_key: 'choking_express'`, incluyendo la elección inicial, tipo de paciente, nivel de obstrucción, zona verde y muestras de ejecución.

### `src/components/games/TacticalTriage.jsx`

**¿Qué ve el usuario? (UI/UX)**

Tactical Triage muestra el Sistema de Triage de Manchester (MTS) con 5 botones de clasificación:

- Rojo: inmediato
- Naranja: muy urgente
- Amarillo: urgente
- Verde: estándar
- Azul: no urgente

El usuario ve una tarjeta clínica por paciente con conciencia, hemorragia, dolor, respiración, temperatura y dolor torácico. Tiene 20 segundos por paciente y clasifica 5 pacientes por partida.

**¿Qué hace el código? (Lógica)**

Usa un motor híbrido:

1. Casos fallback prehechos para asegurar escenarios clínicos sólidos.
2. Generador procedural Manchester para crear pacientes con variables aleatorias:
   - conciencia
   - hemorragia
   - dolor
   - dificultad respiratoria
   - temperatura
   - riesgo de dolor torácico

El algoritmo evalúa matemáticamente el nivel esperado. Por ejemplo:

- inconsciente o hemorragia exanguinante → rojo
- dificultad respiratoria severa, dolor severo o dolor torácico de alto riesgo → naranja
- dolor moderado, fiebre o dificultad respiratoria moderada → amarillo
- síntomas leves → verde
- sin síntomas agudos → azul

El score usa una fórmula universal:

```text
score = 40% decisión clínica + 40% precisión de clasificación + 20% tiempo restante
```

Guarda en Supabase con `game_key: 'tactical_triage'`, respuestas, pacientes generados, protocolo usado y telemetría.

### `src/components/games/TourniquetCode.jsx`

**¿Qué ve el usuario? (UI/UX)**

Código Torniquete presenta un caso de trauma, una barra de sangrado activo, barra de daño tisular, barra de tensión y botón `Aplicar presión`. El usuario ve colores dinámicos:

- presión insuficiente
- presión óptima
- peligro por exceso

El briefing explica la regla de colocación: 5-7 cm arriba de la herida y nunca sobre articulación.

**¿Qué hace el código? (Lógica)**

El juego parte de:

- `activeBleeding = 100`
- `pressureApplied = 0`
- `tissueDamage = 0`

Cada acción aumenta la presión según el caso clínico. La presión cae con el tiempo mediante un intervalo. Otro intervalo funciona como motor clínico:

- 65% a 85% de presión → baja el sangrado activo
- más de 85% → sube daño tisular
- menos de 65% → el sangrado no baja

La victoria ocurre cuando `activeBleeding <= 0`. El error crítico ocurre si `tissueDamage >= 100`.

El score usa la fórmula universal, penalizando el daño tisular y limitando gravemente el resultado si hay error crítico. Guarda en Supabase con `game_key: 'tourniquet_code'`, muestras de presión, sangrado, daño y zona.

### `src/components/games/BurnLab.jsx`

**¿Qué ve el usuario? (UI/UX)**

Burn Lab presenta un caso clínico de quemadura con título, mecanismo, aspecto de la lesión, selector de gravedad y bandeja de instrumental. El usuario clasifica la quemadura y selecciona herramientas como agua fría, gasa estéril, irrigación abundante, cepillado en seco o activar emergencias.

La interfaz muestra una zona de intervención con vector visual, respuesta de gravedad y corrección de instrumental debajo de la bandeja. Tiene feedback inmediato para aciertos, errores y mitos peligrosos.

**¿Qué hace el código? (Lógica)**

El módulo usa un banco amplio de casos clínicos para quemaduras:

- solares
- térmicas
- químicas líquidas
- químicas en polvo
- eléctricas
- fricción
- frío extremo
- alquitrán caliente
- inhalación de humo/vía aérea

Cada caso define:

- `severity`: primer, segundo o tercer grado
- `severityExplanation`
- `correctTools`
- `incorrectTools`
- `hint`
- mecanismo y descripción de herida

Evalúa dos cosas:

1. Clasificación de gravedad.
2. Selección de herramientas correctas.

El score final usa:

```text
score = 40% gravedad correcta + 40% herramientas correctas + 20% tiempo de respuesta
```

Guarda en Supabase con `game_key: 'burn_lab'`, precisión final, errores, score y telemetría detallada de herramientas, gravedad seleccionada y caso usado.

## 3. Flujo de Datos y Autenticación

La aplicación se conecta a Supabase mediante `src/lib/supabaseClient.js`, usando `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. El `AuthContext` carga la sesión inicial con `supabase.auth.getSession()` y escucha cambios con `supabase.auth.onAuthStateChange()`. El usuario inicia sesión o se registra desde `AuthPage.jsx`; si existe sesión activa, `ProtectedRoute.jsx` permite entrar al dashboard y a los juegos. Cada minijuego calcula su telemetría y al finalizar inserta un registro en `game_sessions`. Luego `UserDashboard.jsx` lee únicamente las sesiones del usuario autenticado, mientras `GlobalEvidence.jsx` consulta datos agregados para mostrar impacto global, usuarios, partidas, errores y testimonios.

## 4. Sistema de Diseño (UI Global)

LifeSaver Arcade usa Tailwind CSS como sistema de diseño principal. La estética general combina fondos oscuros tipo arcade médico (`bg-slate-950`, `bg-slate-900`), acentos clínicos en cyan, rose, emerald, orange y red, y tarjetas con bordes suaves (`rounded-lg`, `border`, `shadow-2xl`).

El diseño es mobile-first. Los contenedores usan `w-full`, `max-w-[100vw]`, `overflow-x-hidden`, `px-4`, `md:px-8`, `grid-cols-1`, `md:grid-cols-*` y botones táctiles con `touch-manipulation`, `select-none` y alturas mínimas. Para mejorar estabilidad visual en móvil se usan capas aisladas con `isolate`, aceleración de hardware con `transform-gpu` y la utilidad personalizada `translate-z-0`.

El archivo `src/index.css` define reglas globales para evitar scroll horizontal, aplicar transiciones a botones/enlaces, bloquear selección accidental en botones y animar el indicador del minijuego de Ahogo Express con `@keyframes heimlich-qte-sweep`.

Los modales de resultados y tutoriales mantienen una estética consistente: fondo superpuesto oscuro (`bg-black/70` o `bg-slate-950/80`), tarjetas con `max-h-[85dvh]`, `overflow-y-auto` y `overscroll-contain` para que en celular siempre se pueda leer todo y salir al dashboard.
