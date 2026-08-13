# Seguridad — León Ingeniería

Estado al 13 de agosto de 2026.

---

## El problema que se está corrigiendo

La contraseña que pedían las apps no protegía los datos. Y la tercera, el
comprobante, no pedía nada: quien tuviera la dirección veía la lista completa
de clientes.

En el indicador, `initFirebase()` se conectaba con `signInAnonymously()` y dejaba
corriendo el listener de `leon_clientes` apenas cargaba la página. La base
completa de clientes se descargaba **antes** de que apareciera la pantalla de
contraseña, y esa pantalla solo hacía `display:none` sobre una app ya cargada.
Con la consola del navegador se leía todo sin saber el PIN.

Peor: como el `apiKey` viaja en el HTML público (eso es normal en Firebase y no
es el problema en sí), cualquier persona podía pedirle a Google un token anónimo
idéntico al de la app y consultar la base desde fuera, sin abrir la página.

Lo único que se interponía era App Check. Y en el comentario del propio código
está la advertencia: *"Mientras esté en modo Monitor en Firebase Console no
bloquea nada, solo lo mide."* Hay que confirmar en qué modo está.

**Lo que sí está bien:** una lectura sin autenticación ya está denegada
(`HTTP 401`), así que las reglas actuales no están completamente abiertas.

---

## Qué cambió en el código

Hecho en las tres apps, cada una en su rama `fase1-login-por-usuario`.

**Indicador:**

- Cada persona entra con su propio correo y contraseña (Firebase Auth).
- La base se conecta dentro de `onAuthStateChanged` y solo con un usuario real.
  Sin sesión: `useFirebase = false`, cero listeners, cero datos en memoria.
- El rol (`admin` o `vendedor`) se lee de `/usuarios/{uid}`. Si alguien no tiene
  ficha, entra como `vendedor`, que es el permiso más acotado.
- Cerrar sesión y el bloqueo por inactividad hacen `signOut()` de verdad y
  cortan los listeners.

**Cotizador:**

- Se carga `firebase-auth-compat` y se entra con el mismo correo.
- `getFirebaseIdToken()` devuelve el token de la sesión iniciada. Sin sesión
  devuelve `null`, en vez de crear una identidad anónima.
- La pestaña ADMINISTRADOR, que muestra costos y márgenes, se esconde para el
  rol `vendedor`.
- El campo Vendedor se autocompleta con el nombre de quien inició sesión.
- Botón **Salir** en el encabezado y bloqueo por inactividad a las 4 horas,
  igual que el indicador. Hacía falta porque antes la sesión moría al cerrar
  la pestaña (`sessionStorage`) y Firebase Auth, en cambio, la deja guardada:
  sin esto el cotizador quedaba abierto para siempre en un computador
  compartido.

**Comprobante:**

- No tenía pantalla de acceso de ningún tipo. Se le agregó una, con el mismo
  correo y contraseña de las otras dos.
- La lista de clientes y la reserva de folio ocurren solo con sesión abierta.
- Enlace **Salir** en la barra superior.

Probado en local en las tres: sin sesión no hay token, ni datos, ni folio
reservado, y la pestaña de administrador solo aparece con rol `admin`.

---

## Orden de puesta en marcha

**El orden importa.** Las reglas del paso 6 cierran la puerta a la auth
anónima, así que las tres apps tienen que estar publicadas con el login nuevo
antes de aplicarlas.

### 1. Crear los usuarios — en Firebase Console

En **Authentication → Sign-in method**, habilitar **Correo electrónico/contraseña**.

En **Authentication → Users**, crear una cuenta por persona. Conviene usar
correos reales del equipo, no uno compartido: la gracia es saber quién hizo qué.

### 2. Crear las fichas — en Realtime Database

Copiar el UID de cada usuario y crear en la base:

```
usuarios/
  {UID de Isaac}/   nombre: "Isaac León"     rol: "admin"
  {UID del vendedor}/ nombre: "…"            rol: "vendedor"
```

Sin ficha en `/usuarios`, las reglas del paso 6 no dejan entrar. Es a propósito:
así una cuenta creada por error no tiene acceso a nada.

### 3. Publicar el indicador

Solo después de que existan los usuarios. Probar el login en el sitio real, con
una cuenta, antes de seguir.

### 4. Publicar el cotizador

Mismo criterio. Verificar además que el botón «Agregar a Indicador de
Vencimiento» siga escribiendo bien, porque ahora usa el token de la sesión.

### 5. Publicar el comprobante

Probar que la lista de clientes carga y que el folio avanza. Es el que más
cambió: antes no tenía pantalla de acceso de ningún tipo.

### 6. Recién ahora, aplicar las reglas

Pegar `reglas-firebase.json` en **Realtime Database → Reglas**. Usar antes el
simulador que trae la consola.

### 7. Apagar el acceso anónimo

En **Authentication → Método de acceso**, el proveedor **Anónimo** aparece
habilitado. Es la puerta que se está cerrando: mientras siga encendida,
cualquiera con el `apiKey` público puede pedir un token válido.

**No apagarlo antes de este punto.** Las versiones publicadas hoy en
`contactoleoning.github.io` siguen usando auth anónima; si se desactiva antes,
dejan de sincronizar en plena jornada.

### 8. App Check en modo obligatorio

En **App Check**, pasar Realtime Database y Storage de *Monitor* a *Enforce*.
Revisar primero las métricas: si aparecen peticiones legítimas sin verificar,
enforcing las va a cortar.

---

## Pendientes que no cubre este cambio

- **La clave del Apps Script del cotizador.** El cotizador guarda catálogos,
  registro de cotizaciones y PDFs en un Google Apps Script, protegido por una
  clave escrita en el HTML público. Cualquiera que abra el código fuente la
  tiene. Mientras eso siga así, el registro de cotizaciones queda expuesto
  aunque Firebase esté perfecto.

- **Esconder costos y márgenes de los vendedores.** El rol ya existe, pero el
  precio se calcula en el navegador a partir del costo, así que el costo tiene
  que estar ahí para que la cuenta salga. Esconderlo de verdad requiere calcular
  el precio en el servidor. Es trabajo de la fase 2.

- **Storage.** Las fotos de mantención en `clientes/{id}.jpg` necesitan sus
  propias reglas, equivalentes a las de la base.

- **Buscar si hay una cuarta app.** El comprobante apareció de casualidad, al
  ver un nodo `leon_comprobantes_meta` en la consola que las reglas no cubrían.
  Antes de aplicar las reglas conviene mirar la raíz de la base y confirmar que
  no queda ningún otro nodo sin dueño.

---

## Cómo volver atrás

El cambio está en una rama aparte y `main` sigue intacto. Si algo falla después
de publicar:

```bash
git checkout main
```

y volver a subir ese `index.html`. Nadie pierde datos: el cambio es de acceso,
no toca la estructura de la base.
