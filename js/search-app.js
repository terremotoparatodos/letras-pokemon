/* Top 10: no answer content enters the DOM before a correct guess or confirmation. */
(async function () {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const D = window.LetrasDomain, G = window.SearchGame, A = window.BMAudio;
  const sessions = Array.from({ length: 18 }, (_, type) => ({ state: G.create(type), history: [] }));
  const params = new URLSearchParams(location.search);
  let selected = Math.max(0, Math.min(17, Math.trunc(Number(params.get('tipo')) || 1) - 1));
  let boards, ready = false;
  const session = () => sessions[selected];
  const state = () => session().state;

  A.init({ correct: 'assets/audio/correct.wav', bomb: 'assets/audio/bomb.wav', perfect: 'assets/audio/perfect.wav', nextRound: 'assets/audio/next-round.wav' });
  function message(text, kind = '') {
    $('#feedback').textContent = text;
    $('#feedback').className = kind;
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
    history.replaceState(null, '', url);
    fit();
  }
  function updateMute() {
    $('#mute').textContent = A.isMuted() ? '🔇' : '🔊';
    $('#mute').setAttribute('aria-label', A.isMuted() ? 'Activar sonidos' : 'Silenciar sonidos');
    $('#mute').setAttribute('aria-pressed', String(A.isMuted()));
  }
  function render() {
    const s = state(), finished = s.revealed || s.found.length === 10;
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
    $('#pokemon-answer').disabled = !ready || finished;
    $('#search-answer button').disabled = !ready || finished;
    $('#undo').disabled = !ready || !session().history.length;
    $('#reveal').disabled = !ready || finished;
    $('#next').disabled = !ready;
  }
  function choose(type) {
    selected = type;
    $('#pokemon-answer').value = '';
    const url = new URL(location.href); url.searchParams.set('tipo', String(type + 1)); history.replaceState(null, '', url);
    render();
    message(state().revealed ? 'Esta ronda ya fue revelada.' : '¡Adiviná los diez puestos!');
    if (ready) A.play('nextRound');
  }
  D.TYPES.forEach((type, i) => {
    const button = document.createElement('button'); button.textContent = type; button.type = 'button';
    button.style.setProperty('--type', D.TYPE_COLORS[i]); button.addEventListener('click', () => choose(i));
    $('#type-filter').append(button);
  });
  $('#search-answer').addEventListener('submit', event => {
    event.preventDefault(); if (!ready) return;
    const result = G.guess(state(), boards[selected], $('#pokemon-answer').value);
    if (result.state !== state()) {
      session().history.push(state()); session().state = result.state;
      $('#pokemon-answer').value = '';
    }
    render();
    if (result.kind === 'correct' || result.kind === 'perfect') {
      A.play(result.kind);
      message(result.kind === 'perfect' ? '¡TOP 10 COMPLETO!' : `¡Acierto! Puesto ${result.rank + 1}`, 'good');
    } else if (result.kind === 'miss') { A.play('bomb'); message('No está en este top 10. ¡Sigan intentando!', 'bad'); }
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
  layout(params.get('vista') === 'vertical'); updateMute(); render();
  try {
    const response = await fetch('data/search-2026.json');
    if (!response.ok) throw Error('No se pudo descargar el ranking.');
    const data = await response.json();
    if (data.meta.period !== '2026-01/2026-07' || data.scores.length !== data.meta.coverage) throw Error('Cobertura de datos inesperada.');
    boards = G.rankings(window.LETRAS_DATA.pokemon, data.scores);
    if (boards.some(board => board.length !== 10)) throw Error('Faltan puestos del ranking.');
    ready = true; render(); message('¡Todo listo! Las respuestas están ocultas.');
  } catch (error) { message(`${error.message} Recargá la página para reintentar.`, 'bad'); }
})();
