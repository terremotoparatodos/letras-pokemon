/* Top 10: no answer content enters the DOM before a correct guess or confirmation. */
(async function () {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const D = window.LetrasDomain, G = window.SearchGame, A = window.BMAudio;
  const sessions = Array.from({ length: 18 }, (_, type) => ({ state: G.create(type), history: [] }));
  const params = new URLSearchParams(location.search);
  const spectator = params.get('espectador');
  let sync = null;
  let selected = Math.max(0, Math.min(17, Math.trunc(Number(params.get('tipo')) || 1) - 1));
  let boards, ready = false;
  const session = () => sessions[selected];
  const state = () => session().state;

  A.init({ correct: 'assets/audio/correct.wav', bomb: 'assets/audio/bomb.wav', perfect: 'assets/audio/perfect.wav', nextRound: 'assets/audio/next-round.wav' });
  function message(text, kind = '') {
    $('#feedback').textContent = text;
    $('#feedback').className = kind;
    if (sync && !spectator) sync.publish();
  }
  function fit() {
    const vertical = document.body.classList.contains('vertical');
    const w = vertical ? 1080 : 1920, h = vertical ? 1982 : 1080;
    const scale = Math.min(innerWidth / w, innerHeight / h);
    $('#search-reel').style.transform = `translate(-50%, -50%) scale(${scale})`;
  }
  function layout(vertical) {
    document.body.classList.toggle('vertical', vertical);
    $('#layout').textContent = vertical ? '↔ Horizontal' : '↕ Vertical';
    const url = new URL(location.href);
    if (vertical) url.searchParams.set('vista', 'vertical'); else url.searchParams.delete('vista');
    if (location.protocol !== 'file:') history.replaceState(null, '', url);
    fit();
  }
  function updateMute() {
    $('#mute').textContent = A.isMuted() ? '🔇' : '🔊';
    $('#mute').setAttribute('aria-label', A.isMuted() ? 'Activar sonidos' : 'Silenciar sonidos');
    $('#mute').setAttribute('aria-pressed', String(A.isMuted()));
  }
  function render() {
    const s = state(), finished = s.revealed || s.found.length === 10 || s.lives === 0;
    $('#lives').textContent = '♥'.repeat(s.lives) + '♡'.repeat(5 - s.lives);
    $('#lives').setAttribute('aria-label', `${s.lives} de 5 vidas`);
    $('#type-title').textContent = `TIPO ${D.TYPES[selected].toUpperCase()}`;
    $('#type-title').style.color = D.TYPE_COLORS[selected];
    $('#found-count').textContent = `${s.found.length} / 10`;
    document.querySelectorAll('#type-filter button').forEach((el, i) => el.setAttribute('aria-pressed', String(selected === i)));
    const list = $('#ranking');
    list.replaceChildren();
    for (let rank = 0; rank < 10; rank++) {
      const li = document.createElement('li'); li.className = 'rank-card';
      const number = document.createElement('span'); number.className = 'rank-number'; number.textContent = String(rank + 1).padStart(2, '0'); li.append(number);
      if (ready && (s.found.includes(rank) || s.revealed)) {
        const p = boards[selected][rank];
        li.classList.add(s.found.includes(rank) ? 'solved' : 'revealed');
        const image = document.createElement('img'); image.src = `assets/sprites/${p.id}.png`; image.alt = ''; li.append(image);
        const name = document.createElement('span'); name.className = 'rank-name'; name.textContent = p.name; li.append(name);
      } else {
        const hidden = document.createElement('span'); hidden.className = 'mystery'; hidden.textContent = '? ? ?'; hidden.setAttribute('aria-label', 'Puesto oculto'); li.append(hidden);
      }
      list.append(li);
    }
    $('#pokemon-answer').disabled = !!spectator || !ready || finished;
    $('#search-answer button').disabled = !!spectator || !ready || finished;
    $('#undo').disabled = !!spectator || !ready || !session().history.length;
    $('#reveal').disabled = !!spectator || !ready || s.revealed || s.found.length === 10;
    $('#next').disabled = !!spectator || !ready;
    document.querySelectorAll('#type-filter button').forEach(button => { button.disabled = !!spectator; });
  }
  function choose(type) {
    if (spectator) return;
    selected = type;
    $('#pokemon-answer').value = '';
    const url = new URL(location.href); url.searchParams.set('tipo', String(type + 1));
    if (location.protocol !== 'file:') history.replaceState(null, '', url);
    render();
    message(state().revealed ? 'Esta ronda ya fue revelada.' : state().lives === 0 ? 'Sin vidas. Pueden revelar las respuestas desde el panel.' : '¡Adiviná los diez puestos!');
    if (ready) A.play('nextRound');
  }
  D.TYPES.forEach((type, i) => {
    const button = document.createElement('button'); button.textContent = type; button.type = 'button';
    button.style.setProperty('--type', D.TYPE_COLORS[i]); button.addEventListener('click', () => choose(i));
    $('#type-filter').append(button);
  });
  $('#search-answer').addEventListener('submit', event => {
    event.preventDefault(); if (!ready || spectator) return;
    const result = G.guess(state(), boards[selected], $('#pokemon-answer').value);
    if (result.state !== state()) {
      session().history.push(state()); session().state = result.state;
      $('#pokemon-answer').value = '';
    }
    render();
    if (result.kind === 'correct' || result.kind === 'perfect') {
      A.play(result.kind);
      message(result.kind === 'perfect' ? '¡TOP 10 COMPLETO!' : `¡Acierto! Puesto ${result.rank + 1}`, 'good');
    } else if (result.kind === 'miss') {
      A.play('bomb');
      message(state().lives === 0 ? '¡Sin vidas! Ronda terminada. Las respuestas siguen ocultas.' : `No está en este top 10. Quedan ${state().lives} ${state().lives === 1 ? 'vida' : 'vidas'}.`, 'bad');
    }
    else if (result.kind === 'repeat') message('Esa respuesta ya se intentó. Probá otra.');
    else if (result.kind === 'empty') message('Escribí el nombre de un Pokémon.');
    $('#pokemon-answer').focus();
  });
  $('#undo').addEventListener('click', () => { if (!session().history.length) return; session().state = session().history.pop(); render(); message('Última acción deshecha.'); });
  $('#reveal').addEventListener('click', () => { $('#reveal-confirm').showModal(); $('#cancel-reveal').focus(); });
  $('#cancel-reveal').addEventListener('click', () => $('#reveal-confirm').close());
  $('#confirm-reveal').addEventListener('click', () => {
    session().history.push(state()); session().state = { ...state(), revealed: true };
    $('#reveal-confirm').close(); render(); message('Respuestas reveladas. La ronda terminó.');
  });
  $('#next').addEventListener('click', () => choose((selected + 1) % 18));
  $('#mute').addEventListener('click', () => { A.setMuted(!A.isMuted()); updateMute(); });
  $('#layout').addEventListener('click', () => layout(!document.body.classList.contains('vertical')));
  $('#guides').addEventListener('click', () => document.body.classList.toggle('clean'));
  $('#record').addEventListener('click', () => { document.body.classList.toggle('recording'); fit(); });
  function snapshot() {
    const s = state();
    const visible = s.revealed ? Array.from({ length: 10 }, (_, i) => i) : s.found;
    return { type: selected, lives: s.lives, found: [...s.found], revealed: s.revealed,
      cards: visible.map(rank => ({ rank, id: boards[selected][rank].id, name: boards[selected][rank].name })),
      text: $('#feedback').textContent, kind: $('#feedback').className, typing: $('#pokemon-answer').value };
  }
  function networkStatus(text) {
    $('#spectator-status').textContent = text;
    if (spectator) {
      $('#connection-notice').textContent = text === 'Conectado a la partida' ? '' : text;
      $('#connection-notice').hidden = text === 'Conectado a la partida';
    }
  }
  $('#spectator-start').addEventListener('click', () => {
    if (spectator || !ready || sync) return;
    const code = Array.from(crypto.getRandomValues(new Uint8Array(12)), n => n.toString(16).padStart(2, '0')).join('');
    const url = new URL(location.href);
    url.searchParams.set('espectador', code); url.searchParams.set('vista', 'vertical');
    $('#spectator-link').href = url.href; $('#spectator-link').hidden = false;
    $('#spectator-url').value = url.href; $('#spectator-url').hidden = false;
    $('#spectator-start').disabled = true;
    sync = window.SearchSync.connect({ code, watch: false, snapshot, status: networkStatus });
    sync.publish();
  });
  $('#pokemon-answer').addEventListener('input', () => { if (sync && !spectator) sync.publish(); });
  window.addEventListener('pagehide', () => { if (sync) sync.close(); });
  window.addEventListener('resize', fit);
  function togglePanel() {
    const panel = $('#control-panel');
    panel.hidden = !panel.hidden;
    if (!panel.hidden) $('#close-panel').focus();
  }
  $('#close-panel').addEventListener('click', togglePanel);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && event.target.matches('input, textarea')) { event.target.blur(); return; }
    if (event.target.matches('input, textarea') || $('#reveal-confirm').open) return;
    if (event.key.toLowerCase() === 'p' && !event.repeat) { event.preventDefault(); togglePanel(); }
    if (event.key.toLowerCase() === 'm') $('#mute').click();
    if (event.key.toLowerCase() === 'u' && !$('#undo').disabled) $('#undo').click();
  });
  layout(spectator ? params.get('vista') !== 'horizontal' : params.get('vista') === 'vertical'); updateMute(); render();
  if (spectator) {
    document.body.classList.add('spectator');
    $('.header-meta').prepend($('#found-count'));
    $('.answer-label').textContent = 'RESPUESTA EN JUEGO';
    message(''); networkStatus('Conectando con la partida…');
    if (!window.SearchSync.validCode(spectator)) { networkStatus('Enlace de espectador inválido. Creá uno desde el panel de la partida.'); return; }
    let lastFound = 0, lastLives = 5, lastType = null;
    sync = window.SearchSync.connect({ code: spectator, watch: true, status: networkStatus, receive(data) {
      selected = data.type;
      session().state = { ...G.create(selected), found: data.found, lives: data.lives, revealed: data.revealed };
      boards = Array.from({ length: 18 }, () => Array(10).fill(null));
      data.cards.forEach(p => { boards[selected][p.rank] = p; });
      ready = true; render(); $('#pokemon-answer').value = data.typing; message(data.text, data.kind);
      if (lastType !== null) {
        if (lastType !== selected) A.play('nextRound');
        else if (data.found.length > lastFound) A.play(data.found.length === 10 ? 'perfect' : 'correct');
        else if (data.lives < lastLives) A.play('bomb');
      }
      lastType = selected; lastFound = data.found.length; lastLives = data.lives;
    } });
    return;
  }
  try {
    const data = window.SEARCH_2026;
    if (!data) throw Error('No se pudo cargar el ranking.');
    if (data.meta.period !== '2026-01/2026-07' || data.scores.length !== data.meta.coverage) throw Error('Cobertura de datos inesperada.');
    boards = G.rankings(window.LETRAS_DATA.pokemon, data.scores);
    if (boards.some(board => board.length !== 10)) throw Error('Faltan puestos del ranking.');
    ready = true; render(); message('');
  } catch (error) { message(`${error.message} Recargá la página para reintentar.`, 'bad'); }
})();
