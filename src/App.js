import React, { useEffect, useState } from 'react';
import 'weather-icons/css/weather-icons.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import {
  DropletFill,
  CloudRainFill,
  Wind,
  ThermometerHalf,
} from 'react-bootstrap-icons';
import 'swiper/css';
import './index.css';

function App() {
  const API_KEY = '26c857d16e9b3f95fd9b5748fd3a111a';
  const [city, setCity] = useState('Seoul');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [todayForecast, setTodayForecast] = useState([]);
  const [inputCity, setInputCity] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWeather = async () => {
      setError('');

      try {
        const weatherRes = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        const weatherData = await weatherRes.json();
        const { lat, lon } = weatherData.coord;

        const forecastRes = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        const forecastData = await forecastRes.json();

        setWeather(weatherData);
        setForecast(forecastData);
        setError('');
      } catch (error) {
        setError('도시명을 확인할 수 없습니다. 잠시 후 다시 시도해주세요.');
      }
    };

    fetchWeather();
  }, [city]);

  useEffect(() => {
    if (!weather || !forecast) return;

    const nowTimestamp = weather.dt;
    const timezoneOffset = weather.timezone;

    const upcomingList = forecast.list
      .filter((item) => item.dt >= nowTimestamp)
      .slice(0, 12)
      .map((item) => {
        const date = new Date((item.dt + timezoneOffset) * 1000);
        const hour = date.getUTCHours();
        const isPM = hour >= 12;
        const hour12 = ((hour + 11) % 12) + 1;

        return {
          time: `${hour12}:00 ${isPM ? 'PM' : 'AM'}`,
          temp: Math.round(item.main.temp),
          weather: item.weather[0],
        };
      });

    setTodayForecast(upcomingList);
  }, [weather, forecast]);

  const localDate = weather
    ? new Date((weather.dt + weather.timezone) * 1000)
    : null;

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const pad = (n) => String(n).padStart(2, '0');

  const year = localDate?.getUTCFullYear();
  const month = localDate ? pad(localDate.getUTCMonth() + 1) : '';
  const date = localDate ? pad(localDate.getUTCDate()) : '';
  const day = localDate ? DAYS[localDate.getUTCDay()] : '';

  if (!weather || !forecast) return null;

  const rainChansce = Math.round((forecast.list[0].pop ?? 0) * 100);

  const getWeatherIcon = (w) => {
    if (!w) return 'wi-na';
    const { main, icon } = w;
    const isNight = icon.endsWith('n');

    const iconMap = {
      Clear: isNight ? 'wi-night-clear' : 'wi-day-sunny',
      Clouds: isNight ? 'wi-night-alt-cloudy' : 'wi-cloudy',
      Rain: isNight ? 'wi-night-alt-rain' : 'wi-day-rain',
      Drizzle: isNight ? 'wi-night-alt-sprinkle' : 'wi-day-sprinkle',
      Thunderstorm: 'wi-thunderstorm',
      Snow: isNight ? 'wi-night-alt-snow' : 'wi-day-snow',
      Mist: 'wi-fog',
      Smoke: 'wi-smoke',
      Haze: 'wi-day-haze',
      Dust: 'wi-dust',
      Fog: 'wi-fog',
      Sand: 'wi-sandstorm',
      Ash: 'wi-volcano',
      Squall: 'wi-strong-wind',
      Tornado: 'wi-tornado',
    };

    return iconMap[main] || 'wi-na';
  };

  const feelsLike = weather.main.feels_like;
  const windKmH = (weather.wind.speed * 3.6).toFixed(1);
  const humidity = weather.main.humidity;

  const weeklyData = {};

  forecast.list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const dayKey = date.toISOString().split('T')[0];

    if (!weeklyData[dayKey]) {
      weeklyData[dayKey] = {
        temps: [],
        pops: [],
        icons: [],
        dateObj: date,
      };
    }

    weeklyData[dayKey].temps.push(item.main.temp);
    weeklyData[dayKey].pops.push(item.pop ?? 0);
    weeklyData[dayKey].icons.push(item.weather[0]);
  });

  const todayDateKey = new Date(weather.dt * 1000).toISOString().split('T')[0];

  const weeklyArray = Object.keys(weeklyData).map((dayKey) => {
    const dayInfo = weeklyData[dayKey];
    const minTemp = Math.min(...dayInfo.temps);
    const maxTemp = Math.max(...dayInfo.temps);
    const avgPop = Math.round(
      (dayInfo.pops.reduce((a, b) => a + b, 0) / dayInfo.pops.length) * 100
    );

    const icon = dayInfo.icons[0];

    const dateObj = dayInfo.dateObj;
    const dayLabel = dayKey === todayDateKey ? 'Today' : DAYS[dateObj.getDay()];

    return {
      date: dayLabel,
      minTemp,
      maxTemp,
      pop: avgPop,
      weather: icon,
    };
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputCity.trim()) return;
    setCity(inputCity.trim());
    setInputCity('');
  };

  return (
    <div className="App">
      {weather && (
        <div className="weather_board">
          <div className="weather_today">
            <form className="search" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Search for cities"
                value={inputCity}
                onChange={(e) => setInputCity(e.target.value)}
              />
            </form>

            <div className="now_data">
              <div className="text_data">
                <h3>{weather.name}</h3>
                <p>Chance of rain : {rainChansce}%</p>
                <h2>{weather.main.temp.toFixed(1)}°</h2>
              </div>
              <div className="img_data">
                <p>{weather.weather[0].description}</p>
                <i className={`wi ${getWeatherIcon(weather.weather[0])}`}></i>
              </div>
            </div>

            <div className="box today_forecast">
              <h3>TODAY'S FORECAST</h3>
              <Swiper slidesPerView="auto">
                {todayForecast.map((item, idx) => (
                  <SwiperSlide key={idx} className="forecast_item">
                    <p className="time">{item.time}</p>
                    <i className={`wi ${getWeatherIcon(item.weather)}`}></i>
                    <p className="temp">{item.temp.toFixed(1)}°</p>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            <div className="box air_conditions">
              <h3>AIR CONDITIONS</h3>
              <ul>
                <li>
                  <div className="air_title">
                    <ThermometerHalf />
                    <div className="text_box">
                      <p className="subtitle">Real Feel</p>
                      <p className="desc">{feelsLike.toFixed(1)}°</p>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="air_title">
                    <Wind />
                    <div className="text_box">
                      <p className="subtitle">Wind</p>
                      <p className="desc">{windKmH} km/h</p>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="air_title">
                    <CloudRainFill />
                    <div className="text_box">
                      <p className="subtitle">Chance of rain</p>
                      <p className="desc">{rainChansce}%</p>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="air_title">
                    <DropletFill />
                    <div className="text_box">
                      <p className="subtitle">Humidity</p>
                      <p className="desc">{humidity}%</p>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="weather_week">
            <div className="time_data">
              <p className="date">
                {year}.{month}.{date} {day}
              </p>
            </div>

            <div className="box weather_weekly">
              <h3>7-DAY FORECAST</h3>
              {weeklyArray.map((day, idx) => (
                <div key={idx} className="day_card">
                  <p className="seven_days">{day.date}</p>
                  <div className="seven_day_contents">
                    <i className={`wi ${getWeatherIcon(day.weather)}`}></i>
                    <p className="desc_weather">
                      {weather.weather[0].description}
                    </p>
                  </div>
                  <div className="min_max_temp">
                    <p>{day.maxTemp.toFixed(1)}°</p> /
                    <p>{day.minTemp.toFixed(1)}°</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="toast-container">
              <div className="error">{error}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
