const googleMap = googleMap || {};
let venueInfoWindow;

googleMap.markers = [];



googleMap.getUsers = function () {
  $.get("http://localhost:8000/users")
  .done(

    this.loopThroughtUsers);

};

googleMap.addInfoWindowForUser = function (user, marker) {
  google.maps.event.addListener(marker, 'click', () => {

    if (this.infowindow) {
      this.infowindow.close();
    }
    this.infowindow = new google.maps.InfoWindow({


      content: `
      <h4>${user.fullname}</h4>
      <p><b>Location: </b>${user.postcode}</p>

      <p><img src="${user.image}" class="img-circle img-container" alt="Image Coming"></p>

      <b>Phone:</b><p>${user.phoneNumber}</p>
      <p><b>Willing to travel</b>: ${user.travelDistance} miles</p>
      <p><b>Typical availability</b>: ${user.availability}</p>
      <p><b>Skill Level</b>: ${user.skillLevel}</p>
      <a href="mailto:${user.email}"><button class="btn btn-info">Email</button></a>
      `
    });
    this.infowindow.open(this.map, marker);
  });
};

googleMap.mapSetup = function () {
  let canvas = document.getElementById("all-map");

  let latLng= {lat:51.5,
    lng:-0.08};

    let mapOptions = {
      zoom: 14,
      center: new google.maps.LatLng(51.5, -0.08),
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      scrollwheel: false,
      styles: [{"stylers":[{"hue":"#007fff"},{"saturation":89}]},{"featureType":"water","stylers":[{"color":"#ffffff"}]},{"featureType":"administrative.country","elementType":"labels","stylers":[{"visibility":"off"}]}]
    };
    this.map = new google.maps.Map(canvas, mapOptions);
    this.getUsers();
    getVenues(latLng);

    this.map.addListener('idle', function() {
      // 3 seconds after the center of the map has changed search for places again.
      window.setTimeout(function() {
        let newLocation = googleMap.map.getCenter();
        let latLng= {lat: newLocation.lat(),
          lng:newLocation.lng()};
          getVenues(latLng);
        }, 3000);
      });
    };

    googleMap.createMarkerForUser = (user) => {
      let latLng = new google.maps.LatLng(user.lat, user.lng);

      let marker = new google.maps.Marker({
        position: latLng,
        map: googleMap.map,
        icon: '../images/user-marker.png',
        skillLevel: user.skillLevel
      });
      googleMap.addInfoWindowForUser(user, marker);


      googleMap.markers.push(marker);
    };

    googleMap.filterMarkers = (skillLevel) => {
      googleMap.markers.forEach((marker)=> {
        if(marker.skillLevel === skillLevel || skillLevel === 'All Skill Levels') {
          marker.setMap(googleMap.map);
        } else {
          marker.setMap(null);
        }
      });
    };


    googleMap.loopThroughtUsers = (users) => {

      $.each(users, (index, user) => {
      let $skillLevel = $('#skillLevel').val();
        if ($skillLevel == "All Skill Levels" ) {
          googleMap.createMarkerForUser(user);
        }
        else if ($skillLevel == user.skillLevel) {
          googleMap.createMarkerForUser(user);

        }


      });
    };



    function getVenues(latLng) {


      var request = {
        location: latLng,
        // radius: 50,
        query: 'tennis courts',
        rankby: 'distance'
      };

      let service = new google.maps.places.PlacesService(googleMap.map);
      service.textSearch(request, callback);
    }



    function callback(results, status, pagination) {

      if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
          var place = results[i];
          createVenueMarker(results[i]);
        }
      }
    }

    function createVenueMarker(place) {
      var placeLoc = place.geometry.location;
      var marker = new google.maps.Marker({
        map: googleMap.map,
        title: place.name,
        position: place.geometry.location,
        // animation: google.maps.Animation.DROP,



        icon: {
          url: '../images/tennis-ball.png',
          anchor: new google.maps.Point(10, 10),
          scaledSize: new google.maps.Size(35, 35),
        }

      });



      marker.addListener('click', function() {

        let website = "";
        let marker = this;

        let service = new google.maps.places.PlacesService(googleMap.map);
        service.getDetails({
          placeId: place.place_id
        }, function(place, status) {

          if (status === google.maps.places.PlacesServiceStatus.OK) {

            google.maps.places.photo = place.photos ? place.photos[0].getUrl({'maxWidth': 200, 'maxHeight': 200}) : "";
            google.maps.places.url = place.url;

            if (typeof venueInfoWindow !== "undefined") {
              venueInfoWindow.close();
            }

            venueInfoWindow = new google.maps.InfoWindow();

            venueInfoWindow.setContent(`<b>${place.name}</b><br>
              ${place.formatted_address} <br>
              <a target="_blank" href="${google.maps.places.url}">More Info...</a>
              <br><img src="${google.maps.places.photo}" alt="venue img">
              `);

              venueInfoWindow.open(googleMap.map, marker);
            }



          });



        });
      }

      $(googleMap.mapSetup.bind(googleMap));

      // reset map to current location
      navigator.geolocation.getCurrentPosition((position) => {

        let latLng= {lat: position.coords.latitude,
          lng:position.coords.longitude};
          googleMap.map.panTo(latLng);
          let market = new google.maps.Marker({
            position: latLng,
            animation:google.maps.Animation.DROP,
            draggable: true,
            map: googleMap.map,
          });
        });
