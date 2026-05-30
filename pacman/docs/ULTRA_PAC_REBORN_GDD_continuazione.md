# ULTRA PAC: REBORN — Game Design Document Completo
## CONTINUAZIONE dalla Sezione 8.5
### (Documento si ricollega esattamente dopo "Tile muro bordo N/")

---

## 8.5 — DESIGN DEGLI AMBIENTI E DEI LABIRINTI (CONTINUAZIONE)

### Set di Tile — Elenco Completo

Ogni mondo ha un set di tile strutturalmente identico ma visivamente distinto. Il set completo per ogni mondo comprende le seguenti tile:

**TILE MURO:**
- **Tile muro solido centro:** Blocco pieno non attraversabile. È la tile più comune nei muri.
- **Tile muro bordo Nord:** Muro con bordo luminoso sul lato superiore. Usata quando il muro è adiacente a un corridoio sopra.
- **Tile muro bordo Sud:** Come Nord ma sul lato inferiore.
- **Tile muro bordo Est:** Come Nord ma sul lato destro.
- **Tile muro bordo Ovest:** Come Nord ma sul lato sinistro.
- **Tile muro angolo NE:** Angolo esterno in alto a destra (bordo luminoso su lato Nord e lato Est).
- **Tile muro angolo NW:** Angolo esterno in alto a sinistra.
- **Tile muro angolo SE:** Angolo esterno in basso a destra.
- **Tile muro angolo SW:** Angolo esterno in basso a sinistra.
- **Tile muro angolo interno NE:** Angolo concavo dove il corridoio si curva — la luce si riflette all'interno dell'angolo.
- **Tile muro angolo interno NW, SE, SW:** Varianti degli angoli concavi.

**TILE PAVIMENTO (CORRIDOIO):**
- **Tile corridoio standard:** Il pavimento normale su cui PAC cammina.
- **Tile corridoio con pellet:** Come standard ma con il pellet visibile al centro.
- **Tile corridoio con power pellet:** Pavimento con il grande pellet luminoso.
- **Tile corridoio con pellet dorato:** Pavimento con pellet dorato (richiede effetto glow speciale).
- **Tile corridoio oscuro:** Pavimento di una zona d'ombra — più scuro, leggermente diverso nel pattern.
- **Tile corridoio con corrente (solo Mondo 2):** Con freccia direzionale integrata nel pavimento.
- **Tile corridoio con ghiaccio (durante Ice Form):** Pavimento ghiacciato con texture scivolosa.
- **Tile corridoio con fuoco (Mondo 6 / Pareti di Fuoco):** Pavimento con fiamme che salgono dai bordi.
- **Tile corridoio con traccia (Mondo 7):** Pavimento con scia luminosa lasciata da PAC.

**TILE SPECIALI:**
- **Tile ghost house centro:** Il pavimento interno della ghost house (visivamente diverso, più scuro, con il logo della GRID al centro).
- **Tile ghost house porta:** La porta della ghost house (una linea orizzontale di colore diverso che i fantasmi attraversano ma PAC no).
- **Tile tunnel warp ingresso/uscita:** Con freccia direzionale ai bordi dello schermo.
- **Tile portale warp (mondi avanzati):** Cerchio luminoso pulsante.
- **Tile sensore movimento (mondi avanzati):** Reticolo rosso sul pavimento.
- **Tile checkpoint (invisibile in gioco normale):** Visibile solo nella mappa overlay.
- **Tile stanza nascosta ingresso:** Visivamente identica a un muro solido ma con una differenza sub-pixel (micro-crack che il giocatore attento nota).

### Rendering dei Muri: Il Sistema di Auto-Tiling

Per evitare di dover piazzare manualmente ogni variante di tile muro (bordi, angoli, ecc.), il motore usa un sistema di **auto-tiling**.

**Come funziona:**
1. Il level designer (o il generatore procedurale) definisce solo se ogni tile è MURO o CORRIDOIO.
2. All'avvio del livello, il sistema controlla ogni tile muro e guarda le 8 tile adiacenti (N, NE, E, SE, S, SW, W, NW).
3. In base alla combinazione di vicini muro/corridoio, seleziona automaticamente la variante grafica corretta (bordo, angolo, centro, ecc.).
4. Il sistema usa una lookup table di 256 possibili configurazioni (2^8 adiacenti) mappa su varianti grafiche.

**Vantaggi dell'auto-tiling:**
- Il level design è rapidissimo (solo 0/1 per ogni tile).
- I muri sembrano sempre "giusti" visivamente senza intervento manuale.
- Cambiare il set visivo di un mondo richiede solo sostituire le texture — la logica rimane identica.

**Implementazione tecnica:**
```
// Pseudo-codice per auto-tiling
for each tile (x, y) in labirinto:
    if tile[x][y] == MURO:
        bitmask = 0
        if tile[x][y-1] == MURO: bitmask |= 1   // Nord
        if tile[x+1][y] == MURO: bitmask |= 2   // Est
        if tile[x][y+1] == MURO: bitmask |= 4   // Sud
        if tile[x-1][y] == MURO: bitmask |= 8   // Ovest
        tile_sprite[x][y] = autotile_lookup[bitmask]
```

---

## 8.6 — EFFETTI VISIVI E PARTICELLE

Il sistema particellare di ULTRA PAC: REBORN è uno degli elementi visivi più importanti. Le particelle aggiungono vita, reattività e spettacolarità a ogni azione.

### Sistema Particellare: Architettura

Il sistema particelle usa un **pool di oggetti** (object pooling) per evitare allocazioni di memoria runtime:

- **Pool dimensione:** 2000 particelle attive massime contemporaneamente (configurabile nelle opzioni grafiche: 500 / 1000 / 2000 / 4000).
- **Quando tutte le particelle del pool sono in uso:** Le particelle più vecchie vengono riciclate (le prime create sono le prime eliminate, sistema FIFO).
- **Ogni particella ha:** Posizione (x, y), Velocità (vx, vy), Colore (RGBA), Scala (dimensione), Vita (durata in secondi), Tipo (sprite o cerchio solido).

### Effetti Particellari — Catalogo Completo

**RACCOLTA PELLET STANDARD:**
- 3 particelle bianche
- Vita: 0.3 secondi
- Velocità: 50-100 pixel/sec in direzioni casuali
- Scala: da 3x3 a 1x1 (dissolvenza in uscita)
- Forma: cerchio solido

**RACCOLTA PELLET DORATO:**
- 8 particelle dorate (#FFD700)
- Vita: 0.6 secondi
- Velocità: 80-150 pixel/sec, distribuzione a stella (angoli fissi ogni 45°)
- Scala: da 4x4 a 1x1
- Forma: stella a 4 punte (sprite)

**RACCOLTA POWER PELLET:**
- 20 particelle del colore del power pellet
- Vita: 0.8 secondi
- Velocità: 100-200 pixel/sec, esplosione circolare
- Scala: da 6x6 a 1x1
- Forma: cerchio con glow

**MANGIARE UN FANTASMA:**
- 30 particelle del colore del fantasma mangiato
- Vita: 0.5 secondi
- Velocità: 200-350 pixel/sec, esplosione irregolare
- Un'onda espansiva circolare (sprite, non particelle): cerchio che si espande da 0 a 64 pixel di raggio in 0.4 secondi, poi svanisce
- Numero che appare sopra il punto di impatto (200/400/800/1600) — testo in font arcade che si muove verso l'alto di 20 pixel poi svanisce in 1 secondo

**ATTIVAZIONE POWER-UP:**
- Dipende dal tipo di power-up
- **Speed Rush:** 15 particelle rosse che escono da PAC verso dietro (scia)
- **Shield Bubble:** 12 particelle azzurre che orbitano attorno a PAC in espansione centrifuga
- **Fire Form:** 25 particelle arancione-rosse, forma di esplosione con particelle che salgono verso l'alto
- **Ice Form:** 20 particelle azzurro-bianche, pattern "cristallo" che si espandono in raggi retti
- **Shadow Form:** 10 particelle viola che si dissolvono verso l'interno (anti-esplosione)
- **Giant Form:** 30 particelle dorate che si espandono in cerchio poi si dissolvono
- **Omega Form:** 50 particelle dorate + 10 stelle sprite + onda circolare doppia

**DASH DI PAC:**
- 3 "ghost frame" di PAC: copie semitrasparenti (alpha 40%, 20%, 5%) dello sprite di PAC nelle ultime 3 posizioni del dash
- Vita: 0.3 secondi (dissolvenza lineare)
- Più 5 particelle del colore attuale di PAC nella scia

**MORTE DI PAC:**
- La sequenza di morte è principalmente sprite animation, non particelle
- Ma nella fase finale (l'esplosione): 40 particelle gialle in tutte le direzioni
- Vita: 0.8-1.2 secondi (variabile)
- Velocità: 100-400 pixel/sec (variabile, simula un'esplosione)
- Scala: da 5x5 a 0 (dissolvenza in uscita con gravità digitale: le particelle in basso rallentano, quelle in alto accelerano)

**PARRY PERFETTO:**
- 1 onda circolare bianca espansiva (da 0 a 80 pixel di raggio in 0.3 secondi)
- 20 particelle dorate a stella
- Un flash bianco sull'intero schermo (alpha da 60% a 0% in 0.2 secondi)

**BOSS MORTE:**
- 100+ particelle del colore del boss
- Un'onda espansiva tripla (3 cerchi concentrici che si espandono in sequenza con 0.1 secondi di ritardo tra loro)
- Effetto di "dissoluzione": il boss non scompare di colpo ma si frammenta in blocchi sempre più piccoli che si disperdono (animazione sprite di 12 frame)
- Flash dello schermo (alpha 80% per 0.1 secondi)

**COMBO ALTO (50+):**
- Effetto continuo: particelle arcobaleno che escono da PAC ogni 0.2 secondi durante una combo attiva
- 3-5 particelle per ciclo
- Vita: 0.5 secondi
- Colore: cambia continuamente (ciclo HSV con H che aumenta di 10° ogni frame)

**COMBO BREAK:**
- 5 particelle grigio-bianche che cadono dal numero combo verso il basso
- Il numero combo "si spacca" in 4 pezzi che cadono

**LEVEL COMPLETE:**
- 50 particelle multicolori esplose dal centro dello schermo
- Effetto "confetti": particelle a forma di rettangolino che ruotano durante la caduta
- Durata: 2 secondi
- Colori: random tra i colori del mondo corrente

**SEGRETO SCOPERTO:**
- Un lampo di luce dorata
- 15 stelle sprite che si espandono dal punto del segreto
- Suono + effetto particelle del testo "SEGRETO!" che appare e svanisce

### Effetti di Post-Processing (Filtri Globali)

Questi effetti sono applicati sull'intero frame renderizzato, dopo il rendering della scena.

**BLOOM:**
- I pixel di luminosità > 200/255 "sbordano" leggermente attorno a loro
- Raggio di bloom: 8 pixel
- Intensità: 0.6 (configurabile in opzioni)
- Applicato a: PAC, power pellet, muri neon, particelle luminose

**VIGNETTE:**
- I bordi dello schermo sono leggermente più scuri del centro
- Raggio della vignette: parte a 70% dello schermo dal centro
- Intensità: 0.4

**CHROMATIC ABERRATION (solo Mondo 3 e durante alcune boss fight):**
- I canali RGB dell'immagine sono sfasati di 1-3 pixel
- Crea l'effetto di un monitor degradato
- Intensità variabile (più forte durante i Glitch Events)

**SCANLINES (solo Mondo 3):**
- Overlay di linee nere semi-trasparenti orizzontali ogni 2 pixel
- Alpha: 30%
- Disabilitabile nelle opzioni accessibilità

**SHAKE DELLA CAMERA (durante hit e boss fight):**
- Descritto in dettaglio nella sezione 12.5 (Sistema Camera)
- Intensità variabile: 2 pixel (hit normale) / 5 pixel (boss colpito) / 10 pixel (boss morto)

---

## 8.7 — INTERFACCIA UTENTE (HUD)

L'HUD (Heads-Up Display) è l'interfaccia visiva sovrapposta al gioco durante il gameplay. Deve essere chiaro, leggibile, e non intrusivo.

### Layout HUD — Posizionamento

L'HUD occupa una fascia di 200 pixel di altezza nella parte superiore dello schermo (a 1920×1080). Il labirinto è posizionato sotto questa fascia.

**Zona HUD Sinistra (0-640 pixel):**
- Vite rimaste (icone di PAC in miniatura)
- Barra HP (da Mondo 6 in poi)
- Nome del livello corrente

**Zona HUD Centro (641-1280 pixel):**
- Punteggio corrente (grandi, prominente)
- Moltiplicatore combo (numero colorato che pulsa)
- Contatore combo (numero più piccolo sotto il moltiplicatore)

**Zona HUD Destra (1281-1920 pixel):**
- Slot inventario power-up (4 icone)
- Barra Fame (se abilitata)
- Barra Adrenalina
- Tempo del livello corrente

**Zona HUD Inferiore (ultimi 40 pixel in basso):**
- Barra di avanzamento del livello (indica % di pellet raccolti)
- Micro-mappa del labirinto (solo se l'opzione è abilitata nelle impostazioni)

### Elementi HUD: Specifiche Dettagliate

**PUNTEGGIO:**
- Font: "PacPixel" (font custom stile arcade con pixel art) — vedere sezione 8.8 per specifiche font
- Dimensione: 48pt
- Colore: Bianco (#FFFFFF) con ombra nera 2px
- Animazione: ogni volta che il punteggio aumenta, i numeri "rollano" verso l'alto (transizione da vecchio valore a nuovo valore in 0.3 secondi con effetto slot machine)
- Posizione: centro-HUD, in alto

**MOLTIPLICATORE COMBO:**
- Font: "PacPixel" bold
- Dimensione: 64pt (più grande del punteggio per enfasi)
- Colore: varia con il livello combo (vedi tabella sezione 3.6: bianco, verde, azzurro, viola, oro, arancione, arcobaleno)
- Animazione: pulsa in scala (da 100% a 115% e ritorno in 0.4 secondi) quando aumenta di livello; si "spezza" visivamente (animazione di 4 frame) quando si resetta
- Posizione: centro-HUD, grande e prominente

**VITE:**
- Rappresentate come mini-sprite di PAC (16×16 pixel) con glow giallo
- Disposte orizzontalmente, spaziatura 24 pixel tra loro
- Quando una vita viene persa: l'icona più a destra "scompare" con una piccola animazione di dissoluzione (0.3 secondi)
- Quando una vita viene guadagnata: una nuova icona appare a destra con un flash dorato e l'animazione "1UP" sopra
- Posizione: zona HUD sinistra, in basso

**BARRA HP (Mondo 6+):**
- 3 cuori pixel art (16×16 pixel ciascuno)
- Cuore pieno: rosso brillante (#FF0000)
- Cuore mezzo: rosso sbiadito + pattern tratteggiato (#800000 con trattini)
- Cuore vuoto: grigio scuro (#333333) con bordo rosso
- Quando un HP viene perso: il cuore "pulsa" verso il basso di 4 pixel e risale in 0.3 secondi
- Posizione: zona HUD sinistra, sopra le vite

**SLOT POWER-UP:**
- 4 riquadri (32×32 pixel ciascuno + 4px bordo)
- Slot 1 e 2 (attivi): bordo giallo (#FFD700), dimensione effettiva 40×40px
- Slot 3 e 4 (riserva): bordo grigio (#888888), dimensione effettiva 32×32px
- L'icona del power-up è centrata nel riquadro
- Il timer del power-up appare come arco circolare attorno al riquadro (stile "radial timer"): arco completo = pieno; arco che scompare = timer quasi esaurito
- Quando un power-up sta per scadere (<3 secondi): l'arco diventa rosso e il riquadro lampeggia
- Posizione: zona HUD destra

**BARRA FAME:**
- Striscia orizzontale di 160×12 pixel
- Colore: gradiente da giallo (#FFD700) a arancione (#FF8C00) — sempre lo stesso, è il livello che cambia
- Livello: si svuota da destra a sinistra
- A <25%: la barra lampeggia e aggiunge una texture di "tremolio"
- A 0%: la barra è completamente vuota, PAC emana un'aura grigia
- Icona a sinistra: piccola bocca aperta (PAC stilizzato) che "muore di fame" a <25%
- Posizione: zona HUD destra, sotto gli slot power-up

**BARRA ADRENALINA:**
- Come la barra Fame ma sopra di essa
- Colore: gradiente da rosso (#FF0000) a rosso brillante (#FF4500)
- Quando è piena (100%): la barra "brilla" con un effetto pulsante di glow
- Icona a sinistra: fulmine stilizzato
- Posizione: zona HUD destra, sopra la barra Fame

**BARRA AVANZAMENTO LIVELLO:**
- Striscia sottile (tutta la larghezza dello schermo × 8 pixel) nella fascia inferiore
- Colore: gradiente dal colore primario del mondo (vuota = scuro, piena = brillante)
- Rappresenta la percentuale di pellet raccolti
- A 100%: la barra si riempie completamente e lampeggia per 1 secondo prima di passare alla schermata di completamento livello

---

## 8.8 — SCHERMATE DI MENU E UI

### Schermata Titolo

**Layout:**
- Sfondo: Animazione del labirinto del Mondo 1 in loop (il labirinto "vive" — i fantasmi si muovono nel labirinto, ma lentamente e in modo pacifico, nessun pericolo)
- Centro-schermo: Logo "ULTRA PAC: REBORN" in pixel art grande (circa 400×150 pixel)
- Sotto il logo: "Premi START / ENTER per iniziare" — testo che lampeggia lentamente
- In basso a destra: numero versione e copyright
- In basso a sinistra: "Sviluppato con ❤ da [Nome Studio]"

**Animazione del Logo:**
- Il logo appare con un'animazione di "costruzione": i pixel appaiono uno per uno da sinistra a destra in 1.5 secondi
- Poi il logo "pulsa" una volta (scala da 100% a 110% e ritorno in 0.5 secondi)
- Poi rimane stabile con un leggero glow che pulsa ogni 3 secondi

**Musica Titolo:** "WELCOME TO THE GRID" — una traccia synthwave melodica di 2 minuti in loop, con riferimenti sonori al jingle originale di Pac-Man inseriti subtilmente.

### Menu Principale

Accessibile dopo la schermata titolo.

**Opzioni del Menu:**
1. NUOVA PARTITA
2. CONTINUA (grigio se non esiste un save)
3. MODALITÀ DI GIOCO
4. OPZIONI
5. GALLERIA
6. CLASSIFICA
7. ESCI

**Stile delle Voci di Menu:**
- Font "PacPixel" 36pt
- Colore default: bianco (#FFFFFF)
- Colore selezionato: giallo (#FFD700) con glow giallo
- Cursore: mini-PAC (16×16 pixel) che "cammina" a sinistra della voce selezionata
- Transizione tra voci: il mini-PAC "cammina" da una voce all'altra in 0.15 secondi (non appare istantaneamente)

### Menu Pausa

**Layout:**
- Semi-overlay sull'area di gioco (lo sfondo del gioco rimane visibile ma oscurato al 60%)
- Riquadro centrale (400×500 pixel) con sfondo nero a 80% opacity
- Titolo "PAUSA" in alto al riquadro
- Statistiche del livello corrente: tempo trascorso, pellet raccolti/totali, punteggio
- Opzioni: RIPRENDI / OPZIONI / RIAVVIA LIVELLO / TORNA AL MENU

**Nota:** RIAVVIA LIVELLO resetta il livello corrente a 0 pellet, 3 vite, nessun power-up. Chiede conferma prima di procedere.

### Schermata Fine Livello

**Layout:**
- Overlay che si sovrappone gradualmente (fade-in in 0.5 secondi)
- "LIVELLO COMPLETATO!" in grandi lettere gialle con esplosione di particelle
- Sotto: griglia di statistiche

**Statistiche Mostrate:**
- Pellet raccolti: X/Y (con stellina se 100%)
- Tempo: MM:SS (con stellina se sotto il tempo target)
- Vite perse nel livello: X
- Punteggio del livello
- Bonus velocità
- Bonus perfezione (se nessuna vita persa)
- Punteggio totale progressivo
- Segreti trovati nel livello: X/Y

**Valutazione:**
- S: tutto perfetto (100% pellet, 0 vite perse, tempo record, tutti i segreti)
- A: 95%+ pellet, 0-1 vita persa, tempo buono
- B: 80%+ pellet, 0-2 vite perse
- C: 60%+ pellet
- D: completato ma sotto il 60%

### Galleria

La Galleria è un menu che raccoglie tutto il contenuto sbloccabile e trovato durante il gioco.

**Sezioni della Galleria:**
- ARTWORK: Illustrazioni dei personaggi sbloccabili completando missioni
- LOG DI AOYAMA: I 35 messaggi del dottore, leggibili con testo e audio
- BESTIARI: Schede di ogni nemico trovato (sbloccate la prima volta che si incontra ogni nemico)
- MUSICA: Le tracce musicali sbloccate (ascoltabili con visualizzatore audio)
- STATISTICHE: Dati di gioco totali (tempo totale, pellet mangiati, fantasmi distrutti, morti totali, etc.)
- CUTSCENE: Rivisione di tutte le cutscene già viste
- COSTUMI: Skin di PAC sbloccate

---

## 8.9 — ANIMAZIONI E FRAME-BY-FRAME

Questa sezione descrive in dettaglio le specifiche di animazione per ogni personaggio principale.

### Specifiche Tecniche Generali

- **Frame rate delle animazioni:** 12 FPS (default per sprite piccoli), 24 FPS (per boss e cutscene)
- **Sistema di animazione:** Sprite sheet + state machine. Ogni personaggio ha una sprite sheet con tutte le sue animazioni disposte in righe (una animazione per riga).
- **Transizioni tra stati:** Le transizioni tra animazioni sono immediate (nessun blending — è pixel art, il cambio è istantaneo).

### PAC — Sprite Sheet Specifica

**Dimensione sprite sheet:** 256×512 pixel (ogni sprite 32×32, 8 colonne, 16 righe)

**Riga 1 — IDLE (4 frame):** PAC con bocca leggermente aperta (45°), leggero oscillazione verticale
**Riga 2 — MOVE_RIGHT (8 frame):** Bocca che si apre/chiude completamente, movimento verso destra
**Riga 3 — MOVE_LEFT (8 frame):** Come MOVE_RIGHT ma specchiato
**Riga 4 — MOVE_UP (8 frame):** Come MOVE_RIGHT ma ruotato 90° in senso antiorario
**Riga 5 — MOVE_DOWN (8 frame):** Come MOVE_RIGHT ma ruotato 90° in senso orario
**Riga 6 — DASH (5 frame + 3 ghost frame):** Compressione → allungamento → ripristino
**Riga 7 — DEATH (12 frame):** Apertura totale → collasso → esplosione
**Riga 8 — EAT_GHOST (6 frame):** Bocca a 360° → chiusura rapida
**Riga 9 — POWER_ACTIVATION (4 frame):** Flash di attivazione
**Riga 10 — HURT (6 frame):** PAC che "trema" e lampeggia rosso
**Riga 11 — INVINCIBLE (6 frame):** PAC che lampeggia bianco-giallo (usato durante l'invincibilità post-respawn)
**Riga 12-16 — FORME POWER-UP:** Una riga per forma (Fire, Ice, Shadow, Giant, Omega) — 6 frame ciascuna per il ciclo idle della forma

### BLINKY — Sprite Sheet Specifica

**Dimensione sprite sheet:** 128×256 pixel (ogni sprite 32×32, 4 colonne, 8 righe)

**Riga 1 — MOVE_RIGHT (4 frame):** Il corpo si deforma leggermente nella direzione del movimento (compressione sul lato posteriore, allungamento sul lato anteriore)
**Riga 2 — MOVE_LEFT (4 frame):** Specchiato
**Riga 3 — MOVE_UP (4 frame):** Ruotato
**Riga 4 — MOVE_DOWN (4 frame):** Ruotato
**Riga 5 — FRIGHTENED (4 frame):** Blinky blu con puntini bianchi lampeggianti
**Riga 6 — FRIGHTENED_ENDING (4 frame):** Lampeggio tra blu e rosso (ultimi 2 secondi)
**Riga 7 — EYES (2 frame):** Solo gli occhi, 2 frame di leggero oscillazione
**Riga 8 — RAGE (4 frame):** Come MOVE ma con colore modificato e corpo leggermente più grande

### PINKY — Sprite Sheet Specifica

**Dimensione sprite sheet:** 128×256 pixel

**Riga 1-4 — MOVE (direzioni, 4 frame ciascuna):** Come Blinky ma con forma più arrotondata
**Riga 5 — FRIGHTENED (4 frame)**
**Riga 6 — FRIGHTENED_ENDING (4 frame)**
**Riga 7 — EYES (2 frame)**
**Riga 8 — CRYING (6 frame):** Animazione speciale di Pinky che piange (usata nelle cutscene e occasionalmente durante il gameplay)

### INKY — Sprite Sheet Specifica

**Dimensione sprite sheet:** 256×256 pixel (sprite più grande per la frammentazione)

Inky richiede sprite aggiuntivi:
- **Sprite interi (32×32):** Movimento nelle 4 direzioni, 4 frame ciascuno
- **Sprite frammento 50% (16×16):** 2 varianti di frammento per mostrare la frammentazione
- **Sprite frammento 25% (8×8):** Per la frammentazione al livello massimo
- **Phase shift overlay:** Sprite semitrasparente per quando Inky attraversa i muri

### CLYDE — Sprite Sheet Specifica

**Dimensione sprite sheet:** 160×256 pixel (sprite 40×40 — Clyde è più grande)

**Riga 1-4 — MOVE (direzioni, 4 frame ciascuna):** Movimento più lento e "pesante" rispetto agli altri
**Riga 5 — FRIGHTENED (4 frame)**
**Riga 6 — FRIGHTENED_ENDING (4 frame)**
**Riga 7 — EYES (2 frame)**
**Riga 8 — WISDOM (4 frame):** Animazione di Clyde che "riflette" (usata nelle cutscene quando parla)

### Boss — Note Generali sulle Animazioni

I boss hanno sprite sheet molto più grandi e animate. Come regola generale:
- **Sprite base dei boss:** 64×64 pixel (Blinky Prime, Pinky Witch) / 80×80 pixel (Clyde the Titan) / variabile (Inky the Void)
- **Frame rate:** 24 FPS per tutte le animazioni dei boss
- **Transizioni di fase:** Ogni transizione di fase ha una sequenza di animazione dedicata di 2-3 secondi

**Struttura sprite sheet generica per ogni boss:**
- Riga 1: IDLE (8 frame — il boss "respira" o pulsa leggermente)
- Riga 2-5: Attacchi di Fase 1 (una riga per attacco, numero frame variabile)
- Riga 6-9: Attacchi di Fase 2
- Riga 10-13: Attacchi di Fase 3
- Riga 14-17: Attacchi di Fase 4 / FRENZY
- Riga 18: HURT (4 frame — quando il boss riceve danno)
- Riga 19: DEATH (12 frame — animazione di morte del boss)
- Riga 20: TRANSITION (8 frame — transizione tra le fasi)

---

## 8.10 — RISOLUZIONE, ASPECT RATIO E RENDERING

### Risoluzione Interna e Upscaling

Il gioco funziona con una **risoluzione interna di 480×270 pixel** — un quarto di 1920×1080. Questo permette di ottenere un look pixel art autentico senza aliasing.

**Perché 480×270?**
- È esattamente 1/4 di 1920×1080 (16:9)
- È esattamente 1/2 di 960×540
- Permette upscaling con fattori interi (×2, ×3, ×4) — nessun blur da interpolazione bilineare
- A 480×270, ogni tile di 16×16 pixel occupa circa 1% dello schermo, dando proporzioni visive classiche

**Scaling:**
- Da 480×270 a 1920×1080: ×4 scaling (pixel perfetto)
- Da 480×270 a 1280×720: ×2.66... (non intero — usare ×2 con letterbox oppure 480p con bordi)
- Da 480×270 a 2560×1440 (2K): ×5.3... — usare ×5 con bordi sottili o sistema di upscaling

**Algoritmo di upscaling:**
- Default: **nearest neighbor** (pixel perfetti, look autentico pixel art)
- Opzione alternativa: **Scale2x** (algoritmo che "smussisce" le diagonali mantenendo l'estetica pixel art — meno grezzo ma ancora riconoscibile come pixel art)
- Opzione alta qualità: **xBRZ** (algoritmo avanzato di upscaling pixel art — ottimo risultato ma più costoso computazionalmente)

### Aspect Ratio e Letterbox

Il gioco è nativamente 16:9. Su schermi con aspect ratio diversi:

- **16:10 (es. 1920×1200):** Letterbox orizzontale (barre nere sopra e sotto)
- **4:3 (es. 1024×768):** Letterbox orizzontale (barre nere spesse)
- **21:9 Ultrawide:** Pillarbox (barre nere ai lati) oppure opzione "stretched" nelle impostazioni
- **Mobile Portrait:** Il gioco ruota di 90° e presenta una versione adattata dell'HUD per schermi portrait

**Nota sugli ultrawide:** Opzionalmente, il gioco può mostrare il labirinto allargato in 21:9 rivelando più del labirinto ai lati. Questa è un'opzione nelle impostazioni (ON/OFF) — utile per alcuni giocatori, può dare vantaggio visivo.

### Pipeline di Rendering

**Step 1 — Scene Rendering a 480×270:**
Tutto viene renderizzato nella risoluzione interna: labirinto, personaggi, nemici, particelle, HUD.

**Step 2 — Post-Processing:**
I filtri (bloom, vignette, scanline, chromatic aberration) vengono applicati sull'immagine 480×270.

**Step 3 — Upscaling:**
L'immagine viene scalata alla risoluzione del monitor con l'algoritmo selezionato.

**Step 4 — HUD di Alta Qualità (opzionale):**
I testi dell'HUD vengono renderizzati direttamente alla risoluzione nativa del monitor (non a 480×270) per massima leggibilità. Questo è configurabile — alcuni giocatori preferiscono tutto in pixel art anche i testi.

---

# PARTE IX — AUDIO E MUSICA

---

## 9.0 — FILOSOFIA AUDIO

L'audio di ULTRA PAC: REBORN è considerato un sistema di gioco in sé — non un ornamento, ma un pilastro dell'esperienza.

**Principio 1: L'Audio Come Informazione**
Ogni suono nel gioco trasmette informazioni tatticamente utili. Il giocatore esperto può "sentire" cosa sta succedendo fuori campo: il ritmo dei passi di un fantasma che si avvicina, il suono di un power-up raro che è apparso, l'avviso sonoro di un Glitch Event imminente. Il gioco può essere giocato (non perfettamente, ma sufficientemente) anche senza visione, basandosi solo sull'audio.

**Principio 2: La Musica Come Dinamica**
La musica non è un loop statico di sottofondo. Si adatta al gioco in tempo reale: la sua complessità cresce con i pellet raccolti, il suo ritmo cambia durante le boss fight, le sue armonie riflettono lo stato emotivo del livello. Un giocatore che ascolta la musica può capire a che punto è del livello solo dal suono.

**Principio 3: Il Suono Come Ricompensa**
I suoni più soddisfacenti del gioco sono associati alle azioni più soddisfacenti: il "crunch" di una combo altissima, l'esplosione sonora di un boss sconfitto, il coro di un power-up Omega Form. Il design audio premia il giocatore con feedback sonori di qualità crescente man mano che le sue azioni migliorano.

**Principio 4: La Coerenza Tematica**
Ogni mondo ha un identità sonora riconoscibile che va oltre la musica: i suoni ambientali, gli effetti di raccolta pellet, persino i suoni dei passi di PAC cambiano in base al mondo. Nel Mondo 2 le Candy Caverns, raccogliere un pellet fa un suono di "crick" cristallino di caramella. Nel Mondo 6 Cyber Hell, fa un suono di fuoco digitale.

---

## 9.1 — COLONNA SONORA — TRACCE PER MONDO

La colonna sonora è composta da **42 tracce originali**. Di seguito le specifiche per ogni traccia.

### Tracce Generali (Non-Mondiali)

**TRACK 01 — "WELCOME TO THE GRID"** (Menu Principale)
- Stile: Synthwave melodico
- BPM: 95
- Durata: 2:30 (loop senza interruzione)
- Strumenti principali: Synth pad, arpeggiatore, bassline morbida, batteria leggera
- Elemento di nostalgia: La melodia incorpora il tema originale di Pac-Man come frase di 4 note ogni 32 battute
- Tonalità: La minore
- Descrizione: Apre con un synth pad caldo, poi l'arpeggiatore costruisce la melodia. Atmosfera di "benvenuto in un mondo familiare ma nuovo."

**TRACK 02 — "HALL OF REST"** (Sala di riposo tra livelli)
- Stile: Ambient synthwave
- BPM: 70
- Durata: 3:00 (loop)
- Strumenti: Pad ambientale, note singole di piano elettrico, suoni di risonanza
- Caratteristica: Si trasforma lentamente verso il tema del prossimo mondo man mano che ci si avvicina all'uscita della sala

**TRACK 03 — "GAME OVER"** (Schermata Game Over)
- Stile: Blues digitale
- BPM: 60
- Durata: 0:30 (una sola volta, poi silenzio)
- Il tema originale di Pac-Man game over viene reinterpretato in synthwave malinconico

**TRACK 04 — "VICTORY"** (Fine Livello — valutazione S/A)
- Stile: Fanfara synthwave
- BPM: 130
- Durata: 0:20 (jingle)

**TRACK 05 — "GOOD JOB"** (Fine Livello — valutazione B/C)
- Stile: Synth jingle più sobrio
- Durata: 0:15

### Tracce Mondo 1 — Neon City

**TRACK 06 — "GRID AWAKENING"** (Livelli normali Mondo 1)
- Stile: Synthwave electro
- BPM: 120 (batteria entra al 50% pellet, lead synth al 90%)
- Durata: 4:00 (loop)
- Strumenti: Synth portante, batteria elettronica, basso acid, campanelle neon
- Struttura dinamica a livelli:
  - Layer 0 (0-25% pellet): Solo arpeggiatore + basso sottile
  - Layer 1 (26-50%): + batteria leggera
  - Layer 2 (51-75%): + basso acid più prominente
  - Layer 3 (76-90%): + lead synth melody
  - Layer 4 (91-100%): + strato di archi sintetici per tensione finale
- Tonalità: Do minore

**TRACK 07 — "PRIME HUNT"** (Boss Blinky Prime)
- Stile: Synthwave pesante con influenze metal
- BPM: 150 (aumenta a 165 nella fase 4)
- Durata: 6:00 (loop che copre tutte le fasi)
- Strumenti: Synth di piombo aggressivo, batteria molto pesante, basso distorto, pad oscuri
- Transizione di fase: Al cambio di fase, la musica "salta" alla sezione successiva della traccia (non è un loop ripetuto ma una composizione continua)

**TRACK 08 — "NEON REQUIEM"** (Cutscene CS11 — morte di Blinky Prime)
- Stile: Ambient triste
- BPM: 50
- Durata: 1:30 (una sola volta)

### Tracce Mondo 2 — Candy Caverns

**TRACK 09 — "SUGAR CORRUPTION"** (Livelli normali Mondo 2)
- Stile: Dream pop sintetico con progressione verso dark synth
- BPM: 100 (scala a 115 al 75% pellet)
- Strumenti: Glockenspiel sintetico, bassi morbidi che si induriscono, voci filtrate, batteria che accelera
- Struttura: Inizia come ninna nanna, trasformazione percettibile attorno al 60% dei pellet

**TRACK 10 — "SWEET SORROW"** (Boss Pinky Witch)
- Stile: Ballad epica con crescendo orchestrale sintetico
- BPM: 80 (cresce fino a 140 nella fase 4)
- Caratteristica: La melodia principale è la stessa della ninna nanna di Mondo 2 ma armonizzata in modo sempre più oscuro nelle fasi successive

**TRACK 11 — "PINKY'S LAMENT"** (Cutscene CS05 — Pinky dopo la sconfitta)
- Stile: Piano solo (sintetico ma molto espressivo)
- BPM: 40
- Durata: 1:00

### Tracce Mondo 3 — Glitch Dimension

**TRACK 12 — "SYSTEM FAILURE"** (Livelli normali Mondo 3)
- Stile: Chiptune NES glitchato
- BPM: 140 con interruzioni ritmiche irregolari (il beat "salta" ogni 15-30 secondi)
- Strumenti: Synth wave NES, noise channel, pulse wave, suoni di glitch digitale integrati nella musica stessa
- Caratteristica unica: I glitch musicali (beat saltato, nota steccata, silenzio improvviso) coincidono ESATTAMENTE con i Glitch Events visivi

**TRACK 13 — "FRAGMENTED MIND"** (Boss Inky the Void)
- Stile: Ambient glitch + drum and bass frenetico
- BPM: variabile (60 → 180 → 60 → 180 alternato per fasi)
- Ogni fase ha uno stile musicale radicalmente diverso: ambient, DnB, silenzio totale, caos

### Tracce Mondo 4 — Haunted Labyrinth

**TRACK 14 — "DIGITAL REQUIEM"** (Livelli normali Mondo 4)
- Stile: Gothic synth + orchestral
- BPM: 80
- Strumenti: Organo sintetico, archi oscuri, timpani, campanile distante
- Struttura: La melodia principale è un canone (le stesse note suonate in ritardo da strumenti diversi) — questo crea un effetto di "eco" continuo

**TRACK 15 — "THE HUNT ETERNAL"** (Boss Blinky Prime, se si affronta una seconda volta in difficoltà Hard+)
- Stile: Come "PRIME HUNT" ma con arrangiamento orchestrale aggiunto
- BPM: 165 (già alla massima velocità dall'inizio)

### Tracce Mondo 5 — Crystal Void

**TRACK 16 — "PURE DATA"** (Livelli normali Mondo 5)
- Stile: Ambient cristallino minimale
- BPM: 60
- Strumenti: Cristallo synth (simula suono di bicchieri di cristallo), pad spaziali, note isolate di arpa elettronica
- Caratteristica: Musica più "rara" del gioco — molti silenzi, note singole che risuonano a lungo. Contrasto totale con le tracce ad alta intensità dei mondi precedenti.

**TRACK 17 — "TITAN'S DIRGE"** (Boss Clyde the Titan)
- Stile: Epic orchestral synthwave
- BPM: 100
- Strumenti: Ottoni sintetici, batteria epica, basso profondo, archi in crescendo
- Caratteristica: La musica si "cristallizza" progressivamente man mano che Clyde perde HP (effetti musicali che si induriscono, batteria più secca)

### Tracce Mondo 6 — Cyber Hell

**TRACK 18 — "THE BURNING GRID"** (Livelli normali Mondo 6)
- Stile: Industrial techno + metal sintetico
- BPM: 160
- Strumenti: Distorzione massima su tutto, batteria industriale, sintetizzatori che imitano chitarre, suoni di fuoco e esplosioni integrati nel ritmo
- Caratteristica: La traccia più aggressiva dell'intero gioco. Difficile da ascoltare a lungo — è intenzionale, crea urgenza.

**TRACK 19 — "CORRUPTED ORACLE"** (Boss The Corrupted Oracle)
- Stile: Ambient distorto + epic techno
- BPM: variabile (120 normale, 180 nelle fasi di alta intensità)
- La voce del Dottor Aoyama (distorta) viene campionata e usata come elemento musicale

### Tracce Mondo 7 — Origin Maze

**TRACK 20 — "THE ORIGINAL MAZE"** (Livello 7-1)
- Stile: Evoluzione continua attraverso tutti gli stili dei mondi precedenti
- Struttura: Ogni 5 minuti la musica transiziona verso il tema del mondo successivo (Neon → Candy → Glitch → Haunted → Crystal → Cyber → Origin)

**TRACK 21 — "END OF DATA"** (Livello 7-4, il livello silenzioso)
- Solo ambience: nessuna melodia, solo suoni dell'ambiente digitale

**TRACK 22 — "THE DEVOURER THEME"** (Boss Finale)
- Stile: Tutto simultaneamente — tutti gli stili musicali del gioco sovrapposti in un caos armonioso
- BPM: 200 nella fase finale
- Durata: 12 minuti (copre tutte e 4 le fasi della boss fight)
- Elemento speciale: Il tema originale di Pac-Man appare nella fase 4 in forma distorta e poi si "libera" nella sua forma originale pura nei secondi finali

---

## 9.2 — EFFETTI SONORI — CATALOGO COMPLETO

Gli effetti sonori sono divisi in categorie. Ogni effetto ha specifiche tecniche precise.

### Categoria A: Suoni di PAC

**PAC_STEP_1 attraverso PAC_STEP_8:**
Otto variazioni del suono del passo di PAC (piccolo "wak" digitale). Il gioco le cicla in sequenza (1→2→3→4→5→6→7→8→1...) per evitare la monotonia. Il pitch (altezza) di ogni variazione varia di ±3% casualmente per volta.
- Frequenza: 800-1200 Hz
- Durata: 0.05 secondi
- Volume: 60% del volume massimo degli effetti

**PAC_STEP_FAST_1 attraverso PAC_STEP_FAST_4:**
Come PAC_STEP ma con pitch più alto e durata più breve, usato quando la velocità di PAC supera il 130% della base.

**PAC_EAT_PELLET:**
Il classico "waka" di Pac-Man, reinterpretato. Un suono elettronico breve con tono che sale leggermente.
- Versione standard (mondo 1-3): "wak" elettronico puro
- Versione caramella (mondo 2): "crick" cristallino
- Versione glitch (mondo 3): "bzzt" digitale
- Versione pietra (mondo 4): "tok" ovattato
- Versione cristallo (mondo 5): "ting" risonante
- Versione fuoco (mondo 6): "fsst" con crackle
- Versione originale (mondo 7): tutti i suoni sovrapposti a volume molto basso

**PAC_EAT_POWER_PELLET:**
Suono più lungo e più potente. Un "WHAM" elettronico con riverbero.

**PAC_EAT_GHOST:**
- Una versione potenziata di PAC_EAT_PELLET
- + effetto di "succhio" (suono di qualcosa aspirato)
- + il numero (200/400/800/1600) appare sullo schermo con un suono di "pop"

**PAC_DASH:**
"Whoosh" sintetico di 0.2 secondi. Il pitch varia in base al power-up attivo:
- Normale: whoosh neutro
- Fire Form: whoosh con crackle di fuoco
- Ice Form: whoosh con tintinnio di cristallo
- Shadow Form: whoosh con riverbero oscuro (molto reverb, quasi impercettibile)

**PAC_DEATH:**
Sequenza di suoni:
1. Suono di "stop" (PAC si ferma): un breve "ugh" digitale
2. L'animazione di morte: il suono classico di morte di Pac-Man, reinterpretato in synthwave (descending chromatic scale in stile sintetico), durata 1.2 secondi
3. Flash: un crack silenzioso

**PAC_POWERUP_ACTIVATE (generico):**
Suono di power-up classico arcade, 0.5 secondi. Ogni power-up ha la sua variazione di questo suono base.

**PAC_HURT (hit senza morte — barra HP):**
Breve "ouch" digitale, molto corto (0.1 secondi). Bassa intensità per non sovraccaricare l'audio.

**PAC_COMBO_UP:**
Un breve "ping" ascendente ogni volta che il combo sale di livello.

**PAC_COMBO_BREAK:**
Un "crash" digitale discendente.

**PAC_PARRY:**
Suono metallico digitale, risonante, con lungo fade out. Il Parry Perfetto aggiunge un secondo "ring" una quinta sopra.

### Categoria B: Suoni dei Fantasmi

**GHOST_MOVE:**
Un sottile "fruscio" continuo per ogni fantasma in movimento. Molto basso nel mix — percettibile ma non dominante. Volume proporzionale alla distanza da PAC (più vicino = più forte).

**GHOST_FRIGHTENED:**
Il suono classico dei fantasmi in stato di paura (un ritmo pulsante di suoni bassi). Versione modernizzata.

**GHOST_EYES_MOVE:**
Il suono delle "occhiaie" che tornano alla ghost house. Un suono leggero di "vento" digitale.

**GHOST_RESPAWN:**
Un breve suono di "materializzazione" quando il fantasma riappare dalla ghost house.

**GHOST_ALERT (quando Blinky entra in Rage Mode):**
Un suono di allarme sintetico breve (0.5 secondi). Avvisa il giocatore.

**GHOST_PHASE_SHIFT (Inky):**
Un suono di distorsione quando Inky attraversa il muro. Come un effetto di "glitch" audio.

### Categoria C: Suoni dell'Interfaccia

**UI_MOVE:**
Il cursore si sposta tra le voci di menu. Breve "beep" digitale, 50ms.

**UI_SELECT:**
Selezione confermata. "Beep" più lungo e più alto, 100ms.

**UI_BACK:**
Torna indietro. "Beep" discendente, 80ms.

**UI_LEVEL_START:**
Jingle di 1 secondo che annuncia l'inizio del livello. Il jingle originale di Pac-Man "READY!" modernizzato.

**UI_LEVEL_COMPLETE:**
Fanfara di completamento livello (vedi TRACK 04/05).

**UI_EXTRA_LIFE:**
Il classico suono "1UP" di Pac-Man, reinterpretato in stile synthwave. Inconfondibile.

**UI_HIGH_SCORE:**
Un jingle speciale quando il giocatore supera il suo record personale.

**UI_SECRET_FOUND:**
Un suono di "rivelazione" — un arpegio ascendente di 4 note in 0.5 secondi.

### Categoria D: Suoni Ambientali

**AMB_NEON_CITY:**
Sottofondo ambientale del Mondo 1: hum di neon elettrici, lontano suono di città digitale, occasionale sirena distante.

**AMB_CANDY_CAVERNS:**
Sottofondo ambientale del Mondo 2: gocciolamento di caramella liquida, fruscio di zucchero cristallino, vento leggero nelle caverne.

**AMB_GLITCH_DIMENSION:**
Sottofondo ambientale del Mondo 3: statica elettronica, occasionali pop digitali, ronzio di monitor.

**AMB_HAUNTED_LABYRINTH:**
Sottofondo ambientale del Mondo 4: vento attraverso pietra, suono di campane lontane, fruscio di fantasmi nell'oscurità.

**AMB_CRYSTAL_VOID:**
Sottofondo ambientale del Mondo 5: risonanza cristallina continua (come un bicchiere sfregato), silenzio quasi totale con occasionali tintinnii.

**AMB_CYBER_HELL:**
Sottofondo ambientale del Mondo 6: crepitio di fuoco digitale, esplosioni lontane, strutture che crollano.

**AMB_ORIGIN_MAZE:**
Sottofondo ambientale del Mondo 7: sovrapposizione di tutti gli ambience precedenti a volume molto basso.

### Categoria E: Suoni dei Boss

Ogni boss ha una suite di 8-12 suoni dedicati per i suoi attacchi.

**BLINKY_PRIME — Suite Sonora:**
- BP_CHARGE_UP: accumulazione di energia prima del Neon Charge (suono di "carica")
- BP_CHARGE_RELEASE: il rilascio della carica (impatto e whoosh)
- BP_SPAWN_GHOST: quando invoca fantasmi normali (suono di materializzazione)
- BP_RAGE_TRANSITION: il suono della transizione di fase (molto drammatico)
- BP_HIT: quando riceve danno
- BP_DEATH: sequenza di morte di 2 secondi

**PINKY_WITCH — Suite Sonora:**
- PW_STAR_ORBIT: hum continuo delle stelle che orbitano
- PW_STAR_LAUNCH: quando lancia una stella
- PW_STAR_HIT_PAC: quando una stella colpisce PAC
- PW_TEAR_FALL: quando piange (suono cristallino di lacrime)
- PW_CLONE_APPEAR: materializzazione del clone
- PW_HIT / PW_DEATH

**CLYDE_TITAN — Suite Sonora:**
- CT_STEP: ogni passo di Clyde fa vibrare il pavimento (suono basso e pesante)
- CT_AURA: hum continuo del Slow Aura
- CT_CRYSTALLIZE: suono di cristallizzazione a ogni fase
- CT_HIT / CT_DEATH

**THE_DEVOURER — Suite Sonora:**
- TD_CONSUME: suono di assorbimento (massiccio e disturbante)
- TD_CORRUPT: suono di corruzione del labirinto
- TD_PHASE_TRANSITION: tra le 4 fasi (ogni transizione ha un suono diverso)
- TD_FINAL_WORDS: la voce del Dottor Aoyama
- TD_DEATH: il suono più lungo e spettacolare del gioco (5 secondi)

---

## 9.3 — VOCI E DOPPIAGGIO

Il gioco ha doppiaggio parziale: solo le cutscene principali e alcune frasi iconiche dei personaggi vengono doppiati. Tutto il resto è testo.

### Lingue di Doppiaggio

- **Italiano (lingua originale del progetto):** Doppiaggio completo per tutte le cutscene
- **Inglese:** Doppiaggio completo (localizzazione prioritaria per il mercato internazionale)
- **Giapponese:** Doppiaggio completo (omaggio alla storia di Pac-Man e al Dottor Aoyama)
- **Francese, Tedesco, Spagnolo, Portoghese:** Solo sottotitoli, nessun doppiaggio

### Cast di Voci

**PAC:** Non ha voce parlata — comunica attraverso suoni (un set di 12 suoni emotivi: gioia, paura, dolore, sorpresa, determinazione, ecc.) e espressioni dello sprite. I suoni di PAC sono vocalizzazioni brevi e neutre di genere, come "Hm!", "Ah!", "Ugh!", "Oh!" — tutti brevi (< 0.3 secondi).

**ECHO:** Voce calda, lenta, riflessiva. Parla lentamente e lascia pause. Leggermente androgina. Doppiata da un attore/attrice con esperienza in audio drama.

**BLINKY PRIME (doppiato solo in cutscene):** Voce profonda, tesa, con intensità costante. Nessuna sfumatura emotiva visibile — solo ossessione.

**PINKY WITCH (doppiata solo in cutscene):** Voce morbida, quasi sussurrata, con qualcosa di malinconico. Pronuncia lenta e pesante.

**INKY THE VOID (doppiato in cutscene):** Voce frammentata — l'attore doppia le frasi interrotte esattamente come compaiono nel testo. A volte due voci diverse (frammenti di sé) che si sovrappongono.

**CLYDE THE TITAN (doppiato in cutscene):** Voce bassa, compassata, riflessiva. Il personaggio più articolato — la sua voce deve trasmettere saggezza e tristezza.

**IL DOTTOR AOYAMA (solo log audio):** Voce anziana, giapponese-americana, stanca ma intensa. Doppiato in giapponese (con sottotitoli in tutte le lingue) per rispettare il background del personaggio.

**THE DEVOURER:** Voce sintetica, distorta, creata con effetti audio (non doppiaggio umano diretto). La fase finale usa la voce del Dottor Aoyama passata attraverso un vocoder estremo.

### Frasi Iconiche in-Gameplay (Brevi)

Oltre alle cutscene, alcuni personaggi pronunciano frasi brevissime durante il gameplay normale:

**Echo (apparizioni nei livelli):**
- "Attento." (quando un fantasma Elite si avvicina a PAC fuori campo)
- "Segreto vicino." (quando PAC è entro 3 tile di una stanza nascosta)
- "Bene." (dopo ogni boss sconfitto)

**Clyde (quando PAC entra nel suo raggio):**
- "Lo so già." (quando PAC si avvicina usando sempre lo stesso pattern)

---

## 9.4 — AUDIO PROCEDURALE E DINAMICO

### Il Sistema di Musica a Strati (Layered Music)

Ogni traccia musicale del gioco (eccetto le cutscene) è costruita come un set di strati (layer) separati che vengono attivati/disattivati in base allo stato del gioco.

**Struttura tecnica:**
- Ogni traccia è composta da 4-6 file audio identici in lunghezza (loop sincronizzato)
- Il motore audio sincronizza i layer al millisecondo in modo che si allineino perfettamente
- I layer vengono attivati/disattivati con un fade di 0.5 secondi (non bruschi) per evitare click audio
- La sincronizzazione garantisce che quando viene attivato un nuovo layer, parta sempre all'inizio della prossima battuta musicale (non nel mezzo) — questo richiede il calcolo di "next beat time" in base al BPM

**Trigger per l'attivazione dei layer:**

| Percentuale Pellet | Layer Attivati |
|-------------------|----------------|
| 0-25% | Layer 1 (base: basso + arpeggio) |
| 26-50% | + Layer 2 (batteria) |
| 51-75% | + Layer 3 (basso principale) |
| 76-90% | + Layer 4 (melodia principale) |
| 91-100% | + Layer 5 (archi/pad tensione) |

In aggiunta ai pellet, ci sono trigger speciali:
- Power Pellet attivo: aggiunge un layer di percussioni più intense per la durata del power-up
- Fantasma vicino (<3 tile): aggiunge un layer di tensione (nota di pericolo ripetuta)
- Combo > 50: aggiunge un layer melodico "eroico"
- Boss fase 3 o 4: aggiunge layer di intensità massima

### Il Sistema di Pitch-Shifting dei Passi

Il suono dei passi di PAC (PAC_STEP) viene modulato in pitch in base alla velocità attuale:
- Velocità base (3.5 tile/sec): pitch normale (100%)
- Velocità alta (5+ tile/sec): pitch +20%
- Velocità bassa (<2 tile/sec, solo con LT/L2): pitch -15%

Questo crea l'illusione che i passi siano fisicamente correlati alla velocità — più veloce, più acuto.

### Audio Spaziale per i Fantasmi

Il suono dei fantasmi (GHOST_MOVE) usa audio spaziale pseudo-stereo:
- Se un fantasma è a sinistra di PAC: il suo suono è nel canale sinistro
- Se è a destra: nel canale destro
- L'intensità è proporzionale all'inverso del quadrato della distanza (come la luce)
- Questo permette al giocatore di "sentire" un fantasma fuori schermo

**Implementazione tecnica (semplificata):**
```
per ogni fantasma:
    dx = fantasma.x - pac.x
    dy = fantasma.y - pac.y
    distanza = sqrt(dx*dx + dy*dy)
    volume = 1 / (distanza * distanza)  // attenuazione quadratica
    pan = dx / distanza                  // -1 (sinistra) a +1 (destra)
    play(GHOST_MOVE, volume=volume, pan=pan)
```

---

## 9.5 — PARAMETRI TECNICI AUDIO

**Sample Rate:** 44100 Hz (standard CD quality)
**Bit Depth:** 16 bit per la maggior parte degli effetti; 24 bit per la musica
**Canali:** Stereo per PC e Console; Mono per mobile (con downsample automatico)
**Formato File:** OGG Vorbis (compressione lossy) per musica — permette file più piccoli; WAV (non compresso) per effetti sonori brevi — evita artefatti di compressione nei suoni critici
**Latenza target:** < 20ms dall'evento di gioco all'output audio
**Mixer:** 32 canali simultanei (se un 33° suono viene attivato, il suono con volume più basso in quel momento viene interrotto)
**Bus Audio:**
- Bus MUSIC: Volume globale musica (controllo separato nelle opzioni)
- Bus SFX: Volume globale effetti (controllo separato)
- Bus VOICE: Volume doppiaggio (controllo separato)
- Bus MASTER: Volume generale (moltiplicatore su tutti i bus)

**Ducking:** Quando una voce di doppiaggio è attiva, il Bus MUSIC si riduce automaticamente del 30% con fade di 0.1 secondi; torna al 100% entro 0.3 secondi dalla fine della voce.

---

# PARTE X — SISTEMI DI PROGRESSIONE E META-GAME

---

## 10.0 — SISTEMA DI LIVELLAMENTO DEL PERSONAGGIO

PAC guadagna Punti Esperienza (XP) giocando. Accumulando abbastanza XP, sale di livello e guadagna Punti Abilità da spendere nell'Albero delle Abilità.

### Fonti di XP

| Fonte | XP Guadagnata |
|-------|--------------|
| Pellet standard raccolto | 1 XP |
| Pellet dorato raccolto | 5 XP |
| Pellet arcobaleno raccolto | 2 XP |
| Pellet fantasma raccolto | 10 XP |
| Power Pellet raccolto | 5 XP |
| Frutta bonus raccolta | 15-50 XP (dipende dal tipo) |
| Fantasma mangiato | 30 XP |
| Fantasma Elite mangiato | 75 XP |
| Boss Minore sconfitto | 200 XP |
| Boss Principale sconfitto | 500 XP |
| Livello completato con valutazione S | 150 XP bonus |
| Livello completato con valutazione A | 75 XP bonus |
| Segreto trovato | 50 XP |
| Spirito Dati raccolto | 100 XP |
| Log di Aoyama trovato | 40 XP |
| Missione secondaria completata | 100-300 XP (dipende dalla difficoltà) |

### Curva di Livellamento

I livelli seguono una curva esponenziale modificata:

| Livello | XP Necessaria (da livello precedente) | XP Totale Cumulativa |
|---------|--------------------------------------|---------------------|
| 2 | 500 | 500 |
| 3 | 750 | 1.250 |
| 4 | 1.000 | 2.250 |
| 5 | 1.250 | 3.500 |
| 6 | 1.600 | 5.100 |
| 7 | 2.000 | 7.100 |
| 8 | 2.500 | 9.600 |
| 9 | 3.000 | 12.600 |
| 10 | 4.000 | 16.600 |
| 15 | 7.000 | ~50.000 |
| 20 | 12.000 | ~110.000 |
| 25 | 20.000 | ~210.000 |
| 30 | 30.000 | ~360.000 |
| 35 | 45.000 | ~580.000 |
| 40 | 65.000 | ~890.000 |
| 50 (MAX) | 100.000 | ~1.500.000 |

**Nota:** Il livello massimo è 50. I giocatori che completano il gioco al 100% raggiungono circa il livello 35-40. Il livello 50 richiede completamento del gioco più grinding nella modalità Endless.

### Punti Abilità

Ogni livello guadagnato dà **1 Punto Abilità** da spendere nell'Albero delle Abilità. I livelli 5, 10, 15, 20, 25, 30, 35, 40, 50 danno invece **2 Punti Abilità**.

---

## 10.1 — ALBERO DELLE ABILITÀ

L'Albero delle Abilità è diviso in **5 rami principali**, ognuno dei quali corrisponde a uno stile di gioco. Il giocatore può specializzarsi in uno o distribuire i punti.

### Ramo 1: VELOCITÀ (Colore: Giallo)

Potenzia la velocità di base e le meccaniche di movimento rapido.

**Velocità 1 — "Passi Leggeri" (Costo: 1 PA)**
+0.2 tile/sec alla velocità base permanentemente.

**Velocità 2 — "Accelerazione Naturale" (Costo: 1 PA, richiede Velocità 1)**
La velocità progressiva del livello (basata sui pellet raccolti) scala più velocemente (+10% alla progressione di velocità).

**Velocità 3 — "Turbo Burst" (Costo: 2 PA, richiede Velocità 2)**
Sblocca la meccanica di Boost (RT/R2). La barra Adrenalina può essere usata per accelerare temporaneamente.

**Velocità 4 — "Slipstream" (Costo: 2 PA, richiede Velocità 3)**
Dopo un Dash, PAC mantiene +30% di velocità per 1 secondo (anziché tornare immediatamente alla velocità normale).

**Velocità 5 — "Sonic Mode" (Costo: 3 PA, richiede Velocità 4)**
Quando la velocità di PAC supera 6 tile/sec (velocità molto alta con tutti i bonus), ogni pellet raccolto dà un minuscolo boost aggiuntivo di +0.05 tile/sec (stackabile fino a +0.5 tile/sec extra).

**Velocità 6 — "Light Speed" (Costo: 3 PA, richiede Velocità 5)**
La velocità massima raggiungibile da PAC aumenta del 20%. I fantasmi in modalità vulnerabile non riescono a evadere PAC a questa velocità (PAC è garantito a essere più veloce di qualsiasi fantasma vulnerabile).

### Ramo 2: COMBAT (Colore: Rosso)

Potenzia le interazioni offensive con i nemici.

**Combat 1 — "Ghost Slayer" (Costo: 1 PA)**
Mangiare un fantasma con Power Pellet dà ×3 punti invece di ×2 al successivo della catena.

**Combat 2 — "Data Absorb" (Costo: 1 PA, richiede Combat 1)**
Sblocca l'abilità Data Absorb (vedere sezione 2.2 — PAC abilità sbloccabili).

**Combat 3 — "Riflesso Digitale" (Costo: 2 PA, richiede Combat 2)**
Sblocca il Parry. La finestra di Parry è di 0.15 secondi.

**Combat 4 — "Parry Maestro" (Costo: 2 PA, richiede Combat 3)**
La finestra di Parry aumenta a 0.25 secondi. Il Parry Perfetto ora dà il 75% di Adrenalina invece del 50%.

**Combat 5 — "Istinto di Sopravvivenza" (Costo: 2 PA, richiede Combat 4)**
Sblocca la Schivata (LT/L2 + Dash).

**Combat 6 — "Ghost Step" (Costo: 3 PA, richiede Combat 5)**
È possibile eseguire una Schivata immediatamente dopo un Dash (combo senza cooldown condiviso).

**Combat 7 — "Predatore" (Costo: 3 PA, richiede Combat 6)**
Quando PAC mangia il 4° fantasma consecutivo con un singolo Power Pellet, il Power Pellet si "ricarica" di 3 secondi aggiuntivi.

### Ramo 3: SOPRAVVIVENZA (Colore: Verde)

Potenzia le difese e la resilienza.

**Sopravvivenza 1 — "Corazza Digitale" (Costo: 1 PA)**
PAC parte ogni livello con la barra HP a 3. Al livello 1, sblocca anche la barra HP (anticipandola rispetto al Mondo 6).

**Sopravvivenza 2 — "Rigenerazione" (Costo: 1 PA, richiede Sopravvivenza 1)**
La barra HP si ricarica di 1 HP ogni 20 secondi (invece di ogni 30).

**Sopravvivenza 3 — "Ultimo Respiro" (Costo: 2 PA, richiede Sopravvivenza 2)**
Quando PAC perde l'ultima vita, ha 5 secondi di invincibilità e velocità ×2 prima del Game Over (ultima chance disperata).

**Sopravvivenza 4 — "Shield Mastery" (Costo: 2 PA, richiede Sopravvivenza 3)**
Lo Shield Bubble power-up può ora avere 5 strati invece di 3. Il primo strato di scudo si ricarica automaticamente ogni 60 secondi se distrutto.

**Sopravvivenza 5 — "Ghost Bond" (Costo: 2 PA, richiede Sopravvivenza 4)**
Quando PAC muore (perde una vita), i fantasmi tornano alla ghost house e rimangono lì per 5 secondi aggiuntivi dopo il respawn (oltre ai 3 secondi standard di invincibilità).

**Sopravvivenza 6 — "Resurrezione" (Costo: 4 PA, richiede Sopravvivenza 5)**
Una volta per partita (reset tra le sessioni, non tra i livelli): se PAC muore con 0 vite, si "resuscita" con 1 vita. Effetto visivo spettacolare (esplosione dorata, voce di Echo che dice "Non ancora.").

### Ramo 4: PUNTEGGIO (Colore: Oro)

Potenzia tutti i sistemi di scoring.

**Punteggio 1 — "Collezionista" (Costo: 1 PA)**
I pellet dorati valgono 75 punti invece di 50.

**Punteggio 2 — "Score Master" (Costo: 1 PA, richiede Punteggio 1)**
Il moltiplicatore combo base sale a ×1.5 invece di ×1.

**Punteggio 3 — "Frenzy Mode" (Costo: 2 PA, richiede Punteggio 2)**
Il moltiplicatore massimo della combo sale a ×8 invece di ×5 (prima di questa abilità); sale a ×12 con questa abilità.

**Punteggio 4 — "Smooth Operator" (Costo: 2 PA, richiede Punteggio 3)**
Usare il rallentamento (LT/L2) non rompe più la combo (la combo continua anche rallentando).

**Punteggio 5 — "Time Bonus Master" (Costo: 2 PA, richiede Punteggio 4)**
Il bonus velocità di fine livello è aumentato del 50% (massimo 4500 punti invece di 3000).

**Punteggio 6 — "Perfect Run" (Costo: 3 PA, richiede Punteggio 5)**
Se PAC completa un livello senza perdere nemmeno un pellet (Perfect Clear: 100% pellet raccolti) E senza perdere vite, guadagna un bonus addizionale di 10.000 punti.

### Ramo 5: ESPLORAZIONE (Colore: Viola)

Sblocca abilità legate all'esplorazione e ai segreti.

**Esplorazione 1 — "Sesto Senso" (Costo: 1 PA)**
I pellet dorati diventano visibili anche a 8 tile di distanza (invece di 2).

**Esplorazione 2 — "Data Tracker" (Costo: 1 PA, richiede Esplorazione 1)**
La mappa overlay (TAB) mostra la posizione di tutti i pellet non ancora raccolti (invece di solo i pellet raccolti).

**Esplorazione 3 — "Wall Sniffer" (Costo: 2 PA, richiede Esplorazione 2)**
Le stanze nascoste hanno un leggero bordo colorato sul lato che le rivela (molto sottile — 1 pixel di colore diverso — ma i giocatori attenti lo notano).

**Esplorazione 4 — "Tunnel Vision" (Costo: 2 PA, richiede Esplorazione 3)**
Sblocca l'abilità Tunnel Vision (PAC può sfondare muri temporaneamente).

**Esplorazione 5 — "Echo Mastery" (Costo: 2 PA, richiede Esplorazione 4)**
Sblocca l'abilità Echo Call (PAC chiama Echo per rivelare segreti). Inoltre, Echo Call può essere usata due volte per livello invece di una.

**Esplorazione 6 — "GRID Whisperer" (Costo: 3 PA, richiede Esplorazione 5)**
Tutti i Log di Aoyama del mondo corrente vengono rivelati sulla mappa al caricamento del livello. Questo NON li raccoglie automaticamente — PAC deve ancora raggiungerli fisicamente.

---

## 10.2 — SISTEMA DI VALUTA (PELLET COINS)

Le **Pellet Coins** (abbreviate PC) sono la valuta del gioco. Si guadagnano giocando e si spendono nel negozio tra i livelli.

### Come si Guadagnano le Pellet Coins

- Completare un livello: 10 PC base + 1 PC per ogni 1000 punti nel livello
- Valutazione S: bonus 50 PC
- Valutazione A: bonus 25 PC
- Prima volta che si completa un livello: bonus 30 PC
- Trovare un segreto: 15 PC
- Raccogliere uno Spirito Dati: 20 PC
- Completare una missione secondaria: 30-100 PC
- Sconfiggere un boss: 100 PC
- Modalità Endless: 1 PC ogni 500 pellet raccolti

### Come si Spendono le Pellet Coins

Nel Negozio tra i livelli (sezione 10.3). I prezzi principali:

| Oggetto | Costo PC |
|---------|---------|
| Power-Up Tier 1 | 20-40 PC |
| Power-Up Tier 2 | 80-150 PC |
| Power-Up Tier 3 | 300-500 PC |
| Vita Extra | 100 PC |
| Skin Cosmetica | 200-500 PC |
| Continua (Game Over) | 50 PC (scala: +50 per ogni continua successiva nella sessione) |
| Segnalibro Livello | 75 PC (permette di ricominciare direttamente da un livello già completato) |

### Persistenza delle Pellet Coins

Le Pellet Coins sono **permanenti** — non si perdono con la morte, non si resetano tra le sessioni. Si accumulano nel tempo. Un giocatore che gioca a lungo accumula molte PC e può permettersi equipaggiamento migliore.

---

## 10.3 — IL NEGOZIO TRA I LIVELLI

Il Negozio è accessibile dalla Sala di Riposo tra ogni livello. Presenta uno stock di oggetti che si rinnova parzialmente ogni livello.

### Struttura del Negozio

**Sezione 1: POWER-UP DISPONIBILI (3-6 oggetti)**
Il negozio presenta sempre 3-6 power-up disponibili all'acquisto. Questi vengono generati in modo semi-casuale:
- 50% di probabilità di un Tier 1
- 30% di probabilità di un Tier 2
- 20% di probabilità di un Tier 3
- Ma almeno 1 Tier 1 garantito e al massimo 1 Tier 3 per generazione

Lo stock si rinnova ogni 3 livelli completati (non ogni livello, per mantenere la scarsità). Il giocatore può vedere un'anteprima del prossimo stock nella sala di riposo (testo: "Prossimo stock tra X livelli").

**Sezione 2: POTENZIAMENTI TEMPORANEI (2-3 oggetti)**
Bonus che durano solo per il prossimo livello:
- "Pellet Extra" — aggiunge 15 pellet dorati nel prossimo livello
- "Ghost Slowdown" — i fantasmi sono al 90% velocità nel prossimo livello
- "Double XP" — XP ×2 nel prossimo livello
- "Time Shield" — il timer di tutti i power-up nel prossimo livello ha durata +50%

**Sezione 3: PERMANENTI (1-2 oggetti, rotazione casuale)**
- Vita extra
- Segnalibro
- Skin cosmetiche sbloccate progressivamente

**Sezione 4: CRAFTING**
Interfaccia di crafting (descritto nella sezione 4.6).

### Interfaccia del Negozio

**Layout:** Schermata divisa in 2 colonne. A sinistra: lista degli oggetti disponibili con icona, nome, prezzo. A destra: pannello di dettaglio dell'oggetto selezionato (descrizione estesa, statistiche, effetto visivo in miniatura).

**In basso:** Saldo PC corrente del giocatore. Pulsante "Conferma Acquisto". Pulsante "Torna alla Sala".

---

## 10.4 — SISTEMA DI SFIDE E MISSIONI SECONDARIE

Le missioni secondarie sono obiettivi opzionali che appaiono durante il gioco e danno ricompense sostanziali.

### Tipologie di Missioni

**Missioni di Livello (si azzerano ogni livello):**
Queste missioni appaiono all'inizio di ogni livello (3 casuali estratte da un pool). Si completano entro il livello.

Esempi:
- "Mangia 3 fantasmi con un singolo Power Pellet" → 50 PC + 200 XP
- "Completa il livello senza usare il Dash" → 30 PC + 100 XP
- "Raggiungi una combo di 30+" → 40 PC + 150 XP
- "Raccogli tutti i pellet dorati del livello" → 60 PC + 250 XP
- "Non perdere HP nel livello" → 45 PC + 175 XP
- "Completa il livello in meno di 2 minuti" → 50 PC + 200 XP
- "Usa 3 power-up diversi nel livello" → 35 PC + 125 XP
- "Trova la stanza nascosta" → 70 PC + 300 XP (se presente nel livello)

**Missioni di Mondo (persistono per tutto il mondo):**
Più impegnative, si completano nell'arco di 5 livelli.

Esempi:
- "Sconfiggi il boss senza perdere vite nel Mondo X" → 200 PC + 1000 XP
- "Trova tutti gli Spiriti Dati del Mondo X" → 150 PC + 750 XP
- "Completa tutti i livelli del Mondo X con valutazione A o S" → 300 PC + 1500 XP

**Missioni Globali (persistono per tutta la campagna):**
Obiettivi a lungo termine.

Esempi:
- "Mangia un totale di 1000 fantasmi" → 500 PC + 3000 XP + skin "Ghost Hunter"
- "Completa una run senza mai usare power-up Tier 3" → 400 PC + 2000 XP + skin "Purista"
- "Trova tutti i 35 Log di Aoyama" → Sblocca il boss segreto PAC-SHADOW + 1000 PC

### Interfaccia Missioni

Le missioni attive sono visibili nel menu di pausa (scheda MISSIONI). Ogni missione mostra:
- Descrizione dell'obiettivo
- Barra di progresso (se applicabile: "3/10 fantasmi mangiati")
- Ricompensa
- Scadenza (livello o mondo corrente)

---

## 10.5 — IL SISTEMA DI ACHIEVEMENT

Gli achievement (traguardi) sono sblocchi permanenti che riconoscono le imprese del giocatore. Non tutti danno ricompense in PC — alcuni sono solo "onorificenze".

### Lista degli Achievement (selezionati — lista completa: 80 achievement totali)

**ACHIEVEMENT DI BASE (sbloccati giocando normalmente):**
- "Primo Passo" — Completa il livello 1-1
- "Primo Sangue" — Perdi la prima vita
- "Vendetta" — Mangia il primo fantasma vulnerabile
- "Benvenuto al Negozio" — Usa il negozio per la prima volta
- "Adrenalina" — Raggiungi una combo di 20
- "Frenesia" — Raggiungi una combo di 100

**ACHIEVEMENT DI STORIA:**
- "Il Risveglio" — Completa il Mondo 1
- "Le Caverne della Memoria" — Completa il Mondo 2
- "Frammentato" — Completa il Mondo 3
- "Il Peso del Passato" — Completa il Mondo 4
- "La Verità" — Completa il Mondo 5
- "Resistenza" — Completa il Mondo 6
- "Il Labirinto Originale" — Completa il Mondo 7
- "Reboot" — Ottieni il Finale A
- "Sacrificio" — Ottieni il Finale B
- "Il Divoratore" — Ottieni il Finale C (segreto)
- "Liberazione" — Ottieni il Finale D (ultra-segreto)

**ACHIEVEMENT DI SKILL:**
- "Intoccabile" — Completa un livello senza perdere HP
- "Perfetto" — Ottieni valutazione S in un livello
- "Maestro del Labirinto" — Ottieni valutazione S in tutti i livelli del Mondo 1
- "Grand Master" — Ottieni valutazione S in tutti e 35 i livelli
- "Senza Morire" — Completa un intero mondo senza perdere vite
- "Speed Runner" — Completa il gioco in meno di 5 ore
- "Ultra Speed" — Completa il gioco in meno di 3 ore
- "Untouchable Boss" — Sconfiggi qualsiasi boss senza subire danni

**ACHIEVEMENT DI ESPLORAZIONE:**
- "Curioso" — Trova la prima stanza nascosta
- "Esploratore" — Trova 25 stanze nascoste
- "Cacciatore di Segreti" — Trova tutti i segreti del Mondo 1
- "Il Profeta" — Trova tutti e 35 i Log di Aoyama
- "Collezionista di Spiriti" — Raccogli tutti gli Spiriti Dati

**ACHIEVEMENT DI COMBATTIMENTO:**
- "Catena Perfetta" — Mangia tutti e 4 i fantasmi vulnerabili con un singolo Power Pellet
- "Predatore Supremo" — Completa una boss fight senza usare power-up
- "David contro Golia" — Sconfiggi il boss segreto PAC-SHADOW

**ACHIEVEMENT COMICI/SEGRETI:**
- "Troppo Curioso" — Muori 10 volte nello stesso livello
- "Pasto Abbondante" — Mangia 500 pellet in un singolo livello
- "Come una Lumaca" — Completa un livello usando il rallentamento per più del 50% del tempo
- "Maledetto" — Raccogli tutti e 4 i power-up negativi in una sola sessione

---

## 10.6 — CLASSIFICA GLOBALE E SCORE ATTACK

Il sistema di classifica permette ai giocatori di competere a livello mondiale.

### Tipologie di Classifica

**Classifica Globale Punteggio:**
Punteggio totale accumulato in una singola run completa (dal livello 1-1 al 7-5 senza interruzioni). Una run inizia scegliendo "Nuova Partita" e non si interrompe fino al finale.

**Classifica per Singolo Livello:**
Ogni livello del gioco ha una classifica separata. I giocatori possono confrontare il loro record personale con il mondo.

**Classifica Modalità Endless:**
Quanti pellet sono stati raccolti nella Modalità Endless prima del Game Over.

**Classifica Speed Run:**
Tempo totale per completare la campagna storia (solo livelli obbligatori, no segreti). Il timer è visibile nell'HUD quando si usa questa modalità.

### Score Attack Mode

La Modalità Score Attack è una variante specifica per le classifiche. In questa modalità:
- Si seleziona un singolo livello da affrontare
- Il giocatore ha vite illimitate MA ogni morte azzera il moltiplicatore combo e penalizza 5000 punti
- L'obiettivo è massimizzare il punteggio in quel singolo livello
- Il punteggio viene inviato alla classifica del livello corrispondente

---

## 10.7 — DAILY CHALLENGE E CONTENUTI ROTANTI

Ogni giorno, il gioco offre sfide speciali con ricompense esclusive.

### Daily Challenge

**Struttura:** Ogni giorno (reset alle 00:00 UTC) vengono generate 3 Daily Challenges:
- **Challenge Facile:** Un livello esistente con modificatori leggeri (es. "Livello 2-3 senza Power Pellet") → Ricompensa: 50 PC + 200 XP
- **Challenge Media:** Un livello con modificatori significativi → Ricompensa: 100 PC + 400 XP
- **Challenge Difficile:** Una combinazione di livelli o una sfida specifica (es. "Raggiunge Combo 200 in un livello") → Ricompensa: 200 PC + 800 XP

**I modificatori possibili:**
- No Power-Up (nessun power-up appare nel livello)
- Ghost Rush (velocità fantasmi ×2)
- Darkness (metà del labirinto sempre oscura)
- Time Limit (metà del tempo normale)
- No Dash (Dash disabilitato)
- Blind Ghost (i fantasmi non possono vedere PAC — si muovono casualmente, ma ci sono il doppio)
- Gravity (i pellet "cadono" verso il basso — ogni secondo scivolano di 1 tile verso il basso finché non si appoggiano a un muro)

**Completare tutte e 3 le daily in un giorno** dà un bonus: 100 PC extra + 1 Pellet speciale "Daily Rainbow" (che vale 500 punti nel prossimo livello giocato).

**Streak:** Completare le daily per 7 giorni consecutivi dà uno skin cosmetico esclusivo. 30 giorni consecutivi = skin "Leggendario" unico.

### Weekly Challenge

Ogni settimana: una sfida più lunga (completare un intero mondo con modificatori specifici). Ricompensa: 500 PC + 2000 XP + 1 power-up Tier 3 garantito.

---

# PARTE XI — MODALITÀ DI GIOCO

---

## 11.0 — MODALITÀ STORIA

**Descrizione:** La campagna principale del gioco. 35 livelli + 14 segreti attraverso 7 mondi. Il sistema narrativo completo (cutscene, dialoghi, log). Il sistema di progressione RPG e l'Albero delle Abilità sono disponibili.

**Salvataggio:** Automatico dopo ogni livello completato. 3 slot di salvataggio separati.

**Difficoltà disponibili:** Easy, Normal, Hard, Superior (vedi sezione 13.1 per i dettagli).

**Caratteristiche uniche della Modalità Storia:**
- Le cutscene sono obbligatorie alla prima visione, skippabili in seguito
- I dialoghi con Echo sono disponibili tra i livelli
- I segreti e i log sbloccano contenuto narrativo
- Il finale varia in base alle scelte del giocatore

---

## 11.1 — MODALITÀ ARCADE CLASSICA

**Descrizione:** Una riproduzione fedele dell'esperienza Pac-Man originale del 1980, ma con la grafica e l'audio migliorati di ULTRA PAC: REBORN. Nessuna narrativa, nessun RPG, nessun Albero delle Abilità.

**Caratteristiche:**
- Il labirinto è il labirinto classico 28×31 esattamente com'era nell'originale
- I quattro fantasmi hanno il comportamento originale (nessuna abilità speciale)
- I power-up sono solo i Power Pellet classici (nessun Tier 1/2/3)
- La difficoltà scala esattamente come il gioco originale (ogni livello i fantasmi accelerano, la durata del Power Pellet diminuisce)
- Vite: 3 (configurabile 1-5)
- Game Over definitivo (nessun continua con PC)
- Il punteggio va alla classifica separata "Arcade Classic"

**Perché includerla:** Rispetto per la storia del gioco. I fan storici di Pac-Man possono rivivere l'esperienza originale. Anche i nuovi giocatori che scoprono ULTRA PAC possono capire da dove viene il concept base.

---

## 11.2 — MODALITÀ ENDLESS RUN

**Descrizione:** Un flusso infinito di labirinti generati proceduralmente. PAC continua finché non perde tutte le vite. Non c'è un "fine" — l'obiettivo è sopravvivere il più a lungo possibile e massimizzare il punteggio.

**Meccaniche specifiche della Modalità Endless:**
- I labirinti sono generati proceduralmente (vedi sezione 5.10)
- La difficoltà scala automaticamente ogni 10 labirinti completati
- A ogni set di 10 labirinti, il giocatore sceglie 1 di 3 power-up offerti (meccanica ispirata a Hades e Dead Cells)
- Le vite non si resettano tra un labirinto e l'altro — ogni vita persa è persa per sempre
- Al completamento del labirinto (100% pellet raccolti), il labirinto successivo appare immediatamente (breve flash di transizione)
- PAC mantiene i power-up attivi tra i labirinti (ma i timer si azzerano tra i labirinti — ogni power-up temporaneo ricomincia il suo timer al nuovo labirinto)
- Il punteggio è cumulativo

**Metriche della Modalità Endless:**
- Punteggio totale
- Pellet totali raccolti
- Labirinti completati
- Fantasmi mangiati
- Combo massima raggiunta

**Unlockable:** Le run nella Modalità Endless possono sbloccare contenuti se si raggiungono certe milestone (es. "Completa 50 labirinti Endless in totale = sblocca skin 'Eterno'").

---

## 11.3 — MODALITÀ BOSS RUSH

**Descrizione:** Affronta tutti i boss del gioco in sequenza, senza pause tra di loro. L'obiettivo è sconfiggerli tutti il più velocemente possibile.

**Caratteristiche:**
- I boss si affrontano nell'ordine della storia (1→7 + segreto se sbloccato)
- Tra un boss e l'altro: 10 secondi di pausa per raccogliere i power-up droppad dal boss precedente
- HP di PAC: si resettano a pieno prima di ogni boss
- Vite: 3 totali (non si resettano tra i boss)
- Se si perde una vita contro un boss, si ricomincia da quel boss (non dall'inizio)
- Il timer parte al primo boss e si ferma all'ultimo boss morto
- Il tempo finale va alla classifica Boss Rush

**Difficoltà della Modalità Boss Rush:** I boss hanno HP al 150% rispetto alla modalità storia. Le loro fasi si accorciano (passano alla fase successiva più velocemente). Questo è intenzionale — il Boss Rush è una sfida per veterani.

---

## 11.4 — MODALITÀ SURVIVAL (NO POWER-UP)

**Descrizione:** La versione più hardcore del gioco. PAC non può raccogliere power-up — qualsiasi power-up nel labirinto è ignorato (non appare, o appare ma non è raccoglibile).

**Caratteristiche:**
- Nessun power-up di nessun tipo
- Nessun Power Pellet (i fantasmi non diventano mai vulnerabili)
- PAC deve sopravvivere basandosi SOLO sul suo movimento, sulla sua conoscenza del labirinto, e sulle sue abilità di Dash/Schivata/Parry
- I labirinti sono quelli normali della modalità storia
- 1 vita sola (nessun respawn)
- Il completamento di ogni livello in questa modalità dà 3× le Pellet Coins normali

**Perché includerla:** Per i giocatori che vogliono padroneggiare il movimento puro senza dipendere dai power-up. Richiede una comprensione profonda dei pattern dei nemici.

---

## 11.5 — MODALITÀ SPEED RUN

**Descrizione:** Modalità ottimizzata per la speed run competitiva.

**Caratteristiche:**
- Timer prominente nell'HUD (minuti:secondi:centesimi)
- Timer si ferma durante le cutscene (non penalizzato per guardare la storia)
- Timer non si ferma durante il menu di pausa (la pausa "congela" il gioco MA non il timer — spingersi a non pausare è parte della sfida)
- Alcune ottimizzazioni per speed runner: il giocatore può "skippa" la frutta bonus senza che venga rimossa (la frutta non raccolta non penalizza il timer)
- Il gioco traccia "split time" automatici: il timer di ogni livello viene salvato separatamente
- Compatibile con software di speed run esterni (nessuna protezione contro overlay) — nota esplicita nelle impostazioni

**Categorie di Speed Run (visibili nella classifica):**
- Any%: Completamento più veloce possibile senza restrizioni
- 100%: Completamento al 100% (tutti i segreti, tutti i pellet, tutti i livelli)
- No Power-Up: Speed run senza power-up (combinazione di Speed Run e Survival)
- No Dash: Speed run senza usare il Dash

---

## 11.6 — MODALITÀ MULTIGIOCATORE LOCALE (2-4 GIOCATORI)

**Descrizione:** Fino a 4 giocatori possono giocare insieme sulla stessa macchina (split screen).

### Modalità Cooperativa Locale

Tutti i giocatori controllano PAC (ognuno ha il proprio PAC colorato diversamente: Giallo, Ciano, Rosa, Verde). Tutti i PAC si trovano nello stesso labirinto.

**Meccaniche co-op:**
- Tutti i PAC condividono la barra delle vite (pool comune di 5 vite)
- Un giocatore può "rianimare" un compagno morto raccogliendo il power-up 1UP vicino alla sua posizione di morte
- I power-up raccolti da un giocatore possono essere condivisi: tenendo premuto il tasto di power-up e toccando un compagno, il power-up viene trasferito
- Il punteggio è condiviso (va alla stessa classifica "team score")

### Modalità Versus Locale

I giocatori competono all'interno dello stesso labirinto. Due modalità:

**Versus Pellet:** Chi raccoglie più pellet entro il tempo limite vince. I giocatori possono "rubare" pellet uno all'altro: se due PAC sono sulla stessa tile, quello con la combo più alta "vince" il pellet.

**Versus Survival:** L'ultimo PAC in piedi vince. PAC può "scontrarsi" con gli altri giocatori: il contatto tra due PAC fa perdere 1 HP a quello con meno Adrenalina. I fantasmi sono attivi e pericolosi per tutti.

**Controlli per Multiplayer Locale:** Richiedono controller separati. Non è possibile giocare in multiplayer locale con la tastiera (o solo un giocatore usa la tastiera, gli altri usano controller). La configurazione dei controller è visibile nel menu prima dell'inizio della partita.

---

## 11.7 — MODALITÀ COOPERATIVA ONLINE

**Descrizione:** Come la Cooperativa Locale ma online. Fino a 4 giocatori da diverse macchine.

**Caratteristiche Tecniche:**
- Connessione: Peer-to-peer con server di matchmaking Anthropic (o hosting proprio per LAN)
- Latenza tollerata: fino a 150ms (al di sopra, il gioco avvisa e degrada la qualità di sincronizzazione)
- Rollback networking: usato per compensare la latenza (il gioco "predice" le azioni dei giocatori remoti e le corregge retroattivamente se la predizione era sbagliata)
- Lobby: sistema di stanze (codice stanza da condividere con gli amici) + matchmaking casuale

**Voice Chat:** Non integrato nel gioco. Si consiglia l'uso di Discord/piattaforma esterna. Il gioco ha una chat testuale in-game nella lobby e nella sala di riposo.

---

## 11.8 — MODALITÀ VERSUS ONLINE

**Descrizione:** Competizione online tra 2 giocatori. Non si trova nello stesso labirinto — invece, è una gara parallela.

**Come funziona il Versus Online:**
- Entrambi i giocatori giocano lo stesso livello generato identicamente (stesso seed)
- Ognuno vede il proprio labirinto, ma nell'HUD c'è una piccola finestra che mostra il punteggio in tempo reale dell'avversario
- Chi completa il livello con il punteggio più alto vince il round
- Si giocano 5 round; chi vince più round vince la partita
- Meccanica "Sabotaggio": ogni volta che si mangia un fantasma, si può scegliere di "mandare" un handicap all'avversario (es. attivare un modificatore Reverse o Blind per 5 secondi) invece dei punti extra

**Sistema di Ranking:** Il Versus Online usa un sistema di ranking ELO. Le vittorie aumentano il ranking, le sconfitte lo diminuiscono. Il ranking determina contro chi si fa matchmaking.

---

## 11.9 — MODALITÀ TIME ATTACK

**Descrizione:** Completa un livello nel minor tempo possibile. Diversamente dalla Speed Run (che copre l'intera campagna), il Time Attack si concentra su singoli livelli.

**Caratteristiche:**
- Si seleziona qualsiasi livello sbloccato nella campagna storia
- L'obiettivo è completarlo (raccogliere il 100% dei pellet o una percentuale target configurabile) nel minor tempo possibile
- Non ci sono vite — se PAC muore, il timer continua ma PAC respawna immediatamente (la morte "costa" circa 3 secondi di tempo, che è la penalità)
- Il miglior tempo per ogni livello va alla classifica Time Attack del livello

**Ghost Run:** Dopo aver stabilito un record personale, il gioco salva un "ghost" — una replay semi-trasparente di quella run. Nella prossima tentata, il ghost è visibile nel labirinto, mostrando esattamente dove PAC era al medesimo istante della sessione record. Aiuta a identificare dove si sta perdendo tempo.

---

## 11.10 — MODALITÀ PUZZLE MAZE

**Descrizione:** Una modalità completamente diversa dal resto del gioco. Non si tratta di velocità o sopravvivenza, ma di PIANIFICAZIONE.

**Come funziona:**
- PAC si muove solo quando il giocatore lo comanda (ogni pressione di un tasto fa muovere PAC di 1 tile)
- I fantasmi si muovono ogni volta che PAC si muove (turno per turno — ogni mossa di PAC è seguita da una mossa dei fantasmi)
- L'obiettivo è raccogliere tutti i pellet senza essere toccato dai fantasmi
- Non c'è un timer — si può pensare quanto si vuole
- Ogni livello Puzzle ha una soluzione ottimale (numero minimo di mosse). Il giocatore può confrontare le sue mosse con l'ottimale.

**Questo è fondamentalmente un gioco di strategia a turni** — completamente diverso dall'azione frenetica del resto del gioco. È pensato per i giocatori che amano la pianificazione tattica.

**Livelli Puzzle:** 30 livelli puzzle predefiniti, più un editor di livelli per creare i propri e condividerli online.

---

# PARTE XII — ARCHITETTURA TECNICA

---

## 12.0 — MOTORE DI GIOCO CONSIGLIATO

**Raccomandazione Primaria: Godot 4.x**

Godot è il motore consigliato per questo progetto per le seguenti ragioni:
- Open source e gratuito (nessuna royalty)
- Eccellente supporto per giochi 2D con pixel art
- GDScript (simile a Python) è accessibile anche a sviluppatori non esperti
- Supporto nativo per tilemap, sprite animation, e scene
- Esportazione semplice per PC (Windows/Mac/Linux), Console, e Mobile
- Community attiva e documentazione eccellente

**Alternativa: Unity 2D con URP (Universal Render Pipeline)**

Unity è più potente ma richiede più setup iniziale. Il sistema di rendering URP permette effetti visivi avanzati (bloom, post-processing) più facilmente. La licenza di Unity ha costi per ricavi superiori a certi threshold (verificare la policy corrente di Unity prima di scegliere).

**Alternativa per Sviluppatori Esperti: Pygame (Python) o LÖVE2D (Lua)**

Per sviluppatori che vogliono controllo totale. Più lavoro di setup, ma nessuna limitazione del motore.

Questo documento usa Godot 4 come riferimento per gli esempi di codice, ma i concetti sono trasferibili a qualsiasi motore.

---

## 12.1 — STRUTTURA DELLE CARTELLE DEL PROGETTO

```
ultra_pac_reborn/
│
├── project.godot                    # File progetto Godot
├── README.md                        # Documentazione progetto
│
├── assets/                          # Tutti gli asset del gioco
│   ├── sprites/                     # Sprite e texture
│   │   ├── pac/                     # Sprite di PAC (sprite sheets)
│   │   │   ├── pac_base.png         # Sprite sheet base
│   │   │   ├── pac_fire.png         # Sprite sheet Fire Form
│   │   │   ├── pac_ice.png
│   │   │   ├── pac_shadow.png
│   │   │   ├── pac_giant.png
│   │   │   └── pac_omega.png
│   │   ├── ghosts/                  # Sprite dei fantasmi
│   │   │   ├── blinky.png
│   │   │   ├── pinky.png
│   │   │   ├── inky.png
│   │   │   ├── clyde.png
│   │   │   └── ghosts_shared.png    # Stati condivisi (vulnerabile, occhi)
│   │   ├── enemies/                 # Sprite nemici non-fantasma
│   │   ├── bosses/                  # Sprite dei boss
│   │   ├── powerups/                # Icone dei power-up
│   │   ├── ui/                      # Sprite dell'interfaccia
│   │   ├── tiles/                   # Tile set per ogni mondo
│   │   │   ├── world1_tiles.png
│   │   │   ├── world2_tiles.png
│   │   │   └── ...
│   │   ├── particles/               # Sprite per le particelle
│   │   └── backgrounds/             # Sfondi e parallax layer
│   │
│   ├── audio/                       # Tutti i file audio
│   │   ├── music/                   # Tracce musicali (.ogg)
│   │   │   ├── track01_welcome_to_the_grid.ogg
│   │   │   └── ...
│   │   ├── sfx/                     # Effetti sonori (.wav)
│   │   │   ├── pac/
│   │   │   ├── ghosts/
│   │   │   ├── ui/
│   │   │   └── ambient/
│   │   └── voice/                   # Doppiaggio (.ogg)
│   │       ├── it/                  # Italiano
│   │       ├── en/                  # Inglese
│   │       └── jp/                  # Giapponese
│   │
│   ├── fonts/                       # Font custom
│   │   ├── PacPixel.ttf
│   │   └── PacPixel_Bold.ttf
│   │
│   └── data/                        # Dati del gioco in formato leggibile
│       ├── levels/                  # Definizioni dei livelli
│       │   ├── world1/
│       │   │   ├── level_1_1.json
│       │   │   └── ...
│       │   └── ...
│       ├── dialogue/                # Script dei dialoghi
│       ├── missions/                # Definizioni delle missioni
│       └── achievements/            # Definizioni degli achievement
│
├── scenes/                          # Scene Godot (.tscn)
│   ├── main.tscn                    # Scena principale (entry point)
│   ├── game/                        # Scene di gameplay
│   │   ├── game_world.tscn          # Container principale di gioco
│   │   ├── maze.tscn                # Il labirinto
│   │   ├── pac.tscn                 # PAC come scena
│   │   ├── ghost.tscn               # Fantasma generico (instanziato)
│   │   ├── boss_arena.tscn          # Arena boss
│   │   └── particle_system.tscn    # Sistema particelle
│   ├── ui/                          # Scene dell'interfaccia
│   │   ├── hud.tscn                 # HUD di gioco
│   │   ├── menu_main.tscn           # Menu principale
│   │   ├── menu_pause.tscn          # Menu di pausa
│   │   ├── shop.tscn                # Negozio
│   │   └── cutscene_player.tscn    # Player delle cutscene
│   └── rest_room.tscn              # Sala di riposo
│
├── scripts/                         # Script GDScript (.gd)
│   ├── core/                        # Script fondamentali
│   │   ├── GameManager.gd           # Manager globale del gioco
│   │   ├── SaveSystem.gd            # Sistema di salvataggio
│   │   ├── InputManager.gd          # Gestione input
│   │   └── AudioManager.gd          # Gestione audio
│   ├── gameplay/                    # Script di gameplay
│   │   ├── Pac.gd                   # Script di PAC
│   │   ├── Ghost.gd                 # Script base dei fantasmi
│   │   ├── Blinky.gd               # Comportamento Blinky
│   │   ├── Pinky.gd                # Comportamento Pinky
│   │   ├── Inky.gd                 # Comportamento Inky
│   │   ├── Clyde.gd                # Comportamento Clyde
│   │   ├── Maze.gd                 # Gestione labirinto
│   │   ├── Pellet.gd               # Script pellet
│   │   ├── PowerUp.gd              # Sistema power-up
│   │   └── Boss.gd                 # Script base dei boss
│   ├── systems/                     # Sistemi trasversali
│   │   ├── ScoreSystem.gd
│   │   ├── ComboSystem.gd
│   │   ├── HungerSystem.gd
│   │   ├── AdrenalineSystem.gd
│   │   ├── StealthSystem.gd
│   │   ├── ProgressionSystem.gd     # Livelli, XP, abilità
│   │   ├── MissionSystem.gd
│   │   ├── AchievementSystem.gd
│   │   └── ParticleSystem.gd
│   └── ui/                          # Script dell'interfaccia
│       ├── HUD.gd
│       ├── MainMenu.gd
│       ├── PauseMenu.gd
│       ├── Shop.gd
│       └── CutscenePlayer.gd
│
├── addons/                          # Plugin Godot
│   └── ...
│
└── export/                          # File di export per le piattaforme
    ├── windows/
    ├── macos/
    ├── linux/
    └── web/
```

---

## 12.2 — LOOP DI GIOCO PRINCIPALE

Il loop di gioco segue la struttura standard di un gioco in tempo reale.

```
MAIN LOOP (60 volte al secondo = delta time di circa 0.01667 secondi):

1. LEGGI INPUT
   - Leggi lo stato del controller/tastiera/touch
   - Aggiorna il buffer di input per PAC
   - Controlla eventi di sistema (pausa, chiudi, ecc.)

2. UPDATE (aggiorna la logica del gioco)
   a. Update PAC
      - Calcola nuova posizione in base all'input e alla velocità
      - Controlla collisioni con muri
      - Controlla raccolta pellet/power-up/frutta
      - Aggiorna stato del personaggio (forme, power-up attivi, timer)
      - Aggiorna barra Fame e Adrenalina
      - Controlla se PAC è in zona d'ombra (per stealth)
   
   b. Update Fantasmi (per ogni fantasma attivo)
      - Aggiorna stato FSM (SCATTER/CHASE/FRIGHTENED/EYES/HOME)
      - Calcola prossima mossa (pathfinding se in CHASE)
      - Aggiorna posizione
      - Controlla collisione con PAC
   
   c. Update Boss (se in boss fight)
      - Aggiorna stato boss (fase corrente)
      - Esegui pattern di attacco attivo
      - Controlla collisione degli attacchi con PAC
      - Controlla collisione di PAC con boss (danno)
   
   d. Update Sistemi
      - Sistema Combo (check break, aggiornamento multiplier)
      - Sistema Score (applica moltiplicatori, aggiorna display)
      - Sistema Particelle (aggiorna posizione, vita, rimozione)
      - Sistema Audio (aggiorna layer musicali, suoni spaziali)
      - Sistema Missioni (check completion)
      - Sistema Achievement (check trigger)
   
   e. Update Gioco
      - Controlla condizione di completamento livello (100% pellet)
      - Controlla condizione di Game Over (0 vite)
      - Aggiorna timer del livello
      - Gestisci transizioni di stato (livello → sala riposo → livello)

3. RENDER (disegna il frame)
   a. Renderizza a risoluzione interna 480×270
      - Disegna background (layer più lontano — parallax)
      - Disegna labirinto (tile per tile)
      - Disegna pellet e power-up
      - Disegna PAC con animazione corretta
      - Disegna fantasmi con animazione corretta
      - Disegna particelle
      - Disegna boss (se attivo)
      - Disegna effetti speciali (glow, fiamme, ecc.)
   
   b. Applica post-processing
      - Bloom
      - Vignette
      - Effetti mondiali (scanline, chromatic aberration, shimmer)
   
   c. Upscale a risoluzione monitor
      - Nearest neighbor / Scale2x / xBRZ
   
   d. Disegna HUD (alla risoluzione nativa del monitor)
      - Punteggio, combo, vite, barre, slot power-up

4. AUDIO
   - Aggiorna layer musicali (attiva/disattiva in base a trigger)
   - Emetti nuovi suoni effetto (coda di suoni da emettere nell'update)
   - Aggiorna audio spaziale fantasmi
   - Applica ducking se voce attiva

5. WAIT NEXT FRAME (sync a 60 FPS)
```

---

## 12.3 — SISTEMA DI TILE MAP E LABIRINTO

### Rappresentazione Interna del Labirinto

Il labirinto è rappresentato come una **matrice 2D di interi** (array di array):

```gdscript
# Esempio in GDScript (Godot)
var maze_data: Array = []
# Ogni cella è un intero che rappresenta il tipo di tile:
# 0 = corridoio vuoto
# 1 = muro solido
# 2 = corridoio con pellet
# 3 = corridoio con power pellet
# 4 = corridoio con pellet dorato
# 5 = corridoio con pellet arcobaleno
# 6 = ghost house (interno)
# 7 = ghost house porta
# 8 = tunnel warp
# 9 = zona d'ombra (con pellet)
# 10 = zona d'ombra (senza pellet)
# 11 = portale warp
# 12 = stanza nascosta ingresso
```

### Caricamento del Labirinto

I labirinti sono definiti in file JSON nella cartella `assets/data/levels/`. Ogni file JSON contiene:

```json
{
  "level_id": "1_1",
  "world": 1,
  "name": "First Steps",
  "width": 28,
  "height": 31,
  "tiles": [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
    ...
  ],
  "spawn_pac": [14, 23],
  "spawn_ghosts": [[13, 14], [14, 14], [13, 15], [14, 15]],
  "fruit_position": [13, 17],
  "checkpoints": [[13, 10], [13, 20]],
  "secrets": [
    {"type": "log", "position": [5, 5], "trigger": "wait_3_seconds"},
    {"type": "spirit", "position": [22, 8], "trigger": "stealth"}
  ],
  "time_target": 180,
  "music_track": "track06_grid_awakening",
  "ambient_track": "amb_neon_city"
}
```

### Query al Labirinto

Il sistema di labirinto espone funzioni per interrogare la struttura:

```gdscript
# Controlla se una tile è passabile
func is_passable(x: int, y: int) -> bool:
    if x < 0 or x >= maze_width or y < 0 or y >= maze_height:
        return false  # Fuori dai bordi (eccetto tunnel)
    var tile = maze_data[y][x]
    return tile != 1  # Tutti tranne i muri

# Controlla se è una zona d'ombra
func is_shadow_zone(x: int, y: int) -> bool:
    return maze_data[y][x] in [9, 10]

# Ottieni il tile in posizione
func get_tile(x: int, y: int) -> int:
    return maze_data[y][x]

# Rimuovi pellet da una posizione (quando raccolto)
func remove_pellet(x: int, y: int) -> void:
    if maze_data[y][x] in [2, 3, 4, 5, 9]:
        maze_data[y][x] = 0  # o 10 se era zona d'ombra
        pellets_remaining -= 1
        emit_signal("pellet_collected", x, y)

# Controlla le condizioni di tunnel warp
func check_tunnel_warp(x: int, y: int) -> Vector2:
    if x < 0: return Vector2(maze_width - 1, y)
    if x >= maze_width: return Vector2(0, y)
    if y < 0: return Vector2(x, maze_height - 1)
    if y >= maze_height: return Vector2(x, 0)
    return Vector2(x, y)  # Nessun warp
```

---

## 12.4 — SISTEMA DI COLLISIONI

Le collisioni in ULTRA PAC: REBORN sono **tile-based** — non usano fisica continua ma sono basate su posizioni discrete nella griglia.

### Collisione PAC-Muro

PAC si muove tra le tile. La collisione con i muri è gestita dal sistema di movimento:

```gdscript
# Pseudo-codice del movimento di PAC
func move_pac(delta: float) -> void:
    # Calcola la nuova posizione
    var new_x = pac_x + direction.x * speed * delta
    var new_y = pac_y + direction.y * speed * delta
    
    # Controlla se PAC è arrivato al centro della prossima tile
    if ha_raggiunto_centro_tile():
        # Controlla l'input buffered
        if buffered_direction != NONE:
            if is_passable(tile_adiacente_in_buffered_direction):
                direction = buffered_direction
                buffered_direction = NONE
            else:
                # Non può girare — mantieni direzione attuale
                pass
        
        # Controlla se può continuare nella direzione attuale
        if not is_passable(tile_adiacente_in_current_direction):
            # Muro avanti — fermati al centro di questa tile
            pac_x = round(pac_x)
            pac_y = round(pac_y)
            direction = NONE
        else:
            # Continua
            pac_x = new_x
            pac_y = new_y
    else:
        pac_x = new_x
        pac_y = new_y
```

### Collisione PAC-Fantasma

La collisione PAC-fantasma è verificata ogni frame. È una collisione circle-vs-circle (PAC e i fantasmi sono entità circolari):

```gdscript
func check_pac_ghost_collision() -> void:
    for ghost in active_ghosts:
        var distance = pac.position.distance_to(ghost.position)
        var collision_radius = PAC_RADIUS + GHOST_RADIUS  # es. 6 + 6 = 12 pixel interni
        
        if distance < collision_radius:
            if ghost.state == FRIGHTENED:
                # PAC mangia il fantasma
                eat_ghost(ghost)
            elif ghost.state == EYES:
                pass  # Nessuna collisione con gli occhi
            else:
                # Fantasma non vulnerabile — PAC muore
                pac_hit()
```

### Raccolta dei Pellet

La raccolta avviene quando PAC è abbastanza vicino al centro di una tile che contiene un pellet:

```gdscript
func check_pellet_collection() -> void:
    var pac_tile_x = int(round(pac.position.x))
    var pac_tile_y = int(round(pac.position.y))
    
    var tile_type = maze.get_tile(pac_tile_x, pac_tile_y)
    if tile_type in [2, 3, 4, 5, 9]:  # Tipi di pellet
        maze.remove_pellet(pac_tile_x, pac_tile_y)
        ScoreSystem.add_score(get_pellet_value(tile_type))
        ComboSystem.register_collection()
        AudioManager.play(AudioManager.PAC_EAT_PELLET)
        ParticleSystem.spawn_pellet_collect(pac.position, tile_type)
        HungerSystem.feed(get_pellet_feed_value(tile_type))
        ProgressionSystem.add_xp(get_pellet_xp(tile_type))
```

---

## 12.5 — SISTEMA DI CAMERA

La camera di ULTRA PAC: REBORN è generalmente statica (il labirinto entra tutto nello schermo), ma ha alcune caratteristiche specifiche.

### Camera Statica Standard

Per i livelli normali (28×31 tile), il labirinto entra completamente nella risoluzione interna di 480×270 pixel (con la fascia HUD di 60 pixel in alto su 270px totali, rimangono 210px per il labirinto — il labirinto riempie orizzontalmente i 480px e verticalmente i 210px con un piccolo margine).

Il calcolo di dove posizionare la camera è semplice: la camera è centrata sul labirinto, con offset per lasciare spazio all'HUD in alto.

### Camera Dinamica (Labirinti Grandi)

Per i labirinti più grandi (come il Mondo 7, che è 10× il labirinto standard), la camera segue PAC:

```gdscript
func update_camera(delta: float) -> void:
    if maze_fits_in_screen():
        # Camera statica — posizionata al centro del labirinto
        camera.position = maze_center
    else:
        # Camera dinamica — segue PAC con smoothing
        var target = pac.position
        # Clamp ai bordi del labirinto (non mostrare oltre il labirinto)
        target.x = clamp(target.x, HALF_SCREEN_W, maze_width - HALF_SCREEN_W)
        target.y = clamp(target.y, HALF_SCREEN_H + HUD_HEIGHT, maze_height - HALF_SCREEN_H)
        # Smooth follow (lerp)
        camera.position = camera.position.lerp(target, CAMERA_SPEED * delta)
```

### Camera Shake

Il camera shake è implementato come un offset casuale applicato alla posizione della camera:

```gdscript
var shake_intensity: float = 0.0
var shake_decay: float = 5.0  # Quanto velocemente si calma

func apply_camera_shake(intensity: float) -> void:
    shake_intensity = intensity

func update_camera_shake(delta: float) -> void:
    if shake_intensity > 0:
        var shake_offset = Vector2(
            randf_range(-1, 1) * shake_intensity,
            randf_range(-1, 1) * shake_intensity
        )
        camera.offset = shake_offset
        shake_intensity = max(0, shake_intensity - shake_decay * delta)
    else:
        camera.offset = Vector2.ZERO

# Uso:
# Hit normale: apply_camera_shake(2.0)
# Boss colpito: apply_camera_shake(5.0)
# Boss morto: apply_camera_shake(10.0)
```

---

## 12.6 — SISTEMA DI SALVATAGGIO

### Cosa viene Salvato

Il save file contiene:

```json
{
  "save_version": "1.0.0",
  "timestamp": "2025-01-01T00:00:00Z",
  "player_data": {
    "level": 15,
    "xp": 45000,
    "ability_points_available": 3,
    "abilities_unlocked": ["speed_1", "speed_2", "combat_1", "score_1"],
    "pellet_coins": 1250,
    "skins_unlocked": ["default", "dark_pac"],
    "current_skin": "default"
  },
  "story_progress": {
    "current_world": 3,
    "current_level": "3_2",
    "levels_completed": ["1_1", "1_2", "1_3", "1_4", "1_5", "2_1", "2_2", "2_3", "2_4", "2_5", "3_1"],
    "levels_ratings": {"1_1": "S", "1_2": "A", ...},
    "bosses_defeated": ["blinky_prime", "pinky_witch"],
    "endings_seen": [],
    "narrative_flags": {
      "echo_met": true,
      "log_1_found": true,
      "ghost_blinky_saved": false,
      "ghost_pinky_saved": true,
      "choice_cs20": null
    }
  },
  "logs_found": [1, 3, 7, 12],
  "spirits_found": [1, 2, 5, 8, 9, 14],
  "achievements_unlocked": ["first_step", "first_blood", "revenge"],
  "statistics": {
    "total_play_time_seconds": 18450,
    "total_pellets_eaten": 45230,
    "total_ghosts_eaten": 892,
    "total_deaths": 134,
    "highest_combo": 87,
    "highest_score_single_level": 125000
  },
  "settings": {
    "volume_music": 0.8,
    "volume_sfx": 1.0,
    "volume_voice": 0.9,
    "difficulty": "normal",
    "graphics_quality": "high",
    "upscaling": "nearest_neighbor",
    "language": "it",
    "input_buffer": 0.4,
    "accessibility": {
      "hunger_bar_disabled": false,
      "scanlines_disabled": false,
      "color_blind_mode": false
    }
  }
}
```

### Formato e Posizione

- **Formato:** JSON (leggibile dall'utente, utile per debugging)
- **Posizione:** Cartella utente del sistema operativo
  - Windows: `%APPDATA%\UltraPacReborn\save_1.json` (per lo slot 1)
  - macOS: `~/Library/Application Support/UltraPacReborn/save_1.json`
  - Linux: `~/.local/share/UltraPacReborn/save_1.json`

### Crittografia e Integrità

Per evitare la modifica dei save (almeno per le classifiche):
- Il file JSON è salvato in chiaro (per moddabilità e accessibilità)
- Ma ogni file contiene un checksum SHA-256 calcolato su tutto il contenuto + un salt privato
- La classifica online accetta solo save con checksum valido
- La modalità locale non verifica il checksum (i giocatori possono modificare i propri save locali liberamente)

---

## 12.7 — SISTEMA DI CARICAMENTO ASSET

### Caricamento Iniziale (Splash Screen)

All'avvio del gioco, viene mostrata una splash screen mentre vengono caricati gli asset essenziali:
- Tutti i font
- Le texture dell'UI e del menu principale
- Le prime tracce audio (menu music, sfx UI)
- Il profilo di salvataggio

Tempo target: < 3 secondi su hardware minimo.

### Caricamento Lazy (Per Livello)

Gli asset specifici di un mondo/livello vengono caricati solo quando necessario:
- Quando il giocatore inizia il Mondo 1, vengono caricati i tileset, la musica, e le sprite del Mondo 1
- I Mondi 2-7 non sono in memoria fino a quando il giocatore non li raggiunge
- Il caricamento avviene durante la sala di riposo (la sala di riposo serve anche come "loading screen" mascherata — l'utente interagisce con la sala mentre in background carica il prossimo livello)

### Streaming Audio

La musica (file .ogg da 2-10 MB ciascuno) è in streaming — non caricata tutta in RAM ma letta dal disco progressivamente. Solo i primi 2 secondi sono pre-bufferizzati per evitare ritardi all'inizio della riproduzione.

### Gestione della VRAM

Le texture sono gestite con un sistema di "atlas packing" — texture multiple sono combinate in un singolo file PNG di grandi dimensioni (atlas texture) che viene caricato una sola volta nella VRAM. Questo riduce i "draw call" e migliora le performance.

- Atlas principale: 2048×2048 pixel (tutte le sprite del gioco — PAC, fantasmi, nemici, UI)
- Atlas tile: 1 per mondo, 512×512 pixel ciascuno
- VRAM totale stimata: < 150 MB (ben entro i limiti di hardware minimo richiesto)

---

## 12.8 — OTTIMIZZAZIONE E PERFORMANCE

### Target di Performance

- **PC minimum spec:** 60 FPS stabili a 1920×1080
- **PC recommended spec:** 60 FPS stabili a 2560×1440
- **Nintendo Switch (modalità dock):** 60 FPS a 1080p
- **Nintendo Switch (modalità portatile):** 60 FPS a 720p
- **Mobile:** 60 FPS su iPhone 12 / Samsung Galaxy S21 (2020+)
- **Mobile budget:** 30 FPS su iPhone 8 / Samsung Galaxy S10 (2017+)

### Ottimizzazioni Principali

**1. Object Pooling:**
Tutti gli oggetti che vengono creati e distrutti frequentemente (particelle, pellet, suoni) usano pool pre-allocati all'inizio del livello. Nessuna allocazione di memoria durante il gameplay.

**2. Aggiornamento Fisso (Fixed Update):**
La logica di gioco (movimento, collisioni, AI) gira a una frequenza fissa di 60 Hz, indipendente dal frame rate di rendering. Se il frame rate scende a 30 FPS, la logica continua a girare a 60 Hz (con interpolazione per il rendering). Questo garantisce che il gameplay sia deterministico.

**3. Culling dei Fantasmi:**
I fantasmi fuori dall'area visibile (nei labirinti grandi) non eseguono pathfinding completo — usano una versione semplificata finché non si avvicinano alla camera.

**4. Livelli di Qualità Grafica:**
Quattro preset di qualità (Ultra, Alto, Medio, Basso):
- **Ultra:** Tutte le particelle a massima densità, bloom di alta qualità, xBRZ upscaling, 4000 particelle massime
- **Alto:** Particelle a 2000, bloom standard, Scale2x upscaling
- **Medio:** Particelle a 1000, bloom ridotto, nearest neighbor upscaling
- **Basso:** Particelle a 500, nessun bloom, nearest neighbor, risoluzione interna ridotta a 240×135

---

## 12.9 — SISTEMA DI INPUT CROSS-PLATFORM

Il sistema di input è astratto — il gioco lavora con "azioni" (action), non con tasti specifici. Questo permette il remapping completo e il supporto di qualsiasi input device.

### Azioni Definite

```
MOVE_UP      → (Default) W, Freccia Su, Stick Sinistro Su, D-Pad Su
MOVE_DOWN    → S, Freccia Giù, Stick Sinistro Giù, D-Pad Giù
MOVE_LEFT    → A, Freccia Sinistra, Stick Sinistro Sinistra, D-Pad Sinistra
MOVE_RIGHT   → D, Freccia Destra, Stick Sinistro Destra, D-Pad Destra
ACTION_MAIN  → Space, Tasto A (Xbox), Croce (PS)
ACTION_SEC   → Shift Destro, Tasto B (Xbox), Cerchio (PS)
POWERUP_USE  → Z, Tasto X (Xbox), Quadrato (PS)
POWERUP_SWAP → X, Tasto Y (Xbox), Triangolo (PS)
BOOST        → Q, RT (Xbox), R2 (PS)
SLOW         → E, LT (Xbox), L2 (PS)
POWERUP_ROT  → R, RB (Xbox), R1 (PS)
ECHO_CALL    → F, LB (Xbox), L1 (PS)
PAUSE        → ESC, START, OPTIONS
MAP          → TAB, SELECT
```

Il sistema di input gestisce anche:
- **Coyote Time per l'input:** L'input buffering di 0.4 secondi (configurabile)
- **Dead zone del joystick:** 15% (configurabile)
- **Risoluzione dei diagonali:** Sempre priorità alla direzione con maggiore inclinazione

---

## 12.10 — NETWORKING (MULTIPLAYER ONLINE)

### Architettura

Il multiplayer online usa un modello **peer-to-peer con server di relay** per la modalità cooperativa, e **server autoritativo** per le classifiche e il matchmaking.

**Matchmaking Server:** Un server dedicato (o servizio cloud come Photon/Mirror) gestisce:
- Le classifiche globali (leaderboard)
- Il matchmaking per il Versus Online
- Il relay per le connessioni P2P (quando i giocatori non possono connettersi direttamente per via di NAT)

**Peer-to-Peer per Co-op:**
Le partite cooperative usano connessioni dirette tra i giocatori quando possibile. Il giocatore che crea la stanza è l'"host" e ha autorità sullo stato del gioco. Gli altri giocatori inviano i loro input all'host, che calcola lo stato del gioco e invia aggiornamenti di posizione agli altri.

### Rollback Networking

Per la modalità Versus, dove la latenza può influire sull'esperienza, si usa il rollback networking (GGPO-style):
1. Ogni giocatore esegue la simulazione localmente (predizione)
2. Gli input degli altri giocatori arrivano con un ritardo (latenza di rete)
3. Quando gli input ritardati arrivano, il gioco "torna indietro" allo stato del frame corrispondente e ri-simula da lì con gli input corretti
4. Se la predizione era corretta, nessuna differenza visibile. Se era sbagliata, si vede una piccola "correzione".

---

# PARTE XIII — ACCESSIBILITÀ E OPZIONI

---

## 13.0 — OPZIONI DI ACCESSIBILITÀ

ULTRA PAC: REBORN include un set completo di opzioni di accessibilità, ispirati alle linee guida CVAA e ai principi del design universale.

### Daltonismo

**Modalità Daltonismo (3 preset):**
- **Protanopia (assenza di rosso):** Blinky cambia da rosso a arancione-giallo; gli indicatori di pericolo cambiano da rosso a giallo
- **Deuteranopia (assenza di verde):** I pellet arcobaleno cambiano pattern; gli indicatori di salute cambiano
- **Tritanopia (assenza di blu):** Inky cambia da azzurro a viola; i power-up azzurri cambiano

In ogni modalità, viene aggiunto un **pattern grafico** oltre al colore per distinguere gli elementi: Blinky ha una X sul corpo, Pinky ha un cerchio, Inky ha un triangolo, Clyde ha un quadrato. Questi pattern appaiono nelle modalità daltonismo per sostituire la distinzione dei colori.

### Difficoltà Cognitiva

**Indicatori Aggiuntivi:**
- Frecce sul pavimento che indicano la direzione dei fantasmi più vicini (opzione)
- Outline rossa/verde attorno ai fantasmi (rosso = pericoloso, verde = vulnerabile) più vivida del normale
- Testo "PERICOLO!" nell'HUD quando un fantasma è entro 3 tile

**Rallentamento Generale:**
Un'opzione "Gioco al 75%" riduce la velocità di tutta la simulazione al 75% senza cambiare la difficoltà intrinseca. Utile per giocatori che hanno difficoltà con la velocità standard.

### Motricità Ridotta

**Modalità One Switch:**
PAC si muove automaticamente avanti. L'unico input è "gira" (che ruota di 90° in senso orario). Con un singolo pulsante è possibile navigare il labirinto. Non è ottimale ma permette di giocare.

**Remapping Completo:**
Tutti i tasti sono rimappabili. Nessun input richiede di premere due tasti contemporaneamente in modalità base (le combinazioni come LT+Dash sono comunque accessibili tramite remapping su tasto singolo).

**Input Repeat:**
L'input di movimento si ripete automaticamente se tenuto premuto — non è necessario premere ripetutamente per mantenere la direzione.

### Epilessia e Fotosensibilità

**Modalità Sicura per Fotosensibili:**
- Riduce l'intensità di tutti i flash (nessun flash a pieno schermo, solo flash parziali)
- Rimuove gli effetti di glitch (Mondo 3) o li riduce drasticamente
- Riduce l'intensità del bloom
- Avvisa all'inizio del gioco con un disclaimer standard

Questa opzione viene proposta automaticamente all'inizio del primo avvio con la possibilità di attivarla subito.

---

## 13.1 — LIVELLI DI DIFFICOLTÀ

Il gioco offre 4 livelli di difficoltà preimpostati più la possibilità di personalizzazione avanzata.

### Easy (Facile)

**Pubblico target:** Casual gamer, bambini, chiunque voglia godere della storia senza frustrazione.

**Modifiche rispetto al Normal:**
- Velocità fantasmi: -20%
- Durata Power Pellet: +50% (12 secondi invece di 8)
- Vite iniziali: 5
- Barra Fame: disabilitata
- Barra Adrenalina: sempre piena
- Checkpoint: sempre abilitati (con punti extra)
- I power-up negativi non appaiono
- Il parry ha finestra ampliata (0.3 secondi)
- I boss hanno HP al 70%
- Le fasi dei boss (transizioni) avvengono più lentamente

### Normal (Normale)

**Pubblico target:** Giocatori occasionali con esperienza nei giochi d'azione.

Questo è il bilanciamento "standard" descritto in tutto il documento. Nessuna modifica rispetto ai valori base.

### Hard (Difficile)

**Pubblico target:** Giocatori esperti che cercano una sfida autentica.

**Modifiche rispetto al Normal:**
- Velocità fantasmi: +15%
- Durata Power Pellet: 6 secondi (invece di 8)
- Vite iniziali: 3 (nessun bonus automatico per punteggio — le vite si guadagnano solo dal negozio e dai segreti)
- Barra Fame: abilitata e si svuota 1.5× più velocemente
- Checkpoint: disabilitati
- I power-up negativi appaiono nel labirinto
- Le stanze nascoste non hanno indicatori (nemmeno il bordo sottile dell'abilità Esplorazione 3)
- I boss hanno HP al 130% e finestre di vulnerabilità ridotte del 25%
- Blinky entra in Rage Mode prima (al 30% dei pellet invece del 50%)

### Superior (Superiore / Pacifist-Hard)

**Pubblico target:** I giocatori più hardcore. Questa difficoltà è un test di mastery.

**Modifiche rispetto a Hard:**
- Velocità fantasmi: +30%
- Durata Power Pellet: 4 secondi
- Vite iniziali: 1
- Game Over permanente (no continua con PC)
- Nessun checkpoint
- La barra Fame si svuota 2× più velocemente
- Le combinazioni di fantasmi nei livelli sono quelle più aggressive
- I boss hanno HP al 150%, nessuna "fase di respiro" tra gli attacchi
- Il budget Adrenalina si riduce più velocemente
- La musica ha una variante più intensa (un layer aggiuntivo "teso" sempre attivo)

### Personalizzazione Avanzata

Oltre ai preset, ogni singolo parametro di difficoltà può essere regolato individualmente:

- Velocità fantasmi: 50% / 75% / 100% / 125% / 150% (slider)
- Durata Power Pellet: 4 / 6 / 8 / 12 secondi (dropdown)
- Vite iniziali: 1-5 (slider)
- Checkpoint: ON/OFF
- Barra Fame: ON/OFF
- Power-up negativi: ON/OFF
- Boss HP: 50% / 70% / 100% / 130% / 150% (dropdown)

**Nota:** Le partite con difficoltà personalizzata non sono eleggibili per le classifiche globali (vengono contrassegnate come "Custom" nel profilo). Sono eleggibili per i save personali e gli achievement locali.

---

## 13.2 — OPZIONI GRAFICHE

**Risoluzione:** Lista di risoluzioni supportate dal monitor (auto-rilevata) + opzione "Finestra" vs "Schermo Intero" vs "Schermo Intero Senza Bordi (Borderless)"

**Upscaling:** Nearest Neighbor / Scale2x / xBRZ

**Frame Rate:** 30 FPS / 60 FPS / 120 FPS (per schermi ad alta frequenza) / Illimitato / V-Sync ON/OFF

**Qualità Grafica:** Ultra / Alto / Medio / Basso (preset)

**Opzioni Individuali:**
- Bloom: ON/OFF + Intensità (0.0-1.0)
- Vignette: ON/OFF
- Scanlines (solo Mondo 3): ON/OFF
- Chromatic Aberration: ON/OFF + Intensità
- Shimmer (solo Mondo 6): ON/OFF + Intensità
- Parallax Background: ON/OFF (disabilitare migliora le performance)
- Numero Massimo Particelle: 500 / 1000 / 2000 / 4000
- Ombre di PAC/Fantasmi: ON/OFF
- Animazione Fuoco sui Muri (Mondo 6): ON/OFF
- Testi HUD in Pixel Art: ON/OFF (se OFF, i testi usano il font normale senza pixel art — più leggibile su alcune configurazioni)
- Modalità Daltonismo: OFF / Protanopia / Deuteranopia / Tritanopia
- Modalità Fotosensibilità Sicura: ON/OFF

---

## 13.3 — OPZIONI AUDIO

**Volume Master:** 0-100 (slider)
**Volume Musica:** 0-100 (slider)
**Volume Effetti Sonori:** 0-100 (slider)
**Volume Doppiaggio:** 0-100 (slider)
**Volume Ambience:** 0-100 (slider, separato dagli effetti)

**Bilanciamento Audio Spaziale:** ON/OFF (il suono spaziale dei fantasmi può essere disturbante per alcune persone — disabilitarlo rende tutto più neutro in mono)

**Sottotitoli:** OFF / Solo Doppiaggio / Tutti i Suoni Importanti (comprendono indicatori testuali per suoni tattici, es. "[Fantasma Elite in avvicinamento]")

**Doppiaggio:** Italiano / Inglese / Giapponese

**Audio Ridotto durante Pausa:** ON (default) / OFF — se ON, il volume scende del 50% durante la pausa

---

## 13.4 — OPZIONI DI CONTROLLO

**Schema di controllo:** Preset per controller Xbox / PlayStation / Switch / Personalizzato

**Remapping completo:** Ogni azione può essere rimappata a qualsiasi tasto/pulsante

**Dead Zone Joystick:** 5% / 10% / 15% (default) / 20% / 25%

**Buffer di Input:** 0.2 / 0.3 / 0.4 (default) / 0.5 / 0.6 secondi

**Vibrazione Controller:** ON/OFF + Intensità 0-100%

**Vibrazione Aptiva (PS5 DualSense):** ON/OFF (feature specifica PS5)
- Feedback diverso per ogni tipo di pellet raccolto
- Resistenza dei trigger durante l'attivazione dei power-up
- Vibrazione direzionale per indicare la direzione del fantasma più vicino

**Modalità One Switch:** ON/OFF (vedi sezione Accessibilità)

**Gioco con Mouse (PC):** ON/OFF — se ON, cliccare in una direzione rispetto a PAC gli ordina di muoversi in quella direzione (meccanica alternativa)

---

## 13.5 — SUPPORTO LINGUE

**Lingue dell'interfaccia (testi):**
- Italiano ✓
- Inglese ✓
- Francese ✓
- Tedesco ✓
- Spagnolo ✓
- Portoghese (Brasile) ✓
- Giapponese ✓
- Coreano ✓
- Cinese Semplificato ✓
- Cinese Tradizionale ✓
- Russo ✓
- Polacco ✓

**Lingue del doppiaggio:** Italiano, Inglese, Giapponese

**Font per lingue CJK (Cinese/Giapponese/Coreano):** Font specifico incluso nell'installer per supporto corretto dei caratteri. Le lingue CJK richiedono un file aggiuntivo da scaricare (per ridurre la dimensione del download base).

**Localizzazione Testi:** I testi del gioco sono separati in file JSON per ogni lingua. Questo permette fan translation facilmente — i modder possono aggiungere lingue non ufficiali creando il file JSON corrispondente.

---

# PARTE XIV — MONETIZZAZIONE E POST-LANCIO

---

## 14.0 — MODELLO DI BUSINESS

**Modello:** Acquisto una tantum (buy-to-play). Nessun abbonamento, nessuna microtransazione, nessuna loot box.

**Prezzo consigliato:** 
- PC: €19,99
- Console: €24,99
- Mobile: €4,99 (prezzo ridotto per il mercato mobile, con contenuti identici)

**Cosa include il prezzo base:**
- Campagna storia completa (35 livelli + 14 segreti)
- Tutte le modalità di gioco (Arcade, Endless, Boss Rush, Survival, Speed Run, Multiplayer, Time Attack, Puzzle)
- Tutti i sistemi di progressione
- Tutte le 42 tracce musicali
- Il multiplayer online

**Nessuna microtransazione:** Tutti i contenuti in-game (skin, power-up, sblocchi) si ottengono giocando. Non è possibile acquistarli con denaro reale. Questa è una scelta etica deliberata: il gioco non deve creare sistemi di dipendenza basati su acquisti ripetuti.

**DLC:** Contenuto aggiuntivo a pagamento pianificato (vedi 14.1). Il DLC è sempre contenuto aggiuntivo genuino (nuovi livelli, nuovi personaggi), mai contenuto rimosso dal gioco base.

---

## 14.1 — DLC PIANIFICATI

### DLC 1: "ECHO'S STORY" — Campagna Aggiuntiva

**Prezzo previsto:** €7,99
**Disponibilità:** 6-9 mesi dopo il lancio

**Contenuto:**
- 15 nuovi livelli che raccontano la storia di Echo prima degli eventi del gioco principale
- 2 nuovi boss
- 8 nuove tracce musicali
- Nuove cutscene che approfondiscono il lore
- Il giocatore controlla Echo (meccaniche diverse: Echo non può mangiare i fantasmi ma può "rallentarli" temporaneamente)

### DLC 2: "ARCADE CHAMPIONS" — Pack di Livelli Classici

**Prezzo previsto:** €4,99
**Disponibilità:** 12 mesi dopo il lancio

**Contenuto:**
- 10 livelli ispirati a classici arcade (Ms. Pac-Man, Pac-Land, Pac-Man Championship Edition)
- Modalità Tribute: riproduzione fedele di scenari storici specifici
- 4 nuove tracce musicali "retro"
- 2 skin esclusive

### DLC 3: "THE GRID EXPANDED" — Nuovo Mondo

**Prezzo previsto:** €9,99
**Disponibilità:** 18 mesi dopo il lancio

**Contenuto:**
- Mondo 8 completamente nuovo: "The Quantum Realm" (dimensione quantistica con meccaniche paradossali — PAC può essere in due posti contemporaneamente)
- 5 nuovi livelli + 2 segreti
- 1 nuovo boss (Quantum Shade)
- 6 nuove tracce musicali
- Integrazione con la storia principale (rivela dettagli sul futuro di PAC dopo il Finale A)

---

## 14.2 — AGGIORNAMENTI POST-LANCIO

Gli aggiornamenti gratuiti pianificati per il primo anno:

**PATCH 1.1 (1 mese dopo lancio):** Bugfix basati sul feedback della community. Bilanciamento fine della difficoltà dei boss (se necessario). Aggiunta di opzioni di accessibilità richieste dalla community.

**PATCH 1.2 (3 mesi dopo lancio):** Sistema Daily Challenge (se non incluso al lancio). 5 nuove missioni secondarie. 10 nuovi achievement.

**UPDATE 1.5 (6 mesi dopo lancio):** Modalità Puzzle Maze (se non inclusa al lancio). Editor di livelli base per la comunità. Supporto per nuove lingue richieste dalla community.

**UPDATE 2.0 (12 mesi dopo lancio):** Grande aggiornamento gratuito con contenuti significativi (a definire in base al successo del gioco). Potrebbe includere: nuovi nemici, nuove modalità, nuovo sistema di sfide della community.

---

## 14.3 — COMMUNITY E MODDING

### Supporto al Modding

ULTRA PAC: REBORN è progettato con la community di modder in mente.

**Cosa può essere moddato facilmente:**
- **Livelli:** I livelli sono file JSON — chiunque può creare nuovi livelli con un editor di testo
- **Testi e dialoghi:** File JSON separati per ogni lingua — facili da modificare o aggiungere
- **Texture:** I file PNG possono essere sostituiti mantenendo le stesse dimensioni
- **Audio:** File .ogg e .wav con nomi standard — sostituibili

**Strumenti Ufficiali:**
- **Level Editor:** Un editor di livelli grafico incluso nel gioco (accessibile dal menu Extras)
- **Asset Documentation:** Documentazione pubblica del formato di sprite sheet per creare nuovi personaggi
- **Modding API:** Una API semplice (GDScript) per mod più avanzate (nuovi power-up, nuovi comportamenti)

### Community Ufficiale

- **Discord Server:** Server ufficiale per feedback, bug report, showcase di mod, classifiche informali
- **Pagina Steam (Workshop):** I livelli creati dalla community possono essere pubblicati su Steam Workshop e scaricati da altri giocatori
- **Reddit:** Subreddit ufficiale per discussioni, estratti dei finali, lore discussions
- **Twitter/X:** Account sviluppatore per aggiornamenti e sneak peek

### Programma di Feedback

I giocatori possono inviare feedback in-game (pulsante dedicato nel menu pause). I report vengono categorizzati automaticamente (bug, bilanciamento, suggerimento) e inviati al team di sviluppo con metadati di gioco anonimi (sistema scelto, versione, livello corrente al momento del report).

---

# APPENDICE A — TABELLE DI RIFERIMENTO RAPIDO

---

## A.1 — TABELLA RIASSUNTIVA DEI POWER-UP

| # | Nome | Tier | Durata | Effetto Principale | Stackable |
|---|------|------|--------|-------------------|-----------|
| 1 | Power Pellet | Base | 8s | Fantasmi vulnerabili | No |
| 2 | Speed Rush | 1 | 15s | +50% velocità | No (resetta) |
| 3 | Shield Bubble | 1 | Finché colpito | Assorbe 1-3 danni | Sì (3x) |
| 4 | Magnet | 1 | 20s | Attira pellet in 4 tile | No |
| 5 | Freeze Time | 1 | 5s | Ferma tutti i fantasmi | No (aggiunge 3s) |
| 6 | Point Doubler | 1 | 30s | Punti ×2 | No |
| 7 | Ghost Vision | 1 | 25s | Vedi fantasmi attraverso muri | No |
| 8 | Fire Form | 2 | 20s | Stordisce fantasmi al contatto | No |
| 9 | Ice Form | 2 | 20s | Congela fantasmi al contatto | No |
| 10 | Shadow Form | 2 | 15s | Invisibilità ai fantasmi | No |
| 11 | Giant Form | 2 | 12s | ×3 dimensione, mangia tutto | No |
| 12 | Mirror Clone | 2 | 18s | Due cloni speculari | No |
| 13 | Teleport Dash | 2 | 20s | Dash diventa teletrasporto ×8 tile | No |
| 14 | Omega Form | 3 | 30s | Invincibile, tutto mangiabile, ×3 velocità | No |
| 15 | Void Form | 3 | 25s | Distrugge muri, spaventa fantasmi | No |
| 16 | Quantum Form | 3 | 20s | Si divide in 3 copie | No |
| 17 | Reverse | Curse | 10s | Controlli invertiti | — |
| 18 | Slow Curse | Curse | 15s | Velocità dimezzata | — |
| 19 | Blind | Curse | 8s | Visione ridotta a 3 tile | — |
| 20 | Hungry Curse | Curse | 20s | Fame ×5 più veloce | — |

---

## A.2 — TABELLA DEI PUNTI

| Azione | Punti Base |
|--------|-----------|
| Pellet standard | 10 |
| Pellet dorato | 50 |
| Pellet arcobaleno | 25 |
| Pellet fantasma | 100 |
| Power Pellet | 50 |
| 1° fantasma (Power Pellet) | 200 |
| 2° fantasma consecutivo | 400 |
| 3° fantasma consecutivo | 800 |
| 4° fantasma consecutivo | 1600 |
| Ciliegia (Lv 1-2) | 100 |
| Fragola (Lv 3-4) | 300 |
| Arancia (Lv 5-6) | 500 |
| Mela (Lv 7-8) | 700 |
| Neon Melon | 1000 |
| Crystal Berry | 1500 |
| Void Peach | 2000 |
| Quantum Apple | 3000 |
| Origin Grape | 5000 |
| Completamento livello (base) | 500 |
| Bonus velocità (max) | 3000 |
| Bonus perfezione (0 vite perse) | 2000 |
| Perfect Clear (100% pellet) | 5000 |
| Parry riuscito | 100 |
| Parry Perfetto (bonus) | 300 |
| Spirito Dati raccolto | 500 |

---

## A.3 — TABELLA DEI NEMICI — RIEPILOGO

| Nome | Mondo Intro | Velocità vs PAC | Abilità Speciale | Vulnerabile a |
|------|-------------|----------------|-----------------|---------------|
| Blinky | 1 | 75-140% | Rage Mode, Chase Memory | Power Pellet |
| Pinky | 1 | 75-140% | Mirror Walk, Emotional Lure | Power Pellet |
| Inky | 2 | 75-140% | Phase Shift, Fragmentation | Power Pellet |
| Clyde | 3 | 75-140% | Wisdom Ward, Slow Aura | Power Pellet |
| Ghost Patrol | 1 | 60% | Percorso fisso | Power Pellet |
| Candy Creeper | 2 | 40% | Immune a Power Pellet | Contatto (2°) |
| Sugar Slime | 2 | 50% | Scia rallentante | Power Pellet |
| Stalker | 2 | 80% (burst 400%) | Ambush, invisibilità | Power Pellet |
| Frenzy Ghost | 3 | 150% | Accelerazione da pellet | Power Pellet (no rallenta) |
| Seeker | 4 | 60% (150% allerta) | Fascio laser-sensore | Power Pellet |
| Mimic Pellet | 3 | 0.5 tile/s | Stordimento al contatto | Nessuno |
| Doppelganger | 5 | Uguale a PAC | Segue passato di PAC | Shadow Form |
| Wall Builder | 4 | 30% | Costruisce muri temp. | Power Pellet |
| Gravity Anchor | 5 | 0 | Campo gravitazionale | Power Pellet (800 pt) |

---

## A.4 — STRUTTURA COMPLETA DEI LIVELLI

| Livello | Nome | Mondo | Gimmick | Boss |
|---------|------|-------|---------|------|
| 1-1 | First Steps | Neon City | Labirinto classico originale | — |
| 1-2 | Urban Maze | Neon City | Corridoi più larghi | — |
| 1-3 | Crossroads | Neon City | Prime zone d'ombra | — |
| 1-4 | Neon Rain | Neon City | Tempeste che accelerano i fantasmi | — |
| 1-5 | The Hunt Begins | Neon City | — | Blinky Prime |
| 2-1 | Candy Entrance | Candy Caverns | Correnti di zucchero favorevoli | — |
| 2-2 | Crystal Caves | Candy Caverns | Correnti avverse + Candy Creeper | — |
| 2-3 | Sugar Rush | Candy Caverns | Correnti crescenti | Mini-Boss |
| 2-4 | The Melting Room | Candy Caverns | Muri che si sciolgono | — |
| 2-5 | Queen's Domain | Candy Caverns | Forma a castello | Pinky Witch |
| 3-1 | Glitch Intro | Glitch Dimension | Glitch ogni 30s | — |
| 3-2 | Corridoi Lampeggianti | Glitch Dimension | Glitch ogni 15s + corridoi lampeggianti | — |
| 3-3 | Inky's Chaos | Glitch Dimension | Inky come nemico normale | Mini-Boss |
| 3-4 | Camera Glitch | Glitch Dimension | Camera che si glitcha | — |
| 3-5 | Unstable Arena | Glitch Dimension | Glitch ogni 5s in boss fight | Inky the Void |
| 4-1 | The Crypt | Haunted Lab. | Molti corridoi ciechi | — |
| 4-2 | Gallery of Ghosts | Haunted Lab. | Fantasmi Residui | — |
| 4-3 | The Belfry | Haunted Lab. | Stordimento da campana | Mini-Boss |
| 4-4 | Midnight Maze | Haunted Lab. | Quasi completamente buio | — |
| 4-5 | Prime Hunt | Haunted Lab. | Labirinto circolare | Blinky Prime (v2) |
| 5-1 | The Atrium | Crystal Void | Ampio e aperto | — |
| 5-2 | Mirror Hall | Crystal Void | Simmetria perfetta | — |
| 5-3 | The Archive | Crystal Void | Memorie dai pellet | Mini-Boss |
| 5-4 | Prismatic Maze | Crystal Void | Corridoi cambiano colore | — |
| 5-5 | Crystal Heart | Crystal Void | Arena 40×40 | Clyde the Titan |
| 6-1 | Burning Corridors | Cyber Hell | Intro Pareti di Fuoco | — |
| 6-2 | Collapse | Cyber Hell | Corridoi bloccati da macerie | — |
| 6-3 | The Siege | Cyber Hell | Numero massimo nemici | Mini-Boss |
| 6-4 | Split Screen | Cyber Hell | Telecamera divisa | — |
| 6-5 | Oracle's Chamber | Cyber Hell | Arena che si restringe | Corrupted Oracle |
| 7-1 | The Original | Origin Maze | Labirinto classico ×10 | — |
| 7-2 | Shifting Styles | Origin Maze | Labirinto cambia stile | — |
| 7-3 | Shadow of Self | Origin Maze | — | PAC-SHADOW (segreto) |
| 7-4 | The Silent Maze | Origin Maze | Nessun nemico, pellet-messaggio | — |
| 7-5 | The Final Battle | Origin Maze | — | THE DEVOURER |

---

# APPENDICE B — GLOSSARIO TECNICO

Questa sezione definisce tutti i termini tecnici usati nel documento per i programmatori non esperti.

**AI (Intelligenza Artificiale):** In questo contesto, si riferisce agli algoritmi che controllano il comportamento dei nemici. Non è "intelligenza artificiale" nel senso moderno (machine learning), ma logica di programmazione classica.

**Alpha:** La trasparenza di un elemento grafico. Alpha 0% = invisibile. Alpha 100% = completamente visibile.

**Aspect Ratio:** Il rapporto tra larghezza e altezza dello schermo. 16:9 è lo standard moderno.

**BFS (Breadth-First Search):** Un algoritmo per trovare il percorso più breve in una griglia. Funziona esplorando tutte le tile adiacenti prima di procedere più lontano.

**BPM (Beats Per Minute):** Il ritmo della musica. 120 BPM = 2 battiti al secondo.

**Buffer di Input:** Un sistema che "ricorda" l'ultimo tasto premuto per un breve periodo, permettendo input leggermente anticipati.

**Chromatic Aberration:** Effetto visivo che sposta i canali di colore (rosso, verde, blu) di qualche pixel, simulando la distorsione di un obiettivo difettoso.

**Coyote Time:** Una concessione al giocatore: il sistema risponde a certi input anche se arrivano leggermente "in ritardo" rispetto al momento ideale.

**Culling:** Il processo di non renderizzare o non aggiornare oggetti fuori dalla vista.

**Delta Time:** Il tempo trascorso dall'ultimo frame. Usato per rendere il movimento indipendente dal frame rate.

**DXA (Device Independent Pixel / Drawing Unit):** Unità di misura usata nei documenti Word. 1440 DXA = 1 pollice.

**ELO:** Un sistema di ranking competitivo. Chi vince contro avversari forti guadagna molti punti; chi perde contro avversari deboli ne perde pochi.

**FSM (Finite State Machine):** Un sistema che descrive il comportamento come una serie di "stati" (es. CHASE, SCATTER) con transizioni definite tra di essi.

**FIFO (First In, First Out):** Il primo oggetto inserito in una coda è il primo ad essere rimosso.

**Glow/Bloom:** Effetto grafico che fa "sanguinare" la luce attorno agli elementi luminosi.

**HUD (Heads-Up Display):** L'interfaccia visiva sovrapposta al gioco (punteggio, vite, barre, ecc.).

**Lerp (Linear Interpolation):** Interpolazione lineare — calcola un valore intermedio tra due valori in base a un parametro (es. posizione della camera tra il punto attuale e il target).

**Nearest Neighbor:** Algoritmo di upscaling che duplica i pixel senza sfumare — mantiene l'aspetto pixelato della pixel art.

**Object Pooling:** Tecnica di ottimizzazione che pre-crea un set di oggetti riutilizzabili invece di crearne e distruggerli continuamente durante il gioco.

**Parallax Scrolling:** Tecnica dove layer più lontani si muovono più lentamente di quelli vicini, creando l'illusione di profondità.

**Pathfinding:** Il calcolo del percorso più breve tra due punti in un labirinto.

**Pixel Art:** Arte creata con singoli pixel come elemento base, tipica dei videogiochi classici.

**Post-Processing:** Effetti visivi applicati sull'immagine già renderizzata (bloom, vignette, ecc.).

**PEGI:** Sistema europeo di classificazione dei videogiochi per età.

**Rollback Networking:** Tecnica di networking per giochi online dove le predizioni vengono "rollback" e ricalcolate quando arrivano input in ritardo dalla rete.

**Seed:** Un numero iniziale usato per la generazione pseudocasuale. Lo stesso seed produce sempre gli stessi risultati.

**Sprite:** Un'immagine 2D usata per rappresentare un personaggio o un oggetto nel gioco.

**Sprite Sheet:** Un file immagine che contiene molti sprite organizzati in griglia, uno per ogni frame di animazione.

**Tile:** Un singolo blocco della griglia di un labirinto (tipicamente 16×16 o 32×32 pixel).

**Tilemap/Tileset:** La griglia di tile che compone l'ambiente di gioco.

**VRAM:** La memoria video della GPU (scheda grafica). Usata per le texture.

**V-Sync:** Sincronizzazione verticale — limita il frame rate al refresh rate del monitor per evitare tearing.

---

# APPENDICE C — NOTE FINALI PER IL PROGRAMMATORE

Sei arrivato alla fine del documento. Hai tra le mani un progetto ambizioso — forse il più ambizioso che hai mai affrontato. Questo non è un problema. È un'opportunità.

**Suggerimento 1: Inizia dal Prototipo**

Non iniziare dal sistema di missioni o dal sistema di crafting. Inizia dal cuore: PAC che si muove in un labirinto e raccoglie pellet. Un labirinto. Un personaggio. I pellet. I fantasmi con il comportamento base. Quando questo funziona — quando si "sente" giusto, quando il movimento è reattivo, quando la raccolta dei pellet è soddisfacente — aggiunge tutto il resto, un sistema alla volta.

**Suggerimento 2: Testa Continuamente**

Ogni nuova meccanica va testata da qualcuno che non è il programmatore. Il programmatore conosce il sistema e compensa inconsciamente i suoi difetti. Un utente esterno trova immediatamente i problemi di UX.

**Suggerimento 3: Scope Creep è il Nemico**

Questo documento descrive un gioco grande. Non è necessario implementare tutto in una prima versione. Una versione 1.0 potrebbe includere:
- Mondo 1, 2, 3 (15 livelli)
- Power-up Tier 1 e 2
- Sistema di punteggio e combo base
- 2 boss (Blinky Prime, Pinky Witch)
- Modalità Storia e Arcade Classica

Questo sarebbe già un gioco completo e vendibile. Le parti aggiuntive possono venire con gli update.

**Suggerimento 4: Il "Feel" Viene Prima della Grafica**

Un gioco con grafica placeholder ma meccaniche perfette è infinitamente migliore di un gioco bellissimo ma che si sente male da giocare. Investi nell'ottenere il movimento di PAC perfetto — reattivo, preciso, soddisfacente — prima di qualsiasi altra cosa.

**Suggerimento 5: Studia l'Originale**

Prima di scrivere una sola riga di codice, gioca a Pac-Man originale per almeno un'ora. Poi gioca a Pac-Man Championship Edition DX per un'ora. Senti come si muovono i personaggi. Senti il ritmo. Capisci perché funzionano. Poi costruisci su quella base.

---

**BUONA FORTUNA.**

*"Mangia. Sopravvivi. Evolvi."*

*— ULTRA PAC: REBORN, Game Design Document Versione 1.0 — COMPLETATO*

---

**Fine del Documento**

*Documento totale: Parti I-XIV + Appendici A, B, C*
*Sezioni coperte da questa continuazione: 8.5 → 14.3 + Appendici*
