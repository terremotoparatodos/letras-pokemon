/* ─── CONFIGURACIÓN DE LETRAS POKÉMON ───
   Se puede editar sin tocar el resto del código. */
window.LETRAS_CONFIG = {
  players: ['HÉCTOR', 'GUTI'], // jugadores (izquierda, derecha)
  startingPlayer: 0,          // 0 = HÉCTOR abre la primera ronda, 1 = GUTI (después se alterna)
  totalRounds: 10,            // rondas por partida (sólo si `rounds` está vacío: salen al azar del banco)

  /* Rondas del video, en orden. La seed sólo cambia el orden de las cartas.
     "type10g4" = tipo Fuego sólo de Kanto a Sinnoh (gen 1–4). Poné `rounds: null` para volver al azar. */
  rounds: [
    'gen1:min',      //  1 · Kanto, más corto ........... Muk, Mew + Abra, Seel, Onix, Jynx (6)
    'type10g4:max',  //  2 · Fuego K–S, más largo ....... Charmander, Charmeleon, Typhlosion + 9 letras (10)
    'gen2:min',      //  3 · Johto, más corto ........... Natu, Xatu, Ho-Oh + 5 letras (10)
    'type16g4:max',  //  4 · Dragón K–S, más largo ...... Dragonair, Dragonite, Salamence + 8 letras (6)
    'type13g4:min',  //  5 · Eléctrico K–S, más corto ... Pichu, Minun, Shinx, Luxio, Rotom + 6 letras (12)
    'gen4:max',      //  6 · Sinnoh, más largo .......... Kricketune, Hippopotas, Lickilicky, Electivire (4)
    'gen3:min',      //  7 · Hoenn, más corto ........... Aron, Lotad + 5 letras (7)
    'type8g4:max',   //  8 · Fantasma K–S, más largo .... Misdreavus + 9 y 8 letras (10)
    'type2g4:min',   //  9 · Lucha K–S, más corto ....... Riolu + 6 y 7 letras (9)
    'gen2:max',      // 10 · Johto, más largo ........... Typhlosion, Feraligatr, Misdreavus, Forretress (4)
  ],
  /* Reserva para el botón 🎲 "Cambiar ronda" del panel (tecla C): se usan en este orden. */
  reserve: [
    'gen4:min',      // Sinnoh, más corto (9)
    'type4g4:max',   // Veneno K–S, más largo (9)
    'type16g4:min',  // Dragón K–S, más corto (8)
    'type14:min',    // Psíquico, más corto (6)
    'type3:min',     // Volador, más corto (7)
    'type13g4:max',  // Eléctrico K–S, más largo (8)
    'type7g4:max',   // Bicho K–S, más largo (8)
    'type18g4:min',  // Hada K–S, más corto (8)
    'type5g4:max',   // Tierra K–S, más largo (10)
    'type15g4:min',  // Hielo K–S, más corto (8)
  ],

  allowRetry: true,           // botón REINTENTAR RONDA (false para competitivo)
  perfectBonus: 0,            // puntos extra para quien completa el tablero
  bombPenalty: 0,             // puntos que pierde quien dice un Pokémon equivocado
  keepPointsOnBomb: true,     // al equivocarse se conservan los aciertos de esa ronda
  minCards: 6,                // "escalera": si el extremo tiene pocos Pokémon se suma el largo siguiente…
  maxCards: 12,               // …sin pasar de la grilla 4×3
  minValid: 3,                // tableros con menos cartas no se usan
  fuzzy: true,                // acepta un error de tipeo (dos en nombres de 9+ letras)
  audio: {                    // si el archivo no existe, se ignora en silencio
    correct: 'assets/audio/correct.mp3',
    bomb: 'assets/audio/bomb.mp3',
    perfect: 'assets/audio/perfect.mp3',
    nextRound: 'assets/audio/next-round.mp3',
  },
};
