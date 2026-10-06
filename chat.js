/* Cabeçalho, mensagens, compositor e pesquisa */
(function (A) {
  const $ = A.$, esc = A.esc, KEY = 'nx.msgs';
  let msgs = A.store.get(KEY, null) || A.seed();
  const save = () => A.store.set(KEY, msgs);
  const list = () => msgs[A.state.channelId] || (msgs[A.state.channelId] = []);
  const hm = ts => new Date(ts).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  const fmt = ts => { const d = new Date(ts); return (d.toDateString() === new Date().toDateString() ? 'Hoje às ' : d.toLocaleDateString('pt-PT') + ' ') + hm(ts); };
  const btn = (act, label, icon, extra = '') => `<button class="icon-btn" data-action="${act}" aria-label="${label}" ${extra}>${icon}</button>`;

  /* ChatHeader */
  A.renderHeader = () => {
    const h = A.currentChannel() || {};
    const on = !$('#app').classList.contains('members-hidden');
    $('#chatHeader').innerHTML = `<button class="icon-btn nav-toggle" data-h="nav" aria-label="Abrir menu">☰</button>
      <span aria-hidden="true">#</span><h1 class="chat__title" style="font-size:16px;margin:0">${esc(h.name || '')}</h1>
      <span class="chat__topic">${esc(h.topic || '')}</span>
      <button class="icon-btn" data-h="notif" aria-label="Notificações" aria-pressed="${A.state.notif}">${A.state.notif ? '🔔' : '🔕'}</button>
      <button class="icon-btn" data-h="search" aria-label="Pesquisar">🔍</button>
      <button class="icon-btn${on ? ' is-on' : ''}" data-h="members" aria-label="Mostrar/esconder membros">👥</button>`;
  };

  /* Message */
  const messageHTML = (m, prev) => {
    const u = A.userById(m.uid), grouped = prev && prev.uid === m.uid && !m.replyTo && m.ts - prev.ts < 3e5, mine = m.uid === 0;
    const r = m.replyTo && list().find(x => x.id === m.replyTo);
    const reacts = Object.entries(m.reactions || {}).map(([e, ids]) => `<button class="reaction${ids.includes(0) ? ' is-mine' : ''}" data-action="react" data-emoji="${e}">${e} ${ids.length}</button>`).join('');
    const text = A.state.editing === m.id ? `<input class="edit-input" value="${esc(m.text)}" aria-label="Editar mensagem">` : `<p>${esc(m.text)}${m.edited ? ' <small>(editado)</small>' : ''}</p>`;
    return `<article class="message${grouped ? ' message--grouped' : ''}" data-id="${m.id}">
      ${m.replyTo ? `<div class="message__reply">↱ ${r ? `<b>${esc(A.userById(r.uid).name)}</b> ${esc(r.text.slice(0, 70))}` : 'Mensagem original eliminada'}</div>` : ''}
      ${grouped ? `<time class="message__time">${hm(m.ts)}</time>` : A.avatar(u)}
      <div class="message__body">${grouped ? '' : `<header><b style="color:${u.color}">${esc(u.name)}</b><time>${fmt(m.ts)}</time></header>`}${text}<div class="reactions">${reacts}</div></div>
      <div class="message__actions" role="toolbar" aria-label="Ações da mensagem">
        ${btn('react', 'Reagir 👍', '👍', 'data-emoji="👍"')}${btn('react', 'Reagir ❤️', '❤️', 'data-emoji="❤️"')}${btn('react', 'Reagir 😂', '😂', 'data-emoji="😂"')}${btn('reply', 'Responder', '↩')}
        ${mine ? btn('edit', 'Editar', '✎') + btn('delete', 'Eliminar', '🗑') : ''}</div></article>`;
  };

  /* MessageList */
  A.renderMessages = (scroll = true) => {
    const l = list(), box = $('#messageList');
    box.innerHTML = l.length ? l.map((m, i) => messageHTML(m, l[i - 1])).join('') : '<p class="empty">Ainda não há mensagens. Escreve a primeira!</p>';
    if (scroll) box.scrollTop = box.scrollHeight;
  };
  A.renderChat = () => {
    A.state.replyTo = A.state.editing = null; showReply();
    A.renderHeader(); A.renderMessages();
    const h = A.currentChannel(); if (h) $('#messageInput').placeholder = `Mensagem para #${h.name}`;
  };

  function showReply() {
    const bar = $('#replyBar'), r = A.state.replyTo && list().find(x => x.id === A.state.replyTo);
    bar.hidden = !r;
    if (r) bar.innerHTML = `<span>A responder a <b>${esc(A.userById(r.uid).name)}</b></span><button class="icon-btn" data-action="cancel-reply" aria-label="Cancelar resposta">✕</button>`;
  }

  function send(text) {
    text = text.trim(); if (!text) return;
    list().push({ id: 'm' + Date.now() + Math.random().toString(36).slice(2, 5), uid: 0, text, ts: Date.now(), reactions: {}, replyTo: A.state.replyTo });
    A.state.replyTo = null; showReply(); save(); A.renderMessages();
  }

  function react(m, emoji) {
    m.reactions = m.reactions || {};
    const ids = m.reactions[emoji] || (m.reactions[emoji] = []), i = ids.indexOf(0);
    i >= 0 ? ids.splice(i, 1) : ids.push(0);
    if (!ids.length) delete m.reactions[emoji];
    save(); A.renderMessages(false);
  }

  /* SearchModal */
  A.openSearch = () => {
    A.modal('Pesquisar mensagens', '<input id="q" placeholder="Escreve para pesquisar…" aria-label="Pesquisar"><div class="result" id="res"></div>', m => {
      const res = m.querySelector('#res');
      m.querySelector('#q').addEventListener('input', e => {
        const q = e.target.value.trim().toLowerCase(); if (!q) { res.innerHTML = ''; return; }
        const re = new RegExp(esc(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const html = Object.entries(msgs).map(([cid, l]) => {
          const hits = l.filter(x => x.text.toLowerCase().includes(q)), f = A.findChannel(cid);
          return hits.length && f ? `<h4>${esc(f.server.name)} · #${esc(f.channel.name)}</h4>` + hits.slice(-10).map(x => `<button data-goto="${cid}"><b style="color:${A.userById(x.uid).color}">${esc(A.userById(x.uid).name)}</b> <small>${fmt(x.ts)}</small><br>${esc(x.text).replace(re, '<mark>$&</mark>')}</button>`).join('') : '';
        }).join('');
        res.innerHTML = html || '<p class="empty">Sem resultados.</p>';
      });
      res.addEventListener('click', e => { const b = e.target.closest('[data-goto]'); if (b) { A.closeModal(); A.goTo(b.dataset.goto); } });
    });
  };

  A.binders.push(() => {
    const input = $('#messageInput'), pop = $('#emojiPop');
    $('#messageForm').addEventListener('submit', e => { e.preventDefault(); send(input.value); input.value = ''; input.focus(); });
    $('#gifBtn').onclick = () => send('🎞️ [GIF simulado]');
    $('#attachBtn').onclick = () => $('#fileInput').click();
    $('#fileInput').onchange = e => { if (e.target.files[0]) send('📎 ' + e.target.files[0].name); e.target.value = ''; };
    pop.innerHTML = ['😀', '😂', '😍', '👍', '🎉', '🔥', '❤️', '😮', '😢', '🎮'].map(e => `<button type="button" aria-label="${e}">${e}</button>`).join('');
    $('#emojiBtn').onclick = () => { pop.hidden = !pop.hidden; $('#emojiBtn').setAttribute('aria-expanded', !pop.hidden); };
    pop.onclick = e => { if (e.target.closest('button')) { input.value += e.target.textContent; input.focus(); } };

    $('#replyBar').addEventListener('click', e => { if (e.target.closest('[data-action=cancel-reply]')) { A.state.replyTo = null; showReply(); } });

    $('#chatHeader').addEventListener('click', e => {
      const b = e.target.closest('[data-h]'); if (!b) return; const app = $('#app');
      if (b.dataset.h === 'nav') app.classList.add('nav-open');
      if (b.dataset.h === 'search') A.openSearch();
      if (b.dataset.h === 'notif') { A.state.notif = !A.state.notif; A.toast(A.state.notif ? 'Notificações ativas' : 'Notificações silenciadas'); A.renderHeader(); }
      if (b.dataset.h === 'members') {
        if (matchMedia('(max-width:900px)').matches) app.classList.toggle('members-open');
        else { app.classList.toggle('members-hidden'); A.store.set('nx.membersHidden', app.classList.contains('members-hidden')); }
        A.renderHeader();
      }
    });

    const box = $('#messageList');
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-action]'), art = e.target.closest('.message'); if (!b || !art) return;
      const id = art.dataset.id, m = list().find(x => x.id === id), a = b.dataset.action;
      if (a === 'react') react(m, b.dataset.emoji);
      if (a === 'reply') { A.state.replyTo = id; showReply(); input.focus(); }
      if (a === 'delete' && m.uid === 0) { msgs[A.state.channelId] = list().filter(x => x.id !== id); save(); A.renderMessages(false); }
      if (a === 'edit' && m.uid === 0) { A.state.editing = id; A.renderMessages(false); const i = box.querySelector('.edit-input'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
    });
    box.addEventListener('keydown', e => {
      if (!e.target.classList.contains('edit-input')) return;
      if (e.key === 'Escape') { A.state.editing = null; A.renderMessages(false); }
      if (e.key === 'Enter') {
        const m = list().find(x => x.id === A.state.editing), t = e.target.value.trim();
        if (t && m) { if (t !== m.text) { m.text = t; m.edited = true; } save(); }
        A.state.editing = null; A.renderMessages(false);
      }
    });
  });
})(window.App);
