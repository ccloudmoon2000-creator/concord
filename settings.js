/* Tema, modais genéricos, toast, definições e perfil */
(function (A) {
  const $ = A.$, esc = A.esc;

  A.applyTheme = () => { document.documentElement.dataset.theme = A.store.get('nx.theme', 'dark'); };
  A.toggleTheme = () => { A.store.set('nx.theme', A.store.get('nx.theme', 'dark') === 'dark' ? 'light' : 'dark'); A.applyTheme(); };

  let toastTimer;
  A.toast = msg => { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 2200); };

  /* Modal genérico: A.modal(titulo, html, aoMontar) */
  A.closeModal = () => { $('#modalRoot').innerHTML = ''; };
  A.modal = (title, body, onMount) => {
    $('#modalRoot').innerHTML = `<div class="modal-backdrop" data-close><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header><h2>${esc(title)}</h2><button class="icon-btn" data-close aria-label="Fechar">✕</button></header><div class="modal__body">${body}</div></div></div>`;
    const m = $('#modalRoot .modal');
    if (onMount) onMount(m);
    const first = m.querySelector('input,select,button:not([data-close])'); if (first) first.focus();
  };

  A.openSettings = () => {
    const dark = A.store.get('nx.theme', 'dark') === 'dark';
    A.modal('Definições', `<div class="modal__row"><span>Tema: <b>${dark ? 'Escuro' : 'Claro'}</b></span><button class="btn btn--primary" id="themeBtn">Alternar tema</button></div>
      <div class="modal__row"><span>Repor mensagens e servidores</span><button class="btn btn--danger" id="resetBtn">Repor</button></div>`, m => {
      m.querySelector('#themeBtn').onclick = () => { A.toggleTheme(); A.openSettings(); };
      m.querySelector('#resetBtn').onclick = () => { ['nx.msgs', 'nx.servers', 'nx.server', 'nx.channel'].forEach(k => localStorage.removeItem(k)); location.reload(); };
    });
  };

  A.openProfile = () => {
    const me = A.data.me;
    A.modal('Perfil', `<form id="pf"><label>Nome de utilizador<input name="n" value="${esc(me.name)}" maxlength="20" required></label><br><button class="btn btn--primary">Guardar</button></form>`, m => {
      m.querySelector('form').onsubmit = e => {
        e.preventDefault();
        me.name = e.target.n.value.trim() || me.name; A.store.set('nx.name', me.name);
        A.closeModal(); A.renderUserPanel(); A.renderChat();
      };
    });
  };

  A.binders.push(() => {
    $('#modalRoot').addEventListener('click', e => { if (e.target.hasAttribute('data-close') || e.target.closest('button[data-close]')) A.closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { A.closeModal(); $('#emojiPop').hidden = true; } });
  });
})(window.App);
