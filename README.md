# Dieren Bingo Spel

Volledige Dieren Bingo applicatie voor kinderfeestjes, gebouwd met Vanilla HTML/CSS/JS. Speel direct online via GitHub Pages of download de bestanden om het **100% offline** te gebruiken.

## 🚀 Online Spelen (Aanbevolen)

Je kunt het spel direct in je browser spelen, zonder iets te installeren.

**[➡️ Speel Dierenbingo via GitHub Pages](https://ebeverdam.github.io/dierenbingo/)**

## 📋 Inhoud

- **index.html** → Trekking-UI (trekken van dieren)
- **bingo-cards.html** → Printbare bingo kaarten (15 kaarten × 3×4 grid)
- **app.js** → Core game logic (state, audio, UI updates)
- **style.css** → Responsive design & print styles

## 🎮 Lokaal Gebruiken (Offline)

### Trekking (Spelen)
1. Open `index.html` in een moderne browser (Edge, Chrome, Firefox)
2. Klik op **"Trek Dier"** knop (of druk op Spatie/Enter)
3. Wachtend op bal-animatie → dier wordt getrokken en getoond
4. Getrokken dieren verschijnen als badges in de geschiedenis
5. Geluiden + confetti wanneer BINGO! wordt geroepen

### Kaarten Printen
1. Klik op **"Print Kaarten"** → gaat naar `bingo-cards.html`
2. **15 unieke kaarten** worden gegenereerd (elk 3 rijen × 4 kolommen)
3. Printdialoog opent automatisch
4. Druk af op **A5 liggend** formaat (optimaal op standaardprinter)

## ⚙️ Configuratie

Alle instellingen staan bovenin `app.js` in de `CONFIG` object:

```javascript
const CONFIG = {
    ANIM_DURATION: 1500,      // Bal-animatie duur (ms)
    SOUND_VOLUME: 0.5,        // Geluidvolume 0.0-1.0
    NUM_CARDS: 15,            // Aantal printkaarten
    CARDS_LAYOUT: { rows: 3, cols: 4 },  // Kaartlayout
    LOCALE: 'nl',             // Taal (Nederlands)
    PAGE_FORMAT: 'A5-landscape' // Printformat
};
```

**Geluidsvolume aanpassen:** Wijzig `SOUND_VOLUME: 0.5` naar bijvoorbeeld `0.3` (stiller) of `0.7` (luider).

## 🎨 Functies

✅ **Trekking:**
- Uniforme random selectie uit resterende dieren (geen herhaling)
- Balletje-animatie + ding geluid
- Geschiedenis als kleurrijke badges/chips
- Teller "Resterend: N"

✅ **Geluiden:**
- 🎵 "Roll" sound (bal rolt)
- 🔔 "Ding" sound (dier getrokken)
- 🎺 "Bingo" sound + applaus (BINGO geroepen)
- Geluiden gegenereerd met Web Audio API (geen externe files)

✅ **Visuele effecten:**
- 🎉 Confetti animatie bij BINGO
- Smooth transitions & hover effects
- Responsive design (Desktop/Tablet/TV)

✅ **Printkaarten:**
- 15 unieke kaarten
- Elk 12 velden (3×4 grid)
- Geen dubbele dieren per kaart
- A5 liggend formaat
- Heldere emoji-icoontjes (groot & leesbaar voor kinderen)

✅ **State Persistence:**
- LocalStorage slaat spel op
- Doorspelen of resetten mogelijk
- Teller reset na "Spel Resetten"

✅ **Toetsenbord Support:**
- **Spatie/Enter** → Trek dier
- Browser-standaard shortcuts werken

## 📱 Browser Compatibiliteit

- ✅ Edge 18+
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+

(Requires Web Audio API support)

## 🐾 Dieren (20 totaal)

🐶 Hond, 🐱 Kat, 🐮 Koe, 🐷 Varken, 🐑 Schaap, 🐴 Paard, 🐔 Kip, 🦆 Eend, 🐰 Konijn, 🐭 Muis, 🐘 Olifant, 🦁 Leeuw, 🐒 Aap, 🐻 Beer, 🐊 Krokodil, 🐍 Slang, 🐯 Tijger, 🦓 Zebra, 🦒 Giraf, 🐧 Pinguïn

## 🔧 Validatie

- ✅ Exact 20 unieke dieren
- ✅ Geen dubbele dieren per kaart
- ✅ Geen herhaalde trekking
- ✅ Reset werkt volledig (alle state gewist)
- ✅ LocalStorage persistent (doorga waar je stopte)

## 🚀 Tips voor de praktijk

- **Geluidsvolume:** Controleer vooraf in een rustige omgeving. TV-speakers zijn soms luid!
- **Print quality:** Test 1 kaart eerst; controleer of de emoji's scherp afdrukken
- **A5 landscape:** Sommige printers eisen rand-marges; configuratie in `bingo-cards.html` kan worden aangepast
- **Toetsenbord:** Gebruik Spatie op externe TV-afstandsbediening (muis/trackpad kan nuttig zijn als backup)

## 📝 Licentie & Krediet

Gebouwd voor kinderfeestjes | Vanilla JS (no dependencies)

---

**Veel plezier met het bingo spel! 🎊**
