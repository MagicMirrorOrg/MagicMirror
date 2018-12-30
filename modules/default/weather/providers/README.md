# MagicMirror² Weather Module Weather Provider Development Documentation

This document describes the way to develop your own MagicMirror² weather module weather provider.

Table of Contents:

- The weather provider file: yourprovider.js
  - [Weather provider methods to implement](#weather-provider-methods-to-implement)
  - [Weather Provider instance methods](#weather-provider-instance-methods)
  - [WeatherObject](#weatherobject)

---

## The weather provider file: yourprovider.js

This is the script in which the weather provider will be defined. In it's most simple form, the weather provider must implement the following:

````javascript
WeatherProvider.register("yourprovider", {
	providerName: "YourProvider",
	
	fetchCurrentWeather() {},
	
	fetchWeatherForecast() {}
});
````

### Weather provider methods to implement

#### `fetchCurrentWeather()`

This method is called when the weather module tries to fetch the current weather of your provider. The implementation of this method is required.
The implementation can make use of the already implemented function `this.fetchData(url, method, data);`, which is returning a promise.
After the response is processed, the current weather information (as a [WeatherObject](#weatherobject)) needs to be set with `this.setCurrentWeather(currentWeather);`.
It will then automatically refresh the module DOM with the new data.

#### `fetchWeatherForecast()`

This method is called when the weather module tries to fetch the weather weather of your provider. The implementation of this method is required.
The implementation can make use of the already implemented function `this.fetchData(url, method, data);`, which is returning a promise.
After the response is processed, the weather forecast information (as an array of [WeatherObject](#weatherobject)s) needs to be set with `this.setCurrentWeather(forecast);`.
It will then automatically refresh the module DOM with the new data.

### Weather Provider instance methods

#### `init()`

Called when a weather provider is initialized.

#### `setConfig(config)`

Called to set the config, this config is the same as the weather module's config.

#### `start()`

Called when the weather provider is about to start.

#### `currentWeather()`

This returns a WeatherDay object for the current weather.

#### `weatherForecast()`

This returns an array of WeatherDay objects for the weather forecast.

#### `fetchedLocation()`

This returns the name of the fetched location or an empty string.

#### `setCurrentWeather(currentWeatherObject)`

Set the currentWeather and notify the delegate that new information is available.

#### `setWeatherForecast(weatherForecastArray)`

Set the weatherForecastArray and notify the delegate that new information is available.

#### `setFetchedLocation(name)`

Set the fetched location name.

#### `updateAvailable()`

Notify the delegate that new weather is available.

#### `fetchData(url, method, data)`

A convinience function to make requests. It returns a promise.

### WeatherObject

| Property | Type | Value/Unit |
| --- | --- | --- |
| units | `string` | Gets initialized with the constructor. <br> Possible values: `metric` and `imperial` |
| date | `object` | [Moment.js](https://momentjs.com/) object of the time/date. |
| windSpeed |`number` | Metric: `meter/second` <br> Imperial: `miles/hour` |
| windDirection |`number` | Direction of the wind in degrees. |
| sunrise |`object` | [Moment.js](https://momentjs.com/) object of sunrise. |
| sunset |`object` | [Moment.js](https://momentjs.com/) object of sunset. |
| temperature | `number` | Current temperature |
| minTemperature | `number` | Lowest temperature of the day. |
| maxTemperature | `number` | Highest temperature of the day. |
| weatherType | `string` | Icon name of the weather type. <br> Possible values: [WeatherIcons](https://www.npmjs.com/package/weathericons) |
| humidity | `number` | Percentage of humidity |
| rain | `number` | Metric: `millimeters` <br> Imperial: `inches` |

#### Current weather

For the current weather object the following properties are required:

- humidity
- sunrise
- sunset
- temperature
- units
- weatherType
- windDirection
- windSpeed

#### Weather forecast

For the forecast weather object the following properties are required:

- date
- maxTemperature
- minTemperature
- rain
- units
- weatherType
