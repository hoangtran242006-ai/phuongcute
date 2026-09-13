const socket = io();

// Tạo hoặc lấy ID bí mật của thiết bị (chống văng khi tải lại)
let myUID = localStorage.getItem('couple_game_uid');
if (!myUID) {
    myUID = Math.random().toString(36).substring(2, 10);
    localStorage.setItem('couple_game_uid', myUID);
}

// Bắt đầu kết nối
socket.emit('joinRoom', { uid: myUID });

// Các Element Game
const statusDiv = document.getElementById('status');
const gameDiv = document.getElementById('game');
const fullScreenDiv = document.getElementById('fullScreen');
const fullText = document.getElementById('fullText');
const resetBtn = document.getElementById('resetBtn');
const qNumberBadge = document.getElementById('questionNumber');
const questionText = document.getElementById('questionText');
const inputContainer = document.getElementById('inputContainer');
const submitBtn = document.getElementById('submitBtn');
const waitMsg = document.getElementById('waitMsg');
const resultDiv = document.getElementById('result');

// Các Element Chat
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const chatMessages = document.getElementById('chatMessages');

let currentType = '';
let currentAnswer = null;

// --- LOGIC GAME ---
socket.on('waiting', (data) => {
    statusDiv.style.display = 'block'; gameDiv.style.display = 'none'; fullScreenDiv.style.display = 'none';
    statusDiv.innerHTML = `<h3>${data.message}</h3><div class="spinner"></div>`;
});

socket.on('full', (data) => { 
    statusDiv.style.display = 'none'; fullScreenDiv.style.display = 'block';
    fullText.innerText = data.message;
});

// Nút giải cứu nếu bị kẹt
resetBtn.onclick = () => { socket.emit('forceReset'); };
socket.on('kicked', () => { location.reload(); });

socket.on('gameStart', (data) => {
    statusDiv.style.display = 'block'; fullScreenDiv.style.display = 'none';
    statusDiv.innerHTML = `<h3>${data.message}</h3><div class="spinner"></div>`;
});

socket.on('newQuestion', (q) => {
    statusDiv.style.display = 'none'; gameDiv.style.display = 'block'; fullScreenDiv.style.display = 'none';
    resultDiv.innerHTML = ''; waitMsg.style.display = 'none';
    submitBtn.style.display = 'block'; submitBtn.disabled = false;
    
    currentType = q.type;
    currentAnswer = (q.type === 'multiple') ? [] : null;

    qNumberBadge.innerText = `Câu ${q.id}`;
    questionText.innerText = q.question;
    inputContainer.innerHTML = ''; 

    if (q.type === 'single' || q.type === 'multiple') {
        inputContainer.className = q.options.some(opt => opt.image) ? 'grid-2-cols' : 'grid-1-col';
        q.options.forEach(opt => {
            const card = document.createElement('div');
            card.className = 'option-card';
            card.innerHTML = opt.image ? `<img src="${opt.image}" style="width:100%; border-radius:10px; margin-bottom:10px;"><span>${opt.text}</span>` : `<span>${opt.text}</span>`;
            
            card.onclick = () => {
                if (q.type === 'single') {
                    document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected'); currentAnswer = opt.id;
                } else {
                    card.classList.toggle('selected');
                    if (card.classList.contains('selected')) currentAnswer.push(opt.id);
                    else currentAnswer = currentAnswer.filter(id => id !== opt.id);
                }
            };
            inputContainer.appendChild(card);
        });
    } else {
        inputContainer.className = 'grid-1-col';
        inputContainer.innerHTML = `<input type="text" id="textInput" class="text-input" placeholder="Nhập đáp án...">`;
    }
});

submitBtn.onclick = () => {
    if (currentType === 'text') currentAnswer = document.getElementById('textInput').value;
    if (!currentAnswer || currentAnswer.length === 0) return alert("Chọn hoặc nhập đáp án đi kìa!");

    socket.emit('submitAnswer', { uid: myUID, answer: currentAnswer });
    
    inputContainer.innerHTML = ''; submitBtn.style.display = 'none'; waitMsg.style.display = 'block';
};

socket.on('roundResult', (data) => {
    waitMsg.style.display = 'none';
    let msg = data.isMatch ? "<h2 style='color: #ff4d6d'>Tuyệt vời! Tâm linh tương thông! 💖</h2>" : "<h2 style='color: #6c757d'>Ối, mỗi người một ý rồi! 😂</h2>";
    msg += `<div class="result-box">
                <p>Bạn chọn: <b>${data.myChoice}</b></p>
                <p>Người ấy chọn: <b>${data.otherChoice}</b></p>
                <hr style="border: 1px dashed #ffb3c1;">
                <p>Tổng điểm: <b style="color:#ff4d6d; font-size:1.3em;">${data.myScore}</b></p>
            </div>
            <div class="spinner" style="width: 30px; height: 30px;"></div>`;
    resultDiv.innerHTML = msg;
});

socket.on('gameOver', (data) => {
    resultDiv.innerHTML = `<h1>${data.message}</h1><div class="result-box"><h2>Tổng điểm: ${data.finalScore} ❤️</h2></div>`;
});

// --- LOGIC CHAT ---
function appendChat(text, type) {
    const div = document.createElement('div');
    div.className = `chat-msg ${type}`;
    div.innerText = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendChatBtn.onclick = () => {
    const text = chatInput.value.trim();
    if (text) {
        appendChat(text, 'me');
        socket.emit('sendChat', { text });
        chatInput.value = '';
    }
};

chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChatBtn.click(); });
socket.on('receiveChat', (data) => appendChat(data.text, 'other'));
// --- LOGIC ÂM NHẠC ---
const bgMusic = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');
let isMusicPlaying = false;

// Đổi trạng thái khi bấm nút
musicToggle.onclick = () => {
    if (isMusicPlaying) {
        bgMusic.pause();
        musicToggle.innerText = '🎵 Bật nhạc';
    } else {
        bgMusic.play();
        musicToggle.innerText = '🎶 Đang phát...';
    }
    isMusicPlaying = !isMusicPlaying;
};

// Mẹo nhỏ: Tự động phát nhạc ngay khi người chơi bấm vào bất cứ đâu trên màn hình lần đầu tiên
document.body.addEventListener('click', () => {
    if (!isMusicPlaying) {
        bgMusic.play().then(() => {
            isMusicPlaying = true;
            musicToggle.innerText = '🎶 Đang phát...';
        }).catch(() => {}); 
    }
}, { once: true });