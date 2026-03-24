// Synopsis: Core logic for UI state, audio, layout updates, and print generation.

// ============ CONFIG ============
const CONFIG = {
    ANIM_DURATION: 1500,
    SOUND_VOLUME: 0.3,
    NUM_CARDS: 15,
    CARDS_LAYOUT: { rows: 3, cols: 4 },
    LOCALE: 'nl',
    PAGE_FORMAT: 'A5-landscape',
};

const ANIMALS = [
    { id: 'hond', name: 'Hond', icon: '🐶' },
    { id: 'kat', name: 'Kat', icon: '🐱' },
    { id: 'koe', name: 'Koe', icon: '🐮' },
    { id: 'varken', name: 'Varken', icon: '🐷' },
    { id: 'schaap', name: 'Schaap', icon: '🐑' },
    { id: 'paard', name: 'Paard', icon: '🐴' },
    { id: 'kip', name: 'Kip', icon: '🐔' },
    { id: 'eend', name: 'Eend', icon: '🦆' },
    { id: 'konijn', name: 'Konijn', icon: '🐰' },
    { id: 'muis', name: 'Muis', icon: '🐭' },
    { id: 'olifant', name: 'Olifant', icon: '🐘' },
    { id: 'leeuw', name: 'Leeuw', icon: '🦁' },
    { id: 'aap', name: 'Aap', icon: '🐒' },
    { id: 'beer', name: 'Beer', icon: '🐻' },
    { id: 'krokodil', name: 'Krokodil', icon: '🐊' },
    { id: 'slang', name: 'Slang', icon: '🐍' },
    { id: 'tijger', name: 'Tijger', icon: '🐯' },
    { id: 'zebra', name: 'Zebra', icon: '🦓' },
    { id: 'giraf', name: 'Giraf', icon: '🦒' },
    { id: 'pinguin', name: 'Pinguïn', icon: '🐧' },
].map(a => ({
    ...a,
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="15" fill="%23fdf6e3" stroke="%23ff9f43" stroke-width="2"/><text x="50" y="70" font-size="60" text-anchor="middle">${a.icon}</text></svg>`
}));

// Validate animal count
console.assert(ANIMALS.length === 20, '❌ Must have exactly 20 unique animals');

// ============ STATE ============
let state = { remaining: [...ANIMALS], drawn: [] };
let audioCtx;
let bgMusicIsPlaying = false;
let bgMusicVolume = 0.1;  // 10% baseline volume

// Settings
const settings = {
    soundEnabled: true,
    speechEnabled: true,
    speechVolume: 1,
    bgMusicVolume: 0.1  // 10% baseline
};

// Load settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('bingoSettings');
    if (saved) {
        Object.assign(settings, JSON.parse(saved));
    }
}

function saveSettings() {
    localStorage.setItem('bingoSettings', JSON.stringify(settings));
}

// ============ AUDIO ============
function initAudio() {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('AudioContext not available:', e);
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(type) {
    if (!audioCtx || !settings.soundEnabled) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    const vol = CONFIG.SOUND_VOLUME;
    
    if (type === 'ding') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(vol * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    }
}

// ============ SPEECH ============
function speakAnimalName(name) {
    if (!('speechSynthesis' in window) || !settings.speechEnabled) return;
    
    const bgMusic = document.getElementById('background-music');
    
    // Mute background music during speech
    if (bgMusic && bgMusicIsPlaying) {
        bgMusic.volume = 0;
    }
    
    speechSynthesis.cancel(); // Cancel any ongoing speech
    
    const utterance = new SpeechSynthesisUtterance(name);
    utterance.lang = 'nl-NL'; // Force Dutch
    utterance.volume = settings.speechVolume;
    utterance.pitch = 1.2;
    utterance.rate = 0.9;
    
    // Try to use a Dutch voice
    const voices = speechSynthesis.getVoices();
    let selectedVoice = voices.find(v => v.lang.startsWith('nl') || v.lang.startsWith('nl-'));
    
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }
    
    // Restore bg music to 10% after speech
    utterance.onend = () => {
        if (bgMusic && bgMusicIsPlaying) {
            bgMusic.volume = 0.1;
        }
    };
    
    speechSynthesis.speak(utterance);
}

// Speak greeting message
function speakGreeting(message) {
    if (!('speechSynthesis' in window) || !settings.speechEnabled) return;
    
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'nl-NL'; // Force Dutch
    utterance.volume = settings.speechVolume;
    utterance.pitch = 1.2;
    utterance.rate = 0.9;
    
    const voices = speechSynthesis.getVoices();
    let selectedVoice = voices.find(v => (v.lang.startsWith('nl') || v.lang.startsWith('nl-')));
    
    // Fallback: Any voice
    if (!selectedVoice) {
        selectedVoice = voices[0];
    }
    
    if (selectedVoice) utterance.voice = selectedVoice;
    
    speechSynthesis.speak(utterance);
}

// Speak BINGO message (excited/celebratory)
function speakBingo() {
    if (!('speechSynthesis' in window) || !settings.speechEnabled) return;
    
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance('Bingo! Gefeliciteerd! Wil je doorspelen tot een volgende bingo?');
    utterance.lang = 'nl-NL'; // Force Dutch
    utterance.volume = settings.speechVolume;
    
    // Make it excited - higher pitch, faster
    utterance.pitch = 1.6;
    utterance.rate = 0.95;
    
    const voices = speechSynthesis.getVoices();
    let selectedVoice = voices.find(v => v.lang.startsWith('nl') || v.lang.startsWith('nl-'));
    
    // Fallback
    if (!selectedVoice) {
        selectedVoice = voices[0];
    }
    
    if (selectedVoice) utterance.voice = selectedVoice;
    
    speechSynthesis.speak(utterance);
}

// ============ UI ============
function renderBoard() {
    const history = document.getElementById('history');
    history.innerHTML = state.drawn.map((a, idx) => {
        return `<div class="chip" title="${a.name}">
            <span class="chip-num">${idx + 1}</span>
            <span class="chip-icon">${a.icon}</span>
        </div>`;
    }).join('');
    
    document.getElementById('counter').innerText = `Resterend: ${state.remaining.length}`;
}

function confetti() {
    // Create confetti particles
    const canvas = document.createElement('canvas');
    canvas.id = 'confetti';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    const particles = [];
    
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            vx: (Math.random() - 0.5) * 8,
            vy: Math.random() * 5 + 3,
            life: 2,
            color: ['#ff9f43', '#1dd1a1', '#ee5253', '#ffa502'][Math.floor(Math.random() * 4)],
            size: Math.random() * 6 + 2
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        
        particles.forEach(p => {
            p.y += p.vy;
            p.x += p.vx;
            p.vy += 0.2; // gravity
            p.life -= 0.016;
            p.vx *= 0.99; // air resistance
            
            if (p.life > 0) {
                alive = true;
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life / 2;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            }
        });
        
        ctx.globalAlpha = 1;
        if (alive) requestAnimationFrame(animate);
        else canvas.remove();
    }
    
    animate();
}

function drawAnimal() {
    if (state.remaining.length === 0) return;
    
    initAudio();
    const btnDraw = document.getElementById('btn-draw');
    const ball = document.getElementById('ball');
    const result = document.getElementById('result');

    btnDraw.disabled = true;
    result.classList.add('hidden');
    ball.classList.remove('hidden');
    ball.classList.add('rolling');

    const randIdx = Math.floor(Math.random() * state.remaining.length);
    const animal = state.remaining.splice(randIdx, 1)[0];

    setTimeout(() => {
        ball.classList.remove('rolling');
        ball.classList.add('hidden');
        document.getElementById('result-img').src = animal.svg;
        document.getElementById('result-name').innerText = animal.name;
        result.classList.remove('hidden');
        
        playSound('ding');
        speakAnimalName(animal.name);
        state.drawn.push(animal);
        localStorage.setItem('bingoState', JSON.stringify(state));
        renderBoard();
        
        if (state.remaining.length > 0) btnDraw.disabled = false;
    }, CONFIG.ANIM_DURATION);
}

// Generate print cards for modal
function generatePrintCards(numCards) {
    const preview = document.getElementById('print-preview');
    const status = document.getElementById('cardStatus');
    const wildcard = { name: 'WILDCARD', icon: '⭐', isWildcard: true };
    
    // Validate input
    numCards = Math.max(4, Math.min(100, parseInt(numCards) || 4));
    numCards = Math.ceil(numCards / 4) * 4;
    
    let html = '';
    let cardIndex = 0;
    
    // Generate pages with 4 cards each (2x2 grid)
    for (let pageNum = 0; cardIndex < numCards; pageNum++) {
        html += '<div class="print-page">';
        
        // 4 cards per page
        for (let cardInPage = 0; cardInPage < 4 && cardIndex < numCards; cardInPage++) {
            cardIndex++;
            
            const shuffled = [...ANIMALS].sort(() => 0.5 - Math.random());
            const cardAnimals = shuffled.slice(0, 11);
            
            html += `<div class="print-card">`;
            html += `<div class="print-card-number">${cardIndex}</div>`;
            
            // Wildcard first
            html += `<div class="print-cell wildcard-cell">
                <div class="print-cell-emoji">${wildcard.icon}</div>
                <div class="print-cell-text">${wildcard.name}</div>
            </div>`;
            
            // Animals
            cardAnimals.forEach(a => {
                html += `<div class="print-cell">
                    <div class="print-cell-emoji">${a.icon}</div>
                    <div class="print-cell-text">${a.name}</div>
                </div>`;
            });
            
            html += `</div>`;
        }
        
        html += '</div>';
    }
    
    preview.innerHTML = html;
    status.textContent = `${numCards} kaarten gegenereerd (${Math.ceil(numCards / 4)} A4 pagina's)`;
}

// Placeholder for print button
function preparePrint() {
    const modalPrintCards = document.getElementById('modal-print-cards');
    modalPrintCards.classList.remove('hidden');
    generatePrintCards(document.getElementById('cardCount').value);
}

document.addEventListener('DOMContentLoaded', () => {
    // Load settings
    loadSettings();
    
    // Log available voices for debugging
    if ('speechSynthesis' in window) {
        speechSynthesis.onvoiceschanged = () => {
            const voices = speechSynthesis.getVoices();
            console.log('Available voices:');
            voices.forEach((voice, i) => {
                console.log(`${i}: ${voice.name} (${voice.lang})`);
            });
        };
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
            console.log('Available voices:');
            voices.forEach((voice, i) => {
                console.log(`${i}: ${voice.name} (${voice.lang})`);
            });
        }
    }
    
    const saved = localStorage.getItem('bingoState');
    const hasActivegame = saved && JSON.parse(saved).drawn && JSON.parse(saved).drawn.length > 0;
    
    // Intro handling
    const intro = document.getElementById('intro');
    const appUi = document.getElementById('app-ui');
    const btnStart = document.getElementById('btn-start');
    const modalResume = document.getElementById('modal-resume');
    const introMusic = document.getElementById('intro-music');
    
    // Start intro music - try both autoplay and manual play
    if (introMusic) {
        introMusic.volume = 0.3;
        // Try autoplay first (may fail due to browser policies)
        introMusic.play().catch(e => {
            // If autoplay fails, try on first interaction
            console.log('Autoplay blocked, waiting for user interaction');
        });
        
        // Ensure music plays on any user interaction
        const playIntroOnInteraction = () => {
            if (introMusic.paused && !document.getElementById('intro').classList.contains('hidden')) {
                introMusic.play().catch(e => console.log('Play failed:', e));
            }
            document.removeEventListener('click', playIntroOnInteraction);
            document.removeEventListener('keydown', playIntroOnInteraction);
        };
        
        document.addEventListener('click', playIntroOnInteraction);
        document.addEventListener('keydown', playIntroOnInteraction);
    }
    
    if (btnStart) {
        btnStart.addEventListener('click', () => {
            const bgMusicElement = document.getElementById('background-music');
            
            // Fade out intro music
            if (introMusic && !introMusic.paused) {
                let vol = 0.3;
                const fadeOutInterval = setInterval(() => {
                    vol -= 0.05;
                    if (vol <= 0.03) {
                        introMusic.pause();
                        introMusic.currentTime = 0;
                        clearInterval(fadeOutInterval);
                    } else {
                        introMusic.volume = vol;
                    }
                }, 50);
            }
            
            intro.classList.add('hidden');
            appUi.classList.remove('hidden');
            
            // Auto-play background music at 10% volume
            if (bgMusicElement) {
                bgMusicElement.volume = 0.1;
                bgMusicElement.play().catch(e => console.log('Background music play failed:', e));
                bgMusicIsPlaying = true;
                bgMusicVolume = 0.1;
            }
            
            // Check if there's an active game
            if (hasActivegame) {
                modalResume.classList.remove('hidden');
            } else {
                // New game greeting
                speakGreeting('Nieuwe bingo ronde wordt gestart, veel succes!');
                if (saved) state = JSON.parse(saved);
                renderBoard();
            }
            
            initAudio();
            document.body.addEventListener('click', initAudio, { once: true });
        });
    }
    
    // Resume or New Game modal
    document.getElementById('modal-btn-resume').addEventListener('click', () => {
        if (saved) state = JSON.parse(saved);
        renderBoard();
        speakGreeting('De bingo wordt hervat.');
        modalResume.classList.add('hidden');
    });
    
    document.getElementById('modal-btn-new-game-start').addEventListener('click', () => {
        state = { remaining: [...ANIMALS], drawn: [] };
        localStorage.setItem('bingoState', JSON.stringify(state));
        renderBoard();
        speakGreeting('Nieuwe bingo ronde wordt gestart, veel succes!');
        modalResume.classList.add('hidden');
    });

    document.getElementById('btn-draw').addEventListener('click', drawAnimal);
    document.getElementById('btn-print').addEventListener('click', preparePrint);
    
    document.getElementById('btn-bingo').addEventListener('click', () => {
        initAudio();
        const bingoAudio = document.getElementById('bingo-sound');
        if (bingoAudio && settings.soundEnabled) bingoAudio.play();
        confetti();
        
        // Speak bingo message
        setTimeout(() => {
            speakBingo();
        }, 500);
        
        // Show BINGO modal
        const modal = document.getElementById('modal-bingo');
        setTimeout(() => {
            modal.classList.remove('hidden');
        }, 1500);
    });
    
    document.getElementById('btn-reset').addEventListener('click', () => {
        const modal = document.getElementById('modal-reset');
        modal.classList.remove('hidden');
    });
    
    // Settings Modal
    const modalSettings = document.getElementById('modal-settings');
    const settingSoundEnabled = document.getElementById('setting-sound-enabled');
    const settingSpeechEnabled = document.getElementById('setting-speech-enabled');
    const settingSpeechVolume = document.getElementById('setting-speech-volume');
    const settingBgVolume = document.getElementById('setting-bg-volume');
    const speechVolDisplay = document.getElementById('speech-vol-display');
    const bgVolDisplay = document.getElementById('bg-vol-display');
    const bgMusicElement = document.getElementById('background-music');
    
    // Load settings into UI
    settingSoundEnabled.checked = settings.soundEnabled;
    settingSpeechEnabled.checked = settings.speechEnabled;
    settingSpeechVolume.value = settings.speechVolume * 100;
    speechVolDisplay.textContent = Math.round(settings.speechVolume * 100) + '%';
    settingBgVolume.value = settings.bgMusicVolume * 100;
    bgVolDisplay.textContent = Math.round(settings.bgMusicVolume * 100) + '%';
    
    // Settings handlers
    document.getElementById('btn-settings').addEventListener('click', () => {
        modalSettings.classList.remove('hidden');
    });
    
    settingSoundEnabled.addEventListener('change', (e) => {
        settings.soundEnabled = e.target.checked;
        saveSettings();
    });
    
    settingSpeechEnabled.addEventListener('change', (e) => {
        settings.speechEnabled = e.target.checked;
        saveSettings();
    });
    
    settingSpeechVolume.addEventListener('input', (e) => {
        settings.speechVolume = parseInt(e.target.value) / 100;
        speechVolDisplay.textContent = e.target.value + '%';
        saveSettings();
    });
    
    settingBgVolume.addEventListener('input', (e) => {
        settings.bgMusicVolume = parseInt(e.target.value) / 100;
        bgMusicVolume = settings.bgMusicVolume;
        if (bgMusicElement && bgMusicIsPlaying) bgMusicElement.volume = settings.bgMusicVolume;
        bgVolDisplay.textContent = e.target.value + '%';
        saveSettings();
    });
    
    document.getElementById('modal-btn-close-settings').addEventListener('click', () => {
        modalSettings.classList.add('hidden');
    });
    
    // Music toggle button
    const btnMusicToggle = document.getElementById('btn-music-toggle');
    if (btnMusicToggle) {
        btnMusicToggle.addEventListener('click', () => {
            if (bgMusicIsPlaying) {
                // Mute music
                if (bgMusicElement) bgMusicElement.pause();
                bgMusicIsPlaying = false;
                btnMusicToggle.textContent = '🔇';
            } else {
                // Resume music
                if (bgMusicElement) {
                    bgMusicElement.volume = bgMusicVolume;
                    bgMusicElement.play().catch(e => console.log('Play failed:', e));
                }
                bgMusicIsPlaying = true;
                btnMusicToggle.textContent = '🔊';
            }
        });
    }
    
    // Modal: BINGO
    const modalBingo = document.getElementById('modal-bingo');
    document.getElementById('modal-btn-continue').addEventListener('click', () => {
        modalBingo.classList.add('hidden');
    });
    
    document.getElementById('modal-btn-new-game').addEventListener('click', () => {
        state = { remaining: [...ANIMALS], drawn: [] };
        localStorage.setItem('bingoState', JSON.stringify(state));
        document.getElementById('result').classList.add('hidden');
        document.getElementById('btn-draw').disabled = false;
        renderBoard();
        speakGreeting('Nieuwe bingo ronde wordt gestart, veel succes!');
        modalBingo.classList.add('hidden');
    });
    
    // Modal: Reset
    const modalReset = document.getElementById('modal-reset');
    document.getElementById('modal-btn-reset-yes').addEventListener('click', () => {
        state = { remaining: [...ANIMALS], drawn: [] };
        localStorage.setItem('bingoState', JSON.stringify(state));
        document.getElementById('result').classList.add('hidden');
        document.getElementById('btn-draw').disabled = false;
        renderBoard();
        speakGreeting('Nieuwe bingo ronde wordt gestart, veel succes!');
        modalReset.classList.add('hidden');
    });
    
    document.getElementById('modal-btn-reset-no').addEventListener('click', () => {
        modalReset.classList.add('hidden');
    });
    
    // Modal: Print Cards
    const modalPrintCards = document.getElementById('modal-print-cards');
    const cardCountInput = document.getElementById('cardCount');
    const btnGenerateCards = document.getElementById('btn-generate-cards');
    const btnDirectPrint = document.getElementById('btn-direct-print');
    
    btnGenerateCards.addEventListener('click', () => {
        generatePrintCards(cardCountInput.value);
    });
    
    btnDirectPrint.addEventListener('click', () => {
        generatePrintCards(cardCountInput.value);
        setTimeout(() => window.print(), 500);
    });
    
    cardCountInput.addEventListener('input', () => {
        generatePrintCards(cardCountInput.value);
    });
    
    document.getElementById('modal-btn-close-cards').addEventListener('click', () => {
        modalPrintCards.classList.add('hidden');
    });
    
    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (!document.getElementById('btn-draw').disabled) {
                drawAnimal();
            }
        }
    });
});