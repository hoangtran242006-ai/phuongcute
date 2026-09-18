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
const ambientCanvas = document.getElementById('ambientCanvas');
const cursorGlow = document.querySelector('.cursor-glow');
const loginSpotlight = document.querySelector('.login-spotlight');
const roomTransition = document.getElementById('roomTransition');
const transitionBloom = document.querySelector('.transition-bloom');
const transitionEyebrow = document.getElementById('transitionEyebrow');
const transitionTitle = document.getElementById('transitionTitle');
const transitionDetail = document.getElementById('transitionDetail');

const motion = { duration: 0.65, ease: 'power3.out', spring: 'back.out(1.7)' };
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
let prefersReducedMotion = reducedMotionQuery.matches;
let sceneTimeline;
let stopAmbientMotion = () => {};
let stopParallaxMotion = () => {};
let entranceObserver;
let connectionTimeout;
let activeRoomAction;

function canAnimate() {
    return Boolean(window.gsap) && !prefersReducedMotion;
}

function runSceneIntro() {
    if (!canAnimate()) return;
    sceneTimeline?.kill();
    sceneTimeline = gsap.timeline({ defaults: { ease: motion.ease } });
    sceneTimeline
        .fromTo('.login-card', { autoAlpha: 0, y: 48, scale: 0.92, rotateX: 8 }, { autoAlpha: 1, y: 0, scale: 1, rotateX: 0, duration: 1.05, ease: motion.spring })
        .fromTo('.login-card > *', { autoAlpha: 0, y: 20, filter: 'blur(10px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.62, stagger: 0.075, clearProps: 'filter' }, '-=0.65')
        .to('.login-card', { y: -5, duration: 2.4, ease: 'sine.inOut', repeat: -1, yoyo: true }, '+=0.08');
}

function transitionScene(nextTargets) {
    if (!canAnimate()) {
        revealContent(nextTargets);
        return;
    }
    const outgoing = [qNumberBadge, questionText, inputContainer, resultDiv];
    gsap.killTweensOf([...outgoing, ...nextTargets]);
    gsap.timeline({ defaults: { ease: motion.ease } })
        .to(outgoing, { autoAlpha: 0, y: -14, filter: 'blur(5px)', duration: 0.22, stagger: 0.025 })
        .set(outgoing, { autoAlpha: 1, y: 0, clearProps: 'filter' })
        .fromTo(nextTargets, { autoAlpha: 0, y: 28, scale: 0.97, filter: 'blur(10px)' }, { autoAlpha: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.72, stagger: 0.07, ease: motion.spring, clearProps: 'filter' });
}

function pulseButton(button) {
    if (!canAnimate()) return;
    gsap.timeline({ defaults: { overwrite: 'auto' } })
        .to(button, { scale: 1.02, duration: 0.16, ease: 'power2.out' })
        .to(button, { scale: 1, duration: 0.38, ease: motion.spring });
}

function revealContent(targets) {
    if (!canAnimate() || !targets.length) return;
    gsap.fromTo(targets, { autoAlpha: 0, y: 22, filter: 'blur(8px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.72, stagger: 0.06, ease: motion.ease, clearProps: 'filter' });
}

function bindTilt(element) {
    if (!finePointerQuery.matches || !window.gsap) return;
    const setX = gsap.quickTo(element, 'x', { duration: 0.35, ease: 'power2.out' });
    const setY = gsap.quickTo(element, 'y', { duration: 0.35, ease: 'power2.out' });
    const setRotateX = gsap.quickTo(element, 'rotateX', { duration: 0.35, ease: 'power2.out' });
    const setRotateY = gsap.quickTo(element, 'rotateY', { duration: 0.35, ease: 'power2.out' });
    element.addEventListener('pointermove', (event) => {
        if (!canAnimate() || event.pointerType !== 'mouse') return;
        const bounds = element.getBoundingClientRect();
        const rotateX = ((event.clientY - bounds.top) / bounds.height - 0.5) * -8;
        const rotateY = ((event.clientX - bounds.left) / bounds.width - 0.5) * 10;
        setX(rotateY * 0.15);
        setY(-3 + rotateX * 0.1);
        setRotateX(rotateX);
        setRotateY(rotateY);
        gsap.to(element, { scale: 1.015, z: 8, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
    });
    element.addEventListener('pointerleave', () => {
        if (!canAnimate()) return;
        setX(0);
        setY(0);
        setRotateX(0);
        setRotateY(0);
        gsap.to(element, { scale: 1, z: 0, duration: 0.7, ease: motion.spring, overwrite: 'auto' });
    });
}

function bindPressFeedback(button) {
    let isPressed = false;
    button.addEventListener('pointerdown', () => {
        if (!canAnimate() || button.disabled) return;
        isPressed = true;
        gsap.to(button, { scale: 0.95, duration: 0.1, ease: 'power2.out', overwrite: 'auto' });
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((eventName) => {
        button.addEventListener(eventName, () => {
            if (!isPressed) return;
            isPressed = false;
            pulseButton(button);
        });
    });
}

function bindMagneticButton(button) {
    if (!finePointerQuery.matches || !window.gsap) return;
    const setX = gsap.quickTo(button, 'x', { duration: 0.38, ease: 'power3.out' });
    const setY = gsap.quickTo(button, 'y', { duration: 0.38, ease: 'power3.out' });
    button.addEventListener('pointermove', (event) => {
        if (!canAnimate() || event.pointerType !== 'mouse') return;
        const bounds = button.getBoundingClientRect();
        setX((event.clientX - bounds.left - bounds.width / 2) * 0.14);
        setY((event.clientY - bounds.top - bounds.height / 2) * 0.16 - 2);
    });
    button.addEventListener('pointerleave', () => {
        if (!canAnimate()) return;
        setX(0);
        setY(0);
    });
}

function burstHearts(origin) {
    if (!canAnimate()) return;
    const symbols = ['💗', '💕', '✨', '💞', '♡', '🌸', '⭐'];
    const count = window.innerWidth < 600 ? 16 : 26;
    for (let index = 0; index < count; index += 1) {
        const heart = document.createElement('span');
        heart.className = 'heart-particle';
        heart.textContent = symbols[index % symbols.length];
        heart.style.left = `${origin.x}px`;
        heart.style.top = `${origin.y}px`;
        document.body.appendChild(heart);
        const angle = (Math.PI * 2 * index) / count + (Math.random() - 0.5) * 0.35;
        const distance = 90 + Math.random() * Math.min(window.innerWidth * 0.32, 280);
        gsap.timeline({ onComplete: () => heart.remove() })
            .fromTo(heart, { scale: 0, opacity: 0 }, { scale: 1.2, opacity: 1, duration: 0.16, ease: 'back.out(2)' })
            .to(heart, { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance + 100 + Math.random() * 80, rotation: -35 + Math.random() * 70, scale: 0.65 + Math.random() * 0.9, opacity: 0, duration: 1.5 + Math.random() * 1.2, ease: 'power2.out' });
    }
}

function initAmbientMotion() {
    if (prefersReducedMotion || !ambientCanvas) return () => {};
    const context = ambientCanvas.getContext('2d');
    if (!context) return () => {};
    const particles = [];
    const trail = [];
    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2, tx: window.innerWidth / 2, ty: window.innerHeight / 2 };
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    let frameId = 0;
    let isRunning = false;

    function resizeCanvas() {
        ambientCanvas.width = window.innerWidth * pixelRatio;
        ambientCanvas.height = window.innerHeight * pixelRatio;
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    function seedParticles() {
        particles.length = 0;
        const amount = window.innerWidth < 768 ? 24 : Math.min(52, Math.max(30, Math.floor(window.innerWidth / 26)));
        for (let index = 0; index < amount; index += 1) particles.push({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, r: 0.8 + Math.random() * 2.3, a: 0.2 + Math.random() * 0.5, speed: 0.08 + Math.random() * 0.2, phase: Math.random() * Math.PI * 2, hue: index % 3 });
    }

    function render(time) {
        if (document.hidden || prefersReducedMotion) {
            isRunning = false;
            return;
        }
        pointer.x += (pointer.tx - pointer.x) * 0.08;
        pointer.y += (pointer.ty - pointer.y) * 0.08;
        context.clearRect(0, 0, window.innerWidth, window.innerHeight);
        trail.push({ x: pointer.x, y: pointer.y, life: 1 });
        if (trail.length > 18) trail.shift();
        trail.forEach((point, index) => {
            point.life *= 0.88;
            context.beginPath();
            context.fillStyle = `rgba(255, 126, 186, ${point.life * (index / trail.length) * 0.28})`;
            context.arc(point.x, point.y, 2 + index * 0.18, 0, Math.PI * 2);
            context.fill();
        });
        particles.forEach((particle) => {
            particle.y -= particle.speed;
            if (particle.y < -10) particle.y = window.innerHeight + 10;
            const drift = Math.sin(time * 0.00045 + particle.phase) * 7;
            const dx = pointer.x - (particle.x + drift);
            const dy = pointer.y - particle.y;
            const influence = Math.max(0, 1 - Math.hypot(dx, dy) / 230);
            let color = '255, 255, 255';
            if (particle.hue === 0) color = '255, 157, 190';
            if (particle.hue === 1) color = '255, 232, 170';
            context.beginPath();
            context.fillStyle = `rgba(${color}, ${particle.a})`;
            context.shadowBlur = 8;
            context.shadowColor = `rgba(${color}, 0.8)`;
            context.arc(particle.x + drift + dx * influence * 0.035, particle.y + dy * influence * 0.018, particle.r + influence * 1.8, 0, Math.PI * 2);
            context.fill();
        });
        frameId = requestAnimationFrame(render);
    }

    function start() {
        if (isRunning || document.hidden || prefersReducedMotion) return;
        isRunning = true;
        frameId = requestAnimationFrame(render);
    }

    function stop() {
        isRunning = false;
        cancelAnimationFrame(frameId);
    }

    function onVisibilityChange() {
        if (document.hidden) stop();
        else start();
    }

    function onResize() {
        resizeCanvas();
        seedParticles();
    }

    function onPointerMove(event) {
        pointer.tx = event.clientX;
        pointer.ty = event.clientY;
    }

    resizeCanvas();
    seedParticles();
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    start();

    return () => {
        stop();
        window.removeEventListener('resize', onResize);
        window.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
}

function initCursorGlow() {
    if (!finePointerQuery.matches || !cursorGlow || !window.gsap) return;
    const setX = gsap.quickTo(cursorGlow, 'x', { duration: 0.5, ease: 'power3.out' });
    const setY = gsap.quickTo(cursorGlow, 'y', { duration: 0.5, ease: 'power3.out' });
    window.addEventListener('pointermove', (event) => {
        if (!canAnimate() || event.pointerType !== 'mouse') return;
        setX(event.clientX);
        setY(event.clientY);
    }, { passive: true });
}

function initLoginPointerTracking() {
    if (!finePointerQuery.matches || !loginSpotlight || !window.gsap) return;
    const setX = gsap.quickTo(loginSpotlight, 'x', { duration: 0.42, ease: 'power3.out' });
    const setY = gsap.quickTo(loginSpotlight, 'y', { duration: 0.42, ease: 'power3.out' });
    loginScreen.addEventListener('pointerenter', () => {
        if (canAnimate()) gsap.to(loginSpotlight, { autoAlpha: 1, duration: 0.3, overwrite: 'auto' });
    });
    loginScreen.addEventListener('pointermove', (event) => {
        if (!canAnimate() || event.pointerType !== 'mouse') return;
        const bounds = loginScreen.getBoundingClientRect();
        setX(event.clientX - bounds.left);
        setY(event.clientY - bounds.top);
    });
    loginScreen.addEventListener('pointerleave', () => {
        if (canAnimate()) gsap.to(loginSpotlight, { autoAlpha: 0, duration: 0.55, overwrite: 'auto' });
    });
}

function initParallaxMotion() {
    if (!window.gsap || prefersReducedMotion) return () => {};
    const layers = [...document.querySelectorAll('[data-parallax]')];
    if (!layers.length) return () => {};
    let frameId = 0;
    const update = () => {
        frameId = 0;
        const scrollY = window.scrollY || window.pageYOffset;
        layers.forEach((layer) => {
            const speed = Number(layer.dataset.parallax) || 0;
            gsap.set(layer, { y: Math.min(28, scrollY * speed), force3D: true });
        });
    };
    const onScroll = () => {
        if (!frameId) frameId = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener('scroll', onScroll);
        layers.forEach((layer) => gsap.set(layer, { clearProps: 'transform' }));
    };
}

function initEntranceObserver() {
    if (!canAnimate() || !('IntersectionObserver' in window)) return;
    entranceObserver = new IntersectionObserver((entries) => {
        entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
            const delay = Number(entry.target.dataset.entrance || 0) * 0.12;
            entranceObserver.unobserve(entry.target);
            gsap.fromTo(entry.target, { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: 0.8, delay, ease: motion.spring, clearProps: 'transform' });
        });
    }, { threshold: 0.16 });
    document.querySelectorAll('[data-entrance]').forEach((element) => entranceObserver.observe(element));
}

function initMotionSystem() {
    stopAmbientMotion = initAmbientMotion();
    stopParallaxMotion = initParallaxMotion();
    runSceneIntro();
    initEntranceObserver();
}

function handleMotionPreferenceChange(event) {
    prefersReducedMotion = event.matches;
    stopAmbientMotion();
    stopParallaxMotion();
    entranceObserver?.disconnect();
    sceneTimeline?.kill();
    if (prefersReducedMotion) {
        if (window.gsap) gsap.set([loginScreen, gameLayout, qNumberBadge, questionText, inputContainer, resultDiv], { clearProps: 'transform,opacity,filter' });
        return;
    }
    initMotionSystem();
}

document.querySelectorAll('button').forEach(bindPressFeedback);
document.querySelectorAll('.room-action, .chat-input-area button, .music-btn, #submitBtn').forEach(bindMagneticButton);
initCursorGlow();
initLoginPointerTracking();
initMotionSystem();
reducedMotionQuery.addEventListener?.('change', handleMotionPreferenceChange);

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
    if (isError && canAnimate()) {
        gsap.fromTo(loginMessage, { x: -7 }, { x: 0, duration: 0.42, ease: motion.spring, overwrite: 'auto' });
    }
}

function setActionContent(button, label, detail, icon) {
    const labelNode = button.querySelector('.action-label');
    const detailNode = button.querySelector('.action-detail');
    const iconNode = button.querySelector('.action-icon');
    if (labelNode) labelNode.textContent = label;
    if (detailNode) detailNode.textContent = detail;
    if (iconNode) iconNode.textContent = icon;
}

function resetRoomAction() {
    clearTimeout(connectionTimeout);
    [createRoomBtn, joinRoomBtn].forEach((button) => {
        button.disabled = false;
        button.classList.remove('is-busy');
        button.removeAttribute('aria-busy');
        setActionContent(button, button.dataset.label, button.dataset.detail, button === createRoomBtn ? '✦' : '♡');
    });
    activeRoomAction = undefined;
}

function setTransitionCopy(eyebrow, title, detail) {
    transitionEyebrow.textContent = eyebrow;
    transitionTitle.textContent = title;
    transitionDetail.textContent = detail;
}

function beginRoomTransition(button, createNewRoom) {
    activeRoomAction = createNewRoom ? 'create' : 'join';
    const title = createNewRoom ? 'Đang tạo không gian riêng' : 'Đang tìm căn phòng của hai bạn';
    const detail = createNewRoom ? 'Đang tạo mã mời thật dễ thương...' : 'Đang gửi tín hiệu đến người ấy...';
    setTransitionCopy(createNewRoom ? 'Tạo phòng mới' : 'Kết nối phòng', title, detail);
    roomTransition.classList.toggle('is-create', createNewRoom);

    if (!canAnimate()) return;
    const bounds = button.getBoundingClientRect();
    const bloomSize = Math.max(window.innerWidth, window.innerHeight) * 1.6;
    const startScale = Math.max(0.05, Math.max(bounds.width, bounds.height) / bloomSize);
    gsap.killTweensOf([loginScreen, roomTransition, transitionBloom, '.transition-content']);
    gsap.set(roomTransition, { display: 'grid', autoAlpha: 1 });
    gsap.set(transitionBloom, {
        x: bounds.left + bounds.width / 2 - bloomSize / 2,
        y: bounds.top + bounds.height / 2 - bloomSize / 2,
        scale: startScale,
        transformOrigin: '50% 50%'
    });
    gsap.timeline()
        .to(loginScreen, { autoAlpha: 0, scale: 0.96, filter: 'blur(7px)', duration: 0.26, ease: 'power2.out' }, 0)
        .to(transitionBloom, { scale: 1, duration: 0.76, ease: motion.spring }, 0)
        .fromTo('.transition-content', { autoAlpha: 0, y: 34, scale: 0.93 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.52, ease: motion.spring }, 0.3);
}

function finishRoomTransition(roomCode) {
    if (!canAnimate() || roomTransition.style.display === 'none' || !activeRoomAction) return false;
    setTransitionCopy(
        activeRoomAction === 'create' ? 'Mã phòng đã sẵn sàng' : 'Đã tìm thấy phòng',
        activeRoomAction === 'create' ? `Phòng ${roomCode} đã mở` : 'Kết nối thành công',
        activeRoomAction === 'create' ? 'Mời người ấy nhập mã này để bắt đầu nhé.' : 'Đang đưa bạn vào không gian của hai người...'
    );
    gsap.timeline({ onComplete: () => gsap.set(roomTransition, { display: 'none' }) })
        .to('.transition-content', { autoAlpha: 0, y: -18, duration: 0.24, delay: 0.5, ease: 'power2.in' })
        .to(roomTransition, { autoAlpha: 0, duration: 0.4, ease: 'power2.inOut' }, '-=0.06')
        .fromTo(gameLayout, { autoAlpha: 0, y: 34, scale: 0.975 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.75, ease: motion.spring, clearProps: 'filter' }, '-=0.35');
    return true;
}

function cancelRoomTransition(message) {
    resetRoomAction();
    if (!canAnimate() || roomTransition.style.display === 'none') {
        loginScreen.style.removeProperty('opacity');
        loginScreen.style.removeProperty('visibility');
        return;
    }
    setTransitionCopy('Không thể kết nối', 'Thử lại một lần nữa nhé', message);
    gsap.timeline({ onComplete: () => {
        gsap.set(roomTransition, { display: 'none' });
        gsap.set(loginScreen, { clearProps: 'transform,filter,opacity,visibility' });
    } })
        .to('.transition-content', { autoAlpha: 0, y: -12, duration: 0.2, delay: 0.8 })
        .to(roomTransition, { autoAlpha: 0, duration: 0.3 }, '-=0.05');
}

function renderWaitingStatus(message, roomCode) {
    statusDiv.innerHTML = `<div class="room-badge">Phòng ${roomCode || 'của bạn'}</div>
        <div class="waiting-scene">
            <div class="waiting-orbit" aria-hidden="true"><span class="waiting-avatar">💗</span><span class="waiting-avatar">✨</span><span class="waiting-spark">♡</span></div>
            <h3 class="waiting-copy">${message}</h3>
            <div class="waiting-progress" aria-hidden="true"><span></span></div>
            <p class="waiting-caption">Giữ trang này mở, người ấy sẽ xuất hiện ngay khi vào phòng.</p>
        </div>`;
    revealContent([...statusDiv.children]);
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

function joinRoom(createNewRoom) {
    const data = validateJoinInput(createNewRoom);
    if (!data) return;

    const btn = createNewRoom ? createRoomBtn : joinRoomBtn;
    const otherButton = createNewRoom ? joinRoomBtn : createRoomBtn;
    resetRoomAction();
    btn.disabled = true;
    otherButton.disabled = true;
    btn.classList.add('is-busy');
    btn.setAttribute('aria-busy', 'true');
    setActionContent(btn, createNewRoom ? 'Đang tạo phòng' : 'Đang tìm phòng', 'Kết nối trái tim...', '⋯');
    beginRoomTransition(btn, createNewRoom);

    localStorage.setItem('couple_game_name', data.nickname);
    socket.emit('joinRoom', {
        uid: myUID,
        nickname: data.nickname,
        roomCode: data.roomCode,
        createRoom: createNewRoom
    });

    connectionTimeout = setTimeout(() => {
        if (!activeRoomAction) return;
        cancelRoomTransition('Máy chủ đang mất thêm thời gian để phản hồi. Bạn có thể thử lại ngay bây giờ.');
        setLoginMessage('Kết nối đang chậm hơn bình thường. Hãy thử lại nhé.', true);
    }, 7000);
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
    renderWaitingStatus(`Xin chào ${nickname}! Đang chờ người ấy vào đây...`, roomCode);
    const usedTransition = finishRoomTransition(roomCode);
    resetRoomAction();
    if (!usedTransition && canAnimate()) gsap.fromTo(gameLayout, { autoAlpha: 0, y: 30, scale: 0.98 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, ease: motion.spring });
});

socket.on('waiting', (data) => {
    statusDiv.style.display = 'block';
    gameDiv.style.display = 'none';
    fullScreenDiv.style.display = 'none';
    renderWaitingStatus(data.message, currentRoomCode);
});

socket.on('full', (data) => {
    cancelRoomTransition(data.message);
    setLoginMessage(data.message, true);
    loginScreen.classList.remove('hidden');
    gameLayout.classList.add('hidden');
    statusDiv.style.display = 'none';
    fullScreenDiv.style.display = 'block';
    fullText.textContent = data.message;
});

socket.on('roomError', (data) => {
    cancelRoomTransition(data.message);
    setLoginMessage(data.message, true);
    loginScreen.classList.remove('hidden');
    gameLayout.classList.add('hidden');
    statusDiv.style.display = 'none';
});

socket.on('gameStart', (data) => {
    statusDiv.style.display = 'block';
    fullScreenDiv.style.display = 'none';
    renderWaitingStatus(data.message, currentRoomCode);
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
            bindTilt(card);
            inputContainer.appendChild(card);
        });
        transitionScene([qNumberBadge, questionText, ...inputContainer.children]);
    } else {
        inputContainer.className = 'grid-1-col';
        inputContainer.innerHTML = '<input type="text" id="textInput" class="text-input" placeholder="Nhập biệt danh, lời nhắn, hoặc đáp án...">';
        transitionScene([qNumberBadge, questionText, inputContainer.firstElementChild]);
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

    const buttonRect = submitBtn.getBoundingClientRect();
    burstHearts({ x: buttonRect.left + buttonRect.width / 2, y: buttonRect.top + buttonRect.height / 2 });

    inputContainer.innerHTML = '';
    submitBtn.style.display = 'none';
    waitMsg.style.display = 'block';
});

socket.on('roundResult', (data) => {
    waitMsg.style.display = 'none';
    const roundSimilarity = data.isMatch ? 100 : 0;
    const totalQuestions = data.totalQuestions || 14;
    const matchedCount = data.matchedCount ?? Math.round(data.myScore / 10);
    const cumulativeSimilarity = Math.round((matchedCount / (data.questionNumber || 1)) * 100);
    const resultTitle = data.isMatch ? 'Hai trái tim cùng nhịp! 💖' : 'Mỗi người một ý cũng đáng yêu mà! 🌷';
    const resultMessage = data.isMatch ? 'Câu trả lời giống nhau hoàn toàn' : 'Câu này để dành dịp hiểu nhau hơn nhé';

    resultDiv.innerHTML = `
        <div class="round-result-head ${data.isMatch ? 'is-match' : 'is-different'}">
            <span class="result-kicker">Câu ${data.questionNumber || ''} / ${totalQuestions}</span>
            <h2>${resultTitle}</h2>
            <p>${resultMessage}</p>
        </div>
        <div class="similarity-card" style="--similarity: ${roundSimilarity}%">
            <div class="similarity-orbit" aria-hidden="true"><span>💞</span></div>
            <div class="similarity-value" data-value="${roundSimilarity}">0<small>%</small></div>
            <div class="similarity-label">Độ tương đồng câu này</div>
        </div>
        <div class="result-box answer-compare">
            <div class="answer-line"><span class="answer-label">Bạn chọn</span><b>${data.myChoice}</b></div>
            <div class="answer-line"><span class="answer-label">Người ấy chọn</span><b>${data.otherChoice}</b></div>
            <div class="result-progress"><span style="--progress: ${cumulativeSimilarity}%"></span></div>
            <div class="progress-caption"><span>Độ tương đồng hiện tại</span><strong>${cumulativeSimilarity}%</strong></div>
        </div>
        <div class="spinner" aria-label="Chuẩn bị câu tiếp theo"></div>`;
    revealContent([...resultDiv.children]);
    animateSimilarity(resultDiv.querySelector('.similarity-value'), roundSimilarity);
});

socket.on('gameOver', (data) => {
    const similarity = data.similarity ?? Math.round((data.finalScore / 10 / (data.totalQuestions || 14)) * 100);
    const matchedCount = data.matchedCount ?? Math.round(data.finalScore / 10);
    const totalQuestions = data.totalQuestions || 14;
    let summary = 'Càng chơi càng hiểu nhau hơn nhé! 🌱';
    if (similarity >= 80) summary = 'Hai bạn đúng là sinh ra để hiểu nhau! ✨';
    else if (similarity >= 50) summary = 'Một cặp đôi khá tâm linh đó nha! 💗';
    resultDiv.innerHTML = `
        <div class="final-result">
            <div class="final-confetti" aria-hidden="true"><span>✦</span><span>♡</span><span>✧</span><span>✦</span></div>
            <span class="result-kicker">Hành trình của hai bạn đã khép lại</span>
            <h1>${data.message}</h1>
            <p class="final-summary">${summary}</p>
            <div class="final-similarity-card">
                <div class="similarity-ring" style="--similarity: ${similarity}%">
                    <div class="similarity-ring-inner"><strong data-value="${similarity}">0</strong><span>%</span></div>
                </div>
                <div class="final-score-copy"><span>ĐỘ TƯƠNG ĐỒNG</span><b>${matchedCount} câu trả lời cùng nhịp</b><small>Hai bạn đã cùng chọn một đáp án trong ${matchedCount} câu.</small></div>
            </div>
            <div class="final-hearts" aria-hidden="true">💗 <i></i> 💞 <i></i> 💗</div>
        </div>`;
    burstHearts({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    revealContent([...resultDiv.children]);
    animateSimilarity(resultDiv.querySelector('[data-value]'), similarity);
});

function animateSimilarity(element, target) {
    if (!element) return;
    if (!canAnimate()) {
        element.innerHTML = `${target}<small>%</small>`;
        return;
    }
    const counter = { value: 0 };
    gsap.to(counter, {
        value: target,
        duration: 1.25,
        delay: 0.18,
        ease: 'power2.out',
        onUpdate: () => {
            element.innerHTML = `${Math.round(counter.value)}<small>%</small>`;
        }
    });
}

function appendChat(text, type) {
    const div = document.createElement('div');
    div.className = `chat-msg ${type}`;
    div.innerText = text;
    chatMessages.appendChild(div);
    revealContent([div]);
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
        const strip = button.closest('.sticker-row, .sticker-strip');
        strip?.querySelectorAll('.sticker-btn').forEach((item) => {
            item.classList.remove('is-selected');
            item.setAttribute('aria-pressed', 'false');
        });
        button.classList.add('is-selected');
        button.setAttribute('aria-pressed', 'true');
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
