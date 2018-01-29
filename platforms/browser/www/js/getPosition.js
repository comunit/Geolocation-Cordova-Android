document.addEventListener('deviceready', function () {
  // Enable background mode
  cordova.plugins.backgroundMode.enable();

  var interval = null;
  // Called when background mode has been activated
  cordova.plugins.backgroundMode.onactivate = function () {
    cordova.plugins.backgroundMode.disableWebViewOptimizations();
    interval = setInterval(function () {
      background();
    }, 3000);
  }

  cordova.plugins.backgroundMode.ondeactivate = function () {
    clearInterval(interval)
  };
}, false);

var btn = document.getElementById('btn');
var map = document.getElementById('map');
var container = document.getElementById('container');
var userName = document.getElementById('userName');
btn.addEventListener('click', getMap);

function getMap() {
  container.style.display = "none";
  map.style.display = "block";
  userName = userName.value;
  initMap(userName);

  // send signal to server that new user is connected
  socket.emit('newUser', {
    user: userName
  });
}

function background() {
  // Get Location
  navigator.geolocation.getCurrentPosition(showPosition);
  function showPosition(position) {
    //Send Position to server 
    socket.emit('location', {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      user: userName,
      id: socket.id
    });
  }
}

function initMap(userName) {
  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 10,
    center: {
      lat: 51.576158,
      lng: 0.090479
    }
  });

  var userIds = [];
  var markers = [];

  // Get Location
  navigator.geolocation.watchPosition(showPosition);

  function showPosition(position) {
    //Send Position to server 
    socket.emit('location', {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      user: userName,
      id: socket.id
    });

    socket.on('location', function (data) {
      var data = data.loc;
      for (let i = 0; i < data.length; i++) {
        const element = data[i];
        var objId = markers.find(o => o.id == element.id);
        if (objId == undefined) {
          test = new google.maps.InfoWindow;
          test.setContent(element.user);
          test.open(map);
          test.setPosition({
            lat: element.lat,
            lng: element.lng
          });
          test.set("id", element.id);
          markers.push(test);
        }
      }
    });

    socket.on('location', function (data) {
      var data = data.loc;
      for (let i = 0; i < data.length; i++) {
        const element = data[i];
        let user = markers.find((o, i) => {
          // Find index of markers 
          objIndex = markers.findIndex((marker => marker.id == element.id));
          // Update location
          newLatlng = {
            lat: element.lat,
            lng: element.lng
          }
          markers[objIndex].setPosition(newLatlng);
        });
      }
    });

    // Handle Disconnted User
    socket.on('disconnectId', function (data) {
      for (let i = 0; i < markers.length; i++) {
        const element = markers[i];
        if (data.disconnetId == element.id) {
          markers[i].setMap(null);
        }
      }
    });
  }
}