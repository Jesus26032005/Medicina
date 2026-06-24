# LifeSaver Arcade: Democratizando el Acceso al Entrenamiento en Soporte Vital y Triage mediante Gamificación Web

## 1. Introducción

**LifeSaver Arcade** es una plataforma web interactiva orientada al aprendizaje y repaso de protocolos esenciales de primeros auxilios. El proyecto integra principios de ingeniería de software, inteligencia artificial, diseño centrado en el usuario y educación en salud para transformar procedimientos complejos en experiencias accesibles, visuales y dinámicas.

La plataforma emplea simulaciones gamificadas para representar situaciones críticas relacionadas con reanimación cardiopulmonar, obstrucción de la vía aérea, triage hospitalario, control de hemorragias y atención inicial de quemaduras. Cada módulo permite practicar la toma de decisiones mediante escenarios, retroalimentación inmediata, métricas de precisión y reglas algorítmicas.

LifeSaver Arcade nació bajo la convicción de que la tecnología puede utilizarse como una herramienta altruista para ampliar el acceso al conocimiento. Su finalidad es acercar contenidos educativos de soporte vital y primeros auxilios a estudiantes y primeros respondientes que no siempre disponen de laboratorios, maniquíes o equipos especializados.

> **Aviso médico:** LifeSaver Arcade es una herramienta exclusivamente educativa y de simulación académica. No sustituye el criterio médico profesional, la capacitación certificada, la práctica con maniquíes ni la comunicación con los servicios de emergencia.

## 2. Objetivo y Problemática

Uno de los principales obstáculos para la enseñanza práctica de primeros auxilios es el costo de los recursos de simulación clínica. Los maniquíes especializados, sensores de compresión, laboratorios y programas certificados pueden resultar inaccesibles para una parte importante de la población estudiantil.

A esta limitación económica se suman otras problemáticas:

- Desconocimiento general de los protocolos básicos de emergencia.
- Dificultad para recordar secuencias de actuación bajo presión.
- Acceso limitado a laboratorios de simulación clínica.
- Falta de herramientas digitales gratuitas para practicar algoritmos médicos.
- Escasa retroalimentación cuantitativa durante el aprendizaje autónomo.
- Dificultad para entrenar la priorización de pacientes en escenarios de urgencias.
- Dependencia de dispositivos o instalaciones especializadas.

El objetivo de LifeSaver Arcade es proporcionar una herramienta algorítmica **gratuita, accesible y multiplataforma** para practicar la memoria procedimental y la toma de decisiones en situaciones simuladas de emergencia.

La lógica educativa del sistema toma como referencia directrices y materiales internacionales, entre ellos:

- **American Heart Association (AHA).**
- **American Red Cross y Cruz Roja.**
- **Manchester Triage System (MTS).**
- Recomendaciones institucionales para primeros auxilios, quemaduras y control de hemorragias.

El proyecto no pretende reemplazar la formación clínica presencial. Su propósito es funcionar como un complemento de repaso que permita identificar errores, reforzar secuencias y familiarizar al usuario con decisiones que posteriormente deberán practicarse en entornos supervisados.

### 2.0 Público Objetivo

LifeSaver Arcade está dirigido principalmente a **estudiantes de medicina**, quienes pueden utilizarlo como una herramienta complementaria para repasar algoritmos, reconocer discriminadores clínicos y practicar la priorización de pacientes.

Para este grupo, la plataforma ofrece oportunidades de aprendizaje relacionadas con:

- Identificación de frecuencias apropiadas para RCP.
- Diferenciación entre obstrucción parcial y grave de la vía aérea.
- Aplicación de discriminadores del Sistema de Triage de Manchester.
- Reconocimiento inicial de hemorragias potencialmente mortales.
- Clasificación básica de quemaduras según su agente causante.
- Evaluación de decisiones mediante telemetría y retroalimentación.

También está orientada a **primeros respondientes**, brigadistas, estudiantes de áreas de la salud y personas interesadas en adquirir conocimientos introductorios de actuación ante emergencias.

La interfaz utiliza instrucciones breves, elementos visuales y controles compatibles con dispositivos móviles. Esto facilita su utilización en aulas, actividades de divulgación, sesiones de repaso y prácticas educativas autónomas.

### 2.1 Tecnologías y Frameworks

LifeSaver Arcade fue desarrollado mediante tecnologías web modernas seleccionadas por su agilidad, compatibilidad y facilidad de acceso.

#### React.js

**React.js** se utiliza para construir la interfaz y administrar la lógica de estado de los simuladores.

Su arquitectura basada en componentes permite separar cada módulo y reutilizar elementos como indicadores, ventanas informativas, controles de accesibilidad, resultados y avisos médicos.

React también permite actualizar en tiempo real variables como:

- Ritmo de interacción.
- Tiempo restante.
- Precisión del usuario.
- Decisiones seleccionadas.
- Número de errores.
- Estado del caso clínico.
- Puntuación final.

#### Tailwind CSS

**Tailwind CSS** se emplea para construir una interfaz responsiva, consistente y adaptable.

Su utilización permite mantener una experiencia visual uniforme en computadoras, tabletas y teléfonos celulares. También facilita la implementación de:

- Diseño adaptable.
- Modo oscuro.
- Contraste visual.
- Estados de interacción.
- Jerarquías de información.
- Controles táctiles.
- Indicadores por color.

La interfaz fue homologada para que los módulos puedan utilizarse desde un navegador móvil sin requerir la instalación de una aplicación.

#### Supabase

**Supabase** funciona como backend y base de datos para el almacenamiento de telemetría.

El sistema registra información educativa como:

- Módulo utilizado.
- Precisión inicial.
- Precisión final.
- Tiempo de resolución.
- Cantidad de errores.
- Puntuación obtenida.
- Eventos específicos de cada simulación.

La telemetría permite observar la evolución del usuario y analizar si existe una mejora entre el inicio y el final de una sesión.

#### Justificación tecnológica

Estas tecnologías fueron elegidas por las siguientes razones:

- Reducen el tiempo de desarrollo.
- Permiten reutilizar componentes.
- Facilitan el mantenimiento del proyecto.
- Son compatibles con navegadores modernos.
- Permiten acceder al sistema mediante una dirección web.
- Evitan instalaciones adicionales.
- Favorecen el uso desde dispositivos móviles.
- Facilitan el crecimiento modular de la plataforma.

### 2.2 Impacto Social

LifeSaver Arcade representa una acción altruista porque ofrece una alternativa digital para acercar conocimientos de primeros auxilios a personas que podrían no contar con recursos de capacitación especializada.

El proyecto contribuye socialmente al:

- Ofrecer acceso gratuito a simulaciones educativas.
- Reducir barreras económicas de aprendizaje.
- Facilitar el repaso de protocolos desde un teléfono celular.
- Promover una cultura de prevención y respuesta temprana.
- Sensibilizar sobre la importancia de solicitar ayuda profesional.
- Acercar la ingeniería de software a necesidades reales de salud.
- Fomentar el aprendizaje autónomo y responsable.

En una emergencia, reconocer rápidamente una obstrucción grave, iniciar la activación del sistema de emergencias o identificar una hemorragia potencialmente mortal puede influir en la respuesta inicial. Aunque una plataforma digital no sustituye el entrenamiento físico, sí puede ayudar a reducir el desconocimiento y reforzar conceptos esenciales.

El impacto social del proyecto no depende únicamente del número de usuarios, sino de su capacidad para convertir información especializada en experiencias educativas accesibles. Cada persona que mejora su comprensión de un protocolo representa una oportunidad adicional para responder de forma más informada ante una situación crítica.

## 3. Desarrollo y muestra del sistema funcionando

LifeSaver Arcade está compuesto por cinco módulos interactivos. Cada uno aborda una competencia específica mediante casos simulados, reglas verificables y retroalimentación inmediata.

### RCP Hero

**RCP Hero** entrena el ritmo de las compresiones torácicas mediante canciones y referencias auditivas situadas dentro de la ventana educativa de **100 a 120 compresiones por minuto**.

El módulo convierte los BPM de cada pista en intervalos de milisegundos y compara las pulsaciones del usuario con el ritmo esperado. También incorpora una regla anti-spam para rechazar entradas excesivamente rápidas que no representan una secuencia válida de compresiones.

Su objetivo es reforzar:

- Ritmo constante.
- Coordinación temporal.
- Reducción de interrupciones.
- Reconocimiento de la frecuencia recomendada.
- Importancia del retroceso torácico.

> El módulo entrena ritmo y coordinación digital; no mide físicamente profundidad, fuerza, posición de manos ni retroceso torácico real.

[Insertar Captura de Pantalla de RCP Hero aquí]

### Choking Express

**Choking Express** presenta escenarios de obstrucción de la vía aérea y solicita al usuario identificar la conducta apropiada.

El árbol de decisiones distingue entre:

- Obstrucción parcial, en la que debe animarse a la persona a toser y mantenerse la vigilancia.
- Obstrucción grave, en la que debe aplicarse la maniobra correspondiente.
- Personas adultas.
- Embarazo.
- Personas cuyo abdomen no puede rodearse adecuadamente.
- Bebés menores de un año.

El módulo modifica la zona de actuación según el tipo de paciente. Por ejemplo, una obstrucción grave durante el embarazo requiere una representación educativa de compresiones torácicas y no abdominales.

[Insertar Captura de Pantalla de Choking Express aquí]

### Tactical Triage MTS

**Tactical Triage MTS** utiliza un motor procedural inspirado en el Sistema de Triage de Manchester.

El sistema genera escenarios mediante diferentes discriminadores:

- Nivel de consciencia.
- Presencia y gravedad de hemorragia.
- Intensidad del dolor.
- Dificultad respiratoria.
- Alteración de temperatura o constantes.
- Datos de alarma asociados con dolor torácico.

A partir de estos elementos, el motor clasifica al paciente en uno de cinco niveles:

1. **Rojo:** atención inmediata.
2. **Naranja:** muy urgente.
3. **Amarillo:** urgente.
4. **Verde:** estándar.
5. **Azul:** no urgente.

El usuario debe analizar el caso y seleccionar la prioridad correspondiente bajo un límite de tiempo. La finalidad del módulo es entrenar la jerarquización de discriminadores, no emitir diagnósticos médicos reales.

[Insertar Captura de Pantalla de Tactical Triage MTS aquí]

### Tourniquet Code

**Tourniquet Code** simula el control de una hemorragia grave mediante una mecánica de presión sostenida.

El usuario debe mantener el indicador dentro de una zona objetivo para reducir el sangrado virtual. Una presión insuficiente no controla la hemorragia, mientras que el exceso sostenido genera una penalización por daño tisular dentro del modelo matemático del juego.

El módulo refuerza conceptos como:

- Reconocimiento de hemorragias graves.
- Aplicación sostenida del control.
- Importancia de la rapidez.
- Colocación por encima de la lesión.
- Registro y seguimiento del procedimiento.

> Los porcentajes mostrados son variables normalizadas del simulador. No representan una presión clínica universal ni sustituyen el entrenamiento certificado para aplicar un torniquete real.

[Insertar Captura de Pantalla de Tourniquet Code aquí]

### Burn Lab

**Burn Lab** presenta diferentes agentes causantes y solicita al usuario clasificar la gravedad y seleccionar una atención inicial segura.

Los escenarios incluyen:

- Quemaduras térmicas.
- Quemaduras químicas líquidas.
- Sustancias químicas en polvo.
- Lesiones eléctricas.
- Lesiones por frío.
- Alquitrán caliente.
- Inhalación de humo.

El módulo demuestra que el tratamiento inicial depende del agente causante. Una quemadura térmica puede requerir enfriamiento con agua corriente, mientras que determinados productos químicos secos deben retirarse cuidadosamente antes de considerar la irrigación.

También penaliza prácticas inseguras como aplicar hielo directamente, mantequilla, pasta dental o neutralizantes caseros.

[Insertar Captura de Pantalla de Burn Lab aquí]

### Evidencia de ayuda a otros

La plataforma fue presentada para su revisión técnica y algorítmica a profesionales del área de la salud. Como parte de este proceso, **Fanas, Médico JP**, revisó el Documento de Auditoría Clínica y el comportamiento dinámico de los módulos.

La carta de validación reconoce que los algoritmos implementados se apegan de manera razonable, segura y didáctica a directrices internacionales para fines estrictamente educativos y de simulación académica. Esta revisión permite fortalecer la utilidad del sistema como recurso complementario para estudiantes de medicina, sin atribuirle funciones diagnósticas ni sustituir la capacitación clínica certificada.

La participación de un profesional sanitario permitió contrastar la intención tecnológica con las necesidades pedagógicas del área médica. Este proceso representa una evidencia de colaboración interdisciplinaria y de compromiso con la seguridad del contenido.

[Insertar Captura de Pantalla del Dashboard aquí]

[Insertar Captura de Pantalla de la Telemetría aquí]

[Insertar Carta Firmada de Revisión y Validación Técnica aquí]

[Insertar Evidencia de Uso por Estudiantes de Medicina aquí]

## 4. Alcances obtenidos

El desarrollo de LifeSaver Arcade permitió alcanzar resultados técnicos, académicos y sociales relevantes.

### Alcances técnicos

- Desarrollo de cinco simuladores interactivos especializados.
- Construcción de una arquitectura modular mediante React.js.
- Diseño responsivo con Tailwind CSS.
- Integración de Supabase como backend y base de datos.
- Implementación de autenticación y sesiones de usuario.
- Registro de precisión, errores, tiempo y puntuación.
- Visualización del progreso mediante un dashboard.
- Compatibilidad con computadoras, tabletas y teléfonos celulares.
- Uso desde el navegador sin requerir instalación.
- Implementación de modo oscuro y controles visuales accesibles.

### Alcances médicos y educativos

- Representación de la ventana de `100–120 BPM` para RCP.
- Árbol de decisiones para obstrucciones parciales y graves.
- Adaptación de maniobras según el tipo de paciente.
- Motor procedural de triage hospitalario con cinco niveles.
- Jerarquización de discriminadores clínicos.
- Simulación del control sostenido de hemorragias.
- Diferenciación del tratamiento inicial según el agente causante de una quemadura.
- Inclusión de avisos médicos y referencias clínicas.
- Revisión técnica y algorítmica por un profesional de la salud.

### Motor procedural de triage

Uno de los principales logros fue la creación de un motor capaz de generar casos de triage mediante combinaciones de discriminadores. En lugar de limitarse a preguntas estáticas, el sistema construye escenarios variables y aplica una jerarquía para calcular el nivel de prioridad.

Esta estrategia incrementa la diversidad de ejercicios y reduce la posibilidad de que el usuario memorice únicamente las respuestas de casos predefinidos.

### Telemetría educativa

La telemetría permite convertir cada interacción en evidencia cuantitativa de aprendizaje. El sistema registra el desempeño inicial y final para observar cambios dentro de una sesión.

La puntuación combina dimensiones como:

```text
Score final = 40 % conocimiento o precisión
            + 40 % técnica
            + 20 % constancia o respuesta temporal
```

Esta información puede utilizarse para:

- Identificar errores frecuentes.
- Comparar intentos.
- Reconocer mejoras.
- Evaluar la dificultad de los módulos.
- Orientar futuras modificaciones pedagógicas.

### Accesibilidad tecnológica

El proyecto fue diseñado para funcionar desde navegadores modernos y adaptarse a diferentes tamaños de pantalla. Esta homologación permite acceder a la plataforma desde un teléfono celular sin descargar aplicaciones ni utilizar equipos especializados.

La accesibilidad móvil constituye una parte esencial de su impacto social, ya que reduce requisitos técnicos y facilita su utilización en instituciones con recursos limitados.

## 5. Conclusiones

LifeSaver Arcade demuestra que el desarrollo de software puede trascender la solución de problemas técnicos y convertirse en una acción altruista con impacto social.

Como estudiante de **Ingeniería en Inteligencia Artificial en la Escuela Superior de Cómputo del Instituto Politécnico Nacional**, considero que la tecnología debe diseñarse con responsabilidad, empatía y conciencia sobre las necesidades de las personas. La programación no solo permite automatizar procesos; también puede facilitar el acceso al conocimiento, apoyar la educación y contribuir a la preservación de la vida humana.

El proyecto permitió relacionar conocimientos de ingeniería de software con principios educativos de primeros auxilios. Este proceso exigió investigar protocolos, modelar decisiones, diseñar experiencias accesibles y reconocer los límites éticos de una simulación digital.

La revisión realizada por **Fanas, Médico JP**, refuerza la importancia de la colaboración entre profesionales de la salud y desarrolladores. Una herramienta educativa de esta naturaleza debe construirse mediante revisión interdisciplinaria, actualización constante y comunicación clara de sus limitaciones.

LifeSaver Arcade no pretende reemplazar a médicos, instructores ni equipos de simulación. Su aportación consiste en ofrecer un punto de acceso gratuito para practicar conceptos, reconocer decisiones importantes y despertar interés por la capacitación formal.

El carácter altruista del proyecto reside en poner la ingeniería al servicio de una necesidad colectiva: que más personas tengan la oportunidad de aprender cómo actuar frente a una emergencia.

**Zaddkiel de Jesus Martinez Alor**  
Estudiante de Ingeniería en Inteligencia Artificial  
Escuela Superior de Cómputo — Instituto Politécnico Nacional  
**ESCOM-IPN**