const axios = require('axios');


async function getListingWeather(lng, lat) {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      console.warn("OPENWEATHER_API_KEY is missing in .env");
      return null;
    }


    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`;
    const response = await axios.get(url);
    const data = response.data;


    return {
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      condition: data.weather[0].main,
      description: data.weather[0].description,
      iconUrl: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6)
    };
  } catch (err) {
    console.log("OpenWeather error: ", err.response?.data?.message || err.message);
    return null;
  }
}


module.exports = { getListingWeather };