let memories = JSON.parse(localStorage.getItem('memories')) || [];
let currentYear = 2026;
let currentMonth = 6;
let cellNodesData = [];
let petriAnimationId = null;

document.addEventListener('DOMContentLoaded', () => {
    initCharCounter();
    createAmbientCells();
    renderMemoryCells();
    renderCalendar();
    renderProfile();

    // 백그라운드 오버레이 클릭 시에도 모달이 닫히도록 바인딩
    document.getElementById('detail-modal').addEventListener('click', function(e) {
        if(e.target === this) closeModal();
    });
});

function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('nav a').forEach(nav => nav.classList.remove('active'));

    document.getElementById(`page-${pageId}`).classList.add('active');
    document.getElementById(`nav-${pageId}`).classList.add('active');

    if (pageId === 'cells') {
        renderMemoryCells();
    } else {
        cancelAnimationFrame(petriAnimationId);
    }
    if (pageId === 'calendar') renderCalendar();
    if (pageId === 'profile') renderProfile();
}

function showToast(message) {
    const toast = document.getElementById('toast-alert');
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function initCharCounter() {
    const textarea = document.getElementById('memory-input');
    const counter = document.getElementById('char-count');
    textarea.addEventListener('input', () => { counter.innerText = textarea.value.length; });
}

function saveMemory() {
    const textarea = document.getElementById('memory-input');
    const text = textarea.value.trim();
    if (!text) { alert('내용을 입력해 주세요.'); return; }

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const newMemory = { id: Date.now(), date: dateStr, content: text, timestamp: now.getTime() };
    memories.push(newMemory);
    localStorage.setItem('memories', JSON.stringify(memories));

    textarea.value = '';
    document.getElementById('char-count').innerText = 0;

    showToast('오늘의 기억이 저장되었습니다.');
    setTimeout(() => navigateTo('cells'), 800);
}

function renderMemoryCells() {
    const dish = document.getElementById('petri-dish');
    const msg = document.getElementById('no-memories-msg');
    dish.innerHTML = '';
    dish.appendChild(msg);

    if (memories.length === 0) { msg.style.display = 'block'; return; }
    else { msg.style.display = 'none'; }

    cellNodesData = [];
    const colors = ['rgba(126, 108, 249, 0.65)', 'rgba(185, 167, 255, 0.7)', 'rgba(167, 231, 215, 0.75)', 'rgba(205, 232, 255, 0.8)'];

    memories.forEach((mem) => {
        const node = document.createElement('div');
        node.className = 'memory-cell-node';

        const size = Math.floor(Math.random() * 25) + 60;
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const dateParts = mem.date.split('-');
        node.innerText = `${dateParts[1]}.${dateParts[2]}`;

        node.style.width = `${size}px`;
        node.style.height = `${size}px`;
        node.style.background = randomColor;

        const x = Math.random() * (dish.clientWidth - size - 40) + 20;
        const y = Math.random() * (dish.clientHeight - size - 40) + 20;

        // 클릭할 때 팝업창을 즉시 띄우도록 이벤트 연결
        node.addEventListener('click', (e) => {
            e.stopPropagation(); // 버블링 차단
            openModal(mem);
        });

        dish.appendChild(node);

        cellNodesData.push({
            element: node,
            x: x, y: y,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: size / 2,
            content: mem.content,
            date: mem.date
        });
    });

    cancelAnimationFrame(petriAnimationId);
    animatePetriDish();
}

function animatePetriDish() {
    const dish = document.getElementById('petri-dish');
    if(!dish) return;
    const W = dish.clientWidth;
    const H = dish.clientHeight;

    cellNodesData.forEach(cell => {
        cell.x += cell.vx;
        cell.y += cell.vy;

        if (cell.x <= 0 || cell.x >= W - cell.radius * 2) cell.vx *= -1;
        if (cell.y <= 0 || cell.y >= H - cell.radius * 2) cell.vy *= -1;

        if (cell.x < 0) cell.x = 0;
        if (cell.x > W - cell.radius * 2) cell.x = W - cell.radius * 2;
        if (cell.y < 0) cell.y = 0;
        if (cell.y > H - cell.radius * 2) cell.y = H - cell.radius * 2;

        // 중심축 기준 이동 처리
        cell.element.style.left = '0px';
        cell.element.style.top = '0px';
        cell.element.style.transform = `translate(${cell.x}px, ${cell.y}px)`;
    });

    petriAnimationId = requestAnimationFrame(animatePetriDish);
}

function searchCells() {
    const query = document.getElementById('cell-search').value.toLowerCase().trim();
    const msg = document.getElementById('no-memories-msg');
    let hasResult = false;

    cellNodesData.forEach(cell => {
        const match = cell.content.toLowerCase().includes(query) || cell.date.includes(query);
        if (query === '') {
            cell.element.classList.remove('blur-out', 'highlight-in');
            hasResult = true;
        } else if (match) {
            cell.element.classList.remove('blur-out');
            cell.element.classList.add('highlight-in');
            hasResult = true;
        } else {
            cell.element.classList.remove('highlight-in');
            cell.element.classList.add('blur-out');
        }
    });
    msg.style.display = (!hasResult && query !== '') ? 'block' : 'none';
}

const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const title = document.getElementById('calendar-title');
    if(!grid) return;
    grid.innerHTML = '';
    title.innerText = `${currentYear}.${String(currentMonth + 1).padStart(2, '0')}`;

    weekdays.forEach(wd => {
        const div = document.createElement('div');
        div.className = 'weekday'; div.innerText = wd; grid.appendChild(div);
    });

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'day-cell empty'; grid.appendChild(emptyCell);
    }

    for (let d = 1; d <= totalDays; d++) {
        const cell = document.createElement('div');
        cell.className = 'day-cell';
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

        if (new Date().getFullYear() === currentYear && new Date().getMonth() === currentMonth && new Date().getDate() === d) {
            cell.classList.add('today');
        }

        const numSpan = document.createElement('span');
        numSpan.className = 'day-num'; numSpan.innerText = d; cell.appendChild(numSpan);

        const dayMemories = memories.filter(m => m.date === dateStr);
        if (dayMemories.length > 0) {
            const iconsContainer = document.createElement('div');
            iconsContainer.className = 'cell-icons';
            if (dayMemories.length === 1) {
                const dot = document.createElement('span'); dot.className = 'cell-moti-dot'; iconsContainer.appendChild(dot);
            } else {
                const count = document.createElement('span'); count.className = 'cell-moti-count'; count.innerText = dayMemories.length; iconsContainer.appendChild(count);
            }
            cell.appendChild(iconsContainer);
            cell.onclick = () => {
                const compositeContent = dayMemories.map((m, idx) => `[기록 ${idx+1}]\n${m.content}`).join('\n\n');
                openModal({ date: dateStr, content: compositeContent });
            };
        }
        grid.appendChild(cell);
    }
}

function changeMonth(dir) {
    currentMonth += dir;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    else if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
}

function renderProfile() {
    const targetPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const monthMemories = memories.filter(m => m.date.startsWith(targetPrefix));

    document.getElementById('stat-month-count').innerText = `${monthMemories.length}개`;
    document.getElementById('stat-total-cells').innerText = `${memories.length}개`;
    document.getElementById('stat-streak').innerText = `${calculateStreak()}일`;
    document.getElementById('stat-top-day').innerText = calculateTopDay();

    const targetGoal = 20;
    const uniqueDays = new Set(monthMemories.map(m => m.date)).size;
    const percent = Math.min(Math.round((uniqueDays / targetGoal) * 100), 100);

    document.getElementById('chart-percentage').innerText = `${percent}%`;
    const circle = document.getElementById('progress-circle');
    if(circle) {
        const circumference = 2 * Math.PI * 70;
        circle.style.strokeDashoffset = circumference - (percent / 100) * circumference;
    }
}

function calculateStreak() {
    if (memories.length === 0) return 0;
    const uniqueDates = Array.from(new Set(memories.map(m => m.date))).sort().reverse();
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) return 0;

    let streak = 1; let current = new Date(uniqueDates[0]);
    for (let i = 1; i < uniqueDates.length; i++) {
        const nextDate = new Date(uniqueDates[i]);
        const diffDays = Math.ceil(Math.abs(current - nextDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) { streak++; current = nextDate; }
        else if (diffDays > 1) { break; }
    }
    return streak;
}

function calculateTopDay() {
    if (memories.length === 0) return '-';
    const dayCounts = [0,0,0,0,0,0,0];
    memories.forEach(m => { dayCounts[new Date(m.date).getDay()]++; });
    let maxIdx = 0; let maxVal = -1;
    dayCounts.forEach((count, idx) => { if (count > maxVal) { maxVal = count; maxIdx = idx; } });
    return maxVal === 0 ? '-' : weekdays[maxIdx] + '요일';
}

/* --- 확실해진 모달 시스템 제어 --- */
function openModal(memoryObj) {
    document.getElementById('modal-date').innerText = memoryObj.date;
    document.getElementById('modal-body').innerText = memoryObj.content;
    document.getElementById('detail-modal').classList.add('show');
}

function closeModal() {
    document.getElementById('detail-modal').classList.remove('show');
}

function createAmbientCells() {
    const container = document.getElementById('ambient-cells-container');
    if(!container) return;
    const count = 12;
    for(let i=0; i<count; i++) {
        const cell = document.createElement('div');
        cell.className = 'bg-cell';
        const size = Math.random() * 40 + 20;
        cell.style.width = size + 'px';
        cell.style.height = size + 'px';
        cell.style.left = Math.random() * 90 + 5 + '%';
        cell.style.top = Math.random() * 80 + 10 + '%';
        cell.style.animationDuration = (Math.random() * 4 + 4) + 's';
        cell.style.animationDelay = (Math.random() * -5) + 's';
        container.appendChild(cell);
    }
}
