const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let players = [];
let playerChoices = {};
let scores = {};
let currentQuestionIndex = 0;

// CẤU TRÚC CÂU HỎI ĐA NĂNG
const questions = [
    {
        id: 1,
        type: "single", // Chọn 1 (2 đáp án)
        question: "Cậu muốn gặp nhau bao nhiêu lần 1 tuần? 🥰",
        options: [
            { id: "A", text: "2-3 lần là đẹp" },
            { id: "B", text: "Ngày nào cũng nhìn nhau ngủ mới ngon" }
        ]
    },
    {
        id: 2,
        type: "single", // Chọn 1 (4 đáp án)
        question: "Tớ thích ăn món gì cậu biết khum? 🤤",
        options: [
            { id: "A", text: "Đồ Hàn" },
            { id: "B", text: "Đồ Thái" },
            { id: "C", text: "Đồ Âu" },
            { id: "D", text: "Đồ Việt" }
        ]
    },
    {
        id: 3,
        type: "single", // Chọn 1 (Có kèm ảnh theo phong cách thẻ Dating Idea)
        question: "Dating Idea: Đưa cái này cho người yêu chọn nè! 🏖️",
        options: [
            { id: "A", text: "Bể bơi", image: "https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?w=400&q=80" }, // Bạn thay link ảnh thật vào đây
            { id: "B", text: "Bồn tắm", image: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=400&q=80" }
        ]
    },
    {
        id: 4,
        type: "multiple", // Chọn nhiều (Checkboxes)
        question: "Em thích điều gì từ anh nhất? (Được chọn nhiều) 💖",
        options: [
            { id: "A", text: "Giỏi thấu hiểu" },
            { id: "B", text: "Trẻ trung (GenZ)" },
            { id: "C", text: "Biết động viên" },
            { id: "D", text: "Biết sửa lỗi" }
        ]
    },
    {
        id: 5,
        type: "text", // Tự gõ đáp án
        question: "Thử thách: Cùng gõ Biệt Danh bạn hay gọi người yêu ở nhà? ✍️",
        // Không cần options cho dạng text
    }
];

io.on('connection', (socket) => {
    if (players.length >= 2) {
        socket.emit('full', { message: "Phòng chơi đã đủ 2 người rồi nha! 💔" });
        socket.disconnect();
        return;
    }

    players.push(socket.id);
    scores[socket.id] = 0;

    socket.emit('waiting', { message: "Đang chờ người ấy vào phòng... 💕" });

    if (players.length === 2) {
        io.emit('gameStart', { message: "Ghép đôi thành công! Chuẩn bị chơi nhé! 💖" });
        setTimeout(() => sendQuestion(), 2500);
    }

    socket.on('submitAnswer', (data) => {
        playerChoices[socket.id] = data.answer; // Lưu cả string hoặc array

        if (Object.keys(playerChoices).length === 2) {
            const p1 = players[0];
            const p2 = players[1];
            const ans1 = playerChoices[p1];
            const ans2 = playerChoices[p2];
            const currentQ = questions[currentQuestionIndex];

            // Hàm kiểm tra khớp đáp án linh hoạt
            let isMatch = false;
            if (currentQ.type === 'text') {
                // Chuyển về chữ thường, xoá khoảng trắng thừa để so sánh
                isMatch = (ans1 || "").toLowerCase().trim() === (ans2 || "").toLowerCase().trim();
            } else if (currentQ.type === 'multiple') {
                // So sánh mảng
                isMatch = JSON.stringify((ans1 || []).sort()) === JSON.stringify((ans2 || []).sort());
            } else {
                isMatch = ans1 === ans2;
            }

            if (isMatch) {
                scores[p1] += 10;
                scores[p2] += 10;
            }

            // Xử lý hiển thị đáp án đẹp hơn
            let displayAns1 = formatAnswer(ans1, currentQ);
            let displayAns2 = formatAnswer(ans2, currentQ);

            io.to(p1).emit('roundResult', { isMatch, myScore: scores[p1], myChoice: displayAns1, otherChoice: displayAns2 });
            io.to(p2).emit('roundResult', { isMatch, myScore: scores[p2], myChoice: displayAns2, otherChoice: displayAns1 });

            playerChoices = {};
            currentQuestionIndex++;

            if (currentQuestionIndex < questions.length) {
                setTimeout(() => sendQuestion(), 6000); 
            } else {
                setTimeout(() => {
                    io.emit('gameOver', { message: "Trò chơi kết thúc! 🎉", finalScore: scores[p1] });
                    currentQuestionIndex = 0; 
                }, 6000);
            }
        }
    });

    socket.on('disconnect', () => {
        players = players.filter(id => id !== socket.id);
        delete scores[socket.id];
        delete playerChoices[socket.id];
        io.emit('playerLeft', { message: "Người ấy đã thoát hoặc mất kết nối! 😢" });
        currentQuestionIndex = 0;
        playerChoices = {};
    });
});

function sendQuestion() {
    if(questions[currentQuestionIndex]) {
        io.emit('newQuestion', questions[currentQuestionIndex]);
    }
}

function formatAnswer(ans, q) {
    if (q.type === 'text') return `"${ans}"`;
    if (q.type === 'single') {
        let opt = q.options.find(o => o.id === ans);
        return opt ? opt.text : ans;
    }
    if (q.type === 'multiple') {
        if (!ans || ans.length === 0) return "Không chọn gì 🥲";
        let texts = ans.map(id => {
            let opt = q.options.find(o => o.id === id);
            return opt ? opt.text : id;
        });
        return texts.join(", ");
    }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server chạy tại port ${PORT}`));