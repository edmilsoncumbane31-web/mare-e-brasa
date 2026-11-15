/* Maré e Brasa — comportamento da página.
   Tudo o que muda de restaurante para restaurante está em NEGOCIO, aqui em baixo. */

(function () {
  'use strict';

  var NEGOCIO = {
    nome: 'Maré e Brasa',
    whatsapp: '258841234567',          // com 258, sem + nem espaços
    telefoneVisivel: '84 123 4567',    // como aparece no site
    endereco: 'Avenida da Marginal, Maputo',
    instagram: '',                     // endereço completo, ex.: https://instagram.com/mareebrasa
    facebook: '',                      // endereço completo, ou deixa vazio
    fuso: 'Africa/Maputo',
    // Horário: 0 = domingo, 1 = segunda ... 6 = sábado. [abre, fecha] em horas (22.5 = 22h30). null = fechado.
    horario: { 0: [11, 22], 1: null, 2: [11, 22], 3: [11, 22], 4: [11, 22], 5: [11, 23], 6: [11, 23] }
  };

  var NOMES_DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  var ORDEM_TABELA = [1, 2, 3, 4, 5, 6, 0];

  function $(s, raiz) { return (raiz || document).querySelector(s); }
  function $$(s, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(s)); }

  /* ---------- Hora em Maputo ---------- */
  function agora() {
    var partes = new Intl.DateTimeFormat('en-GB', {
      timeZone: NEGOCIO.fuso, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date());
    var p = {};
    partes.forEach(function (x) { p[x.type] = x.value; });
    var mapa = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return {
      dia: mapa[p.weekday],
      hora: (parseInt(p.hour, 10) % 24) + parseInt(p.minute, 10) / 60,
      data: p.year + '-' + p.month + '-' + p.day
    };
  }

  function fmtH(h) {
    var hh = Math.floor(h), mm = Math.round((h - hh) * 60);
    return hh + 'h' + (mm ? (mm < 10 ? '0' + mm : mm) : '');
  }

  function estado() {
    var n = agora(), h = NEGOCIO.horario[n.dia];
    if (h && n.hora >= h[0] && n.hora < h[1]) return { aberto: true, texto: 'Aberto agora · fecha às ' + fmtH(h[1]) };
    if (h && n.hora < h[0]) return { aberto: false, texto: 'Fechado · abre hoje às ' + fmtH(h[0]) };
    for (var i = 1; i <= 7; i++) {
      var d = (n.dia + i) % 7, x = NEGOCIO.horario[d];
      if (x) return { aberto: false, texto: 'Fechado · abre ' + (i === 1 ? 'amanhã' : NOMES_DIAS[d].toLowerCase()) + ' às ' + fmtH(x[0]) };
    }
    return { aberto: false, texto: 'Fechado' };
  }

  function mostrarEstado() {
    var e = estado();
    $$('[data-estado]').forEach(function (el) {
      el.textContent = e.texto;
      el.setAttribute('data-aberto', e.aberto ? 'true' : 'false');
    });
  }

  /* ---------- Dados do negócio nos sítios certos ---------- */
  function waUrl(msg) {
    return 'https://wa.me/' + NEGOCIO.whatsapp + (msg ? '?text=' + encodeURIComponent(msg) : '');
  }

  function preencherDados() {
    $$('[data-nome]').forEach(function (el) { el.textContent = NEGOCIO.nome; });
    $$('[data-tel]').forEach(function (el) { el.textContent = NEGOCIO.telefoneVisivel; });
    $$('[data-endereco]').forEach(function (el) { el.textContent = NEGOCIO.endereco; });
    $$('[data-tel-link]').forEach(function (el) { el.href = 'tel:+' + NEGOCIO.whatsapp; });
    $$('[data-mapa]').forEach(function (el) {
      el.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(NEGOCIO.nome + ' ' + NEGOCIO.endereco);
    });
    $$('[data-rede]').forEach(function (el) {
      var url = NEGOCIO[el.getAttribute('data-rede')];
      if (url) { el.href = url; el.target = '_blank'; el.rel = 'noopener'; el.hidden = false; }
    });
    // Ligações do WhatsApp: pedido de um prato, ou mensagem geral
    $$('[data-wa]').forEach(function (el) {
      var msg = el.getAttribute('data-msg');
      var item = el.closest('li[data-nome]');
      if (item) msg = 'Olá! Quero pedir: ' + item.getAttribute('data-nome') + ' (' + item.getAttribute('data-preco') + ' MT).';
      el.href = waUrl(msg);
      el.target = '_blank';
      el.rel = 'noopener';
    });
    var ano = $('#ano');
    if (ano) ano.textContent = new Date().getFullYear();
  }

  function montarTabelaHorario() {
    var corpo = $('#tabela-horario tbody');
    if (!corpo) return;
    var hoje = agora().dia;
    ORDEM_TABELA.forEach(function (d) {
      var tr = document.createElement('tr');
      if (d === hoje) tr.className = 'hoje';
      var th = document.createElement('th');
      th.scope = 'row';
      th.textContent = NOMES_DIAS[d];
      var td = document.createElement('td');
      var h = NEGOCIO.horario[d];
      if (h) { td.textContent = fmtH(h[0]) + ' às ' + fmtH(h[1]); } else { td.textContent = 'Fechado'; td.className = 'fechado'; }
      tr.appendChild(th); tr.appendChild(td); corpo.appendChild(tr);
    });
  }

  /* ---------- Menu móvel e cabeçalho ---------- */
  function iniciarNav() {
    var topo = $('#topo'), btn = $('#menu-btn');
    if (!topo || !btn) return;
    function fechar() { topo.classList.remove('nav-aberto'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Abrir menu'); }
    btn.addEventListener('click', function () {
      var aberto = topo.classList.toggle('nav-aberto');
      btn.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      btn.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    });
    $$('#nav a').forEach(function (a) { a.addEventListener('click', fechar); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fechar(); });
  }

  /* ---------- Filtro do menu ---------- */
  function iniciarFiltros() {
    var botoes = $$('.filtro'), itens = $$('.lista li');
    botoes.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-filtro');
        botoes.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        itens.forEach(function (li) { li.hidden = !(f === 'todos' || li.getAttribute('data-cat') === f); });
      });
    });
  }

  /* ---------- Fotos ampliadas ---------- */
  function iniciarGaleria() {
    var lb = $('#lb');
    if (!lb || typeof lb.showModal !== 'function') return;
    var img = $('img', lb);
    $$('.g').forEach(function (b) {
      b.addEventListener('click', function () {
        var src = b.getAttribute('data-src'), teste = new Image();
        teste.onload = function () { img.src = src; img.alt = b.getAttribute('aria-label') || ''; lb.showModal(); };
        teste.src = src; // se a foto ainda não existe, não abre nada
      });
    });
    lb.addEventListener('click', function () { lb.close(); });
    $('.lb-fechar', lb).addEventListener('click', function () { lb.close(); });
  }

  /* ---------- Reservas pelo WhatsApp ---------- */
  function horasDoDia(dataStr) {
    var d = new Date(dataStr + 'T12:00:00');
    var h = NEGOCIO.horario[d.getDay()];
    if (!h) return null;
    var lista = [];
    for (var t = h[0]; t <= h[1] - 1; t += 0.5) lista.push(t);
    return lista;
  }

  function fmtData(s) {
    var p = s.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  function iniciarReservas() {
    var form = $('#form-reserva');
    if (!form) return;
    var f = form.elements, msg = $('#form-msg');
    var campoData = f.data, campoHora = f.hora;
    campoData.min = agora().data;

    function aviso(texto, tipo) { msg.textContent = texto; msg.className = 'form-msg' + (tipo ? ' ' + tipo : ''); }

    function preencherHoras() {
      campoHora.innerHTML = '';
      if (!campoData.value) {
        campoHora.disabled = true;
        campoHora.appendChild(new Option('Escolha primeiro a data', ''));
        return;
      }
      var horas = horasDoDia(campoData.value);
      var n = agora();
      if (horas && campoData.value === n.data) horas = horas.filter(function (t) { return t >= n.hora + 0.5; });
      if (!horas || !horas.length) {
        campoHora.disabled = true;
        campoHora.appendChild(new Option('Sem horários nesse dia', ''));
        aviso(horas ? 'Já não há horários para hoje. Escolha outra data.' : 'Estamos fechados nesse dia. Escolha outra data.', 'erro');
        return;
      }
      aviso('');
      campoHora.disabled = false;
      campoHora.appendChild(new Option('Escolha a hora', ''));
      horas.forEach(function (t) { campoHora.appendChild(new Option(fmtH(t), fmtH(t))); });
    }
    campoData.addEventListener('change', preencherHoras);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nome = f.nome.value.trim();
      if (!nome || !campoData.value || !campoHora.value) {
        aviso('Preencha o nome, a data e a hora.', 'erro');
        return;
      }
      var linhas = [
        'Olá! Quero reservar uma mesa.',
        'Nome: ' + nome,
        'Data: ' + fmtData(campoData.value),
        'Hora: ' + campoHora.value,
        'Pessoas: ' + f.pessoas.value
      ];
      if (f.obs.value.trim()) linhas.push('Observações: ' + f.obs.value.trim());
      var janela = window.open(waUrl(linhas.join('\n')), '_blank', 'noopener');
      if (!janela) window.location.href = waUrl(linhas.join('\n'));
      aviso('A abrir o WhatsApp com os dados da reserva. Envie a mensagem para concluir o pedido.', 'ok');
    });
  }

  /* ---------- Entrada suave ao rolar ---------- */
  function iniciarReveal() {
    var itens = $$('.reveal');
    if (!('IntersectionObserver' in window)) { itens.forEach(function (el) { el.classList.add('visivel'); }); return; }
    var obs = new IntersectionObserver(function (lista) {
      lista.forEach(function (x) {
        if (x.isIntersecting) { x.target.classList.add('visivel'); obs.unobserve(x.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    itens.forEach(function (el) { obs.observe(el); });
  }

  /* ---------- Arranque ---------- */
  preencherDados();
  montarTabelaHorario();
  mostrarEstado();
  setInterval(mostrarEstado, 60000);
  iniciarNav();
  iniciarFiltros();
  iniciarGaleria();
  iniciarReservas();
  iniciarReveal();
})();
