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

const MAPBOX_TOKEN = 'pk.eyJ1IjoicmVkMzAxMSIsImEiOiJjbGdjOXp0enAwOXZ5M2hzeGl6ank5Y29yIn0.NaiYYAmHiHFDJ6SRcqrmkg'

// Get user's IP address
async function getUserIP() {
  const response = await axios.get("https://api.ipify.org?format=json");
  return response.data.ip;
}

// Get location data based on IP address
async function getLocationData(ip: string) {
    console.log(ip)
  const response = await axios.get<LocationData>(
    `http://ip-api.com/json/${ip}`
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
      mapboxApiAccessToken={MAPBOX_TOKEN}
      onViewportChange={setViewport}
    >
      {location && (
        <Marker
          latitude={location.lat}
          longitude={location.lon}
          offsetLeft={-20}
          offsetTop={-10}
        >
          <div>Marker Content</div>
        </Marker>
      )}
    </ReactMapGL>
  );
};

export default MapBoxGl;
