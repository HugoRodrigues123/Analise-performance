document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const usuario = document.getElementById("login-usuario");
  const senha = document.getElementById("login-senha");
  const erro = document.getElementById("login-erro");

  setTimeout(() => usuario?.focus(), 80);

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (efetuarLogin(usuario.value, senha.value)) {
      erro.textContent = "";
      instalarTransicaoNavegacao();
      definirTituloTransicao("Análise de Performance");
      const overlay = document.getElementById("page-transition");
      if (overlay) {
        overlay.classList.remove("active");
        void overlay.offsetWidth;
        overlay.classList.add("active");
        setTimeout(() => {
          window.location.href = "index.html";
        }, 600);
      } else {
        window.location.href = "index.html";
      }
      return;
    }

    erro.textContent = "Usuário ou senha inválidos.";
    senha.value = "";
    senha.focus();
  });
});

function recuperarSenhaLogin() {
  const email = window.prompt("Informe o e-mail cadastrado:");
  if (!email) return;
  const emailLimpo = String(email).trim().toLowerCase();
  const usuarios = getUsuariosAcesso();
  const existe = usuarios.some((usuario) => usuario.usuario.toLowerCase() === emailLimpo)
    || emailLimpo === "admin";

  if (!existe) {
    alert("E-mail não encontrado no cadastro.");
    return;
  }

  alert("Para este acesso inicial, utilize a senha padrão: 1234");
}
