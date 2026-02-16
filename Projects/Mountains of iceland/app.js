/* ============================================
   Iceland Mountain Map - Application Logic
   ============================================ */

// Configuration
const CONFIG = {
  map: {
    center: [64.9631, -18.5],
    zoom: 7,
    minZoom: 6,
    maxZoom: 15
  },
  overpass: {
    url: 'https://overpass-api.de/api/interpreter',
    query: '[out:json][timeout:25];(node[natural=peak](63.4,-24.5,66.5,-13.5););out body;',
    timeoutMs: 30000,
    maxRetries: 2,
    retryDelayMs: 3000
  },
  tiles: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
    subdomains: 'abcd'
  },
  categories: {
    small:  { label: 'Small',  min: 0,    max: 499,      color: '#F5F0E1', border: '#E8DCC8', size: 12 },
    medium: { label: 'Medium', min: 500,  max: 1000,     color: '#6B6B6B', border: '#6B6B6B', size: 16 },
    large:  { label: 'Large',  min: 1001, max: Infinity, color: '#C75B5B', border: '#A84444', size: 20 }
  }
};

// State
let map = null;
let clusterGroup = null;
let allMountains = [];
let activeFilters = { small: true, medium: true, large: true };
let searchTerm = '';

// --- Utility Functions ---

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatElevation(meters) {
  return Math.round(meters).toLocaleString() + ' m';
}

function categorize(elevation) {
  if (elevation < 500) return 'small';
  if (elevation <= 1000) return 'medium';
  return 'large';
}

// --- UI Helpers ---

function showLoading() {
  document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
}

function showError(msg) {
  document.getElementById('error-message').textContent = msg;
  document.getElementById('error-overlay').classList.remove('hidden');
}

function hideError() {
  document.getElementById('error-overlay').classList.add('hidden');
}

function updateCount(visible, total) {
  document.getElementById('mountain-count').textContent = visible + ' of ' + total + ' peaks';
}

// --- Map Initialization ---

function initMap() {
  map = L.map('map', {
    center: CONFIG.map.center,
    zoom: CONFIG.map.zoom,
    minZoom: CONFIG.map.minZoom,
    maxZoom: CONFIG.map.maxZoom,
    zoomControl: true
  });

  L.tileLayer(CONFIG.tiles.url, {
    attribution: CONFIG.tiles.attribution,
    maxZoom: CONFIG.tiles.maxZoom,
    subdomains: CONFIG.tiles.subdomains
  }).addTo(map);
}

function initClusterGroup() {
  clusterGroup = L.markerClusterGroup({
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    chunkedLoading: true,
    iconCreateFunction: function (cluster) {
      const count = cluster.getChildCount();
      let sizeClass = 'small';
      if (count >= 50) sizeClass = 'large';
      else if (count >= 10) sizeClass = 'medium';
      return L.divIcon({
        html: '<div><span>' + count + '</span></div>',
        className: 'marker-cluster marker-cluster-' + sizeClass,
        iconSize: L.point(40, 40)
      });
    }
  });
  map.addLayer(clusterGroup);
}

// --- Data Fetching ---

async function fetchMountains(retryCount = 0) {
  showLoading();
  hideError();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.overpass.timeoutMs);

  try {
    const response = await fetch(CONFIG.overpass.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(CONFIG.overpass.query),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error('HTTP ' + response.status);

    const data = await response.json();

    if (!data.elements || data.elements.length === 0) {
      throw new Error('No mountain data returned');
    }

    processMountains(data.elements);
    hideLoading();

  } catch (error) {
    clearTimeout(timeoutId);

    if (retryCount < CONFIG.overpass.maxRetries) {
      setTimeout(() => fetchMountains(retryCount + 1), CONFIG.overpass.retryDelayMs);
    } else {
      hideLoading();
      showError('Failed to load mountain data. The server may be busy. Please try again.');
    }
  }
}

// --- Data Processing ---

function processMountains(elements) {
  allMountains = elements
    .filter(function (el) {
      return el.type === 'node' && el.tags && el.tags.ele;
    })
    .map(function (el) {
      const elevation = parseFloat(el.tags.ele);
      if (isNaN(elevation) || elevation <= 0) return null;

      const category = categorize(elevation);
      const name = el.tags.name || 'Unnamed peak';

      const mountain = {
        id: el.id,
        name: name,
        lat: el.lat,
        lon: el.lon,
        elevation: elevation,
        category: category
      };

      mountain.marker = createMarker(mountain);
      return mountain;
    })
    .filter(Boolean)
    .sort(function (a, b) { return b.elevation - a.elevation; });

  renderMarkers();
}

// --- Marker Creation ---

function createMarker(mountain) {
  const cat = CONFIG.categories[mountain.category];

  const icon = L.divIcon({
    className: '',
    html: '<div class="mountain-marker mountain-marker--' + mountain.category + '" style="width:' + cat.size + 'px;height:' + cat.size + 'px;"></div>',
    iconSize: [cat.size, cat.size],
    iconAnchor: [cat.size / 2, cat.size / 2]
  });

  const marker = L.marker([mountain.lat, mountain.lon], { icon: icon });

  // Tooltip on hover: show elevation
  marker.bindTooltip(formatElevation(mountain.elevation), {
    direction: 'top',
    offset: [0, -(cat.size / 2) - 4],
    className: 'mountain-tooltip'
  });

  // Popup on click: show name, elevation, category badge
  const popupContent =
    '<div class="mountain-popup">' +
      '<h3 class="mountain-popup__name">' + escapeHtml(mountain.name) + '</h3>' +
      '<p class="mountain-popup__elevation">' + formatElevation(mountain.elevation) + '</p>' +
      '<span class="mountain-popup__badge mountain-popup__badge--' + mountain.category + '">' +
        cat.label +
      '</span>' +
    '</div>';

  marker.bindPopup(popupContent, { maxWidth: 250, className: 'mountain-popup-wrapper' });

  return marker;
}

// --- Rendering ---

function renderMarkers() {
  clusterGroup.clearLayers();

  const lowerSearch = searchTerm.toLowerCase();
  const markers = [];
  let visibleCount = 0;

  for (let i = 0; i < allMountains.length; i++) {
    const m = allMountains[i];
    if (!activeFilters[m.category]) continue;
    if (lowerSearch && m.name.toLowerCase().indexOf(lowerSearch) === -1) continue;
    markers.push(m.marker);
    visibleCount++;
  }

  clusterGroup.addLayers(markers);
  updateCount(visibleCount, allMountains.length);
}

// --- Search ---

function setupSearch() {
  const input = document.getElementById('search-input');

  input.addEventListener('input', debounce(function () {
    searchTerm = input.value.trim();
    renderMarkers();

    // If exactly one match, fly to it and open popup
    if (searchTerm.length > 0) {
      const lowerSearch = searchTerm.toLowerCase();
      const matches = allMountains.filter(function (m) {
        return activeFilters[m.category] && m.name.toLowerCase().indexOf(lowerSearch) !== -1;
      });

      if (matches.length === 1) {
        map.flyTo([matches[0].lat, matches[0].lon], 12, { duration: 1.2 });
        setTimeout(function () {
          // Need to ensure the marker is visible (not clustered) before opening popup
          clusterGroup.zoomToShowLayer(matches[0].marker, function () {
            matches[0].marker.openPopup();
          });
        }, 1300);
      }
    }
  }, 300));
}

// --- Filters ---

function setupFilters() {
  const buttons = document.querySelectorAll('.filter-btn');

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const category = this.dataset.category;
      activeFilters[category] = !activeFilters[category];
      this.classList.toggle('active');
      renderMarkers();
    });
  });
}

// --- Retry ---

function setupRetry() {
  document.getElementById('retry-btn').addEventListener('click', function () {
    fetchMountains();
  });
}

// --- Init ---

function init() {
  initMap();
  initClusterGroup();
  setupSearch();
  setupFilters();
  setupRetry();
  fetchMountains();
}

document.addEventListener('DOMContentLoaded', init);
