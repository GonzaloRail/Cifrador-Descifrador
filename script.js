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
 * ALFABETOS DISPONIBLES
 */
const alphabets = {
    std: {
        name: 'Español Unificado (38)',
        chars: 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ 0123456789',
        size: 38
    },
    en: {
        name: 'Inglés (26)',
        chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        size: 26
    },
    es: {
        name: 'Español (27)',
        chars: 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ',
        size: 27
    }
};

function getAlphabet(id) {
    return alphabets[document.getElementById(id).value];
}

const ACCENT_MAP = {
    'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U', 'Ü': 'U',
    'á': 'A', 'é': 'E', 'í': 'I', 'ó': 'O', 'ú': 'U', 'ü': 'U'
};

function normalizeText(text, alphabet) {
    return text.toUpperCase().split('').map(c => ACCENT_MAP[c] || c).join('');
}

function validateText(text, alphabet) {
    const validChars = new Set(alphabet.chars);
    const invalidChars = text.split('').filter(c => !validChars.has(c));
    if (invalidChars.length > 0) {
        throw new Error(`Caracteres inválidos detectados: ${[...new Set(invalidChars)].join(', ')}`);
    }
    return true;
}

function preprocessAndValidate(text, alphabet) {
    const normalized = normalizeText(text, alphabet);
    validateText(normalized, alphabet);
    return normalized;
}

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
            const alphabet = getAlphabet('alphabet');
            const text = preprocessAndValidate(this.msg.value, alphabet);
            const key = preprocessAndValidate(this.key.value, alphabet);

            if (!text || !key) {
                return this.showError("Completa todos los campos");
            }

            let result = '';
            let keyIdx = 0;
            let stepsData = [];

            for (let i = 0; i < text.length; i++) {
                let char = text[i];
                let idx = alphabet.chars.indexOf(char);
                if (idx !== -1) {
                    let t = idx;
                    let kChar = key[keyIdx % key.length];
                    let k = alphabet.chars.indexOf(kChar);
                    let resCode = (mode === 'enc') ? (t + k) % alphabet.size : (t - k + alphabet.size) % alphabet.size;
                    let resChar = alphabet.chars[resCode];
                    
                    result += resChar;
                    stepsData.push({ char, t, kChar, k, resChar, resCode });
                    keyIdx++;
                } else {
                    result += char;
                    stepsData.push({ char, isSpecial: true });
                }
            }
            this.res.innerText = result;
            this.data = { mode, stepsData, alphabet };
        } catch (e) {
            this.showError(e.message);
        }
    },

    renderSteps() {
        if (!this.data) return;
        this.container.classList.remove('hidden');
        this.steps.innerHTML = '';
        const size = this.data.alphabet.size;
        this.formula.innerText = this.data.mode === 'enc' ? `(Texto + Clave) mod ${size}` : `(Texto - Clave + ${size}) mod ${size}`;

        this.data.stepsData.forEach(s => {
            const card = document.createElement('div');
            card.className = 'step-card';
            if (s.isSpecial) {
                card.innerHTML = `<small>Especial:</small><br><strong>${s.char}</strong>`;
            } else {
                card.innerHTML = `
                    <div style="font-size:0.8rem; color:gray">Letra: ${s.char} (${s.t})</div>
                    <div style="font-size:0.8rem; color:gray">Clave: ${s.kChar} (${s.k})</div>
                    <div style="margin-top:5px; color:var(--primary); font-weight:bold">-> ${s.resChar} (${s.resCode})</div>
                `;
            }
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
            const alphabet = getAlphabet('trans-alphabet');
            const text = preprocessAndValidate(this.msg.value, alphabet);
            const key = preprocessAndValidate(this.key.value, alphabet);

            if (!text || !key) {
                return this.showError("Completa los campos");
            }

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