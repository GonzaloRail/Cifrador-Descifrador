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
 * ALFABETOS ESPECÍFICOS
 */
const ALPHABET_VIGENERE = {
    chars: 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789', // 37 caracteres (Sin espacio)
    size: 37
};

const ALPHABET_TRANSPO = {
    chars: 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ 0123456789', // 38 caracteres (CON espacio)
    size: 38
};

/**
 * NORMALIZACIÓN DINÁMICA
 * Ahora recibe 'allowedChars' para saber qué caracteres dejar pasar.
 */
function normalizeText(text, allowedChars) {
    let upperText = text.toUpperCase().replace(/Ñ/g, '§');
    upperText = upperText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    let resultText = upperText.replace(/§/g, 'Ñ');

    let finalString = "";
    for (let char of resultText) {
        if (allowedChars.includes(char)) {
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
            const alphabet = ALPHABET_VIGENERE;
            // Pasamos los caracteres permitidos a la función
            const text = normalizeText(this.msg.value, alphabet.chars);
            const key = normalizeText(this.key.value, alphabet.chars);

            if (!text || !key) {
                return this.showError("El mensaje y la clave están vacíos o no contienen caracteres válidos.");
            }
            // ... el resto de tu código vigenere se mantiene exactamente igual
            const alphabet = ALPHABET;
            const n = alphabet.size;
            const keyLen = key.length;
            let result = '';
            let stepsData = [];

            // Iteración directa 
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
            const alphabet = ALPHABET_TRANSPO;
            
            // Usamos nuestra nueva función de limpieza pasándole el alfabeto con espacio
            let text = normalizeText(this.msg.value, alphabet.chars);
            let key = normalizeText(this.key.value, alphabet.chars);

            if (!text || !key) {
                return this.showError("Completa los campos con caracteres válidos.");
            }

            const cols = key.length;
            const rows = Math.ceil(text.length / cols);
            
            // --- EL TRUCO DE PYTHON ---
            // Rellenamos el texto con espacios al final para hacer una matriz perfecta
            text = text.padEnd(rows * cols, ' ');

            const { keyArr, order } = this.getOrder(key);
            let grid = Array.from({ length: rows }, () => new Array(cols).fill(''));
            let result = '';

            if (mode === 'enc') {
                // Llenamos la matriz
                for (let i = 0; i < text.length; i++) {
                    grid[Math.floor(i/cols)][i%cols] = text[i];
                }
                // Leemos las columnas ordenadas
                keyArr.forEach(col => {
                    for (let r = 0; r < rows; r++) {
                        // Ya no necesitamos validar si la celda existe, porque 
                        // rellenamos con espacios (matriz perfecta)
                        result += grid[r][col.i]; 
                    }
                });
            } else { // dec
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
            this.data = { grid, key, order, rows, cols, alphabet };
        } catch (e) {
            this.showError("Error inesperado: " + e.message);
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