var ws = new WebSocket("ws://localhost:8080");
var video = document.getElementById("local_video");

var image = new Array();
for(var i = 0; i<9; i++){
image[i] = document.getElementById("received_video_0"+i);
}

var test_text = new Array();
for(var i=0; i<9; i++){
	test_text[i] = document.getElementById("received_cookie_0"+i);
	test_text[i].innerHTML = i+'hell\n';
}

var canvas = document.getElementById("screenshot");
var ctx = canvas.getContext('2d');

ws.onopen = function(event) {
    console.log("Connected!");
}

ws.onmessage = function(event) {
//    image.src = event.data;
	if(JSON.parse(event.data).type == 'urls'){
		for(var i = 0; i<9; i++){
		//    image[i].src = JSON.parse(event.data).guests[i]+'?t=' + new Date().getTime();
			var guest_num = "guest"+String(i+1);
			//console.log(guest_num);
			if (JSON.parse(event.data).guests[guest_num] == null) {
				test_text[i].innerHTML = "Guest #"+ String(i+1)+" is null";
			}
			else {
				test_text[i].innerHTML = JSON.parse(event.data).guests[guest_num];
			}
		}  
 	//image.src = 'https://s3.ap-northeast-2.amazonaws.com/jehyunlims-bucket93/' + document.cookie + '.jpeg?t=' + new Date().getTime();
	//	console.log();
	}
	else if(JSON.parse(event.data).type == 'echo'){
		var confirmflag = confirm(JSON.parse(event.data).string);
		if(confirmflag){
			console.log('ok');
		}
		else{
			console.log('cancle');
		}
	}
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
	let screenshot = ctx.drawImage(video, 0, 0);
	img = canvas.toDataURL('image/jpeg', 0.1);
	cookie = document.cookie.replace(/(?:(?:^|.*;\s*)cookie\s*\=\s*([^;]*).*$)|^.*$/, "$1");
	ws.send(JSON.stringify({ "cookie" : cookie, "type" : "screenshot", "image" : img }));
    } catch (e) {
	console.log('Unable to acquire screenshot: ' + e);
    }
}

function hangUpCall(){
	ws.send(JSON.stringify({"cookie" : cookie, "type" : 'button'}));
}
