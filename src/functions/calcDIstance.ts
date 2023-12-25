
// In this function, used Haversine formula to calculate the distance between two points by latitude and longitude
export function haversineFun(
  userLocation: Record<string, number | any>,
  clientLocation: Record<string, number | any>
) {
  // Function to convert degrees to radians
  const { latitude: latitude1, longitude: longitude1 } = userLocation
  const { latitude: latitude2, longitude: longitude2 } = clientLocation
  function toRadians(degrees) {
    return (degrees * Math.PI) / 180
  }

  // Radius of the Earth in kilometers
  var R = 6371

  // Convert latitudes and longitudes from degrees to radians
  var lat1_rad = toRadians(latitude1)
  var lat2_rad = toRadians(latitude2)
  var delta_lat = toRadians(latitude2 - latitude1)
  var delta_lon = toRadians(longitude2 - longitude1)

  // Haversine formula
  var a =
    Math.sin(delta_lat / 2) * Math.sin(delta_lat / 2) +
    Math.cos(lat1_rad) *
      Math.cos(lat2_rad) *
      Math.sin(delta_lon / 2) *
      Math.sin(delta_lon / 2)

    
      console.log('userLocation: ', a)
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      console.log('clientLocation: ', c)
  var distance = R * c // Distance in kilometers

  return distance
}
