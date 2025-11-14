// グローバル変数
let originalImage = null;
let originalFileName = '';

// DOM要素の取得
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectBtn');
const editorSection = document.getElementById('editorSection');
const originalCanvas = document.getElementById('originalCanvas');
const resizedCanvas = document.getElementById('resizedCanvas');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const maintainAspect = document.getElementById('maintainAspect');
const qualityInput = document.getElementById('qualityInput');
const qualityValue = document.getElementById('qualityValue');
const formatSelect = document.getElementById('formatSelect');
const resizeBtn = document.getElementById('resizeBtn');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const originalInfo = document.getElementById('originalInfo');
const resizedInfo = document.getElementById('resizedInfo');

// イベントリスナーの設定
selectBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
resizeBtn.addEventListener('click', resizeImage);
downloadBtn.addEventListener('click', downloadImage);
resetBtn.addEventListener('click', reset);

// プリセットボタンのイベントリスナー
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (!originalImage) return;
        const scale = parseFloat(btn.dataset.scale);
        applyPresetScale(scale);
    });
});

// ドラッグ＆ドロップイベント
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

dropZone.addEventListener('click', () => fileInput.click());

// 品質スライダーの値表示更新
qualityInput.addEventListener('input', (e) => {
    qualityValue.textContent = Math.round(e.target.value * 100) + '%';
});

// 縦横比維持のチェックボックス
let aspectRatio = 1;
maintainAspect.addEventListener('change', () => {
    if (maintainAspect.checked && originalImage) {
        aspectRatio = originalImage.width / originalImage.height;
    }
});

// 幅入力の変更イベント
widthInput.addEventListener('input', () => {
    if (maintainAspect.checked && originalImage) {
        heightInput.value = Math.round(widthInput.value / aspectRatio);
    }
});

// 高さ入力の変更イベント
heightInput.addEventListener('input', () => {
    if (maintainAspect.checked && originalImage) {
        widthInput.value = Math.round(heightInput.value * aspectRatio);
    }
});

// ファイル選択の処理
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

// ファイル処理
function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください。');
        return;
    }

    originalFileName = file.name;
    const reader = new FileReader();

    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            originalImage = img;
            displayOriginalImage(img);
            setupResizeDefaults(img);
            showEditorSection();
        };
        img.src = e.target.result;
    };

    reader.readAsDataURL(file);
}

// 元画像の表示
function displayOriginalImage(img) {
    const ctx = originalCanvas.getContext('2d');
    
    // キャンバスのサイズを画像に合わせる（最大幅500px）
    const maxWidth = 500;
    const scale = Math.min(1, maxWidth / img.width);
    
    originalCanvas.width = img.width * scale;
    originalCanvas.height = img.height * scale;
    
    ctx.drawImage(img, 0, 0, originalCanvas.width, originalCanvas.height);
    
    // 画像情報の表示
    const fileSizeKB = Math.round((img.src.length * 3/4) / 1024);
    originalInfo.textContent = `${img.width} × ${img.height}px (約 ${fileSizeKB} KB)`;
}

// リサイズのデフォルト値設定
function setupResizeDefaults(img) {
    aspectRatio = img.width / img.height;
    
    // デフォルトは元のサイズの50%
    const defaultWidth = Math.round(img.width * 0.5);
    const defaultHeight = Math.round(img.height * 0.5);
    
    widthInput.value = defaultWidth;
    heightInput.value = defaultHeight;
}

// プリセット縮小率の適用
function applyPresetScale(scale) {
    if (!originalImage) return;
    
    const newWidth = Math.round(originalImage.width * scale);
    const newHeight = Math.round(originalImage.height * scale);
    
    widthInput.value = newWidth;
    heightInput.value = newHeight;
}

// エディターセクションの表示
function showEditorSection() {
    editorSection.style.display = 'block';
    downloadBtn.style.display = 'none';
    resizedCanvas.style.display = 'none';
    resizedInfo.textContent = '';
}

// 画像のリサイズ
function resizeImage() {
    if (!originalImage) return;

    const width = parseInt(widthInput.value);
    const height = parseInt(heightInput.value);
    const quality = parseFloat(qualityInput.value);
    const format = formatSelect.value;

    // リサイズキャンバスの設定
    resizedCanvas.width = width;
    resizedCanvas.height = height;

    const ctx = resizedCanvas.getContext('2d');
    
    // 高品質なリサイズのための設定
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // 画像を描画
    ctx.drawImage(originalImage, 0, 0, width, height);

    // リサイズ後の画像情報を表示
    resizedCanvas.toBlob((blob) => {
        const fileSizeKB = Math.round(blob.size / 1024);
        resizedInfo.textContent = `${width} × ${height}px (約 ${fileSizeKB} KB)`;
    }, format, quality);

    // キャンバスとダウンロードボタンを表示
    resizedCanvas.style.display = 'block';
    downloadBtn.style.display = 'inline-block';
}

// 画像のダウンロード
function downloadImage() {
    if (!resizedCanvas) return;

    const format = formatSelect.value;
    const quality = parseFloat(qualityInput.value);
    
    resizedCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        // ファイル名の生成
        const extension = format === 'image/jpeg' ? 'jpg' : 'png';
        const baseName = originalFileName.replace(/\.[^/.]+$/, '');
        const timestamp = new Date().getTime();
        a.download = `${baseName}_resized_${timestamp}.${extension}`;
        
        a.href = url;
        a.click();
        
        URL.revokeObjectURL(url);
    }, format, quality);
}

// リセット
function reset() {
    originalImage = null;
    originalFileName = '';
    editorSection.style.display = 'none';
    fileInput.value = '';
    
    // キャンバスのクリア
    const ctx1 = originalCanvas.getContext('2d');
    const ctx2 = resizedCanvas.getContext('2d');
    ctx1.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
    ctx2.clearRect(0, 0, resizedCanvas.width, resizedCanvas.height);
    
    // 情報のクリア
    originalInfo.textContent = '';
    resizedInfo.textContent = '';
    
    // フォームのリセット
    qualityInput.value = 0.9;
    qualityValue.textContent = '90%';
    formatSelect.value = 'image/jpeg';
    maintainAspect.checked = true;
}
