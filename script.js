/**
 * Draft Yönetim Paneli - Premium Football Snake Draft
 * Vanilla JavaScript Implementation
 */

/* ==============================
   STATE MANAGEMENT
   ============================== */
const MAX_PLAYERS_PER_TEAM = 18;

let state = {
    teams: [], // { id, name, color, budget, players: [{name, fee}] }
    baseDraftOrder: [], // array of team ids
    currentRound: 1, // 1 to 18
    currentPickIndex: 0, // 0 to teams.length - 1
    currentScreen: 'setupScreen', // setupScreen, revealScreen, draftScreen, resultsScreen
    transferHistory: [] // { round, pickIndex, teamId, player: {name, fee}, previousActiveTeamId }
};

/* ==============================
   DOM ELEMENTS
   ============================== */
const screens = {
    setupScreen: document.getElementById('setupScreen'),
    revealScreen: document.getElementById('revealScreen'),
    draftScreen: document.getElementById('draftScreen'),
    resultsScreen: document.getElementById('resultsScreen')
};

// Setup Screen
const teamForm = document.getElementById('teamForm');
const teamNameInput = document.getElementById('teamName');
const teamColorInput = document.getElementById('teamColor');
const teamBudgetInput = document.getElementById('teamBudget');
const setupTeamsList = document.getElementById('setupTeamsList');
const teamCountBadge = document.getElementById('teamCountBadge');
const startDraftBtn = document.getElementById('startDraftBtn');

// Reveal Screen
const revealOrderList = document.getElementById('revealOrderList');
const proceedToDraftBtn = document.getElementById('proceedToDraftBtn');

// Draft Dashboard
const headerRound = document.getElementById('headerRound');
const headerPick = document.getElementById('headerPick');
const statTotalTeams = document.getElementById('statTotalTeams');
const statCompletedTeams = document.getElementById('statCompletedTeams');
const activeTeamName = document.getElementById('activeTeamName');
const activeTeamBanner = document.getElementById('activeTeamBanner');
const playerNominationInput = document.getElementById('playerNominationInput');
const livePlayerPreview = document.getElementById('livePlayerPreview');
const biddingEndedBtn = document.getElementById('biddingEndedBtn');
const undoTransferBtn = document.getElementById('undoTransferBtn');
const roundDirectionBadge = document.getElementById('roundDirectionBadge');
const roundOrderList = document.getElementById('roundOrderList');
const sidebarTeamsContainer = document.getElementById('sidebarTeamsContainer');

// Modal
const transferModal = document.getElementById('transferModal');
const transferForm = document.getElementById('transferForm');
const modalPlayerName = document.getElementById('modalPlayerName');
const transferTeamSelect = document.getElementById('transferTeamSelect');
const transferFeeInput = document.getElementById('transferFee');
const cancelTransferBtn = document.getElementById('cancelTransferBtn');

// Results Screen
const resultsGrid = document.getElementById('resultsGrid');
const downloadTxtBtn = document.getElementById('downloadTxtBtn');
const newDraftBtn = document.getElementById('newDraftBtn');
const resetDataBtn = document.getElementById('resetDataBtn');

/* ==============================
   INITIALIZATION
   ============================== */
function init() {
    initParticles();
    loadState();
    attachEventListeners();
    updateUI();
}

function loadState() {
    const saved = localStorage.getItem('draftState');
    if (saved) {
        try {
            state = JSON.parse(saved);
        } catch (e) {
            console.error("Local storage error:", e);
        }
    }
}

function saveState() {
    localStorage.setItem('draftState', JSON.stringify(state));
}

/* ==============================
   UI NAVIGATION
   ============================== */
function switchScreen(screenId) {
    Object.values(screens).forEach(screen => {
        screen.classList.add('hidden');
        screen.classList.remove('active');
    });
    screens[screenId].classList.remove('hidden');
    screens[screenId].classList.add('active');
    state.currentScreen = screenId;
    saveState();
}

function updateUI() {
    switch (state.currentScreen) {
        case 'setupScreen':
            renderSetupScreen();
            break;
        case 'revealScreen':
            renderRevealScreen();
            break;
        case 'draftScreen':
            renderDraftScreen();
            break;
        case 'resultsScreen':
            renderResultsScreen();
            break;
    }
    
    // Always hide inactive screens based on state (in case of reload)
    Object.keys(screens).forEach(id => {
        if(id !== state.currentScreen) {
            screens[id].classList.add('hidden');
            screens[id].classList.remove('active');
        } else {
            screens[id].classList.remove('hidden');
            screens[id].classList.add('active');
        }
    });
}

/* ==============================
   SETUP LOGIC
   ============================== */
function renderSetupScreen() {
    setupTeamsList.innerHTML = '';
    state.teams.forEach(team => {
        const div = document.createElement('div');
        div.className = 'setup-team-card';
        div.innerHTML = `
            <div class="team-info">
                <div class="color-dot" style="background-color: ${team.color}"></div>
                <div>
                    <div class="team-name">${escapeHTML(team.name)}</div>
                    <div class="team-budget">Bütçe: ${team.budget}M</div>
                </div>
            </div>
            <button class="btn-remove" onclick="removeTeam('${team.id}')">✕</button>
        `;
        setupTeamsList.appendChild(div);
    });

    teamCountBadge.textContent = state.teams.length;
    startDraftBtn.disabled = state.teams.length < 2;
}

function removeTeam(id) {
    state.teams = state.teams.filter(t => t.id !== id);
    saveState();
    renderSetupScreen();
}

teamForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = teamNameInput.value.trim();
    const color = teamColorInput.value;
    const budget = parseInt(teamBudgetInput.value);

    if (!name || isNaN(budget) || budget <= 0) {
        showToast('Geçersiz değerler girdiniz.', 'error');
        return;
    }

    if (state.teams.some(t => t.name.toLowerCase() === name.toLowerCase())) {
        showToast('Bu takım adı zaten var.', 'error');
        return;
    }

    state.teams.push({
        id: 'team_' + Date.now() + '_' + Math.floor(Math.random()*1000),
        name,
        color,
        budget,
        players: []
    });

    teamNameInput.value = '';
    teamNameInput.focus();
    saveState();
    renderSetupScreen();
    showToast('Takım başarıyla eklendi.', 'success');
});

startDraftBtn.addEventListener('click', () => {
    if (state.teams.length < 2) return;
    
    // Shuffle teams for base order
    const shuffled = [...state.teams].sort(() => Math.random() - 0.5);
    state.baseDraftOrder = shuffled.map(t => t.id);
    state.currentRound = 1;
    state.currentPickIndex = 0;
    state.transferHistory = [];
    
    switchScreen('revealScreen');
    renderRevealScreen();
});

/* ==============================
   REVEAL LOGIC
   ============================== */
function renderRevealScreen() {
    revealOrderList.innerHTML = '';
    state.baseDraftOrder.forEach((teamId, index) => {
        const team = getTeam(teamId);
        const div = document.createElement('div');
        div.className = 'reveal-item';
        div.innerHTML = `
            <span class="reveal-number">${index + 1}.</span>
            <div class="color-dot" style="background-color: ${team.color}"></div>
            <span>${escapeHTML(team.name)}</span>
        `;
        revealOrderList.appendChild(div);
    });
}

proceedToDraftBtn.addEventListener('click', () => {
    switchScreen('draftScreen');
    renderDraftScreen();
});

/* ==============================
   SNAKE DRAFT ENGINE
   ============================== */
function getTeam(id) {
    return state.teams.find(t => t.id === id);
}

function getCurrentDraftOrder() {
    const isReversed = state.currentRound % 2 === 0;
    return isReversed ? [...state.baseDraftOrder].reverse() : [...state.baseDraftOrder];
}

function getActiveTeamId() {
    const order = getCurrentDraftOrder();
    return order[state.currentPickIndex];
}

function advanceDraft() {
    let order = getCurrentDraftOrder();
    
    // Move to next pick
    state.currentPickIndex++;

    // If round is over
    if (state.currentPickIndex >= order.length) {
        state.currentRound++;
        state.currentPickIndex = 0;
        
        // Check if draft is over
        if (state.currentRound > MAX_PLAYERS_PER_TEAM) {
            finishDraft();
            return;
        }
        order = getCurrentDraftOrder();
    }

    // Skip teams that already have 18 players
    let sanityCheck = 0;
    while (getTeam(order[state.currentPickIndex]).players.length >= MAX_PLAYERS_PER_TEAM) {
        state.currentPickIndex++;
        if (state.currentPickIndex >= order.length) {
            state.currentRound++;
            state.currentPickIndex = 0;
            if (state.currentRound > MAX_PLAYERS_PER_TEAM) {
                finishDraft();
                return;
            }
            order = getCurrentDraftOrder();
        }
        
        sanityCheck++;
        if(sanityCheck > 100) {
            // Failsafe in case all teams are full but round <= 18
            finishDraft();
            return;
        }
    }
}

function finishDraft() {
    switchScreen('resultsScreen');
    renderResultsScreen();
}

/* ==============================
   DRAFT DASHBOARD LOGIC
   ============================== */
playerNominationInput.addEventListener('input', (e) => {
    livePlayerPreview.textContent = e.target.value.toUpperCase();
});

function renderDraftScreen() {
    // Check completion
    const isDraftFinished = state.teams.every(t => t.players.length >= MAX_PLAYERS_PER_TEAM);
    if(isDraftFinished && state.currentScreen === 'draftScreen') {
        finishDraft();
        return;
    }

    const activeTeamId = getActiveTeamId();
    const activeTeam = getTeam(activeTeamId);
    const order = getCurrentDraftOrder();
    const isReversed = state.currentRound % 2 === 0;

    // Header Stats
    headerRound.textContent = `Tur ${state.currentRound}`;
    headerPick.textContent = `Seçim ${state.currentPickIndex + 1}`;
    statTotalTeams.textContent = state.teams.length;
    statCompletedTeams.textContent = state.teams.filter(t => t.players.length >= MAX_PLAYERS_PER_TEAM).length;

    // Active Banner
    activeTeamName.textContent = activeTeam.name;
    activeTeamBanner.style.color = activeTeam.color;
    document.querySelector('.active-team-indicator').style.backgroundColor = activeTeam.color;

    // Round Order Panel
    roundDirectionBadge.textContent = isReversed ? "Bu tur ters sıra ile oynanıyor" : "Bu tur normal sıra ile oynanıyor";
    roundOrderList.innerHTML = '';
    
    order.forEach((tid, idx) => {
        const t = getTeam(tid);
        const div = document.createElement('div');
        div.className = `order-dot ${idx === state.currentPickIndex ? 'active' : ''} ${idx < state.currentPickIndex ? 'done' : ''}`;
        div.style.borderColor = t.color;
        if (idx === state.currentPickIndex) {
            div.style.color = t.color;
        }
        div.textContent = idx + 1;
        div.title = t.name;
        roundOrderList.appendChild(div);
    });

    // Sidebar Teams
    sidebarTeamsContainer.innerHTML = '';
    state.teams.forEach(team => {
        const isCompleted = team.players.length >= MAX_PLAYERS_PER_TEAM;
        const isTeamActive = team.id === activeTeamId && !isCompleted;
        
        const card = document.createElement('div');
        card.className = `glass-panel sidebar-team-card ${isTeamActive ? 'is-active' : ''} ${isCompleted ? 'is-completed' : ''}`;
        
        const playersHtml = team.players.map(p => `
            <div class="stc-player-row">
                <span class="stc-pname">${escapeHTML(p.name)}</span>
                <span class="stc-pfee">${p.fee}M</span>
            </div>
        `).join('');

        card.innerHTML = `
            <div class="stc-header">
                <div class="stc-name-wrap">
                    <div class="color-dot" style="background-color: ${team.color}"></div>
                    <span class="stc-name">${escapeHTML(team.name)}</span>
                </div>
                <div class="stc-budget">
                    <span class="stc-budget-val" style="color: ${team.budget < 0 ? 'var(--accent-red)' : 'inherit'}">${team.budget}M</span>
                    <span class="stc-budget-lbl">Kalan Bütçe</span>
                </div>
            </div>
            <div class="stc-stats">
                <span>Kadrolar: ${team.players.length}/${MAX_PLAYERS_PER_TEAM}</span>
                ${isTeamActive ? '<span class="badge" style="background: var(--accent-blue)">Aktif Sıra</span>' : ''}
                ${isCompleted ? '<span class="badge outline">Tamamlandı</span>' : ''}
            </div>
            <div class="stc-player-list">
                ${playersHtml}
            </div>
        `;
        sidebarTeamsContainer.appendChild(card);
    });

    undoTransferBtn.style.display = state.transferHistory.length > 0 ? 'inline-flex' : 'none';
}

/* ==============================
   TRANSFER MODAL
   ============================== */
biddingEndedBtn.addEventListener('click', () => {
    const pName = playerNominationInput.value.trim();
    if (!pName) {
        showToast('Lütfen önce bir oyuncu adı yazın.', 'error');
        playerNominationInput.focus();
        return;
    }

    // Populate modal
    modalPlayerName.textContent = pName.toUpperCase();
    transferFeeInput.value = '';
    
    // Populate select
    transferTeamSelect.innerHTML = '<option value="" disabled selected>Takım Seçin</option>';
    state.teams.forEach(t => {
        if (t.players.length < MAX_PLAYERS_PER_TEAM) {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = `${t.name} (Bütçe: ${t.budget}M)`;
            transferTeamSelect.appendChild(opt);
        }
    });

    transferModal.classList.remove('hidden');
    
    // Try to auto-select active team if they still have space
    const activeTeamId = getActiveTeamId();
    const activeTeam = getTeam(activeTeamId);
    if(activeTeam.players.length < MAX_PLAYERS_PER_TEAM) {
        transferTeamSelect.value = activeTeamId;
    }
    
    setTimeout(() => transferFeeInput.focus(), 100);
});

cancelTransferBtn.addEventListener('click', () => {
    transferModal.classList.add('hidden');
});

transferForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const teamId = transferTeamSelect.value;
    const fee = parseInt(transferFeeInput.value);
    const pName = playerNominationInput.value.trim().toUpperCase();

    if (!teamId || isNaN(fee) || fee < 0) {
        showToast('Geçerli bir takım ve ücret girin.', 'error');
        return;
    }

    const team = getTeam(teamId);
    if (team.budget < fee) {
        showToast(`${team.name} takımının yeterli bütçesi yok! Kalan: ${team.budget}M`, 'error');
        return;
    }

    if (team.players.length >= MAX_PLAYERS_PER_TEAM) {
        showToast(`${team.name} takımının kadrosu dolu.`, 'error');
        return;
    }

    const activeTeamIdBefore = getActiveTeamId();

    // Perform Transfer
    team.players.push({ name: pName, fee: fee });
    team.budget -= fee;
    
    // Save history
    state.transferHistory.push({
        round: state.currentRound,
        pickIndex: state.currentPickIndex,
        teamId: team.id,
        player: { name: pName, fee: fee },
        previousActiveTeamId: activeTeamIdBefore
    });

    // Advance state
    advanceDraft();
    saveState();
    
    // Reset UI
    playerNominationInput.value = '';
    livePlayerPreview.textContent = '';
    transferModal.classList.add('hidden');
    
    updateUI();
    showToast(`TRANSFER: ${pName} ➔ ${team.name} (${fee}M)`, 'success');
});

/* ==============================
   UNDO SYSTEM
   ============================== */
undoTransferBtn.addEventListener('click', () => {
    if (state.transferHistory.length === 0) return;

    if (!confirm('Son transferi geri almak istediğinize emin misiniz?')) return;

    const lastAction = state.transferHistory.pop();
    const team = getTeam(lastAction.teamId);

    // Revert Budget & Player
    team.budget += lastAction.player.fee;
    team.players.pop();

    // Revert State
    state.currentRound = lastAction.round;
    state.currentPickIndex = lastAction.pickIndex;

    saveState();
    updateUI();
    showToast('Son transfer geri alındı.', 'info');
});

/* ==============================
   RESULTS & EXPORT
   ============================== */
function renderResultsScreen() {
    resultsGrid.innerHTML = '';
    state.teams.forEach(team => {
        const card = document.createElement('div');
        card.className = 'glass-panel sidebar-team-card';
        card.style.borderColor = team.color;
        
        let html = `
            <div class="stc-header">
                <div class="stc-name-wrap">
                    <div class="color-dot" style="background-color: ${team.color}"></div>
                    <span class="stc-name" style="font-size: 1.3rem;">${escapeHTML(team.name)}</span>
                </div>
                <div class="stc-budget">
                    <span class="stc-budget-val">${team.budget}M</span>
                    <span class="stc-budget-lbl">Kalan Bütçe</span>
                </div>
            </div>
            <div class="stc-player-list" style="max-height: none; margin-top: 16px;">
        `;
        
        team.players.forEach((p, i) => {
            html += `
                <div class="stc-player-row">
                    <span class="stc-pname">${i+1}. ${escapeHTML(p.name)}</span>
                    <span class="stc-pfee">${p.fee}M</span>
                </div>
            `;
        });
        
        html += `</div>`;
        card.innerHTML = html;
        resultsGrid.appendChild(card);
    });
}

downloadTxtBtn.addEventListener('click', () => {
    let content = `DRAFT SONUÇLARI\n====================\n\n`;
    
    state.teams.forEach(team => {
        content += `${team.name.toUpperCase()}\n`;
        content += `Kalan Bütçe: ${team.budget}M\n`;
        content += `--------------------\n`;
        team.players.forEach((p, i) => {
            content += `${i+1}. ${p.name} - ${p.fee}M\n`;
        });
        content += `\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'draft-sonuclari.txt';
    a.click();
    URL.revokeObjectURL(url);
});

newDraftBtn.addEventListener('click', () => {
    if(confirm('Aynı takımlarla yeni bir draft başlatılsın mı?')) {
        // Keep teams, reset players and budgets
        state.teams.forEach(t => {
            // Attempt to restore original budget? We didn't save base budget.
            // Let's just ask user to do full reset if they want budget reset, or give default 200.
            // Best is to do a full reset for a completely fresh draft to be safe.
            alert('Lütfen veri sıfırlama seçeneğini kullanın ve takımları tekrar ekleyin.');
        });
    }
});

resetDataBtn.addEventListener('click', () => {
    if(confirm('Tüm draft verileri silinecek. Emin misiniz?')) {
        localStorage.removeItem('draftState');
        location.reload();
    }
});

/* ==============================
   UTILITIES & EFFECTS
   ============================== */
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if(type==='success') icon = '✅';
    if(type==='error') icon = '❌';

    toast.innerHTML = `<span>${icon}</span> <span>${escapeHTML(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Particle Background
function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = Math.random() * 0.4 - 0.2;
            this.speedY = Math.random() * 0.4 - 0.2;
            this.opacity = Math.random() * 0.5 + 0.1;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
        }
        draw() {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for (let i = 0; i < 80; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }
        requestAnimationFrame(animate);
    }
    animate();
}

// Start
document.addEventListener('DOMContentLoaded', init);
