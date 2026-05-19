import React, { useState, useEffect, useRef } from "react";
import { 
  Sun, 
  Moon, 
  Cloud, 
  CloudRain, 
  CloudDrizzle, 
  CloudLightning, 
  Snowflake, 
  Wind, 
  Search, 
  MapPin, 
  Thermometer, 
  Droplets, 
  Eye, 
  Sunrise, 
  Sunset, 
  Navigation, 
  RefreshCw, 
  AlertCircle,
  Gauge
} from "lucide-react";

const API_KEY = "55bb2aa2fa6bfd55a2077274fcb18de5";

const BACKGROUNDS = {
  Clear: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?q=80&w=1600&auto=format&fit=crop", // Sunny sky
  Clouds: "https://images.unsplash.com/photo-1483702721041-b23de737a886?q=80&w=1600&auto=format&fit=crop", // Moody clouds
  Rain: "https://images.unsplash.com/photo-1438449805896-28a666819a20?q=80&w=1600&auto=format&fit=crop", // Rain
  Drizzle: "https://images.unsplash.com/photo-1666546519800-456bd99d16df?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fERyaXp6bGUlMjB3ZWF0aGVyfGVufDB8fDB8fHww", // Drizzle
  Thunderstorm: "https://images.unsplash.com/photo-1429552077091-836152271555?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8VGh1bmRlcnN0b3JtJTIwd2VhdGhlcnxlbnwwfHwwfHx8MA%3D%3D", // Lightning
  Snow: "https://images.unsplash.com/photo-1491002052546-bf38f186af56?q=80&w=1600&auto=format&fit=crop", // Snow
  Mist: "https://plus.unsplash.com/premium_photo-1709368077150-8a5b871be714?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8TWlzdCUyMHdlYXRoZXJ8ZW58MHx8MHx8fDA%3D", // Mist/Fog
  Fog: "https://images.unsplash.com/photo-1634244034783-b776d7a7b89b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fEZvZyUyMHdlYXRoZXJ8ZW58MHx8MHx8fDA%3D",
  Haze: "https://images.unsplash.com/photo-1599059021750-82716ae2b661?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8SGF6ZSUyMHdlYXRoZXJ8ZW58MHx8MHx8fDA%3D",
  Default: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1600&auto=format&fit=crop", // Default nature
};

export default function App() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCelsius, setIsCelsius] = useState(true);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [bgImage, setBgImage] = useState(BACKGROUNDS.Default);

  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Load default city on initial render
  useEffect(() => {
    fetchWeatherData(40.7128, -74.0060, "ahmedabad", "IN", "Ahmedabad");
  }, []);

  // Fetch suggestions when user types (debounced)
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`
        );
        if (res.ok) {
          const result = await res.json();
          setSuggestions(result);
        }
      } catch (err) {
        console.error("Geocoding fetch error:", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener for suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setSuggestions([]);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle key navigation for suggestions list
  const handleKeyDown = (e) => {
    if (suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
        selectSuggestion(suggestions[focusedIndex]);
      } else {
        handleSearchSubmit();
      }
    } else if (e.key === "Escape") {
      setSuggestions([]);
      setFocusedIndex(-1);
    }
  };

  // Fetch weather and forecast data by coordinates
  const fetchWeatherData = async (lat, lon, cityName, countryCode, stateName) => {
    setLoading(true);
    setError("");
    setSuggestions([]);
    setQuery("");
    setFocusedIndex(-1);

    try {
      const [weatherRes, forecastRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`)
      ]);

      if (!weatherRes.ok || !forecastRes.ok) {
        throw new Error("Unable to retrieve weather data for this location ❌");
      }

      const weatherResult = await weatherRes.json();
      const forecastResult = await forecastRes.json();

      // Update background based on weather condition
      const condition = weatherResult.weather[0].main;
      if (BACKGROUNDS[condition]) {
        setBgImage(BACKGROUNDS[condition]);
      } else {
        setBgImage(BACKGROUNDS.Default);
      }

      // Parse 5-day daily forecast
      const dailyMap = {};
      forecastResult.list.forEach((item) => {
        const dateStr = item.dt_txt.split(" ")[0];
        if (!dailyMap[dateStr]) {
          dailyMap[dateStr] = [];
        }
        dailyMap[dateStr].push(item);
      });

      const parsedForecast = Object.keys(dailyMap).slice(0, 5).map((date) => {
        const dayItems = dailyMap[date];
        // Select midday reading (12:00:00) if available, otherwise middle item
        const representative = dayItems.find((item) => item.dt_txt.includes("12:00:00")) || dayItems[Math.floor(dayItems.length / 2)];

        let minTemp = dayItems[0].main.temp_min;
        let maxTemp = dayItems[0].main.temp_max;
        dayItems.forEach((item) => {
          if (item.main.temp_min < minTemp) minTemp = item.main.temp_min;
          if (item.main.temp_max > maxTemp) maxTemp = item.main.temp_max;
        });

        return {
          date,
          temp: representative.main.temp,
          minTemp,
          maxTemp,
          weather: representative.weather[0],
          dt: representative.dt,
        };
      });

      setWeatherData({
        ...weatherResult,
        displayName: cityName || weatherResult.name,
        displayCountry: countryCode || weatherResult.sys.country,
        displayState: stateName,
      });

      setForecastData(parsedForecast);
    } catch (err) {
      setError(err.message || "Failed to load weather. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Search submit (when user hits search icon/clicks Search/presses Enter with text)
  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    setLoading(true);
    setError("");
    setSuggestions([]);

    try {
      const geoRes = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cleanQuery)}&limit=1&appid=${API_KEY}`
      );
      if (!geoRes.ok) throw new Error("Could not find coordinates for city ❌");

      const geoData = await geoRes.json();
      if (!geoData || geoData.length === 0) {
        throw new Error("City not found. Try checking the spelling ❌");
      }

      const { lat, lon, name, country, state } = geoData[0];
      await fetchWeatherData(lat, lon, name, country, state);
    } catch (err) {
      setError(err.message || "Failed to find city weather.");
      setLoading(false);
    }
  };

  // Click autocomplete suggestion handler
  const selectSuggestion = (suggestion) => {
    const { lat, lon, name, country, state } = suggestion;
    fetchWeatherData(lat, lon, name, country, state);
  };

  // Get current location weather handler
  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser ❌");
      return;
    }

    setLoading(true);
    setError("");
    setSuggestions([]);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Reverse geocode location
          const revRes = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`
          );
          let cityName = "";
          let countryCode = "";
          let stateName = "";

          if (revRes.ok) {
            const revData = await revRes.json();
            if (revData && revData.length > 0) {
              cityName = revData[0].name;
              countryCode = revData[0].country;
              stateName = revData[0].state;
            }
          }
          await fetchWeatherData(latitude, longitude, cityName, countryCode, stateName);
        } catch (err) {
          // Graceful fallback to raw lat/lon details
          await fetchWeatherData(latitude, longitude);
        }
      },
      (err) => {
        let msg = "Unable to retrieve your location ❌";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location access denied. Please enable permission in your browser ❌";
        }
        setError(msg);
        setLoading(false);
      }
    );
  };

  // Convert Celsius value to Fahrenheit
  const formatTemp = (celsiusValue) => {
    if (isCelsius) {
      return `${Math.round(celsiusValue)}°C`;
    }
    return `${Math.round((celsiusValue * 9) / 5 + 32)}°F`;
  };

  // Format UNIX timestamp adjusted to city local time offset
  const getCityLocalTime = (offsetSeconds) => {
    const utcDate = new Date().getTime() + new Date().getTimezoneOffset() * 60000;
    const cityDate = new Date(utcDate + offsetSeconds * 1000);
    return cityDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getCityLocalDate = (offsetSeconds) => {
    const utcDate = new Date().getTime() + new Date().getTimezoneOffset() * 60000;
    const cityDate = new Date(utcDate + offsetSeconds * 1000);
    return cityDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  // Format sunrise / sunset timestamps with local city timezone offset
  const formatSunriseSunset = (timestamp, offsetSeconds) => {
    const date = new Date((timestamp + offsetSeconds) * 1000);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const hr = hours % 12 || 12;
    const min = minutes < 10 ? `0${minutes}` : minutes;
    return `${hr}:${min} ${ampm}`;
  };

  // Card details helper
  const getWindDirection = (deg) => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  const getWeatherIcon = (main, size = 48, className = "") => {
    switch (main) {
      case "Clear":
        return <Sun size={size} className={`text-amber-400 animate-spin-slow ${className}`} />;
      case "Clouds":
        return <Cloud size={size} className={`text-slate-300 animate-float ${className}`} />;
      case "Rain":
        return <CloudRain size={size} className={`text-sky-400 ${className}`} />;
      case "Drizzle":
        return <CloudDrizzle size={size} className={`text-sky-300 ${className}`} />;
      case "Thunderstorm":
        return <CloudLightning size={size} className={`text-violet-400 animate-pulse ${className}`} />;
      case "Snow":
        return <Snowflake size={size} className={`text-blue-100 animate-spin-slow ${className}`} />;
      case "Mist":
      case "Smoke":
      case "Haze":
      case "Dust":
      case "Fog":
      case "Sand":
      case "Ash":
      case "Squall":
      case "Tornado":
        return <Wind size={size} className={`text-teal-200 animate-pulse ${className}`} />;
      default:
        return <Sun size={size} className={`text-amber-400 ${className}`} />;
    }
  };

  // Weather Advice details
  // const getWeatherAdvice = (condition, temp) => {
  //   if (condition === "Clear") {
  //     if (temp > 28) return "Warm outside. Hydrate well & wear sunscreen! ☀️";
  //     if (temp < 10) return "Clear skies but cold. Bundle up! ❄️";
  //     return "Beautiful sunny weather. Perfect time for a walk! 😎";
  //   }
  //   if (condition === "Clouds") {
  //     return "Overcast today. Ideal for a warm coffee and relaxing walk. ☁️";
  //   }
  //   if (condition === "Rain" || condition === "Drizzle") {
  //     return "Rainy weather. Don't forget your umbrella today! ☔";
  //   }
  //   if (condition === "Thunderstorm") {
  //     return "Thunderstorms reported. Stay safely sheltered indoors! ⚡";
  //   }
  //   if (condition === "Snow") {
  //     return "Snowing landscape! Keep warm and watch out for icy steps. ❄️⛄";
  //   }
  //   if (condition === "Mist" || condition === "Fog" || condition === "Haze") {
  //     return "Mist outdoors. Low visibility; travel with caution. 🌫️";
  //   }
  //   return "Enjoy your day! Stay updated on local conditions. ✨";
  // };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden transition-all duration-700 bg-cover bg-center select-none"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px] transition-all duration-500"></div>

      {/* Main glassmorphism card container */}
      <div className="relative z-10 w-full max-w-4xl bg-slate-900/40 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-500 flex flex-col md:flex-row">
        
        {/* LEFT COLUMN: Main dashboard */}
        <div className="w-full md:w-5/12 bg-white/5 backdrop-blur-md p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10 text-white min-h-[380px] md:min-h-[500px]">
          {loading ? (
            // Dashboard Loading Skeleton
            <div className="space-y-6 animate-pulse h-full flex flex-col justify-between py-2">
              <div className="space-y-3">
                <div className="h-6 w-32 bg-white/10 rounded-lg animate-shimmer"></div>
                <div className="h-4 w-48 bg-white/10 rounded-lg animate-shimmer"></div>
              </div>
              <div className="flex flex-col items-center my-6 space-y-4">
                <div className="w-24 h-24 bg-white/10 rounded-full animate-shimmer"></div>
                <div className="h-14 w-28 bg-white/10 rounded-lg animate-shimmer"></div>
                <div className="h-4 w-36 bg-white/10 rounded-lg animate-shimmer"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-white/10 rounded-md animate-shimmer"></div>
                <div className="h-3 w-5/6 bg-white/10 rounded-md animate-shimmer"></div>
              </div>
            </div>
          ) : weatherData ? (
            // Dashboard content
            <div className="h-full flex flex-col justify-between space-y-6">
              {/* City + Date */}
              <div>
                <div className="flex items-start gap-2">
                  <MapPin size={22} className="text-rose-400 mt-1 shrink-0" />
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
                      {weatherData.displayName}
                    </h1>
                    <p className="text-sm text-white/70 font-medium mt-0.5">
                      {weatherData.displayState ? `${weatherData.displayState}, ` : ""}
                      {weatherData.displayCountry}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pl-7 text-xs sm:text-sm text-white/80 font-medium">
                  {getCityLocalDate(weatherData.timezone)} • {getCityLocalTime(weatherData.timezone)}
                </div>
              </div>

              {/* Main Temp & Condition */}
              <div className="flex flex-col items-center text-center my-4">
                <div className="mb-2">
                  {getWeatherIcon(weatherData.weather[0].main, 90, "drop-shadow-lg")}
                </div>
                
                <h2 className="text-6xl sm:text-7xl font-extrabold tracking-tighter text-white drop-shadow-md select-text">
                  {formatTemp(weatherData.main.temp)}
                </h2>

                <p className="text-lg sm:text-xl font-semibold capitalize mt-2 text-sky-200">
                  {weatherData.weather[0].description}
                </p>

                <div className="flex items-center gap-4 mt-2.5 text-sm text-white/80 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                  <span>Min: <strong>{formatTemp(weatherData.main.temp_min)}</strong></span>
                  <span className="w-[1px] h-3 bg-white/20"></span>
                  <span>Max: <strong>{formatTemp(weatherData.main.temp_max)}</strong></span>
                </div>
              </div>

              {/*  Weather Advice */}
              <div className="bg-transparnet border border-white/5 rounded-2xl p-4 text-xs sm:text-sm leading-relaxed text-white/90">
                {/* <span className="font-semibold text-rose-300 block mb-1">Friendly Note:</span>
                {getWeatherAdvice(weatherData.weather[0].main, weatherData.main.temp)} */}
              </div>
            </div>
          ) : null}
        </div>

        {/* RIGHT COLUMN: Search, Metrics & Forecast */}
        <div className="w-full md:w-7/12 p-6 sm:p-8 flex flex-col justify-between space-y-6 text-white bg-slate-950/20">
          
          {/* Header Action Row (Search box, Geolocation, Unit Toggle) */}
          <div className="flex items-center gap-3 relative z-30">
            {/* Search Input Box */}
            <form onSubmit={handleSearchSubmit} className="flex-1 relative" ref={dropdownRef}>
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Enter city..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-white/10 border border-white/10 rounded-2xl pl-11 pr-11 py-3 text-sm sm:text-base text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:bg-white/15 transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={handleGeolocation}
                  title="Use current location"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-rose-400 active:scale-95 transition-all duration-200"
                >
                  <MapPin size={18} />
                </button>
              </div>

              {/* Autocomplete Dropdown suggestions panel */}
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-white/5 max-h-[220px] overflow-y-auto">
                  {suggestions.map((item, index) => (
                    <button
                      key={`${item.lat}-${item.lon}`}
                      type="button"
                      onClick={() => selectSuggestion(item)}
                      onMouseEnter={() => setFocusedIndex(index)}
                      className={`w-full px-5 py-3 text-left text-sm text-white/95 flex items-center justify-between transition-colors duration-150 ${
                        index === focusedIndex ? "bg-white/10" : "hover:bg-white/5"
                      }`}
                    >
                      <div className="truncate">
                        <span className="font-semibold">{item.name}</span>
                        {item.state && (
                          <span className="text-white/60 text-xs ml-1.5">
                            ({item.state})
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] tracking-wide uppercase bg-white/15 px-2 py-0.5 rounded text-white/70 font-semibold border border-white/5 shrink-0">
                        {item.country}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* C/F Unit Toggle Button */}
            <button
              onClick={() => setIsCelsius(!isCelsius)}
              className="bg-white/10 hover:bg-white/20 active:scale-95 border border-white/10 px-3 py-3 rounded-2xl text-sm font-semibold tracking-wide transition-all shrink-0 cursor-pointer h-[46px] flex items-center justify-center min-w-[54px]"
            >
              {isCelsius ? "°F ⇄" : "°C ⇄"}
            </button>
          </div>

          {/* ERROR ALERT DISPLAY */}
          {error && (
            <div className="bg-rose-500/20 border border-rose-500/35 rounded-2xl p-4 flex items-center gap-3 text-rose-200 text-sm animate-pulse z-10">
              <AlertCircle size={20} className="shrink-0 text-rose-400" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* MAIN PARAMETERS GRID */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wider text-sky-200/90 uppercase pl-1">
              Weather Parameters
            </h3>

            {loading ? (
              // Parameters loading skeletons
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-4 animate-pulse h-24 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="w-12 h-3 bg-white/10 rounded animate-shimmer"></div>
                      <div className="w-6 h-6 bg-white/10 rounded-full animate-shimmer"></div>
                    </div>
                    <div className="w-20 h-6 bg-white/10 rounded-lg animate-shimmer"></div>
                  </div>
                ))}
              </div>
            ) : weatherData ? (
              // Parameters grids content
              <div className="grid grid-cols-2 gap-4">
                {/* Wind Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 flex flex-col justify-between group">
                  <div className="flex justify-between items-center text-white/60 text-xs font-semibold">
                    <span>WIND SPEED</span>
                    <Wind size={18} className="text-sky-300 group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                  <div className="mt-2.5">
                    <p className="text-lg sm:text-xl font-bold tracking-tight">
                      {Math.round(weatherData.wind.speed * 3.6)} km/h
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-white/50 font-medium mt-1">
                      <Navigation 
                        size={10} 
                        style={{ transform: `rotate(${weatherData.wind.deg}deg)` }} 
                        className="fill-sky-300 text-sky-300" 
                      />
                      <span>Direction: {getWindDirection(weatherData.wind.deg)} ({weatherData.wind.deg}°)</span>
                    </div>
                  </div>
                </div>

                {/* Humidity Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 flex flex-col justify-between group">
                  <div className="flex justify-between items-center text-white/60 text-xs font-semibold">
                    <span>HUMIDITY</span>
                    <Droplets size={18} className="text-blue-300 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="mt-2.5">
                    <p className="text-lg sm:text-xl font-bold tracking-tight">
                      {weatherData.main.humidity}%
                    </p>
                    <p className="text-[11px] text-white/50 font-medium mt-1">
                      {weatherData.main.humidity > 60 ? "Humid air" : weatherData.main.humidity < 30 ? "Dry air" : "Comfortable"}
                    </p>
                  </div>
                </div>

                {/* Feels Like Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 flex flex-col justify-between group">
                  <div className="flex justify-between items-center text-white/60 text-xs font-semibold">
                    <span>FEELS LIKE</span>
                    <Thermometer size={18} className="text-rose-300 group-hover:-translate-y-0.5 transition-transform duration-300" />
                  </div>
                  <div className="mt-2.5">
                    <p className="text-lg sm:text-xl font-bold tracking-tight">
                      {formatTemp(weatherData.main.feels_like)}
                    </p>
                    <p className="text-[11px] text-white/50 font-medium mt-1">
                      {Math.abs(weatherData.main.feels_like - weatherData.main.temp) < 1.5 
                        ? "Feels similar to actual temp" 
                        : weatherData.main.feels_like > weatherData.main.temp 
                          ? "Feels warmer than actual temp" 
                          : "Feels colder than actual temp"}
                    </p>
                  </div>
                </div>

                {/* Visibility/Pressure Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 flex flex-col justify-between group">
                  <div className="flex justify-between items-center text-white/60 text-xs font-semibold">
                    <span>VISIBILITY</span>
                    <Eye size={18} className="text-emerald-300 group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="mt-2.5">
                    <p className="text-lg sm:text-xl font-bold tracking-tight">
                      {(weatherData.visibility / 1000).toFixed(1)} km
                    </p>
                    <p className="text-[11px] text-white/50 font-medium mt-1">
                      {weatherData.visibility >= 10000 ? "Excellent clear view" : "Atmospheric haze"}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* SUNRISE / SUNSET BAR */}
          {weatherData && !loading && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-around text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <Sunrise size={20} className="text-amber-300 animate-pulse" />
                <div>
                  <span className="text-white/50 text-[10px] font-bold block uppercase tracking-wider">SUNRISE</span>
                  <span className="font-semibold text-white/90">
                    {formatSunriseSunset(weatherData.sys.sunrise, weatherData.timezone)}
                  </span>
                </div>
              </div>
              <div className="w-[1px] h-8 bg-white/15"></div>
              <div className="flex items-center gap-3">
                <Sunset size={20} className="text-orange-400 animate-pulse" />
                <div>
                  <span className="text-white/50 text-[10px] font-bold block uppercase tracking-wider">SUNSET</span>
                  <span className="font-semibold text-white/90">
                    {formatSunriseSunset(weatherData.sys.sunset, weatherData.timezone)}
                  </span>
                </div>
              </div>
              <div className="w-[1px] h-8 bg-white/15"></div>
              <div className="flex items-center gap-3">
                <Gauge size={20} className="text-teal-300" />
                <div>
                  <span className="text-white/50 text-[10px] font-bold block uppercase tracking-wider">PRESSURE</span>
                  <span className="font-semibold text-white/90">
                    {weatherData.main.pressure} hPa
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 5-DAY FORECAST SECTION */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wider text-sky-200/90 uppercase pl-1">
              5-Day Forecast
            </h3>

            {loading ? (
              // Forecast loading skeletons
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-3 animate-pulse text-center h-28 space-y-3 flex flex-col justify-between">
                    <div className="w-10 h-3 bg-white/10 rounded mx-auto animate-shimmer"></div>
                    <div className="w-8 h-8 bg-white/10 rounded-full mx-auto animate-shimmer"></div>
                    <div className="w-12 h-3 bg-white/10 rounded mx-auto animate-shimmer"></div>
                  </div>
                ))}
              </div>
            ) : forecastData.length > 0 ? (
              // Forecast content
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {forecastData.map((day) => {
                  const dayName = new Date(day.date).toLocaleDateString("en-US", { weekday: "short" });
                  return (
                    <div 
                      key={day.dt}
                      className="bg-white/5 border border-white/10 rounded-2xl p-2 sm:p-3 hover:bg-white/10 transition-all duration-300 text-center flex flex-col justify-between items-center group cursor-default"
                    >
                      {/* Day Label */}
                      <span className="text-xs text-white/60 font-semibold tracking-wider uppercase group-hover:text-white transition-colors">
                        {dayName}
                      </span>
                      {/* Icon */}
                      <div className="my-1.5 group-hover:scale-110 transition-transform duration-300">
                        {getWeatherIcon(day.weather.main, 24)}
                      </div>
                      {/* Temp Min/Max */}
                      <div className="flex flex-col text-[10px] sm:text-xs">
                        <span className="font-bold text-white">
                          {formatTemp(day.maxTemp).replace(/[CF]/g, "")}
                        </span>
                        <span className="text-white/40 font-medium">
                          {formatTemp(day.minTemp).replace(/[CF]/g, "")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

        </div>

      </div>
    </div>
  );
}