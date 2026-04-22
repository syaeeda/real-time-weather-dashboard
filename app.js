document.addEventListener('DOMContentLoaded', () => {
    // lookup table
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
        56: { desc: "Light freezing drizzle", icon: "🌧️" },
        57: { desc: "Dense freezing drizzle", icon: "❄️" },
        61: { desc: "Slight rain", icon: "🌧️" },
        63: { desc: "Moderate rain", icon: "🌧️" },
        65: { desc: "Heavy rain", icon: "🌧️" },
        66: { desc: "Light freezing rain", icon: "🌧️" },
        67: { desc: "Heavy freezing rain", icon: "❄️" },
        71: { desc: "Slight snow", icon: "❄️" },
        73: { desc: "Moderate snow", icon: "❄️" },
        75: { desc: "Heavy snow", icon: "❄️" },
        77: { desc: "Snow grains", icon: "❄️" },
        80: { desc: "Slight rain showers", icon: "🌦️" },
        81: { desc: "Moderate rain showers", icon: "🌦️" },
        82: { desc: "Violent rain showers", icon: "⛈️" },
        85: { desc: "Slight snow showers", icon: "🌨️" },
        86: { desc: "Heavy snow showers", icon: "🌨️" },
        95: { desc: "Thunderstorm", icon: "⛈️" },
        96: { desc: "Thunderstorm with slight hail", icon: "⛈️" },
        99: { desc: "Thunderstorm with heavy hail", icon: "🧊" }
    };

    // DOM elements
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const unitToggleBtn = document.getElementById('unitToggle');

    // state variables
    let isCelsius = true;
    let globalWeatherData = null; 
    let debounceTimer;

    // UI loading states
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

    // error UI handling
    function showError(message) {
        const weatherMain = document.querySelector('.weather-main');
        const currentCity = searchInput.value || '';
        weatherMain.innerHTML = `
            <div class="error-banner" style="background: #ffcccc; color: #cc0000; padding: 10px; border-radius: 6px; margin-top: 10px;">
                <p>${message}</p>
                <button onclick="fetchWeatherData('${searchInput.value}')" style="margin-top: 5px;">Retry</button>
            </div>
        `;
        toggleSkeletons(false); 
    }

    // temperature conversion
    function convertTemp(celsiusValue) {
        if (isCelsius) return Math.round(celsiusValue);
        return Math.round((celsiusValue * 9/5) + 32); 
    }

    function updateTemperatureUI() {
        if (!globalWeatherData) return;
        const unit = isCelsius ? "°C" : "°F";
        
        const currentTemp = convertTemp(globalWeatherData.current_weather.temperature);
        document.getElementById('temperature').textContent = `${currentTemp}${unit}`;

        const forecastCards = document.querySelectorAll('.forecast-card');
        const dailyData = globalWeatherData.daily;

        forecastCards.forEach((card, index) => {
            if (index < 7) {
                const high = convertTemp(dailyData.temperature_2m_max[index]);
                const low = convertTemp(dailyData.temperature_2m_min[index]);
                card.querySelector('.high-low').textContent = `H: ${high}° L: ${low}°`;
            }
        });
    }

    // 5 recent search storage
    function saveRecentSearch(city) {
        let searches = JSON.parse(localStorage.getItem('recentSearches')) || [];
        searches = searches.filter(s => s.toLowerCase() !== city.toLowerCase());
        searches.unshift(city);
        if (searches.length > 5) searches.pop();
        
        localStorage.setItem('recentSearches', JSON.stringify(searches));
        renderRecentSearches();
    }

    function renderRecentSearches() {
        const container = document.getElementById('recentSearches');
        container.innerHTML = ''; 
        let searches = JSON.parse(localStorage.getItem('recentSearches')) || [];
        
        searches.forEach(city => {
            const chip = document.createElement('span');
            chip.classList.add('chip');
            chip.textContent = city;
            chip.onclick = () => {
                searchInput.value = city;
                fetchWeatherData(city);
            };
            container.appendChild(chip);
        });
    }

    async function fetchWeatherData(city) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            // reset UI for new search
            const weatherMain = document.querySelector('.weather-main');
            weatherMain.innerHTML = `
                <p id="temperature" class="skeleton skeleton-text large-text">--°C</p>
                <p id="weatherDesc" class="skeleton skeleton-text">Description</p>
            `;

            toggleSkeletons(true);
            document.getElementById('cityName').textContent = city;
            $('#time').text('--:--');

            // fetch geocoding
            const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`;
            const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`)
            
            if (!geoResponse.ok) throw new Error(`HTTP Error: ${geoResponse.status} on Geocoding API`);
            const geoData = await geoResponse.json();

            if(!geoData.results || geoData.results.length === 0) {
                showError("City not found. Please check your spelling.");
                return;
            }

            const lat = geoData.results[0].latitude;
            const lon = geoData.results[0].longitude;
            const resolvedCityName = geoData.results[0].name;
            
            // fetch weather data
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
            const weatherResponse = await fetch(weatherUrl);
            
            if (!weatherResponse.ok) throw new Error(`HTTP Error: ${weatherResponse.status} on Weather API`);
            const weatherData = await weatherResponse.json();
            clearTimeout(timeoutId);

            globalWeatherData = weatherData;        
            saveRecentSearch(resolvedCityName);     
            updateTemperatureUI();

            document.getElementById('cityName').textContent = resolvedCityName;
            
            const current = weatherData.current_weather;
            const condition = weatherLookup[current.weathercode] || { desc: "Unknown", icon: "❓" };
            
            document.getElementById('temperature').textContent = `${current.temperature}°C`;
            document.getElementById('weatherDesc').textContent = `${condition.icon} ${condition.desc}`;
            document.getElementById('humidity').textContent = `${weatherData.hourly.relativehumidity_2m[0]}%`;
            document.getElementById('windSpeed').textContent = `${current.windspeed} km/h`;

            // 7 day forecast UI
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
                }
            });
            
            toggleSkeletons(false);

            // fetch local time
            const cityTimezone = weatherData.timezone; 

            $.getJSON(`https://timeapi.io/api/Time/current/zone?timeZone=${cityTimezone}`)
            //$.getJSON(`https://worldtimeapi.org/api/timezone/${cityTimezone}`)
                .done(function(timeData) {
                    const localDate = new Date(timeData.dateTime);
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
            // stop timer if error
            clearTimeout(timeoutId);
            console.error("Fetch failed:", error);
            
            // check if error caused by 10 second timer running out
            if (error.name === 'AbortError') {
                showError("Request timed out. The server took longer than 10 seconds to respond.");
            } else {
                showError(error.message || "Network error! Please check your internet connection.");
            }
        }
    }

    // debounce input validation
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer); 
        
        debounceTimer = setTimeout(() => {
            const city = searchInput.value.trim();
            
            if (city.length >= 2) {
                fetchWeatherData(city);
            } else if (city.length === 1) {
                showError("Please enter a city name with at least 2 characters.");
            }
        }, 500);
    });

    // main search click validation
    searchBtn.addEventListener('click', () => {
        const city = searchInput.value.trim();
        if (city.length === 0) {
            return; 
        } else if (city.length < 2) {
            showError("Please enter a city name with at least 2 characters.");
            return;
        }
         
        fetchWeatherData(city);
    });

    // celsius and fahrenheit button toggle
    unitToggleBtn.addEventListener('click', () => {
        isCelsius = !isCelsius; 
        updateTemperatureUI();  
    });

    renderRecentSearches();
});