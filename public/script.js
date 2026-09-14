const socket = io();

// Thay thế hàm generateUID ở ngay đầu file
function generateUID() {
    return Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
}

let myUID = localStorage.getItem('couple_game_uid');
if (!myUID) {
    myUID = generateUID();
    localStorage.setItem('couple_game_uid', myUID);
}

const nicknameInput = document.getElementById('nicknameInput');
const roomCodeInput = document.getElementById('roomCodeInput');
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const loginMessage = document.getElementById('loginMessage');
const loginScreen = document.getElementById('loginScreen');
const gameLayout = document.getElementById('gameLayout');
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
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const chatMessages = document.getElementById('chatMessages');
const bgMusic = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');

let currentRoomCode = '';
let currentType = '';
let currentAnswer = null;
let isMusicPlaying = false;

const savedName = localStorage.getItem('couple_game_name');
if (savedName) {
    nicknameInput.value = savedName;
}

function setLoginMessage(message, isError = false) {
    loginMessage.textContent = message;
    loginMessage.classList.toggle('error', isError);
}

function validateJoinInput(createNewRoom) {
    const nickname = (nicknameInput.value || '').trim();
    const roomCode = (roomCodeInput.value || '').trim().toUpperCase();

    if (!nickname || nickname.length < 2) {
        setLoginMessage('Nhập tên của bạn trước khi vào phòng nhé 💗', true);
        nicknameInput.focus();
        return null;
    }

    if (!createNewRoom && !roomCode) {
        setLoginMessage('Bạn chưa nhập mã phòng. Hãy tạo phòng hoặc nhập mã đúng.', true);
        roomCodeInput.focus();
        return null;
    }

    if (roomCode && !/^[A-Z0-9]{3,6}$/.test(roomCode)) {
        setLoginMessage('Mã phòng chỉ gồm 3-6 ký tự chữ hoa hoặc số. Ví dụ: PINK01.', true);
        roomCodeInput.focus();
        return null;
    }

    return { nickname, roomCode };
}

// Thay thế hàm joinRoom
function joinRoom(createNewRoom) {
    const data = validateJoinInput(createNewRoom);
    if (!data) return;

    // Hiệu ứng Loading cho nút bấm
    const btn = createNewRoom ? createRoomBtn : joinRoomBtn;
    const originalText = btn.textContent;
    btn.textContent = 'Đang kết nối... ⏳';
    btn.disabled = true;
    btn.style.opacity = '0.7';

    localStorage.setItem('couple_game_name', data.nickname);
    socket.emit('joinRoom', {
        uid: myUID,
        nickname: data.nickname,
        roomCode: data.roomCode,
        createRoom: createNewRoom
    });

    // Khôi phục nút sau 3 giây đề phòng mạng lag hoặc server Render đang thức dậy
    setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        btn.style.opacity = '1';
    }, 3000);
}

createRoomBtn.addEventListener('click', () => joinRoom(true));
joinRoomBtn.addEventListener('click', () => joinRoom(false));

resetBtn.addEventListener('click', () => {
    socket.emit('forceReset', { roomCode: currentRoomCode });
});

socket.on('roomJoined', ({ roomCode, nickname }) => {
    currentRoomCode = roomCode;
    roomCodeInput.value = roomCode;
    setLoginMessage('');
    loginScreen.classList.add('hidden');
    gameLayout.classList.remove('hidden');
    statusDiv.style.display = 'block';
    gameDiv.style.display = 'none';
    fullScreenDiv.style.display = 'none';
    statusDiv.innerHTML = `<div class="room-badge">Phòng ${roomCode}</div><h3>Xin chào ${nickname}! Đang chờ người ấy vào đây... 💕</h3><div class="spinner"></div>`;
});

socket.on('waiting', (data) => {
    statusDiv.style.display = 'block';
    gameDiv.style.display = 'none';
    fullScreenDiv.style.display = 'none';
    statusDiv.innerHTML = `<div class="room-badge">Phòng ${currentRoomCode || 'của bạn'}</div><h3>${data.message}</h3><div class="spinner"></div>`;
});

socket.on('full', (data) => {
    setLoginMessage(data.message, true);
    loginScreen.classList.remove('hidden');
    gameLayout.classList.add('hidden');
    statusDiv.style.display = 'none';
    fullScreenDiv.style.display = 'block';
    fullText.textContent = data.message;
});

socket.on('roomError', (data) => {
    setLoginMessage(data.message, true);
    loginScreen.classList.remove('hidden');
    gameLayout.classList.add('hidden');
    statusDiv.style.display = 'none';
});

socket.on('gameStart', (data) => {
    statusDiv.style.display = 'block';
    fullScreenDiv.style.display = 'none';
    statusDiv.innerHTML = `<div class="room-badge">Phòng ${currentRoomCode}</div><h3>${data.message}</h3><div class="spinner"></div>`;
});

socket.on('newQuestion', (q) => {
    statusDiv.style.display = 'none';
    gameDiv.style.display = 'block';
    fullScreenDiv.style.display = 'none';
    resultDiv.innerHTML = '';
    waitMsg.style.display = 'none';
    submitBtn.style.display = 'block';
    submitBtn.disabled = false;

    currentType = q.type;
    currentAnswer = q.type === 'multiple' ? [] : null;

    qNumberBadge.textContent = `Câu ${q.id}`;
    questionText.textContent = q.question;
    inputContainer.innerHTML = '';

    if (q.type === 'single' || q.type === 'multiple') {
        inputContainer.className = q.options.some((opt) => opt.image) ? 'grid-2-cols' : 'grid-1-col';

        q.options.forEach((opt) => {
            const card = document.createElement('div');
            card.className = 'option-card';
            card.innerHTML = opt.image
                ? `<img src="${opt.image}" alt="" class="option-image"><span>${opt.text}</span>`
                : `<span>${opt.text}</span>`;

            card.addEventListener('click', () => {
                if (q.type === 'single') {
                    document.querySelectorAll('.option-card').forEach((item) => item.classList.remove('selected'));
                    card.classList.add('selected');
                    currentAnswer = opt.id;
                } else {
                    card.classList.toggle('selected');
                    if (card.classList.contains('selected')) {
                        currentAnswer.push(opt.id);
                    } else {
                        currentAnswer = currentAnswer.filter((id) => id !== opt.id);
                    }
                }
            });
            inputContainer.appendChild(card);
        });
    } else {
        inputContainer.className = 'grid-1-col';
        inputContainer.innerHTML = '<input type="text" id="textInput" class="text-input" placeholder="Nhập biệt danh, lời nhắn, hoặc đáp án...">';
    }
});

submitBtn.addEventListener('click', () => {
    if (currentType === 'text') {
        currentAnswer = document.getElementById('textInput').value.trim();
    }

    if (!currentAnswer || (Array.isArray(currentAnswer) && currentAnswer.length === 0)) {
        alert('Chọn hoặc nhập đáp án đi kìa! 💗');
        return;
    }

    socket.emit('submitAnswer', {
        uid: myUID,
        roomCode: currentRoomCode,
        answer: currentAnswer
    });

    inputContainer.innerHTML = '';
    submitBtn.style.display = 'none';
    waitMsg.style.display = 'block';
});

socket.on('roundResult', (data) => {
    waitMsg.style.display = 'none';
    const resultTitle = data.isMatch
        ? '<h2 style="color: #ff4d6d">Tuyệt vời! Tâm linh tương thông! 💖</h2>'
        : '<h2 style="color: #7a7a7a">Ối, mỗi người một ý rồi! 😂</h2>';

    resultDiv.innerHTML = `${resultTitle}
        <div class="result-box">
            <p>Bạn chọn: <b>${data.myChoice}</b></p>
            <p>Người ấy chọn: <b>${data.otherChoice}</b></p>
            <hr style="border: 1px dashed #ffb3c1;">
            <p>Tổng điểm: <b style="color:#ff4d6d; font-size:1.3em;">${data.myScore}</b></p>
        </div>
        <div class="spinner" style="width: 28px; height: 28px;"></div>`;
});

socket.on('gameOver', (data) => {
    resultDiv.innerHTML = `
        <div class="result-box final-box">
            <h1>${data.message}</h1>
            <h2>Điểm của bạn: ${data.finalScore} ❤️</h2>
            <p>Điểm của người ấy: ${data.secondScore || 0} 💕</p>
        </div>`;
});

function appendChat(text, type) {
    const div = document.createElement('div');
    div.className = `chat-msg ${type}`;
    div.innerText = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendChatBtn.addEventListener('click', () => {
    const text = chatInput.value.trim();
    if (!text) return;

    appendChat(text, 'me');
    socket.emit('sendChat', { roomCode: currentRoomCode, text });
    chatInput.value = '';
});

chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendChatBtn.click();
    }
});

socket.on('receiveChat', (data) => {
    appendChat(data.text, 'other');
});

socket.on('kicked', () => {
    window.location.reload();
});

musicToggle.addEventListener('click', () => {
    if (isMusicPlaying) {
        bgMusic.pause();
        musicToggle.textContent = '🎵 Bật nhạc';
    } else {
        bgMusic.play().catch(() => {});
        musicToggle.textContent = '🎶 Đang phát...';
    }
    isMusicPlaying = !isMusicPlaying;
});

document.body.addEventListener('click', () => {
    if (!isMusicPlaying) {
        bgMusic.play().then(() => {
            isMusicPlaying = true;
            musicToggle.textContent = '🎶 Đang phát...';
        }).catch(() => {});
    }
}, { once: true });

document.querySelectorAll('.sticker-btn').forEach((button) => {
    button.addEventListener('click', () => {
        const stickerText = button.dataset.sticker || button.textContent.trim();
        const message = stickerText;

        appendChat(message, 'me');
        if (currentRoomCode) {
            socket.emit('sendChat', { roomCode: currentRoomCode, text: message });
        } else {
            chatInput.value = message;
        }
    });
});