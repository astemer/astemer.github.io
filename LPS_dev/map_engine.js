
		var debugSeverityLevel = 2;
		var debugLogsEnabled = false; // 			<<===
		var skipCode = true; // 					<<===
		var codeEnabled = false;
    	var watchProcess = null;
		var gps_coords = {lat: 0.0, long: 0.0};
		var map_coords = {x: 0.0, y: 0.0};
		var simulatorlocations;
		var simulatorlocationsIndex;
		var simulatorMode = false; // 				<<====
		var map_orient_data = {alfa: 0.0, ratioX: 1.0, ratioY: 1.0};		
		var mapOrientData = {
			vector: {angle: 0.0, dist: 0.0}, 
			vectorRatio: 0.0, 
			p1: {lat: 0.0, lon: 0.0},//Top left 
			p2: {lat: 0.0, lon: 0.0} // Bottom right
		};
		var tailPointsMinDistance;
		var id;
		var canvas;
		var context;
		var touchMode = 0; // None	
		var mapCanvasScale = 1.0;
		var mapCanvasOffset = {x:0, y:0};
		var pinchZoomOldDist = 0;	
		var historyPoints = [{x: 0.0, y: 0.0}];	
		var tailPoints = [{x: 0.0, y: 0.0}];
		var tickNumber = 0;
		var lat = "lat";
		var long = "long";
		var isLocatedOnthisMap = true;
		var lastTouchPosition = {x: 0, y: 0};
		var showDistance = false;
		var showTail = true;
		var dataVersion = 1;
		var lang = "eng"
	
 
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
			//heading = position.heading; // degrees from true north. If speed is 0: NaN. If device is unable to provide info: Null.
    	}        
		
		function setPosition(lat, long) {
			debugLog(3, "setPosition: lat: " + lat + ", long:" + long);
			gps_coords.lat = lat;
			gps_coords.long = long;
			map_coords = latLon_2_xy(lat, long);
			document.getElementById("current_location").value = gps_coords.lat + ", " + gps_coords.long;
			if (map_coords.x > canvas.width || map_coords.x < 0 || map_coords.y > canvas.height || map_coords.y < 0) {
				isLocatedOnthisMap = false;	
			} else {
				isLocatedOnthisMap = true;
			}
			addTailPoint();			
		}

		function addTailPoint() {
			dist = distance(map_coords.x, map_coords.y, tailPoints[tailPoints.length - 1].x, tailPoints[tailPoints.length - 1].y);
			if (dist > tailPointsMinDistance) {
				tailPoints.push({x: map_coords.x, y: map_coords.y});
			}
			if (tailPoints.length > 1000) {
				tailPoints.shift();				
			}
		}

		function showPosition(mapCords) {
			debugLog(3, "showPosition: x: " + mapCords.x + ", y:" + mapCords.y);			
			//drawXonCanvas(x, y);			
			drawLocationIcon(mapCords);
		}

		function showLocationTail() {
			if (showTail == false) {
				return;
			}
			context.lineWidth = 1;
			context.strokeStyle = "red";			
			tailPoints.forEach(drawTailPoint);
		}

		function mapToCanvas(mapCords) {
			var canvasCords = {x:0, y:0};
			canvasCords.x = ((mapCords.x * mapCanvasScale) + mapCanvasOffset.x);
			canvasCords.y = ((mapCords.y * mapCanvasScale) + mapCanvasOffset.y);
			debugLog(4, "mapToCanvas: Mx: " + mapCords.x + ", My:" + mapCords.y + "; Cx:" + canvasCords.x + "," + canvasCords.y);
			return canvasCords;
		}

		function canvasToMap(canvasCords) {
			var mapCords = {x:0, y:0};
			mapCords.x = ((canvasCords.x - mapCanvasOffset.x) / mapCanvasScale);
			mapCords.y = ((canvasCords.y - mapCanvasOffset.y) / mapCanvasScale);
			debugLog(4, "canvasToMap: Mx: " + mapCords.x + ", My:" + mapCords.y + "; Cx:" + canvasCords.x + "," + canvasCords.y);
			return mapCords;
		}

		function drawTailPoint(mapCords) {
			context.beginPath();
			var canvasCords = mapToCanvas(mapCords);
			context.arc(canvasCords.x, canvasCords.y, 3, 0, 2 * Math.PI);
			context.stroke();
		}

		function drawLocationIcon(mapCords) {
			if (x==0 && y==0) {
				// This is not a true location:
				return;
			}
			var canvasCords = mapToCanvas(mapCords);
			var x = canvasCords.x;
			var y = canvasCords.y;
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

		function drawXonCanvas(mapCords) {	
			debugLog(3, "drawXonCanvas: x: " + x + ", y:" + y);
			var canvasCords = mapToCanvas(mapCords);
			var x = canvasCords.x;
			var y = canvasCords.y;
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
				var imageRatio = (map_image.width / map_image.height);
				debugLog(2, "drawMap - load: imageRatio=" + imageRatio);
				canvas.width = window.innerWidth;	
				canvas.height  = canvas.width / imageRatio;
				context.drawImage(map_image, 
					0, 0, map_image.width, map_image.height,
					mapCanvasOffset.x, mapCanvasOffset.y, map_image.width * mapCanvasScale, map_image.height * mapCanvasScale);
				postInit();
			}			
		}

		function printNotOnMapMessage() {
			if (isLocatedOnthisMap == true) {
				return;
			}
			if ((tickNumber % 4) == 0) {
				context.strokeStyle = "white";	
			} else {
				context.strokeStyle = "red";
			}			
			context.font = "30px Arial";
			var left = 20;
			var top = 60;
			var message_youAreNotOnThisMap = "You are not located on this map...";
			context.strokeText(message_youAreNotOnThisMap, left, top);
		}

		function drawDistancePointer() {
			if (lastTouchPosition.x == 0 && lastTouchPosition.y == 0) {
				return;
			}
			if (isLocatedOnthisMap == false || showDistance == false) {
				return;
			}
			debugLog(3, "drawDistancePointer: x: " + lastTouchPosition.x + ", y:" + lastTouchPosition.y);			
			context.beginPath();
			context.lineWidth = 2;
			context.strokeStyle = "black";			
			var radius = 7;	
			canvasCords = mapToCanvas(map_coords);		
			context.moveTo(canvasCords.x, canvasCords.y);			
			context.lineTo(lastTouchPosition.x, lastTouchPosition.y);
			context.stroke();
			context.beginPath();
			context.arc(lastTouchPosition.x, lastTouchPosition.y, radius, 0, 2 * Math.PI);
			context.fill();
			
			// Print the distance:
			var fontSize = 20;			
			context.font = fontSize + "px Arial";
			lastTouchMapCords = canvasToMap(lastTouchPosition);
			var distanceFromLocation = getGpsDistance(lastTouchMapCords.x, lastTouchMapCords.y, map_coords.x, map_coords.y);
			distanceFromLocation = distanceFromLocation.toFixed(3);
			var distanceFromLocation_str = distanceFromLocation + " Km";
			context.strokeText(distanceFromLocation_str, lastTouchPosition.x, lastTouchPosition.y - (1.5 * fontSize));
			context.stroke();
		}

		function reDraw() {						
			context.clearRect(0, 0, canvas.width, canvas.height);
			context.beginPath();
			context.closePath();
			context.drawImage(map_image, 
				0, 0, map_image.width, map_image.height,
				mapCanvasOffset.x, mapCanvasOffset.y, map_image.width * mapCanvasScale, map_image.height * mapCanvasScale);					
			showLocationTail();					
			showPosition(map_coords);
			printNotOnMapMessage();
			drawDistancePointer();			
		}

		function timeTick() {		
			tickNumber += 1;
			if (tickNumber > 100000) {
				tickNumber = 0;
			}	
			debugLog(5, "TimeTick:" + tickNumber);
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
			tailPointsMinDistance = xyDist / 250;
		}

		function getGpsDistance(x1, y1, x2, y2) {
			var dist = distance(x1, y1, x2, y2);
			if (mapOrientData.vectorRatio == 0) {
				dist = 0;
			} else {
				dist = dist/mapOrientData.vectorRatio;//In KMs.
			}
			return dist;
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
			debugLog(4, "latLon_2_xy: lat:" + lat + ", " + lon);
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

		function getMapData() {				
			var mapDataString = document.getElementById("map_data").value;
			debugLog(2, "mapDataString: " + mapDataString);
			var mapDataArr = mapDataString.split(";", 7); // Ver 1.0
			dataVersion = mapDataArr[0];			
			mapTitle = mapDataArr[1];
			lang = mapDataArr[2];
			mapOrientData.p1.lat = mapDataArr[3];
			mapOrientData.p1.lon = mapDataArr[4];
			mapOrientData.p2.lat = mapDataArr[5];
			mapOrientData.p2.lon = mapDataArr[6];			
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
				codeEnabled = true;			
				init();
				return;
			}
			debugLog(3, "preInit");
			document.getElementById("map_title").innerHTML = "Sorry - Site is not open yet";
			document.getElementById("current_location").value = "Code Please.";
			document.getElementById("current_location").focus();
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
			getMapData();	
			document.getElementById("map_title").innerHTML = mapTitle;
			canvas = document.getElementById("map_canvas"),
			context = canvas.getContext('2d');					
			drawMap();
			touchMode = 0;						
			canvas.addEventListener("touchstart", pointerDown, false);
			canvas.addEventListener("touchmove", pointerMove, false);
			canvas.addEventListener("touchend", pointerUp, false);
			generateMenu();
		}
		
		//--
		// Touch handlers:
		function pointerDown(e) {			
			updateLastTouchPosition(e);				
			pinchZoomOldDist = 0;
			if (e.touches.length == 2) {
				touchMode = 2; // Pinch	zoom				
			} else if (e.touches.length == 1) {
				touchMode = 1; // Drag
			} else {
				touchMode = 0; // None
			}
			debugLog(2, "Pointer down - Touch mode:" +  touchMode);
			reDraw();
		}

		function pointerUp(e) {			
			touchMode = 0; // None
			debugLog(2, "Pointer up - Touch mode:" +  touchMode);						
		}

		function pointerMove(e) {
			if (touchMode != 0) {
				if (touchMode == 1) { // Drag
					var currTouch = {x:0, y:0};
					var canvasClientRect = canvas.getBoundingClientRect();					
					currTouch.x = e.touches[0].clientX - canvasClientRect.left;
					currTouch.y = e.touches[0].clientY - canvasClientRect.top;																		
					var deltaX = currTouch.x - lastTouchPosition.x;
					var deltaY = currTouch.y - lastTouchPosition.y;					
					mapCanvasOffset.x += deltaX;
					mapCanvasOffset.y += deltaY;
					debugLog(4, "Move Axis:" + currTouch.x + ", " + currTouch.y);	
					updateLastTouchPosition(e);															
				} else if (touchMode == 2) { // Pinch zoom					
					var p1 = {x:0, y:0};
					p1.x = e.touches[0].screenX;
					p1.y = e.touches[0].screenY;
					var p2 = {x: 0, y:0};
					p2.x = e.touches[1].screenX;
					p2.y = e.touches[1].screenY;
					var dist = distance(p1.x, p1.y, p2.x, p2.y);
					if (pinchZoomOldDist != 0) {
						mapCanvasScale *= dist/pinchZoomOldDist;			
						if (mapCanvasScale > 3.0) { // Limit scale to x3
							mapCanvasScale = 3.0;
						} else 		
						if (mapCanvasScale < 0.3) { // Limit scale to x1/4
							mapCanvasScale = 0.3;
						}		

					}
					debugLog(4, "Update scale: dist=" + dist + ", oldDist=" + pinchZoomOldDist + ", scale=" + mapCanvasScale);					
					pinchZoomOldDist = dist;					
				}
			
			}
			reDraw();
		}

		function updateLastTouchPosition(e) {	
			var canvasClientRect = canvas.getBoundingClientRect();		
			lastTouchPosition.x = e.touches[0].clientX - canvasClientRect.left;
			lastTouchPosition.y = e.touches[0].clientY - canvasClientRect.top;			
			debugLog(4, "updateLastTouchPosition: " + lastTouchPosition.x + ", " + lastTouchPosition.y);	
		}

		// Get the position of the mouse relative to the canvas
		function getMousePosition(canvasDom, mouseEvent) {
			var rect = canvasDom.getBoundingClientRect();
			return {
			  x: mouseEvent.clientX - rect.left,
			  y: mouseEvent.clientY - rect.top	};
		}
		  
		//--

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
					{lat: 32.0, long: 35.0}, {lat: 32.0, long: 35.0001}, {lat: 32.0, long: 35.0002}, {lat: 32.0, long: 35.0003},
					{lat: 32.0, long: 35.0004}, {lat: 32.0, long: 35.0005}, {lat: 32.0, long: 35.0006}, {lat: 32.0, long: 35.0007},
					{lat: 32.0, long: 35.0008}, {lat: 32.0, long: 35.0009}, {lat: 32.0, long: 35.0010}, {lat: 32.0, long: 35.0011},
					{lat: 32.0, long: 35.0012}, {lat: 32.0, long: 35.0013}, {lat: 32.0, long: 35.0014}, {lat: 32.0, long: 35.0015},
					{lat: 32.0, long: 35.0016}, {lat: 32.0, long: 35.0017}, {lat: 32.0, long: 35.0018}, {lat: 32.0, long: 35.0019},
					{lat: 32.0, long: 35.0020}, {lat: 32.0, long: 35.0021}, {lat: 32.0, long: 35.0022}, {lat: 32.0, long: 35.0023},					
					{lat: 32.0, long: 35.0024}, {lat: 32.0, long: 35.0025}, {lat: 32.0, long: 35.0026}, {lat: 32.0, long: 35.0027},
					{lat: 32.0, long: 35.0028}, {lat: 32.0, long: 35.0029}, {lat: 32.0, long: 35.0030}, {lat: 32.0, long: 35.0031},
					{lat: 32.0, long: 35.0032}, {lat: 32.0, long: 35.0033}, {lat: 32.0, long: 35.0034}, {lat: 32.0, long: 35.0035},
					{lat: 32.0, long: 35.0036}, {lat: 32.0, long: 35.0037}, {lat: 32.0, long: 35.0038}, {lat: 32.0, long: 35.0039},
					{lat: 32.0, long: 35.0040}, {lat: 32.0, long: 35.0041}, {lat: 32.0, long: 35.0042}, {lat: 32.0, long: 35.0043}					
				
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

		
		function menuShowLatestMessages() {
			closeNav();
		}
		function saveForOffline() {
			closeNav();
		}		
		function contactMapVendor() {
			closeNav();
		}

		function toggleKeepScreenOn() {
			closeNav();
		}

		function toggleShowTail() {
			debugLog(2, "toggleShowTail");
			if (showTail == false) {
				showTail = true;
			} else {
				showTail = false;
			}
			closeNav();
		}

		function toggleShowDistance() {
			debugLog(2, "toggleShowDistance");
			if (showDistance == false) {
				showDistance = true;
			} else {
				showDistance = false;
			}
			closeNav();
		}

		function generateMenu() {	
			debugLog(2, "generateMenu");
			document.getElementById("menuOpen").onclick = openNav;
			document.getElementById("myCloseBtn").onclick = closeNav;
			var menuItem = "Show/Hide distance ruler";
			if (lang == "heb") {
				menuItem = "הצג/הסתר סרגל מרחק";
			}			
			document.getElementById("menuItem1").innerHTML = menuItem;
			document.getElementById("menuItem1").onclick = toggleShowDistance;

			menuItem = "Keep screen on"
			if (lang == "heb") {
				menuItem = "שמור את המסך דלוק";
			}			

			document.getElementById("menuItem2").innerHTML = menuItem;
			document.getElementById("menuItem2").onclick = toggleKeepScreenOn;

			menuItem = "Show/Hide tail of locations"
			if (lang == "heb") {
				menuItem = "הצג/הסתר מיקומים קודמים";
			}			

			document.getElementById("menuItem3").innerHTML = menuItem;
			document.getElementById("menuItem3").onclick = toggleShowTail;

			menuItem = "Save for Offline use"		
			if (lang == "heb") {
				menuItem = "שמור את הדף לשימוש ללא אינטרנט";
			}			

			document.getElementById("menuItem4").innerHTML = menuItem;
			document.getElementById("menuItem4").onclick = saveForOffline;

			//document.getElementById("menuMessage").innerHTML = "Send message"			
			//document.getElementById("contactMapVendor").innerHTML = "contact Map Vendor"									
		}

		function openNav() {
			debugLog(2, "openNav");
			if (codeEnabled == false) {
				return;
			}			
			document.getElementById("mySidenav").style.width = "270px";			
			document.body.style.backgroundColor = "rgba(0,0,0,0.4)";
		}
		  
		function closeNav() {
			debugLog(2, "closeNav");
			document.getElementById("mySidenav").style.width = "0";			
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
