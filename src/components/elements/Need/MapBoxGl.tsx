import React, { useEffect, useState } from "react";
import ReactMapGL, { Marker } from "react-map-gl";
import axios from "axios";

type LocationData = {
  ip: string;
  lat: number;
  lon: number;
  city: string;
  regionName: string;
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? ''

// Get user's IP address
async function getUserIP() {
  const response = await axios.get("https://api.ipify.org?format=json");
  return response.data.ip;
}

// Get location data based on IP address
async function getLocationData(ip: string) {
    console.log(ip)
  const response = await axios.get<LocationData>(
    `https://ip-api.com/json/${ip}`
  );
  console.log(response.data)
  return response.data;
}

const MapBoxGl: React.FC = () => {
  const [viewport, setViewport] = useState({
    width: "100%",
    height: "400px",
    latitude: 0,
    longitude: 0,
    zoom: 10
  });

  const [location, setLocation] = useState<LocationData | null>(null);

  useEffect(() => {
    // Fetch user's IP address and location data
    async function fetchData() {
      try {
        const ip = await getUserIP();
        const locationData = await getLocationData(ip);
        setLocation(locationData);

        const { lat, lon } = locationData;
        // Update viewport to center on user's location
        setViewport(prevViewport => ({
          ...prevViewport,
          latitude: lat,
          longitude: lon
        }));
      } catch (error) {
        console.error("Error fetching IP or location data:", error);
      }
    }

    fetchData();
  }, []);

  return (
    <ReactMapGL
      {...viewport}
      mapboxAccessToken={MAPBOX_TOKEN}
      onMove={({ viewState }) => setViewport((current) => ({ ...current, ...viewState }))}
    >
      {location && (
        <Marker
          latitude={location.lat}
          longitude={location.lon}
          offset={[-20, -10]}
        >
          <div>Marker Content</div>
        </Marker>
      )}
    </ReactMapGL>
  );
};

export default MapBoxGl;
