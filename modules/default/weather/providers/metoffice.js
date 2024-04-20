// Update the base URL for the Met Office API 
const baseURL = 'https://api-metoffice.new-endpoint.com/'

// Function to fetch current weather data 
function fetchCurrentWeather() {
    const url = `${baseURL}/current?location=${this.config.location}&appid=${this.config.apiKey}`;

    url.searchParams.append('location', this.config.location); 
    url.searchParams.append('appid', this.config.apiKey); 

    // Using fetch to make the API call 
    fetch(url)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();  // Convert the response body to JSON
    })
    .then(data => {
        this.processWeatherData(data); 
    })
    .catch(error => {
        // Handle any errors that occurred during the fetch
        console.error('Unable to fetch Met Office weather data:', error);
    });etch(url)


}

function processWeatherData(data) {
    
    if (data && data.temperature && data.conditions && data.wind) {

        const currentTemperature = data.temperature.value;
        const weatherConditions = data.conditions[0].description; 
        const windSpeed = data.wind.speed;
        
        const temperatureCelsius = currentTemperature - 273.15;
        
        console.log(`Current Temperature: ${temperatureCelsius.toFixed(1)}°C`);
        console.log(`Weather Conditions: ${weatherConditions}`);
        console.log(`Wind Speed: ${windSpeed} m/s`);
        
        
    } else {
        console.error("Unexpected API response structure:", data);
    }
}