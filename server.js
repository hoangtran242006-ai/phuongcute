const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Phục vụ các file tĩnh trong thư mục public
app.use(express.static('public'));

let players = [];
let playerChoices = {};
let scores = {};
let currentQuestionIndex = 0;

// Danh sách câu hỏi (Bạn có thể tự do thêm câu hỏi và link ảnh tại đây)
const questions = [
    {
        id: 1,
        question: "Ai là người hay dỗi hơn? 🥺",
        options: [
            { id: "A", text: "Chàng trai", image: "https://cdn-icons-png.flaticon.com/512/4140/4140047.png" },
            { id: "B", text: "Cô gái", image: "https://cdn-icons-png.flaticon.com/512/4140/4140048.png" }
        ]
    },
    {
        id: 2,
        question: "Món ăn nào cho buổi hẹn hò cuối tuần này? 🍕",
        options: [
            { id: "A", text: "Trà sữa & Bánh ngọt", image: "https://cdn-icons-png.flaticon.com/512/3081/3081162.png" },
            { id: "B", text: "Thịt nướng", image: "https://cdn-icons-png.flaticon.com/512/3143/3143644.png" }
        ]
    }
];

io.on('connection', (socket) => {
    // Chỉ cho phép 2 người vào phòng
    if (players.length >= 2) {
        socket.emit('full', { message: "Phòng chơi đã đủ 2 người rồi nha! 💔" });
        socket.disconnect();
        return;
    }

    players.push(socket.id);
    scores[socket.id] = 0;

    socket.emit('waiting', { message: "Đang chờ người ấy vào phòng... 💕" });

    // Đủ 2 người thì bắt đầu
    if (players.length === 2) {
        io.emit('gameStart', { message: "Ghép đôi thành công! Chuẩn bị chơi nhé! 💖" });
        setTimeout(() => sendQuestion(), 2500);
    }

    // Nhận đáp án từ client
    socket.on('submitAnswer', (data) => {
        playerChoices[socket.id] = data.answerId;

        // Khi cả 2 đã chọn xong mới tính điểm
        if (Object.keys(playerChoices).length === 2) {
            const p1 = players[0];
            const p2 = players[1];
            const choice1 = playerChoices[p1];
            const choice2 = playerChoices[p2];

            // Nếu 2 người chọn giống nhau (tâm linh tương thông) thì cộng điểm
            const isMatch = choice1 === choice2;
            if (isMatch) {
                scores[p1] += 10;
                scores[p2] += 10;
            }

            // Gửi kết quả cho từng người
            io.to(p1).emit('roundResult', { isMatch, myScore: scores[p1], myChoice: choice1, otherChoice: choice2 });
            io.to(p2).emit('roundResult', { isMatch, myScore: scores[p2], myChoice: choice2, otherChoice: choice1 });

            // Reset lựa chọn và chuyển câu tiếp theo sau 6 giây
            playerChoices = {};
            currentQuestionIndex++;

            if (currentQuestionIndex < questions.length) {
                setTimeout(() => sendQuestion(), 6000); 
            } else {
                setTimeout(() => {
                    io.emit('gameOver', { message: "Trò chơi kết thúc! 🎉" });
                    currentQuestionIndex = 0; // Reset cho ván sau
                }, 6000);
            }
        }
    });

    socket.on('disconnect', () => {
        players = players.filter(id => id !== socket.id);
        delete scores[socket.id];
        delete playerChoices[socket.id];
        io.emit('playerLeft', { message: "Người ấy đã thoát hoặc mất kết nối! 😢 Đang tải lại..." });
        currentQuestionIndex = 0;
        playerChoices = {};
    });
});

function sendQuestion() {
    if(questions[currentQuestionIndex]) {
        io.emit('newQuestion', questions[currentQuestionIndex]);
    }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server chạy tại port ${PORT}`);
});