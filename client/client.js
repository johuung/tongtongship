var ws = new WebSocket("ws://localhost:8080");
var video = document.getElementById("local_video");
var image = document.getElementById("received_video");
var canvas = document.getElementById("screenshot");
var ctx = canvas.getContext('2d');

ws.onopen = function(event) {
    console.log("Connected!");
}

ws.onmessage = function(event) {
    image.src = event.data;
}

// error event handler
ws.onerror = function(event) {
    console.log("Server error message: ", event.data);
}

const constraints = {
    video: true
};

navigator.mediaDevices.getUserMedia(constraints)
    .then(function(localStream) {
	video.srcObject = localStream;

	setInterval(function() {
	    sendScreenshot();
	}, 3000);

    })
    .catch(handleGetUserMediaError);

function handleGetUserMediaError(e) {
    switch(e.name) {
    case "NotFoundError":
	alert("Unable to open your call because no camera and/or microphone" +
              "were found.");
	break;
    case "SecurityError":
    case "PermissionDeniedError":
	// Do nothing; this is the same as the user canceling the call.
	break;
    default:
	alert("Error opening your camera and/or microphone: " + e.message);
	break;
    }
}


function sendScreenshot() {
    try {
	console.log(video.videoWidth);
	console.log(video.videoHeight);
	let screenshot = ctx.drawImage(video, 0, 0);
	ws.send(canvas.toDataURL('image/jpeg', 0.1));
    } catch (e) {
	console.log('Unable to acquire screenshot: ' + e);
    }
}
