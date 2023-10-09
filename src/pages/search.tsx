import BasicLayout from '@layouts/BasicLayout'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import { NextApiRequest } from 'next'
import { getSession } from 'next-auth/react'
import { useState } from 'react'
import Search from '@mui/icons-material/Search'
import {
  Box,
  IconButton,
} from '@mui/material'
import Image from 'next/image'
import { language } from "../jotai"
import languagejson from "../language.json"
import { useAtom } from 'jotai'
import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { useRouter } from 'next/router'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import 'react-swipeable-list/dist/styles.css';
import ShowLists from "components/elements/Search/ShowLists";


mapboxgl.accessToken = "pk.eyJ1IjoicmVkMzAxMSIsImEiOiJjbGdjOXp0enAwOXZ5M2hzeGl6ank5Y29yIn0.NaiYYAmHiHFDJ6SRcqrmkg";

export default function Home() {
  const [lang, setLanguage] = useAtom(language)
  const [value, setValue] = useState(0)

  const mapContainer = useRef(null);
  const [map, setMap] = useState(null);
  const [center, setCenter] = useState({ lng: null, lat: null });
  const [zoom, setZoom] = useState(6);
  const [title, setTitle] = useState<String | null>("");
  const [location, setLocation] = useState<String | null>("");
  const [lists, setLists] = useState([]);

  const router = useRouter();

  useEffect(() => {

    if (center.lng == null || center.lat == null) return;

    const initializeMap = () => {

      const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [center.lng, center.lat],
        zoom: zoom,
      });

      setMap(map);
    };

    if (map == null) {
      initializeMap();
    }
  }, [center]);

  // useEffect(() => {

  //   if (center.lng == null || center.lat == null) return;


  //   if (map.current) return; // initialize map only once

  //   map.current = new mapboxgl.Map({
  //     container: mapContainer.current,
  //     style: 'mapbox://styles/mapbox/streets-v12',
  //     center: [center.lng, center.lat],
  //     zoom: zoom
  //   });

  // },[center]);

  useEffect(() => {

    const getCountry = async () => {
      const response = await fetch(`https://ipapi.co/json`)
      const countryCode = await response.json();

      setCenter({ lng: countryCode.longitude, lat: countryCode.latitude })
    }
    getCountry()

  }, [])

  useEffect(() => {
    const elements = document.getElementsByClassName('mapboxgl-control-container');
    if (elements.length > 0) {
      elements[0].remove();
    }
  })

  const handleClose = () => {
    router.back()
  }

  const handleChange = (
    event: React.SyntheticEvent | Event,
    newValue: number
  ) => {
    setValue(newValue)
  }

  const searchValue = (value: any) => {
    if (value == "") return;
    setLocation(value);
    // Use Mapbox Geocoding API to search for location
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${value}.json?access_token=${mapboxgl.accessToken}`
    )
      .then((response) => response.json())
      .then((data) => {

        const [longitude, latitude] = data.features[0].center;

        if (map != null) {
          map.flyTo({
            center: [longitude, latitude],
            zoom: zoom,
          });
        }
      });
  }

  const setOption = async () => {
    setTitle("");
    setLocation("");
    getOptionResult();
  }

  const getOptionResult = async () => {
    const response = await fetch("/api/can/getResults", {
      method: "POST",
      body: JSON.stringify({
        title: title,
        location: location,
      })
    });
    const results = await response.json();
    if (results.message === "Success") {
      setLists(results.results)
    }
  }

  return (
    <BasicLayout title={languagejson[lang].NEED}>
      <div className="page">
        <div className="search">
          <div className="header">
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end'
              }}
            >
              <IconButton
                size="large"
                edge="end"
                aria-label="menu"
                onClick={handleClose}>
                <ArrowBackIcon />
              </IconButton>
            </Box>
          </div>
          <div className="main">
            <TextField
              sx={{
                width: '100%',
              }}
              variant="outlined"
              label={languagejson[lang].whatYouAreLookingFor}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label={languagejson[lang].Where}
              sx={{
                width: '100%',
                marginTop: '20px',
              }}
              variant="outlined"
              value={location}
              onChange={(e) => searchValue(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Image
                      src="/images/global.svg"
                      width={24}
                      height={24}
                      alt=""
                    />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Image
                      src="/images/marker.png"
                      width={32}
                      height={32}
                      alt=""
                    />
                  </InputAdornment>
                ),
              }}
            />
            <div className="maps">
              <div id="map" style={{ height: '300px' }} />
            </div>

            <div className="actions">
              {/* <Button
                color="error"
                variant="outlined"
                startIcon={<Star color="success" />}>
                {languagejson[lang].SAVERESULT}
              </Button>
              <Button
                color="error"
                variant="outlined"
                startIcon={
                  <Share
                    sx={{
                      color: 'black',
                    }}
                  />
                }>
                {languagejson[lang].SHARERESULT}
              </Button> */}
              <Button
                color="error"
                variant="contained"
                onClick={setOption}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                onClick={getOptionResult}
              >
                SEARCH
              </Button>
            </div>
            <div className='showlists'>
              <ShowLists lists={lists} />
            </div>
          </div>
        </div>
      </div>
    </BasicLayout>
  )
}

export async function getServerSideProps({ req }: { req: NextApiRequest }) {
  const session = await getSession({
    req,
  })

  if (!session) {
    return {
      redirect: {
        destination: '/signin',
        permanent: false,
      },
    }
  }

  return {
    props: {
      session,
    },
  }
}
