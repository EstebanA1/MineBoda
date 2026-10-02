# Conectar la confirmación con Google Sheets

La página de confirmación vive en `form/index.html` y se publica como `https://mineboda.vercel.app/form/`. El diseño está listo, pero el envío queda desactivado hasta conectar una URL de Apps Script en `form/config.js`.

## Preparación en tu cuenta de Google

1. Crea una hoja de cálculo nueva, por ejemplo `Confirmaciones MineBoda`.
2. En la hoja, abre **Extensiones → Apps Script**.
3. Copia el contenido de `form/apps-script/Code.gs` al editor de Apps Script y guarda el proyecto.
4. En **Configuración del proyecto → Propiedades del script**, agrega `SPREADSHEET_ID`. Su valor es el identificador de la hoja: la parte de la URL que aparece entre `/spreadsheets/d/` y `/edit`.
5. En el editor, selecciona `setupSheet` y pulsa **Ejecutar**. Autoriza el acceso a la hoja cuando Google lo solicite. Se creará una pestaña `RSVP` con encabezados.
6. Pulsa **Implementar → Nueva implementación**, selecciona **Aplicación web**, elige **Ejecutar como: yo** y permite el acceso de los invitados con **Cualquier usuario**. Implementa y copia la URL que termina en `/exec`.
7. Pega esa URL en `form/config.js` como valor de `endpoint`:

   ```js
   window.RSVP_CONFIG = {
     endpoint: "https://script.google.com/macros/s/ID_DE_IMPLEMENTACION/exec"
   };
   ```

8. Cuando esté lista, publica los cambios del repositorio en Vercel. Antes de compartir el enlace, envía una respuesta de prueba y confirma que aparece como una fila nueva en la pestaña `RSVP`.

## Actualizar el Apps Script después de editarlo

Si cambias `form/apps-script/Code.gs`, copia también esos cambios en el editor de Apps Script y guarda. Luego abre **Implementar → Gestionar implementaciones**, edita la implementación de aplicación web, selecciona **Nueva versión** y pulsa **Implementar**. Al editar la implementación existente, conserva la URL `/exec` configurada en `form/config.js`.

La hoja puede quedarse privada: el Apps Script se ejecuta con tu cuenta y solo añade respuestas. La web pública no tiene permiso para leer la hoja. No compartas el acceso a la hoja con los invitados.

## Campos que se guardan

Cada respuesta ocupa una fila con fecha de envío, nombre principal, asistencia, número de personas, acompañante, alergias o restricciones y comentario. Si no asiste, el conteo de personas queda en cero. Los campos del acompañante aparecen y se vuelven obligatorios solo al escoger dos asistentes.

El servidor evita duplicados comparando el nombre principal sin distinguir mayúsculas, tildes o espacios repetidos. Esto ayuda con reenvíos y errores comunes, pero no comprueba la identidad de quien responde: sin cuentas o códigos individuales una persona podría usar otro nombre, y dos invitados con el mismo nombre podrían coincidir. Para garantizar una respuesta por invitación, habría que crear códigos únicos y repartir uno a cada persona o grupo invitado.

El formulario incluye un campo trampa para bots, pero una página pública sin inicio de sesión todavía puede recibir envíos automatizados. Para esta invitación pequeña suele ser suficiente; no uses la hoja para guardar datos más sensibles de los necesarios.
