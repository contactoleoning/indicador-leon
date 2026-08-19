# Estado del sistema — León Ingeniería

Última actualización: 17 de agosto de 2026.

Este archivo existe porque ya no es una app: son tres, comparten una base de
datos, y hay trabajo publicado y trabajo esperando prueba. Sin esto, retomar
en dos meses significa reconstruir todo de memoria.

---

## Las tres apps

Las tres viven en `contactoleoning.github.io`, se publican desde la rama `main`
de su repositorio, y comparten el proyecto Firebase `leon-clientes`.

| App | Repositorio | Para qué |
|---|---|---|
| **Cotizador** | `cotizador-leon` | Catálogo por BTU, presupuesto, PDF, guion de llamada, seguimiento de cotizaciones y finanzas |
| **Indicador de Vencimiento** | `indicador-leon` | Clientes, vencimientos de mantención, equipos, fotos, ruteo, recordatorios por WhatsApp |
| **Comprobante de Servicio** | `comprobante-leon` | Comprobante que se emite en terreno, con folio correlativo |

Cada una tiene además una **copia de prueba** en `/beta` — misma dirección más
`/beta/`. Se publica desde `main` igual que la app real, pero en su propia
carpeta, con una franja que avisa que no es para trabajo real.

**La beta escribe en los datos reales.** No es un sandbox: sirve para probar
la interfaz y el flujo antes de publicar, no para inventar clientes.

---

## Qué guarda cada nodo de la base

Realtime Database del proyecto `leon-clientes`:

| Nodo | Quién escribe | Qué es |
|---|---|---|
| `usuarios/{uid}` | solo la consola, a mano | Nombre y rol (`admin` o `vendedor`) de cada persona |
| `leon_clientes` | Indicador, Cotizador, Comprobante | La base de clientes con sus vencimientos |
| `leon_clientes_trash` | Indicador | Papelera |
| `leon_cotizaciones` | Cotizador | Registro de cotizaciones y su seguimiento. Clave: `n`+número |
| `leon_comprobantes` | Comprobante | Comprobantes emitidos |
| `leon_comprobantes_meta/nextFolio` | Comprobante | Contador del correlativo |

Las reglas están en `reglas-firebase.json`, en este mismo repositorio.
Exigen sesión con correo **y** ficha en `/usuarios`. La raíz está cerrada por
defecto, así que **un nodo nuevo no funciona hasta que se agregue a las reglas**.

El Cotizador además usa un **Google Apps Script** aparte para catálogos, el
historial de PDFs y el respaldo descargable. El registro de cotizaciones ya
**no** pasa por ahí: vive solo en `leon_cotizaciones`.

---

## Publicado y funcionando

- Sesión con correo y contraseña por persona, en las tres apps.
- Roles: el vendedor no ve la pestaña ADMINISTRADOR del cotizador.
- Reglas de base que rechazan tokens anónimos (verificado con el simulador).
- Respaldo diario automático de datos y reglas, sin borrado a los 30 días.
- Copia de prueba en `/beta` para las tres.
- Proveedor **Anónimo inhabilitado** en Authentication (13 de agosto).
- Registro de cotizaciones en Firebase, ya **fuera** del Apps Script.

Lo de la Fase 2 ya está publicado:

- El cotizador manda al indicador teléfono, RUT, dirección, equipos, monto y
  número de cotización. Antes solo el nombre.
- El intervalo de mantención se sugiere solo: 4 meses local comercial, 6 casa,
  12 equipo nuevo. Editable, y deja de sugerir si se toca a mano.
- **Cliente único por persona + dirección.** No por persona sola: Eduardo tiene
  casa en Lo Barnechea y oficina en Vitacura, y son dos fichas legítimas.
- Historial comercial en la ficha del cliente.
- Seguimiento de cotizaciones con cadencia de 3 contactos.
- Métricas de cierre: ticket, demora, motivos de pérdida, efecto del seguimiento.
- El folio del comprobante se reserva al guardar o imprimir, no al abrir.
- El registro de cotizaciones se guarda en `leon_cotizaciones`, con migración
  automática y relleno de teléfonos y RUT desde el historial.
- Canal de origen al cotizar, y tabla de rendimiento por canal.
- **Varias cotizaciones a un mismo cliente = una oportunidad.** Hay dos casos y
  no son lo mismo:
  - **Opciones para elegir** (Andrés): se le dieron varias y va a elegir una.
    Todas siguen vivas hasta que conteste; en "plata en juego" pesa la más alta.
    Al cerrar una, las otras quedan `Descartada / Eligió otra alternativa`.
  - **La última incluye a las anteriores** (Ana Moya): apareció trabajo
    adicional y se rehizo la cotización incluyendo lo ya cotizado, para que el
    cliente vea un solo número. Las viejas **no esperan respuesta, están
    anuladas**: se descartan al tiro con `Incluida en la N°X` y salen del
    seguimiento. Perseguir al cliente por una cotización que ya no existe es
    trabajo perdido y además queda mal.

  Detecta también las **ya cerradas**: si se alcanzó a marcar una como perdida
  antes de agrupar, esa plata quedaba para siempre como venta perdida sin serlo.
  Agrupa por cercanía en el tiempo, **corte en 30 días**: un cliente que vuelve
  a los tres meses es un cliente que vuelve, no una alternativa. Detecta y
  sugiere; agrupa Isaac.
- **Perder un grupo cuenta como una derrota, no como varias** (Paola: dos
  alternativas y no contestó por ninguna).
- **La pregunta se hace al generar**, no sólo después: si el cliente ya tiene
  una cotización viva de estos días, pregunta ahí mismo si es del mismo trabajo
  y de qué tipo. Es con el trabajo fresco en la cabeza cuando Isaac sabe la
  respuesta.
- **Segunda dimensión: "Al bolsillo".** Lo facturado no es lo ganado. En
  Seguimiento hay **Trabajos por liquidar** —cerrados sin gastos anotados— donde
  se anota equipos, materiales, ayudante y otros; el costo de los equipos viene
  pre-llenado desde el catálogo, que es el único de los cuatro que el sistema
  sabe solo. En Estadísticas el bloque **Al bolsillo** muestra entró / gastaste
  / te quedó. **Todo sin IVA**: ese 19% se cobra por el fisco y nunca fue plata
  de Isaac. El bloque sólo afirma sobre los trabajos ya liquidados y dice
  cuántos faltan, en vez de mezclarlos y dar un margen que no significa nada.
- **Persona y empresa separadas en la ficha.** La tarjeta se llama como la
  persona con la que uno habla; la boleta va a nombre de la empresa. Campos
  `empresa` y `rutEmpresa` en el cliente: la tarjeta muestra la razón social en
  chico bajo el nombre y la ficha suma un bloque **FACTURAR A**. El buscador
  encuentra por nombre, razón social, RUT de la persona y RUT de la empresa.
  Quien tiene `rutEmpresa` **no** cuenta como "sin RUT". Los dos campos
  formatean el RUT mientras se escribe y **validan el dígito verificador al
  salir del campo** — no en cada tecla, porque un RUT de empresa pasa por un
  largo intermedio que casi siempre da inválido y el rojo intermitente se acaba
  ignorando. El Cotizador ya validaba (`checkRut`); el Indicador no, y ahí se
  coló 73.394.670-8 en vez de 76.349.670-8. En el Cotizador,
  `fichasDeLaPersona()` cruza contra los dos RUT: si sólo mirara `c.rut`,
  cotizar a nombre de la empresa crearía una ficha duplicada con la razón social.
- **Pestaña FINANZAS**, entre INFORMACIÓN y ADMINISTRADOR. El corte:
  Administrador es catálogo y costos —configuración—; Finanzas es la plata
  —ventas por mes y año, trabajos por liquidar, al bolsillo, detalle del mes—.
  Se esconde del vendedor igual que Administrador. El formulario de liquidación
  vive aquí; en Seguimiento queda sólo el recordatorio con un botón para llegar,
  porque esa pantalla es para perseguir respuestas, no para hacer números.
- **Ventas por mes y por año**, en Finanzas, con barras horizontales
  (verticales no se leen en el teléfono). Neto, sin IVA, igual que "Al bolsillo".
  La línea de tiempo se rellena mes a mes aunque no haya ventas: un mes en cero
  es información. Con un solo año muestra el total y avisa; con dos o más dibuja
  las barras y el % contra el año anterior. Una sola serie por gráfico —si algún
  día se quiere el margen en el tiempo, va en su propio gráfico, nunca un segundo
  eje. El verde de las barras (`--barra:#35a862`) no es el `--grn` de los
  botones: un relleno grande necesita menos luz que un acento chico, y se
  verificó con validador, no a ojo.
- Botón **Revisar contra la planilla** en Seguimiento. La planilla es la que
  Isaac cura a mano, así que manda ella: el botón corrige monto, cliente,
  servicio, comuna y RUT, y **elimina del registro lo que la planilla no tiene**
  —pruebas viejas, o cotizaciones que perdieron su número cuando se apilaron los
  148—. No toca el seguimiento. Solo borra con un `No encontrada` explícito o
  con el número tomado por otro cliente; si el fetch falla no concluye nada,
  porque un corte de red no puede leerse como "esto no existe".
- Tendencia mes a mes, clientes que vuelven, motivos de pérdida, ticket y
  demora en cerrar.
- Las cotizaciones que esperan respuesta aparecen dentro de Recordatorios del
  Indicador, que era la "pantalla diaria única" del plan original.
- **Vista de tarjetas** en el Indicador, con relieve por urgencia (la altura
  dice cuánto urge), reverso con lo técnico, y paleta acero y cobre. La tabla
  sigue disponible desde el selector Tarjetas / Tabla.
- Tema claro por defecto: en terreno, con sol, se lee mejor que el oscuro.
- Correo del cliente en el traspaso y en la ficha.
- **Aviso enviado se desactiva solo al mes.** Al marcar "aviso enviado" (desde
  la tarjeta, la ficha, el formulario o al mandar WhatsApp) se guarda
  `avisoFecha`. Cada vez que la app carga datos, revisa esa fecha y si ya pasó
  un mes exacto, apaga el aviso solo — así Isaac ve que hay que volver a
  insistir con el cliente en vez de asumir que sigue avisado para siempre.
- **Visita técnica agendada crea el evento en Calendar con hora real**, no
  como "todo el día". Antes la hora solo quedaba escrita en la descripción y
  nunca llegaba al evento, así que las alertas se calculaban desde la
  medianoche en vez de la hora de la visita (por eso avisaba a las 11 PM para
  una visita a las 10 AM). El Apps Script ahora crea un evento con hora
  (`cal.createEvent`) cuando llega `hora`, y sigue como antes (todo el día) si
  no llega.
- **El calendario ya NO se sincroniza automáticamente al guardar un
  cliente.** Antes, cada vez que se guardaba una ficha se creaban/actualizaban
  solos dos eventos en Calendar ("🆕 Ingreso cliente" y "🔧 Mantención"), y
  existía un botón "Sync Calendar" para regenerarlos todos de una. Isaac pidió
  sacarlo (17 de agosto): el calendario es solo para agendar **visitas
  técnicas puntuales**, no un espejo automático de toda la base. Se eliminaron
  `syncCalendarioCliente()`, `sincronizarTodoCalendar()` y el botón del
  toolbar; `deleteCalendarioCliente()` ahora solo borra la visita agendada
  pendiente, no eventos de ingreso/mantención (ya no existen). Los campos
  `calIngresoId` / `calMantId` quedan sueltos en los clientes que los
  llegaron a tener — no se limpiaron de Firebase, solo dejaron de usarse.
  Además, el 17 de agosto se borraron a mano ~101 eventos viejos de Calendar
  (52 Ingreso + 47 Mantención + 2 Visita técnica) que se habían ido
  duplicando por este mismo mecanismo.
- Se eliminó **Plan Confort León** (campo, ícono, sección de Métricas):
  Isaac decidió que esa función ya no aplica. Quedan campos `plan` /
  `planhasta` sueltos en los clientes que alguna vez lo tuvieron marcado — no
  se limpiaron de Firebase, solo dejaron de leerse/mostrarse.
- **Documentos adjuntos** en la ficha del cliente (campo `documentos`, array
  de `{id, url, nombre, fecha}` en Storage bajo `documentos/`) — mismo patrón
  que `photos`. **Es de solo lectura desde el Indicador**: se ven, se abren y
  se comparten, pero no hay botón para subir. Se llenan solos — al guardar un
  comprobante, `actualizarFichaCliente()` en `comprobante-leon/index.html`
  capta `#sheet` con html2canvas, lo arma en PDF con jsPDF (ambas por CDN,
  agregadas ahí el 18 de agosto) y lo sube a ese mismo Storage. Si algo de eso
  falla (sin conexión, librería que no cargó), no revienta el guardado: el
  comprobante queda guardado igual, simplemente no llega el adjunto.
- **El historial de mantenciones es solo del botón "Registrar mantención"
  del Indicador.** El Comprobante llegó a escribir ahí una entrada por cada
  comprobante emitido ("Comprobante N° 166 — Reparación, Mantención."), y se
  sacó el 18 de agosto: un comprobante puede ser una reparación, una
  inspección o una garantía, no una mantención, y ensuciaba el historial con
  entradas que Isaac no había ingresado. El comprobante deja su rastro en
  `documentos`, no en `historial`. Las entradas viejas que alcanzó a crear
  siguen ahí y se borran a mano con la ✕ de cada una.
- **Reglas de Storage** en `storage.rules` (se le entregaron a Isaac para
  pegar en la consola): exigen sesión real, no anónima, para `clientes/` y
  `documentos/`. No replican el "ficha en /usuarios" que sí tiene
  `reglas-firebase.json` — Storage no puede leer la Realtime Database, así
  que esa mitad requeriría custom claims (Cloud Function aparte).

## Pendiente

- **App Check de Monitor a Enforce.** Al 13 de agosto había 50% de solicitudes
  sin verificar; activarlo así corta la mitad del tráfico. Revisar la tabla
  antes.
- **Duplicados existentes** en la base. El cliente único evita que se creen
  nuevos, no arregla los que ya están.
- **RUT vacíos** en los clientes que nunca pasaron por una cotización. Isaac los
  ingresa a mano.
- **Campañas por temporada**, para armar en septiembre cuando parte la temporada.
- **La columna de teléfono de la planilla de cotizaciones devuelve `#ERROR!`**
  en todas las filas: una fórmula rota en la hoja. Por eso los teléfonos
  históricos no se pudieron recuperar. El RUT y la comuna sí vienen bien.

---

## Lo que hay que saber antes de tocar algo

**Escribir la ficha entera desde una copia vieja borra lo que llegó mientras
tanto.** El modal de editar cliente se quedaba con la lista de documentos de
cuando se abrió (`modalDocs`) y al Guardar cambios la escribía encima. El
2026-08-18 el Comprobante N° 174 se adjuntó solo, con la ficha de Jaime Coiro
abierta, y desapareció al guardar: el PDF quedó en Storage (256 KB, sano) pero
sin enlazar en la ficha. Arreglado en v18 — ahora se parte de
`prevRow.documentos` (que el listener de Firebase mantiene al día) y se le
quitan los ids que el usuario borró con la ✕ (`modalDocsBorrados`). El mismo
riesgo existe para `photos`, `equipos` e `historial`, que siguen guardándose
desde la foto del modal: si alguna vez otra app escribe en esos campos, hay que
darles el mismo tratamiento.

**`.set()` de Firebase reemplaza el nodo entero: hay que mandarle la ficha
fusionada, no el formulario.** `saveModal()` armaba `row` con los 22 campos del
formulario, lo fusionaba bien en memoria (`Object.assign({}, data[i], row)`)
pero despues llamaba `saveRecord(row)` -- con `row` pelado. Como `saveRecord`
hace `.set()`, cada edicion de ficha **borraba de la base** todos los campos que
el formulario no muestra. Medido sobre los datos reales el 2026-08-19: 13 campos
en riesgo repartidos en 48 fichas -- `calIngresoId`/`calMantId` (34 y 32 fichas,
los ids de los eventos de Google Calendar), `plan` y `planhasta` (20),
`seguimiento` (11), `contactoPaso` (7), `visitaAgendada` (5), `reagenda` (3) y
`nroCotizacion`/`montoCotizado`/`cotizaciones`. La fusion en memoria lo tapaba
en pantalla hasta que volvia el eco de Firebase. Arreglado en v19: se guarda
`data[i]` ya fusionada. Comprobado con la version publicada como control -- con
el codigo viejo se pierden 11 de 11 campos ocultos, con el nuevo ninguno.

**La fecha de hoy no puede calcularse una sola vez.** `TODAY` era `const`
calculado al cargar. Una pestana abierta pasada la medianoche seguia calculando
vencimientos, dias restantes, colores de tarjeta y el encabezado con la fecha de
ayer; y `cerrarSesion()` no recarga la pagina, asi que volver a entrar tampoco
lo arreglaba. Arreglado en v20 con `refrescarHoy()`, que corre al volver a la
pestana y cada media hora. Ojo al tocarlo: `calMonth`/`calYear` se inicializan
desde `TODAY` pero el usuario los mueve al navegar el calendario, asi que
**no** hay que reiniciarlos ahi.

**Un cargador a pantalla completa necesita que TODAS las salidas lo apaguen.**
En el Cotizador, `generarYSubirPDF` muestra "Subiendo a Drive..." por dentro,
pero el botón "Generar PDF Formal" le pasaba `function(){}` como vuelta de
éxito: la subida terminaba bien y el cargador quedaba girando tapando la app.
Pasó el 2026-08-18, quedó pegado toda la tarde. Arreglado: las dos vueltas
llaman a `hideLoader()`, y la de error además avisa (antes el fallo era mudo).

Y `postToGAS` mandaba el XHR **sin `xhr.timeout`**. Si el Apps Script se queda
colgado no llega nunca `readyState 4` ni salta `onerror`, así que no se llama
ninguna de las dos vueltas y quien espera se queda esperando para siempre —
comprobado contra un servidor que acepta y no responde: sin tope seguía
esperando a los 8 s, con tope vuelve por la rama de error (status 0). Ahora
tiene tope de 90 s y una salida única para no llamar dos veces.

**Un `::after` sobre un `<input>` rompe html2canvas.** Era la causa raíz del
PDF recortado del Comprobante, y costó una mañana entera encontrarla. El visto
del checkbox se dibujaba con `input[type=checkbox]:checked::after` (bordes en L
+ `transform:rotate(45deg)`). html2canvas 1.4.1 revienta al procesar ese
pseudo-elemento con `Error parsing CSS component value, unexpected EOF`. No es
el borde ni el `content` ni el `transform`: se probó cambiando cada uno por
separado y sigue fallando; lo único que lo evita es que el pseudo-elemento no
exista (`content:none`). Ahora el visto va como `background-image` (SVG en data
URI) sobre el propio input. Da igual para el PDF —html2canvas dibuja los
checkbox a su manera— pero mantiene el diseño en pantalla.

Lo que lo hacía tan difícil de ver: ese checkbox marcado solo está en pantalla
cuando se marca "Mantención", que es lo que muestra `#vencrow`. Entonces el PDF
salía bien en todos los comprobantes **menos** en los de mantención. Y encima
el código tenía un respaldo que, al fallar el método clásico, reintentaba con
`foreignObjectRendering` — ese modo no falla pero devuelve la hoja recortada por
la izquierda y empezando por la mitad. Resultado: se adjuntaba en silencio un
comprobante ilegible. Ese respaldo se eliminó: si falla, que avise.

Ojo con el entorno: **esto no se reproduce en cualquier Chromium.** En el
navegador de pruebas el `::after` viejo funciona sin problema; solo falla en el
Chrome real de Isaac. Cualquier prueba de esto hay que correrla ahí.

**El Comprobante no avisa de versiones nuevas.** No tiene service worker ni
aviso de actualización (el Indicador sí tiene ambos). Una pestaña abierta sigue
ejecutando el JavaScript viejo indefinidamente. El 2026-08-18 esto costó tres
rondas de "sigue fallando" sobre un bug ya arreglado y publicado: confirmar con
`curl` que el servidor tiene la versión nueva **no prueba nada** sobre lo que
corre en la pestaña del usuario. Hay que leer el `v<N>` del pie en su navegador,
o pedir recarga forzada explícita antes de que pruebe. Isaac decidió no agregar
el aviso automático; queda como paso manual.

**Una prueba que no reproduce la falla no valida el arreglo.** El PDF recortado
del Comprobante se "arregló" tres veces seguidas contra un navegador de pruebas
donde el código roto también pasaba. Lo que zanjó el diagnóstico fue medir en el
Chrome real de Isaac (`mcp__claude-in-chrome__*`, aparece como `isLocal: true`)
calculando la caja de tinta del canvas con `getImageData`: 17% del ancho con el
código malo contra 100% con el bueno. Antes de usar una prueba para dar algo por
arreglado, correr primero el código roto y exigir que la prueba lo detecte.

**Probar el cotizador en local escribe en producción.** `saveRegList()` llama a
`saveCloudData()`, que hace un `fetch` directo al Apps Script con la URL y la
clave incrustadas: no depende del dominio ni de la sesión. Ya pasó una vez —
tres registros de prueba entraron al registro real y de ahí a Firebase. Antes de
ejecutar en la consola cualquier función que termine en `saveRegList()`, hay que
interceptar también `saveCloudData` y `postToGAS`.

**Publicar copiando un archivo desde otra rama pisa lo que se haya commiteado
en `main` por fuera de esa rama.** Pasó: el arreglo de pérdida de datos al
editar y el campo de correo se commitearon en `main`, y la publicación
siguiente los borró copiando el `index.html` de una rama que no los tenía.
Estuvieron 19 horas fuera de producción mientras se los daba por publicados.
**Verificar siempre el contenido del archivo publicado, no que el push haya
salido bien.** Son cosas distintas.

**Las fechas de las cotizaciones se guardan como `DD-MM-YYYY`**, no en ISO, y
el Indicador trabaja en ISO. Hay conversores en las dos apps (`fechaISO` /
`cotFechaISO`). Cualquier cálculo nuevo con fechas del Cotizador tiene que
pasar por ahí: mezclarlas hacía que los días transcurridos dieran `null` y que
agrupar por mes agrupara por día.

**La clave del Apps Script está en el HTML público.** Cualquiera que abra el
código fuente la tiene. Mientras siga así, el registro de cotizaciones queda
expuesto aunque Firebase esté perfecto.

**Los costos viajan al navegador.** La pestaña de administrador se esconde por
rol, pero el precio se calcula en el navegador a partir del costo, así que el
costo igual se descarga. Esconderlo de verdad requiere calcular el precio en el
servidor.

**La planilla de cotizaciones es la fuente de la verdad para los datos
descriptivos** —número, cliente, monto, ítems—. Firebase manda para el
seguimiento —estado, contactos, agrupación—, que no existe en la planilla.
Cuando las dos discrepan, gana la planilla.

**El registro de cotizaciones y la planilla ya no se hablan solos.** Firebase
es la fuente y el Apps Script no la pisa, que es lo correcto para el día a día.
El precio es que arreglar la planilla a mano no llega a la app: para eso está
el botón "Revisar contra la planilla". Si un monto se ve raro en Seguimiento,
ese es el primer lugar donde mirar.

**Ningún campo puede tener colores literales: todo sale de las variables del
tema.** El teléfono los tenía —un `#ffffff` fijo mientras el resto usaba
`var(--surface2)`— y por eso quedaba blanco cuando el resto estaba oscuro, con
el número pintado del mismo color que el fondo. Se veía vacío; lo único visible
era el subrayado rojo del corrector. Si un campo se ve distinto a los de al
lado, buscar primero un color escrito a mano.

**Las tarjetas no se mueven con el puntero, y es a propósito.** Hubo una
inclinación 3D que seguía al mouse y se probó que costaba caro: con la tarjeta
acomodándose debajo del cursor, apretar un botón de 34px fallaba, y al fallar la
tarjeta se daba vuelta — se perdía el clic. Se sacó entera. Si alguien la quiere
devolver, que sepa lo que rompe.

El relieve sí se mantiene, **quieto**: `--lift` 0 / 15 / 28 / 46px según urgencia,
con la sombra escalada sobre esa misma variable. La altura y el largo de la
sombra dicen cuánto urge, y se lee de un vistazo sin que nada se mueva. El
brillo que sigue al puntero puede quedarse: es un degradado pintado encima, no
cambia la geometría y no puede robarse un clic.

**Las ventanas del indicador se apilan por z-index y hay que respetarlo.** La
ficha está en 9000, el editor en 9500, el lightbox en 800, la galería en 650.
Cuando el editor estaba en 200 se abría *por detrás* de la ficha y la ficha se
comía los clics: parecía que la app se trabó. `openModal()` llama a
`cerrarTodoLoQueTape()` antes de abrir — ahí se agrega cualquier ventana nueva,
en vez de parchar los cinco botones de "Editar" que hay repartidos (tarjeta,
ficha, tabla, lista y calendario).

**Todo cambio en el indicador necesita subir `CACHE` en `sw.js`.** Si no, el
service worker sigue sirviendo el archivo viejo y el arreglo no llega nunca.
Va en v58 (17 de agosto).

**El indicador rearma el registro completo al guardar.** Todo campo que el
formulario no muestre se pierde al editar un cliente, salvo que se agregue a la
lista de campos preservados en `saveModal()`. Ya pasó una vez — por eso
`avisoFecha` (fecha del aviso automático, ver arriba) se agregó a mano en
`saveModal()` en vez de confiar en que sobreviviera solo.

**Un solo `undefined` rompe el guardado entero, y en silencio.** Firebase
rechaza `undefined` lanzando en el acto (no devolviendo una promesa fallida),
así que revienta `saveRecord()` y de paso todo lo que venga después en la
misma función: la ficha no se cierra, la tarjeta no se repinta, y no aparece
ningún mensaje. Se ve igual que "el botón no hace nada". Pasó el 17 de agosto
con `avisoFecha`: los clientes que ya tenían el aviso marcado de antes no
tenían ese campo, y `prevRow.avisoFecha` salía `undefined`. Hoy `saveRecord()`
limpia los `undefined` a `null` (`sinUndefined()`) y avisa con un toast si el
guardado falla, pero **al agregar un campo nuevo hay que pensar qué pasa con
las fichas viejas que no lo tienen**.

Y un detalle que engaña al diagnosticar: `confirmarAgendarVisita()` llama
`saveRecord()` **antes** de `sincronizarVisitaAgendada()`. Mientras
`saveRecord` lanzaba, la visita nunca llegaba a Calendar aunque el texto sí
quedara en la observación de la ficha — que es exactamente el síntoma que se
vio con Maria Paz.

**Probar con `useFirebase = false` no reproduce estos fallos.** localStorage
guarda con `JSON.stringify`, que descarta los `undefined` sin quejarse. Un
guardado que funciona en la prueba local puede estar roto en producción. Lo
mismo con reemplazar `saveRecord`/`render` por funciones vacías al probar en
consola: se salta justo el código que falla. Ojo también con que `fbRef` y
`useFirebase` están declarados con `let`, así que **no** se pueden sustituir
desde la consola con `window.fbRef = ...`.

**El reagendamiento se mira antes que la fecha de inicio, y las tres
funciones tienen que coincidir.** `statusOf()` y `diasRestantes()` empezaban
con `if (!r.inicia) return ...`, pero `fmtFinal()` miraba primero la
reagenda. Resultado: un cliente con visita acordada y sin fecha de inicio
cargada mostraba "FECHA FINAL (REAGENDADA)" en su ficha pero quedaba en
`gray` — no salía en el filtro Reagendados ni lo contaba el indicador de
arriba. Le pasó a Andrés Nawrath. Pasa con los clientes ingresados a mano,
que quedan a medias. Si se toca una de las tres, hay que revisar las otras
dos.

**En el teléfono se dibujaban dos listas de clientes a la vez.**
`#cards-container` es la lista que reemplaza a la tabla en pantallas chicas,
y el CSS la mostraba por ancho de pantalla sin mirar el selector
Tarjetas/Tabla — así que en el teléfono salía junto con `#cards-grid` y cada
cliente aparecía dos veces, con dos diseños distintos (uno con dirección y
teléfono, el otro no; de ahí la sensación de "la tarjeta no muestra lo que
tiene adentro"). Ahora `render()` le fija el display igual que a la tabla.
Son **tres** contenedores que se excluyen entre sí — `#cards-grid`,
`.table-container` y `#cards-container` — y los tres se manejan juntos.

**Un `eventId` que ya no existe hace fallar la llamada entera, y el error
llega disfrazado de CORS.** Si el evento se borró a mano en Calendar, el
Apps Script no puede actualizarlo y lanza; Google responde entonces con una
página de error que no trae cabeceras CORS, así que en el navegador se ve
"blocked by CORS policy" y `calPost()` devuelve `null`. No es un problema de
permisos ni de dominio: es el script fallando adentro. `sincronizarVisita-
Agendada()` ya lo maneja — si la llamada con `eventId` falla, reintenta sin
él, que crea el evento de nuevo y guarda el id nuevo.

**Las visitas agendadas se reintentan solas al cargar**
(`sincronizarVisitasPendientes()`): recorre las visitas de hoy en adelante y
las vuelve a mandar a Calendar. Es idempotente — el Apps Script actualiza la
que ya existe en vez de duplicarla. Corre **una sola vez por sesión** y eso
no es opcional: `patchRecordFields()` escribe en Firebase, lo que vuelve a
disparar el listener `on('value')` que la llamó, y sin el candado
(`visitasReintentadas`) se llamaría a sí misma sin parar.

**El Apps Script "Calendario León" vive solo en Google, no en este
repositorio.** Se edita a mano en `script.google.com` — no hay un archivo
`.gs` versionado acá. Si algo del calendario se rompe, primero pedirle a Isaac
que abra el editor y pegue el código actual, no asumir que coincide con lo
último que se le mandó.

---

## Cómo volver atrás

Cada cambio está en su rama y `main` tiene el historial completo. Para
deshacer una publicación:

```bash
git log --oneline main
git revert <commit>
git push origin main
```

Los datos no se pierden con eso: los cambios son de código, y la base tiene
respaldo diario.
