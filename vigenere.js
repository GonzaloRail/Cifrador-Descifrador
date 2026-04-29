// vigenere.js
const vigenere = {
    msg: document.getElementById('message'),
    key: document.getElementById('key'),
    res: document.getElementById('final-result'),
    steps: document.getElementById('steps-content'),
    container: document.getElementById('steps-container'),
    formula: document.getElementById('formula-info'),
    errorEl: document.getElementById('error-message'),
    data: null,

    // ALFABETO EXACTO DE TU PYTHON (37 caracteres)
    alphabet: "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789",

    showError(msg) {
        this.errorEl.textContent = msg;
        this.errorEl.classList.remove('hidden');
    },

    hideError() {
        this.errorEl.classList.add('hidden');
    },

    // Lógica de limpieza idéntica a tu Python
    normalize(text) {
        let upperText = text.toUpperCase().replace(/Ñ/g, '§');
        upperText = upperText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        let resultText = upperText.replace(/§/g, 'Ñ');

        let finalString = "";
        for (let char of resultText) {
            if (this.alphabet.includes(char)) {
                finalString += char;
            }
        }
        return finalString;
    },

    process(mode) {
        this.hideError();
        try {
            const text = this.normalize(this.msg.value);
            const key = this.normalize(this.key.value);

            if (!text || !key) {
                return this.showError("El mensaje y la clave están vacíos o no contienen caracteres válidos.");
            }

            const n = 37;
            const keyLen = key.length;
            let result = '';
            let stepsData = [];

            for (let i = 0; i < text.length; i++) {
                let m_idx = this.alphabet.indexOf(text[i]);
                let k_char = key[i % keyLen];
                let k_idx = this.alphabet.indexOf(k_char);
                
                let res_idx;
                if (mode === 'enc') {
                    res_idx = (m_idx + k_idx) % n;
                } else { // dec
                    res_idx = (m_idx - k_idx + n) % n;
                }
                
                let res_char = this.alphabet[res_idx];
                result += res_char;
                
                stepsData.push({ 
                    char: text[i], t: m_idx, 
                    kChar: k_char, k: k_idx, 
                    resChar: res_char, resCode: res_idx 
                });
            }
            
            this.res.innerText = result;
            this.data = { mode, stepsData };
        } catch (e) {
            this.showError("Error inesperado: " + e.message);
        }
    },

    renderSteps() {
        if (!this.data) return;
        this.container.classList.remove('hidden');
        this.steps.innerHTML = '';
        
        this.formula.innerText = this.data.mode === 'enc' 
            ? `(Texto + Clave) mod 37` 
            : `(Texto - Clave + 37) mod 37`;

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

// Eventos de Vigenère
document.getElementById('btn-encrypt').onclick = () => vigenere.process('enc');
document.getElementById('btn-decrypt').onclick = () => vigenere.process('dec');
document.getElementById('btn-steps').onclick = () => vigenere.renderSteps();
document.getElementById('btn-copy').onclick = () => navigator.clipboard.writeText(vigenere.res.innerText);