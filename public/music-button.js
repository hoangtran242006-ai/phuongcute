(() => {
    const button = document.getElementById('musicToggle');
    if (!button) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

    function rebuildMusicMarkup(playing) {
        button.classList.toggle('is-playing', playing);
        button.setAttribute('aria-pressed', String(playing));
        button.setAttribute('aria-label', playing ? 'Tắt nhạc' : 'Bật nhạc');
        button.innerHTML = `
            <span class="music-shine" aria-hidden="true"></span>
            <span class="music-core">
                <span class="music-icon">${playing ? '♫' : '♩'}</span>
                <span class="sound-wave" aria-hidden="true"><span></span><span></span><span></span></span>
            </span>
            <span class="music-label">${playing ? 'Đang phát...' : 'Bật nhạc'}</span>
            <span class="floating-note note-1" aria-hidden="true">♪</span>
            <span class="floating-note note-2" aria-hidden="true">♫</span>
            <span class="floating-note note-3" aria-hidden="true">♪</span>
        `;
    }

    function addRipple(event) {
        if (prefersReducedMotion.matches) return;
        const rect = button.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'music-ripple';
        ripple.style.left = `${event.clientX - rect.left}px`;
        ripple.style.top = `${event.clientY - rect.top}px`;
        button.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    }

    // script.js vẫn điều khiển audio. Listener này chỉ đồng bộ giao diện sau đó.
    button.addEventListener('click', (event) => {
        addRipple(event);
        window.setTimeout(() => {
            const playing = typeof isMusicPlaying !== 'undefined'
                ? Boolean(isMusicPlaying)
                : false;
            rebuildMusicMarkup(playing);
        }, 0);
    });

    if (finePointer.matches && !prefersReducedMotion.matches) {
        button.addEventListener('pointermove', (event) => {
            if (event.pointerType !== 'mouse') return;
            const rect = button.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            button.style.setProperty('--music-x', `${x * 4}px`);
            button.style.setProperty('--music-y', `${y * -4 - 2}px`);
            button.style.setProperty('--music-rx', `${y * -6}deg`);
            button.style.setProperty('--music-ry', `${x * 8}deg`);
        });

        button.addEventListener('pointerleave', () => {
            button.style.setProperty('--music-x', '0px');
            button.style.setProperty('--music-y', '0px');
            button.style.setProperty('--music-rx', '0deg');
            button.style.setProperty('--music-ry', '0deg');
        });
    }

    window.setTimeout(() => {
        const playing = typeof isMusicPlaying !== 'undefined' ? Boolean(isMusicPlaying) : false;
        rebuildMusicMarkup(playing);
    }, 0);
})();
