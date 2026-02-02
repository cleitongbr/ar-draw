// Variáveis globais
let cameraStream = null;
let isMirrored = false;
let brightness = 100;
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
let isTouchEnabled = true;
let currentTheme = 'dark';

// Elementos DOM
const elements = {
    loadingScreen: document.getElementById('loading-screen'),
    container: document.querySelector('.container'),
    video: document.getElementById('camera-preview'),
    importedImage: document.getElementById('imported-image'),
    fileInput: document.getElementById('file-input'),
    importBtn: document.getElementById('import-btn'),
    fullscreenBtn: document.getElementById('fullscreen-btn'),
    minimizeBtn: document.getElementById('minimize-btn'),
    settingsBtn: document.getElementById('settings-btn'),
    fsSettingsBtn: document.getElementById('fs-settings-btn'),
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
    cameraMirrorBtn: document.getElementById('camera-mirror-btn'),
    brightnessSlider: document.getElementById('brightness-slider'),
    flipCameraBtn: document.getElementById('flip-camera-btn'),
    flashBtn: document.getElementById('flash-btn'),
    aboutToggle: document.getElementById('about-toggle'),
    aboutPanel: document.getElementById('about-panel'),
    fullscreenControls: document.getElementById('fullscreen-controls'),
    touchToggle: document.getElementById('touch-toggle'),
    cameraError: document.getElementById('camera-error'),
    retryCameraBtn: document.getElementById('retry-camera-btn')
};

// Inicialização
function init() {
    // Simula tempo de carregamento e remove tela de load
    setTimeout(() => {
        if(elements.loadingScreen) elements.loadingScreen.classList.add('hidden');
        if(elements.container) elements.container.classList.remove('hidden');
        startCamera();
    }, 1500);
    
    setupEventListeners();
    initSettings();
    
    // Verifica suporte a tela cheia
    if (!document.fullscreenEnabled && elements.fullscreenBtn) {
        elements.fullscreenBtn.style.display = 'none';
    }
}

function initSettings() {
    if(elements.brightnessSlider) elements.brightnessSlider.value = brightness;
    if(elements.rotateXSlider) elements.rotateXSlider.value = rotateX;
    if(elements.rotateYSlider) elements.rotateYSlider.value = rotateY;
    if(elements.rotateZSlider) elements.rotateZSlider.value = rotateZ;
    if(elements.opacitySlider) elements.opacitySlider.value = imageOpacity;
    if(elements.touchToggle) elements.touchToggle.checked = isTouchEnabled;
}

// Configurar listeners de eventos
function setupEventListeners() {
    // Controles de imagem
    elements.importBtn?.addEventListener('click', () => {
        elements.fileInput.value = ''; // Permite selecionar o mesmo arquivo novamente
        elements.fileInput.click();
    });
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
    elements.cameraMirrorBtn?.addEventListener('click', () => {
        isMirrored = !isMirrored;
        elements.video.style.transform = isMirrored ? 'scaleX(-1)' : 'scaleX(1)';
        // Feedback visual no botão
        elements.cameraMirrorBtn.style.background = isMirrored ? 'var(--accent-color)' : '';
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
        imageOpacity = 50; // Reset para 50% que é padrão no novo HTML
        elements.opacitySlider.value = 50;
        updateImageTransform();
    });
    
    // Tela cheia
    elements.fullscreenBtn?.addEventListener('click', toggleFullscreen);
    elements.minimizeBtn?.addEventListener('click', toggleFullscreen);
    
    // Controle de touch
    elements.touchToggle?.addEventListener('change', (e) => {
        isTouchEnabled = e.target.checked;
    });
    
    // Painéis - Abrir/Fechar
    elements.settingsBtn?.addEventListener('click', toggleSettings);
    elements.fsSettingsBtn?.addEventListener('click', toggleSettings);
    elements.aboutToggle?.addEventListener('click', toggleAbout);
    
    // Fechar ao clicar na "barrinha" (Drag Handle)
    const dragHandle = document.querySelector('.drag-handle');
    if (dragHandle) {
        dragHandle.addEventListener('click', toggleSettings);
    }

    // Fechar Modal Sobre via botão
    const closeAboutBtn = document.querySelector('.close-modal-btn');
    if(closeAboutBtn) {
        closeAboutBtn.addEventListener('click', () => {
             elements.aboutPanel.classList.add('hidden');
             isAboutOpen = false;
        });
    }
    
    // Eventos de tela cheia
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Eventos de toque para a imagem
    setupTouchEvents();
    
    // Fechar painéis ao clicar fora (ESSA É A CORREÇÃO PRINCIPAL)
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, {passive: false});
}

// Função para detectar clique fora dos painéis
function handleClickOutside(event) {
    // Se o painel de configurações estiver aberto
    if (isSettingsOpen) {
        // Verifica se o clique NÃO foi no painel nem no botão de abrir
        if (!elements.settingsPanel.contains(event.target) && 
            !elements.settingsBtn.contains(event.target) &&
            !elements.fsSettingsBtn.contains(event.target)) {
            toggleSettings();
        }
    }

    // Se o painel Sobre estiver aberto
    if (isAboutOpen) {
        const modalContent = elements.aboutPanel.querySelector('.modal-content');
        // Verifica se clicou no fundo escuro (fora do conteúdo)
        if (elements.aboutPanel.contains(event.target) && 
            !modalContent.contains(event.target) &&
            !elements.aboutToggle.contains(event.target)) {
            toggleAbout();
        }
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

function setupTouchEvents() {
    let initialDistance = null;
    let initialScale = 1;
    let initialX = 0;
    let initialY = 0;
    let initialAngle = 0;

    elements.importedImage?.addEventListener('touchstart', (e) => {
        if (!isTouchEnabled) return;
        
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
        if (!isTouchEnabled) return;
        
        if (e.touches.length === 2 && initialDistance !== null) {
            e.preventDefault();
            const currentDistance = getDistance(e.touches[0], e.touches[1]);
            const currentAngle = getAngle(e.touches[0], e.touches[1]);
            
            imageScale = (currentDistance / initialDistance) * initialScale;
            
            if (Math.abs(currentAngle - initialAngle) > 5) {
                rotateZ += (currentAngle - initialAngle) * 0.5;
                if(elements.rotateZSlider) elements.rotateZSlider.value = rotateZ;
                initialAngle = currentAngle;
            }
            
            updateImageTransform();
        } else if (e.touches.length === 1) {
            // Só move se não estiver interagindo com sliders
            if (e.target.type !== 'range') {
                e.preventDefault();
                imageX = e.touches[0].clientX - initialX;
                imageY = e.touches[0].clientY - initialY;
                updateImageTransform();
            }
        }
    }, { passive: false });

    document.addEventListener('touchend', () => {
        initialDistance = null;
    });
}

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            } 
        });
        cameraStream = stream;
        elements.video.srcObject = stream;
        await elements.video.play();
        if(elements.cameraError) elements.cameraError.classList.add('hidden');
        
        // Verifica se o dispositivo tem flash
        const track = stream.getVideoTracks()[0];
        if (track.getCapabilities().torch && elements.flashBtn) {
            elements.flashBtn.style.display = 'flex';
        }
    } catch (error) {
        console.error("Erro ao acessar a câmera:", error);
        if(elements.cameraError) elements.cameraError.classList.remove('hidden');
    }
}

async function toggleFlash() {
    if (!cameraStream) return;
    
    const track = cameraStream.getVideoTracks()[0];
    try {
        await track.applyConstraints({ advanced: [{ torch: !isFlashOn }] });
        isFlashOn = !isFlashOn;
        elements.flashBtn.classList.toggle('active', isFlashOn);
        // Estilo visual para ativado
        elements.flashBtn.style.backgroundColor = isFlashOn ? 'var(--accent-color)' : '';
    } catch (err) {
        console.error("Erro ao alternar flash:", err);
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
    
    let currentFacingMode = 'environment';
    if (elements.video.srcObject?.getVideoTracks()?.length > 0) {
        const track = elements.video.srcObject.getVideoTracks()[0];
        const settings = track.getSettings();
        currentFacingMode = settings.facingMode === 'user' ? 'environment' : 'user';
    }
    
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: currentFacingMode,
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        });
        elements.video.srcObject = cameraStream;
        await elements.video.play();
        
        const track = cameraStream.getVideoTracks()[0];
        if(elements.flashBtn) {
            elements.flashBtn.style.display = track.getCapabilities().torch ? 'flex' : 'none';
        }
    } catch (err) {
        console.error("Erro ao alternar câmera:", err);
    }
}

// Manipulação de imagem
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Verifica se é uma imagem
    if (!file.type.match('image.*')) {
        alert('Por favor, selecione um arquivo de imagem.');
        return;
    }
    
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
    imageOpacity = 50; // Opacidade padrão 50% para ver através
    isMirrored = false;
    
    if(elements.rotateXSlider) elements.rotateXSlider.value = 0;
    if(elements.rotateYSlider) elements.rotateYSlider.value = 0;
    if(elements.rotateZSlider) elements.rotateZSlider.value = 0;
    if(elements.opacitySlider) elements.opacitySlider.value = 50;
    if(elements.mirrorBtn) elements.mirrorBtn.classList.remove('active');
    
    updateImageTransform();
}

function updateImageTransform() {
    if(elements.rotateXSlider) rotateX = parseInt(elements.rotateXSlider.value);
    if(elements.rotateYSlider) rotateY = parseInt(elements.rotateYSlider.value);
    if(elements.rotateZSlider) rotateZ = parseInt(elements.rotateZSlider.value);
    if(elements.opacitySlider) imageOpacity = parseInt(elements.opacitySlider.value);
    
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
    if(elements.mirrorBtn) {
        elements.mirrorBtn.classList.toggle('active', isMirrored);
        elements.mirrorBtn.style.background = isMirrored ? 'var(--accent-color)' : '';
    }
    updateImageTransform();
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
    }
}

function handleFullscreenChange() {
    isFullscreen = !!document.fullscreenElement;
    
    if (isFullscreen) {
        elements.fullscreenControls?.classList.remove('hidden');
        elements.fullscreenBtn?.classList.add('hidden');
        elements.settingsBtn?.classList.add('hidden');
    } else {
        elements.fullscreenControls?.classList.add('hidden');
        elements.fullscreenBtn?.classList.remove('hidden');
        elements.settingsBtn?.classList.remove('hidden');
    }
}

// Painéis
function toggleSettings() {
    isSettingsOpen = !isSettingsOpen;
    
    if (elements.settingsPanel) {
        elements.settingsPanel.classList.toggle('hidden', !isSettingsOpen);
        
        // Efeito de animação no botão
        if (isSettingsOpen) {
            elements.settingsBtn.style.transform = 'scale(0.9)';
            elements.settingsPanel.focus();
        } else {
            elements.settingsBtn.style.transform = 'scale(1)';
        }
    }

    // Fecha o About se estiver aberto
    if (isSettingsOpen && isAboutOpen) {
        isAboutOpen = false;
        elements.aboutPanel.classList.add('hidden');
    }
}

function toggleAbout() {
    isAboutOpen = !isAboutOpen;
    elements.aboutPanel.classList.toggle('hidden', !isAboutOpen);

    if (isAboutOpen && isSettingsOpen) {
        isSettingsOpen = false;
        elements.settingsPanel.classList.add('hidden');
    }
}

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', init);
