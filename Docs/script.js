// Variáveis globais
let cameraStream = null;
let rotationAngle = 0;
let tiltAngle = 0;
let isMirrored = false;
let brightness = 100;
let currentTheme = 'dark'; // 'dark', 'light' ou 'red'
let isSettingsOpen = false;
let isAboutOpen = false;
let isFlashOn = false;
let imageScale = 1;
let imageX = 0;
let imageY = 0;
let isBlurEnabled = false;

// Elementos DOM
const loadingScreen = document.getElementById('loading-screen');
const container = document.querySelector('.container');
const video = document.getElementById('camera');
const importedImage = document.getElementById('imported-image');
const fileInput = document.getElementById('file-input');
const importBtn = document.getElementById('import-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const minimizeBtn = document.getElementById('minimize-btn');
const settingsBtn = document.getElementById('settings-btn');
const fsSettingsBtn = document.getElementById('fs-settings-btn');
const fsAboutBtn = document.getElementById('fs-about-btn');
const settingsPanel = document.getElementById('settings-panel');
const rotateSlider = document.getElementById('rotate-slider');
const tiltSlider = document.getElementById('tilt-slider');
const mirrorBtn = document.getElementById('mirror-btn');
const rotateLeftBtn = document.getElementById('rotate-left-btn');
const rotateRightBtn = document.getElementById('rotate-right-btn');
const brightnessSlider = document.getElementById('brightness-slider');
const flipCameraBtn = document.getElementById('flip-camera-btn');
const blurToggle = document.getElementById('blur-toggle');
const flashBtn = document.getElementById('flash-btn');
const themeToggle = document.getElementById('theme-toggle');
const redThemeBtn = document.getElementById('red-theme-btn');
const aboutBtn = document.getElementById('about-toggle');
const aboutPanel = document.getElementById('about-panel');
const fullscreenControls = document.getElementById('fullscreen-controls');

// Inicialização
function init() {
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        container.classList.remove('hidden');
        startCamera();
    }, 3000);
    
    setupEventListeners();
    
    // Configurações iniciais
    brightnessSlider.value = brightness;
    rotateSlider.value = rotationAngle;
    tiltSlider.value = tiltAngle;
}

// Configurar listeners de eventos
function setupEventListeners() {
    // Controles
    importBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleImageUpload);
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    if (minimizeBtn) minimizeBtn.addEventListener('click', toggleFullscreen);

    // Configurações
    settingsBtn.addEventListener('click', toggleSettings);
    if (fsSettingsBtn) fsSettingsBtn.addEventListener('click', toggleSettings);
    rotateSlider.addEventListener('input', updateImageTransform);
    tiltSlider.addEventListener('input', updateImageTransform);
    mirrorBtn.addEventListener('click', mirrorImage);
    if (rotateLeftBtn) rotateLeftBtn.addEventListener('click', () => rotateImage(-90));
    if (rotateRightBtn) rotateRightBtn.addEventListener('click', () => rotateImage(90));
    brightnessSlider.addEventListener('input', updateCameraBrightness);
    flipCameraBtn.addEventListener('click', flipCamera);
    if (blurToggle) blurToggle.addEventListener('click', toggleBlur);
    flashBtn.addEventListener('click', toggleFlash);
    themeToggle.addEventListener('click', () => setTheme(currentTheme === 'light' ? 'dark' : 'light'));
    if (redThemeBtn) redThemeBtn.addEventListener('click', () => setTheme('red'));

    // Menu sobre
    aboutBtn.addEventListener('click', toggleAbout);
    if (fsAboutBtn) fsAboutBtn.addEventListener('click', toggleAbout);

    // Eventos de tela cheia
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Eventos de toque para a imagem
    importedImage.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
}

// Funções da câmera
async function startCamera() {
    try {
        const constraints = {
            video: {
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        };
        
        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = cameraStream;
        video.play().then(() => {
            // Verifica se o dispositivo suporta flash
            if ('torch' in cameraStream.getVideoTracks()[0].getCapabilities()) {
                flashBtn.style.display = 'flex';
            }
        });
    } catch (err) {
    console.error("Erro ao acessar a câmera:", err);
    alert("Não foi possível acessar a câmera. Por favor, verifique as permissões.");
    }

async function toggleFlash() {
    if (!cameraStream) return;
    
    const track = cameraStream.getVideoTracks()[0];
    try {
        if (isFlashOn) {
            await track.applyConstraints({ advanced: [{ torch: false }] });
            flashBtn.classList.remove('active');
        } else {
            await track.applyConstraints({ advanced: [{ torch: true }] });
            flashBtn.classList.add('active');
        }
        isFlashOn = !isFlashOn;
    } catch (err) {
        console.error("Erro ao alternar flash:", err);
        alert("Seu dispositivo não suporta flash ou ocorreu um erro.");
    }
}

function updateCameraBrightness() {
    brightness = brightnessSlider.value;
    video.style.filter = `brightness(${brightness}%)`;
}

async function flipCamera() {
    if (!cameraStream) return;
    
    // Desligar flash se estiver ligado
    if (isFlashOn) {
        await toggleFlash();
    }
    
    cameraStream.getTracks().forEach(track => track.stop());
    
    const constraints = {
        video: {
            facingMode: video.srcObject.getVideoTracks()[0].getSettings().facingMode === 'user' ? 'environment' : 'user',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        }
    };
    
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = cameraStream;
        video.play().then(() => {
            // Verifica se o dispositivo suporta flash
            if ('torch' in cameraStream.getVideoTracks()[0].getCapabilities()) {
                flashBtn.style.display = 'flex';
            } else {
                flashBtn.style.display = 'none';
            }
        });
    } catch (err) {
        console.error("Erro ao alternar câmera:", err);
    }
}

// Manipulação de imagem
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        importedImage.src = event.target.result;
        importedImage.style.display = 'block';
        
        // Resetar transformações
        rotationAngle = 0;
        tiltAngle = 0;
        isMirrored = false;
        imageScale = 1;
        imageX = 0;
        imageY = 0;
        
        rotateSlider.value = 0;
        tiltSlider.value = 0;
        
        updateImageTransform();
    };
    reader.readAsDataURL(file);
}

// Funções de rotação por botão
function rotateImage(degrees) {
    rotationAngle += degrees;
    if (rotationAngle > 180) rotationAngle -= 360;
    if (rotationAngle < -180) rotationAngle += 360;
    rotateSlider.value = rotationAngle;
    updateImageTransform();
}

function updateImageTransform() {
    rotationAngle = parseInt(rotateSlider.value);
    tiltAngle = parseInt(tiltSlider.value);
    
    importedImage.style.transform = `
        translate(${imageX}px, ${imageY}px)
        scale(${imageScale})
        rotate(${rotationAngle}deg)
        rotateX(${tiltAngle}deg)
        ${isMirrored ? 'scaleX(-1)' : ''}
    `;
}

function mirrorImage() {
    isMirrored = !isMirrored;
    mirrorBtn.classList.toggle('active', isMirrored);
    updateImageTransform();
}

// Manipulação de toque para imagem
let initialDistance = null;
let initialScale = 1;
let initialX = 0;
let initialY = 0;
let initialAngle = 0;

function handleTouchStart(e) {
    if (e.touches.length === 2) {
        // Pinça para zoom/rotação
        e.preventDefault();
        initialDistance = getDistance(e.touches[0], e.touches[1]);
        initialScale = imageScale;
        initialAngle = getAngle(e.touches[0], e.touches[1]);
    } else if (e.touches.length === 1) {
        // Movimento com um dedo
        e.preventDefault();
        initialX = e.touches[0].clientX - imageX;
        initialY = e.touches[0].clientY - imageY;
    }
}

function handleTouchMove(e) {
    if (e.touches.length === 2 && initialDistance !== null) {
        // Zoom/rotação com pinça
        e.preventDefault();
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const currentAngle = getAngle(e.touches[0], e.touches[1]);
        
        // Zoom
        imageScale = (currentDistance / initialDistance) * initialScale;
        
        // Rotação (se o ângulo mudou significativamente)
        if (Math.abs(currentAngle - initialAngle) > 5) {
            rotationAngle += (currentAngle - initialAngle) * 0.5;
            rotateSlider.value = rotationAngle;
            initialAngle = currentAngle;
        }
        
        updateImageTransform();
    } else if (e.touches.length === 1) {
        // Movimento
        e.preventDefault();
        imageX = e.touches[0].clientX - initialX;
        imageY = e.touches[0].clientY - initialY;
        updateImageTransform();
    }
}

function handleTouchEnd() {
    initialDistance = null;
}

function getDistance(touch1, touch2) {
    return Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
    );
}

function getAngle(touch1, touch2) {
    return Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
    ) * 180 / Math.PI;
}

// Tema
function setTheme(theme) {
    document.body.classList.remove('dark-theme', 'light-theme', 'red-theme');
    document.body.classList.add(theme + '-theme');
    currentTheme = theme;

    if (theme === 'dark') {
        themeToggle.innerHTML = '<img src="icons/sun.svg" alt="Tema claro">';
        if (redThemeBtn) redThemeBtn.innerHTML = '<img src="icons/theme-red.svg" alt="Tema vermelho">';
    } else if (theme === 'light') {
        themeToggle.innerHTML = '<img src="icons/moon.svg" alt="Tema escuro">';
        if (redThemeBtn) redThemeBtn.innerHTML = '<img src="icons/theme-red.svg" alt="Tema vermelho">';
    } else if (theme === 'red') {
        themeToggle.innerHTML = '<img src="icons/sun.svg" alt="Tema claro">';
        if (redThemeBtn) redThemeBtn.innerHTML = '<img src="icons/theme-dark.svg" alt="Tema escuro">';
    }
}

// Blur
function toggleBlur() {
    isBlurEnabled = !isBlurEnabled;
    blurToggle.classList.toggle('active', isBlurEnabled);

    document.querySelectorAll('.settings-group, .about-content').forEach(el => {
        el.style.backdropFilter = isBlurEnabled ? 'blur(10px)' : 'none';
    });
}

// Tela cheia
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error("Erro ao entrar em tela cheia:", err);
        });
    } else {
        document.exitFullscreen();
    }
}

function handleFullscreenChange() {
    if (document.fullscreenElement) {
        if (fullscreenControls) fullscreenControls.classList.remove('hidden');
        fullscreenBtn.classList.add('hidden');
        settingsBtn.classList.add('hidden');
        aboutBtn.classList.add('hidden');
    } else {
        if (fullscreenControls) fullscreenControls.classList.add('hidden');
        fullscreenBtn.classList.remove('hidden');
        settingsBtn.classList.remove('hidden');
        aboutBtn.classList.remove('hidden');
    }
}

// Painel de configurações
function toggleSettings() {
    isSettingsOpen = !isSettingsOpen;
    settingsPanel.classList.toggle('hidden', !isSettingsOpen);

    // Fechar menu sobre se estiver aberto
    if (isAboutOpen) {
        isAboutOpen = false;
        aboutPanel.classList.add('hidden');
    }

    // Acessibilidade: foco no painel ao abrir
    if (isSettingsOpen) {
        settingsPanel.focus?.();
    }
}

function toggleAbout() {
    isAboutOpen = !isAboutOpen;
    aboutPanel.classList.toggle('hidden', !isAboutOpen);

    // Fechar configurações se estiver aberto
    if (isSettingsOpen) {
        isSettingsOpen = false;
        settingsPanel.classList.add('hidden');
    }

    // Acessibilidade: foco no painel ao abrir
    if (isAboutOpen) {
        aboutPanel.focus?.();
    }
}

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', init);
