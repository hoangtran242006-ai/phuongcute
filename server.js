require('dotenv').config();

const express = require('express');
const http = require('node:http');
const { randomInt } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { Writable } = require('node:stream');
const { Server } = require('socket.io');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const app = express();
const server = http.createServer(app);
const aiQuestionsCachePath = path.join(__dirname, 'ai-questions-cache.json');
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

app.use(express.static('public'));
const IMAGE_HOSTS = new Set([
    'images.unsplash.com',
    'gotour.com.vn',
    'vinsen.vn',
    'timviec365.vn',
    'giadinh.mediacdn.vn'
]);

function normalizeImageUrl(value) {
    if (typeof value !== 'string') return '';
    const markdownMatch = /\]\((https?:\/\/[^)]+)\)/i.exec(value);
    const rawUrl = markdownMatch ? markdownMatch[1] : value.trim();

    try {
        const imageUrl = new URL(rawUrl);
        if (imageUrl.protocol !== 'https:' || !IMAGE_HOSTS.has(imageUrl.hostname)) return '';
        return imageUrl.toString();
    } catch {
        return '';
    }
}

async function readCachedAIQuestions() {
    try {
        const cachedQuestions = JSON.parse(await fs.readFile(aiQuestionsCachePath, 'utf8'));
        if (!Array.isArray(cachedQuestions) || cachedQuestions.length !== 13) return null;
        return cachedQuestions.map((question) => ({
            ...question,
            ...(Array.isArray(question.options) ? {
                options: question.options.map(({ image, ...option }) => option)
            } : {})
        }));
    } catch {
        return null;
    }
}

app.get('/image-proxy', async (req, res) => {
    const imageUrl = normalizeImageUrl(req.query.url);
    if (!imageUrl) return res.status(400).send('Invalid image URL');

    try {
        const response = await fetch(imageUrl, { signal: AbortSignal.timeout(12000) });
        if (!response.ok || !response.body) return res.status(response.status || 502).end();
        res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
        res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
        response.body.pipeTo(Writable.toWeb(res)).catch(() => res.end());
    } catch {
        res.status(502).end();
    }
});

app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true, service: 'couple-game' });
});

const defaultQuestions = [
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
        textMatchRequired: true,
        question: "Thử thách 1: Cả hai hãy cùng nhập BIỆT DANH ở nhà của BẠN GÁI! 👧✍️"
    },
    {
        id: 14, type: "text",
        textMatchRequired: true,
        question: "Thử thách 2: Cả hai hãy cùng nhập BIỆT DANH ở nhà của BẠN TRAI! 👦✍️"
    },
];

const rooms = {};
const socketPlayerMap = new Map();
const NEXT_QUESTION_DELAY = 6000;
async function generateAIQuestions() {
    // Đảm bảo bạn đang dùng model gemini-2.5-flash
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `Bạn là một chuyên gia tâm lý tình yêu và thiết kế trò chơi cho các cặp đôi.
    Hãy tạo một mảng JSON gồm đúng 13 câu hỏi trắc nghiệm tiếng Việt dành riêng cho cặp đôi đang yêu nhau chơi cùng nhau.
    Mục tiêu: Kiểm tra độ hiểu nhau, tăng sự gắn kết và tạo hứng khởi, có 1 chút gia vị 18+ (gợi cảm, táo bạo).

    YÊU CẦU NỘI DUNG (CỰC KỲ QUAN TRỌNG):
    1. Chủ đề: 100% xoay quanh tình yêu, thói quen hẹn hò, nụ hôn, sở thích đi date, món ăn và dịa điểm yêu thích, thích làm gì trong tình yêu, kỉ niệm của 2 người, tình huống hẹn hò, hiểu nhau và cảm xúc...
    2. Dạng "text" (tự nhập): Có thể tạo câu cần hai người trả lời giống nhau hoặc câu tự do không cần giống nhau. Gắn "textMatchRequired": true cho câu cần trùng khớp, false cho câu tự do. Câu trả lời nên ngắn gọn.
    3. Dạng "single" (chọn 1) và "multiple" (chọn nhiều): Chiếm 12 câu. Đáp án thực tế, thú vị, gen z.
    Trả về ĐÚNG 1 mảng JSON [] chứa 13 object, KHÔNG kèm markdown \`\`\`json ở đầu.
    {
        "id": 1,
        "type": "single", // hoặc "multiple", "text"
        "textMatchRequired": true, // chỉ dùng cho type text
        "question": "Nội dung câu hỏi táo bạo...",
        "options": [ {"id": "A", "text": "Đáp án 1"}, {"id": "B", "text": "Đáp án 2"} ]
    }`;

    try {
        const result = await Promise.race([
            model.generateContent(prompt),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini phản hồi quá lâu.')), 30000))
        ]);
        let rawText = result.response.text();

        // Dọn dẹp markdown nếu AI lỡ sinh ra
        rawText = rawText.replaceAll('```json', '').replaceAll('```', '').trim();

        const aiQuestions = JSON.parse(rawText);
        if (!Array.isArray(aiQuestions) || aiQuestions.length !== 13) throw new Error('AI không trả về đúng 13 câu hỏi.');

        return aiQuestions.map((question, index) => {
            const type = ['single', 'multiple', 'text'].includes(question?.type) ? question.type : 'single';
            let options;
            if (type !== 'text') {
                options = (Array.isArray(question.options) ? question.options : [])
                    .slice(0, 6)
                    .map((option, optionIndex) => ({
                        id: String(option?.id || String.fromCodePoint(65 + optionIndex)).slice(0, 2),
                        text: String(option?.text || `Lựa chọn ${optionIndex + 1}`).slice(0, 180),
                    }));
            }

            if (type !== 'text' && options.length < 2) throw new Error(`Câu ${index + 1} thiếu đáp án hợp lệ.`);
            return {
                id: index + 1,
                type,
                ...(type === 'text' ? { textMatchRequired: question?.textMatchRequired !== false } : {}),
                question: String(question?.question || `Câu hỏi ${index + 1}`).slice(0, 300),
                ...(type === 'text' ? {} : { options })
            };
        });
    } catch (error) {
        console.error("Lỗi khi tạo câu hỏi AI:", error);
        throw error;
    }
}

async function prepareAIQuestions() {
    const cachedQuestions = await readCachedAIQuestions();
    if (cachedQuestions) {
        console.log('Đã nạp bộ câu hỏi AI từ cache.');
        return cachedQuestions;
    }

    console.log('Đang chuẩn bị bộ câu hỏi AI khi server khởi động...');
    const questions = await generateAIQuestions();
    await fs.writeFile(aiQuestionsCachePath, JSON.stringify(questions, null, 2), 'utf8');
    console.log('Đã chuẩn bị bộ câu hỏi AI không kèm ảnh.');
    return questions;
}

const aiQuestionsReady = prepareAIQuestions().catch((error) => {
    console.error('Không thể chuẩn bị bộ câu hỏi AI lúc khởi động:', error.message);
    return null;
});

function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i += 1) {
        code += chars[randomInt(chars.length)];
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
            gameStarted: false,
            activeQuestions: []
        };
    }
    return rooms[roomCode];
}

function sendQuestion(roomCode) {
    const room = rooms[roomCode];
    if (!room?.activeQuestions?.[room.currentQuestionIndex]) return;
    io.to(roomCode).emit('newQuestion', room.activeQuestions[room.currentQuestionIndex]);
}

function resetRoom(roomCode) {
    if (!rooms[roomCode]) return;
    rooms[roomCode].players = {};
    rooms[roomCode].currentQuestionIndex = 0;
    rooms[roomCode].gameStarted = false;
    rooms[roomCode].activeQuestions = [];
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

function getSimilarityPercent(firstAnswer, secondAnswer, question) {
    if (question.type === 'text') {
        return (firstAnswer || '').toLowerCase().trim() === (secondAnswer || '').toLowerCase().trim() ? 100 : 0;
    }

    if (question.type === 'multiple') {
        const firstChoices = [...new Set(firstAnswer || [])];
        const secondChoices = [...new Set(secondAnswer || [])];
        const sharedChoices = firstChoices.filter((choice) => secondChoices.includes(choice)).length;
        const comparedChoices = Math.max(firstChoices.length, secondChoices.length);
        return comparedChoices ? Math.round((sharedChoices / comparedChoices) * 100) : 0;
    }

    return firstAnswer === secondAnswer ? 100 : 0;
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
            io.to(targetCode).emit('showModeSelect');
        } else {
            socket.emit('newQuestion', room.activeQuestions[room.currentQuestionIndex]);
        }
    });

    socket.on('selectMode', async (data) => {
        const roomInfo = socketPlayerMap.get(socket.id);
        if (!roomInfo || !['default', 'ai'].includes(data?.mode)) return;

        const room = rooms[roomInfo.roomCode];
        if (!room || Object.keys(room.players).length !== 2 || room.gameStarted) return;

        room.gameStarted = true;
        io.to(roomInfo.roomCode).emit('loadingQuestions', {
            message: data.mode === 'ai' ? 'Đang tải câu hỏi A.I...' : 'Đang chuẩn bị câu hỏi...'
        });

        try {
            room.activeQuestions = data.mode === 'ai' ? await aiQuestionsReady : defaultQuestions;
            const expectedQuestionCount = data.mode === 'ai' ? 13 : defaultQuestions.length;
            if (room.activeQuestions?.length !== expectedQuestionCount) throw new Error(`Bộ câu hỏi phải có đúng ${expectedQuestionCount} câu.`);
            io.to(roomInfo.roomCode).emit('gameStart', { message: 'Đủ 2 người! Bắt đầu chơi nhé! 💖' });
            setTimeout(() => sendQuestion(roomInfo.roomCode), 1000);
        } catch (error) {
            room.gameStarted = false;
            room.activeQuestions = [];
            io.to(roomInfo.roomCode).emit('questionError', {
                message: 'Không thể tải bộ câu hỏi A.I. Hãy thử chọn lại nhé.'
            });
            console.error('Không thể tạo câu hỏi A.I.:', error.message);
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
        if (!room?.players?.[data.uid]) return;

        room.players[data.uid].currentChoice = data.answer;

        const activePlayers = Object.values(room.players);
        const bothAnswered = activePlayers.length === 2 && activePlayers.every((player) => player.currentChoice !== null);

        if (!bothAnswered) return;

        const p1 = activePlayers[0];
        const p2 = activePlayers[1];
        const currentQ = room.activeQuestions[room.currentQuestionIndex];
        if (!currentQ) return;

        const textMatchRequired = currentQ.type !== 'text' || currentQ.textMatchRequired !== false;
        const similarityPercent = textMatchRequired
            ? getSimilarityPercent(p1.currentChoice, p2.currentChoice, currentQ)
            : 100;
        const isMatch = similarityPercent === 100;
        const similarityPoints = similarityPercent / 10;
        p1.score += similarityPoints;
        p2.score += similarityPoints;
        const cumulativeSimilarity = Math.round((p1.score / (currentQ.id * 10)) * 100);

        io.to(p1.socketId).emit('roundResult', {
            isMatch,
            textMatchRequired,
            similarityPercent,
            cumulativeSimilarity,
            nextQuestionDelay: NEXT_QUESTION_DELAY,
            myScore: p1.score,
            matchedCount: p1.score / 10,
            questionNumber: currentQ.id,
            totalQuestions: room.activeQuestions.length,
            myChoice: formatAnswer(p1.currentChoice, currentQ),
            otherChoice: formatAnswer(p2.currentChoice, currentQ)
        });

        io.to(p2.socketId).emit('roundResult', {
            isMatch,
            textMatchRequired,
            similarityPercent,
            cumulativeSimilarity,
            nextQuestionDelay: NEXT_QUESTION_DELAY,
            myScore: p2.score,
            matchedCount: p2.score / 10,
            questionNumber: currentQ.id,
            totalQuestions: room.activeQuestions.length,
            myChoice: formatAnswer(p2.currentChoice, currentQ),
            otherChoice: formatAnswer(p1.currentChoice, currentQ)
        });

        p1.currentChoice = null;
        p2.currentChoice = null;
        room.currentQuestionIndex += 1;

        if (room.currentQuestionIndex < room.activeQuestions.length) {
            setTimeout(() => sendQuestion(roomInfo.roomCode), NEXT_QUESTION_DELAY);
        } else {
            setTimeout(() => {
                io.to(roomInfo.roomCode).emit('gameOver', {
                    message: 'Trò chơi kết thúc! 🎉',
                    finalScore: p1.score,
                    secondScore: p2.score,
                    similarity: Math.round((p1.score / (room.activeQuestions.length * 10)) * 100),
                    totalQuestions: room.activeQuestions.length,
                    matchedCount: p1.score / 10
                });
                resetRoom(roomInfo.roomCode);
            }, NEXT_QUESTION_DELAY);
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