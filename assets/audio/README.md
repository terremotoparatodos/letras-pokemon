# Audio

Efectos arcade originales (los mismos de Buscaminas Pokémon). Si alguno no carga, no suena nada (fallback silencioso):

| Archivo          | Cuándo suena                        |
|------------------|-------------------------------------|
| `correct.wav`    | al acertar un Pokémon               |
| `bomb.wav`       | al decir un Pokémon equivocado      |
| `perfect.wav`    | tablero completo                    |
| `next-round.wav` | al pasar a la ronda siguiente       |

Las rutas se cambian en `js/config.js` (`audio`). Mute: botón 🔊 del panel o tecla `M`.
