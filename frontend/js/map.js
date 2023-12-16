function init() {
  initMap(
    document.getElementById("map1"),
    document.getElementById("pac-input-1"),
    document.getElementById("lat1"),
    document.getElementById("lng1"),
    document.getElementById("address1")
  );

  initMap(
    document.getElementById("map2"),
    document.getElementById("pac-input-2"),
    document.getElementById("lat2"),
    document.getElementById("lng2"),
    document.getElementById("address2")
  );
}

function initMap(mapContainer, searchInput, latInput, lngInput, addressInput) {
  const location = { lat: 37.9887848, lng: 23.7590584 };

  const map = new google.maps.Map(mapContainer, {
    center: location,
    zoom: 16,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  });

  const infoWindow = new google.maps.InfoWindow();

  const marker = new google.maps.Marker({
    position: location,
    map: map,
    icon: "https://img.icons8.com/glyph-neue/30/000000/user-location.png",
  });

  const geocoder = new google.maps.Geocoder();

  map.addListener("click", (e) => {
    marker.setPosition(e.latLng);
    map.panTo(marker.position);

    latInput.value = marker.getPosition().lat();
    lngInput.value = marker.getPosition().lng();

    geocoder.geocode({ location: e.latLng }).then((response) => {
      if (response.results[0]) {
        let address = `${response.results[0].address_components[1].long_name} ${response.results[0].address_components[0].long_name}`;
        addressInput.value = address;
        infoWindow.setContent(`<strong>${address}</strong>`);
        infoWindow.open(map, marker);
      }
    });
  });

  const options = {
    fields: ["name", "geometry"],
    strictBounds: false,
    types: ["address"],
  };

  const autocomplete = new google.maps.places.Autocomplete(
    searchInput,
    options
  );

  // Places the search field at the top left of the map.
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(searchInput);

  // Bias the search results towards current map's viewport.
  map.addListener("bounds_changed", () => {
    autocomplete.setBounds(map.getBounds());
  });

  // Listen for the event fired when the user selects a prediction.
  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();

    if (!place.geometry?.location) {
      return;
    }

    marker.setPosition(place.geometry.location);
    map.panTo(marker.position);

    latInput.value = marker.getPosition().lat();
    lngInput.value = marker.getPosition().lng();

    let address = place.name || "";
    addressInput.value = address;
    infoWindow.setContent(`<strong>${address}</strong>`);
    infoWindow.open(map, marker);
  });
}
