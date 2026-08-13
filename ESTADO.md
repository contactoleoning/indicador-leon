# Estado del sistema — León Ingeniería

Última actualización: 13 de agosto de 2026 (tarde).

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

El Cotizador además usa un **Google Apps Script** aparte para catálogos y PDFs.
El registro de cotizaciones va por ahí *y* por Firebase a la vez, hasta que se
corte el Apps Script para ese dato.

---

## Publicado y funcionando

- Sesión con correo y contraseña por persona, en las tres apps.
- Roles: el vendedor no ve la pestaña ADMINISTRADOR del cotizador.
- Reglas de base que rechazan tokens anónimos (verificado con el simulador).
- Respaldo diario automático de datos y reglas, sin borrado a los 30 días.
- Copia de prueba en `/beta` para las tres.
- Proveedor **Anónimo inhabilitado** en Authentication (13 de agosto).

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
  automática y relleno de teléfonos desde el Indicador.

## En rama, esperando prueba

Rama `fase4-canal-origen` en el cotizador, también en la beta.

- Selector "¿Cómo llegó?" en los datos del cliente (Instagram, referido,
  WhatsApp, llamada, cliente que vuelve).
- Tabla de rendimiento por canal: cuántas cotizaciones, qué porcentaje cerró y
  cuánta plata dejó cada uno.

## Pendiente

- **App Check de Monitor a Enforce.** Al 13 de agosto había 50% de solicitudes
  sin verificar; activarlo así corta la mitad del tráfico. Revisar la tabla
  antes.
- **Duplicados existentes** en la base. El cliente único evita que se creen
  nuevos, no arregla los que ya están.

---

## Lo que hay que saber antes de tocar algo

**Probar el cotizador en local escribe en producción.** `saveRegList()` llama a
`saveCloudData()`, que hace un `fetch` directo al Apps Script con la URL y la
clave incrustadas: no depende del dominio ni de la sesión. Ya pasó una vez —
tres registros de prueba entraron al registro real y de ahí a Firebase. Antes de
ejecutar en la consola cualquier función que termine en `saveRegList()`, hay que
interceptar también `saveCloudData` y `postToGAS`.

**El registro de cotizaciones se guarda en dos lados a la vez.** Firebase y el
Apps Script, a propósito, hasta confirmar que Firebase no falla. Son dos fuentes
de verdad y en algún momento pueden discrepar: no es un estado para quedarse
mucho tiempo. Cortar el Apps Script para el registro es el siguiente paso; los
catálogos seguirían ahí.

**La clave del Apps Script está en el HTML público.** Cualquiera que abra el
código fuente la tiene. Mientras siga así, el registro de cotizaciones queda
expuesto aunque Firebase esté perfecto.

**Los costos viajan al navegador.** La pestaña de administrador se esconde por
rol, pero el precio se calcula en el navegador a partir del costo, así que el
costo igual se descarga. Esconderlo de verdad requiere calcular el precio en el
servidor.

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
