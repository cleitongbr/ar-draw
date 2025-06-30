// Variáveis globais
let cameraStream = null;
let isDrawing = false;
let isErasing = false;
let lastX = 0;
let lastY = 0;
let currentColor = '#000000';
let brushSize = 5;
let drawingHistory = [];
let currentHistoryIndex = -1;
let rotationAngle = 0;
let isMirrored = false;
let isBlurred = false;
let scale = 1;
let posX = 0;
let posY = 0;
let startX = 0;
let startY = 0;
let startDistance = 0;
let startScale = 1;
let startAngle = 0;
let initialAngle = 0;
let isPinching = false;
let touchCount = 0;

// Elementos DOM
const video = document.getElementById('camera');
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
const importedImage = document.getElementById('imported-image');
const fileInput = document.getElementById('file-input');
const opacitySlider = document.getElementById('opacity-slider');
const brushBtn = document.getElementById('brush-btn');
const eraserBtn = document.getElementById('eraser-btn');
const colorPicker = document.getElementById('color-picker');
const brushSizeSlider = document.getElementById('brush-size');
const undoBtn = document.getElementById('undo-btn');
const clearBtn = document.getElementById('clear-btn');
const uploadBtn = document.getElementById('upload-btn');
const flipCameraBtn = document.getElementById('flip-camera-btn');
const rotateBtn = document.getElementById('rotate-btn');
const mirrorBtn = document.getElementById('mirror-btn');
const blurBtn = document.getElementById('blur-btn');
const saveBtn = document.getElementById('save-btn');
const aboutBtn = document.getElementById('about-btn');
const aboutContent = document.getElementById('about-content');
const closeAbout = document.getElementById('close-about');

// Inicialização
function init() {
    setupCanvas();
    setupEventListeners();
    startCamera();
    updateImageStyles();
}

// Configurar canvas
function setupCanvas() {
    resizeCanvas();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.globalCompositeOperation = 'source-over';
    clearCanvas();
    
    window.addEventListener('resize', () => {
        resizeCanvas();
        saveCanvasState();
    });
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Configurar listeners de eventos
function setupEventListeners() {
    // Desenho no canvas
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    
    // Controles
    brushBtn.addEventListener('click', () => setTool('brush'));
    eraserBtn.addEventListener('click', () => setTool('eraser'));
    colorPicker.addEventListener('input', (e) => {
        currentColor = e.target.value;
        setTool('brush');
    });
    brushSizeSlider.addEventListener('input', (e) => {
        brushSize = parseInt(e.target.value);
    });
    undoBtn.addEventListener('click', undoLastAction);
    clearBtn.addEventListener('click', clearCanvas);
    
    // Controles de imagem
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleImageUpload);
    opacitySlider.addEventListener('input', updateImageStyles);
    flipCameraBtn.addEventListener('click', flipCamera);
    rotateBtn.addEventListener('click', rotateImage);
    mirrorBtn.addEventListener('click', mirrorImage);
    blurBtn.addEventListener('click', toggleBlur);
    saveBtn.addEventListener('click', saveDrawing);
    
    // Menu sobre
    aboutBtn.addEventListener('click', toggleAboutMenu);
    closeAbout.addEventListener('click', toggleAboutMenu);
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

function flipCamera() {
    if (!cameraStream) return;
    
    // Parar a câmera atual
    cameraStream.getTracks().forEach(track => track.stop());
    
    // Iniciar câmera oposta
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

// Funções de desenho
function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = getPosition(e);
    saveCanvasState();
}

function draw(e) {
    if (!isDrawing) return;
    
    e.preventDefault();
    
    const [x, y] = getPosition(e);
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = isErasing ? 'rgba(0,0,0,0)' : currentColor;
    ctx.lineWidth = brushSize;
    ctx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over';
    ctx.stroke();
    
    [lastX, lastY] = [x, y];
}

function stopDrawing() {
    isDrawing = false;
    saveCanvasState();
}

function getPosition(e) {
    let x, y;
    
    if (e.type.includes('touch')) {
        const touch = e.touches[0] || e.changedTouches[0];
        const rect = canvas.getBoundingClientRect();
        x = touch.clientX - rect.left;
        y = touch.clientY - rect.top;
    } else {
        const rect = canvas.getBoundingClientRect();
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
    }
    
    return [x, y];
}

function setTool(tool) {
    isErasing = tool === 'eraser';
    if (tool === 'brush') {
        brushBtn.classList.add('active');
        eraserBtn.classList.remove('active');
    } else {
        brushBtn.classList.remove('active');
        eraserBtn.classList.add('active');
    }
}

// Histórico de desenho
function saveCanvasState() {
    // Limpa estados futuros se desfez algo e depois desenhou
    if (currentHistoryIndex < drawingHistory.length - 1) {
        drawingHistory = drawingHistory.slice(0, currentHistoryIndex + 1);
    }
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    drawingHistory.push(imageData);
    currentHistoryIndex = drawingHistory.length - 1;
    
    // Limita o histórico para evitar uso excessivo de memória
    if (drawingHistory.length > 20) {
        drawingHistory.shift();
        currentHistoryIndex--;
    }
}

function undoLastAction() {
    if (currentHistoryIndex <= 0) {
        clearCanvas();
        return;
    }
    
    currentHistoryIndex--;
    const imageData = drawingHistory[currentHistoryIndex];
    ctx.putImageData(imageData, 0, 0);
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveCanvasState();
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
        isMirrored = false;
        isBlurred = false;
        scale = 1;
        posX = 0;
        posY = 0;
        
        updateImageStyles();
    };
    reader.readAsDataURL(file);
}

function updateImageStyles() {
    const opacity = opacitySlider.value / 100;
    
    importedImage.style.opacity = opacity;
    importedImage.style.transform = `
        translate(${posX}px, ${posY}px)
        scale(${scale})
        rotate(${rotationAngle}deg)
        ${isMirrored ? 'scaleX(-1)' : ''}
    `;
    importedImage.style.filter = isBlurred ? 'blur(5px)' : 'none';
    importedImage.style.transition = isBlurred ? 'filter 0.3s ease' : 'none';
}

function rotateImage() {
    rotationAngle += 90;
    if (rotationAngle >= 360) rotationAngle = 0;
    updateImageStyles();
}

function mirrorImage() {
    isMirrored = !isMirrored;
    updateImageStyles();
}

function toggleBlur() {
    isBlurred = !isBlurred;
    blurBtn.classList.toggle('active', isBlurred);
    updateImageStyles();
}

// Manipulação de toque para imagem
function handleTouchStart(e) {
    e.preventDefault();
    touchCount = e.touches.length;
    
    if (touchCount === 1 && importedImage.style.display !== 'none') {
        // Movimento com um dedo
        const touch = e.touches[0];
        startX = touch.clientX - posX;
        startY = touch.clientY - posY;
    } else if (touchCount === 2 && importedImage.style.display !== 'none') {
        // Pinça com dois dedos (zoom e rotação)
        isPinching = true;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        // Calcula distância inicial entre os dedos
        startDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        
        // Calcula ângulo inicial
        startAngle = Math.atan2(
            touch2.clientY - touch1.clientY,
            touch2.clientX - touch1.clientX
        );
        
        startScale = scale;
        initialAngle = rotationAngle;
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    
    if (isPinching && touchCount === 2 && importedImage.style.display !== 'none') {
        // Pinça com dois dedos (zoom e rotação)
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        // Calcula nova distância
        const currentDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        
        // Calcula novo ângulo
        const currentAngle = Math.atan2(
            touch2.clientY - touch1.clientY,
            touch2.clientX - touch1.clientX
        );
        
        // Aplica zoom
        scale = startScale * (currentDistance / startDistance);
        
        // Aplica rotação
        const angleDiff = currentAngle - startAngle;
        rotationAngle = initialAngle + angleDiff * (180 / Math.PI);
        
        updateImageStyles();
    } else if (touchCount === 1 && importedImage.style.display !== 'none') {
        // Movimento com um dedo
        const touch = e.touches[0];
        posX = touch.clientX - startX;
        posY = touch.clientY - startY;
        updateImageStyles();
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    touchCount = e.touches.length;
    
    if (touchCount === 0) {
        isPinching = false;
    }
}

// Salvar desenho
function saveDrawing() {
    // Criar um canvas temporário para combinar todas as camadas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Desenhar a câmera (opcional)
    // tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    
    // Desenhar a imagem importada (se existir)
    if (importedImage.style.display !== 'none') {
        tempCtx.save();
        tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
        tempCtx.scale(scale, scale);
        tempCtx.rotate(rotationAngle * Math.PI / 180);
        if (isMirrored) {
            tempCtx.scale(-1, 1);
        }
        tempCtx.globalAlpha = parseFloat(importedImage.style.opacity);
        tempCtx.drawImage(
            importedImage,
            -importedImage.naturalWidth / 2 + posX / scale,
            -importedImage.naturalHeight / 2 + posY / scale,
            importedImage.naturalWidth,
            importedImage.naturalHeight
        );
        tempCtx.restore();
    }
    
    // Desenhar o canvas de desenho
    tempCtx.drawImage(canvas, 0, 0);
    
    // Criar link de download
    const link = document.createElement('a');
    link.download = 'ar-drawing-' + new Date().toISOString().slice(0, 10) + '.png';
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
}

// Menu sobre
function toggleAboutMenu() {
    aboutContent.style.display = aboutContent.style.display === 'block' ? 'none' : 'block';
}

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', init);