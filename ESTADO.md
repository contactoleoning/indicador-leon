# Estado del sistema — León Ingeniería

Última actualización: 14 de agosto de 2026.

Este archivo existe porque ya no es una app: son tres, comparten una base de
datos, y hay trabajo publicado y trabajo esperando prueba. Sin esto, retomar
en dos meses significa reconstruir todo de memoria.

---

## Las tres apps

Las tres viven en `contactoleoning.github.io`, se publican desde la rama `main`
de su repositorio, y comparten el proyecto Firebase `leon-clientes`.

| App | Repositorio | Para qué |
|---|---|---|
| **Cotizador** | `cotizador-leon` | Catálogo por BTU, presupuesto, PDF, guion de llamada, seguimiento de cotizaciones y estadísticas |
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

**El indicador rearma el registro completo al guardar.** Todo campo que el
formulario no muestre se pierde al editar un cliente, salvo que se agregue a la
lista de campos preservados en `saveModal()`. Ya pasó una vez.

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
