// Downloads page functionality

const albumData = {
    'traditional': {
        name: 'Reception Images',
        description: 'Reception and celebration moments',
        folder: 'traditional',
        count: 1886,
        externalUrl: 'https://drive.google.com/drive/folders/17xdV6aukDNn8XfHrieXTv8ZT9VNPX5LN'
    },
    'candid': {
        name: 'Marriage Images',
        description: 'Marriage ceremony and special moments',
        folder: 'candid',
        count: 1374,
        externalUrl: 'https://drive.google.com/drive/folders/17xdV6aukDNn8XfHrieXTv8ZT9VNPX5LN'
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
    'featured': {
        name: 'Featured Moments',
        description: 'Selected high-quality highlights',
        folder: 'featured',
        count: 0
    }
};

document.addEventListener('DOMContentLoaded', function() {
    loadAlbumSummary();
    setupDownloadButtons();
});

function loadAlbumSummary() {
    fetch('images/album-summary.json')
        .then(response => response.json())
        .then(data => {
            updateCompleteCollection(data);
            updateAlbumList(data);
        })
        .catch(error => {
            console.error('Error loading album summary:', error);
            // Use default values
            const defaultData = {
                totalImages: 3260,
                albums: {
                    traditional: 1886,
                    candid: 1374,
                    ceremony: 0,
                    reception: 0,
                    'couple-portraits': 0
                }
            };
            updateCompleteCollection(defaultData);
            updateAlbumList(defaultData);
        });
}

function updateCompleteCollection(data) {
    const detailsEl = document.getElementById('completeCollectionDetails');
    const sizeEl = document.getElementById('completeCollectionSize');
    
    if (detailsEl) {
        detailsEl.textContent = `All ${data.totalImages} photos from all albums`;
    }
    
    // Calculate total size (approximate: assuming average 2MB per photo)
    const totalSizeMB = Math.round(data.totalImages * 2);
    const totalSizeGB = (totalSizeMB / 1024).toFixed(2);
    
    if (sizeEl) {
        if (totalSizeMB > 1024) {
            sizeEl.textContent = `Size: ${totalSizeGB} GB`;
        } else {
            sizeEl.textContent = `Size: ${totalSizeMB} MB`;
        }
    }
}

function updateAlbumList(data) {
    const albumsList = document.getElementById('albumsList');
    if (!albumsList) return;
    
    albumsList.innerHTML = '';
    
            // Update album counts
    if (data.albums) {
        Object.keys(data.albums).forEach(albumKey => {
            if (albumData[albumKey]) {
                albumData[albumKey].count = data.albums[albumKey];
            }
        });
    }
    
    
    // Create download cards for albums with images
    Object.keys(albumData).forEach(albumKey => {
        const album = albumData[albumKey];
        if (album.count > 0) {
            createAlbumDownloadCard(albumKey, album, albumsList);
        }
    });
}

function createAlbumDownloadCard(albumKey, album, container) {
    const card = document.createElement('div');
    card.className = 'album-download-card';
    card.setAttribute('data-album', albumKey);
    
    // Calculate size (approximate: assuming average 2MB per photo)
    const sizeMB = Math.round(album.count * 2);
    const sizeGB = (sizeMB / 1024).toFixed(2);
    const sizeText = sizeMB > 1024 ? `${sizeGB} GB` : `${sizeMB} MB`;
    
    const albumFile = `${albumKey}.zip`;
    const downloadPath = album.externalUrl || `downloads/${albumFile}`;
    
    card.innerHTML = `
        <div class="album-download-info">
            <h3 class="album-download-title">${album.name}</h3>
            <p class="album-download-description">${album.description}</p>
            <div class="album-download-meta">
                <span>${album.count} photos</span>
                <span>•</span>
                <span>${sizeText}</span>
            </div>
        </div>
        <a href="${downloadPath}" ${album.externalUrl ? 'target="_blank"' : 'download="' + albumFile + '"'} class="btn btn-download">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download
        </a>
    `;
    
    container.appendChild(card);
}

function setupDownloadButtons() {
    // Complete collection download
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    if (downloadAllBtn) {
        downloadAllBtn.addEventListener('click', () => downloadAlbum('all'));
    }
    
    // Individual album downloads
    document.addEventListener('click', (e) => {
        const downloadBtn = e.target.closest('.btn-download');
        if (downloadBtn) {
            const albumName = downloadBtn.getAttribute('download') || 'Album';
            showToast(`${albumName} download started...`, '📂');
        }
    });
}


// Helper function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

