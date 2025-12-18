/* proxima.js (ATUALIZAÇÕES)
 - botão Perfil abre/fecha sidebar (mobile + desktop behavior kept)
 - formAgua & formRefeicao usam timestamp do dispositivo automaticamente
 - histórico de água/refeição suportam Editar (preencher formulário) e Remover
 - cores/style são gerenciados no HTML/CSS
*/

(() => {
  // Keys
  const KEY_DADOS = "dadosEntrada";
  const KEY_USUARIO = "usuarioCadastrado";
  const KEY_PESOS = "pesoHistory";
  const KEY_ATIV = "atividadesHistory";
  const KEY_AGUA = "aguaHistory";
  const KEY_REFE = "refeicoesHistory";
  const KEY_LOG = "usuarioLogado";

  // Elements
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const btnPerfil = document.getElementById("btnPerfil");
  const mainTitle = document.getElementById("mainTitle");
  const usuarioLogadoName = document.getElementById("usuarioLogadoName");

  const resultadoEl = document.getElementById("resultado");
  const listaPesosEl = document.getElementById("listaPesos");
  const listaAtivEl = document.getElementById("listaAtividades");
  const listaAguaEl = document.getElementById("listaAgua");
  const listaRefeEl = document.getElementById("listaRefeicoes");
  const resumoDiaEl = document.getElementById("resumoDia");

  // Profile fields
  const emailPerfil = document.getElementById("emailPerfil");
  const telefonePerfil = document.getElementById("telefonePerfil");
  const senhaAntiga = document.getElementById("senhaAntiga");
  const novaSenha = document.getElementById("novaSenha");
  const btnAtualizarPerfil = document.getElementById("btnAtualizarPerfil");

  // Measurements
  const alturaPerfil = document.getElementById("alturaPerfil");
  const pesoAtualPerfil = document.getElementById("pesoAtualPerfil");
  const btnSalvarMedidas = document.getElementById("btnSalvarMedidas");

  // Logout
  const btnLogout = document.getElementById("btnLogout");

  // Forms
  const formPeso = document.getElementById("formPeso");
  const pesoData = document.getElementById("pesoData");
  const pesoValor = document.getElementById("pesoValor");

  const formAtiv = document.getElementById("formAtividade");
  const ativData = document.getElementById("ativData");
  const ativNome = document.getElementById("ativNome");
  const ativDur = document.getElementById("ativDur");

  // Agua
  const formAgua = document.getElementById("formAgua");
  const aguaMl = document.getElementById("aguaMl");
  const btnCancelAgua = document.getElementById("btnCancelAgua");
  let editingAguaId = null;

  // Refeicao
  const formRef = document.getElementById("formRefeicao");
  const refNome = document.getElementById("refNome");
  const refCal = document.getElementById("refCal");
  const btnCancelRefe = document.getElementById("btnCancelRefe");
  let editingRefeId = null;

  // Chart
  let pesoChart = null;

  // Utils
  const read = (k) => JSON.parse(localStorage.getItem(k) || "null");
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  function initStorage() {
    if (!read(KEY_PESOS)) write(KEY_PESOS, []);
    if (!read(KEY_ATIV)) write(KEY_ATIV, []);
    if (!read(KEY_AGUA)) write(KEY_AGUA, []);
    if (!read(KEY_REFE)) write(KEY_REFE, []);
  }

  // Mobile detection
  function isMobile() {
    return window.matchMedia("(max-width: 767px)").matches;
  }

  function openSidebar() {
    sidebar.classList.remove("mobile-hidden");
    sidebar.classList.add("mobile-open");
    sidebar.setAttribute("aria-hidden", "false");
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closeSidebar() {
    sidebar.classList.remove("mobile-open");
    sidebar.classList.add("mobile-hidden");
    sidebar.setAttribute("aria-hidden", "true");
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
  }

  function toggleSidebar() {
    if (sidebar.classList.contains("mobile-open")) closeSidebar();
    else openSidebar();
  }

  // Perfil button open/close
  btnPerfil.addEventListener("click", () => {
    if (isMobile()) toggleSidebar();
    else {
      // On desktop, allow close/open too for convenience
      if (sidebar.classList.contains("mobile-hidden")) {
        sidebar.classList.remove("mobile-hidden");
      } else {
        sidebar.classList.add("mobile-hidden");
      }
    }
  });

  overlay.addEventListener("click", closeSidebar);

  // Show user
  function showUsuarioLogado() {
    const log = read(KEY_LOG);
    const usuario = read(KEY_USUARIO) || {};
    const nome = (log && log.nome) ? log.nome : (usuario.nome || "");
    if (nome) {
      usuarioLogadoName.textContent = nome;
      mainTitle.textContent = `Bem-vindo, ${nome}!`;
    } else {
      usuarioLogadoName.textContent = "—";
      mainTitle.textContent = "Bem-vindo!";
    }
  }

  function carregarPerfil() {
    const usuario = read(KEY_USUARIO) || {};
    const dados = read(KEY_DADOS) || {};
    emailPerfil.value = usuario.email || "";
    telefonePerfil.value = usuario.telefone || "";
    alturaPerfil.value = dados.altura || "";
    const pesos = read(KEY_PESOS) || [];
    const lastPeso = (pesos && pesos.length>0) ? pesos[pesos.length-1].valor : (dados.peso || "");
    pesoAtualPerfil.value = lastPeso ? Number(lastPeso).toFixed(1) : "";
  }

  // IMC logic + renderers (same logic)
  function calcularImc(peso, alturaCm) {
    const h = Number(alturaCm) / 100;
    if (!peso || !alturaCm || h <= 0) return null;
    const imc = Number(peso) / (h * h);
    const pesoIdeal = 22 * (h * h);
    let classificacao = "";
    if (imc < 18.5) classificacao = "Abaixo do peso";
    else if (imc < 25) classificacao = "Peso normal";
    else if (imc < 30) classificacao = "Sobrepeso";
    else classificacao = "Obesidade";
    return { imc, pesoIdeal, classificacao };
  }

  function renderResumo() {
    const dados = read(KEY_DADOS) || {};
    const pesos = read(KEY_PESOS) || [];
    const pesoAtual = (pesos.length>0) ? pesos[pesos.length-1].valor : (dados.peso || null);
    const pesoInicial = (pesos.length>0) ? pesos[0].valor : (dados.peso || null);
    const altura = dados.altura || null;
    const idade = dados.idade || null;

    if (!pesoAtual || !altura) {
      resultadoEl.innerHTML = "<p>Preencha sua altura e peso atual no menu lateral para ver o resumo completo.</p>";
      renderChart();
      return;
    }

    const calc = calcularImc(pesoAtual, altura);
    const pesoIdeal = calc ? calc.pesoIdeal : null;
    const diferenca = pesoAtual - pesoIdeal;
    let mensagemPeso = "";
    if (diferenca > 0) mensagemPeso = `Você precisa perder <strong>${diferenca.toFixed(1)} kg</strong> para atingir o peso ideal.`;
    else if (diferenca < 0) mensagemPeso = `Você precisa ganhar <strong>${Math.abs(diferenca).toFixed(1)} kg</strong> para atingir o peso ideal.`;
    else mensagemPeso = "Você está exatamente no peso ideal!";

    resultadoEl.innerHTML = `
      <p><strong>Idade:</strong> ${idade ? idade + " anos" : "—"}</p>
      <p><strong>Peso inicial:</strong> ${pesoInicial ? pesoInicial.toFixed(1) + " kg" : "—"}</p>
      <p><strong>Peso atual:</strong> ${pesoAtual ? pesoAtual.toFixed(1) + " kg" : "—"}</p>
      <p><strong>Altura:</strong> ${altura ? altura + " cm" : "—"}</p>
      <hr>
      <p><strong>Seu IMC é:</strong> ${calc ? calc.imc.toFixed(2) : "—"}</p>
      <p><strong>Classificação:</strong> ${calc ? calc.classificacao : "—"}</p>
      <p><strong>Peso Ideal (IMC 22):</strong> ${pesoIdeal ? pesoIdeal.toFixed(1) + " kg" : "—"}</p>
      <hr>
      <p>${mensagemPeso}</p>
    `;
    renderChart();
  }

  function renderChart() {
    const ctx = document.getElementById("pesoChart").getContext("2d");
    const pesos = read(KEY_PESOS) || [];
    if (!pesos || pesos.length === 0) {
      if (pesoChart) { pesoChart.destroy(); pesoChart = null; }
      return;
    }
    const sorted = [...pesos].sort((a,b)=> new Date(a.data) - new Date(b.data));
    const labels = sorted.map(p => p.data);
    const values = sorted.map(p => p.valor);
    if (pesoChart) pesoChart.destroy();
    pesoChart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets:[{ label:'Peso (kg)', data: values, tension:0.25, fill:false, borderWidth:2 }] },
      options: { scales: { y: { beginAtZero:false } } }
    });
  }

  // Pesos render + remove
  function renderPesos() {
    const pesos = read(KEY_PESOS) || [];
    if (!pesos.length) { listaPesosEl.innerHTML = "<div class='small'>Nenhum registro de peso.</div>"; return; }
    const items = [...pesos].sort((a,b)=> new Date(b.data)-new Date(a.data)).map((p) => {
      return `<div class="list-item">
                <div><strong>${p.valor.toFixed(1)} kg</strong><div class="small">${p.data}</div></div>
                <div class="small-actions">
                  <button class="btn ghost" onclick="removerPeso('${p.data}')">Remover</button>
                </div>
              </div>`;
    }).join("");
    listaPesosEl.innerHTML = items;
  }
  window.removerPeso = function(dateStr) {
    let pesos = read(KEY_PESOS) || [];
    pesos = pesos.filter(p => p.data !== dateStr);
    write(KEY_PESOS, pesos);
    renderPesos(); renderResumo(); carregarPerfil();
  };

  // Atividades
  function renderAtividades() {
    const arr = read(KEY_ATIV) || [];
    if (!arr.length) { listaAtivEl.innerHTML = "<div class='small'>Nenhuma atividade registrada.</div>"; return; }
    const items = [...arr].sort((a,b)=> new Date(b.data)-new Date(a.data)).map(a => {
      return `<div class="list-item">
                <div><strong>${a.nome}</strong><div class="small">${a.data} • ${a.duracao} min</div></div>
                <div class="small-actions">
                  <button class="btn ghost" onclick="removerAtiv('${a.id}')">Remover</button>
                </div>
              </div>`;
    }).join("");
    listaAtivEl.innerHTML = items;
  }
  window.removerAtiv = function(id) {
    let arr = read(KEY_ATIV) || [];
    arr = arr.filter(a => a.id !== id);
    write(KEY_ATIV, arr);
    renderAtividades();
  };

  // Água: render, add, edit, remove
  function renderAgua() {
    const arr = read(KEY_AGUA) || [];
    if (!arr.length) { listaAguaEl.innerHTML = "<div class='small'>Nenhum registro de água.</div>"; return; }
    const items = [...arr].sort((a,b)=> new Date(b.timestamp) - new Date(a.timestamp)).map(a => {
      return `<div class="list-item">
                <div class="small">${a.date} ${a.time} • ${a.ml} ml</div>
                <div class="small-actions">
                  <button class="btn ghost" onclick="editarAgua('${a.id}')">Editar</button>
                  <button class="btn ghost" onclick="removerAgua('${a.id}')">Remover</button>
                </div>
              </div>`;
    }).join("");
    listaAguaEl.innerHTML = items;
  }
  window.removerAgua = function(id) {
    let arr = read(KEY_AGUA) || [];
    arr = arr.filter(a => a.id !== id);
    write(KEY_AGUA, arr);
    renderAgua(); renderResumo(); carregarPerfil();
  };
  window.editarAgua = function(id) {
    const arr = read(KEY_AGUA) || [];
    const item = arr.find(x=> x.id === id);
    if (!item) return alert("Registro não encontrado.");
    // populate form for editing (we keep same timestamp but allow changing ml)
    aguaMl.value = item.ml;
    editingAguaId = id;
    btnCancelAgua.style.display = 'inline-block';
    btnCancelAgua.onclick = () => { editingAguaId = null; aguaMl.value=''; btnCancelAgua.style.display='none'; };
  };

  // Refeições: render, add, edit, remove
  function renderRefeicoes() {
    const arr = read(KEY_REFE) || [];
    if (!arr.length) { listaRefeEl.innerHTML = "<div class='small'>Nenhuma refeição registrada.</div>"; resumoDiaEl.innerHTML = ""; return; }
    const items = [...arr].sort((a,b)=> new Date(b.timestamp) - new Date(a.timestamp)).map(r => {
      return `<div class="list-item">
                <div><strong>${r.nome}</strong><div class="small">${r.date} ${r.time} • ${r.cal} kcal</div></div>
                <div class="small-actions">
                  <button class="btn ghost" onclick="editarRefeicao('${r.id}')">Editar</button>
                  <button class="btn ghost" onclick="removerRefeicao('${r.id}')">Remover</button>
                </div>
              </div>`;
    }).join("");
    listaRefeEl.innerHTML = items;
    const hoje = (new Date()).toISOString().slice(0,10);
    renderResumoDia(hoje);
  }
  window.removerRefeicao = function(id) {
    let arr = read(KEY_REFE) || [];
    arr = arr.filter(r => r.id !== id);
    write(KEY_REFE, arr);
    renderRefeicoes(); renderResumo();
  };
  window.editarRefeicao = function(id) {
    const arr = read(KEY_REFE) || [];
    const item = arr.find(x=> x.id === id);
    if (!item) return alert("Registro não encontrado.");
    refNome.value = item.nome;
    refCal.value = item.cal;
    editingRefeId = id;
    btnCancelRefe.style.display = 'inline-block';
    btnCancelRefe.onclick = () => { editingRefeId = null; refNome.value=''; refCal.value=''; btnCancelRefe.style.display='none'; };
  };

  function renderResumoDia(dateStr) {
    const ref = (read(KEY_REFE) || []).filter(r => r.date === dateStr);
    const agua = (read(KEY_AGUA) || []).filter(a => a.date === dateStr);
    const ativ = (read(KEY_ATIV) || []).filter(a => a.data === dateStr);

    const totalCal = ref.reduce((s,r)=> s + Number(r.cal), 0);
    const totalAgua = agua.reduce((s,a)=> s + Number(a.ml), 0);
    const totalAtivMin = ativ.reduce((s,a)=> s + Number(a.duracao), 0);

    resumoDiaEl.innerHTML = `
      <div><strong>Data:</strong> ${dateStr}</div>
      <div><strong>Calorias totais:</strong> ${totalCal} kcal</div>
      <div><strong>Água total:</strong> ${totalAgua} ml</div>
      <div><strong>Minutos de atividade:</strong> ${totalAtivMin} min</div>
    `;
  }

  // Handlers
  formPeso.addEventListener("submit", function(e){
    e.preventDefault();
    const data = pesoData.value;
    const valor = Number(pesoValor.value);
    if (!data || !valor) return alert("Preencha data e peso.");
    let pesos = read(KEY_PESOS) || [];
    pesos = pesos.filter(p => p.data !== data);
    pesos.push({ data, valor });
    pesos.sort((a,b)=> new Date(a.data) - new Date(b.data));
    write(KEY_PESOS, pesos);
    pesoData.value = ""; pesoValor.value = "";
    carregarPerfil(); renderPesos(); renderResumo();
  });

  formAtiv.addEventListener("submit", function(e){
    e.preventDefault();
    const data = ativData.value;
    const nome = ativNome.value.trim();
    const dur = Number(ativDur.value);
    if (!data || !nome || !dur) return alert("Preencha todos os campos de atividade.");
    const arr = read(KEY_ATIV) || [];
    arr.push({ id: "a_"+Date.now(), data, nome, duracao: dur });
    write(KEY_ATIV, arr);
    ativData.value = ativNome.value = ativDur.value = "";
    renderAtividades(); renderResumo();
  });

  // -- Agua: use device timestamp; if editingAguaId set, update instead of creating
  formAgua.addEventListener("submit", function(e){
    e.preventDefault();
    const ml = Number(aguaMl.value);
    if (!ml || ml <= 0) return alert("Preencha a quantidade de água.");
    const now = new Date();
    const iso = now.toISOString();
    const date = iso.slice(0,10);
    const time = now.toTimeString().slice(0,5);

    let arr = read(KEY_AGUA) || [];
    if (editingAguaId) {
      // update existing
      arr = arr.map(x => x.id === editingAguaId ? { ...x, ml, timestamp: iso, date, time } : x);
      editingAguaId = null;
      btnCancelAgua.style.display = 'none';
    } else {
      const id = "w_"+Date.now();
      arr.push({ id, timestamp: iso, date, time, ml });
    }
    write(KEY_AGUA, arr);
    aguaMl.value = "";
    renderAgua(); renderResumoDia(date); renderResumo();
  });

  // -- Refeicao: use device timestamp; support editing
  formRef.addEventListener("submit", function(e){
    e.preventDefault();
    const nome = refNome.value.trim();
    const cal = Number(refCal.value);
    if (!nome || isNaN(cal)) return alert("Preencha todos os campos da refeição.");
    const now = new Date();
    const iso = now.toISOString();
    const date = iso.slice(0,10);
    const time = now.toTimeString().slice(0,5);

    let arr = read(KEY_REFE) || [];
    if (editingRefeId) {
      arr = arr.map(x => x.id === editingRefeId ? { ...x, nome, cal, timestamp: iso, date, time } : x);
      editingRefeId = null;
      btnCancelRefe.style.display = 'none';
    } else {
      const id = "r_"+Date.now();
      arr.push({ id, timestamp: iso, date, time, nome, cal });
    }
    write(KEY_REFE, arr);
    refNome.value = ""; refCal.value = "";
    renderRefeicoes(); renderResumoDia(date); renderResumo();
  });

  // Atualizar perfil
  btnAtualizarPerfil.addEventListener("click", function(){
    const usuario = read(KEY_USUARIO) || {};
    const senhaAtual = senhaAntiga.value;
    if (usuario && usuario.senha && senhaAtual) {
      if (usuario.senha !== senhaAtual) return alert("Senha atual incorreta.");
    }
    usuario.email = emailPerfil.value.trim() || usuario.email;
    usuario.telefone = telefonePerfil.value.trim() || usuario.telefone;
    if (novaSenha.value) usuario.senha = novaSenha.value;
    write(KEY_USUARIO, usuario);
    senhaAntiga.value = novaSenha.value = "";
    alert("Perfil atualizado com sucesso.");
    showUsuarioLogado();
  });

  // Salvar medidas (altura + peso atual)
  btnSalvarMedidas.addEventListener("click", function(){
    const dados = read(KEY_DADOS) || {};
    const altura = Number(alturaPerfil.value);
    const pesoAtual = Number(pesoAtualPerfil.value);
    if (altura) dados.altura = altura;
    if (pesoAtual) dados.peso = pesoAtual;
    write(KEY_DADOS, dados);

    if (pesoAtual) {
      const hoje = (new Date()).toISOString().slice(0,10);
      let pesos = read(KEY_PESOS) || [];
      pesos = pesos.filter(p => p.data !== hoje);
      pesos.push({ data: hoje, valor: pesoAtual });
      pesos.sort((a,b)=> new Date(a.data) - new Date(b.data));
      write(KEY_PESOS, pesos);
    }
    alert("Altura e peso atual salvos.");
    renderPesos(); renderResumo();
    if (isMobile()) closeSidebar();
  });

  // Logout
  btnLogout.addEventListener("click", function(){
    localStorage.removeItem(KEY_LOG);
    alert("Você saiu.");
    window.location.href = "login.html";
  });

  // Initialize
  function inicializar(){
    initStorage();
    // default sidebar state:
    if (isMobile()){
      sidebar.classList.add("mobile-hidden");
      sidebar.setAttribute("aria-hidden","true");
    } else {
      sidebar.setAttribute("aria-hidden","false");
    }
    showUsuarioLogado(); carregarPerfil();
    renderPesos(); renderAtividades(); renderAgua(); renderRefeicoes(); renderResumo();
  }

  inicializar();

  // expose helper removers/editors globally for inline onclick usage
  window.editarAgua = window.editarAgua;
  window.removerAgua = window.removerAgua;
  window.editarRefeicao = window.editarRefeicao;
  window.removerRefeicao = window.removerRefeicao;
  window.removerPeso = window.removerPeso;
  window.removerAtiv = window.removerAtiv;
  window.removerAgua = window.removerAgua;
  window.removerRefeicao = window.removerRefeicao;

})();
