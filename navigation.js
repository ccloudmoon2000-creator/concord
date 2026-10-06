/* Servidores, canais, menu do servidor, criação e navegação mobile */
(function (A) {
  const $ = A.$, esc = A.esc;

  /* ServerList */
  A.renderServers = () => {
    $('#serverList').innerHTML = A.data.servers.map(s => `<button class="server${s.id === A.state.serverId ? ' is-active' : ''}" data-server="${s.id}" aria-label="${esc(s.name)}" title="${esc(s.name)}" aria-current="${s.id === A.state.serverId}">${esc(s.icon)}</button>`).join('')
      + '<hr class="separator"><button class="server server--action" data-act="add-server" aria-label="Criar servidor" title="Criar servidor">＋</button><button class="server server--action" data-act="explore" aria-label="Explorar servidores" title="Explorar">🧭</button>';
  };

  /* ServerSidebar + ChannelList */
  A.renderSidebar = () => {
    const s = A.currentServer(); $('#serverName').textContent = s.name;
    $('#channelList').innerHTML = s.categories.map(c => `<section class="category"><header><span>${esc(c.name)}</span><button class="icon-btn" style="height:24px;min-width:24px" data-act="add-channel" data-category="${esc(c.name)}" aria-label="Criar canal em ${esc(c.name)}">＋</button></header>`
      + c.channels.map(h => `<button class="channel${h.id === A.state.channelId ? ' is-active' : ''}${A.state.voice === h.id ? ' is-joined' : ''}" data-channel="${h.id}" ${h.id === A.state.channelId ? 'aria-current="true"' : ''}><span class="channel__icon" aria-hidden="true">${h.type === 'voice' ? '🔊' : '#'}</span>${esc(h.name)}</button>`).join('') + '</section>').join('');
  };

  const persist = () => { A.store.set('nx.server', A.state.serverId); A.store.set('nx.channel', A.state.channelId); };
  const closeDrawers = () => $('#app').classList.remove('nav-open', 'members-open');
  const firstText = s => s.categories.flatMap(c => c.channels).find(h => h.type === 'text');

  A.selectServer = id => {
    const s = A.data.servers.find(x => x.id === id); if (!s) return;
    A.state.serverId = id; A.state.channelId = (firstText(s) || s.categories[0].channels[0]).id;
    persist(); A.renderServers(); A.renderSidebar(); A.renderChat();
  };
  A.selectChannel = id => {
    const h = (A.findChannel(id) || {}).channel; if (!h) return;
    if (h.type === 'voice') { A.state.voice = A.state.voice === id ? null : id; A.toast(A.state.voice ? `Ligado a 🔊 ${h.name}` : 'Desligado da chamada'); A.renderSidebar(); return; }
    A.state.channelId = id; persist(); closeDrawers(); A.renderSidebar(); A.renderChat();
  };
  A.goTo = id => { const f = A.findChannel(id); if (!f) return; A.state.serverId = f.server.id; A.state.channelId = id; persist(); closeDrawers(); A.renderServers(); A.renderSidebar(); A.renderChat(); };

  /* Modais de criação */
  const createServer = () => A.modal('Criar servidor', '<form><label>Nome do servidor<input name="n" maxlength="24" required></label><br><button class="btn btn--primary">Criar</button></form>', m => {
    m.querySelector('form').onsubmit = e => {
      e.preventDefault(); const n = e.target.n.value.trim(), id = Date.now();
      A.data.servers.push({ id, name: n, icon: n[0].toUpperCase(), categories: [{ name: 'GERAL', channels: [{ id: 'c' + id, name: 'geral', type: 'text', topic: 'Canal inicial' }] }] });
      A.saveServers(); A.closeModal(); A.selectServer(id);
    };
  });
  const createChannel = category => A.modal('Criar canal', '<form><label>Nome<input name="n" maxlength="24" required></label><label>Tipo<select name="t"><option value="text">Texto</option><option value="voice">Voz</option></select></label><br><button class="btn btn--primary">Criar</button></form>', m => {
    m.querySelector('form').onsubmit = e => {
      e.preventDefault(); const s = A.currentServer(), cat = s.categories.find(c => c.name === category) || s.categories[0];
      const h = { id: 'c' + Date.now(), name: e.target.n.value.trim().toLowerCase().replace(/\s+/g, '-'), type: e.target.t.value, topic: '' };
      cat.channels.push(h); A.saveServers(); A.closeModal(); A.renderSidebar(); if (h.type === 'text') A.selectChannel(h.id);
    };
  });

  A.binders.push(() => {
    const app = $('#app'), menu = $('#serverMenu'), menuBtn = $('#serverMenuBtn');
    $('#serverList').addEventListener('click', e => {
      const s = e.target.closest('[data-server]'), a = e.target.closest('[data-act]');
      if (s) A.selectServer(+s.dataset.server);
      else if (a && a.dataset.act === 'add-server') createServer();
      else if (a) A.toast('Explorar servidores: em breve');
    });
    $('#channelList').addEventListener('click', e => {
      const c = e.target.closest('[data-channel]'), a = e.target.closest('[data-act=add-channel]');
      if (c) A.selectChannel(c.dataset.channel); else if (a) createChannel(a.dataset.category);
    });
    const setMenu = open => { menu.hidden = !open; menuBtn.setAttribute('aria-expanded', open); };
    menuBtn.onclick = e => { e.stopPropagation(); setMenu(menu.hidden); };
    menu.onclick = e => {
      const b = e.target.closest('[data-menu]'); if (!b) return; setMenu(false);
      ({ channel: () => createChannel(), profile: A.openProfile, settings: A.openSettings })[b.dataset.menu]();
    };
    document.addEventListener('click', e => { if (!menu.hidden && !menu.contains(e.target)) setMenu(false); if (!e.target.closest('.composer')) $('#emojiPop').hidden = true; });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { setMenu(false); closeDrawers(); } });
    $('#scrim').onclick = closeDrawers;
    matchMedia('(min-width:901px)').addEventListener('change', closeDrawers);
  });
})(window.App);
