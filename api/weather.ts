import axios from "axios";

const apiUrl =
  "https://api.openweathermap.org/data/2.5/weather?&units=metric&appid=";

const foreUrl = "https://api.openweathermap.org/data/2.5/forecast";

const apiKey = process.env.EXPO_PUBLIC_API_URL;

// const forecastEndpoint =
// const locationEndpoint =

export const apiCall = async (city: string) => {
  try {
    const response = await axios.get(`${apiUrl}${apiKey}&q=${city}`);
    // console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

export const foreCastCall = async (city: string) => {
  try {
    const response = await axios.get(foreUrl, {
      params: {
        q: city,
        cnt: 40,
        units: "metric",
        appid: apiKey,
      },
    });
    // console.log(response.data.list[0].weather);
    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};
