// script.js — compatível para ser usado tanto em cadastro.html quanto em login.html
document.addEventListener("DOMContentLoaded", () => {

  // helpers
  const readUser = () => {
    try { return JSON.parse(localStorage.getItem("usuarioCadastrado")); }
    catch { return null; }
  };
  const writeUser = (u) => localStorage.setItem("usuarioCadastrado", JSON.stringify(u));

  /* -------------------------
     Formulário de Cadastro
     ------------------------- */
  const formCadastro = document.getElementById("formCadastro");
  if (formCadastro) {
    formCadastro.addEventListener("submit", function (e) {
      e.preventDefault();

      const nome = (document.getElementById("nome").value || "").trim();
      const telefone = (document.getElementById("telefone").value || "").trim();
      const email = (document.getElementById("email").value || "").trim();
      const senha = document.getElementById("senha").value || "";
      const confirmarSenha = document.getElementById("confirmarSenha").value || "";

      // Validações simples
      if (!nome) { alert("Por favor informe o nome."); return; }
      if (!email) { alert("Por favor informe o email."); return; }
      // verificação rápida de formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) { alert("Digite um email válido."); return; }
      if (senha.length < 4) { // ajuste mínimo conforme necessidade
        alert("A senha deve ter pelo menos 4 caracteres.");
        return;
      }
      if (senha !== confirmarSenha) {
        alert("As senhas não coincidem!");
        return;
      }

      // opcional: checar se já existe usuário com mesmo email
      const existente = readUser();
      if (existente && existente.email && existente.email.toLowerCase() === email.toLowerCase()) {
        if (!confirm("Já existe um cadastro com este email. Deseja sobrescrever?")) return;
      }

      const usuario = { nome, telefone, email, senha };
      writeUser(usuario);

      // feedback e redirecionamento
      alert("Cadastro realizado com sucesso!");
      // garantir que a escrita teve tempo (normalmente instantâneo), em seguida redirecionar
      window.location.href = "login.html";
    });
  }

  /* -------------------------
     Formulário de Login
     ------------------------- */
  const formLogin = document.getElementById("formLogin");
  if (formLogin) {
    formLogin.addEventListener("submit", function (e) {
      e.preventDefault();

      const nomeLogin = (document.getElementById("nome").value || "").trim();
      const senhaLogin = document.getElementById("senha").value || "";

      const usuarioSalvo = readUser();
      if (!usuarioSalvo) {
        alert("Nenhum usuário cadastrado! Cadastre uma conta primeiro.");
        // opcional: redirecionar para cadastro
        if (confirm("Deseja ir para a página de cadastro?")) window.location.href = "cadastro.html";
        return;
      }

      // permitir login por nome OU email (mais flexível)
      const matchByName = nomeLogin.toLowerCase() === (usuarioSalvo.nome || "").toLowerCase();
      const matchByEmail = nomeLogin.toLowerCase() === (usuarioSalvo.email || "").toLowerCase();

      if ((matchByName || matchByEmail) && senhaLogin === usuarioSalvo.senha) {
        // marca sessão simples
        localStorage.setItem("usuarioLogado", JSON.stringify({ nome: usuarioSalvo.nome, email: usuarioSalvo.email, loggedAt: new Date().toISOString() }));
        alert("Login realizado com sucesso!");
        window.location.href = "home.html"; // ou "proxima.html" / "index.html" conforme seu fluxo
      } else {
        alert("Nome/Email ou senha incorretos!");
      }
    });
  }

});
