// Variáveis globais
let cameraStream = null;
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
let isFullscreen = false;
let rotateX = 0;
let rotateY = 0;
let rotateZ = 0;
let imageOpacity = 100;

// Elementos DOM
const elements = {
    loadingScreen: document.getElementById('loading-screen'),
    container: document.querySelector('.container'),
    video: document.getElementById('camera'),
    importedImage: document.getElementById('imported-image'),
    fileInput: document.getElementById('file-input'),
    importBtn: document.getElementById('import-btn'),
    fullscreenBtn: document.getElementById('fullscreen-btn'),
    minimizeBtn: document.getElementById('minimize-btn'),
    settingsBtn: document.getElementById('settings-btn'),
    fsSettingsBtn: document.getElementById('fs-settings-btn'),
    fsAboutBtn: document.getElementById('fs-about-btn'),
    settingsPanel: document.getElementById('settings-panel'),
    rotateXSlider: document.getElementById('rotate-x-slider'),
    rotateYSlider: document.getElementById('rotate-y-slider'),
    rotateZSlider: document.getElementById('rotate-z-slider'),
    opacitySlider: document.getElementById('opacity-slider'),
    resetRotateXBtn: document.getElementById('reset-rotate-x-btn'),
    resetRotateYBtn: document.getElementById('reset-rotate-y-btn'),
    resetRotateZBtn: document.getElementById('reset-rotate-z-btn'),
    resetOpacityBtn: document.getElementById('reset-opacity-btn'),
    resetBrightnessBtn: document.getElementById('reset-brightness-btn'),
    mirrorBtn: document.getElementById('mirror-btn'),
    brightnessSlider: document.getElementById('brightness-slider'),
    flipCameraBtn: document.getElementById('flip-camera-btn'),
    flashBtn: document.getElementById('flash-btn'),
    themeToggle: document.getElementById('theme-toggle'),
    aboutToggle: document.getElementById('about-toggle'),
    aboutPanel: document.getElementById('about-panel'),
    closeAboutBtn: document.getElementById('close-about-btn'),
    fullscreenControls: document.getElementById('fullscreen-controls')
};

// Inicialização
function init() {
    setTimeout(() => {
        elements.loadingScreen.classList.add('hidden');
        elements.container.classList.remove('hidden');
        startCamera();
    }, 1500);
    
    setupEventListeners();
    initSettings();
    
    // Verifica suporte a tela cheia
    if (!document.fullscreenEnabled) {
        elements.fullscreenBtn.style.display = 'none';
    }
}

function initSettings() {
    elements.brightnessSlider.value = brightness;
    elements.rotateXSlider.value = rotateX;
    elements.rotateYSlider.value = rotateY;
    elements.rotateZSlider.value = rotateZ;
    elements.opacitySlider.value = imageOpacity;
}

// Configurar listeners de eventos
function setupEventListeners() {
    // Controles de imagem
    elements.importBtn?.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput?.addEventListener('change', handleImageUpload);
    
    // Controles de câmera
    elements.flipCameraBtn?.addEventListener('click', flipCamera);
    elements.flashBtn?.addEventListener('click', toggleFlash);
    elements.brightnessSlider?.addEventListener('input', updateCameraBrightness);
    elements.resetBrightnessBtn?.addEventListener('click', () => {
        brightness = 100;
        elements.brightnessSlider.value = 100;
        updateCameraBrightness();
    });
    
    // Transformações de imagem
    elements.rotateXSlider?.addEventListener('input', updateImageTransform);
    elements.rotateYSlider?.addEventListener('input', updateImageTransform);
    elements.rotateZSlider?.addEventListener('input', updateImageTransform);
    elements.opacitySlider?.addEventListener('input', updateImageTransform);
    elements.mirrorBtn?.addEventListener('click', mirrorImage);
    
    // Botões de reset
    elements.resetRotateXBtn?.addEventListener('click', () => {
        rotateX = 0;
        elements.rotateXSlider.value = 0;
        updateImageTransform();
    });
    elements.resetRotateYBtn?.addEventListener('click', () => {
        rotateY = 0;
        elements.rotateYSlider.value = 0;
        updateImageTransform();
    });
    elements.resetRotateZBtn?.addEventListener('click', () => {
        rotateZ = 0;
        elements.rotateZSlider.value = 0;
        updateImageTransform();
    });
    elements.resetOpacityBtn?.addEventListener('click', () => {
        imageOpacity = 100;
        elements.opacitySlider.value = 100;
        updateImageTransform();
    });
    
    // Tela cheia
    elements.fullscreenBtn?.addEventListener('click', toggleFullscreen);
    elements.minimizeBtn?.addEventListener('click', toggleFullscreen);
    
    // Temas e efeitos
    elements.themeToggle?.addEventListener('click', toggleTheme);
    
    // Painéis
    elements.settingsBtn?.addEventListener('click', toggleSettings);
    elements.fsSettingsBtn?.addEventListener('click', toggleSettings);
    elements.aboutToggle?.addEventListener('click', toggleAbout);
    elements.fsAboutBtn?.addEventListener('click', toggleAbout);
    elements.closeAboutBtn?.addEventListener('click', toggleAbout);
    
    // Eventos de tela cheia
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Eventos de toque para a imagem
    setupTouchEvents();
    
    // Fechar painéis ao clicar fora
    document.addEventListener('click', handleClickOutside);
}

function setupTouchEvents() {
    let initialDistance = null;
    let initialScale = 1;
    let initialX = 0;
    let initialY = 0;
    let initialAngle = 0;

    elements.importedImage?.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            initialDistance = getDistance(e.touches[0], e.touches[1]);
            initialScale = imageScale;
            initialAngle = getAngle(e.touches[0], e.touches[1]);
        } else if (e.touches.length === 1) {
            e.preventDefault();
            initialX = e.touches[0].clientX - imageX;
            initialY = e.touches[0].clientY - imageY;
        }
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && initialDistance !== null) {
            e.preventDefault();
            const currentDistance = getDistance(e.touches[0], e.touches[1]);
            const currentAngle = getAngle(e.touches[0], e.touches[1]);
            
            imageScale = (currentDistance / initialDistance) * initialScale;
            
            if (Math.abs(currentAngle - initialAngle) > 5) {
                rotateZ += (currentAngle - initialAngle) * 0.5;
                elements.rotateZSlider.value = rotateZ;
                initialAngle = currentAngle;
            }
            
            updateImageTransform();
        } else if (e.touches.length === 1) {
            e.preventDefault();
            imageX = e.touches[0].clientX - initialX;
            imageY = e.touches[0].clientY - initialY;
            updateImageTransform();
        }
    }, { passive: false });

    document.addEventListener('touchend', () => {
        initialDistance = null;
    });
}

function handleClickOutside(e) {
    if (isSettingsOpen && !elements.settingsPanel.contains(e.target) && 
        e.target !== elements.settingsBtn && e.target !== elements.fsSettingsBtn) {
        toggleSettings();
    }
    if (isAboutOpen && !elements.aboutPanel.contains(e.target) && 
        e.target !== elements.aboutToggle && e.target !== elements.fsAboutBtn) {
        toggleAbout();
    }
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
        elements.video.srcObject = cameraStream;
        
        await elements.video.play();
        
        // Verifica se o dispositivo suporta flash
        const track = cameraStream.getVideoTracks()[0];
        if (track.getCapabilities().torch) {
            elements.flashBtn.style.display = 'flex';
        }
    } catch (err) {
        console.error("Erro ao acessar a câmera:", err);
        showError("Não foi possível acessar a câmera. Verifique as permissões.");
    }
}

async function toggleFlash() {
    if (!cameraStream) return;
    
    const track = cameraStream.getVideoTracks()[0];
    try {
        await track.applyConstraints({ advanced: [{ torch: !isFlashOn }] });
        isFlashOn = !isFlashOn;
        elements.flashBtn.classList.toggle('active', isFlashOn);
    } catch (err) {
        console.error("Erro ao alternar flash:", err);
        showError("Seu dispositivo não suporta flash ou ocorreu um erro.");
    }
}

function updateCameraBrightness() {
    brightness = elements.brightnessSlider.value;
    elements.video.style.filter = `brightness(${brightness}%)`;
}

async function flipCamera() {
    if (!cameraStream) return;
    
    if (isFlashOn) await toggleFlash();
    
    cameraStream.getTracks().forEach(track => track.stop());
    
    const constraints = {
        video: {
            facingMode: elements.video.srcObject.getVideoTracks()[0].getSettings().facingMode === 'user' ? 'environment' : 'user',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        }
    };
    
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        elements.video.srcObject = cameraStream;
        await elements.video.play();
        
        const track = cameraStream.getVideoTracks()[0];
        elements.flashBtn.style.display = track.getCapabilities().torch ? 'flex' : 'none';
    } catch (err) {
        console.error("Erro ao alternar câmera:", err);
        showError("Não foi possível alternar a câmera.");
    }
}

// Manipulação de imagem
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        elements.importedImage.src = event.target.result;
        elements.importedImage.style.display = 'block';
        resetImageTransformations();
    };
    reader.readAsDataURL(file);
}

function resetImageTransformations() {
    rotateX = 0;
    rotateY = 0;
    rotateZ = 0;
    imageScale = 1;
    imageX = 0;
    imageY = 0;
    imageOpacity = 100;
    isMirrored = false;
    
    elements.rotateXSlider.value = 0;
    elements.rotateYSlider.value = 0;
    elements.rotateZSlider.value = 0;
    elements.opacitySlider.value = 100;
    elements.mirrorBtn.classList.remove('active');
    
    updateImageTransform();
}

function updateImageTransform() {
    rotateX = parseInt(elements.rotateXSlider.value);
    rotateY = parseInt(elements.rotateYSlider.value);
    rotateZ = parseInt(elements.rotateZSlider.value);
    imageOpacity = parseInt(elements.opacitySlider.value);
    
    elements.importedImage.style.transform = `
        translate(${imageX}px, ${imageY}px)
        scale(${imageScale})
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        rotateZ(${rotateZ}deg)
        ${isMirrored ? 'scaleX(-1)' : ''}
    `;
    
    elements.importedImage.style.opacity = `${imageOpacity}%`;
}

function mirrorImage() {
    isMirrored = !isMirrored;
    elements.mirrorBtn.classList.toggle('active', isMirrored);
    updateImageTransform();
}

// Tema
function toggleTheme() {
    const themes = ['dark', 'light', 'red'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
}

function setTheme(theme) {
    document.body.classList.remove('dark-theme', 'light-theme', 'red-theme');
    document.body.classList.add(`${theme}-theme`);
    currentTheme = theme;

    const iconMap = {
        dark: { icon: 'sun.svg', alt: 'Tema claro' },
        light: { icon: 'moon.svg', alt: 'Tema escuro' },
        red: { icon: 'sun.svg', alt: 'Tema claro' }
    };
    
    elements.themeToggle.innerHTML = `<img src="icons/${iconMap[theme].icon}" alt="${iconMap[theme].alt}">`;
}

// Tela cheia
async function toggleFullscreen() {
    try {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
            isFullscreen = true;
        } else {
            await document.exitFullscreen();
            isFullscreen = false;
        }
    } catch (err) {
        console.error("Erro ao alternar tela cheia:", err);
        showError("Seu navegador não suporta tela cheia ou ocorreu um erro.");
    }
}

function handleFullscreenChange() {
    isFullscreen = !!document.fullscreenElement;
    
    if (isFullscreen) {
        elements.fullscreenControls?.classList.remove('hidden');
        elements.fullscreenBtn?.classList.add('hidden');
        elements.settingsBtn?.classList.add('hidden');
        elements.aboutToggle?.classList.add('hidden');
    } else {
        elements.fullscreenControls?.classList.add('hidden');
        elements.fullscreenBtn?.classList.remove('hidden');
        elements.settingsBtn?.classList.remove('hidden');
        elements.aboutToggle?.classList.remove('hidden');
    }
}

// Painéis
function toggleSettings() {
    isSettingsOpen = !isSettingsOpen;
    elements.settingsPanel.classList.toggle('hidden', !isSettingsOpen);
    
    if (isAboutOpen) toggleAbout();
    if (isSettingsOpen) elements.settingsPanel.focus();
}

function toggleAbout() {
    isAboutOpen = !isAboutOpen;
    elements.aboutPanel.classList.toggle('hidden', !isAboutOpen);
    
    if (isSettingsOpen) toggleSettings();
    if (isAboutOpen) elements.aboutPanel.focus();
}

// Utilitários
function showError(message) {
    alert(message);
}

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', init);