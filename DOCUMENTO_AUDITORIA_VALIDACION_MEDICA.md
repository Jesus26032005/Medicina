**Documento de Auditoría y Validación Médica: LifeSaver Arcade**  
**Desarrollador:** Zaddkiel de Jesus Martinez Alor (ESCOM-IPN)  
   
 **Tipo de documento:** Auditoría técnico-clínica de lógica educativa  
   
 **Versión:** 1.0  
   
 **Fecha de revisión:** 23 de junio de 2026  
   
 **Estado:** Validación técnica documentada; revisión clínica externa pendiente  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OMQ2AABAAsSNBCkLfE07YGfHAiAU2QtIq6DIzW7UHAMBfnGt1V8fXEwAAXrse4eQF6VhvmPsAAAAASUVORK5CYII=)  
**1. Resumen Ejecutivo**  
**LifeSaver Arcade** es un simulador educativo de primeros auxilios diseñado para reforzar dos capacidades:  
1. **Memoria procedimental o “memoria muscular”:** repetición de patrones de interacción, ritmo y secuencia para facilitar el recuerdo de acciones esenciales.  
2. **Toma de decisiones bajo presión:** presentación de escenarios con tiempo limitado, retroalimentación inmediata y penalización de conductas inseguras.  
La plataforma emplea minijuegos con reglas deterministas, telemetría y puntuaciones de 0 a 100. Cada módulo transforma una recomendación educativa en variables observables, como precisión temporal, selección de conducta, mantenimiento de una zona objetivo, errores críticos y constancia de respuesta.  
***Aviso médico y de seguridad***  
*LifeSaver Arcade es una * ***herramienta educativa y de simulación*** *. No proporciona diagnóstico, prescripción, certificación profesional ni orientación clínica individual. No sustituye cursos acreditados, práctica con maniquíes, protocolos in* *stitucionales, valoración por personal sanitario ni la activación de los servicios de emergencia. Ante una emergencia real se debe priorizar la seguridad de la escena, solicitar ayuda profesional y seguir las instrucciones del sistema local de emergencias.*  
**1.1 Alcance de la auditoría**  
Esta auditoría verifica:  
- Coherencia entre la lógica programada y el objetivo pedagógico.  
- Trazabilidad de reglas, constantes y fórmulas.  
- Comportamiento esperado ante entradas válidas, inválidas y críticas.  
- Separación entre una **métrica de videojuego** y una  **magnitud clínica real**.  
- Correspondencia general con fuentes de la American Heart Association (AHA), American Red Cross, Manchester Triage System y organismos de salud.  
**1.2 Límites de la validación**  
El presente documento **no equivale a aval médico institucional**. La liberación para uso docente formal requiere revisión y firma de un profesional sanitario competente, control de versión de las guías y pruebas de usabilidad con la población objetivo.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OMQ2AABAAsSNBCkLfFDZwwIgHRiywEZJWQZeZ2ao9AAD+4lyruzq+ngAA8Nr1AOH0BedHjjlfAAAAAElFTkSuQmCC)  
**2. Análisis Técnico y Casos de Prueba (Lógica y Matemáticas)**  
**2.1 RCP Hero**  
***Objetivo clínico-educativo***  
El módulo entrena la conservación de un ritmo estable de compresiones torácicas. Para una persona adulta, la AHA establece una frecuencia objetivo de **100 a 120 compresiones por minuto**, junto con profundidad adecuada, interrupciones mínimas y retroceso completo del tórax.  
La música funciona únicamente como **metrónomo**. Mantener el tempo de una canción no demuestra por sí solo profundidad, posición de manos, retroceso torácico, seguridad de la escena o uso correcto de un DEA.  
***Conversión de BPM a milisegundos***  
El intervalo temporal entre pulsos se calcula mediante:  
intervalo_ms = 60 000 ms / BPM  
   
Para *Stayin' Alive*, configurada en el simulador a 103 BPM:  
intervalo_ms = 60 000 / 103  
 intervalo_ms = 582.524271...  
 intervalo_ms ≈ 582.52 ms  
   
Por tanto, el usuario debe realizar aproximadamente una compresión cada **582.52 ms** para coincidir con el pulso objetivo de esa pista.  
La ventana AHA puede expresarse temporalmente como:  
100 BPM → 60 000 / 100 = 600.00 ms por compresión  
 120 BPM → 60 000 / 120 = 500.00 ms por compresión  
   
El intervalo educativo aceptable se encuentra, por tanto, entre **500 y 600 ms por compresión**.  
***Precisión mecánica y ventana de acierto***  
La implementación calcula la diferencia absoluta entre la pulsación y el pulso musical más próximo:  
delta_ms = tiempo_real_ms - tiempo_objetivo_ms  
 precision = limitar(100 - (|delta_ms| / 300) × 100, 0, 100)  
 acierto = |delta_ms| ≤ 140 ms  
   
Una pulsación dentro de ±140 ms se registra como acierto. Una desviación de 300 ms o más produce precisión igual a 0.  
***Regla anti-spam de 250 ms***  
Dos pulsaciones separadas por menos de 250 ms implicarían una frecuencia instantánea superior a:  
BPM_equivalente = 60 000 / 250 = 240 BPM  
   
Esta velocidad es incompatible con la ventana educativa de 100–120 BPM. Por ello, la segunda pulsación:  
- No se contabiliza como compresión válida.  
- Incrementa el contador spamAttempts.  
- Reduce la precisión mecánica final en 2 puntos por intento.  
- Se incorpora al total de errores.  
La regla representa una salvaguarda contra entradas repetidas sin retroceso suficiente. **No mide físicamente el retroceso torácico**; solo detecta un intervalo digital demasiado corto. La validación real del retroceso requiere un maniquí o sensor de desplazamiento/fuerza.  
***Caso de prueba RCP-01: ritmo correcto***  
| | |  
|-|-|  
| **Entrada** | **Resultado esperado** |   
| Pista a 103 BPM | Intervalo objetivo ≈ 582.52 ms |   
| Pulsaciones cada 580–585 ms | Ritmo dentro de 100–120 BPM |   
| Desviación menor o igual a 140 ms | Pulsaciones válidas |   
| Separación mayor o igual a 250 ms | Sin penalización anti-spam |   
   
   
   
***Caso de prueba RCP-02: spam***  
| | |  
|-|-|  
| **Entrada** | **Resultado esperado** |   
| Primera pulsación válida | Se registra normalmente |   
| Segunda pulsación 180 ms después | Se rechaza |   
| Contador de spam | +1 |   
| Efecto clínico-pedagógico | Retroalimentación de velocidad excesiva |   
   
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OUQmAABBAsSeYxZyXSzCJASxgACv4J8KWYMvMbNURAAB/ca7VXe1fTwAAeO16AKe+BdmJqrPdAAAAAElFTkSuQmCC)  
**2.2 Choking Express**  
***Objetivo clínico-educativo***  
El módulo modela un árbol de decisiones para obstrucción de vía aérea por cuerpo extraño. La primera decisión no es “qué maniobra ejecutar”, sino determinar si existe **obstrucción parcial/leve** o  **obstrucción grave/completa**.  
***Árbol de decisión***  
¿La persona puede hablar, llorar, toser con fuerza o mover aire?  
 ├── Sí → Obstrucción parcial  
 │   ├── Animar a toser  
 │   ├── Vigilar de cerca  
 │   └── Activar emergencias si empeora  
 └── No → Obstrucción grave  
     ├── Adulto promedio → golpes dorsales y compresiones abdominales  
     ├── Embarazo avanzado o abdomen no rodeable → compresiones torácicas  
     ├── Bebé menor de un año → golpes dorsales y compresiones torácicas  
     └── Si pierde la respuesta → activar emergencias e iniciar el protocolo correspondiente  
   
La implementación evalúa primero:  
si obstructionLevel == "partial":  
     acción_correcta = "No aplicar maniobra; animar a toser"  
 si obstructionLevel == "complete":  
     acción_correcta = "Aplicar la maniobra indicada"  
   
Después selecciona la zona según el tipo de paciente:  
adulto promedio       → zona abdominal  
 mujer embarazada      → zona torácica  
 persona con obesidad  → zona torácica  
 bebé menor de 1 año   → espalda + tórax  
   
   
***Caso de prueba CHK-01: obstrucción parcial***  
**Escenario:** persona consciente, con tos fuerte, capaz de emitir sonidos y con entrada de aire.  
**Respuesta esperada:** No aplicar (animar a toser).  
**Criterio de aprobación:** el algoritmo rechaza la maniobra invasiva y explica que aún existe paso de aire.  
***Caso de prueba CHK-02: embarazo y obstrucción grave***  
**Escenario:** mujer embarazada que no puede hablar, toser ni respirar adecuadamente.  
**Respuesta esperada:** activar emergencias y seleccionar  **compresiones torácicas**.  
**Criterio de aprobación:** la zona objetivo debe corresponder al centro del pecho y no al abdomen.  
***Control de actualización:*** * la secuencia exacta de golpes dorsales y compresiones debe mantenerse sincronizada con la edición vigente de las guías AHA aplicable al público objetivo.*  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANElEQVR4nO3OQQmAABRAsSdYxKY/jbnMIJ7FCt5E2BJsmZmt2gMA4C+Otbqr8+sJAACvXQ85TgYRMv3/cwAAAABJRU5ErkJggg==)  
**2.3 Tactical Triage (MTS)**  
***Objetivo clínico-educativo***  
El módulo utiliza una simplificación del **Manchester Triage System (MTS)**, sistema intrahospitalario de priorización con cinco niveles. El triage establece urgencia y tiempo máximo objetivo;  **no establece un diagnóstico**.  
| | | |  
|-|-|-|  
| **Nivel** | **Color** | **Prioridad representada en el simulador** |   
| 1 | Rojo | Inmediata / riesgo vital |   
| 2 | Naranja | Muy urgente / 10 min |   
| 3 | Amarillo | Urgente / 60 min |   
| 4 | Verde | Estándar / 120 min |   
| 5 | Azul | No urgente / 240 min |   
   
***Jerarquía de discriminadores***  
La implementación evalúa los discriminadores en orden de mayor a menor urgencia. El primer nivel aplicable determina el color final:  
1. Inconsciencia o hemorragia exanguinante  
    → ROJO  
   
 2. Dificultad respiratoria severa, hemorragia mayor controlable,  
    dolor severo, dolor torácico de alto riesgo, o respuesta solo al dolor  
    → NARANJA  
   
 3. Dificultad respiratoria moderada, dolor moderado,  
    temperatura/constantes alteradas, o respuesta solo a la voz  
    → AMARILLO  
   
 4. Dolor leve o hemorragia menor, con estabilidad general  
    → VERDE  
   
 5. Ausencia de síntomas agudos o discriminadores de urgencia  
    → AZUL  
   
***Ejemplo de cálculo del color final***  
**Datos del caso:**  
consciencia = "alerta"  
 hemorragia = "mayor_controlable"  
 dolor = "moderado"  
 dificultad_respiratoria = "ausente"  
 temperatura = "normal"  
   
**Evaluación:**  
1. No hay inconsciencia ni hemorragia exanguinante: no corresponde rojo.  
2. Existe hemorragia mayor controlable: corresponde naranja.  
3. Aunque el dolor moderado también cumple amarillo, prevalece el discriminador de mayor urgencia.  
color_final = NARANJA  
 tiempo_objetivo = 10 min  
   
***Caso de prueba MTS-01: precedencia de riesgo***  
| | |  
|-|-|  
| **Discriminador** | **Valor** |   
| Consciencia | Responde a la voz |   
| Hemorragia | Exanguinante |   
| Dolor | Moderado |   
| Resultado esperado | **Rojo** |   
   
La hemorragia exanguinante debe prevalecer sobre los criterios amarillo y naranja.  
***Limitación clínica:*** * el MTS real utiliza diagramas de presentación y discriminadores estructurados sujetos a licencia, formación y gobernanza clínica. La lógica del simulador es una abstracción educativa y no debe utilizarse para clasificar pacientes reales.*  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OQQmAABRAsScYxpg/h5VMYARvRrCCNxG2BFtmZquOAAD4i3Ot7mr/egIAwGvXA224BcUMk6pDAAAAAElFTkSuQmCC)  
**2.4 Tourniquet Code**  
***Objetivo clínico-educativo***  
El módulo entrena el mantenimiento de una entrada dentro de una zona útil mientras se reduce el sangrado simulado y se evita una penalización por exceso.  
Las constantes implementadas son:  
presión_mínima_ideal = 65 %  
 presión_máxima_ideal = 85 %  
 sangrado_inicial = 100 %  
 daño_tisular_crítico = 100 %  
   
***Modelo matemático del simulador***  
Cada 500 ms se evalúa la presión normalizada:  
si 65 ≤ presión ≤ 85:  
     sangrado = máximo(0, sangrado - 5)  
   
 si presión > 85:  
     daño_tisular = mínimo(100, daño_tisular + 10)  
   
 si presión < 65:  
     el sangrado no disminuye  
     se registra error periódico  
   
Además, la presión cae automáticamente 4 puntos cada 140 ms, obligando al usuario a mantener una interacción constante.  
***Interpretación correcta del porcentaje***  
***Hallazgo crítico de auditoría***  
*El intervalo * *65–85 %* * es una * ***variable normalizada de jugabilidad*** *. No representa milímetros de mercurio, fuerza en newtons, tensión de banda ni un porcentaje clínico* * universal. En una emergencia real, la recomendación es apretar un torniquete adecuado hasta que el sangrado potencialmente mortal se detenga; no se debe enseñar al usuario a buscar un porcentaje fisiológico fijo ni a aflojar periódicamente el dispositivo.*  
Por tanto, la documentación y la interfaz deben conservar expresiones como **“zona objetivo del simulador”** y evitar presentar 65–85 % como prescripción clínica.  
***Caso de prueba TRQ-01: zona ideal***  
| | |  
|-|-|  
| **Entrada** | **Resultado esperado** |   
| Presión simulada | 75 % |   
| Zona | Ideal |   
| Cambio por ciclo | Sangrado −5 |   
| Daño tisular | Sin incremento |   
   
***Caso de prueba TRQ-02: exceso sostenido***  
| | |  
|-|-|  
| **Entrada** | **Resultado esperado** |   
| Presión simulada | 92 % |   
| Zona | Excesiva |   
| Cambio por ciclo | Daño tisular +10 |   
| Al alcanzar daño 100 % | Error crítico y puntuación limitada |   
   
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OMQ2AABAAsSNBCUrfDqrYGVDAgAU2QtIq6DIzW7UHAMBfHGt1V+fXEwAAXrseHCQGBEuErVgAAAAASUVORK5CYII=)  
**2.5 Burn Lab**  
***Objetivo clínico-educativo***  
El módulo cruza tres grupos de datos:  
1. **Agente causante:** térmico, químico líquido, químico en polvo, eléctrico, frío, alquitrán o inhalación de humo.  
2. **Aspecto y gravedad simulada:** eritema, ampollas, pérdida de sensibilidad, carbonización o compromiso de vía aérea.  
3. **Tratamiento inicial:** retirar la fuente, enfriar, descontaminar, cubrir, evaluar vía aérea o activar emergencias.  
La decisión se expresa como:  
tratamiento_correcto = f(agente, estado_físico, profundidad, extensión, localización, vía_aérea)  
   
***Matriz de decisión simplificada***  
| | | |  
|-|-|-|  
| **Agente o escenario** | **Conducta educativa principal** | **Conducta que debe evitarse** |   
| Térmico por llama o líquido caliente | Detener la fuente, enfriar con agua corriente limpia y cubrir | Hielo directo, mantequilla o pasta dental |   
| Químico líquido corrosivo | Retirar ropa contaminada e irrigar abundantemente | Neutralizantes caseros |   
| Químico seco o polvo reactivo | Retirar/cepillar cuidadosamente el exceso antes de irrigar según la sustancia | Añadir agua sin identificar el producto |   
| Cal viva u otra sustancia reactiva con agua | Retirada en seco y activación de ayuda especializada | Mojar el polvo antes de retirarlo |   
| Eléctrico | Asegurar la escena, activar emergencias y evaluar respiración/estado general | Tocar a la víctima antes de cortar la fuente |   
| Inhalación de humo | Priorizar vía aérea y activar emergencias | Limitarse al tratamiento de la piel |   
   
***Caso de prueba BRN-01: *** ***Q*** ***uemadura *** ***T*** ***érmica***  
**Escenario:** escaldadura con piel roja, ampollas y dolor intenso.  
agente = térmico  
 herramientas_correctas = [agua corriente fresca, retirar joyería, cobertura limpia]  
 herramientas_incorrectas = [hielo directo, mantequilla, pasta dental]  
   
***Caso de prueba BRN-02: *** ***Q*** ***uímico en *** ***P*** ***olvo***  
**Escenario:** polvo reactivo adherido a la piel.  
agente = químico_seco  
 primera_acción = retirar o cepillar cuidadosamente el polvo  
 segunda_acción = actuar conforme a la ficha de seguridad de la sustancia  
   
El agua no debe aplicarse automáticamente a todo producto seco: deben considerarse la identidad de la sustancia, la seguridad de la escena y la ficha de datos de seguridad.  
***Caso de prueba BRN-03: *** ***L*** ***esión *** ***E*** ***léctrica***  
**Escenario:** marca pequeña de entrada tras exposición de alto voltaje.  
**Resultado esperado:** no interpretar el tamaño de la lesión cutánea como medida del daño interno; asegurar desconexión de la fuente, activar emergencias y evaluar funciones vitales.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANElEQVR4nO3OUQmAABBAsSeIWMICprwEpjSIFfwTYUuwZWaO6goAgL+412qrzq8nAAC8tj8tdQNNdXaCdAAAAABJRU5ErkJggg==)  
**3. Fórmula Universal de Evaluación**  
**3.1 Definición**  
La métrica común propuesta para LifeSaver Arcade combina tres dimensiones normalizadas entre 0 y 100:  
- **40 % — Conocimiento o precisión mecánica (** **K** **):** elección clínica correcta, clasificación del escenario o sincronización con el objetivo principal.  
- **40 % — Técnica (** **T** **):** cumplimiento de reglas operativas, selección de zona, control anti-spam y ausencia de acciones críticas.  
- **20 % — Constancia (** **C** **):** mantenimiento del desempeño durante la sesión y respuesta dentro del tiempo esperado.  
En pseudocódigo:  
function calcularScoreUniversal(conocimiento, tecnica, constancia):  
     score = 0.40 * conocimiento  
           + 0.40 * tecnica  
           + 0.20 * constancia  
   
     return redondear(limitar(score, 0, 100))  
   
**3.2 Ejemplo numérico**  
Para un usuario con:  
K = 90  
 T = 80  
 C = 70  
   
El resultado es:  
Score_final = (0.40 × 90) + (0.40 × 80) + (0.20 × 70)  
 Score_final = 36 + 32 + 14  
 Score_final = 82  
   
**3.3 Reglas de normalización**  
Para garantizar comparabilidad:  
- Cada componente debe permanecer en el intervalo [0, 100].  
- El redondeo debe realizarse al final del cálculo.  
- Una acción insegura puede activar una **penalización crítica** o limitar el máximo obtenible.  
- Los errores no deben contarse simultáneamente en varias dimensiones sin documentar la doble penalización.  
- La telemetría debe conservar valores originales y derivados para permitir una auditoría posterior.  
**3.4 Correspondencia por módulo**  
| | | | |  
|-|-|-|-|  
| **Módulo** | **Conocimiento/precisión (** **K** **)** | **Técnica (** **T** **)** | **Constancia (** **C** **)** |   
| RCP Hero | Sincronización y BPM | Anti-spam, aciertos y errores | Estabilidad durante la sesión |   
| Choking Express | Decisión parcial/grave | Zona y maniobra correspondiente | Rapidez y continuidad |   
| Tactical Triage | Color correcto | Aplicación jerárquica de discriminadores | Respuesta sostenida bajo límite temporal |   
| Tourniquet Code | Decisión de controlar hemorragia | Permanencia en zona objetivo sin exceso | Tiempo y mantenimiento |   
| Burn Lab | Clasificación de gravedad | Selección de herramientas seguras | Tiempo de resolución |   
   
**3.5 Hallazgo de consistencia de implementación**  
Los módulos Choking Express, Tactical Triage, Tourniquet Code y Burn Lab implementan directamente una combinación 40/40/20, aunque el tercer componente aparece en código como **respuesta temporal**.  
RCP Hero utiliza actualmente una fórmula especializada:  
score_rcp = 0.65 × precisión_mecánica  
           + 0.35 × adherencia_BPM  
           - penalización_por_errores  
   
Por rigor de auditoría, no debe afirmarse que todos los módulos usan exactamente la fórmula universal hasta que RCP Hero sea homologado o se documente formalmente como excepción clínica.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANElEQVR4nO3OQQmAABRAsSdYxKa/i8WMIR7ECt5E2BJsmZmt2gMA4C+Otbqr8+sJAACvXQ85PAYartXEogAAAABJRU5ErkJggg==)  
**4. Matriz General de Aceptación**  
| | | |  
|-|-|-|  
| **Identificador** | **Requisito** | **Criterio de aceptación** |   
| AUD-01 | RCP entre 100–120 BPM | La ventana recibe adherencia máxima |   
| AUD-02 | Anti-spam RCP | Entradas <250 ms se rechazan y penalizan |   
| AUD-03 | Obstrucción parcial | Se exige animar a toser y observar |   
| AUD-04 | Embarazo con obstrucción grave | Se selecciona zona torácica |   
| AUD-05 | MTS jerárquico | Prevalece el discriminador más urgente |   
| AUD-06 | Torniquete simulado | 65–85 % se etiqueta como escala de juego |   
| AUD-07 | Quemadura química seca | Se retira el polvo antes de una irrigación condicionada |   
| AUD-08 | Quemadura eléctrica | Se priorizan seguridad de escena y emergencias |   
| AUD-09 | Score universal | Resultado limitado a [0,100] |   
| AUD-10 | Disclaimer | Visible antes o durante cada experiencia educativa |   
   
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OMQ2AABAAsSNhwgJWEPcbJpnRgQU2QtIq6DIze3UGAMBf3Gu1VcfXEwAAXrseaIkEMIPgIvAAAAAASUVORK5CYII=)  
**5. Conclusión de Auditoría**  
La arquitectura de LifeSaver Arcade es adecuada para un entorno de **aprendizaje basado en simulación**, porque convierte objetivos educativos en reglas verificables y conserva telemetría para analizar desempeño inicial, desempeño final, errores y puntuación.  
   
La validación permite concluir que:  
- La lógica de ritmo de RCP es matemáticamente consistente con la conversión BPM–milisegundos.  
   
- La regla anti-spam evita entradas incompatibles con el objetivo temporal.  
   
- Choking Express distingue obstrucción parcial y grave y adapta la zona por tipo de paciente.  
   
- Tactical Triage aplica una jerarquía determinista de cinco niveles.  
   
- Tourniquet Code dispone de una mecánica cuantificable, pero su porcentaje debe tratarse exclusivamente como variable normalizada del simulador.  
   
- Burn Lab relaciona agente, presentación y conducta inicial, incluyendo excepciones relevantes para sustancias secas o reactivas.  
   
- La fórmula 40/40/20 es auditable, siempre que se definan de forma uniforme sus variables y se documente la excepción actual de RCP Hero.  
**Recomendación final:** someter cada versión destinada a uso público a revisión clínica externa, pruebas con usuarios, control de accesibilidad, verificación de enlaces y reevaluación cuando cambien las guías de referencia.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAM0lEQVR4nO3KsQ0AIRAEsUW6Qij1KvnevhMSYmKQ7GiCGd09k3wBAOAVf+2o4wYAwE1qAdYuAy151mgcAAAAAElFTkSuQmCC)  
**6. Referencias Clínicas y Técnicas**  
1. American Heart Association. **2025 Guidelines — Part 7: Adult Basic Life Support.**  
   
 [https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support](https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support "https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support")  
2. American Heart Association. **Adult Foreign-Body Airway Obstruction Algorithm.**  
   
 [https://cpr.heart.org/-/media/CPR-Files/CPR-Guidelines-Files/2025-Algorithms/Algorithm-BLS-Adult-FBAO-250630.pdf?sc_lang=en](https://cpr.heart.org/-/media/CPR-Files/CPR-Guidelines-Files/2025-Algorithms/Algorithm-BLS-Adult-FBAO-250630.pdf?sc_lang=en "https://cpr.heart.org/-/media/CPR-Files/CPR-Guidelines-Files/2025-Algorithms/Algorithm-BLS-Adult-FBAO-250630.pdf?sc_lang=en")  
3. American Heart Association y American Red Cross. **2024 Guidelines for First Aid.**  
   
 [https://cpr.heart.org/en/resuscitation-science/2024-first-aid-guidelines](https://cpr.heart.org/en/resuscitation-science/2024-first-aid-guidelines "https://cpr.heart.org/en/resuscitation-science/2024-first-aid-guidelines")  
4. Manchester Triage Group. **Manchester Triage System.**  
   
 [https://www.triage.nl/en/manchester-triage-system/](https://www.triage.nl/en/manchester-triage-system/ "https://www.triage.nl/en/manchester-triage-system/")  
5. World Health Organization. **Burns.**  
   
 [https://www.who.int/news-room/fact-sheets/detail/burns](https://www.who.int/news-room/fact-sheets/detail/burns "https://www.who.int/news-room/fact-sheets/detail/burns")  
6. Centers for Disease Control and Prevention, NIOSH. **First Aid Procedures for Chemical Hazards.**  
   
 [https://www.cdc.gov/niosh/npg/firstaid.html](https://www.cdc.gov/niosh/npg/firstaid.html "https://www.cdc.gov/niosh/npg/firstaid.html")  
7. American College of Surgeons. **STOP THE BLEED®.**  
   
 [https://www.stopthebleed.org/](https://www.stopthebleed.org/ "https://www.stopthebleed.org/")  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OYQ1AABSAwc8mi5wvkwZyCKCAACr4Z7a7BLfMzFYdAQDwF+da3dX+9QQAgNeuB6feBdUJcyS2AAAAAElFTkSuQmCC)  
**7. Registro de Aprobación**  
| | | | |  
|-|-|-|-|  
| **Rol** | **Nombre** | **Firma** | **Fecha** |   
| Desarrollador responsable | Zaddkiel de Jesus Martinez Alor | ____________________ | ____________________ |   
| Revisor técnico | ____________________ | ____________________ | ____________________ |   
| Revisor clínico | ____________________ | ____________________ | ____________________ |   
| Responsable académico | ____________________ | ____________________ | ____________________ |   
   
