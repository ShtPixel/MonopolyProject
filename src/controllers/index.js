document.getElementById('btn-rules').addEventListener('click', function() {
    var rulesModal = new bootstrap.Modal(document.getElementById('rulesModal'));
    rulesModal.show();
});

document.getElementById('btn-exit').addEventListener('click', function() {
    if (confirm('¿Seguro que quieres salir?')) {
        window.close();
    }
});

// Agregar evento al botón "Jugar"
document.getElementById('btn-play').addEventListener('click', function() {
    window.location.href = 'src/views/login.html';
});