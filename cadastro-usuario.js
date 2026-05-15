document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("cadastro-usuario-form");
  const nome = document.getElementById("cadastro-nome");
  const email = document.getElementById("cadastro-email");
  const erro = document.getElementById("cadastro-erro");

  setTimeout(() => nome?.focus(), 80);

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const resultado = salvarUsuarioAcesso(nome.value, email.value);
    if (!resultado.ok) {
      erro.textContent = resultado.mensagem;
      return;
    }

    erro.textContent = "";
    alert(resultado.mensagem);
    window.location.href = "login.html";
  });
});
