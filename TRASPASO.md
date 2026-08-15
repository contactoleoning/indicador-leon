# León Ingeniería — estado del proyecto y qué falta

Documento para retomar el trabajo en una conversación nueva.
Escrito el 15 de agosto de 2026.

---

## Qué es esto

León Ingeniería y Proyectos SpA — climatización (HVAC) en Santiago, Chile.
Isaac León trabaja con un ayudante. Tres aplicaciones web, un solo Firebase.

| App | Dirección | Repositorio | Para qué |
|---|---|---|---|
| **Cotizador** | contactoleoning.github.io/cotizador-leon | `cotizador-leon` | Catálogo por BTU, presupuesto, PDF, seguimiento de cotizaciones, finanzas |
| **Indicador** | contactoleoning.github.io/indicador-leon | `indicador-leon` | Clientes, vencimientos de mantención, equipos, fotos, ruteo, recordatorios |
| **Comprobante** | contactoleoning.github.io/comprobante-leon | `comprobante-leon` | Comprobante que se emite en terreno, con folio correlativo |

Cada una es **un solo archivo HTML** (el cotizador pesa ~1 MB) publicado con
GitHub Pages desde la rama `main`. No hay build ni dependencias externas.

**La documentación viva está en `indicador leon/ESTADO.md`.** Ese archivo tiene
el detalle técnico, los nodos de la base de datos y las trampas conocidas.
Leerlo antes de tocar código.

---

## Lo que falta

### 1. Tareas de Isaac (no son de código)

- **App Check: pasar de Monitor a Enforce** en la consola de Firebase. Al 13 de
  agosto había 50% de solicitudes sin verificar; activarlo así corta la mitad
  del tráfico. Hay que revisar la tabla primero hasta que el porcentaje baje.
- **Arreglar la fórmula de la columna TELÉFONO** en la planilla de cotizaciones:
  devuelve `#ERROR!` en todas las filas. Por eso los teléfonos históricos no se
  pudieron recuperar. El RUT y la comuna sí vienen bien.
- **Completar los RUT vacíos** de los clientes que nunca pasaron por una
  cotización. Decidió ingresarlos a mano.
- **Cargar la empresa de Carolina Santa Cruz**: razón social *Inversiones y
  Asesorías Punta de Águilas Limitada*, RUT **76.349.670-8**. Ojo: tecleó
  73.394.670-8 (dos dígitos cambiados de lugar) y el sistema se lo marcó.
- **Limpiar los clientes duplicados** que ya existen en la base. El criterio de
  cliente único evita que se creen nuevos, no arregla los viejos.

### 2. El hábito del que depende todo lo demás

Nada de las métricas sirve si no se alimenta:

- **Marcar las cotizaciones** como *Cerró* o *Se perdió* (con motivo).
- **Agrupar alternativas** cuando a un cliente se le dan varias opciones.
- **Liquidar los trabajos cerrados** en Finanzas: anotar equipos, materiales,
  ayudante y otros, para saber cuánto quedó de verdad.

Al 15 de agosto hay cotizaciones pendientes de marcar y de agrupar —Andrés
Nawrath (154, 156, 158), Ana Moya (155, 157) y Paola Salas (144, 147)—.

### 3. Trabajo de código pendiente

- **Campañas por temporada.** Planificado para septiembre, cuando parte la
  temporada. No está empezado.
- **Decisión sobre la pestaña INFORMACIÓN del cotizador.** Isaac la había
  pensado originalmente para tener catálogos de equipos que mostrarle al
  cliente ("¿tienes el catálogo de este equipo?"), y hoy tiene el seguimiento
  de cotizaciones. Si vuelve a ser catálogos, el seguimiento necesita pestaña
  propia — probablemente **SEGUIMIENTO**, que además es la pantalla diaria.
- **El campo TELÉFONO del indicador.** Isaac lo ve con fondo claro mientras los
  campos de al lado se ven oscuros, con el número casi invisible. **No se pudo
  reproducir ni encontrar la causa** en seis intentos: no hay estilos en línea,
  ningún elemento padre con `data-theme`, no hay `prefers-color-scheme` y el
  blanco literal se eliminó. La solución actual (v17) no discute con el CSS:
  mide en pantalla el fondo del campo vecino y se lo copia al abrir la ficha.
  Probado contra una regla `!important` que fuerza el blanco, y aun así queda
  igual. **Si vuelve a aparecer, hay que averiguar navegador y equipo** — desde
  el código ya no se alcanza.

### 4. Deuda de seguridad conocida

Ninguna es urgente, pero conviene tenerlas presentes:

- **La clave del Apps Script está en el HTML público.** Cualquiera que abra el
  código fuente la tiene. Mientras siga así, el historial de cotizaciones queda
  expuesto aunque Firebase esté perfecto.
- **Los costos viajan al navegador.** La pestaña de administrador se esconde por
  rol, pero el precio se calcula en el navegador a partir del costo, así que el
  costo igual se descarga. Esconderlo de verdad requiere calcular el precio en
  el servidor.

---

## Trampas — leer antes de tocar código

Estas ya costaron caro una vez cada una.

1. **Probar el cotizador en local escribe en producción.** `saveRegList()` llama
   a `saveCloudData()`, que hace un `fetch` directo al Apps Script con la URL y
   la clave incrustadas: no depende del dominio ni de la sesión. Ya entraron
   registros de prueba a los datos reales. Antes de ejecutar en la consola
   cualquier función que termine en `saveRegList()`, interceptar también
   `saveCloudData` y `postToGAS`.

2. **Verificar el contenido del archivo publicado, no que el push haya salido
   bien.** Son cosas distintas. Una vez se publicó copiando el `index.html`
   desde otra rama y se borraron cambios que estaban en `main`: estuvieron 19
   horas fuera de producción mientras se los daba por publicados.

3. **Todo cambio en el indicador necesita subir `CACHE` en `sw.js`.** Si no, el
   service worker sigue sirviendo el archivo viejo. Va en **v17**. La app
   muestra su versión abajo a la derecha — mirarla ahí antes de concluir que un
   arreglo no funcionó.

4. **Mantener las carpetas `/beta` sincronizadas.** Son copias publicadas desde
   `main` en su propia carpeta. Estuvieron congeladas (el indicador en el 14 de
   agosto, el cotizador en el 13) recibiendo cero arreglos. Se sincronizaron el
   15. **La beta escribe en los datos reales**, no es un sandbox.

5. **Las fechas de las cotizaciones se guardan como `DD-MM-YYYY`**, no en ISO, y
   el indicador trabaja en ISO. Hay conversores en las dos apps (`fechaISO` /
   `cotFechaISO`). Cualquier cálculo nuevo con fechas del cotizador tiene que
   pasar por ahí.

6. **El indicador rearma el registro completo al guardar.** Se resolvió con
   `Object.assign(data[i], row)`, pero cualquier campo nuevo del formulario
   tiene que sumarse a `row` en `saveModal()` o se pierde al editar.

7. **Ningún campo puede tener colores literales: todo sale de las variables del
   tema.** Si un campo se ve distinto a los de al lado, buscar primero un color
   escrito a mano.

8. **Las tarjetas del indicador no se mueven con el puntero, y es a propósito.**
   Hubo una inclinación 3D que seguía al mouse: con la tarjeta acomodándose
   debajo del cursor, apretar un botón de 34px fallaba, y al fallar la tarjeta
   se daba vuelta. Se sacó entera. El relieve por urgencia se mantiene, quieto.

9. **Las ventanas se apilan por z-index.** La ficha está en 9000 y el editor en
   9500. `openModal()` llama a `cerrarTodoLoQueTape()` antes de abrir; ahí se
   agrega cualquier ventana nueva.

---

## Cómo volver atrás

Cada cambio está en su rama y `main` tiene el historial completo.

```bash
git log --oneline main
git revert <commit>
git push origin main
```

Los datos no se pierden: los cambios son de código y la base tiene respaldo
diario automático, con el borrado a los 30 días desactivado.
