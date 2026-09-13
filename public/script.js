const socket = io();

const statusDiv = document.getElementById('status');
const gameDiv = document.getElementById('game');
const questionText = document.getElementById('questionText');
const optionsDiv = document.getElementById('options');
const resultDiv = document.getElementById('result');

socket.on('waiting', (data) => {
    statusDiv.style.display = 'block';
    gameDiv.style.display = 'none';
    statusDiv.innerHTML = `<h3>${data.message}</h3><div class="spinner"></div>`;
});

socket.on('full', (data) => {
    statusDiv.innerHTML = `<h3>${data.message}</h3>`;
});

socket.on('gameStart', (data) => {
    statusDiv.innerHTML = `<h3>${data.message}</h3><div class="spinner"></div>`;
});

socket.on('newQuestion', (q) => {
    statusDiv.style.display = 'none';
    gameDiv.style.display = 'block';
    resultDiv.innerHTML = '';
    optionsDiv.innerHTML = '';
    questionText.innerText = q.question;

    q.options.forEach(opt => {
        const btn = document.createElement('div');
        btn.className = 'option';
        let html = `<span>${opt.text}</span>`;
        if (opt.image) {
            html += `<img src="${opt.image}" alt="img">`;
        }
        btn.innerHTML = html;
        btn.onclick = () => {
            socket.emit('submitAnswer', { answerId: opt.id });
            optionsDiv.innerHTML = '<h3>Đã chọn! Đang đợi người yêu chốt đáp án... ⏳</h3>';
        };
        optionsDiv.appendChild(btn);
    });
});

socket.on('roundResult', (data) => {
    let msg = data.isMatch
        ? "<h3 style='color: #ff4d6d'>Tuyệt vời! Tâm linh tương thông! 💖</h3>"
        : "<h3 style='color: #6c757d'>Ối, mỗi người một ý rồi! 😂</h3>";

    msg += `<div class="result-box">
                <p>Lựa chọn của bạn: <b>${data.myChoice}</b></p>
                <p>Lựa chọn của người ấy: <b>${data.otherChoice}</b></p>
                <hr>
                <p>Điểm hiện tại: <b>${data.myScore}</b></p>
            </div>
            <p><i>(Đang chuẩn bị câu tiếp theo...)</i></p>`;

    optionsDiv.innerHTML = '';
    resultDiv.innerHTML = msg;
});

socket.on('gameOver', (data) => {
    resultDiv.innerHTML = `<h2>${data.message}</h2><p>Trải nghiệm vui vẻ nhé!</p>`;
});

socket.on('playerLeft', (data) => {
    alert(data.message);
    location.reload();
});