let map;
let weatherInfo = document.getElementById('weather');
const weatherbitApiKey = 'b37898868f3b4cb2aeec988f8557772d'; // Reemplaza con tu API Key de Weatherbit

function initMap() {
    // Intentar obtener la ubicación actual del usuario
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            // Centrar el mapa en la ubicación actual del usuario
            map = new google.maps.Map(document.getElementById('map'), {
                center: { lat: lat, lng: lon },
                zoom: 12
            });

            // Mostrar marcador en la ubicación actual
            new google.maps.Marker({
                map: map,
                position: { lat: lat, lng: lon }
            });

            // Llamar a la API de Open-Meteo para obtener datos del clima
            fetchWeatherData(lat, lon, 'Tu ubicación actual');
        }, error => {
            console.error('Error al obtener la ubicación', error);
            // Si no se puede obtener la ubicación, centrar el mapa en un lugar por defecto
            const defaultLocation = { lat: 40.712776, lng: -74.005974 }; // Nueva York por defecto
            map = new google.maps.Map(document.getElementById('map'), {
                center: defaultLocation,
                zoom: 12
            });
        });
    } else {
        console.error('La geolocalización no es compatible con este navegador');
        // Si la geolocalización no está disponible, centrar el mapa en un lugar por defecto
        const defaultLocation = { lat: 40.712776, lng: -74.005974 }; // Nueva York por defecto
        map = new google.maps.Map(document.getElementById('map'), {
            center: defaultLocation,
            zoom: 12
        });
    }

    const input = document.getElementById('autocomplete');
    const autocomplete = new google.maps.places.Autocomplete(input);

    autocomplete.addListener('place_changed', function () {
        const place = autocomplete.getPlace();

        if (!place.geometry) {
            console.error('El lugar seleccionado no tiene detalles de geometría');
            return;
        }

        // Centrar el mapa en la ubicación seleccionada
        map.setCenter(place.geometry.location);

        // Mostrar marcador en el mapa
        new google.maps.Marker({
            map: map,
            position: place.geometry.location
        });

        // Obtener coordenadas
        const lat = place.geometry.location.lat();
        const lon = place.geometry.location.lng();

        // Llamar a la API de Open-Meteo para obtener datos del clima
        fetchWeatherData(lat, lon, place.formatted_address);
    });
}

function fetchWeatherData(lat, lon, locationName) {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,weathercode`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Datos del clima:', data);

            // Verificar si los datos actuales y horarios están disponibles
            const currentWeather = data.current_weather;
            const hourlyWeather = data.hourly;

            if (currentWeather && hourlyWeather) {
                // Mostrar información del clima
                const currentTemperature = currentWeather.temperature;
                const currentWeatherCode = currentWeather.weathercode;

                const weatherCondition = getWeatherCondition(currentWeatherCode);

                // Obtener el icono de clima de Weatherbit
                fetchWeatherbitIcon(lat, lon)
                    .then(iconUrl => {
                        weatherInfo.innerHTML = `
                            <h2>Clima actual en ${locationName}</h2>
                            <img class="icon" src="${iconUrl}" alt="Weather icon">
                            <p>Condición actual: ${weatherCondition}</p>
                            <p>Temperatura actual: ${currentTemperature}°C</p>
                        `;
                    })
                    .catch(error => {
                        console.error('Error al obtener el icono del clima', error);
                        weatherInfo.innerHTML = `
                            <h2>Clima actual en ${locationName}</h2>
                            <p>Condición actual: ${weatherCondition}</p>
                            <p>Temperatura actual: ${currentTemperature}°C</p>
                        `;
                    });
            } else {
                weatherInfo.innerHTML = '<p>No se pudieron obtener los datos del clima.</p>';
            }
        })
        .catch(error => console.error('Error al obtener datos del clima', error));
}

function fetchWeatherbitIcon(lat, lon) {
    return fetch(`https://api.weatherbit.io/v2.0/current?lat=${lat}&lon=${lon}&key=${weatherbitApiKey}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.data && data.data[0] && data.data[0].weather && data.data[0].weather.icon) {
                const iconCode = data.data[0].weather.icon;
                console.log(iconCode);
                return `https://www.weatherbit.io/static/img/icons/${iconCode}.png`;
            } else {
                throw new Error('No se pudo obtener el icono del clima');
            }
        });
}

function getWeatherCondition(code) {
    const weatherConditions = {
        0: "Despejado",
        1: "Principalmente despejado",
        2: "Parcialmente nublado",
        3: "Nublado",
        45: "Niebla",
        48: "Neblina",
        51: "Llovizna ligera",
        53: "Llovizna moderada",
        55: "Llovizna intensa",
        56: "Llovizna congelada ligera",
        57: "Llovizna congelada intensa",
        61: "Lluvia ligera",
        63: "Lluvia moderada",
        65: "Lluvia intensa",
        66: "Lluvia helada ligera",
        67: "Lluvia helada intensa",
        71: "Nevada ligera",
        73: "Nevada moderada",
        75: "Nevada intensa",
        77: "Granizo",
        80: "Chubascos ligeros",
        81: "Chubascos moderados",
        82: "Chubascos intensos",
        85: "Chubascos de nieve ligeros",
        86: "Chubascos de nieve intensos",
        95: "Tormenta ligera",
        96: "Tormenta con granizo ligero",
        99: "Tormenta con granizo intenso"
    };

    return weatherConditions[code] || "Condición desconocida";
}
