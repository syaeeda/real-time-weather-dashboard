function toggleSkeletons(show) {
    const skeletonElements = document.querySelectorAll('.sklt-text, .sklt-icon');
    skeletonElements.forEach(el => {
        if (show) {
            el.classList.add('sklt');
        } else {
            el.classList.remove('sklt');
        }
    });
}

function showError(message) {
    const weatherMain = document.querySelector('.weather-main');
    weatherMain.innerHTML = `
        <div class="error-banner" style="background: #ffcccc; color: #cc0000; padding: 10px; border-radius: 6px; margin-top: 10px;">
            <p>${message}</p>
            <button onclick="fetchWeatherData('${searchInput.value}')" style="margin-top: 5px;">Retry</button>
        </div>
    `;
    toggleSkeletons(false); 
}

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

async function fetchWeatherData(city) {
    try {
        toggleSkeletons(true);
        document.getElementById('cityName').textContent = city;

        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`)
        const geoData = await geoResponse.json();

        if(!geoData.results || geoData.results.length === 0) {
            showError("City not found. Please check your spelling.");
            return;
        }

        const lat = geoData.results[0].latitude;
        const lon = geoData.results[0].longitude;
        const resolvedCityName = geoData.results[0].name;
    
    } catch (error) {
        
    }
}

searchBtn.addEventListener('click', () => {
    const city = searchInput.value.trim();
    if (city) {
        fetchWeatherData(city);
    }
});

