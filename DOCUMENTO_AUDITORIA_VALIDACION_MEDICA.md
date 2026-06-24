# Documento de Auditoría y Validación Médica: LifeSaver Arcade

**Desarrollador:** Martinez Alor Zaddkiel de Jesus, Beltran Saucedo Axel Alejandro, Gurrola Perez Natalia Annais

**Tipo de documento:** Auditoría técnico-clínica de lógica educativa

**Versión:** 1.1

**Fecha de revisión:** 23 de junio de 2026

**Estado:** Revisión técnica documentada; validación clínica institucional pendiente

---

## 1. Resumen Ejecutivo

**LifeSaver Arcade** es una plataforma web de simulación educativa diseñada para reforzar conocimientos de primeros auxilios mediante interacción, retroalimentación inmediata y toma de decisiones bajo presión.

El proyecto busca desarrollar dos capacidades:

1. **Memoria procedimental:** repetición de patrones de ritmo, selección y secuencia para facilitar el recuerdo de acciones esenciales.
2. **Toma de decisiones críticas:** identificación rápida de la conducta más segura ante escenarios simulados.

La plataforma incluye cinco módulos:

- **RCP Hero:** ritmo de compresiones torácicas.
- **Choking Express:** reconocimiento de obstrucción parcial o grave.
- **Tactical Triage MTS:** priorización hospitalaria en cinco niveles.
- **Tourniquet Code:** control simulado de hemorragias.
- **Burn Lab:** reconocimiento del agente causante y atención inicial de quemaduras.

Cada módulo transforma objetivos educativos en variables observables, como precisión, tiempo de respuesta, errores, decisiones críticas y puntuación final.

> **Aviso médico y de seguridad**
>
> LifeSaver Arcade es una herramienta exclusivamente educativa y de simulación. No proporciona diagnóstico, prescripción, certificación profesional ni orientación clínica individual. No sustituye cursos acreditados, práctica con maniquíes, protocolos institucionales, valoración por personal sanitario ni la activación de los servicios de emergencia.
>
> Ante una emergencia real se debe priorizar la seguridad de la escena, solicitar ayuda profesional y seguir las instrucciones del sistema local de emergencias.

### 1.1 Alcance de la auditoría

Esta auditoría verifica:

- Coherencia entre la lógica implementada y el objetivo pedagógico.
- Trazabilidad de constantes, reglas y fórmulas.
- Comportamiento esperado ante entradas válidas, inválidas y críticas.
- Correspondencia entre la interfaz, la telemetría y la puntuación.
- Separación entre métricas de videojuego y magnitudes clínicas reales.
- Presencia de advertencias y evidencia clínica de respaldo.

### 1.2 Límites de la validación

El documento registra una **revisión técnico-algorítmica con finalidad académica**. No equivale a certificación sanitaria, autorización regulatoria ni aval médico institucional.

La carta de revisión emitida por **Fanas, Médico JP**, respalda el análisis técnico y didáctico del proyecto dentro de los límites expresados en dicho documento. Para uso docente formal o asistencial se requiere revisión institucional, control de versiones clínicas, pruebas con usuarios y autorización de las instancias correspondientes.

---

## 2. Análisis Técnico y Casos de Prueba

### 2.1 RCP Hero

#### Objetivo clínico-educativo

RCP Hero entrena la conservación de un ritmo estable de compresiones. Para una persona adulta, la American Heart Association establece una frecuencia objetivo de **100 a 120 compresiones por minuto**, además de profundidad adecuada, interrupciones mínimas y retroceso completo del tórax.

La música se utiliza únicamente como metrónomo mnemónico. Mantener el tempo de una canción no demuestra por sí mismo profundidad, posición de manos, retroceso torácico, seguridad de la escena o uso correcto de un DEA.

#### Conversión de BPM a milisegundos

El intervalo entre pulsos se calcula mediante:

```text
intervalo_ms = 60 000 / BPM
```

Para *Stayin' Alive*, configurada en `103 BPM`:

```text
intervalo_ms = 60 000 / 103
intervalo_ms = 582.524271...
intervalo_ms ≈ 582.52 ms
```

La ventana de `100–120 BPM` equivale a:

```text
100 BPM → 600.00 ms por compresión
120 BPM → 500.00 ms por compresión
```

Por tanto, el intervalo educativo objetivo se encuentra entre **500 y 600 ms por compresión**.

#### Precisión temporal

La diferencia entre la pulsación y el pulso musical más próximo se calcula así:

```text
delta_ms = tiempo_real_ms - tiempo_objetivo_ms
precision = limitar(100 - (|delta_ms| / 300) × 100, 0, 100)
acierto = |delta_ms| ≤ 140 ms
```

- Una desviación de hasta `±140 ms` se registra como acierto.
- Una desviación de `300 ms` o más produce precisión igual a `0`.
- La precisión inicial corresponde a los primeros `10 segundos`.
- La precisión final corresponde a los últimos `10 segundos`.

#### Regla anti-spam

Dos pulsaciones separadas por menos de `250 ms` representan una frecuencia instantánea superior a:

```text
BPM_equivalente = 60 000 / 250 = 240 BPM
```

La segunda pulsación:

- No se contabiliza como compresión válida.
- Incrementa `spamAttempts`.
- Reduce la precisión mecánica final en `2 puntos`.
- Se incorpora al total de errores.

Esta regla es una aproximación digital al tiempo mínimo entre pulsaciones. **No mide físicamente el retroceso torácico**; esa validación requiere un maniquí o sensor.

#### Puntuación

RCP Hero utiliza una fórmula especializada:

```text
puntuación_bruta = 0.65 × precisión_mecánica
                 + 0.35 × adherencia_BPM

penalización_error = limitar((errores / latidos_totales) × 35, 0, 35)

puntuación_final = limitar(
  puntuación_bruta - penalización_error,
  0,
  100
)
```

#### Casos de prueba

| Identificador | Entrada | Resultado esperado |
|---|---|---|
| RCP-01 | Pista a `103 BPM` | Intervalo objetivo `≈582.52 ms` |
| RCP-02 | Desviación menor o igual a `140 ms` | Pulsación válida |
| RCP-03 | Segunda pulsación `180 ms` después | Se rechaza como spam |
| RCP-04 | Ritmo promedio entre `100–120 BPM` | Adherencia de ritmo máxima |
| RCP-05 | Menos de cinco pulsaciones válidas | Sesión fallida por inactividad |

---

### 2.2 Choking Express

#### Objetivo clínico-educativo

El módulo modela un árbol de decisiones para obstrucción de vía aérea por cuerpo extraño. La primera decisión consiste en determinar si la obstrucción es parcial o grave.

```text
¿La persona puede hablar, llorar, toser con fuerza o mover aire?
├── Sí → Obstrucción parcial
│   ├── Animar a toser
│   ├── Vigilar
│   └── Activar emergencias si empeora
└── No → Obstrucción grave
    ├── Adulto promedio → maniobra indicada en zona abdominal
    ├── Embarazo o abdomen no rodeable → zona torácica
    └── Bebé menor de un año → espalda y tórax
```

La acción inicial se determina mediante:

```text
si obstructionLevel == "partial":
    acción_correcta = "No aplicar; animar a toser"

si obstructionLevel == "complete":
    acción_correcta = "Aplicar la maniobra indicada"
```

#### Puntuación

```text
puntuación = 0.40 × decisión_inicial
           + 0.40 × precisión_mecánica
           + 0.20 × rapidez
```

Aplicar una maniobra cuando la persona todavía puede toser constituye un error crítico y produce puntuación `0`.

#### Casos de prueba

| Identificador | Escenario | Resultado esperado |
|---|---|---|
| CHK-01 | Tos fuerte, voz y entrada de aire | Animar a toser |
| CHK-02 | Embarazo y obstrucción grave | Seleccionar zona torácica |
| CHK-03 | Bebé con obstrucción grave | Espalda y tórax |
| CHK-04 | Maniobra aplicada durante obstrucción parcial | Error crítico |

> **Control de actualización:** la secuencia representada debe revisarse cuando cambien las guías clínicas aplicables.

---

### 2.3 Tactical Triage MTS

#### Objetivo clínico-educativo

Tactical Triage utiliza una simplificación del **Manchester Triage System (MTS)**. El triage establece prioridad y tiempo objetivo; **no establece un diagnóstico**.

| Nivel | Color | Prioridad representada |
|---:|---|---|
| 1 | Rojo | Inmediata / riesgo vital |
| 2 | Naranja | Muy urgente / `10 min` |
| 3 | Amarillo | Urgente / `60 min` |
| 4 | Verde | Estándar / `120 min` |
| 5 | Azul | No urgente / `240 min` |

#### Jerarquía de discriminadores

El primer nivel aplicable determina la clasificación:

```text
1. Inconsciencia o hemorragia exanguinante
   → ROJO

2. Dificultad respiratoria severa, hemorragia mayor controlable,
   dolor severo, dolor torácico de alto riesgo o respuesta al dolor
   → NARANJA

3. Dificultad respiratoria moderada, dolor moderado,
   constantes alteradas o respuesta a la voz
   → AMARILLO

4. Dolor leve o hemorragia menor
   → VERDE

5. Ausencia de síntomas agudos
   → AZUL
```

#### Ejemplo

```text
consciencia = alerta
hemorragia = mayor_controlable
dolor = moderado
respiración = sin dificultad
temperatura = normal
```

La hemorragia mayor controlable determina **NARANJA**, aunque el dolor moderado también satisfaga un criterio amarillo, porque prevalece el nivel de mayor urgencia.

#### Puntuación

```text
puntuación = 0.40 × decisión_clínica
           + 0.40 × precisión_de_clasificación
           + 0.20 × tiempo_restante
```

#### Casos de prueba

| Identificador | Discriminador principal | Resultado esperado |
|---|---|---|
| MTS-01 | Inconsciencia | Rojo |
| MTS-02 | Hemorragia exanguinante | Rojo |
| MTS-03 | Dolor torácico de alto riesgo | Naranja |
| MTS-04 | Dolor moderado y fiebre | Amarillo |
| MTS-05 | Condición estable sin síntomas agudos | Azul |

> **Limitación:** el MTS real utiliza diagramas de presentación y discriminadores sujetos a formación, licencia y gobernanza clínica. La lógica del simulador es una abstracción educativa y no debe utilizarse para clasificar pacientes reales.

---

### 2.4 Tourniquet Code

#### Objetivo clínico-educativo

El módulo entrena el mantenimiento de una entrada dentro de una zona objetivo mientras reduce el sangrado simulado y evita penalizaciones por presión insuficiente o excesiva.

#### Constantes del simulador

```text
presión_mínima_ideal = 65 %
presión_máxima_ideal = 85 %
sangrado_inicial = 100 %
daño_tisular_crítico = 100 %
penalización_por_error = 5 puntos técnicos
```

Cada pulsación aumenta la presión entre `9 y 13 puntos`, según el caso. La presión disminuye `4 puntos cada 140 ms` y el sistema evalúa su estado cada `500 ms`.

#### Modelo matemático

```text
si 65 ≤ presión ≤ 85:
    sangrado = máximo(0, sangrado - 5)

si presión > 85:
    daño_tisular = mínimo(100, daño_tisular + 10)

si presión < 65:
    el sangrado no disminuye
    se registra un error aproximadamente cada 1.8 segundos
```

La técnica final se calcula mediante:

```text
penalización_error = errores × 5

penalización_tisular_no_crítica = daño_tisular × 0.25

técnica = máximo(
  0,
  precisión_final - penalización_tisular - penalización_error
)
```

La puntuación general utiliza:

```text
puntuación = 0.40 × decisión_clínica
           + 0.40 × técnica
           + 0.20 × tiempo
```

Si el daño tisular alcanza `100 %`:

- Se registra un error crítico.
- Se utiliza la penalización tisular completa.
- El componente de tiempo se establece en `0`.
- La puntuación total queda limitada a `25`.

> **Interpretación del porcentaje**
>
> El intervalo `65–85 %` es una variable normalizada de jugabilidad. No representa milímetros de mercurio, fuerza en newtons, tensión de banda ni una presión clínica universal.
>
> En una emergencia real, un torniquete adecuado se aprieta hasta detener el sangrado potencialmente mortal. La escala del juego no debe interpretarse como prescripción clínica ni como indicación para aflojar un dispositivo real.

#### Casos de prueba

| Identificador | Entrada | Resultado esperado |
|---|---|---|
| TRQ-01 | Presión simulada de `75 %` | Sangrado `−5` por ciclo |
| TRQ-02 | Presión simulada de `92 %` | Daño tisular `+10` por ciclo |
| TRQ-03 | Presión menor a `65 %` sostenida | Un error cada `≈1.8 s` |
| TRQ-04 | Dos errores por presión insuficiente | Penalización técnica de `10 puntos` |
| TRQ-05 | Daño tisular de `100 %` | Error crítico y puntuación limitada |

---

### 2.5 Burn Lab

#### Objetivo clínico-educativo

Burn Lab relaciona:

1. **Agente causante:** térmico, químico líquido, químico seco, eléctrico, frío, alquitrán o humo.
2. **Presentación simulada:** eritema, ampollas, pérdida de sensibilidad, carbonización o datos de compromiso respiratorio.
3. **Conducta inicial:** retirar la fuente, enfriar, descontaminar, cubrir, evaluar vía aérea o activar emergencias.

```text
tratamiento_correcto = f(
  agente,
  estado_físico,
  gravedad,
  extensión,
  localización,
  vía_aérea
)
```

#### Precisión de herramientas

La precisión penaliza las selecciones incorrectas:

```text
precisión = herramientas_correctas_aplicadas
          / total_de_herramientas_seleccionadas
          × 100
```

Ejemplos:

```text
3 correctas y 0 incorrectas → 100 %
3 correctas y 1 incorrecta  → 75 %
3 correctas y 2 incorrectas → 60 %
```

#### Nota sobre la precisión inicial

Burn Lab no utiliza una fase inicial continua. Para mantener compatibilidad con el esquema general de telemetría:

```text
initial_precision = 0
```

Este valor significa **“no aplica”**. No representa un fallo ni una calificación inicial real del usuario.

#### Puntuación

```text
puntuación = 0.40 × clasificación_de_gravedad
           + 0.40 × precisión_de_herramientas
           + 0.20 × rapidez
```

#### Matriz simplificada

| Agente o escenario | Conducta educativa principal | Conducta que debe evitarse |
|---|---|---|
| Térmico | Detener la fuente, enfriar y cubrir | Hielo directo, mantequilla o pasta dental |
| Químico líquido | Retirar ropa contaminada e irrigar | Neutralizantes caseros |
| Químico seco | Retirar cuidadosamente el exceso antes de irrigar según la sustancia | Añadir agua sin identificar el producto |
| Cal viva | Retirada en seco y ayuda especializada | Mojar antes de retirar el polvo |
| Eléctrico | Asegurar la escena, activar emergencias y evaluar funciones vitales | Tocar antes de cortar la fuente |
| Inhalación de humo | Priorizar vía aérea y activar emergencias | Limitarse a tratar la piel |

#### Casos de prueba

| Identificador | Escenario | Resultado esperado |
|---|---|---|
| BRN-01 | Escaldadura con ampollas | Enfriamiento y cobertura limpia |
| BRN-02 | Químico líquido corrosivo | Retirar ropa e irrigar |
| BRN-03 | Polvo reactivo | Retirada cuidadosa en seco |
| BRN-04 | Lesión eléctrica | Seguridad de escena y emergencias |
| BRN-05 | Tres herramientas correctas y una incorrecta | Precisión de `75 %` |

---

## 3. Modelo de Evaluación

### 3.1 Fórmula común

Choking Express, Tactical Triage, Tourniquet Code y Burn Lab emplean una combinación de tres componentes normalizados:

```text
puntuación = redondear(
  0.40 × conocimiento
  + 0.40 × técnica
  + 0.20 × respuesta_temporal
)
```

El resultado se limita al intervalo `[0, 100]`.

### 3.2 Correspondencia por módulo

| Módulo | Conocimiento | Técnica | Respuesta temporal |
|---|---|---|---|
| Choking Express | Decisión parcial/grave | Zona y precisión mecánica | Rapidez |
| Tactical Triage | Decisión clínica | Precisión de clasificación | Tiempo restante |
| Tourniquet Code | Control de hemorragia | Presión útil menos penalizaciones | Tiempo |
| Burn Lab | Clasificación de gravedad | Precisión de herramientas | Tiempo de resolución |

RCP Hero utiliza una fórmula especializada basada en precisión temporal, adherencia al ritmo y penalización proporcional por errores.

### 3.3 Reglas de normalización

- Cada componente se limita a `[0, 100]`.
- El redondeo se realiza al finalizar el cálculo.
- Las acciones críticas pueden limitar la puntuación máxima.
- Las penalizaciones deben conservar trazabilidad en telemetría.
- Una métrica de juego no debe presentarse como magnitud fisiológica real.

---

## 4. Matriz General de Aceptación

| Identificador | Requisito | Criterio de aceptación |
|---|---|---|
| AUD-01 | RCP entre `100–120 BPM` | Adherencia de ritmo máxima |
| AUD-02 | Anti-spam RCP | Entradas menores a `250 ms` se rechazan |
| AUD-03 | Obstrucción parcial | Se exige animar a toser |
| AUD-04 | Embarazo con obstrucción grave | Se selecciona zona torácica |
| AUD-05 | MTS jerárquico | Prevalece el discriminador más urgente |
| AUD-06 | Presión insuficiente en torniquete | Registra errores y penaliza técnica |
| AUD-07 | Exceso de presión en torniquete | Incrementa daño tisular |
| AUD-08 | Precisión de Burn Lab | Incluye selecciones incorrectas |
| AUD-09 | Precisión inicial de Burn Lab | Se documenta como “no aplica” |
| AUD-10 | Puntuaciones | Permanecen dentro de `[0,100]` |
| AUD-11 | Disclaimer | Visible antes o durante cada experiencia |
| AUD-12 | Evidencia clínica | Disponible por módulo |

---

## 5. Conclusiones de Auditoría

La arquitectura de LifeSaver Arcade es adecuada para un entorno de **aprendizaje basado en simulación**, porque convierte objetivos educativos en reglas verificables y conserva telemetría sobre decisiones, precisión, errores, tiempo y puntuación.

La revisión permite concluir que:

- RCP Hero implementa correctamente la conversión BPM–milisegundos y una regla anti-spam verificable.
- Choking Express distingue obstrucción parcial y grave y adapta la zona según el tipo de paciente.
- Tactical Triage aplica una jerarquía determinista de cinco niveles.
- Tourniquet Code penaliza presión insuficiente, exceso sostenido y daño tisular.
- Burn Lab relaciona agente, gravedad y conducta inicial, y su precisión penaliza herramientas incorrectas.
- Las interfaces incluyen advertencias sobre el carácter educativo del sistema.
- Las métricas normalizadas del simulador se distinguen de parámetros clínicos reales.

### Recomendaciones

- Mantener control de versiones de las guías clínicas.
- Ejecutar pruebas de usabilidad con estudiantes y profesionales sanitarios.
- Incorporar pruebas automatizadas para fórmulas y casos críticos.
- Revisar la accesibilidad por teclado, contraste y dispositivos móviles.
- Mantener la distinción entre revisión técnica y aval clínico institucional.

---

## 6. Referencias Clínicas y Técnicas

1. American Heart Association. **2025 Guidelines — Part 7: Adult Basic Life Support.**  
   <https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support>

2. American Heart Association. **Adult Foreign-Body Airway Obstruction Algorithm.**  
   <https://cpr.heart.org/-/media/CPR-Files/CPR-Guidelines-Files/2025-Algorithms/Algorithm-BLS-Adult-FBAO-250630.pdf?sc_lang=en>

3. American Heart Association y American Red Cross. **2024 Guidelines for First Aid.**  
   <https://cpr.heart.org/en/resuscitation-science/2024-first-aid-guidelines>

4. Manchester Triage Group. **Manchester Triage System.**  
   <https://www.triage.nl/en/manchester-triage-system/>

5. World Health Organization. **Burns.**  
   <https://www.who.int/news-room/fact-sheets/detail/burns>

6. Centers for Disease Control and Prevention, NIOSH. **First Aid Procedures for Chemical Hazards.**  
   <https://www.cdc.gov/niosh/npg/firstaid.html>

7. American College of Surgeons. **STOP THE BLEED®.**  
   <https://www.stopthebleed.org/>

---

## 7. Registro de Revisión y Aprobación

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| Desarrollador responsable | Zaddkiel de Jesus Martinez Alor | ____________________ | ____________________ |
| Revisor técnico | ____________________ | ____________________ | ____________________ |
| Revisor clínico | Fanas, Médico JP | ____________________ | ____________________ |
| Responsable académico | ____________________ | ____________________ | ____________________ |
