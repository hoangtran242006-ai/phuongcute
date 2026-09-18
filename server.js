const express = require('express');
const http = require('node:http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

app.use(express.static('public'));

app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true, service: 'couple-game' });
});

const questions = [
    // --- PHẦN 1: THÓI QUEN & SỞ THÍCH ---
    {
        id: 1, type: "single",
        question: "Khi đi date thì cậu thích đi đâu hơn? 🛵",
        options: [
            { id: "A", text: "Đi ăn cùng nhau tăng tình cảm 🍲" },
            { id: "B", text: "Đi cà phê trò chuyện, chụp hình sống ảo 📸" }
        ]
    },
    {
        id: 2, type: "multiple",
        question: "Món ăn yêu thích của chúng mình là gì nhỉ? (Được chọn nhiều) 🤤",
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
        question: "Nếu cùng đi du lịch, cậu thích đi đâu? ✈️",
        options: [
            { id: "A", text: "Lên núi ⛰️" },
            { id: "B", text: "Xuống biển 🌊" }
        ]
    },
    {
        id: 5, type: "single",
        question: "Lúc hai đứa giận nhau thì nên làm gì? 😤",
        options: [
            { id: "A", text: "Im lặng, bình tĩnh rồi giải quyết" },
            { id: "B", text: "Phải vào cuộc nói chuyện rõ ràng luôn chứ!" }
        ]
    },

    // --- PHẦN 2: DATING IDEAS (Chọn qua ảnh) ---
    {
        id: 6, type: "single",
        question: "Dating Idea: Cuối tuần này hẹn hò kiểu gì? 🏃‍♂️🛌",
        options: [
            { id: "A", text: "Chạy bộ (-200 calo)", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400" },
            { id: "B", text: "Homestay (-1000 calo)", image: "https://gotour.com.vn/wp-content/uploads/2021/05/The-Hidden-Jewel-Homestay-Quy-Nhon-1024x699.jpg" }
        ]
    },
    {
        id: 7, type: "single",
        question: "Dating Idea: Thích không gian nào hơn? 🏊‍♀️🛁",
        options: [
            { id: "A", text: "Bể bơi", image: "https://vinsen.vn/wp-content/uploads/2023/04/388539015.jpg" },
            { id: "B", text: "Bồn tắm", image: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?q=80&w=400" }
        ]
    },
    {
        id: 8, type: "single",
        question: "Dating Idea: Tối nay ăn gì đây? 🍢🍳",
        options: [
            { id: "A", text: "Đồ ăn nhanh lề đường", image: "https://timviec365.vn/pictures/images/xac-dinh-linh-vuc.jpg" },
            { id: "B", text: "Cơm nhà tự nấu", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=400" }
        ]
    },
    {
        id: 9, type: "single",
        question: "Dating Idea: Không gian xem phim lý tưởng? 🍿🎬",
        options: [
            { id: "A", text: "Xem phim tại rạp", image: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=400" },
            { id: "B", text: "Nằm ôm nhau xem tại nhà", image: "https://giadinh.mediacdn.vn/Images/Uploaded/Share/2011/08/01/xemphim.jpg" }
        ]
    },

    // --- PHẦN 3: HIỂU NHAU & TÍNH CÁCH ---
    {
        id: 10, type: "single",
        question: "Điều gì quan trọng nhất khi hai đứa ở bên nhau? 💖",
        options: [
            { id: "A", text: "Luôn thấu hiểu nhau" },
            { id: "B", text: "Nuông chiều đối phương" },
            { id: "C", text: "Hài hước, hay giỡn nhây" },
            { id: "D", text: "Chững chạc và an toàn" },
            { id: "E", text: "Biết lắng nghe và động viên" },
            { id: "F", text: "Bao dung, cùng sửa sai" }
        ]
    },
    {
        id: 11, type: "single",
        question: "Trong hai đứa, ai là người hay làm nũng/dỗi hơn? 🥺",
        options: [
            { id: "A", text: "Bạn gái chắc luôn" },
            { id: "B", text: "Bạn trai chứ ai" },
            { id: "C", text: "Ngang nhau cả đôi" }
        ]
    },
    {
        id: 12, type: "single",
        question: "Ai là người chủ động 'bật đèn xanh' trước lúc mới quen? ✨",
        options: [
            { id: "A", text: "Bạn trai chủ động" },
            { id: "B", text: "Bạn gái thả thính trước" }
        ]
    },

    // --- PHẦN 4: THỬ THÁCH NHẬP CHỮ (ĐÃ FIX LOGIC) ---
    {
        id: 13, type: "text",
        question: "Thử thách 1: Cả hai hãy cùng nhập BIỆT DANH ở nhà của BẠN GÁI! 👧✍️"
    },
    {
        id: 14, type: "text",
        question: "Thử thách 2: Cả hai hãy cùng nhập BIỆT DANH ở nhà của BẠN TRAI! 👦✍️"
    }
];

const rooms = {};
const socketPlayerMap = new Map();

// 1. Thay thế hàm tạo mã phòng để không bị phụ thuộc vào crypto
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i += 1) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

function sanitizeRoomCode(code) {
    return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

function getRoom(roomCode) {
    if (!rooms[roomCode]) {
        rooms[roomCode] = {
            players: {},
            currentQuestionIndex: 0,
            gameStarted: false
        };
    }
    return rooms[roomCode];
}

function sendQuestion(roomCode) {
    const room = rooms[roomCode];
    if (!room || !questions[room.currentQuestionIndex]) return;
    io.to(roomCode).emit('newQuestion', questions[room.currentQuestionIndex]);
}

function resetRoom(roomCode) {
    if (!rooms[roomCode]) return;
    rooms[roomCode].players = {};
    rooms[roomCode].currentQuestionIndex = 0;
    rooms[roomCode].gameStarted = false;
    delete rooms[roomCode];
}

function formatAnswer(ans, q) {
    if (q.type === 'text') return `"${ans}"`;
    if (q.type === 'single') {
        const opt = q.options.find((item) => item.id === ans);
        return opt ? opt.text : ans;
    }
    if (q.type === 'multiple') {
        if (!ans || ans.length === 0) return 'Không chọn gì 🥲';
        return ans.map((id) => {
            const opt = q.options.find((item) => item.id === id);
            return opt ? opt.text : id;
        }).join(', ');
    }
    return String(ans || '');
}

io.on('connection', (socket) => {
    socket.on('joinRoom', (data) => {
        const roomCodeInput = sanitizeRoomCode(data?.roomCode);
        const uid = data?.uid;
        const safeName = String(data?.nickname || 'Người yêu cute').trim().slice(0, 20) || 'Người yêu cute';

        if (!uid) {
            socket.emit('roomError', { message: 'Không nhận diện được người chơi. Hãy tải lại trang và thử lại 💗' });
            return;
        }

        let targetCode = roomCodeInput;

        if (data?.createRoom) {
            targetCode = targetCode || generateRoomCode();
        } else if (!targetCode) {
            socket.emit('roomError', { message: 'Bạn chưa nhập mã phòng. Hãy tạo phòng mới hoặc nhập mã hợp lệ.' });
            return;
        } else if (!rooms[targetCode]) {
            socket.emit('roomError', { message: 'Phòng này chưa tồn tại. Hãy tạo phòng mới trước nhé 😘' });
            return;
        }

        const room = getRoom(targetCode);

        if (!room.players[uid] && Object.keys(room.players).length >= 2) {
            socket.emit('full', { message: 'Phòng này đã đủ 2 người rồi. Hãy tạo phòng mới hoặc nhập mã khác 💔' });
            return;
        }

        socket.join(targetCode);
        socketPlayerMap.set(socket.id, { roomCode: targetCode, uid });

        if (!room.players[uid]) {
            room.players[uid] = {
                socketId: socket.id,
                nickname: safeName,
                score: 0,
                currentChoice: null
            };
        } else {
            room.players[uid].socketId = socket.id;
            room.players[uid].nickname = safeName;
        }

        socket.emit('roomJoined', { roomCode: targetCode, nickname: safeName });

        if (Object.keys(room.players).length < 2) {
            io.to(targetCode).emit('waiting', { message: 'Đang chờ người ấy vào phòng... 💕' });
        } else if (!room.gameStarted) {
            room.gameStarted = true;
            io.to(targetCode).emit('gameStart', { message: 'Đủ 2 người! Bắt đầu chơi nhé! 💖' });
            setTimeout(() => sendQuestion(targetCode), 2000);
        } else {
            socket.emit('newQuestion', questions[room.currentQuestionIndex]);
        }
    });

    // 2. Tìm đoạn socket.on('sendChat', ...) và sửa io.to thành socket.to
socket.on('sendChat', (data) => {
    const roomInfo = socketPlayerMap.get(socket.id);
    if (!roomInfo || !data?.text) return;
    
    // Dùng socket.to() để chỉ phát tin nhắn cho người yêu, không dội ngược lại bạn
    socket.to(roomInfo.roomCode).emit('receiveChat', {
        text: data.text,
        sender: socket.id
    });
});

    socket.on('submitAnswer', (data) => {
        const roomInfo = socketPlayerMap.get(socket.id);
        if (!roomInfo || !data) return;

        const room = rooms[roomInfo.roomCode];
        if (!room || !room.players || !room.players[data.uid]) return;

        room.players[data.uid].currentChoice = data.answer;

        const activePlayers = Object.values(room.players);
        const bothAnswered = activePlayers.length === 2 && activePlayers.every((player) => player.currentChoice !== null);

        if (!bothAnswered) return;

        const p1 = activePlayers[0];
        const p2 = activePlayers[1];
        const currentQ = questions[room.currentQuestionIndex];

        let isMatch = false;
        if (currentQ.type === 'text') {
            isMatch = (p1.currentChoice || '').toLowerCase().trim() === (p2.currentChoice || '').toLowerCase().trim();
        } else if (currentQ.type === 'multiple') {
            isMatch = JSON.stringify((p1.currentChoice || []).slice().sort()) === JSON.stringify((p2.currentChoice || []).slice().sort());
        } else {
            isMatch = p1.currentChoice === p2.currentChoice;
        }

        if (isMatch) {
            p1.score += 10;
            p2.score += 10;
        }

        io.to(p1.socketId).emit('roundResult', {
            isMatch,
            myScore: p1.score,
            matchedCount: p1.score / 10,
            questionNumber: currentQ.id,
            totalQuestions: questions.length,
            myChoice: formatAnswer(p1.currentChoice, currentQ),
            otherChoice: formatAnswer(p2.currentChoice, currentQ)
        });

        io.to(p2.socketId).emit('roundResult', {
            isMatch,
            myScore: p2.score,
            matchedCount: p2.score / 10,
            questionNumber: currentQ.id,
            totalQuestions: questions.length,
            myChoice: formatAnswer(p2.currentChoice, currentQ),
            otherChoice: formatAnswer(p1.currentChoice, currentQ)
        });

        p1.currentChoice = null;
        p2.currentChoice = null;
        room.currentQuestionIndex += 1;

        if (room.currentQuestionIndex < questions.length) {
            setTimeout(() => sendQuestion(roomInfo.roomCode), 5000);
        } else {
            setTimeout(() => {
                io.to(roomInfo.roomCode).emit('gameOver', {
                    message: 'Trò chơi kết thúc! 🎉',
                    finalScore: p1.score,
                    secondScore: p2.score,
                    similarity: Math.round((p1.score / (questions.length * 10)) * 100),
                    totalQuestions: questions.length,
                    matchedCount: p1.score / 10
                });
                resetRoom(roomInfo.roomCode);
            }, 5000);
        }
    });

    socket.on('forceReset', (data) => {
        const roomInfo = socketPlayerMap.get(socket.id);
        const roomCode = sanitizeRoomCode(data?.roomCode || roomInfo?.roomCode);
        if (!roomCode) return;
        resetRoom(roomCode);
        io.to(roomCode).emit('kicked');
    });

    socket.on('disconnect', () => {
        const roomInfo = socketPlayerMap.get(socket.id);
        if (!roomInfo) return;

        const room = rooms[roomInfo.roomCode];
        if (!room) {
            socketPlayerMap.delete(socket.id);
            return;
        }

        delete room.players[roomInfo.uid];
        socketPlayerMap.delete(socket.id);

        if (Object.keys(room.players).length === 0) {
            delete rooms[roomInfo.roomCode];
            return;
        }

        io.to(roomInfo.roomCode).emit('waiting', { message: 'Một người đã rời phòng, đang chờ người yêu quay lại... 💗' });
        room.gameStarted = false;
        room.currentQuestionIndex = 0;
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server chạy tại port ${PORT}`));