/* Lista de membros e painel do utilizador */
(function (A) {
  const $ = A.$, esc = A.esc;
  const member = u => `<div class="member${u.status === 'offline' ? ' is-offline' : ''}" data-user="${u.id}">
    <span class="avatar avatar--sm" style="--c:${u.color}" aria-hidden="true">${esc(u.name[0])}<i class="dot ${u.status}"></i></span>
    <span class="member__info"><b style="color:${u.color}">${esc(u.name)}</b>${u.activity && u.status === 'online' ? `<small>${esc(u.activity)}</small>` : ''}</span>
    ${u.role !== 'Membro' ? `<span class="role">${u.role}</span>` : ''}</div>`;

  A.renderMembers = () => {
    const all = [A.data.me, ...A.data.users], on = all.filter(u => u.status === 'online'), off = all.filter(u => u.status !== 'online');
    $('#memberList').innerHTML = `<h3>ONLINE — ${on.length}</h3>${on.map(member).join('')}<h3>OFFLINE — ${off.length}</h3>${off.map(member).join('')}`;
  };

  const flags = { mic: false, deaf: false };
  A.renderUserPanel = () => {
    const me = A.data.me;
    $('#userPanel').innerHTML = `<button class="userpanel__me" data-act="profile" aria-label="Abrir perfil">
      <span class="avatar avatar--sm" style="--c:${me.color}">${esc(me.name[0].toUpperCase())}<i class="dot online"></i></span>
      <span><span class="userpanel__name">${esc(me.name)}</span><small>Online</small></span></button>
      <button class="icon-btn${flags.mic ? ' is-off' : ''}" data-act="mic" aria-label="Microfone" aria-pressed="${flags.mic}">${flags.mic ? '🔇' : '🎤'}</button>
      <button class="icon-btn${flags.deaf ? ' is-off' : ''}" data-act="deaf" aria-label="Headphones" aria-pressed="${flags.deaf}">🎧</button>
      <button class="icon-btn" data-act="settings" aria-label="Definições">⚙</button>`;
  };

  A.binders.push(() => {
    $('#userPanel').addEventListener('click', e => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      if (a.dataset.act === 'profile') A.openProfile();
      else if (a.dataset.act === 'settings') A.openSettings();
      else { flags[a.dataset.act] = !flags[a.dataset.act]; A.renderUserPanel(); }
    });
    $('#memberList').addEventListener('click', e => { const m = e.target.closest('[data-user]'); if (m) A.toast(`${A.userById(+m.dataset.user).name} — ${A.userById(+m.dataset.user).role}`); });
  });
})(window.App);
