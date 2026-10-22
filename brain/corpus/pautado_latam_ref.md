Reporte de pautado de resolución del desafío

EQUIPO:    V3RTIX

SEDE:      RUPAP 1

DESAFÍO SELECCIONADO:      Optimización y Priorización de recursos y refuerzos en la post-emergencia

DESCRIPCIÓN DE LA PROBLEMÁTICA (1250 caracteres)

Describa brevemente la problemática elegida. ¿Cuáles pueden ser las principales causas? ¿Cuál es el verdadero problema a resolver?

América Latina y el Caribe tiene una alta exposición a terremotos, inundaciones y deslizamientos. Entre 2000 y 2022 se registraron 1.534 eventos que afectaron a más de 190 millones de personas (UNDRR/OCHA), y en 2023 otros 10,8 millones en 19 países (UNICEF).

Tras una catástrofe, la falta de información inmediata es crítica. Cuando un edificio colapsa se conoce su ubicación, pero no cuántas personas había dentro, cuántas siguen atrapadas ni dónde la ayuda es más urgente. Esto se agrava porque la electricidad y las comunicaciones dependen de infraestructuras frágiles que suelen fallar con el impacto, mientras las vías se bloquean y los reportes llegan dispersos.

Como consecuencia, los equipos de rescate deben actuar con datos incompletos mientras reparten recursos limitados ante una demanda simultánea, lo que retrasa la coordinación y la respuesta.

El verdadero problema es no disponer de información rápida y confiable sobre qué zonas están afectadas y dónde puede haber personas en peligro cuando fallan los medios convencionales. Sin ella, es difícil priorizar las intervenciones y ayudar a tiempo a quienes más lo necesitan.

DESCRIPCIÓN DE LA SOLUCIÓN (1250 caracteres)

Describa brevemente el producto/servicio y por qué lo considera una solución a la problemática elegida. ¿Por qué esta propuesta es una buena solución al problema? ¿Por qué se diferencia de otras propuestas existentes? Describa brevemente la tecnología seleccionada, el funcionamiento, las necesidades para su implementación, entre otras.

SITRA (Sistema Internacional Territorial para Rescates y Alertas) es una red de dispositivos autónomos que complementa a la protección civil, como el SINAPRED en Nicaragua. Se instalan en puntos estratégicos y, tras un desastre, captan las señales de teléfonos y relojes inteligentes en un radio de unos 30 metros, lo que da una idea de en qué zonas podría haber personas. También vigilan el humo, la temperatura o el nivel del agua.

Los dispositivos usan un microcontrolador ESP32 y se comunican por LoRa, una radio de largo alcance que no necesita internet ni red celular. Los datos pasan de un equipo a otro hasta un puesto de mando, donde un mapa colorea los sectores según su prioridad. Paneles solares y baterías los mantienen activos durante los cortes de electricidad.

Antes del desastre, SITRA puede retransmitir alertas oficiales por altavoces y sirenas comunitarias; después, ayuda a orientar la búsqueda y el reparto de recursos. Sus resultados son estimaciones, no almacena datos personales y la ausencia de señales no prueba que no haya personas.

A diferencia de drones, cámaras térmicas o alertas por celular, no depende de la red celular, es económico (US$204,94 el prototipo) y crece por etapas.

IMPACTO (1000 caracteres)

Describa brevemente el impacto social y/o ambiental que genera la propuesta de solución.

El mayor impacto es ganar tiempo. En un rescate cada hora cuenta, y saber hacia dónde enviar primero a los equipos aumenta las posibilidades de encontrar personas con vida, sobre todo en comunidades incomunicadas, de difícil acceso o muy pobladas, donde la ayuda suele llegar más tarde.

Su valor es ante todo social: es un bien público de preparación comunitaria, no un producto para lucrar. Las familias reciben avisos oficiales a tiempo, saben cómo actuar y ganan seguridad, lo que mejora su calidad de vida.

En lo económico, evita recorridos innecesarios de rescatistas y vehículos, de modo que el personal, el combustible y los suministros se usen primero donde más hacen falta. En lo ambiental, funciona con energía solar, sin depender de generadores a combustible, y puede alertar sobre riesgos como incendios o crecidas que dañan el entorno.

INNOVACIÓN (1000 caracteres)

Fundamente brevemente por qué considera que esta propuesta representa una solución innovadora a la problemática seleccionada.

¿Y si una comunidad pudiera seguir coordinando la ayuda aunque se apaguen la electricidad y las redes convencionales?

La idea no nace de un componente nuevo, sino de un uso nuevo. Tiendas y aeropuertos ya cuentan señales de teléfonos para medir flujo de clientes y filas, y la radio LoRa se usa en agricultura y medidores inteligentes. Aquí se llevan a un terreno distinto: encontrar pistas de personas tras un desastre.

Los drones y las cámaras térmicas son costosos, requieren operadores y se ven limitados por escombros o mal clima. Las balizas de rescate exigen que la víctima lleve un equipo especial; aquí basta el teléfono que ya porta. Las alertas por celular fallan si cae la red; esta propuesta sigue operando con energía solar y radio propia.

Además, une en un solo equipo avisar antes del desastre y orientar el rescate después, y sus sensores se cambian según el riesgo: río, ladera o bosque. Por ser modular, empieza con pocas unidades y crece con la comunidad.

PRE FACTIBILIDAD ECONÓMICA, SOCIAL Y SUSTENTABILIDAD AMBIENTAL (1500 caracteres)

Describa brevemente las razones que hacen de esta propuesta una propuesta sostenible en el tiempo. Fundamente por qué considera que esta propuesta es presupuestariamente abordable, por qué es viable o aceptable socialmente

Cada nodo cuesta US$204,94 e incluye microcontrolador, módulo LoRa, sensores, batería de 2500 mAh, panel solar de 5 W (5 V) y alarma sonora. Al ser modular, la inversión es gradual: se empieza por los puntos de mayor riesgo y la red crece según el presupuesto.

Será implementado a nivel institucional por alcaldías, protección civil y cuerpos de emergencia, que ya gestionan el riesgo en el territorio. Puede financiarse con fondos públicos, ONG o cooperación internacional. Al usar componentes comerciales, el mantenimiento se limita a revisiones periódicas y reposición de baterías, y si una pieza falla solo se cambia ese módulo.

En lo energético, el panel solar recarga la batería y el equipo opera sin depender de la red eléctrica ni de combustibles.

Cada nodo reúne varias funciones (alertar, detectar y vigilar), lo que evita comprar equipos separados y aprovecha mejor el presupuesto y el personal.

En lo ambiental, cada nodo funciona como estación meteorológica y de monitoreo: registra temperatura, humedad y vibraciones del suelo, datos útiles ante sismos y ante lluvias intensas que pueden causar inundaciones o deslizamientos. Las baterías agotadas se entregarían a gestores de reciclaje para evitar residuos electrónicos.

Socialmente es viable porque complementa a los sistemas oficiales sin sustituirlos, tiene un costo asequible para las instituciones y solo registra conteos anónimos, no datos personales.

PROPUESTAS QUE DESCARTARON

Enumere, en caso de haber descartado ideas, las diferentes propuestas que han analizado hasta elegir la actual y mencione brevemente el porque.

El proceso de selección comenzó con el análisis de los nueve desafíos planteados en el Rally Latinoamericano 2026, considerando su relevancia social, viabilidad técnica y potencial para desarrollar soluciones innovadoras, luego tras una primera evaluación, se preseleccionaron cuatro desafíos el 3, 6, 8 y 9.

posteriormente, el equipo comparó estas opciones teniendo en cuenta su aplicabilidad, las necesidades que buscaban atender y las oportunidades de integrar tecnologías accesibles para resolver problemas reales. Finalmente, se eligió el desafío 9, Optimización y Priorización de Recursos y Refuerzos en la Post-Emergencia, por su relación directa con la necesidad de mejorar la coordinación de los recursos y orientar las labores de búsqueda y asistencia después de un desastre. Por esta razón, se descartaron los desafíos 3, 6 y 8, al no ajustarse tanto al enfoque que el equipo decidió desarrollar.

Una vez seleccionado el desafío, la propuesta evolucionó desde una idea general de apoyo a la gestión de emergencias hasta el diseño conceptual de una red tecnológica capaz de recopilar y transmitir información útil para los organismos de protección civil. Durante este proceso se consideró la integración de microcontroladores ESP32, comunicación LoRa, detección de señales Wi-Fi y Bluetooth, sensores ambientales y alimentación mediante baterías con apoyo de paneles solares.

Esta evolución dio origen a SITRA (Sistema Internacional Territorial para Rescates y Alertas), una propuesta que busca complementar los sistemas de respuesta existentes mediante comunicaciones alternativas, monitoreo adaptable e indicios territoriales que contribuyan a priorizar sectores de inspección, búsqueda y distribución de recursos. La elección final respondió al propósito de desarrollar una solución con potencial de adaptación a distintas comunidades de América Latina, especialmente aquellas que podrían enfrentar interrupciones eléctricas o dificultades de comunicación durante una emergencia.

REFERENCIAS

Escriba aquí todas las fuentes de información que consultaron y de las que obtuvieron información para construir su propuesta incluyendo las relacionadas a la inteligencia artificial.

Alibaba.com. (s. f.). Caja de conexiones de plástico ABS resistente al agua IP65, caja de instrumentos electrónicos 158×90×65. https://spanish.alibaba.com/product-detail/SR-WTB-IP65-Waterproof-ABS-Plastic-1601621382274.html

Alibaba.com. (s. f.). Módulo de tarjeta Micro SD TF, módulo de tarjeta Mini SD, módulo de memoria. https://spanish.alibaba.com/product-detail/TF-Micro-SD-Card-Module-Mini-1601803618304.html

Alibaba.com. (s. f.). Sirena de alarma impermeable de doble tono, tipo bocina, 12 V, altavoz de bocina de 30 W. https://spanish.alibaba.com/product-detail/Sirene-Alarme-Horn-Water-Proof-Sirena-1600754223908.html

Alibaba.com. (s. f.). 140PCS 560PCS 840PCS solderless flexible breadboard connecting line cables breadboard jumper wires kit. https://www.alibaba.com/product-detail/140PCS-560PCS-840PCS-Solderless-Flexible-Breadboard_1601232952088.html

AliExpress. (s. f.). Placa de desarrollo inalámbrica WiFi Bluetooth ESP32 ESP32D DEVKIT V1, Micro USB, doble núcleo, CP2102 CH340, placa de expansión ESP-WROOM-32. https://es.aliexpress.com/item/1005008503831020.html

AliExpress. (s. f.). Heltec WiFi LoRa 32 V3 (ESP32-S3 + SX1262, con pantalla). https://es.aliexpress.com/item/1005008451687223.html

AliExpress. (s. f.). Módulo de cargador solar MPPT CN3791 – Placa de carga de batería de iones de litio de 3,7 V a 4,2 V con protección contra sobrecarga para paneles solares de 6 V/9 V/12 V. https://es.aliexpress.com/item/1005009309983426.html

Acuna, V. (2017). Using unmanned aerial vehicles for wireless localization in search and rescue [Tesis de maestría, Florida International University]. FIU Electronic Theses and Dissertations. https://doi.org/10.25148/etd.FIDC006591

cyberman54. (s. f.). ESP32-Paxcounter [Código fuente]. GitHub. https://github.com/cyberman54/ESP32-Paxcounter

Espressif Systems. (s. f.). Wi-Fi modes. En ESP-IDF programming guide: ESP32. https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-guides/wifi-driver/wifi-modes.html

Meshtastic. (s. f.). Introduction. https://meshtastic.org/docs/introduction/

Oficina de las Naciones Unidas de Coordinación de Asuntos Humanitarios, & Oficina de las Naciones Unidas para la Reducción del Riesgo de Desastres. (2023). Panorama de los desastres en América Latina y el Caribe 2000–2022.

Semtech. (s. f.). Innovation for a better world. https://www.semtech.com/company/products-better-world

Semtech. (s. f.). IoT applications for smart agriculture with LoRa® technology. https://www.semtech.com/lora/lora-applications/smart-agriculture

United Nations Children's Fund. (s. f.). Latin America and the Caribbean: Humanitarian situation report 2023 (Reporting period: 1 January to 31 December 2023). https://www.unicef.org/media/155916/file/Humanitarian_Situation_Report_(Latin_America_and_the_Caribbean)_1_January_-_31_December_2023.pdf

DeepSeek. (2026). DeepSeek [Modelo de lenguaje grande]. https://chat.deepseek.com/

Google. (2026). Gemini [Modelo de lenguaje grande]. https://gemini.google.com/

OpenAI. (2026). ChatGPT [Modelo de lenguaje grande]. https://chatgpt.com/