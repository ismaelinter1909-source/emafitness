// login.js — atualizado: feedback visual, animação de recover box, validações simples

document.addEventListener("DOMContentLoaded", () => {
  const formLogin = document.getElementById("formLogin");
  const inputNome = document.getElementById("nome");
  const inputSenha = document.getElementById("senha");

  const linkEsqueci = document.getElementById("linkEsqueci");
  const recuperacaoBox = document.getElementById("recuperacaoBox");
  const recEmail = document.getElementById("recEmail");
  const btnVerificarEmail = document.getElementById("btnVerificarEmail");
  const recPassBox = document.getElementById("recPassBox");
  const novaSenha = document.getElementById("novaSenha");
  const confNovaSenha = document.getElementById("confNovaSenha");
  const btnAtualizarSenha = document.getElementById("btnAtualizarSenha");
  const btnCancelarRec = document.getElementById("btnCancelarRec");
  const recMsg = document.getElementById("recMsg");

  // helper: read/write usuarioCadastrado from localStorage
  const readUser = () => JSON.parse(localStorage.getItem("usuarioCadastrado") || "null");
  const writeUser = (u) => localStorage.setItem("usuarioCadastrado", JSON.stringify(u));

  // Toggle recover box with animation
  function openRecover() {
    recuperacaoBox.classList.add("open");
    recuperacaoBox.classList.add("open"); // class used in CSS
    recuperacaoBox.classList.add("open");
    recuperacaoBox.classList.add("open");
    recuperacaoBox.classList.add("open");
    recuperacaoBox.classList.add("open");
    recuperacaoBox.classList.add("open");
  }

  function closeRecover() {
    recuperacaoBox.classList.remove("open");
    recPassBox.classList.remove("show");
    recMsg.textContent = "";
    recMsg.className = "rec-msg";
    recEmail.value = "";
    novaSenha.value = confNovaSenha.value = "";
    // ensure aria
    linkEsqueci.setAttribute("aria-expanded", "false");
    recuperacaoBox.setAttribute("aria-hidden", "true");
  }

  // Better toggle implementation
  linkEsqueci.addEventListener("click", () => {
    const isOpen = recuperacaoBox.classList.contains("open");
    if (isOpen) {
      closeRecover();
    } else {
      // open
      recuperacaoBox.classList.add("open");
      recuperacaoBox.setAttribute("aria-hidden", "false");
      linkEsqueci.setAttribute("aria-expanded", "true");
      // show only verify email initially
      recPassBox.classList.remove("show");
      recMsg.textContent = "";
      recMsg.className = "rec-msg";
      recEmail.focus();
    }
  });

  btnCancelarRec.addEventListener("click", (e) => {
    e.preventDefault();
    closeRecover();
  });

  // Validate login against localStorage (same logic as antes)
  formLogin.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const nome = inputNome.value.trim();
    const senha = inputSenha.value;

    const usuarioSalvo = readUser();

    if (!usuarioSalvo) {
      if (confirm("Nenhum usuário cadastrado. Deseja criar uma conta agora?")) {
        window.location.href = "cadastro.html";
      }
      return;
    }

    // You may prefer login by email — here still using nome
    if (nome === usuarioSalvo.nome && senha === usuarioSalvo.senha) {
      // success UI
      alert("Login realizado com sucesso!");
      localStorage.setItem("usuarioLogado", JSON.stringify({ nome: usuarioSalvo.nome }));
      window.location.href = "home.html";
    } else {
      // show inline error style/message
      inputSenha.focus();
      // simple shake animation with CSS via class toggle (we'll simulate with setTimeout)
      inputSenha.classList.add("input-error");
      setTimeout(()=> inputSenha.classList.remove("input-error"), 500);
      alert("Nome ou senha incorretos!");
    }
  });

  // Verificar email (recuperação) — mostra caixa de nova senha se encontrado
  btnVerificarEmail.addEventListener("click", (e) => {
    e.preventDefault();
    const email = recEmail.value.trim();
    recMsg.textContent = "";
    recMsg.className = "rec-msg";

    if (!email) {
      recMsg.textContent = "Informe o email cadastrado.";
      recMsg.classList.remove("success");
      return;
    }

    const usuarioSalvo = readUser();
    if (!usuarioSalvo) {
      recMsg.textContent = "Nenhum cadastro encontrado. Cadastre-se primeiro.";
      return;
    }

    if (usuarioSalvo.email && usuarioSalvo.email.toLowerCase() === email.toLowerCase()) {
      recMsg.textContent = "Email verificado — insira a nova senha.";
      recMsg.classList.add("success");
      // show password inputs
      recPassBox.classList.add("show");
      novaSenha.focus();
    } else {
      recMsg.textContent = "Email não encontrado. Verifique o email ou cadastre uma conta.";
      recMsg.classList.remove("success");
    }
  });

  // Atualizar senha (localStorage)
  btnAtualizarSenha.addEventListener("click", (ev) => {
    ev.preventDefault();
    const s1 = novaSenha.value;
    const s2 = confNovaSenha.value;
    recMsg.textContent = "";
    recMsg.className = "rec-msg";

    if (!s1 || !s2) {
      recMsg.textContent = "Preencha a nova senha e confirmação.";
      return;
    }
    if (s1 !== s2) {
      recMsg.textContent = "As senhas não coincidem.";
      return;
    }

    const usuarioSalvo = readUser();
    if (!usuarioSalvo) {
      recMsg.textContent = "Erro: nenhum cadastro encontrado.";
      return;
    }

    // update
    usuarioSalvo.senha = s1;
    writeUser(usuarioSalvo);

    recMsg.textContent = "Senha atualizada com sucesso! Agora faça login.";
    recMsg.classList.add("success");

    // auto-close after short delay
    setTimeout(() => {
      closeRecover();
    }, 1200);
  });

  // Accessibility: close recover on ESC
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") {
      if (recuperacaoBox.classList.contains("open")) closeRecover();
    }
  });

  // small visual helpers: add simple input-error style via CSS injection if not present
  (function ensureErrorStyle(){
    const styleId = "login-error-style";
    if (!document.getElementById(styleId)) {
      const s = document.createElement("style"); s.id = styleId;
      s.textContent = `
        .input-error { animation: shake .38s ease; border-color: var(--danger) !important; }
        @keyframes shake { 10%{ transform: translateX(-6px);} 30%{transform:translateX(6px);} 50%{transform:translateX(-4px);} 70%{transform:translateX(4px);} 90%{transform:translateX(-2px);} 100%{transform:translateX(0);} }
      `;
      document.head.appendChild(s);
    }
  })();

});
