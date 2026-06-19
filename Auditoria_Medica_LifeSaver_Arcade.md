# Documento de Auditoria Medica

**Proyecto:** LifeSaver Arcade  
**Tipo:** Plataforma PWA de educacion medica gamificada en primeros auxilios  
**Fecha de auditoria:** 2026-06-19  
**Alcance:** Revision tecnico-clinica de los parametros, reglas de decision, telemetria y fuentes usadas en los minijuegos activos.

> **Aviso academico y etico:** LifeSaver Arcade es una simulacion educativa. No sustituye entrenamiento presencial certificado, criterio clinico profesional ni la activacion de servicios de emergencia. En una emergencia real, el primer paso debe ser llamar a los servicios de emergencia locales, por ejemplo 911.

---

## 1. Modelo General de Evaluacion

### Formula universal de score

Los minijuegos refactorizados usan una formula comun de 0 a 100:

```text
score = round(
  clamp(
    knowledgeDecision * 0.40 +
    mechanicalPrecision * 0.40 +
    timeResponse * 0.20,
    0,
    100
  )
)
```

Interpretacion:

- `knowledgeDecision`: calidad de la decision clinica o seleccion del protocolo.
- `mechanicalPrecision`: precision de la accion interactiva simulada.
- `timeResponse`: rapidez o adherencia temporal.
- `clamp(0, 100)`: evita valores fuera del intervalo academico.

### Persistencia de evidencia

Cada partida se guarda en `game_sessions` con:

- `game_key`
- `initial_precision`
- `final_precision`
- `completion_time_seconds`
- `errors_count`
- `score`
- `telemetry`

---

# Modulo 1: RCP Hero

Archivo auditado: `src/components/games/RcpHero.jsx`  
Identificador de base de datos: `rcp_hero`  
Video tutorial: `https://www.youtube.com/embed/O1AOt_s1NzM`

## Parametros Clinicos Utilizados

### Rango y canciones guia

El simulador acepta pistas dentro del rango clinico general de 100 a 120 compresiones por minuto. En el codigo actual, la playlist activa contiene:

| Pista | BPM | Intervalo por compresion |
|---|---:|---:|
| Stayin' Alive - Bee Gees | 103 | 582.52 ms |
| Levitating - Dua Lipa | 103 | 582.52 ms |
| Calm Down - Rema ft. Selena Gomez | 107 | 560.75 ms |
| Dynamite - BTS | 114 | 526.32 ms |
| Uptown Funk - Bruno Mars | 115 | 521.74 ms |
| Sorry - Justin Bieber | 100 | 600.00 ms |

La formula usada para cada pista es:

```text
beatIntervalMs = 60000 / targetBPM
```

### Duracion de la simulacion

El usuario puede seleccionar:

- Modo Practica: 30 segundos.
- Modo Estandar: 60 segundos.
- Modo AHA: 120 segundos.

La modalidad de 120 segundos se presenta como prueba de resistencia, ya que el codigo explica que la fatiga muscular aparece alrededor de los 2 minutos y que este periodo se usa como ciclo realista antes de cambiar de reanimador.

### Ventanas de precision

Constantes implementadas:

```text
SUCCESS_WINDOW_MS = 100
PRECISION_WINDOW_MS = 250
MIN_INTERVAL_BETWEEN_PRESSES_MS = 250
```

Interpretacion:

- Acierto perfecto: compresion dentro de +/- 100 ms del latido ideal.
- Precision continua: se calcula con una ventana de 250 ms.
- Anti-spam: si dos pulsaciones ocurren con menos de 250 ms entre ellas, la pulsacion se ignora como spam.

Formula de precision por latido:

```text
precision = clamp(100 - (absDelta / 250) * 100, 0, 100)
```

### Inicio vs Final

```text
initial_precision = promedio de precision de los primeros 10 segundos
final_precision = promedio de precision de los ultimos 10 segundos
```

Tambien se calcula:

```text
averageBPM = (attempts.length / durationMs) * 60000
bpmAdherence = clamp(100 - abs(averageBPM - targetBPM) * 5, 0, 100)
mechanicalPrecision = clamp(finalPrecision - spamAttempts * 2, 0, 100)
```

Score:

```text
knowledgeDecision = 100
mechanicalPrecision = finalPrecision - spamAttempts * 2
timeResponse = bpmAdherence
```

### Nota de alcance

El juego mide ritmo, constancia y sincronizacion. No evalua profundidad real de 5 a 6 cm ni retroceso toracico fisico, porque no hay sensor biomecanico.

## Justificacion Cientifica

Las guias de reanimacion recomiendan compresiones toracicas de alta calidad con frecuencia de 100 a 120 por minuto. El objetivo educativo del juego es fijar memoria auditiva y temporal: el usuario practica un ritmo cercano al recomendado con feedback inmediato. El uso de canciones con BPM conocido es una estrategia mnemotecnica frecuente para recordar la cadencia.

## Fuentes y Videos de Referencia

- American Heart Association - High Quality CPR: https://cpr.heart.org/en/resuscitation-science/high-quality-cpr
- American Heart Association - What is CPR: https://cpr.heart.org/en/resources/what-is-cpr
- American Red Cross - CPR Steps: https://www.redcross.org/take-a-class/cpr/performing-cpr/cpr-steps
- Manual MSD - RCP en adultos: https://www.msdmanuals.com/es/professional/cuidados-cr%C3%ADticos/paro-card%C3%ADaco-y-reanimaci%C3%B3n-cardiopulmonar-rcp/reanimaci%C3%B3n-cardiopulmonar-rcp-en-adultos
- Video tutorial usado en la app: https://www.youtube.com/watch?v=O1AOt_s1NzM

---

# Modulo 2: Choking Express / Heimlich

Archivo auditado: `src/components/games/ChokingExpress.jsx`  
Identificador de base de datos: `choking_express`  
Video tutorial: `https://www.youtube.com/embed/lsrrkUnf_JM`

## Parametros Clinicos Utilizados

### Requisito de exito

```text
REQUIRED_HITS = 5
```

El usuario debe conseguir 5 compresiones correctas en la zona indicada.

### Fase de evaluacion previa

Antes de comprimir, el usuario elige:

- `partial`: la persona tose/habla.
- `severe`: la persona no respira bien, no puede hablar o se agarra el cuello.

Regla clinica implementada:

- Si puede toser o hablar: no se realizan compresiones. Se anima a toser y se vigila.
- Si no puede hablar, toser ni respirar: se inicia maniobra segun el caso.

### Casos implementados

| Caso | Tipo | Zona objetivo | Rango visual |
|---|---|---|---|
| Obstruccion parcial: puede toser | Parcial | Animar a toser y vigilar | 0-0 |
| Adulto atragantado con comida | Grave | Compresion abdominal | 38-62 |
| Mujer embarazada u obeso | Grave | Compresion toracica | 66-90 |
| Nino pequeno | Grave | Compresion abdominal con menor fuerza | 36-62 |

Los rangos `greenMin` y `greenMax` son coordenadas porcentuales del simulador visual. No representan coordenadas anatomicas reales; modelan una zona de impacto educativa.

### Precision mecanica

La precision se calcula comparando la posicion del indicador con el centro de la zona objetivo:

```text
center = (greenMin + greenMax) / 2
distance = abs(positionPercent - center)
precision = clamp(100 - distance * 3.2, 0, 100)
```

La posicion se obtiene leyendo el DOM real con `getBoundingClientRect()`, evitando animacion basada en estado rapido de React.

### Score

- `knowledgeDecision`: decision correcta en la fase parcial/grave.
- `mechanicalPrecision`: promedio de precision de las compresiones.
- `timeResponse`: se reduce con el tiempo de resolucion.

## Justificacion Cientifica

La maniobra de desobstruccion depende del reconocimiento correcto. Si la victima puede toser, el manejo inicial recomendado es animar a toser, no comprimir. Si hay obstruccion grave, se aplican compresiones abdominales; en embarazadas u obesos se usan compresiones toracicas por seguridad y eficacia. En ninos se ajusta fuerza y control.

## Fuentes y Videos de Referencia

- Cruz Roja Americana - Choking First Aid: https://www.redcross.org/take-a-class/first-aid/performing-first-aid/choking-first-aid
- Mayo Clinic - Choking First Aid: https://www.mayoclinic.org/first-aid/first-aid-choking/basics/art-20056637
- Hospital Privado - Maniobra Heimlich: https://hospitalprivado.com.ar/programa-de-prevencion/maniobra-de-heimlich.html
- iLERNA - Maniobra de Heimlich en casos especiales: https://www.ilerna.es/blog/maniobra-de-heimlich-especiales
- Video tutorial usado en la app: https://www.youtube.com/watch?v=lsrrkUnf_JM

---

# Modulo 3: Tactical Triage / Protocolo START

Archivo auditado: `src/components/games/TacticalTriage.jsx`  
Identificador de base de datos: `tactical_triage`  
Video tutorial: `https://www.youtube.com/embed/_B4y6W59WNQ`

## Parametros Clinicos Utilizados

### Configuracion de juego

```text
PATIENTS_PER_GAME = 5
SECONDS_PER_PATIENT = 15
```

El juego muestra 5 pacientes por partida y concede 15 segundos para clasificar cada uno.

### Motor procedural START

El paciente se genera dinamicamente con:

```text
canWalk = chance(0.22)
noInitialBreathing = !canWalk && chance(0.18)
breathesAfterAirway = noInitialBreathing ? chance(0.45) : true
```

Frecuencias respiratorias posibles:

- Si camina: `[18, 20, 22, 24]`
- Si no camina: `[18, 22, 26, 28, 32, 36, 40]`
- Si recupera respiracion tras abrir via aerea: `[10, 12, 16]`
- Si no respira: `0`

Perfusion:

```text
capillaryRefill = [1, 2, 3, 4] o null
radialPulse = capillaryRefill <= 2 && chance(0.82)
```

Estado mental:

```text
mentalStatus = 'follows' | 'confused' | 'unconscious'
```

### Arbol de decision

```text
if canWalk -> VERDE
else if respiratoryRate === 0:
  if breathesAfterAirway -> ROJO
  else -> NEGRO
else if respiratoryRate > 30 -> ROJO
else if !radialPulse || capillaryRefill > 2 -> ROJO
else if mentalStatus !== 'follows' -> ROJO
else -> AMARILLO
```

### Inicio vs Final

```text
initial_precision = promedio de los primeros 2 pacientes
final_precision = promedio de los ultimos 2 pacientes
timeResponse = promedio de segundos restantes / 15 * 100
```

## Justificacion Cientifica

START prioriza decisiones rapidas en incidentes con multiples victimas. La regla "30 - 2 - Puede" resume respiracion, perfusion y estado mental. El simulador fuerza al usuario a evaluar marcha, respiracion, circulacion y obediencia a ordenes, reproduciendo el flujo logico basico del triage prehospitalario.

## Fuentes y Videos de Referencia

- CEMP - Protocolo START: https://www.cemp.es/noticias/triage-start/
- Revista Medica - Triage Prehospitalario: https://revistamedica.com/triage-start-prehospitalario/
- Video tutorial usado en la app: https://www.youtube.com/watch?v=_B4y6W59WNQ

---

# Modulo 4: Codigo Torniquete / Control de Hemorragias

Archivo auditado: `src/components/games/TourniquetCode.jsx`  
Identificador de base de datos: `tourniquet_code`  
Video tutorial: `https://www.youtube.com/embed/llgVqL8HyiI`

## Parametros Clinicos Utilizados

### Modelo de simulacion

```text
MAX_PRESSURE = 120
BLEEDING_START_PERCENT = 100
```

El objetivo no es alcanzar una "presion perfecta"; el objetivo es reducir:

```text
activeBleeding: 100% -> 0%
```

### Instruccion clinica visible

El briefing indica:

```text
Coloca el torniquete 5-7 cm arriba de la herida.
Nunca sobre una articulacion.
```

### Casos y umbrales simulados

| Caso | Perdida | Umbral de control |
|---|---|---:|
| Amputacion de brazo por maquinaria | Alta | 78 |
| Laceracion profunda en pierna por cristal | Media | 56 |
| Herida punzocortante en antebrazo | Moderada | 48 |
| Herida por arma de fuego en muslo | Muy alta | 88 |
| Corte profundo por motosierra en antebrazo | Alta | 74 |
| Mordedura grave de perro en pantorrilla | Media | 58 |

La app muestra una franja verde estimada desde `controlThreshold` hasta `112`, explicada como guia visual educativa, no como medicion clinica real.

### Eficiencia de control

```text
if pressure < controlThreshold * 0.55:
  efficiency = 0
else if pressure < controlThreshold:
  efficiency = round(clamp((pressure / controlThreshold) * 70, 0, 70))
else if pressure > 112:
  efficiency = 72
else:
  efficiency = round(clamp(78 + ((pressure - controlThreshold) / 34) * 22, 78, 100))
```

Actualizacion del sangrado:

```text
delta = isTwisting ? efficiency / 18 : -1.2
activeBleeding = clamp(activeBleeding - delta, 0, 100)
```

### Inicio vs Final

Las muestras guardan:

- `active_bleeding`
- `control_efficiency`
- `control_percent`
- `elapsed_ms`
- `pressure`

```text
initial_precision = promedio de control_percent del primer tercio
final_precision = promedio de control_percent del ultimo tercio
```

## Justificacion Cientifica

El torniquete se ensena como herramienta para hemorragia grave en extremidades cuando la presion directa no basta. El simulador prioriza tres ideas: posicionarlo por encima de la herida, no sobre articulaciones y ajustar hasta controlar el sangrado visible. Los numeros de presion son abstracciones educativas para modelar tension y respuesta, no valores medicos reales.

## Fuentes y Videos de Referencia

- Stop The Bleed: https://www.stopthebleed.org
- American College of Surgeons - Stop The Bleed: https://www.facs.org/quality-programs/trauma/education/stop-the-bleed/
- SAMUR Madrid - Control de Hemorragias: https://servpub.madrid.es/manualsamur/data/606_02.html
- Elsevier - Control de Hemorragia Externa: https://www.elsevier.es/es-revista-prehospital-emergency-care-edicion-espanola--44-articulo-control-hemorragia-externa-combate-X1888402409460652
- Video tutorial usado en la app: https://www.youtube.com/watch?v=llgVqL8HyiI

---

# Modulo 5: Burn Lab / Laboratorio de Quemaduras

Archivo auditado: `src/components/games/BurnLab.jsx`  
Identificador de base de datos: `burn_lab`  
Video tutorial: `https://www.youtube.com/embed/cECkv6xUuTY`

## Parametros Clinicos Utilizados

### Clasificacion de gravedad

El usuario debe seleccionar:

- `first`: 1er grado.
- `second`: 2do grado.
- `third`: 3er grado.

El score evalua simultaneamente:

1. Clasificacion correcta de gravedad.
2. Tratamiento inicial correcto.
3. Tiempo de respuesta.

### Casos clinicos programados

| Caso | Gravedad esperada | Clave descriptiva | Acciones correctas principales |
|---|---|---|---|
| Solar leve | 1er grado | Piel roja, seca, dolorosa, sin ampollas | Agua fria, gasa esteril, activar emergencias si extensa/empeora |
| Agua hirviendo | 2do grado | Ampollas intactas y dolor intenso | Agua fria, retirar joyeria, gasa esteril |
| Fuego directo | 2do grado | Ampollas y dolor fuerte | Apagar fuente, agua fria, gasa esteril |
| Acido clorhidrico | 2do grado | Piel humeda, ardor, ampollas pequenas | Retirar ropa, irrigacion abundante, emergencias |
| Cal viva en polvo | 2do grado | Polvo adherido, irritacion y posible ampolla | Cepillar polvo, cobertura seca, emergencias |
| Alto voltaje | 3er grado | Marca oscura/correosa y posible bajo dolor central | Emergencias, evaluar via aerea/estado general, gasa esteril |
| Friccion motocicleta | 2do grado | Piel abierta superficial, roja y humeda | Agua fria, gasa esteril, emergencias |
| Nitrogeno liquido | 2do grado | Piel palida/rigida y posible ampolla | Agua tibia, gasa esteril, emergencias |
| Solar grave | 2do grado | Ampollas extensas | Agua fria, gasa esteril, emergencias |
| Alquitran caliente | 3er grado | Material adherido, zonas blanquecinas/carbonizadas | Agua fria, no retirar alquitran, emergencias |
| Humo/via aerea | 3er grado | Hollin, ronquera, tos, cejas chamuscadas | Evaluar via aerea, emergencias, agua fria sin retrasar ayuda |

### Errores y mitos modelados

Se penalizan:

- Hielo: puede empeorar dano por frio y reducir flujo local.
- Mantequilla: atrapa calor y contamina.
- Pasta dental: irrita y contamina.
- Neutralizantes caseros: pueden generar reacciones no controladas.
- Agua sobre cal viva antes de cepillar: error critico por reaccion con agua.
- Retirar alquitran adherido: riesgo de arrancar tejido viable.

### Nota SDS/quimicos

En quemaduras quimicas se anade:

```text
Recuerda consultar la etiqueta o SDS del quimico si esta disponible,
sin retrasar la irrigacion.
```

En acidos liquidos se indica irrigacion abundante durante 15 a 30 minutos continuos.

### Score y telemetria

```text
severityScore = 100 si gravedad correcta
severityScore = 0 si gravedad incorrecta
severityScore = 40 si no clasifico
mechanicalPrecision = acciones correctas aplicadas / acciones correctas requeridas * 100
timeResponse = clamp(100 - completionTimeSeconds * 2, 20, 100)
```

No se muestra una metrica de `initial_precision` porque no hay linea base real en esta mecanica. Por compatibilidad con la tabla, el registro usa `initial_precision: 0`.

## Justificacion Cientifica

El manejo inicial de quemaduras depende del agente causal y profundidad aparente. Las quemaduras termicas se benefician de enfriamiento y cobertura limpia; las quimicas requieren retirada del agente y, cuando corresponde, irrigacion abundante; polvos reactivos como cal viva requieren retiro en seco antes de mojar; lesiones electricas y de humo se consideran graves por dano interno o compromiso de via aerea. La clasificacion por grados se basa en signos observables: eritema sin ampollas, ampollas/dolor, o piel profunda/correosa/carbonizada o con menor sensibilidad central.

## Fuentes y Videos de Referencia

- INSST - NTP 524 Quemaduras: https://www.insst.es/documentacion/colecciones-tecnicas/ntp-notas-tecnicas-de-prevencion/15-serie-ntp-numeros-506-a-540-ano-2000/ntp-524-primeros-auxilios-quemaduras
- SECIP - Protocolo de Quemados: https://secip.com/images/uploads/2020/11/Protocolo-de-Quemados-SECIP.pdf
- Universidad Complutense - Tratamiento de Quemaduras: https://www.ucm.es/data/cont/docs/420-2014-02-07-TRATAMIENTO-QUEMADURAS-15-Dic-2013.pdf
- Mayo Clinic - Chemical Burns First Aid: https://www.mayoclinic.org/first-aid/first-aid-chemical-burns/basics/art-20056667
- MedlinePlus - Quemaduras, atencion posterior: https://medlineplus.gov/spanish/ency/patientinstructions/000662.htm
- Video tutorial usado en la app: https://www.youtube.com/watch?v=cECkv6xUuTY

---

## 6. Limitaciones Clinicas Declaradas

- Los juegos son simulaciones educativas, no procedimientos clinicos reales.
- Los rangos visuales de Heimlich y torniquete son coordenadas de interfaz, no medidas anatomicas o fisicas.
- RCP Hero no mide profundidad, retroceso toracico, posicion exacta de manos ni calidad hemodinamica.
- Burn Lab simplifica gravedad por signos visibles; una quemadura real requiere evaluacion profesional.
- Tactical Triage reproduce START en forma pedagogica y no sustituye entrenamiento en incidentes con multiples victimas.

## 7. Conclusiones de Auditoria

LifeSaver Arcade traduce protocolos de primeros auxilios a mecanicas interactivas con parametros trazables en codigo. La telemetria permite registrar progreso, errores y evidencia de aprendizaje. Los modulos mantienen correspondencia educativa con fuentes publicas reconocidas, siempre bajo el marco de simulacion academica y con aviso de no sustitucion de atencion profesional.
