// Variáveis globais
let cameraStream = null;
let rotationAngle = 0;
let tiltAngle = 0;
let isMirrored = false;
let brightness = 100;
let isDarkTheme = true;
let isSettingsOpen = false;
let isAboutOpen = false;

// Elementos DOM
const loadingScreen = document.getElementById('loading-screen');
const container = document.querySelector('.container');
const video = document.getElementById('camera');
const importedImage = document.getElementById('imported-image');
const fileInput = document.getElementById('file-input');
const importBtn = document.getElementById('import-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const rotateSlider = document.getElementById('rotate-slider');
const tiltSlider = document.getElementById('tilt-slider');
const mirrorBtn = document.getElementById('mirror-btn');
const brightnessSlider = document.getElementById('brightness-slider');
const flipCameraBtn = document.getElementById('flip-camera-btn');
const themeToggle = document.getElementById('theme-toggle');
const aboutBtn = document.getElementById('about-btn');
const aboutPanel = document.getElementById('about-panel');
const closeAbout = document.getElementById('close-about');

// Inicialização
function init() {
    // Mostrar tela de carregamento por 2 segundos
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        container.classList.remove('hidden');
        startCamera();
    }, 2000);
    
    setupEventListeners();
}

// Configurar listeners de eventos
function setupEventListeners() {
    // Controles
    importBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleImageUpload);
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    
    // Configurações
    settingsBtn.addEventListener('click', toggleSettings);
    rotateSlider.addEventListener('input', updateImageTransform);
    tiltSlider.addEventListener('input', updateImageTransform);
    mirrorBtn.addEventListener('click', mirrorImage);
    brightnessSlider.addEventListener('input', updateCameraBrightness);
    flipCameraBtn.addEventListener('click', flipCamera);
    themeToggle.addEventListener('click', toggleTheme);
    
    // Menu sobre
    aboutBtn.addEventListener('click', toggleAbout);
    closeAbout.addEventListener('click', toggleAbout);
    
    // Eventos de tela cheia
    document.addEventListener('fullscreenchange', handleFullscreenChange);
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
        video.play();
    } catch (err) {
        console.error("Erro ao acessar a câmera:", err);
        alert("Não foi possível acessar a câmera. Por favor, verifique as permissões.");
    }
}

function updateCameraBrightness() {
    brightness = brightnessSlider.value;
    video.style.filter = `brightness(${brightness}%)`;
}

function flipCamera() {
    if (!cameraStream) return;
    
    cameraStream.getTracks().forEach(track => track.stop());
    
    const constraints = {
        video: {
            facingMode: video.srcObject.getVideoTracks()[0].getSettings().facingMode === 'user' ? 'environment' : 'user',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        }
    };
    
    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            cameraStream = stream;
            video.srcObject = cameraStream;
            video.play();
        })
        .catch(err => {
            console.error("Erro ao alternar câmera:", err);
        });
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
        rotateSlider.value = 0;
        tiltSlider.value = 0;
        
        updateImageTransform();
    };
    reader.readAsDataURL(file);
}

function updateImageTransform() {
    rotationAngle = rotateSlider.value;
    tiltAngle = tiltSlider.value;
    
    importedImage.style.transform = `
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
        fullscreenBtn.innerHTML = '<img src="icons/fullscreen-exit.svg" alt="Sair da tela cheia">';
    } else {
        fullscreenBtn.innerHTML = '<img src="icons/fullscreen.svg" alt="Tela cheia">';
    }
}

// Tema
function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    document.body.classList.toggle('light-theme', !isDarkTheme);
    document.body.classList.toggle('dark-theme', isDarkTheme);
    
    // Atualizar ícone do tema
    themeToggle.innerHTML = isDarkTheme ? 
        '<img src="icons/sun.svg" alt="Tema claro">' : 
        '<img src="icons/moon.svg" alt="Tema escuro">';
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
}

// Menu sobre
function toggleAbout() {
    isAboutOpen = !isAboutOpen;
    aboutPanel.classList.toggle('hidden', !isAboutOpen);
    
    // Fechar configurações se estiver aberto
    if (isSettingsOpen) {
        isSettingsOpen = false;
        settingsPanel.classList.add('hidden');
    }
}

// Manipulação de toque para imagem (zoom e movimento)
let initialDistance = null;
let initialScale = 1;
let initialX = 0;
let initialY = 0;

document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2 && importedImage.style.display !== 'none') {
        // Pinça para zoom
        e.preventDefault();
        initialDistance = Math.hypot(
            e.touches[1].clientX - e.touches[0].clientX,
            e.touches[1].clientY - e.touches[0].clientY
        );
        initialScale = parseFloat(importedImage.style.transform.match(/scale\(([^)]+)\)/)?.[1] || 1);
    } else if (e.touches.length === 1 && importedImage.style.display !== 'none') {
        // Movimento com um dedo
        e.preventDefault();
        initialX = e.touches[0].clientX - parseInt(importedImage.style.left || 0);
        initialY = e.touches[0].clientY - parseInt(importedImage.style.top || 0);
    }
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && importedImage.style.display !== 'none' && initialDistance !== null) {
        // Zoom com pinça
        e.preventDefault();
        const currentDistance = Math.hypot(
            e.touches[1].clientX - e.touches[0].clientX,
            e.touches[1].clientY - e.touches[0].clientY
        );
        const scale = (currentDistance / initialDistance) * initialScale;
        importedImage.style.transform = `scale(${scale}) ${importedImage.style.transform.replace(/scale\([^)]+\)/, '')}`;
    } else if (e.touches.length === 1 && importedImage.style.display !== 'none') {
        // Movimento
        e.preventDefault();
        importedImage.style.left = `${e.touches[0].clientX - initialX}px`;
        importedImage.style.top = `${e.touches[0].clientY - initialY}px`;
    }
}, { passive: false });

document.addEventListener('touchend', () => {
    initialDistance = null;
});

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', init);
