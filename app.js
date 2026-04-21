const weatherLookup = {
    0: { desc: "Clear sky", icon: "☀️" },
    1: { desc: "Mainly clear", icon: "🌤️" },
    2: { desc: "Partly cloudy", icon: "⛅" },
    3: { desc: "Overcast", icon: "☁️" },
    45: { desc: "Fog", icon: "🌫️" },
    48: { desc: "Depositing rime fog", icon: "🌫️" },
    51: { desc: "Light drizzle", icon: "🌧️" },
    53: { desc: "Moderate drizzle", icon: "🌧️" },
    55: { desc: "Dense drizzle", icon: "🌧️" },
    61: { desc: "Slight rain", icon: "🌧️" },
    63: { desc: "Moderate rain", icon: "🌧️" },
    65: { desc: "Heavy rain", icon: "🌧️" },
    71: { desc: "Slight snow", icon: "❄️" },
    73: { desc: "Moderate snow", icon: "❄️" },
    75: { desc: "Heavy snow", icon: "❄️" },
    95: { desc: "Thunderstorm", icon: "⛈️" }
};

function toggleSkeletons(show) {
    const skeletonElements = document.querySelectorAll('.skeleton-text, .skeleton-icon');
    skeletonElements.forEach(el => {
        if (show) {
            el.classList.add('skeleton');
        } else {
            el.classList.remove('skeleton');
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
    
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        document.getElementById('cityName').textContent = resolvedCityName;
        
        const current = weatherData.current_weather;
        const condition = weatherLookup[current.weathercode] || { desc: "Unknown", icon: "❓" };
        
        document.getElementById('temperature').textContent = `${current.temperature}°C`;
        document.getElementById('weatherDesc').textContent = `${condition.icon} ${condition.desc}`;
        document.getElementById('humidity').textContent = `${weatherData.hourly.relativehumidity_2m[0]}%`;
        document.getElementById('windSpeed').textContent = `${current.windspeed} km/h`;

        const forecastCards = document.querySelectorAll('.forecast-card');
        const dailyData = weatherData.daily;

        forecastCards.forEach((card, index) => {
            if (index < 7) { 
                const date = new Date(dailyData.time[index]);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                
                const dailyCondition = weatherLookup[dailyData.weathercode[index]] || { desc: "Unknown", icon: "❓" };
                const high = Math.round(dailyData.temperature_2m_max[index]);
                const low = Math.round(dailyData.temperature_2m_min[index]);

                card.querySelector('.day-name').textContent = dayName;
                card.querySelector('.weather-icon').textContent = dailyCondition.icon;
                card.querySelector('.high-low').textContent = `H: ${high}° L: ${low}°`;
            }
        });
        
        toggleSkeletons(false);

        const cityTimezone = weatherData.timezone; 

        $.getJSON(`https://timeapi.io/api/Time/current/zone?timeZone=${cityTimezone}`)
        //$.getJSON(`https://worldtimeapi.org/api/timezone/${cityTimezone}`)
            .done(function(timeData) {
                const localDate = new Date(timeData.datetime);
                const formattedTime = localDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                $('#time').text(formattedTime);
            })  
            .fail(function() {
                console.warn("World TimeAPI failed. Falling back to browser time.");
                const browserTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                $('#time').text(browserTime + " (Local Fallback)");
            })
            .always(function() {
                const timestamp = new Date().toISOString();
                console.log("Time request completed at:", timestamp);
            }); 

    } catch (error) {
        console.error("Network failed:", error);
        
        const weatherMain = document.querySelector('.weather-main');
        weatherMain.innerHTML = `
            <div style="background: #ffcccc; color: #cc0000; padding: 15px; border-radius: 6px; margin-top: 10px;">
                <p>Network error! Please check your internet connection.</p>
                <button onclick="fetchWeatherData('${city}')" style="margin-top: 10px; padding: 8px 16px; cursor: pointer;">Retry</button>
            </div>
        `;
        toggleSkeletons(false);
    }
}

searchBtn.addEventListener('click', () => {
    const city = searchInput.value.trim();
    if (city) {
        fetchWeatherData(city);
    }
});

