
// In this function, used Haversine formula to calculate the distance between two points by latitude and longitude
function haversine(
  userLocation: Record<string, number | any>,
  clientLocation: Record<string, number | any>
) {
  // Function to convert degrees to radians
  const { lat1, lon1 } = userLocation
  const { lat2, lon2 } = clientLocation
  function toRadians(degrees) {
    return (degrees * Math.PI) / 180
  }

  // Radius of the Earth in kilometers
  var R = 6371

  // Convert latitudes and longitudes from degrees to radians
  var lat1_rad = toRadians(lat1)
  var lat2_rad = toRadians(lat2)
  var delta_lat = toRadians(lat2 - lat1)
  var delta_lon = toRadians(lon2 - lon1)

  // Haversine formula
  var a =
    Math.sin(delta_lat / 2) * Math.sin(delta_lat / 2) +
    Math.cos(lat1_rad) *
      Math.cos(lat2_rad) *
      Math.sin(delta_lon / 2) *
      Math.sin(delta_lon / 2)
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  var distance = R * c // Distance in kilometers

  return distance
}
