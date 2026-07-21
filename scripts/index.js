function copyText(text){
    navigator.clipboard.writeText(text).then(showToast);
}

function copyCode(btn){
    const code = btn.parentElement.querySelector("code").innerText.trim();
    navigator.clipboard.writeText(code).then(showToast);
}

function showToast(){
    const toast = document.getElementById("toast");
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1400);
}

(function(){
    const video = document.getElementById("trainingVideo");
    const shell = document.getElementById("videoShell");
    const teacherBadge = document.getElementById("teacherBadge");
    const controls = document.getElementById("customControls");
    const bigPlay = document.getElementById("bigPlayButton");
    const playPauseButton = document.getElementById("playPauseButton");
    const playPauseIcon = document.getElementById("playPauseIcon");
    const muteButton = document.getElementById("muteButton");
    const muteIcon = document.getElementById("muteIcon");
    const fullscreenButton = document.getElementById("fullscreenButton");
    const timelineRange = document.getElementById("timelineRange");
    const volumeRange = document.getElementById("volumeRange");
    const timeDisplay = document.getElementById("timeDisplay");
    const speedDropdown = document.getElementById("speedDropdown");
    const speedButton = document.getElementById("speedButton");
    const speedButtonLabel = document.getElementById("speedButtonLabel");
    const speedMenu = document.getElementById("speedMenu");
    const speedOptions = speedMenu ? Array.from(speedMenu.querySelectorAll(".speed-option")) : [];

    if(!video || !shell || !controls) return;

    let hideTimer = null;
    let hasStarted = false;
    let previousVolume = 1;
    let isSeeking = false;

    const fullscreenEnterIcon = '<path d="M8 3H3v5"></path><path d="M16 3h5v5"></path><path d="M21 16v5h-5"></path><path d="M8 21H3v-5"></path>';
    const fullscreenExitIcon = '<path d="M9 3H3v6"></path><path d="M3 3l6 6"></path><path d="M15 3h6v6"></path><path d="M21 3l-6 6"></path><path d="M3 21l6-6"></path><path d="M3 15v6h6"></path><path d="M21 21l-6-6"></path><path d="M15 21h6v-6"></path>';

    const iconMuteAction = '<path d="M11 5 6 9H3v6h3l5 4V5z"></path><path d="m16 9 5 5"></path><path d="m21 9-5 5"></path>';
    const iconUnmuteAction = '<path d="M11 5 6 9H3v6h3l5 4V5z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M18.36 5.64a9 9 0 0 1 0 12.73"></path>';

    function isFullscreenActive(){
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
    }

    function updateFullscreenIcon(){
    if (!fullscreenButton) return;
    fullscreenButton.innerHTML = isFullscreenActive()
        ? `<svg viewBox="0 0 24 24">${fullscreenExitIcon}</svg>`
        : `<svg viewBox="0 0 24 24">${fullscreenEnterIcon}</svg>`;
    }

    function updateMuteIcon(){
    const muted = video.muted || video.volume === 0;
    if (muteIcon) {
        muteIcon.innerHTML = muted ? iconMuteAction : iconUnmuteAction;
    }
    }

    function setRangePercent(input, percent){
    const clamped = Math.max(0, Math.min(100, percent));
    input.style.setProperty('--range-percent', `${clamped}%`);
    }

    function formatTime(seconds){
    if (!isFinite(seconds)) return "00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0){
        return `${String(hrs).padStart(2,"0")}:${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;
    }
    return `${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;
    }

    function updateTime(){
    const current = video.currentTime || 0;
    const duration = video.duration || 0;
    if (timeDisplay) {
        timeDisplay.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
    }

    if (timelineRange && !isSeeking) {
        const percent = duration ? (current / duration) * 100 : 0;
        const value = Math.round((percent / 100) * 1000);
        timelineRange.value = value;
        setRangePercent(timelineRange, percent);
    }
    }

    function setPlayVisual(isPlaying){
    if (playPauseIcon){
        playPauseIcon.innerHTML = isPlaying
        ? '<path d="M9 5h3v14H9z" fill="rgba(255,255,255,.92)" stroke="none"></path><path d="M14 5h3v14h-3z" fill="rgba(255,255,255,.92)" stroke="none"></path>'
        : '<path d="M8 5v14l11-7z" fill="rgba(255,255,255,.92)" stroke="none"></path>';
    }
    if (bigPlay) {
        if (hasStarted) {
        bigPlay.classList.add("is-used");
        } else {
        bigPlay.classList.toggle("is-playing", isPlaying);
        }
    }
    if (teacherBadge) teacherBadge.classList.toggle("is-hidden", isPlaying);
    }

    function showControls(){
    if (!hasStarted) return;
    controls.classList.remove("is-hidden");
    controls.classList.add("is-visible");
    clearTimeout(hideTimer);
    if (!video.paused){
        hideTimer = setTimeout(() => {
        controls.classList.add("is-hidden");
        controls.classList.remove("is-visible");
        }, 2200);
    }
    }

    function keepControlsVisible(){
    if (!hasStarted) return;
    clearTimeout(hideTimer);
    controls.classList.remove("is-hidden");
    controls.classList.add("is-visible");
    }

    function hideControlsIfPlaying(){
    clearTimeout(hideTimer);
    if (hasStarted && !video.paused){
        hideTimer = setTimeout(() => {
        controls.classList.add("is-hidden");
        controls.classList.remove("is-visible");
        }, 2200);
    }
    }

    function togglePlay(){
    if (video.paused) {
        hasStarted = true;
        video.play();
    } else {
        video.pause();
    }
    }

    function toggleFullscreen(){
    if (!isFullscreenActive()){
        if (shell.requestFullscreen) shell.requestFullscreen();
        else if (shell.webkitRequestFullscreen) shell.webkitRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
    }

    async function syncResponsiveOrientation(){
    const orientation = screen.orientation;
    const isResponsiveDevice = window.matchMedia('(max-width: 1024px)').matches;

    if (!orientation) return;

    try {
        if (isFullscreenActive() && isResponsiveDevice && orientation.lock) {
        await orientation.lock('portrait');
        } else if (!isFullscreenActive() && orientation.unlock) {
        orientation.unlock();
        }
    } catch (_) {
        // Orientation locking is not supported by every mobile browser.
    }
    }

    function closeSpeedMenu(){
    if (!speedDropdown || !speedButton) return;
    speedDropdown.classList.remove('is-open');
    speedButton.setAttribute('aria-expanded', 'false');
    }

    function openSpeedMenu(){
    if (!speedDropdown || !speedButton) return;
    speedDropdown.classList.add('is-open');
    speedButton.setAttribute('aria-expanded', 'true');
    }

    function toggleSpeedMenu(){
    if (!speedDropdown) return;
    if (speedDropdown.classList.contains('is-open')) closeSpeedMenu();
    else openSpeedMenu();
    }

    function setPlaybackSpeed(value){
    const speed = Number(value);
    video.playbackRate = speed;
    if (speedButtonLabel) speedButtonLabel.textContent = `x${speed}`;
    speedOptions.forEach(btn => {
        btn.classList.toggle('is-active', Number(btn.dataset.speed) === speed);
    });
    }

    if (playPauseButton) {
    playPauseButton.addEventListener("click", (e) => {
        e.stopPropagation();
        togglePlay();
    });
    }

    if (bigPlay) {
    bigPlay.addEventListener("click", (e) => {
        e.stopPropagation();
        togglePlay();
    });
    }

    if (muteButton) {
    muteButton.addEventListener("click", (e) => {
        e.stopPropagation();
        const muted = video.muted || video.volume === 0;
        if (muted){
        video.muted = false;
        video.volume = previousVolume || 1;
        if (volumeRange) {
            volumeRange.value = Math.round(video.volume * 100);
            setRangePercent(volumeRange, video.volume * 100);
        }
        } else {
        previousVolume = video.volume || previousVolume || 1;
        video.muted = true;
        if (volumeRange) {
            volumeRange.value = 0;
            setRangePercent(volumeRange, 0);
        }
        }
        updateMuteIcon();
        showControls();
    });
    }

    if (fullscreenButton) {
    fullscreenButton.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFullscreen();
    });
    }

    if (speedButton) {
    speedButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSpeedMenu();
        showControls();
    });
    }

    speedOptions.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setPlaybackSpeed(btn.dataset.speed);
        closeSpeedMenu();
        showControls();
    });
    });

    if (timelineRange) {
    timelineRange.addEventListener('pointerdown', () => {
        isSeeking = true;
        keepControlsVisible();
    });

    timelineRange.addEventListener('input', () => {
        isSeeking = true;
        const percent = Number(timelineRange.value) / 10;
        setRangePercent(timelineRange, percent);
        if (isFinite(video.duration)) {
        video.currentTime = (percent / 100) * video.duration;
        }
        if (timeDisplay) {
        const current = isFinite(video.duration) ? (percent / 100) * video.duration : 0;
        timeDisplay.textContent = `${formatTime(current)} / ${formatTime(video.duration || 0)}`;
        }
    });

    timelineRange.addEventListener('change', () => {
        isSeeking = false;
        hideControlsIfPlaying();
    });
    }

    if (volumeRange) {
    volumeRange.addEventListener('input', () => {
        const percent = Number(volumeRange.value);
        setRangePercent(volumeRange, percent);
        const volume = percent / 100;
        video.volume = volume;
        video.muted = volume === 0;
        if (volume > 0) previousVolume = volume;
        updateMuteIcon();
        showControls();
    });
    }

    shell.addEventListener("click", (e) => {
    if (e.target === video) {
        if (!hasStarted || video.paused) togglePlay();
        else showControls();
    }
    });

    shell.addEventListener("touchstart", () => {
    showControls();
    }, {passive:true});

    window.addEventListener("mousemove", (e) => {
    const rect = shell.getBoundingClientRect();
    const insideVideo = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    const nearBottom = e.clientY >= rect.bottom - Math.max(105, rect.height * 0.25);
    if (insideVideo && (nearBottom || video.paused)) showControls();
    });

    window.addEventListener('click', (e) => {
    if (speedDropdown && !speedDropdown.contains(e.target)) {
        closeSpeedMenu();
    }
    });

    window.addEventListener("resize", () => {
    updateTime();
    });

    video.addEventListener("play", () => {
    hasStarted = true;
    if (bigPlay) bigPlay.classList.add("is-used");
    setPlayVisual(true);
    showControls();
    });

    video.addEventListener("pause", () => {
    setPlayVisual(false);
    keepControlsVisible();
    });

    video.addEventListener("ended", () => {
    setPlayVisual(false);
    keepControlsVisible();
    });

    video.addEventListener("volumechange", updateMuteIcon);

    video.addEventListener("loadedmetadata", () => {
    updateTime();
    });

    video.addEventListener("timeupdate", updateTime);

    document.addEventListener("fullscreenchange", () => {
    updateFullscreenIcon();
    showControls();
    syncResponsiveOrientation();
    });

    document.addEventListener("webkitfullscreenchange", () => {
    updateFullscreenIcon();
    showControls();
    syncResponsiveOrientation();
    });

    controls.classList.add("is-hidden");
    controls.classList.remove("is-visible");
    setPlayVisual(false);
    setPlaybackSpeed(1);
    updateFullscreenIcon();
    updateMuteIcon();

    if (timelineRange) {
    timelineRange.value = 0;
    setRangePercent(timelineRange, 0);
    }

    if (volumeRange) {
    volumeRange.value = 100;
    setRangePercent(volumeRange, 100);
    }

    updateTime();
})();

