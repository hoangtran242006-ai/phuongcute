const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let players = {}; // Lưu thông tin người chơi theo UID
let currentQuestionIndex = 0;
let gameStarted = false;

// Danh sách câu hỏi của bạn
const questions = [
    {
        id: 1, type: "single",
        question: "Cậu muốn gặp nhau bao nhiêu lần 1 tuần? 🥰",
        options: [
            { id: "A", text: "2-3 lần là đẹp" },
            { id: "B", text: "Ngày nào cũng nhìn nhau ngủ mới ngon" }
        ]
    },
    {
        id: 2, type: "single",
        question: "Tớ thích ăn món gì cậu biết khum? 🤤",
        options: [
            { id: "A", text: "Đồ Hàn" }, { id: "B", text: "Đồ Thái" },
            { id: "C", text: "Đồ Âu" }, { id: "D", text: "Đồ Việt" }
        ]
    },
    {
        id: 3, type: "multiple",
        question: "Em thích điều gì từ anh nhất? (Được chọn nhiều) 💖",
        options: [
            { id: "A", text: "Giỏi thấu hiểu" }, { id: "B", text: "Trẻ trung (GenZ)" },
            { id: "C", text: "Biết động viên" }, { id: "D", text: "Biết sửa lỗi" }
        ]
    },
    {
        id: 4, type: "text",
        question: "Thử thách: Cùng gõ Biệt Danh bạn hay gọi người yêu ở nhà? ✍️"
    }
];

io.on('connection', (socket) => {
    // Xử lý người chơi tham gia bằng ID cố định
    socket.on('joinRoom', (data) => {
        const uid = data.uid;
        const activeUids = Object.keys(players);

        // Nếu người mới toanh vào mà phòng đã có 2 người khác
        if (!players[uid] && activeUids.length >= 2) {
            socket.emit('full', { message: "Phòng đã đủ 2 người rồi nha! 💔" });
            return;
        }

        // Đăng ký hoặc cập nhật kết nối cho người chơi
        if (!players[uid]) {
            players[uid] = { socketId: socket.id, score: 0, currentChoice: null };
        } else {
            players[uid].socketId = socket.id; // Cập nhật lại kết nối nếu tải lại trang
        }

        // Gửi trạng thái chờ hoặc bắt đầu
        if (Object.keys(players).length < 2) {
            socket.emit('waiting', { message: "Đang chờ người ấy vào phòng... 💕" });
        } else {
            if (!gameStarted) {
                gameStarted = true;
                io.emit('gameStart', { message: "Đủ 2 người! Bắt đầu chơi nhé! 💖" });
                setTimeout(() => sendQuestion(), 2000);
            } else {
                // Nếu tải lại trang lúc đang chơi, gửi lại câu hỏi hiện tại
                socket.emit('newQuestion', questions[currentQuestionIndex]);
            }
        }
    });

    // Xử lý gửi tin nhắn Chat
    socket.on('sendChat', (data) => {
        // Gửi tin nhắn cho người còn lại
        socket.broadcast.emit('receiveChat', { text: data.text });
    });

    // Xử lý nút Chốt đáp án
    socket.on('submitAnswer', (data) => {
        if (!players[data.uid]) return;
        players[data.uid].currentChoice = data.answer;

        const activePlayers = Object.values(players);
        // Kiểm tra xem cả 2 đã chọn xong chưa
        const bothAnswered = activePlayers.length === 2 && activePlayers.every(p => p.currentChoice !== null);

        if (bothAnswered) {
            const p1 = activePlayers[0];
            const p2 = activePlayers[1];
            const currentQ = questions[currentQuestionIndex];

            // So sánh
            let isMatch = false;
            if (currentQ.type === 'text') {
                isMatch = (p1.currentChoice || "").toLowerCase().trim() === (p2.currentChoice || "").toLowerCase().trim();
            } else if (currentQ.type === 'multiple') {
                isMatch = JSON.stringify((p1.currentChoice || []).sort()) === JSON.stringify((p2.currentChoice || []).sort());
            } else {
                isMatch = p1.currentChoice === p2.currentChoice;
            }

            if (isMatch) { p1.score += 10; p2.score += 10; }

            // Gửi kết quả về đúng thiết bị
            io.to(p1.socketId).emit('roundResult', { 
                isMatch, myScore: p1.score, 
                myChoice: formatAnswer(p1.currentChoice, currentQ), 
                otherChoice: formatAnswer(p2.currentChoice, currentQ) 
            });
            io.to(p2.socketId).emit('roundResult', { 
                isMatch, myScore: p2.score, 
                myChoice: formatAnswer(p2.currentChoice, currentQ), 
                otherChoice: formatAnswer(p1.currentChoice, currentQ) 
            });

            // Reset lựa chọn
            p1.currentChoice = null; p2.currentChoice = null;
            currentQuestionIndex++;

            if (currentQuestionIndex < questions.length) {
                setTimeout(() => sendQuestion(), 6000);
            } else {
                setTimeout(() => {
                    io.emit('gameOver', { message: "Trò chơi kết thúc! 🎉", finalScore: p1.score });
                    resetGame();
                }, 6000);
            }
        }
    });

    // Tính năng giải cứu: Reset phòng khi bị kẹt
    socket.on('forceReset', () => {
        resetGame();
        io.emit('kicked'); // Đẩy tất cả ra để vào lại từ đầu
    });
});

function sendQuestion() {
    if(questions[currentQuestionIndex]) {
        io.emit('newQuestion', questions[currentQuestionIndex]);
    }
}

function resetGame() {
    players = {};
    currentQuestionIndex = 0;
    gameStarted = false;
}

function formatAnswer(ans, q) {
    if (q.type === 'text') return `"${ans}"`;
    if (q.type === 'single') {
        let opt = q.options.find(o => o.id === ans);
        return opt ? opt.text : ans;
    }
    if (q.type === 'multiple') {
        if (!ans || ans.length === 0) return "Không chọn gì 🥲";
        return ans.map(id => {
            let opt = q.options.find(o => o.id === id);
            return opt ? opt.text : id;
        }).join(", ");
    }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server chạy tại port ${PORT}`));