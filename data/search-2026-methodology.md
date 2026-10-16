# Top 10 · búsquedas de 2026 (sin respuestas)

- Fuente: [PokéTrends](https://poke-trends.com/methodology), datos derivados de Google Trends, licencia declarada CC BY 4.0.
- Se descargaron las series mensuales de las 1.025 especies del proveedor. Se usó exclusivamente enero–julio de 2026, los siete meses de 2026 disponibles en esa versión.
- Cuatro especies no tienen ningún mes de 2026. Se excluyeron, sin asignarles ceros ni reutilizar sus valores históricos. Cobertura efectiva: 1.021 especies. El resultado es el top entre las especies con datos disponibles, no una medición exhaustiva de todas las búsquedas.
- Medida: media aritmética de siete valores mensuales de interés relativo normalizado por el proveedor. No es volumen absoluto de búsquedas. No se normaliza nuevamente cada especie de forma independiente.
- Geografía: el texto metodológico declara consultas sin filtro geográfico (global), pero el mismo proveedor publica metadatos y advertencias sobre EE. UU. Se conserva esa ambigüedad de origen; no se afirma una cobertura territorial verificada.
- Cada especie participa en ambos tipos actuales de la Pokédex local; se excluyen formas alternativas. Empates: número de Pokédex ascendente. Diez puestos por tipo.
- Reproducción: `python scripts/build-search-ranking.py`. Las series descargadas se cachean en `.search-cache/` (ignorada por Git). El script solo imprime cobertura y no imprime respuestas.
- Los datos están en un sitio estático: las respuestas no se renderizan antes de acertar o de confirmar la revelación, pero un usuario técnico podría leer los archivos. Para jugar sin spoilers, no inspeccionar esos archivos ni abrir la fuente externa.

## Reglas de juego

Héctor y Guti se alternan después de cada respuesta válida o pase. Un acierto en el puesto 1 suma 10 puntos; en el puesto 10, 1 punto. Los fallos no descuentan. Repetir una respuesta o enviar vacío no consume turno. Cada tipo mantiene su propia ronda durante la sesión. Recargar inicia una sesión nueva. Revelar requiere confirmación y termina esa ronda; deshacer recupera la acción anterior.
