document.getElementById("formEntrada").addEventListener("submit", function(e) {
    e.preventDefault();

    const sexo = document.getElementById("sexo").value;
    const idade = document.getElementById("idade").value;
    const peso = document.getElementById("peso").value;
    const altura = document.getElementById("altura").value;

    const dadosUsuario = {
        sexo,
        idade,
        peso,
        altura
    };

    localStorage.setItem("dadosEntrada", JSON.stringify(dadosUsuario));

    window.location.href = "proxima.html";
});
