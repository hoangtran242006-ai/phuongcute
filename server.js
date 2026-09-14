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
    { id: 1, type: 'single', question: 'Cậu thích đi đâu hơn? 🛵', options: [{ id: 'A', text: 'Đi ăn vỗ béo nhau 🍲' }, { id: 'B', text: 'Đi cà phê chụp hình sống ảo 📸' }] },
    { id: 2, type: 'multiple', question: 'Tớ thích ăn món gì cậu biết khum? (Được chọn nhiều) 🤤', options: [{ id: 'A', text: 'Đồ Hàn' }, { id: 'B', text: 'Đồ Thái' }, { id: 'C', text: 'Đồ Âu' }, { id: 'D', text: 'Đồ Việt' }] },
    { id: 3, type: 'single', question: 'Cậu muốn gặp nhau bao nhiêu lần 1 tuần? 🥰', options: [{ id: 'A', text: '2-3 lần là đẹp' }, { id: 'B', text: 'Ngày nào cũng nhìn nhau ngủ mới ngon' }] },
    { id: 4, type: 'single', question: 'Cậu thích đi du lịch ở đâu? ✈️', options: [{ id: 'A', text: 'Lên núi ⛰️' }, { id: 'B', text: 'Xuống biển 🌊' }] },
    { id: 5, type: 'single', question: 'Lúc giận nhau cậu sẽ làm gì? 😤', options: [{ id: 'A', text: 'Im lặng, bình tĩnh rồi giải quyết' }, { id: 'B', text: 'Đang hăng bắt im không chịu được, vào cuộc luôn!' }] },
    { id: 6, type: 'single', question: 'Dating Idea: Cuối tuần này đưa người yêu đi... 🏃‍♂️🛌', options: [{ id: 'A', text: 'Chạy bộ (-200 calo)', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400' }, { id: 'B', text: 'Homestay (-1000 calo)', image: 'https://images.unsplash.com/photo-1522771731470-8ee6dfd71c82?q=80&w=400' }] },
    { id: 7, type: 'single', question: 'Dating Idea: Chỗ nào chill hơn? 🏊‍♀️🛁', options: [{ id: 'A', text: 'Bể bơi', image: 'https://images.unsplash.com/photo-1519315901367-f34f8a556d86?q=80&w=400' }, { id: 'B', text: 'Bồn tắm', image: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?q=80&w=400' }] },
    { id: 8, type: 'single', question: 'Dating Idea: Tối nay ăn gì? 🍢🍳', options: [{ id: 'A', text: 'Đồ ăn nhanh', image: 'https://images.unsplash.com/photo-1585553616435-2dc0a54e271d?q=80&w=400' }, { id: 'B', text: 'Đồ ăn nhà làm', image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=400' }] },
    { id: 9, type: 'single', question: 'Dating Idea: Hẹn hò xem phim ở đâu? 🍿🎬', options: [{ id: 'A', text: 'Xem phim tại rạp', image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=400' }, { id: 'B', text: 'Xem phim tại nhà', image: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?q=80&w=400' }] },
    { id: 10, type: 'multiple', question: 'Em sẽ thích điều gì từ anh hơn? (Được chọn nhiều) 💖', options: [{ id: 'A', text: 'Giỏi thấu hiểu' }, { id: 'B', text: 'Giỏi yêu chiều' }, { id: 'C', text: 'Trẻ trung (GenZ)' }, { id: 'D', text: 'Đàn ông (Menly)' }, { id: 'E', text: 'Kiểu giỡn nhây' }, { id: 'F', text: 'Kiểu chững chạc' }, { id: 'G', text: 'Biết động viên' }, { id: 'H', text: 'Biết sửa lỗi cho em' }] },
    { id: 11, type: 'single', question: 'Tính cách anh hơi khó hiểu đúng hong? 🤔', options: [{ id: 'A', text: 'Hong đúng' }, { id: 'B', text: 'Đôi lúc' }, { id: 'C', text: 'Cũng đúng' }, { id: 'D', text: 'Rất đúng' }] },
    { id: 12, type: 'single', question: 'Lúc đầu tiếp cận anh có khó gần hong? 🧊', options: [{ id: 'A', text: 'Hong đúng' }, { id: 'B', text: 'Đôi lúc' }, { id: 'C', text: 'Cũng đúng' }, { id: 'D', text: 'Rất đúng' }] },
    { id: 13, type: 'text', question: 'Câu cuối: Cùng gõ biệt danh mà bạn hay gọi người ấy ở nhà nào! ✍️' }
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
            myChoice: formatAnswer(p1.currentChoice, currentQ),
            otherChoice: formatAnswer(p2.currentChoice, currentQ)
        });

        io.to(p2.socketId).emit('roundResult', {
            isMatch,
            myScore: p2.score,
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
                    secondScore: p2.score
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