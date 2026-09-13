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
// Danh sách câu hỏi đầy đủ
const questions = [
    // --- PHẦN 1: THÓI QUEN & SỞ THÍCH ---
    {
        id: 1, type: "single",
        question: "Cậu thích đi đâu hơn? 🛵",
        options: [
            { id: "A", text: "Đi ăn vỗ béo nhau 🍲" },
            { id: "B", text: "Đi cà phê chụp hình sống ảo 📸" }
        ]
    },
    {
        id: 2, type: "multiple",
        question: "Tớ thích ăn món gì cậu biết khum? (Được chọn nhiều) 🤤",
        options: [
            { id: "A", text: "Đồ Hàn" }, { id: "B", text: "Đồ Thái" },
            { id: "C", text: "Đồ Âu" }, { id: "D", text: "Đồ Việt" }
        ]
    },
    {
        id: 3, type: "single",
        question: "Cậu muốn gặp nhau bao nhiêu lần 1 tuần? 🥰",
        options: [
            { id: "A", text: "2-3 lần là đẹp" },
            { id: "B", text: "Ngày nào cũng nhìn nhau ngủ mới ngon" }
        ]
    },
    {
        id: 4, type: "single",
        question: "Cậu thích đi du lịch ở đâu? ✈️",
        options: [
            { id: "A", text: "Lên núi ⛰️" },
            { id: "B", text: "Xuống biển 🌊" }
        ]
    },
    {
        id: 5, type: "single",
        question: "Lúc giận nhau cậu sẽ làm gì? 😤",
        options: [
            { id: "A", text: "Im lặng, bình tĩnh rồi giải quyết" },
            { id: "B", text: "Đang hăng bắt im không chịu được, vào cuộc luôn!" }
        ]
    },

    // --- PHẦN 2: DATING IDEAS (Có ảnh minh họa) ---
    {
        id: 6, type: "single",
        question: "Dating Idea: Cuối tuần này đưa người yêu đi... 🏃‍♂️🛌",
        options: [
            { id: "A", text: "Chạy bộ (-200 calo)", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400" },
            { id: "B", text: "Homestay (-1000 calo)", image: "https://images.unsplash.com/photo-1522771731470-8ee6dfd71c82?q=80&w=400" }
        ]
    },
    {
        id: 7, type: "single",
        question: "Dating Idea: Chỗ nào chill hơn? 🏊‍♀️🛁",
        options: [
            { id: "A", text: "Bể bơi", image: "https://images.unsplash.com/photo-1519315901367-f34f8a556d86?q=80&w=400" },
            { id: "B", text: "Bồn tắm", image: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?q=80&w=400" }
        ]
    },
    {
        id: 8, type: "single",
        question: "Dating Idea: Tối nay ăn gì? 🍢🍳",
        options: [
            { id: "A", text: "Đồ ăn nhanh", image: "https://images.unsplash.com/photo-1585553616435-2dc0a54e271d?q=80&w=400" },
            { id: "B", text: "Đồ ăn nhà làm", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=400" }
        ]
    },
    {
        id: 9, type: "single",
        question: "Dating Idea: Hẹn hò xem phim ở đâu? 🍿🎬",
        options: [
            { id: "A", text: "Xem phim tại rạp", image: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=400" },
            { id: "B", text: "Xem phim tại nhà", image: "https://images.unsplash.com/photo-1585647347384-2593bc35786b?q=80&w=400" }
        ]
    },

    // --- PHẦN 3: PHỎNG VẤN NGƯỜI YÊU ---
    {
        id: 10, type: "multiple",
        question: "Em sẽ thích điều gì từ anh hơn? (Được chọn nhiều) 💖",
        options: [
            { id: "A", text: "Giỏi thấu hiểu" }, { id: "B", text: "Giỏi yêu chiều" },
            { id: "C", text: "Trẻ trung (GenZ)" }, { id: "D", text: "Đàn ông (Menly)" },
            { id: "E", text: "Kiểu giỡn nhây" }, { id: "F", text: "Kiểu chững chạc" },
            { id: "G", text: "Biết động viên" }, { id: "H", text: "Biết sửa lỗi cho em" }
        ]
    },
    {
        id: 11, type: "single",
        question: "Tính cách anh hơi khó hiểu đúng hong? 🤔",
        options: [
            { id: "A", text: "Hong đúng" }, { id: "B", text: "Đôi lúc" },
            { id: "C", text: "Cũng đúng" }, { id: "D", text: "Rất đúng" }
        ]
    },
    {
        id: 12, type: "single",
        question: "Lúc đầu tiếp cận anh có khó gần hong? 🧊",
        options: [
            { id: "A", text: "Hong đúng" }, { id: "B", text: "Đôi lúc" },
            { id: "C", text: "Cũng đúng" }, { id: "D", text: "Rất đúng" }
        ]
    },
    {
        id: 13, type: "text",
        question: "Câu cuối: Cùng gõ biệt danh mà bạn hay gọi người ấy ở nhà nào! ✍️"
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