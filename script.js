/**
 * NAVEGACIÓN
 */
function mostrarModulo(id, btn) {
    document.getElementById('vigenere-module').style.display = 'none';
    document.getElementById('transposicion-module').style.display = 'none';
    document.getElementById(id).style.display = 'block';

    document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

/**
 * ALFABETO UNIFICADO (38 caracteres)
 * Especificación: A-Z (incluyendo Ñ), espacio, 0-9
 */
/**
 * ALFABETO UNIFICADO (37 caracteres)
 * Especificación: A-Z (incluyendo Ñ), 0-9
 */
const ALPHABET = {
    chars: 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789',
    size: 37
};

/**
 * NORMALIZACIÓN AL ESTILO PYTHON
 * Limpia tildes, protege la Ñ, pasa a mayúsculas y elimina cualquier carácter no válido.
 */
function normalizeText(text) {
    // 1. Pasa a mayúsculas y protege la Ñ reemplazándola por un carácter temporal (§)
    let upperText = text.toUpperCase().replace(/Ñ/g, '§');

    // 2. Elimina las tildes (equivalente a unicodedata.normalize('NFD') en Python)
    upperText = upperText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 3. Restaura la Ñ
    let resultText = upperText.replace(/§/g, 'Ñ');

    // 4. Filtra dejando ÚNICAMENTE los caracteres que existen en nuestro alfabeto
    let finalString = "";
    for (let char of resultText) {
        if (ALPHABET.chars.includes(char)) {
            finalString += char;
        }
    }
    
    return finalString;
}

// Ya no necesitamos 'validateText' que lanza errores, porque 'normalizeText' 
// ahora filtra automáticamente la basura, tal como lo hace tu Python.

/**
 * LÓGICA VIGENÈRE
 */
const vigenere = {
    msg: document.getElementById('message'),
    key: document.getElementById('key'),
    res: document.getElementById('final-result'),
    steps: document.getElementById('steps-content'),
    container: document.getElementById('steps-container'),
    formula: document.getElementById('formula-info'),
    data: null,
    errorEl: document.getElementById('error-message'),

    showError(msg) {
        this.errorEl.textContent = msg;
        this.errorEl.classList.remove('hidden');
    },

    hideError() {
        this.errorEl.classList.add('hidden');
    },

    process(mode) {
        this.hideError();
        try {
            // Usamos nuestra nueva normalización estricta
            const text = normalizeText(this.msg.value);
            const key = normalizeText(this.key.value);

            // Validación al estilo Python: ¿Quedó algo después de limpiar?
            if (!text || !key) {
                return this.showError("El mensaje y la clave están vacíos o no contienen caracteres válidos.");
            }

            const alphabet = ALPHABET;
            const n = alphabet.size;
            const keyLen = key.length;
            let result = '';
            let stepsData = [];

            // Iteración directa como en Python
            for (let i = 0; i < text.length; i++) {
                let m_idx = alphabet.chars.indexOf(text[i]);
                let k_char = key[i % keyLen];
                let k_idx = alphabet.chars.indexOf(k_char);
                
                let res_idx;
                
                // Aplicamos la misma fórmula matemática (n = 37)
                if (mode === 'enc') {
                    res_idx = (m_idx + k_idx) % n;
                } else { // dec
                    res_idx = (m_idx - k_idx + n) % n;
                }
                
                let res_char = alphabet.chars[res_idx];
                result += res_char;
                
                // Guardamos para la tabla de pasos
                stepsData.push({ 
                    char: text[i], t: m_idx, 
                    kChar: k_char, k: k_idx, 
                    resChar: res_char, resCode: res_idx 
                });
            }
            
            this.res.innerText = result;
            this.data = { mode, stepsData, alphabet };
        } catch (e) {
            this.showError("Error inesperado: " + e.message);
        }
    },

    renderSteps() {
        if (!this.data) return;
        this.container.classList.remove('hidden');
        this.steps.innerHTML = '';
        const size = this.data.alphabet.size;
        
        this.formula.innerText = this.data.mode === 'enc' 
            ? `(Texto + Clave) mod ${size}` 
            : `(Texto - Clave + ${size}) mod ${size}`;

        this.data.stepsData.forEach(s => {
            const card = document.createElement('div');
            card.className = 'step-card';
            card.innerHTML = `
                <div style="font-size:0.8rem; color:gray">Letra: ${s.char} (${s.t})</div>
                <div style="font-size:0.8rem; color:gray">Clave: ${s.kChar} (${s.k})</div>
                <div style="margin-top:5px; color:var(--primary); font-weight:bold">-> ${s.resChar} (${s.resCode})</div>
            `;
            this.steps.appendChild(card);
        });
    }
};

/**
 * LÓGICA TRANSPOSICIÓN
 */
const transpo = {
    msg: document.getElementById('trans-message'),
    key: document.getElementById('trans-key'),
    res: document.getElementById('trans-final-result'),
    steps: document.getElementById('trans-steps-content'),
    container: document.getElementById('trans-steps-container'),
    data: null,
    errorEl: document.getElementById('trans-error-message'),

    showError(msg) {
        this.errorEl.textContent = msg;
        this.errorEl.classList.remove('hidden');
    },

    hideError() {
        this.errorEl.classList.add('hidden');
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
            const text = preprocessAndValidate(this.msg.value);
            const key = preprocessAndValidate(this.key.value);

            if (!text || !key) {
                return this.showError("Completa los campos");
            }

            const alphabet = ALPHABET;
            const cols = key.length;
            const rows = Math.ceil(text.length / cols);
            const { keyArr, order } = this.getOrder(key);
            let grid = Array.from({ length: rows }, () => new Array(cols).fill(''));
            let result = '';

            if (mode === 'enc') {
                for (let i = 0; i < text.length; i++) grid[Math.floor(i/cols)][i%cols] = text[i];
                keyArr.forEach(col => {
                    for (let r = 0; r < rows; r++) if (grid[r][col.i]) result += grid[r][col.i];
                });
            } else {
                let k = 0;
                keyArr.forEach(col => {
                    for (let r = 0; r < rows; r++) {
                        if (r * cols + col.i < text.length) grid[r][col.i] = text[k++];
                    }
                });
                for (let r = 0; r < rows; r++) result += grid[r].join('');
            }

            this.res.innerText = result;
            this.data = { grid, key, order, rows, cols, alphabet };
        } catch (e) {
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
            row.forEach(cell => html += `<td>${cell || '-'}</td>`);
            html += `</tr>`;
        });
        html += `</table></div>`;
        this.steps.innerHTML = html;
    }
};

// Event Listeners Vigenere
document.getElementById('btn-encrypt').onclick = () => vigenere.process('enc');
document.getElementById('btn-decrypt').onclick = () => vigenere.process('dec');
document.getElementById('btn-steps').onclick = () => vigenere.renderSteps();
document.getElementById('btn-copy').onclick = () => navigator.clipboard.writeText(vigenere.res.innerText);

// Event Listeners Transposición
document.getElementById('trans-btn-encrypt').onclick = () => transpo.process('enc');
document.getElementById('trans-btn-decrypt').onclick = () => transpo.process('dec');
document.getElementById('trans-btn-steps').onclick = () => transpo.renderSteps();
document.getElementById('trans-btn-copy').onclick = () => navigator.clipboard.writeText(transpo.res.innerText);