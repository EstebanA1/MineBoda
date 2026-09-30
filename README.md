# Invitación de Esteban y Nicole

Invitación web estática, pensada primero para teléfonos y lista para alojar en Vercel. El recorrido tiene una portada fotográfica, seis momentos que cambian al desplazarse, datos del día, vestimenta, confirmación de asistencia y una galería.

## Fotografías

Copia las imágenes originales en la carpeta `fotos/por-revisar/`. Las versiones optimizadas para la web están en `fotos/web/`; la 23 va en portada y las 3, 5, 10, 12, 14, 23, 36, 43, 49 y 51 forman el collage inicial. El recorrido usa las fotos 4, 6, 8, 17, 21 y 26. Las fotos 9, 15 y 52 aparecen en los detalles, vestimenta y RSVP, respectivamente. Se omiten la 20 (borrosa) y la 44. La galería mezcla los formatos según las dimensiones de cada WebP para formar un mosaico tipo tetris; las fotos 7, 24, 32, 34 y 45 ocupan doble altura, y la 40 y la 48 conservan el tamaño normal. La 46 muestra el encuadre completo y la 56 está girada en formato horizontal. El orden visual de las fotos está intercalado, y la carpeta con originales se excluye de Git para mantener ligero el repositorio.

## Datos usados para esta primera maqueta

- Pareja: Esteban y Nicole.
- Fecha de muestra: sábado 13 de febrero de 2027.
- Ceremonia: 18:00. Celebración: 20:00.
- Lugar propuesto: Espacio Los Aromos, Lagunillas, Coronel.
- Confirmación sugerida hasta el 13 de diciembre de 2026.
- Vestimenta formal; se pide a las invitadas evitar el blanco.

Los medios para confirmar asistencia se agregarán antes de compartir la invitación.

La fecha, el horario y el espacio son propuestas inventadas para dar forma a la maqueta. Conviene reemplazarlos antes de compartir la invitación con los invitados.

## Publicación

El proyecto usa HTML, CSS y JavaScript sin servidor ni dependencias de compilación. Para publicarlo, importa este repositorio en Vercel y conserva la configuración estática detectada automáticamente; la página de entrada es `index.html`.
