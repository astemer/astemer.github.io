
		var debugSeverityLevel = 4;
		var debugLogsEnabled = false; // 			<<===
		var skipCode = false; // 					<<===
		var codeEnabled = false;
    	var watchProcess = null;
		var gps_coords = {lat: 0.0, long: 0.0};
		var map_coords = {x: 0.0, y: 0.0};
		var simulatorlocations;
		var simulatorlocationsIndex;
		var simulatorMode = false; // 				<<====
		var map_orient_data = {alfa: 0.0, ratioX: 1.0, ratioY: 1.0};
		var dataJsonStr = "";
		var mapOrientData = {
			vector: {angle: 0.0, dist: 0.0}, 
			vectorRatio: 0.0, 
			p1: {lat: 0.0, lon: 0.0},//Top left 
			p2: {lat: 0.0, lon: 0.0} // Bottom right
		};
		var historyPointsMinDistance;
		var id;
		var canvas;
		var context;
		var historyPoints = [{x: 0.0, y: 0.0}];	
		var tailPoints = [{x: 0.0, y: 0.0}];
		var tickNumber = 0;
		var lat = "lat";
		var long = "long";
	
 
    	function initiate_watchlocation() {			
			if (watchProcess == null) {
				watchProcess = navigator.geolocation.watchPosition(handle_geolocation_query, handle_errors,
			    {
						timeout: 10000,
						enableHighAccuracy: true,
						maximumAge: Infinity
					});
			}
    	}
 
    	function stop_watchlocation() {
		  if (watchProcess != null) {
				navigator.geolocation.clearWatch(watchProcess);
				watchProcess = null;
			}			
    	}
 
    	function handle_errors(error) {
            switch(error.code)
            {
                case error.PERMISSION_DENIED: alert("User did not share geolocation data");
                break;
                case error.POSITION_UNAVAILABLE: alert("Could not detect current position");
                break;
                case error.TIMEOUT: alert("Retrieving position timedout");
                break;
                default: alert("Unknown error");
                break;
        		}
    	}

		function handle_geolocation_query(position) {
			debugLog(3, "===> handle_geolocation_query: lat: " + position.coords.latitude + ", long:" + position.coords.longitude);
			setPosition(position.coords.latitude, position.coords.longitude);			
    	}        
		
		function setPosition(lat, long) {
			debugLog(3, "setPosition: lat: " + lat + ", long:" + long);
			gps_coords.lat = lat;
			gps_coords.long = long;
			map_coords = latLon_2_xy(lat, long);
			document.getElementById("current_location").value = gps_coords.lat + ", " + gps_coords.long;
			current_location
			addTailPoint();			
		}

		function addTailPoint() {
			dist = distance(map_coords.x, map_coords.y, tailPoints[tailPoints.length - 1].x, tailPoints[tailPoints.length - 1].y);
			if (dist > tailPointsMinDistance) {
				tailPoints.push({x: map_coords.x, y: map_coords.y});
			}
			if (tailPoints.length > 20) {
				var lastPoint = tailPoints.shift();
				addHistoryPoint(lastPoint.x, lastPoint.y);
			}
		}

		function addHistoryPoint(x, y) {
			dist = distance(x, y, historyPoints[historyPoints.length - 1].x, historyPoints[historyPoints.length - 1].y);
			if (dist > historyPointsMinDistance) {
				historyPoints.push({x: x, y: y});
				if (historyPoints.length > 1000) {
					historyPoints.shift();
				}
			}
		}

		function showPosition(x, y) {
			debugLog(3, "showPosition: x: " + x + ", y:" + y);			
			//drawXonCanvas(x, y);
			drawLocationIcon(x, y);
		}

		function showHistory() {
			context.lineWidth = 1;
			context.strokeStyle = "red";			
			historyPoints.forEach(drawHistoryPoint);
		}

		function showTail() {
			context.lineWidth = 1;
			context.strokeStyle = "pink";			
			tailPoints.forEach(drawTailPoint);
		}

		function drawHistoryPoint(value) {
			context.beginPath();
			context.arc(value.x, value.y, 3, 0, 2 * Math.PI);
			context.stroke();
		}

		function drawTailPoint(value) {
			context.beginPath();
			context.arc(value.x, value.y, 2, 0, 2 * Math.PI);
			context.stroke();
		}

		function drawLocationIcon(x, y) {
			if (x==0 && y==0) {
				// This is not a true location:
				return;
			}
			var radius = 30;
			if (tickNumber%2 == 0) {
				radius = radius - (radius/4);
			}
	    	var targetBars = ((2 * radius) / 3);
	    	var targetCircle = ( radius / 3);
			
			context.beginPath();
			context.lineWidth = 5;
			context.strokeStyle = "red";				
				
			context.arc(x, y , radius - targetCircle, 0, 2 * Math.PI);
			context.moveTo(x - radius, y);
			context.lineTo(x - radius + targetBars, y);	              	      
			context.moveTo(x + radius, y);
			context.lineTo(x + radius - targetBars, y);	              	      
			context.moveTo(x, y - radius, x);
			context.lineTo(x, y - radius + targetBars);	              	      
			context.moveTo(x, y + radius);
			context.lineTo(x, y + radius - targetBars);	              	      		
			 
			context.stroke();

			context.beginPath();
			context.lineWidth = 2;
			context.strokeStyle = "white";				

			context.arc(x, y , radius - targetCircle, 0, 2 * Math.PI);
			context.moveTo(x - radius, y);
			context.lineTo(x - radius + targetBars, y);	              	      
			context.moveTo(x + radius, y);
			context.lineTo(x + radius - targetBars, y);	              	      
			context.moveTo(x, y - radius, x);
			context.lineTo(x, y - radius + targetBars);	              	      
			context.moveTo(x, y + radius);
			context.lineTo(x, y + radius - targetBars);	 
			
			context.stroke();
		}

		function drawXonCanvas(x, y) {	
			debugLog(3, "drawXonCanvas: x: " + x + ", y:" + y);
			context.beginPath();
			context.lineWidth = 3;
			context.strokeStyle = "black";			
			var X_location_x = x;
			var X_location_y = y;
			var X_size = 20;
			//context.strokeStyle = '#00ff00';
			context.moveTo(X_location_x - X_size, X_location_y - X_size);			
			context.lineTo(X_location_x + X_size, X_location_y + X_size);
			context.moveTo(X_location_x - X_size, X_location_y + X_size);			
			context.lineTo(X_location_x + X_size, X_location_y - X_size);
			context.stroke();
		}

		function drawMap()
		{
			map_image = new Image();
			map_image.src = 'img.jpg';
			map_image.onload = function() {
				canvas.width  = map_image.width;
				canvas.height = map_image.height;
				context.drawImage(map_image, 0, 0);
				postInit();
			}
		}

		function reDraw() {			
			context.clearRect(0, 0, canvas.width, canvas.height);
			context.beginPath();
			context.closePath();
			context.drawImage(map_image, 0, 0);	
			showHistory();
			showTail();					
			showPosition(map_coords.x, map_coords.y);
		}

		function timeTick() {		
			tickNumber += 1;
			if (tickNumber > 100000) {
				tickNumber = 0;
			}	
			debugLog(4, "TimeTick:" + tickNumber);
			if (simulatorMode == true) {
				simulatorLocationTick();
			}
			reDraw();
		}

		function toRadians (angle) {
			return angle * (Math.PI / 180);
		}
		
		function toDegrees (angle) {
			return angle * (180 / Math.PI);
		}

		function prepareOrientationData() {
			debugLog(2, "prepareOrientationData()");
			mapOrientData.vector = calcGeoVector(mapOrientData.p1.lat, mapOrientData.p1.lon, mapOrientData.p2.lat, mapOrientData.p2.lon);
			var xyDist = distance(0, 0, map_image.width, map_image.height);
			mapOrientData.vectorRatio = xyDist / mapOrientData.vector.dist
			debugLog(3, "mapOrientData:" + JSON.stringify(mapOrientData));
			historyPointsMinDistance = xyDist / 100;			
			tailPointsMinDistance = xyDist / 500;
		}

		function distance(x1, y1, x2, y2) {			
			var distX = x2 - x1;
			var distY = y2 - y1;
			var dist = Math.sqrt(distX * distX + distY * distY);
			debugLog(3, "distance: distX: " + distX + ", distY: " + distY + ", dist: " + dist);
			return dist;
		}

		function angleFromEast(lat1, lon1, lat2, lon2, dist) {
			var distOverLat = getDistanceFromLatLonInKm(lat1, lon1, lat2, lon1);			
			var angle = Math.asin(distOverLat/dist);
			debugLog(3, "Angle: Rad=" + angle + ", Deg=" + toDegrees(angle));	
			return angle;
		}

		function calcGeoVector(lat1, lon1, lat2, lon2) {
			debugLog(3, "calcGeoVector: #1:" + lat1 + ", " + lon1 + " #2:" + lat2 + ", " + lon2);			
			var vector = {angle: 0.0, dist: 0.0};									 						
			vector.dist = getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2);
			vector.angle = angleFromEast(lat1, lon1, lat2, lon2, vector.dist);
			debugLog(3, "vector: " + JSON.stringify(vector));
			return vector;
		}

		function latLon_2_xy(lat, lon) {
			var p = {x: 0.0, y: 0.0};
			debugLog(3, "latLon_2_xy: lat:" + lat + ", " + lon);
			var vector = calcGeoVector(mapOrientData.p1.lat, mapOrientData.p1.lon, lat, lon);
			// Assuming the top left corner of the image is 0,0 and the bottom right corner is the "100,100":
			angleDelta = mapOrientData.vector.angle - vector.angle;
			angle = mapOrientData.vector.angle - angleDelta;
			dist = vector.dist * mapOrientData.vectorRatio;
			debugLog(3, "dist: " + dist + ", angle:" + angle);

			p.x = Math.cos(angle) * dist;
			p.y = Math.sin(angle) * dist;
			debugLog(3, "p.x: " + p.x + ", p.y:" + p.y);

			return p;
		}

		// From StackOverFlow:
		// https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
		function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  		var R = 6371; // Radius of the earth in km
  		var dLat = toRadians(lat2-lat1);  // deg2rad below
  		var dLon = toRadians(lon2-lon1); 
  		var a = 
    		Math.sin(dLat/2) * Math.sin(dLat/2) +
    		Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    		Math.sin(dLon/2) * Math.sin(dLon/2); 
  		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
			var d = R * c; // Distance in km
			debugLog(3, "getDistanceFromLatLonInKm: " + d);
  		return d;
		}

		function setMapOrientData() {				
			mapOrientData.p1.lat = dataJson.ori_point_left_top_lat;
			mapOrientData.p1.lon = dataJson.ori_point_left_top_long;
			mapOrientData.p2.lat = dataJson.ori_point_right_bottom_lat;
			mapOrientData.p2.lon = dataJson.ori_point_right_bottom_long;
		}

		function check() {
			code = document.getElementById("current_location").value;
			debugLog(2, "Check(): " + code);
			if (check_2(code, long.length, lat.length) == true) {
				init();
			}
		}

		function check_2(code, longSize, latSize) {
			var code3 = parseInt(code.charAt(latSize));			
			if (code3 == (longSize + latSize)) {
				return check_3(code, longSize, latSize);
			} else {
				return false;
			}
		}

		function check_3(code, longSize, latSize) {
			var code2 = parseInt(code.charAt(longSize / 2));			
			if (code2 == (longSize - latSize)) {
				return check_4(code, longSize, latSize);
			} else {
				return false;
			}
		}

		function check_4(code, longSize, latSize) {
			var code1 = parseInt(code.charAt(longSize - latSize));			
			if (code1 == latSize) {
				return check_5(code, longSize, latSize);
			} else {
				return false;
			}
		}

		function check_5(code, longSize, latSize) {
			var code0 = parseInt(code.charAt(longSize - longSize));			
			if (code0 == longSize) {
				return true;
			} else {
				return false;
			}
		}

		function preInit() {
			if (skipCode == true) {				
				init();
				return;
			}
			debugLog(3, "preInit");
			document.getElementById("map_title").innerHTML = "Sorry - Site is not open yet";
			document.getElementById("current_location").value = "Code Please.";
		}

		function postInit() { // Runs after image loads:
			debugLog(3, "postInit...");
			prepareOrientationData();
			initLocation();
			id = setInterval(timeTick, 500);
		}

		function init() {
			debugLog(2, "init...");
			codeEnabled = true;
			document.getElementById("current_location").value = "Loading...";
			if (typeof mapTitle === 'undefined') {
				document.getElementById("map_title").innerHTML = "Your location map";
			} else {
				document.getElementById("map_title").innerHTML = mapTitle;
			}
			setMapOrientData();	
			canvas = document.getElementById("map_canvas"),
			context = canvas.getContext('2d');		
			drawMap();
		}
		
		function initLocation() {
			if (simulatorMode == true) {
				gpsSimulatorInit();
			} else {
				initiate_watchlocation();
			}
		}

		function gpsSimulatorInit() {
			simulatorlocations = 
				[
					{lat: 32.0, long: 35.0}, {lat: 32.0, long: 35.01}, {lat: 32.0, long: 35.02}, {lat: 32.0, long: 35.03},
					{lat: 32.0, long: 35.04}, {lat: 32.0, long: 35.05}, {lat: 32.0, long: 35.06}, {lat: 32.0, long: 35.07},
					{lat: 32.0, long: 35.08}, {lat: 32.0, long: 35.09}, {lat: 32.0, long: 35.10}, {lat: 32.0, long: 35.11}					
				];
			simulatorlocationsIndex = 0;						
		}

		function simulatorLocationTick() {	
			var location = {lat: 0.0, long: 0.0};
			location.lat = simulatorlocations[simulatorlocationsIndex].lat;
			location.long = simulatorlocations[simulatorlocationsIndex].long;
			simulatorlocationsIndex += 1;
			if (simulatorlocationsIndex >= simulatorlocations.length) {
				simulatorlocationsIndex = 0;
			}
			setPosition(location.lat, location.long);			
		}

		
		function clearMeasurment() {
			closeNav();
		}
		function saveForOffline() {
			closeNav();
		}
		
		function contactMapVendor() {
			closeNav();
		}

		function openNav() {
			if (codeEnabled == false) {
				return;
			}
			document.getElementById("menuClearMeasurments").innerHTML = "Clear Measurments";
			document.getElementById("menuSaveOffline").innerHTML = "Save for Offline use"
			document.getElementById("menuMessage").innerHTML = "Send message"
			document.getElementById("mySidenav").style.width = "200px";
			document.getElementById("main").style.marginLeft = "200px";
			document.body.style.backgroundColor = "rgba(0,0,0,0.4)";
		}
		  
		function closeNav() {
			document.getElementById("mySidenav").style.width = "0";
			document.getElementById("main").style.marginLeft= "0";
			document.body.style.backgroundColor = "white";
		}

		function debugLog(severity, str) {
			if (debugLogsEnabled == false) {
				return;
			}
			if (severity <= debugSeverityLevel) {
				console.log(str);
			} 
		}

		window.onload = preInit();
