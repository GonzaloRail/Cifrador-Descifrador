// transposicion.js
const transpo = {
    msg: document.getElementById('trans-message'),
    key: document.getElementById('trans-key'),
    res: document.getElementById('trans-final-result'),
    steps: document.getElementById('trans-steps-content'),
    container: document.getElementById('trans-steps-container'),
    errorEl: document.getElementById('trans-error-message'),
    data: null,

    // 1. ALFABETO ESTANDARIZADO (38 caracteres)
    // El espacio está en la posición 28 (índice 27)
    alphabet: "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ 0123456789",

    showError(msg) {
        this.errorEl.textContent = msg;
        this.errorEl.classList.remove('hidden');
    },

    hideError() {
        this.errorEl.classList.add('hidden');
    },

    // 2 y 3. REGLAS DE PRE-PROCESAMIENTO Y VALIDACIÓN
    preprocessAndValidate(text) {
        if (!text) return "";

        // a) Todo el texto a MAYÚSCULAS
        let upperText = text.toUpperCase();
        
        // b) Proteger la Ñ antes de normalizar
        upperText = upperText.replace(/Ñ/g, '§');
        
        // c) Eliminar tildes y diéresis (Á->A, Ü->U)
        upperText = upperText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        // Restaurar la Ñ
        let processedText = upperText.replace(/§/g, 'Ñ');

        // d) Validación Estricta: Lanza error si hay un carácter fuera del alfabeto
        for (let char of processedText) {
            if (!this.alphabet.includes(char)) {
                throw new Error(`Carácter no permitido detectado: '${char}'`);
            }
        }
        
        return processedText;
    },

    getOrder(key) {
        let keyArr = key.split('').map((c, i) => ({ c, i }));
        keyArr.sort((a, b) => a.c.localeCompare(b.c) || a.i - b.i);
        let order = new Array(key.length);
        keyArr.forEach((x, i) => order[x.i] = i + 1);
        return { keyArr, order };
    },

    process(mode) {
        this.hideError();
        try {
            let rawText = this.msg.value;
            let rawKey = this.key.value;

            if (!rawText || !rawKey) {
                return this.showError("Por favor, completa el mensaje y la clave.");
            }

            // Aplicamos estandarización (Si hay error, salta directo al bloque catch)
            let text = this.preprocessAndValidate(rawText);
            let key = this.preprocessAndValidate(rawKey);

            const cols = key.length;
            const rows = Math.ceil(text.length / cols);
            
            // Rellenamos con espacios al final para hacer una matriz perfecta
            text = text.padEnd(rows * cols, ' ');

            const { keyArr, order } = this.getOrder(key);
            let grid = Array.from({ length: rows }, () => new Array(cols).fill(''));
            let result = '';

            if (mode === 'enc') {
                // Llenamos la matriz horizontalmente
                for (let i = 0; i < text.length; i++) {
                    grid[Math.floor(i/cols)][i%cols] = text[i];
                }
                // Leemos las columnas ordenadas
                keyArr.forEach(col => {
                    for (let r = 0; r < rows; r++) {
                        result += grid[r][col.i]; 
                    }
                });
            } else { // descifrado
                let k = 0;
                keyArr.forEach(col => {
                    for (let r = 0; r < rows; r++) {
                        grid[r][col.i] = text[k++];
                    }
                });
                for (let r = 0; r < rows; r++) {
                    result += grid[r].join('');
                }
            }

            this.res.innerText = result;
            this.data = { grid, key, order, rows, cols };
        } catch (e) {
            // Atrapa el error de validación (ej. ingreso de un '@' o '.') y lo muestra en pantalla
            this.showError(e.message);
        }
    },

    renderSteps() {
        if (!this.data) return;
        this.container.classList.remove('hidden');
        let html = `<div class="table-scroll"><table><tr>`;
        this.data.key.split('').forEach((c, i) => html += `<th>${c}<br><small>(${this.data.order[i]})</small></th>`);
        html += `</tr>`;
        this.data.grid.forEach(row => {
            html += `<tr>`;
            // Pequeña mejora: Si la celda es un espacio vacío " ", mostrar un espacio no separable en la tabla
            row.forEach(cell => html += `<td>${cell === ' ' ? '&nbsp;' : cell}</td>`);
            html += `</tr>`;
        });
        html += `</table></div>`;
        this.steps.innerHTML = html;
    }
};

// Event Listeners Transposición
document.getElementById('trans-btn-encrypt').onclick = () => transpo.process('enc');
document.getElementById('trans-btn-decrypt').onclick = () => transpo.process('dec');
document.getElementById('trans-btn-steps').onclick = () => transpo.renderSteps();
document.getElementById('trans-btn-copy').onclick = () => navigator.clipboard.writeText(transpo.res.innerText);