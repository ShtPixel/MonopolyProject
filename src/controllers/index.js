document.getElementById('btn-rules').addEventListener('click', function() {
    var rulesModal = new bootstrap.Modal(document.getElementById('rulesModal'));
    rulesModal.show();
});

document.getElementById('btn-exit').addEventListener('click', function() {
    if (confirm('¿Seguro que quieres salir?')) {
        window.close();
    }
});

// Puedes agregar la lógica de "Iniciar Juego" aquí
document.getElementById('btn-play').addEventListener('click', function() {
    // Redirigir o iniciar el juego
    // window.location.href = 'src/views/BoardView.html';
});