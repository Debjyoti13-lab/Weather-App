// Api key for access weather from openweather
const API_KEY = "04745a75de60a030b1d53ce118e9221c";

// DOM elements for weather tabs, containers, and form inputs
const userTab = document.querySelector("[data-userWeather]");
const searchTab = document.querySelector("[data-searchWeather]");
const userContainer = document.querySelector(".weather-container");
const grantAccessContainer = document.querySelector(".grant-location-container");
const searchForm = document.querySelector("[data-searchForm]");
const loadingScreen = document.querySelector(".loading-container");
const userInfoContainer = document.querySelector(".user-info-container");

// initizing the current tab as usertab
let currentTab = userTab;
currentTab.classList.add("current-tab");
getFromSession();// get weather info session weather storage

// function switch between two tabs 
function switchTab(clickTab) {
    if (clickTab != currentTab) {
        currentTab.classList.remove("current-tab");// remove active class from currentab
        currentTab = clickTab;// set as current tab
        currentTab.classList.add("current-tab");//set new tab active

        document.querySelector(".forecast-container").classList.remove("active");

        const errorContainer = document.querySelector(".api-error-container");
        errorContainer.classList.remove("active");

       // toggle visibility of container which container should be shown or not
        if (!searchForm.classList.contains("active")) {
            userInfoContainer.classList.remove("active");
            grantAccessContainer.classList.remove("active");
            searchForm.classList.add("active");
        } else {
            searchForm.classList.remove("active");
            userInfoContainer.classList.remove("active");
            //Load session weather if exists 
            getFromSession();
        }
    }
}


// adding eventlisteners for usertab
userTab.addEventListener("click", () => {
    switchTab(userTab);
});
//  for searchTab 
searchTab.addEventListener("click", () => {
    switchTab(searchTab);
});

// function fetch weather information user coordinats 
function getFromSession() {
    const localCoordinates = sessionStorage.getItem("user-coordinates");
    if (!localCoordinates) {
        grantAccessContainer.classList.add("active");
    } else {
        const coordinates = JSON.parse(localCoordinates);
        fetchUserInfo(coordinates); // fetching userinfo
    }
}

async function fetchUserInfo(coordinates) {
    const { lat, lon } = coordinates;// Extract latitude and longitude
    grantAccessContainer.classList.remove("active");// hide user grantaccess-container 
    loadingScreen.classList.add("active"); // showing loading screen while retriveing data

    try {
        const resp = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        const result = await resp.json();  // the response to JSON
        loadingScreen.classList.remove("active"); // hide loading screen 
        userInfoContainer.classList.add("active");// show weather info container
        renderWeather(result); // render weather data

        // Fetch and render the 5-day forecast
        fetchForecast(coordinates);
    } catch (err) {
        // Error handling 
        console.error("Error fetching user info:", err);
    }
}

// funcition to display render weather from data
function renderWeather(data) {
    const cityName = document.querySelector("[data-cityName]");
    const countryIcon = document.querySelector("[data-countryIcon]");
    const desc = document.querySelector("[data-weatherDesc]");
    const weatherIcon = document.querySelector("[data-weatherIcon]");
    const temp = document.querySelector("[data-temp]");
    const windSpeed = document.querySelector("[data-windspeed]");
    const humidity = document.querySelector("[data-humidity]");
    const cloudiness = document.querySelector("[data-cloudiness]");
// undate html with weather data
    cityName.innerText = data?.name;
    countryIcon.src = `https://flagcdn.com/144x108/${data?.sys?.country.toLowerCase()}.png`;
    desc.innerText = data?.weather?.[0]?.description;
    weatherIcon.src = `http://openweathermap.org/img/w/${data?.weather?.[0]?.icon}.png`;
    temp.innerText = `${data?.main?.temp} °C`;
    windSpeed.innerText = `${data?.wind?.speed} m/s`;
    humidity.innerText = `${data?.main?.humidity} %`;
    cloudiness.innerText = `${data?.clouds?.all} %`;
}

// this api calling for 5days forcast 
async function fetchForecast(coordinates) {
    const { lat, lon } = coordinates;
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        const data = await response.json();
        renderForecast(data);
    } catch (err) {
        console.error("Error fetching forecast:", err);
    }
}

// function render the 5days forecast 
function renderForecast(data) {
    const forecastContainer = document.querySelector(".forecast-container");
    const forecastCards = document.querySelector("[data-forecastCards]");
    forecastCards.innerHTML = ""; // Clear previous forecast cards

    // Group forecast data by day
    const dailyForecasts = {};
    data.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        if (!dailyForecasts[date]) {
            dailyForecasts[date] = item;
        }
    });

    // Create a card for each day
    Object.values(dailyForecasts).forEach(forecast => {
        const card = document.createElement("div");
        card.classList.add("forecast-card");

        const date = new Date(forecast.dt_txt).toLocaleDateString();
        const icon = forecast.weather[0].icon;
        const temp = forecast.main.temp;
        const description = forecast.weather[0].description;

        card.innerHTML = `
            <p>${date}</p>
            <img src="http://openweathermap.org/img/w/${icon}.png" alt="${description}">
            <p>${temp} °C</p>
            <p>${description}</p>
        `;

        forecastCards.appendChild(card); // append cards into forest cards 
    });

    forecastContainer.classList.add("active"); // show forcast container
}
// grant Access Button click listener to requst data
const grantAccessButton = document.querySelector("[data-grantAccess]");
// function showposition using geolocation api
function getlocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showposition);
    } else {
        console.log("Your browser doesn't support geolocation.");
    }
}
// showposition using handle for location retrival
function showposition(position) {
    const userCoordinates = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
    };
    //store coordinates in session
    sessionStorage.setItem("user-coordinates", JSON.stringify(userCoordinates));
    fetchUserInfo(userCoordinates);// fetch weather info on coordinates
}

grantAccessButton.addEventListener("click", getlocation);
// taking input search input as city
const searchInput = document.querySelector("[data-searchInput]");

searchForm.addEventListener("submit", (e) => {
    e.preventDefault();// prevent page reload on form submission
    let cityName = searchInput.value;

    if (cityName === "") {
        return;
    } else {
        fetchCityNameInfo(cityName);
    }
});
// function to fetch weather info for city name
async function fetchCityNameInfo(city) {
    loadingScreen.classList.add("active");
    userInfoContainer.classList.remove("active");
    grantAccessContainer.classList.remove("active");

    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
        const data = await res.json();
        loadingScreen.classList.remove("active");
        userInfoContainer.classList.add("active");
        // rendering data
        renderWeather(data);

        // Fetch and render the 5-day forecast
        const coordinates = { lat: data.coord.lat, lon: data.coord.lon };
        fetchForecast(coordinates);
    } catch (err) {
        console.error("Error fetching city info:", err);
        
    }
}

const dropdown = document.querySelector("[data-dropdown]");
const dropdownList = document.querySelector("[data-dropdownList]");
const searchInput2 = document.querySelector("[data-searchInput]");

// Function to add a city to the recently searched list
function addToRecentSearches(city) {
    let recentSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];
    if (!recentSearches.includes(city)) {
        recentSearches.unshift(city); // Add to the beginning of the array
        if (recentSearches.length > 5) {
            recentSearches.pop(); // Keep only the last 5 searches
        }
        localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
    }
}

// Function to populate the dropdown with recently searched cities
function populateDropdown() {
    const recentSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];
    dropdownList.innerHTML = ""; // Clear the dropdown list

    if (recentSearches.length > 0) {
        recentSearches.forEach(city => {
            const li = document.createElement("li");
            li.textContent = city;
            li.addEventListener("click", () => {
                searchInput2.value = city;
                //fetch weather data for selected city
                fetchCityNameInfo(city);
                dropdown.classList.remove("active");
            });
            dropdownList.appendChild(li);
        });
        dropdown.classList.add("active");
    } else {
        dropdown.classList.remove("active");
    }
}

// Show dropdown when input is focused
searchInput2.addEventListener("focus", () => {
    //populate the dropdown menu
    populateDropdown();
});

// Hide dropdown when clicking outside
document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && e.target !== searchInput2) {
        dropdown.classList.remove("active");
    }
});

// Update the fetchCityNameInfo function to add the city to recent searches
async function fetchCityNameInfo(city) {
    loadingScreen.classList.add("active");
    userInfoContainer.classList.remove("active");
    grantAccessContainer.classList.remove("active");

    const errorContainer = document.querySelector(".api-error-container");
    const errorText = document.querySelector("[data-apiErrorText]");
    const notFoundImg = document.querySelector("[data-notFoundImg]");

    const forecastContainer = document.querySelector(".forecast-container");
    const forecastCards = document.querySelector("[data-forecastCards]");


    errorContainer.classList.remove("active");
    userInfoContainer.classList.remove("active");
    forecastContainer.classList.remove("active");
    forecastCards.innerHTML = "";


    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
        const data = await res.json();
        loadingScreen.classList.remove("active");

        if (data.cod === "404") {
            // Show error container with image and text
            errorText.innerText = "City not found. Please enter a valid city.";
            errorContainer.classList.add("active");
           
            return;
        }
        errorContainer.classList.remove("active");
        userInfoContainer.classList.add("active");
        renderWeather(data);

        // Add the city to recent searches
        addToRecentSearches(city);
        populateDropdown();

        // Fetch and render the 5-day forecast
        const coordinates = { lat: data.coord.lat, lon: data.coord.lon };
        fetchForecast(coordinates);
    } catch (err) {
        console.error("Error fetching city info:", err);
    }
}


