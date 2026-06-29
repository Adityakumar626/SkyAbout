import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Image,
  ImageBackground,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiCall, foreCastCall } from "../../api/weather";
import { theme, weatherImages } from "../../constants/theme";
import useDebouncedCallback from "../../hooks/Debounce";

type weatherLocation = {
  name: string;
  country: string;
  temp: number;
  humidity: number;
  wind: number;
  sunrise: number;
  weatherImage: string;
  description: string;
};

type Forecast = {
  dt: number;
  main: {
    temp: number;
  };
  weather: {
    main: string;
    description: string;
    icon: string;
  }[];
};

export default function Index() {
  const [showSearch, setShowSearch] = useState(false);
  const [locations, setLocations] = useState<weatherLocation[]>([]);
  const [selectedLocation, setSelectedLocation] =
    useState<weatherLocation | null>(null);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (selectedLocation?.name) {
        await handleSearch(selectedLocation.name);
      } else {
        await fetchMyWeatherData();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const dailyForecasts = forecasts.filter((item, index) => index % 8 === 0);

  const handleLocation = (loc: weatherLocation) => {
    console.log("location: ", loc);
    setShowSearch(false);
    setSelectedLocation(loc);
  };

  const handleSearch = async (value: string) => {
    if (value.length > 2) {
      const data = await apiCall(value);
      const foreData = await foreCastCall(value);
      setLocations([
        {
          name: data.name,
          country: data.sys.country,
          temp: data.main.temp,
          humidity: data.main.humidity,
          wind: data.wind.speed,
          sunrise: data.sys.sunrise,
          weatherImage: data.weather[0].main.toLowerCase(),
          description: data.weather[0].description,
        },
      ]);
      setForecasts(foreData.list);
    }
  };

  const handleTextDebounce = useDebouncedCallback(handleSearch, 800);

  const img = {
    uri: "https://images.unsplash.com/photo-1782296862749-1e1b6ef35f0e?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwzfHx8ZW58MHx8fHx8",
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        console.log("Permission denied");
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return location.coords;
    } catch (error) {
      console.log("Location error:", error);
      return null;
    }
  };

  const getCityFromCoords = async (lat: number, lon: number) => {
    const geo = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lon,
    });

    const place = geo[0];

    return place?.city || place?.region || place?.district || "Delhi";
  };

  useEffect(() => {
    (async () => {
      await fetchMyWeatherData();
    })();
  }, []);

  const fetchMyWeatherData = async () => {
    try {
      const coords = await getUserLocation();

      let city = "London";

      if (coords) {
        city = await getCityFromCoords(coords.latitude, coords.longitude);
      }

      const data = await apiCall(city);
      const foreData = await foreCastCall(city);

      const locationObj = {
        name: data.name,
        country: data.sys.country,
        temp: data.main.temp,
        humidity: data.main.humidity,
        wind: data.wind.speed,
        sunrise: data.sys.sunrise,
        weatherImage: data.weather[0].main.toLowerCase(),
        description: data.weather[0].description,
      };

      setSelectedLocation(locationObj);
      setForecasts(foreData.list);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View className="flex-1 relative">
      <StatusBar style="light" />
      <ImageBackground
        blurRadius={20}
        className="flex-1 justify-center items-center"
        source={img}
      >
        <SafeAreaView className="flex-1">
          {/* Search Section  */}
          <View className="mx-8 mt-4">
            <View
              style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
              className="flex-row items-center rounded-full px-4 h-16 w-96"
            >
              {showSearch ? (
                <TextInput
                  onChangeText={handleTextDebounce}
                  style={{ color: "white", fontSize: 16, flex: 1 }}
                  placeholder="Search City"
                  placeholderTextColor="#d1d5db"
                />
              ) : null}

              <TouchableOpacity
                onPress={() => setShowSearch(!showSearch)}
                style={{ backgroundColor: theme.bgWhite(0.3) }}
                className="rounded-full m-1 p-3"
              >
                <Ionicons name="search" style={{ color: "white" }} />
              </TouchableOpacity>
            </View>
            <View>
              {locations.length > 0 && showSearch ? (
                <View className="absolute w-full bg-gray-300 top-3 z-10 rounded-3xl">
                  {/* Context Search Result */}
                  {locations.map((loc, index) => {
                    // @ts-ignore
                    let showBorder = index + 1 != locations.length;
                    let borderClass = showBorder
                      ? "border-b-2 border-b-gray-400"
                      : "";
                    return (
                      <TouchableOpacity
                        onPress={() => {
                          handleLocation(loc);
                        }}
                        key={index}
                        className={
                          "flex-row items-center p-3 px-4 mb-1 border-0" +
                          borderClass
                        }
                      >
                        <Ionicons
                          name="location-sharp"
                          style={{ fontSize: 16 }}
                        />
                        <Text className="text-black text-lg ml-2 ">
                          {loc?.name}, {loc?.country}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}
            </View>
          </View>

          {/* Forecast Section  */}
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View className="mx-4 flex justify-around flex-1 mb-2">
              {/* location */}
              <Text className="text-white text-center text-2xl font-bold">
                {selectedLocation?.name ?? "London"},
                <Text className="text-lg font-semibold text-gray-200">
                  {selectedLocation?.country ?? "United Kingdom"}
                </Text>
              </Text>

              {/* Weather Image */}
              <View className="flex-row justify-center">
                <Image
                  source={
                    weatherImages[
                      (selectedLocation?.weatherImage as keyof typeof weatherImages) ??
                        "clear"
                    ]
                  }
                  className="w-44 h-44"
                />
              </View>

              {/* Degree celsius */}
              <View>
                <Text className="text-center font-bold text-white text-7xl ml-5">
                  {Math.floor(selectedLocation?.temp ?? 23)}&#176;
                </Text>
                <Text className="text-center text-white text-xl font-semibold tracking-widest">
                  {selectedLocation?.description.toUpperCase() ??
                    "Partly Cloud"}
                </Text>
              </View>

              {/* Other stats */}
              <View className="flex-row justify-between mx-4">
                <View className="flex-row space-x-2 items-center">
                  <Image
                    source={require("../../assets/icons/wind.png")}
                    className="w-6 h-6"
                  />
                  <Text className="text-white font-semibold text-base ml-2">
                    {Math.floor((selectedLocation?.wind ?? 12) * 3.6)}Km
                  </Text>
                </View>
                <View className="flex-row space-x-2 items-center">
                  <Image
                    source={require("../../assets/icons/drop.png")}
                    className="w-6 h-6"
                  />
                  <Text className="text-white font-semibold text-base ml-2">
                    {selectedLocation?.humidity ?? "50"}%
                  </Text>
                </View>
                <View className="flex-row space-x-2 items-center">
                  <Image
                    source={require("../../assets/icons/sun.png")}
                    className="w-6 h-6"
                  />
                  <Text className="text-white font-semibold text-base ml-2">
                    {new Date(
                      (selectedLocation?.sunrise ?? 0) * 1000,
                    ).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}{" "}
                  </Text>
                </View>
              </View>

              {/* upcoming forecaasts */}
              <View className="mb-2 space-y-3">
                <View className="flex-row items-center mx-5 my-4 space-x-2">
                  <Ionicons
                    name="calendar"
                    style={{ color: "white", fontSize: 20 }}
                  />
                  <Text className="text-white text-base ml-2">
                    Daily Forecast
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  contentContainerStyle={{ paddingHorizontal: 15 }}
                  showsHorizontalScrollIndicator={false}
                >
                  {dailyForecasts.map((item) => {
                    return (
                      <View
                        key={item.dt}
                        style={{ backgroundColor: theme.bgWhite(0.15) }}
                        className="flex justify-center items-center w-24 rounded-3xl py-2 space-y-1 mr-4"
                      >
                        <Image
                          className="w-10 h-10"
                          source={
                            weatherImages[
                              item.weather?.[0]?.main?.toLowerCase() as keyof typeof weatherImages
                            ] ?? weatherImages.clouds
                          }
                        />

                        <Text className="text-gray-100">
                          {new Date(item.dt * 1000).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                            },
                          )}
                        </Text>

                        <Text className="text-white">
                          {Math.floor(item.main.temp)}&#176;
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}
