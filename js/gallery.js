// Gallery page functionality

const albumData = {
    'traditional': {
        name: 'Reception Images',
        description: 'Reception and celebration moments',
        folder: 'traditional',
        count: 1886
    },
    'candid': {
        name: 'Marriage Images',
        description: 'Marriage ceremony and special moments',
        folder: 'candid',
        count: 1374
    },
    'ceremony': {
        name: 'Ceremony',
        description: 'Our sacred vows and beautiful ceremony moments',
        folder: 'ceremony',
        count: 0
    },
    'reception': {
        name: 'Reception',
        description: 'Dancing, dinner, and celebration',
        folder: 'reception',
        count: 0
    },
    'couple-portraits': {
        name: 'Couple Portraits',
        description: 'Intimate moments together',
        folder: 'couple-portraits',
        count: 0
    }
};

let currentAlbum = null;
let currentImageIndex = 0;
let currentImages = [];
let imageManifest = null;

document.addEventListener('DOMContentLoaded', function () {
    loadImageManifest().then(() => {
        // loadFeaturedImages();
        loadAllImages();
        setupLightbox();
    });
});

function loadImageManifest() {
    return fetch('images/image-manifest.json')
        .then(response => response.json())
        .then(data => {
            imageManifest = data;
            return data;
        })
        .catch(error => {
            console.error('Error loading image manifest:', error);
            return null;
        });
}

// function loadFeaturedImages() ... removed
// function createFeaturedImageCard() ... removed

const BATCH_SIZE = 24;
let allImagesData = [];
let displayedCount = 0;
let observer = null;

function loadAllImages() {
    const allImagesGrid = document.getElementById('allImagesGrid');
    if (!allImagesGrid) return;

    // Create sentinel for infinite scroll
    const sentinel = document.createElement('div');
    sentinel.id = 'scroll-sentinel';
    sentinel.style.width = '100%';
    sentinel.style.height = '20px';
    // Insert sentinel after grid
    allImagesGrid.parentNode.insertBefore(sentinel, allImagesGrid.nextSibling);

    allImagesGrid.innerHTML = '<div class="loading">Loading wedding photos...</div>';

    if (imageManifest && imageManifest.albums) {
        allImagesData = [];
        let imageIndex = 0;

        // Collect all images from all albums
        Object.keys(imageManifest.albums).forEach(albumKey => {
            const album = imageManifest.albums[albumKey];
            if (album && album.images && album.images.length > 0) {
                album.images.forEach(imageName => {
                    allImagesData.push({
                        path: `images/albums/${albumKey}/${imageName}`,
                        album: albumKey,
                        index: imageIndex++
                    });
                });
            }
        });

        // Shuffle disabled to maintain order
        // shuffleArray(allImagesData);

        // Optimize: Create paths array once for lightbox navigation
        currentImages = allImagesData.map(img => img.path);

        // Clear loading message
        allImagesGrid.innerHTML = '';

        // Setup Intersection Observer for infinite scroll
        setupInfiniteScroll();

        // Load initial batch
        loadMoreImages();
    }
}

function setupInfiniteScroll() {
    const options = {
        root: null,
        rootMargin: '200px', // Load before reaching bottom
        threshold: 0.1
    };

    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadMoreImages();
            }
        });
    }, options);

    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) observer.observe(sentinel);
}

function loadMoreImages() {
    const allImagesGrid = document.getElementById('allImagesGrid');
    if (!allImagesGrid || displayedCount >= allImagesData.length) return;

    const nextBatch = allImagesData.slice(displayedCount, displayedCount + BATCH_SIZE);
    const fragment = document.createDocumentFragment();

    nextBatch.forEach(imageData => {
        const card = createImageCard(imageData.path, imageData.index);
        fragment.appendChild(card);
    });

    allImagesGrid.appendChild(fragment);
    displayedCount += nextBatch.length;

    // Hide sentinel if all images loaded
    if (displayedCount >= allImagesData.length) {
        const sentinel = document.getElementById('scroll-sentinel');
        if (sentinel && observer) observer.unobserve(sentinel);
    }
}

function createImageCard(imagePath, index) {
    const card = document.createElement('div');
    card.className = 'image-card';

    // Use low-quality placeholder if available, or just lazy load
    card.innerHTML = `
        <img src="${imagePath}" alt="Wedding photo ${index + 1}" class="gallery-image" onerror="this.style.display='none'" loading="lazy">
    `;

    card.addEventListener('click', () => {
        currentImageIndex = index;
        showLightbox(imagePath, index);
    });

    return card;
}

// Function to shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function setupLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeLightbox);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => navigateImage(-1));
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => navigateImage(1));
    }

    if (lightboxDownload) {
        lightboxDownload.addEventListener('click', () => {
            showToast('Photo download started...', '📸');
        });
    }

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('active')) {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') navigateImage(-1);
            if (e.key === 'ArrowRight') navigateImage(1);
        }
    });
}

function showLightbox(imagePath, index) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxDownload = document.getElementById('lightboxDownload');
    const caption = lightbox.querySelector('.lightbox-caption');

    if (!lightbox || !lightboxImage) return;

    lightboxImage.src = imagePath;
    lightboxImage.alt = `Image ${index + 1} of ${currentImages.length}`;

    if (lightboxDownload) {
        lightboxDownload.href = imagePath;
        const filename = imagePath.split('/').pop();
        lightboxDownload.setAttribute('download', filename);
    }

    if (caption) {
        caption.textContent = `${index + 1} / ${currentImages.length}`;
    }

    lightbox.classList.add('active');
    currentImageIndex = index;

    // Update navigation buttons visibility
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');

    if (prevBtn) prevBtn.style.display = index > 0 ? 'block' : 'none';
    if (nextBtn) nextBtn.style.display = index < currentImages.length - 1 ? 'block' : 'none';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
    }
}

function navigateImage(direction) {
    if (currentImages.length === 0) return;

    currentImageIndex += direction;

    if (currentImageIndex < 0) {
        currentImageIndex = currentImages.length - 1;
    } else if (currentImageIndex >= currentImages.length) {
        currentImageIndex = 0;
    }

    showLightbox(currentImages[currentImageIndex], currentImageIndex);
}

// Helper function to get image list from album folder
// This would typically be done server-side
function getImageListFromFolder(folder) {
    // In a real implementation, this would make an API call to list files
    // For now, return empty array - this needs server-side support
    return [];
}


