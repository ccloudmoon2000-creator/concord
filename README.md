# Nexo — cliente de chat (HTML/CSS/JS vanilla)

Abre `index.html` diretamente no navegador. Sem backend nem build.

- **Dados**: `js/app.js` (servidores, canais, utilizadores, mensagens iniciais).
- **Módulos**: `navigation.js` (servidores/canais/criação), `chat.js` (cabeçalho, mensagens, compositor, pesquisa), `members.js` (membros e painel do utilizador), `settings.js` (tema, modais, perfil).
- **Persistência** (`localStorage`, prefixo `nx.`): mensagens, servidores/canais criados, tema, nome, último canal.
- **Responsivo**: ≤900px os membros passam a gaveta; ≤700px servidores+canais passam a gaveta (botão ☰).
- Atalhos: `Enter` envia, `Esc` fecha modais/menus/edição.
