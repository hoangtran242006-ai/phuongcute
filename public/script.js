const socket = io();

const statusDiv = document.getElementById('status');
const gameDiv = document.getElementById('game');
const qNumberBadge = document.getElementById('questionNumber');
const questionText = document.getElementById('questionText');
const inputContainer = document.getElementById('inputContainer');
const submitBtn = document.getElementById('submitBtn');
const waitMsg = document.getElementById('waitMsg');
const resultDiv = document.getElementById('result');

let currentType = '';
let currentAnswer = null; // String cho single/text, Array cho multiple

socket.on('waiting', (data) => {
    statusDiv.style.display = 'block';
    gameDiv.style.display = 'none';
    statusDiv.innerHTML = `<h3>${data.message}</h3><div class="spinner"></div>`;
});

socket.on('full', (data) => { statusDiv.innerHTML = `<h3>${data.message}</h3>`; });

socket.on('gameStart', (data) => {
    statusDiv.innerHTML = `<h3>${data.message}</h3><div class="spinner"></div>`;
});

socket.on('newQuestion', (q) => {
    statusDiv.style.display = 'none';
    gameDiv.style.display = 'block';
    resultDiv.innerHTML = '';
    waitMsg.style.display = 'none';
    submitBtn.style.display = 'block';
    submitBtn.disabled = false;
    
    currentType = q.type;
    currentAnswer = (q.type === 'multiple') ? [] : null;

    // Hiển thị text câu hỏi
    qNumberBadge.innerText = `Câu ${q.id}`;
    questionText.innerText = q.question;
    
    inputContainer.innerHTML = ''; // Clear cũ

    if (q.type === 'single' || q.type === 'multiple') {
        // Kiểm tra xem có ảnh không để chỉnh layout cột
        const hasImage = q.options.some(opt => opt.image);
        inputContainer.className = hasImage ? 'grid-2-cols' : 'grid-1-col';

        q.options.forEach(opt => {
            const card = document.createElement('div');
            card.className = 'option-card';
            
            let html = '';
            if (opt.image) html += `<img src="${opt.image}" alt="img">`;
            html += `<span>${opt.text}</span>`;
            card.innerHTML = html;

            card.onclick = () => {
                if (q.type === 'single') {
                    // Bỏ chọn các ô khác
                    document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    currentAnswer = opt.id;
                } else if (q.type === 'multiple') {
                    // Bật/tắt chọn
                    if (card.classList.contains('selected')) {
                        card.classList.remove('selected');
                        currentAnswer = currentAnswer.filter(id => id !== opt.id);
                    } else {
                        card.classList.add('selected');
                        currentAnswer.push(opt.id);
                    }
                }
            };
            inputContainer.appendChild(card);
        });
    } 
    else if (q.type === 'text') {
        inputContainer.className = 'grid-1-col';
        inputContainer.innerHTML = `<input type="text" id="textInput" class="text-input" placeholder="Nhập câu trả lời vào đây nha...">`;
    }
});

// Xử lý nút Chốt
submitBtn.onclick = () => {
    if (currentType === 'text') {
        currentAnswer = document.getElementById('textInput').value;
        if (!currentAnswer.trim()) return alert("Phải nhập gì đó chứ!");
    } else {
        if (!currentAnswer || (Array.isArray(currentAnswer) && currentAnswer.length === 0)) {
            return alert("Phải chọn đáp án đã chứ!");
        }
    }

    // Gửi lên server
    socket.emit('submitAnswer', { answer: currentAnswer });
    
    // Đổi giao diện sang trạng thái chờ
    inputContainer.innerHTML = '';
    submitBtn.style.display = 'none';
    waitMsg.style.display = 'block';
};

socket.on('roundResult', (data) => {
    waitMsg.style.display = 'none';
    let msg = data.isMatch
        ? "<h2 style='color: #ff4d6d'>Tuyệt vời! Tâm linh tương thông! 💖</h2>"
        : "<h2 style='color: #6c757d'>Ối, mỗi người một ý rồi! 😂</h2>";

    msg += `<div class="result-box">
                <p>Lựa chọn của bạn: <b>${data.myChoice}</b></p>
                <p>Lựa chọn của người ấy: <b>${data.otherChoice}</b></p>
                <hr style="border: 1px dashed #ffb3c1;">
                <p>Tổng điểm tình yêu: <b style="color:#ff4d6d; font-size:1.3em;">${data.myScore}</b></p>
            </div>
            <div class="spinner" style="width: 30px; height: 30px; margin-top: 15px;"></div>
            <p style="font-size:0.9em;"><i>Chuẩn bị câu tiếp theo...</i></p>`;

    resultDiv.innerHTML = msg;
});

socket.on('gameOver', (data) => {
    resultDiv.innerHTML = `<h1>${data.message}</h1>
                           <div class="result-box">
                             <h2>Tổng điểm: ${data.finalScore} ❤️</h2>
                             <p>Cảm ơn hai bạn đã chơi cùng nhau!</p>
                           </div>`;
});

socket.on('playerLeft', (data) => {
    alert(data.message);
    location.reload();
});