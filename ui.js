// ui.js
function mostrarModulo(id, btn) {
    // Ocultar todos los módulos
    document.getElementById('vigenere-module').style.display = 'none';
    document.getElementById('transposicion-module').style.display = 'none';
    
    // Mostrar el seleccionado
    document.getElementById(id).style.display = 'block';

    // Actualizar botones del menú
    document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}