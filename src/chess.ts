// Type definitions
type Piece = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P' | 'k' | 'q' | 'r' | 'b' | 'n' | 'p';
type PlayerColor = 'white' | 'black';
type BoardCell = Piece | null;
type Board = BoardCell[][];
type Coord = [number, number];
type Move = Coord;

interface PieceSkin {
    id: string;
    name: string;
    price: number;
    pieces: Record<Piece, string>;
}

interface BoardSkin {
    id: string;
    name: string;
    price: number;
    light: string;
    dark: string;
}

interface ShopData {
    coins: number;
    ownedSkins: { pieces: string[]; boards: string[] };
    equippedSkin: string;
    equippedBoard: string;
    adsWatchedToday: number;
    adWatchDate: string | null;
}

// Piece Unicode mappings
const P: Record<Piece, string> = {
    K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
    k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
};

// Piece Skins
const PIECE_SKINS: PieceSkin[] = [
    { id: 'default', name: 'Classic', price: 0, pieces: { K:'♔', Q:'♕', R:'♖', B:'♗', N:'♘', P:'♙', k:'♚', q:'♛', r:'♜', b:'♝', n:'♞', p:'♟' } },
    { id: 'gold', name: 'Gold Royal', price: 50, pieces: { K:'⚜', Q:'⟆', R:'⛉', B:'⟡', N:'⛊', P:'✿', k:'☿', q:'❂', r:'ჯ', b:'ღ', n:'✦', p:'✧' } },
    { id: 'neon', name: 'Neon Glow', price: 75, pieces: { K:'★', Q:'✡', R:'◈', B:'◇', N:'⬡', P:'✦', k:'☠', q:'⚡', r:'✦', b:'✧', n:'⚔', p:'♦' } },
    { id: 'emoji', name: 'Emoji Style', price: 100, pieces: { K:'👑', Q:'👸', R:'🏰', B:'🎭', N:'🐴', P:'👶', k:'🤴', q:'👸', r:'🏰', b:'🎭', n:'🐴', p:'👶' } },
    { id: 'fire', name: 'Fire Elements', price: 150, pieces: { K:'🔥', Q:'✨', R:'💎', B:'🌟', N:'⚡', P:'💥', k:'❄', q:'🌙', r:'🍃', b:'🌸', n:'🌊', p:'⚽' } },
    { id: 'space', name: 'Space Age', price: 200, pieces: { K:'🛸', Q:'🌍', R:'🚀', B:'🌙', N:'☄', P:'⭐', k:'🪐', q:'🌟', r:'☀️', b:'🌛', n:'🌜', p:'🌠' } },
];

// Board Skins
const BOARD_SKINS: BoardSkin[] = [
    { id: 'classic', name: 'Classic Wood', price: 0, light: '#f0d9b5', dark: '#b58863' },
    { id: 'marble', name: 'Marble', price: 100, light: '#e8e8e8', dark: '#4a4a4a' },
    { id: 'ocean', name: 'Ocean Blue', price: 150, light: '#a8d8ea', dark: '#1e3a5f' },
    { id: 'forest', name: 'Forest Green', price: 150, light: '#90EE90', dark: '#228B22' },
    { id: 'sunset', name: 'Sunset', price: 200, light: '#FFDAB9', dark: '#FF6347' },
    { id: 'purple', name: 'Royal Purple', price: 250, light: '#DDA0DD', dark: '#4B0082' },
];

// Game state
let board: Board = [];
let turn: PlayerColor = 'white';
let sel: Coord | null = null;
let moves: Move[] = [];
let capW: Piece[] = [];
let capB: Piece[] = [];
let over: boolean = false;
let coins: number = 0;
let adsWatchedToday: number = 0;
let adWatchDate: string | null = null;
let ownedSkins: { pieces: string[]; boards: string[] } = { pieces: ['default'], boards: ['classic'] };
let equippedSkin: string = 'default';
let equippedBoard: string = 'classic';
let gameMode: string = 'pvp';
let aiLevel: number = 0;

const audioCtx: AudioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

function playSound(type: string): void {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;

    if (type === 'move') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'capture') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'check') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(600, now + 0.1);
        osc.frequency.setValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.setValueAtTime(0.1, now + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
    } else if (type === 'mate') {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.15);
            gain.gain.setValueAtTime(0.15, now + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.3);
            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.3);
        });
    } else if (type === 'coin') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.setValueAtTime(1500, now + 0.05);
        osc.frequency.setValueAtTime(1800, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'click') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(400, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    } else if (type === 'select') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(500, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    }
}

function playSoundSafe(type: string): void {
    try { playSound(type); } catch(e) {}
}

function init(): void {
    loadData();
    const br = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    board = [];
    for (let r = 0; r < 8; r++) {
        board[r] = [];
        for (let c = 0; c < 8; c++) {
            if (r === 0) board[r][c] = br[c] as Piece;
            else if (r === 1) board[r][c] = 'p';
            else if (r === 6) board[r][c] = 'P';
            else if (r === 7) board[r][c] = br[c].toUpperCase() as Piece;
            else board[r][c] = null;
        }
    }
}

function loadData(): void {
    const saved = localStorage.getItem('chessShop');
    if (saved) {
        const data: ShopData = JSON.parse(saved);
        coins = data.coins || 0;
        ownedSkins = data.ownedSkins || { pieces: ['default'], boards: ['classic'] };
        equippedSkin = data.equippedSkin || 'default';
        equippedBoard = data.equippedBoard || 'classic';

        const today = new Date().toDateString();
        if (data.adWatchDate !== today) {
            adsWatchedToday = 0;
            adWatchDate = today;
        } else {
            adsWatchedToday = data.adsWatchedToday || 0;
            adWatchDate = data.adWatchDate;
        }
    }
    updateCoinDisplay();
    updateAdButton();
}

function saveData(): void {
    const data: ShopData = {
        coins,
        ownedSkins,
        equippedSkin,
        equippedBoard,
        adsWatchedToday,
        adWatchDate: adWatchDate || new Date().toDateString()
    };
    localStorage.setItem('chessShop', JSON.stringify(data));
}

function addCoins(amount: number): void {
    coins += amount;
    updateCoinDisplay();
    saveData();
    if (amount > 0) playSoundSafe('coin');
}

function updateCoinDisplay(): void {
    const coinCountEl = document.getElementById('coinCount');
    const shopCoinsEl = document.getElementById('shopCoins');
    if (coinCountEl) coinCountEl.textContent = coins.toString();
    if (shopCoinsEl) shopCoinsEl.textContent = coins.toString();
}

function updateAdButton(): void {
    const btn = document.getElementById('watchAdBtn') as HTMLButtonElement | null;
    const remaining = 5 - adsWatchedToday;
    if (btn) {
        if (remaining <= 0) {
            btn.disabled = true;
            btn.textContent = 'No more today';
        } else {
            btn.disabled = false;
            btn.textContent = `Watch Ad (${remaining} left)`;
        }
    }
}

function openShop(): void {
    document.getElementById('shopOverlay')?.classList.add('active');
    renderSkins();
}

function closeShop(): void {
    document.getElementById('shopOverlay')?.classList.remove('active');
}

function renderSkins(): void {
    const pieceGrid = document.getElementById('skinGrid');
    const boardGrid = document.getElementById('boardSkinGrid');

    if (pieceGrid) {
        pieceGrid.innerHTML = PIECE_SKINS.map(skin => {
            const owned = ownedSkins.pieces.includes(skin.id);
            const equipped = equippedSkin === skin.id;
            const btnClass = owned ? (equipped ? 'equipped' : 'equip') : 'buy';
            const btnText = equipped ? 'Equipped ★' : (owned ? 'Equip' : `Buy ${skin.price} 🪙`);

            return `
                <div class="skin-card ${owned ? 'owned' : ''} ${equipped ? 'equipped' : ''}" onclick="togglePieceSkin('${skin.id}')">
                    <div class="skin-preview">${skin.pieces.K}</div>
                    <div class="skin-name">${skin.name}</div>
                    ${owned ?
                        `<div class="skin-owned">Owned</div>` :
                        `<div class="skin-price">🪙 ${skin.price}</div>`
                    }
                    <button class="skin-equip-btn ${btnClass}">${btnText}</button>
                </div>
            `;
        }).join('');
    }

    if (boardGrid) {
        boardGrid.innerHTML = BOARD_SKINS.map(skin => {
            const owned = ownedSkins.boards.includes(skin.id);
            const equipped = equippedBoard === skin.id;
            const btnClass = owned ? (equipped ? 'equipped' : 'equip') : 'buy';
            const btnText = equipped ? 'Equipped ★' : (owned ? 'Equip' : `Buy ${skin.price} 🪙`);

            return `
                <div class="skin-card ${owned ? 'owned' : ''} ${equipped ? 'equipped' : ''}" onclick="toggleBoardSkin('${skin.id}')">
                    <div class="skin-preview">
                        <div style="display: flex; gap: 2px;">
                            <div style="width: 30px; height: 30px; background: ${skin.light}; border-radius: 3px;"></div>
                            <div style="width: 30px; height: 30px; background: ${skin.dark}; border-radius: 3px;"></div>
                        </div>
                    </div>
                    <div class="skin-name">${skin.name}</div>
                    ${owned ?
                        `<div class="skin-owned">Owned</div>` :
                        `<div class="skin-price">🪙 ${skin.price}</div>`
                    }
                    <button class="skin-equip-btn ${btnClass}">${btnText}</button>
                </div>
            `;
        }).join('');
    }
}

function togglePieceSkin(id: string): void {
    const skin = PIECE_SKINS.find(s => s.id === id);
    if (!skin) return;

    if (ownedSkins.pieces.includes(id)) {
        equippedSkin = id;
        saveData();
        renderSkins();
        render();
    } else {
        if (coins >= skin.price) {
            coins -= skin.price;
            ownedSkins.pieces.push(id);
            equippedSkin = id;
            updateCoinDisplay();
            saveData();
            renderSkins();
            render();
        } else {
            alert(`Not enough coins! Need ${skin.price} 🪙`);
        }
    }
}

function toggleBoardSkin(id: string): void {
    const skin = BOARD_SKINS.find(s => s.id === id);
    if (!skin) return;

    if (ownedSkins.boards.includes(id)) {
        equippedBoard = id;
        saveData();
        renderSkins();
        render();
    } else {
        if (coins >= skin.price) {
            coins -= skin.price;
            ownedSkins.boards.push(id);
            equippedBoard = id;
            updateCoinDisplay();
            saveData();
            renderSkins();
            render();
        } else {
            alert(`Not enough coins! Need ${skin.price} 🪙`);
        }
    }
}

function watchAd(): void {
    if (adsWatchedToday >= 5) {
        updateAdButton();
        return;
    }

    const adModal = document.getElementById('adModal');
    const adContent = document.getElementById('adContent');
    const adComplete = document.getElementById('adComplete');
    const timer = document.getElementById('adTimer');

    adModal?.classList.add('active');
    if (adContent) adContent.style.display = 'block';
    adComplete?.classList.remove('active');

    let countdown = 5;
    if (timer) timer.textContent = countdown.toString();

    const interval = setInterval(() => {
        countdown--;
        if (timer) timer.textContent = countdown.toString();
        if (countdown <= 0) {
            clearInterval(interval);
            adsWatchedToday++;
            adWatchDate = new Date().toDateString();
            addCoins(15);
            saveData();
            updateAdButton();

            if (adContent) adContent.style.display = 'none';
            adComplete?.classList.add('active');
        }
    }, 1000);
}

function closeAdModal(): void {
    document.getElementById('adModal')?.classList.remove('active');
}

function getCurrentPieceSkin(): Record<Piece, string> {
    const skin = PIECE_SKINS.find(s => s.id === equippedSkin);
    return skin ? skin.pieces : P;
}

function getCurrentBoardSkin(): { light: string; dark: string } {
    const skin = BOARD_SKINS.find(s => s.id === equippedBoard);
    if (skin) return { light: skin.light, dark: skin.dark };
    equippedBoard = 'classic';
    return { light: '#f0d9b5', dark: '#b58863' };
}

function col(p: Piece | null): PlayerColor | null {
    if (!p) return null;
    return p === p.toUpperCase() ? 'white' : 'black';
}

function findK(c: PlayerColor): Coord | null {
    const k: Piece = c === 'white' ? 'K' : 'k';
    for (let r = 0; r < 8; r++)
        for (let cc = 0; cc < 8; cc++)
            if (board[r][cc] === k) return [r, cc];
    return null;
}

function attacked(r: number, c: number, by: PlayerColor): boolean {
    for (let rr = 0; rr < 8; rr++)
        for (let cc = 0; cc < 8; cc++) {
            const p = board[rr][cc];
            if (p && col(p) === by) {
                const m = raw(rr, cc, p, true);
                if (m.some(x => x[0] === r && x[1] === c)) return true;
            }
        }
    return false;
}

function inCheck(c: PlayerColor): boolean {
    const k = findK(c);
    if (!k) return false;
    return attacked(k[0], k[1], c === 'white' ? 'black' : 'white');
}

function raw(r: number, c: number, p: Piece, atk: boolean): Move[] {
    const moves: Move[] = [];
    const tc = col(p);
    if (!tc) return moves;
    const t = p.toLowerCase();

    const add = (dr: number, dc: number): void => {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            if (atk) moves.push([nr, nc]);
            else if (!board[nr][nc]) moves.push([nr, nc]);
            else if (col(board[nr][nc]) !== tc) moves.push([nr, nc]);
        }
    };

    const ray = (dr: number, dc: number): void => {
        for (let i = 1; i < 8; i++) {
            const nr = r + dr * i, nc = c + dc * i;
            if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
            if (board[nr][nc]) {
                if (col(board[nr][nc]) !== tc) moves.push([nr, nc]);
                break;
            }
            moves.push([nr, nc]);
        }
    };

    switch (t) {
        case 'p':
            const dir = tc === 'white' ? -1 : 1;
            if (!atk) {
                if (!board[r + dir]?.[c]) {
                    moves.push([r + dir, c]);
                    const start = tc === 'white' ? 6 : 1;
                    if (r === start && !board[r + dir * 2]?.[c])
                        moves.push([r + dir * 2, c]);
                }
            }
            for (const dc of [-1, 1]) {
                const nr = r + dir, nc = c + dc;
                if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                    if (atk || (board[nr][nc] && col(board[nr][nc]) !== tc))
                        moves.push([nr, nc]);
                }
            }
            break;
        case 'n':
            [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([dr, dc]) => add(dr, dc));
            break;
        case 'b':
            [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => ray(dr, dc));
            break;
        case 'r':
            [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => ray(dr, dc));
            break;
        case 'q':
            [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]].forEach(([dr, dc]) => ray(dr, dc));
            break;
        case 'k':
            [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]].forEach(([dr, dc]) => add(dr, dc));
            break;
    }
    return moves;
}

function valid(r: number, c: number): Move[] {
    const p = board[r][c];
    if (!p) return [];
    const c2 = col(p);
    if (!c2) return [];
    return raw(r, c, p, false).filter(([nr, nc]) => {
        const b = board[nr][nc];
        board[nr][nc] = p;
        board[r][c] = null;
        const chk = inCheck(c2);
        board[r][c] = p;
        board[nr][nc] = b;
        return !chk;
    });
}

function render(): void {
    const el = document.getElementById('board');
    if (!el) return;
    el.innerHTML = '';
    const skin = getCurrentPieceSkin();
    const boardSkin = getCurrentBoardSkin();

    for (let r = 0; r < 8; r++) {
        const row = document.createElement('div');
        row.className = 'row';

        for (let c = 0; c < 8; c++) {
            const sq = document.createElement('div');
            const light = (r + c) % 2 === 0;
            sq.className = 'sq';
            sq.style.background = light ? boardSkin.light : boardSkin.dark;
            sq.dataset.r = r.toString();
            sq.dataset.c = c.toString();

            if (sel && sel[0] === r && sel[1] === c) sq.classList.add('selected');
            if (moves.some(m => m[0] === r && m[1] === c))
                sq.classList.add(board[r][c] ? 'capture' : 'valid');

            const pc = board[r][c];
            if (pc) {
                const sp = document.createElement('span');
                sp.className = 'pc';
                sp.textContent = skin[pc] || P[pc];
                const pieceColor = pc === pc.toUpperCase() ? '#fff' : '#111';
                sp.style.color = pieceColor;
                if (equippedSkin !== 'default') {
                    sp.style.textShadow = '0 2px 4px rgba(0,0,0,0.5)';
                }
                sq.appendChild(sp);
            }

            sq.onclick = () => click(r, c);
            row.appendChild(sq);
        }

        el.appendChild(row);
    }

    const st = document.getElementById('status');
    if (st) {
        st.className = 'game-status ' + (turn === 'white' ? 'status-white' : 'status-black');
        if (inCheck(turn)) {
            st.classList.add('status-check');
            st.textContent = turn === 'white' ? "White is in CHECK!" : "Black is in CHECK!";
        } else {
            st.textContent = turn === 'white' ? "White's Turn" : "Black's Turn";
        }
    }

    const capWEl = document.getElementById('capW');
    const capBEl = document.getElementById('capB');
    if (capWEl) capWEl.innerHTML = capW.map(p => `<span>${P[p]}</span>`).join('');
    if (capBEl) capBEl.innerHTML = capB.map(p => `<span>${P[p]}</span>`).join('');
}

function click(r: number, c: number): void {
    if (over) return;
    if (gameMode !== 'pvp' && turn === 'black' && aiLevel > 0) return;

    const p = board[r][c];

    if (sel) {
        if (moves.some(m => m[0] === r && m[1] === c)) {
            const isCapture = board[r][c] !== null;
            move(sel[0], sel[1], r, c);
            playSoundSafe(isCapture ? 'capture' : 'move');
            sel = null;
            moves = [];
            return;
        }
        if (p && col(p) === turn) {
            playSoundSafe('select');
            sel = [r, c];
            moves = valid(r, c);
        } else {
            sel = null;
            moves = [];
        }
    } else {
        if (p && col(p) === turn) {
            playSoundSafe('select');
            sel = [r, c];
            moves = valid(r, c);
        }
    }
    render();
}

function move(fr: number, fc: number, tr: number, tc: number): void {
    const p = board[fr][fc];
    if (!p) return;
    const cap = board[tr][tc];

    if (cap) {
        if (col(cap) === 'white') capB.push(cap);
        else capW.push(cap);
    }

    board[tr][tc] = p;
    board[fr][fc] = null;

    if (p.toLowerCase() === 'p' && (tr === 0 || tr === 7))
        board[tr][tc] = turn === 'white' ? 'Q' : 'q';

    turn = turn === 'white' ? 'black' : 'white';

    if (mate()) {
        over = true;
        addCoins(25);
        playSoundSafe('mate');
        showOver(turn === 'white' ? 'Black' : 'White', 'CHECKMATE!');
    } else if (stalemate()) {
        over = true;
        addCoins(5);
        playSoundSafe('mate');
        showOver('Neither', 'STALEMATE - Draw!');
    } else {
        render();
        if (inCheck(turn)) playSoundSafe('check');
        if (gameMode !== 'pvp' && turn === 'black' && aiLevel > 0) {
            setTimeout(aiMove, 500);
        }
    }
}

function aiMove(): void {
    if (over || turn !== 'black') return;

    interface PieceWithMoves { r: number; c: number; moves: Move[] }
    const pieces: PieceWithMoves[] = [];
    for (let r = 0; r < 8; r++)
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && col(p) === 'black') {
                const vm = valid(r, c);
                if (vm.length > 0) pieces.push({ r, c, moves: vm });
            }
        }

    if (pieces.length === 0) return;

    interface MoveChoice { from: Coord; to: Coord }
    let aiMoveChoice: MoveChoice | null = null;

    if (aiLevel === 1) {
        const pc = pieces[Math.floor(Math.random() * pieces.length)];
        aiMoveChoice = { from: [pc.r, pc.c], to: pc.moves[Math.floor(Math.random() * pc.moves.length)] };
    } else if (aiLevel === 2) {
        const captures = pieces.filter(x => x.moves.some(m => board[m[0]][m[1]] !== null));
        if (captures.length > 0) {
            const pc = captures[Math.floor(Math.random() * captures.length)];
            const captureMove = pc.moves.find(m => board[m[0]][m[1]] !== null);
            if (captureMove) {
                aiMoveChoice = { from: [pc.r, pc.c], to: captureMove };
            }
        }
        if (!aiMoveChoice) {
            const pc = pieces[Math.floor(Math.random() * pieces.length)];
            aiMoveChoice = { from: [pc.r, pc.c], to: pc.moves[Math.floor(Math.random() * pc.moves.length)] };
        }
    } else {
        let bestScore = -1000;
        const candidates: MoveChoice[] = [];
        for (const pc of pieces) {
            for (const m of pc.moves) {
                let score = 0;
                const cap = board[m[0]][m[1]];
                if (cap) score = 10;
                if (m[0] === 7 || m[0] === 0) score += 3;
                if (Math.random() < 0.3) score += Math.random() * 2;
                if (score > bestScore) {
                    bestScore = score;
                    candidates.length = 0;
                    candidates.push({ from: [pc.r, pc.c], to: m });
                } else if (score === bestScore) {
                    candidates.push({ from: [pc.r, pc.c], to: m });
                }
            }
        }
        if (candidates.length > 0) {
            aiMoveChoice = candidates[Math.floor(Math.random() * candidates.length)];
        }
    }

    if (aiMoveChoice) {
        move(aiMoveChoice.from[0], aiMoveChoice.from[1], aiMoveChoice.to[0], aiMoveChoice.to[1]);
    }
}

function mate(): boolean {
    for (let r = 0; r < 8; r++)
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && col(p) === turn && valid(r, c).length > 0) return false;
        }
    return inCheck(turn);
}

function stalemate(): boolean {
    if (inCheck(turn)) return false;
    return mate();
}

function showOver(winner: string, msg: string): void {
    const overTitle = document.getElementById('overTitle');
    const overMsg = document.getElementById('overMsg');
    const overEl = document.getElementById('over');
    if (overTitle) overTitle.textContent = msg;
    if (overMsg) overMsg.textContent = `${winner} wins! +25 🪙`;
    overEl?.classList.add('active');
    render();
}

function resign(): void {
    if (!over) {
        over = true;
        const winner = turn === 'white' ? 'Black' : 'White';
        if (winner !== 'White') addCoins(25);
        const overTitle = document.getElementById('overTitle');
        const overMsg = document.getElementById('overMsg');
        const overEl = document.getElementById('over');
        if (overTitle) overTitle.textContent = 'RESIGNED';
        if (overMsg) overMsg.textContent = `${winner} wins! ${winner === 'White' ? '+25 🪙' : ''}`;
        overEl?.classList.add('active');
    }
}

function resetGame(): void {
    document.getElementById('over')?.classList.remove('active');
    document.getElementById('shopOverlay')?.classList.remove('active');
    document.getElementById('adModal')?.classList.remove('active');
    capW = [];
    capB = [];
    over = false;
    sel = null;
    moves = [];
    turn = 'white';
    init();
    render();
}

function goMenu(): void {
    document.getElementById('game')?.classList.remove('active');
    document.getElementById('menu')?.classList.remove('hidden');
    document.getElementById('over')?.classList.remove('active');
    document.getElementById('shopOverlay')?.classList.remove('active');
}

function startGame(isAI: boolean): void {
    document.getElementById('menu')?.classList.add('hidden');
    document.getElementById('game')?.classList.add('active');
    gameMode = isAI ? 'ai' : 'pvp';
    resetGame();
}

function startGameAI(level: number): void {
    aiLevel = level;
    startGame(true);
}

// Expose functions to global scope for HTML onclick handlers
(window as unknown as Record<string, unknown>).playSoundSafe = playSoundSafe;
(window as unknown as Record<string, unknown>).openShop = openShop;
(window as unknown as Record<string, unknown>).closeShop = closeShop;
(window as unknown as Record<string, unknown>).togglePieceSkin = togglePieceSkin;
(window as unknown as Record<string, unknown>).toggleBoardSkin = toggleBoardSkin;
(window as unknown as Record<string, unknown>).watchAd = watchAd;
(window as unknown as Record<string, unknown>).closeAdModal = closeAdModal;
(window as unknown as Record<string, unknown>).startGame = startGame;
(window as unknown as Record<string, unknown>).startGameAI = startGameAI;
(window as unknown as Record<string, unknown>).resetGame = resetGame;
(window as unknown as Record<string, unknown>).resign = resign;
(window as unknown as Record<string, unknown>).goMenu = goMenu;
