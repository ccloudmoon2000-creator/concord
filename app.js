/* Núcleo: utilitários, dados simulados, estado e arranque. Carregado primeiro; os restantes módulos acrescentam-se a window.App. */
window.App = {};
(function (A) {
  A.$ = (s, r = document) => r.querySelector(s);
  A.esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  A.store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem storage */ } }
  };
  A.avatar = (u, cls = '') => `<span class="avatar ${cls}" style="--c:${u.color}" aria-hidden="true">${A.esc(u.name[0].toUpperCase())}</span>`;

  /* ---- Dados simulados ---- */
  const U = (id, name, role, status, color, activity = '') => ({ id, name, role, status, color, activity });
  const ch = (id, name, type, topic = '') => ({ id, name, type, topic });
  A.data = {
    me: { id: 0, name: A.store.get('nx.name', 'Tu'), role: 'Membro', status: 'online', color: '#6c7bff' },
    users: [
      U(1, 'Alex', 'Admin', 'online', '#ef6b5b', 'A jogar Pixel Quest'), U(2, 'Maria', 'Mod', 'online', '#e6a23c', 'A ouvir música'),
      U(3, 'João', 'Membro', 'online', '#3fb97c'), U(4, 'Sofia', 'Membro', 'online', '#b46cff', 'A programar'),
      U(5, 'Miguel', 'Membro', 'online', '#2fb5c9'), U(6, 'Daniel', 'Membro', 'offline', '#8a8d99'),
      U(7, 'Rita', 'Mod', 'offline', '#d96ca8'), U(8, 'Pedro', 'Membro', 'offline', '#7f9c4a')
    ],
    servers: A.store.get('nx.servers', null) || [
      { id: 1, name: 'Pixel Hub', icon: 'P', categories: [
        { name: 'INFORMAÇÕES', channels: [ch('c1', 'geral', 'text', 'Conversa geral da comunidade'), ch('c2', 'regras', 'text', 'Lê antes de participar'), ch('c3', 'anúncios', 'text', 'Novidades oficiais')] },
        { name: 'CHAT', channels: [ch('c4', 'conversa', 'text', 'Fala sobre tudo'), ch('c5', 'memes', 'text', 'Só os melhores'), ch('c6', 'jogos', 'text', 'O que andas a jogar?')] },
        { name: 'VOZ', channels: [ch('v1', 'Geral', 'voice'), ch('v2', 'Gaming', 'voice')] }] },
      { id: 2, name: 'Gaming Zone', icon: 'G', categories: [
        { name: 'LOBBY', channels: [ch('c7', 'boas-vindas', 'text', 'Apresenta-te'), ch('c8', 'torneios', 'text', 'Inscrições e resultados')] },
        { name: 'CHAT', channels: [ch('c9', 'estratégias', 'text', 'Táticas e dicas'), ch('c10', 'clips', 'text', 'Partilha os teus melhores momentos')] },
        { name: 'VOZ', channels: [ch('v3', 'Sala 1', 'voice')] }] }
    ]
  };
  A.saveServers = () => A.store.set('nx.servers', A.data.servers);

  A.seed = () => {
    const out = {}, now = Date.now();
    const L = [['Bem-vindos ao canal!', 1], ['Alguém quer jogar logo à noite?', 2], ['Eu alinho 🎮', 3], ['Combinado, vemo-nos às 21h.', 4]];
    A.data.servers.forEach(s => s.categories.forEach(c => c.channels.forEach(h => {
      if (h.type === 'text') out[h.id] = L.map(([text, uid], i) => ({ id: h.id + '-s' + i, uid, text, ts: now - (4 - i) * 6e5, reactions: i === 1 ? { '👍': [3] } : {} }));
    })));
    return out;
  };

  /* ---- Estado e helpers ---- */
  A.state = { serverId: A.store.get('nx.server', 1), channelId: A.store.get('nx.channel', 'c1'), replyTo: null, editing: null, voice: null, notif: true };
  A.findChannel = id => { for (const s of A.data.servers) for (const c of s.categories) for (const h of c.channels) if (h.id === id) return { server: s, channel: h }; return null; };
  A.currentServer = () => A.data.servers.find(s => s.id === A.state.serverId);
  A.currentChannel = () => (A.findChannel(A.state.channelId) || {}).channel;
  A.userById = id => (id === 0 ? A.data.me : A.data.users.find(u => u.id === id) || { name: '?', color: '#888' });
  A.binders = [];

  A.init = () => {
    A.applyTheme();
    const f = A.findChannel(A.state.channelId);
    if (!f || f.server.id !== A.state.serverId) { // estado guardado inválido → repõe
      A.state.serverId = A.data.servers[0].id;
      A.state.channelId = A.data.servers[0].categories[0].channels[0].id;
    }
    if (A.store.get('nx.membersHidden', false)) A.$('#app').classList.add('members-hidden');
    A.binders.forEach(b => b());
    A.renderServers(); A.renderSidebar(); A.renderMembers(); A.renderUserPanel(); A.renderChat();
  };
  document.addEventListener('DOMContentLoaded', A.init);
})(window.App);
