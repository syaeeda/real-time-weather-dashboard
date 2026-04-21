async function fetchWeatherData(city) {
    try {
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`)
        const geoData = await geoResponse.json();


    } catch (error) {

    }
}