// Search and upload handlers (moved from home(desktop).html)
// Relies on window.APP_URLS for redirects (provided by template via base)

async function ensureAuthOrRedirect() {
    const token = localStorage.getItem('userToken');
    if (!token) {
        const loginUrl = window.APP_URLS && window.APP_URLS.login ? window.APP_URLS.login : '/login/';
        window.location.href = loginUrl;
        return null;
    }
    return token;
}

function toggleLocalFieldsFile() {
    const source = document.getElementById('fileSourceInput');
    const field = document.getElementById('fileLocalFields');
    if (!source || !field) return;
    field.classList.toggle('hidden', source.value !== 'LOCAL');
}

function toggleLocalFieldsUrl() {
    const source = document.getElementById('urlSourceInput');
    const field = document.getElementById('urlLocalFields');
    if (!source || !field) return;
    field.classList.toggle('hidden', source.value !== 'LOCAL');
}

function onProcessingComplete(itemId) {
    setTimeout(() => searchSimilar(itemId), 500);
}

async function handleFileUpload(event) {
    const token = await ensureAuthOrRedirect(); if (!token) return;
    const file = event.target.files[0]; if (!file) return;
    const statusDiv = document.getElementById('fileUploadStatus');
    const sourceInput = document.getElementById('fileSourceInput');
    const marketName = document.getElementById('fileMarketName');
    const marketLocation = document.getElementById('fileMarketLocation');
    const formData = new FormData();
    formData.append('image', file);
    formData.append('source', sourceInput ? sourceInput.value : '');
    if (sourceInput && sourceInput.value === 'LOCAL') {
        if (marketName) formData.append('market_name', marketName.value);
        if (marketLocation) formData.append('market_location', marketLocation.value);
    }
    if (statusDiv) statusDiv.innerHTML = '<span class="text-blue-500">Processing...</span>';
    try {
        const response = await fetch('/api/core/upload/', {
            method: 'POST',
            headers: { 'Authorization': `Token ${token}` },
            body: formData
        });
        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        if (statusDiv) statusDiv.innerHTML = '<span class="text-green-500">Uploaded</span>';
        if (data && data.id) onProcessingComplete(data.id);
    } catch (error) {
        console.error('File upload error', error);
        if (statusDiv) statusDiv.innerHTML = '<span class="text-red-500">Upload failed</span>';
    }
}

async function handleUrlUpload() {
    const token = await ensureAuthOrRedirect(); if (!token) return;
    const statusDiv = document.getElementById('urlUploadStatus');
    const urlInput = document.getElementById('urlInput');
    const sourceInput = document.getElementById('urlSourceInput');
    const marketName = document.getElementById('urlMarketName');
    const marketLocation = document.getElementById('urlMarketLocation');
    if (!urlInput || !urlInput.value) {
        if (statusDiv) statusDiv.innerHTML = '<span class="text-red-500">Enter a URL</span>';
        return;
    }
    const formData = new FormData();
    formData.append('image_url', urlInput.value);
    formData.append('source', sourceInput ? sourceInput.value : '');
    if (sourceInput && sourceInput.value === 'LOCAL') {
        if (marketName) formData.append('market_name', marketName.value);
        if (marketLocation) formData.append('market_location', marketLocation.value);
    }
    if (statusDiv) statusDiv.innerHTML = '<span class="text-blue-500">Processing...</span>';
    try {
        const response = await fetch('/api/core/upload/', {
            method: 'POST',
            headers: { 'Authorization': `Token ${token}` },
            body: formData
        });
        if (!response.ok) throw new Error('URL upload failed');
        const data = await response.json();
        if (statusDiv) statusDiv.innerHTML = '<span class="text-green-500">Uploaded</span>';
        if (data && data.id) onProcessingComplete(data.id);
    } catch (error) {
        console.error('URL upload error', error);
        if (statusDiv) statusDiv.innerHTML = '<span class="text-red-500">Upload failed</span>';
    }
}

async function searchImages() {
    const queryEl = document.getElementById('searchInput').value;
    if (!queryEl) return;
    const query = encodeURIComponent(queryEl);
    fetchResults(`/api/core/search/?q=${query}`);
}

async function searchSimilar(id) {
    const queryEl = document.getElementById('searchInput');
    if (queryEl) queryEl.value = `Similar to Item #${id}`;
    fetchResults(`/api/core/search/?similar_to=${id}`);
}

async function fetchResults(url) {
    const resultsDiv = document.getElementById('searchResults');
    const containerDiv = document.getElementById('searchResultsContainer');

    containerDiv.classList.remove('hidden');
    resultsDiv.innerHTML = '<div id="loading" class="col-span-4 text-center py-10"><div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-black mx-auto mb-4"></div><p class="text-gray-400">Searching...</p></div>';
    
    try {
        const token = localStorage.getItem('userToken');

        const response = await fetch(url, {
                    method: 'GET',
                    headers: { 
                        'Authorization': 'Token ' + token,
                        'Content-Type': 'application/json'
                    }
                });

        if (!response.ok) {
            resultsDiv.querySelector("#loading").classList.add("hidden");
            throw new Error('Search failed')
        };
        const data = await response.json();

        // Basic rendering: adapt to your API shape
        if (!Array.isArray(data)) {
            resultsDiv.querySelector("#loading").classList.add("hidden");
            resultsDiv.innerHTML = '<div class="col-span-4 text-center py-10"><p class="text-gray-400">No results</p></div>';
            return;
        }

        resultsDiv.querySelector("#loading").classList.add("hidden");

        const itemsHtml = data.map(item => {
            const card = document.createElement('div');
            card.className = "bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-black transition-all group cursor-pointer";

            card.innerHTML = `
                <div class="aspect-square bg-gray-50 overflow-hidden">
                    <img src="${item.image}" alt="Item" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                </div>
                <div class="p-4">
                    <p class="font-bold text-sm mb-1">${item.source}</p>
                    ${item.market_name ? `<p class="text-xs text-gray-400 mb-3">${item.market_name}</p>` : ''}
                    <button onclick="searchSimilar(${item.id})" class="w-full bg-gray-50 hover:bg-black hover:text-white px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all">
                        🔍 Find Similar
                    </button>
                </div>
            `;

            resultsDiv.appendChild(card);
        });
        
    } catch (error) {
        console.error('Fetch results error', error);
        resultsDiv.innerHTML = '<div class="col-span-4 text-center py-10"><p class="text-red-500">Search failed</p></div>';
    }
}

function clearSearchResults() {
    const container = document.getElementById('searchResultsContainer');
    const results = document.getElementById('searchResults');
    const input = document.getElementById('searchInput');
    if (container) container.classList.add('hidden');
    if (results) results.innerHTML = '';
    if (input) input.value = '';
}

// Expose functions for inline/onclick use
window.toggleLocalFieldsFile = toggleLocalFieldsFile;
window.toggleLocalFieldsUrl = toggleLocalFieldsUrl;
window.handleFileUpload = handleFileUpload;
window.handleUrlUpload = handleUrlUpload;
window.searchImages = searchImages;
window.searchSimilar = searchSimilar;
window.fetchResults = fetchResults;
window.clearSearchResults = clearSearchResults;

// Optionally ensure auth on pages that require it
document.addEventListener('DOMContentLoaded', async () => {
    // If this is the home page, ensure auth quickly
    if (window.location.pathname === (window.APP_URLS && window.APP_URLS.home ? new URL(window.APP_URLS.home, window.location.origin).pathname : '/')) {
        await ensureAuthOrRedirect();
    }
});
