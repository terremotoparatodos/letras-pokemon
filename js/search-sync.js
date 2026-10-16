/* Read-only spectators. Only already visible answers cross the connection. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SearchSync = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const validCode = s => typeof s === 'string' && /^[a-f0-9]{24}$/.test(s);
  function validSnapshot(s) {
    return !!s && Number.isInteger(s.type) && s.type >= 0 && s.type < 18 &&
      Number.isInteger(s.lives) && s.lives >= 0 && s.lives <= 5 &&
      typeof s.revealed === 'boolean' && Array.isArray(s.found) && s.found.length <= 10 &&
      s.found.every(r => Number.isInteger(r) && r >= 0 && r < 10) && new Set(s.found).size === s.found.length &&
      Array.isArray(s.cards) && s.cards.length === (s.revealed ? 10 : s.found.length) &&
      s.cards.every(p => p && typeof p === 'object') &&
      new Set(s.cards.map(p => p.rank)).size === s.cards.length && s.cards.every(p =>
        Number.isInteger(p.rank) && p.rank >= 0 && p.rank < 10 && (s.revealed || s.found.includes(p.rank)) &&
        Number.isInteger(p.id) && p.id > 0 && p.id <= 1025 && typeof p.name === 'string' && p.name.length <= 60) &&
      typeof s.text === 'string' && s.text.length <= 300 && typeof s.kind === 'string' && ['', 'good', 'bad'].includes(s.kind) &&
      typeof s.typing === 'string' && s.typing.length <= 60;
  }
  function connect({ code, watch, snapshot, receive, status }) {
    if (!validCode(code)) throw Error('Enlace de espectador inválido.');
    let peer, channel, connection, timer, heartbeat, sequence = 0, latest = -1, lastSeen = 0, stopped = false, lastState = '';
    const clients = new Set();
    const prefix = 'pokemon-top10-v1-';
    function packet() { return { t: 'state', v: 1, seq: ++sequence, state: snapshot() }; }
    function accept(msg) {
      if (!msg || msg.v !== 1 || msg.t !== 'state' || !Number.isSafeInteger(msg.seq) || msg.seq < latest || !validSnapshot(msg.state)) return;
      latest = msg.seq; lastSeen = Date.now();
      const encoded = JSON.stringify(msg.state);
      if (encoded !== lastState) { lastState = encoded; receive(msg.state); }
      status('Conectado a la partida');
    }
    function send(conn, data) { if (conn.open) { try { conn.send(data); } catch (error) { console.warn('No se pudo sincronizar un espectador:', error.message); } } }
    function publish() {
      if (watch || stopped) return;
      const msg = packet(); if (!validSnapshot(msg.state)) return;
      if (channel) channel.postMessage(msg);
      for (const conn of clients) send(conn, msg);
    }
    try {
      channel = new BroadcastChannel(prefix + code);
      channel.onmessage = event => { if (watch) accept(event.data); else if (event.data?.t === 'watch') publish(); };
      if (watch) channel.postMessage({ t: 'watch' });
    } catch (error) { console.warn('Sin sincronización local; se usará la conexión en línea:', error.message); }
    function retry() {
      clearTimeout(timer);
      if (!stopped) timer = setTimeout(open, 3500);
    }
    function open() {
      timer = null;
      if (stopped) return;
      if (peer) peer.destroy();
      if (typeof window.Peer !== 'function') { status('Conexión local disponible. No se pudo cargar la conexión en línea.'); return; }
      peer = watch ? new window.Peer({ debug: 0 }) : new window.Peer(prefix + code, { debug: 0 });
      peer.on('open', () => {
        if (!watch) { status('Espectador listo · mantené esta pestaña abierta'); publish(); return; }
        connection = peer.connect(prefix + code, { reliable: true });
        connection.on('open', () => connection.send({ t: 'watch' }));
        connection.on('data', accept);
        connection.on('close', retry);
        connection.on('error', retry);
      });
      peer.on('connection', conn => {
        if (watch || clients.size >= 12) { conn.close(); return; }
        clients.add(conn);
        conn.on('open', () => send(conn, packet()));
        conn.on('data', msg => { if (msg?.t === 'watch') send(conn, packet()); });
        conn.on('close', () => clients.delete(conn));
        conn.on('error', () => clients.delete(conn));
      });
      peer.on('error', () => { if (!lastSeen || Date.now() - lastSeen > 6000) status('Esperando conexión con la partida…'); retry(); });
      peer.on('disconnected', retry);
    }
    open();
    heartbeat = setInterval(() => {
      if (!watch) publish();
      else {
        if (channel) channel.postMessage({ t: 'watch' });
        if (lastSeen && Date.now() - lastSeen > 6500) status('Conexión interrumpida. Esperando a la partida…');
        if (!lastSeen && !timer && (!connection || !connection.open)) retry();
      }
    }, 2000);
    return { publish, close() { stopped = true; clearTimeout(timer); clearInterval(heartbeat); if (channel) channel.close(); if (peer) peer.destroy(); } };
  }
  return { validCode, validSnapshot, connect };
});
