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

// Haal de actieve selectie dieren op basis van het instellingen menu
function getActiveAnimals() {
    // ALL_ANIMALS komt uit animals.js
    return ALL_ANIMALS.slice(0, settings.numAnimals).map(a => ({
        ...a,
        svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="15" fill="%23fdf6e3" stroke="%23ff9f43" stroke-width="2"/><text x="50" y="70" font-size="60" text-anchor="middle">${a.icon}</text></svg>`
    }));
}

// ============ STATE ============
let state = { remaining: [], drawn: [] };
let audioCtx;
let bgMusicIsPlaying = false;
let bgMusicVolume = 0.1;  // 10% baseline volume

// Settings
const settings = {
    soundEnabled: true,
    speechEnabled: true,
    speechVolume: 1,
    bgMusicVolume: 0.1, // 10% baseline
    numAnimals: 20
};

// Load settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('bingoSettings');
    if (saved) {
        Object.assign(settings, JSON.parse(saved));
        settings.numAnimals = Math.min(30, Math.max(20, settings.numAnimals)); // Forceer maximaal 30
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
    // Haal de emoji iconen op van de dieren die momenteel actief zijn in het spel
    const animalIcons = getActiveAnimals().map(a => a.icon);
    
    // Vernietig eventuele vorige instantie zodat hij soepel opnieuw kan afspelen bij meerdere keren klikken
    const existing = tsParticles.domItem(0);
    if (existing) {
        existing.destroy();
    }

    tsParticles.load("tsparticles", {
        "fullScreen": {
            "zIndex": 10000
        },
        "particles": {
            "number": { "value": 0 },
            "color": { "value": ["#00FFFC", "#FC00FF", "#fffc00"] },
            "shape": {
                "type": "character",
                "options": {
                    "character": {
                        "value": animalIcons,
                        "font": "sans-serif",
                        "weight": "400"
                    }
                }
            },
            "opacity": {
                "value": 1
            },
            "size": {
                "value": { "min": 20, "max": 35 }
            },
            "links": { "enable": false },
            "move": {
                "enable": true,
                "gravity": { "enable": true, "acceleration": 15 },
                "speed": { "min": 30, "max": 80 },
                "decay": 0.05,
                "direction": "top",
                "outModes": { "default": "destroy", "top": "none" }
            },
            "rotate": {
                "value": { "min": 0, "max": 360 },
                "direction": "random",
                "move": true,
                "animation": { "enable": true, "speed": 60 }
            }
        },
        "emitters": {
            "direction": "top",
            "position": { "x": 50, "y": 100 }, // Onderaan in het midden
            "rate": { "delay": 0.1, "quantity": 10 }, // Continue stroom confetti
            "size": { "width": 100, "height": 0 }
        }
    });
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
    
    const currentAnimals = getActiveAnimals();
    
    // Generate pages with 4 cards each (2x2 grid)
    for (let pageNum = 0; cardIndex < numCards; pageNum++) {
        html += '<div class="print-page">';
        
        // 4 cards per page
        for (let cardInPage = 0; cardInPage < 4 && cardIndex < numCards; cardInPage++) {
            cardIndex++;
            
            const shuffled = [...currentAnimals].sort(() => 0.5 - Math.random());
            const cardAnimals = shuffled.slice(0, 11);
            
            html += `<div class="print-card">`;
            html += `<div style="position: absolute; top: 1px; left: 4px; font-size: 8px; color: #666; font-weight: bold;">Bingo met ${currentAnimals.length} dieren</div>`;
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
                if (!saved) state = { remaining: [...getActiveAnimals()], drawn: [] };
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
        state = { remaining: [...getActiveAnimals()], drawn: [] };
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
        confetti();
        
        const showBingoModalAndSpeak = () => {
            speakBingo();
            setTimeout(() => {
                document.getElementById('modal-bingo').classList.remove('hidden');
            }, 1000);
        };

        if (bingoAudio && settings.soundEnabled) {
            bingoAudio.addEventListener('ended', showBingoModalAndSpeak, { once: true });
            bingoAudio.play().catch(() => showBingoModalAndSpeak());
        } else {
            showBingoModalAndSpeak();
        }
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
    const settingNumAnimals = document.getElementById('setting-num-animals');
    const speechVolDisplay = document.getElementById('speech-vol-display');
    const bgVolDisplay = document.getElementById('bg-vol-display');
    const numAnimalsDisplay = document.getElementById('num-animals-display');
    const bgMusicElement = document.getElementById('background-music');
    
    // Load settings into UI
    settingSoundEnabled.checked = settings.soundEnabled;
    settingSpeechEnabled.checked = settings.speechEnabled;
    settingSpeechVolume.value = settings.speechVolume * 100;
    speechVolDisplay.textContent = Math.round(settings.speechVolume * 100) + '%';
    settingBgVolume.value = settings.bgMusicVolume * 100;
    bgVolDisplay.textContent = Math.round(settings.bgMusicVolume * 100) + '%';
    settingNumAnimals.value = settings.numAnimals;
    numAnimalsDisplay.textContent = settings.numAnimals;
    
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
    
    settingNumAnimals.addEventListener('input', (e) => {
        settings.numAnimals = parseInt(e.target.value);
        numAnimalsDisplay.textContent = e.target.value;
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
        const existing = tsParticles.domItem(0);
        if (existing) existing.destroy(); // Stop confetti
        modalBingo.classList.add('hidden');
    });
    
    document.getElementById('modal-btn-new-game').addEventListener('click', () => {
        const existing = tsParticles.domItem(0);
        if (existing) existing.destroy(); // Stop confetti
        state = { remaining: [...getActiveAnimals()], drawn: [] };
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
        const existing = tsParticles.domItem(0);
        if (existing) existing.destroy(); // Stop confetti
        state = { remaining: [...getActiveAnimals()], drawn: [] };
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
        const preview = document.getElementById('print-preview');
        
        // Alleen een nieuwe set genereren als de preview nog leeg is
        if (preview.children.length === 0) {
            generatePrintCards(document.getElementById('cardCount').value);
        }
        
        // Open het printvenster met de huidige preview
        setTimeout(() => {
            window.print();
        }, 250);
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