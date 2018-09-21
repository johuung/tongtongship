var ws = new WebSocket("ws://localhost:8080");
var video = document.getElementById("local_video");

/*
var image = new Array();
for(var i = 0; i<9; i++){
	image[i] = document.getElementById("received_video_0"+i);
}
*/
var guest_box = document.getElementById("camera-container");

var test_text = new Array();
for(var i=0; i<9; i++){
	test_text[i] = document.createElement('h3');
	test_text[i].innerHTML = i+'hell\n';
	guest_box.appendChild(test_text[i]);
	test_text[i].addEventListener('click', function(event){ console.log(event.target.id); handleRequestClick(event.target.id)});
}

var canvas = document.getElementById("screenshot");
var ctx = canvas.getContext('2d');

var peerConnection = null;
var callSource = document.cookie.replace(/(?:(?:^|.*;\s*)cookie\s*\=\s*([^;]*).*$)|^.*$/, "$1");;
var callDestination = null;

ws.onopen = function(event) {
	console.log("Connected!");
	console.log("my cookie : " + callSource)
}

ws.onmessage = handleMessageEvent;

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
		ws.send(JSON.stringify({ "type" : "screenshot", "data" : { "image" : img } }));
	} catch (e) {
		console.log('Unable to acquire screenshot: ' + e);
	}
}

function handleMessageEvent(event){
	var message = JSON.parse(event.data);

	switch(message.type){
		case "urls":
		for(var i = 0; i<9; i++){
			//				image[i].src = JSON.parse(event.data).guests[i]+'?t=' + new Date().getTime();
			var guest_num = "guest"+String(i+1);
			if (message.guests[guest_num] == null) {
				test_text[i].htmlId.innerHTML = "Guest #"+ String(i+1)+" is null";
			}
			else {
				test_text[i].htmlId.innerHTML = message.guests[guest_num];
				test_text[i].cookie = message.guests[guest_num];
			}
		}
		//              image.src = 'https://s3.ap-northeast-2.amazonaws.com/jehyunlims-bucket93/' + document.cookie + '.jpeg?t=' + new Date().getTime();
		break;
		case "request":
		/*
		var confirmflag = confirm(JSON.parse(event.data).string);
		if(confirmflag){
				console.log('ok');
		}
		else{
				console.log('cancle');
		}
		*/
		handleRequestMessage(message);
		break;
		case "response":
		handleResponseMessage(message);
		break;
		case "offer":
		handleOfferMessage(message);
		break;
		case "answer":
		handleAnswerMessage(message);
		break;
	}

}

function hangUpCall(){
}

function handleRequestClick(targetId){
	//        ws.send(JSON.stringify({"type" : 'request', "data" : { "destination" : targetCookie} }));
	console.log('fiuck');
	if(targetId!= ''){
		ws.send(JSON.stringify({"type" : "request", "data" : {"source" : callSource, "destination" : targetId }}));
		console.log('send success to : ' + targetId);
	}
}

function handleRequestMessage(message) {
	console.log('from : ' + message.data.source);
	console.log('to : ' + message.data.destination);

	var confirmflag = confirm('call from : ' + message.data.source);
	if(confirmflag){ //if ACK
			ws.send(JSON.stringify({"type" : "response", "data" : {"accept" : true, "source" : callSource, "destination" : message.data.source}}));
	}
	else{ //if NAK
			ws.send(JSON.stringify({"type" : "response", "data" : {"false" : true, "source" : callSource, "destination" : message.data.source}}));
	}
}

function handleResponseMessage(message) {

	/* Check ACK or NAK */
	if (message.data.accept == true) { //ACK
		console.log("ACK call");
		//callDestination = message.data.source;
	}
	else { // NAK
		console.log("NAK call");

	}


	/* Create peerConnection */

}

function handleOfferMessage(message) {

	/* Set Destination to message.data.source */
	callDestination = message.data.source;

	/* Create peerConnection */
	if (peerConnection != null) {
		console.log('u have already opened RTCPeerConnection');
	}
	else {
		peerConnection = new RTCPeerConnection({
			'iceServers': [
				{
					'urls': 'stun:stun.l.google.com:19302'
				},
				{
					'urls': 'turn:192.158.29.39:3478?transport=udp',
					'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
					'username': '28224511:1379330808'
				},
				{
					'urls': 'turn:192.158.29.39:3478?transport=tcp',
					'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
					'username': '28224511:1379330808'
				}
			]
		});

		peerConnection.onicecandidate = handleICECandidateEvent;
	}

	/* Set RemoteDescription & Create and Send Answer */
	var description = new RTCSessionDescription(message.data.sdp);
	peerConnection.setRemoteDescription(description).then(function() {
		return peerConnection.addStream(video.srcObject);
	}).then(() => {
		return peerConnection.createAnswer();
	}).then((answer) => {
		peerConnection.setLocalDescription(answer);
	}).then(() => {
		ws.send({
			type: "answer",
			data: {
				source: callSource,
				destination: callDestination,
				sdp: peerConnection.localDescription
			}
		}.toString());
	});

}

function handleAnswerMessage(message) {

	var description = new RTCSessionDescription(message.data.sdp);

	peerConnection.setRemoteDescription(description);

}

function handleICECandidateEvent(event) {

	if (event.candidate) {
		ws.send({
			type: "candidate",
			data: {
				destination: callDestination,
				candidate: event.candidate
			}
		}.toString());
	}

}

function handleNegotiationNeededEvent(event) {

	peerConnection.createOffer().then(offer => {
		peerConnection.setLocalDescription(offer);
	}).then(() => {
		ws.send({
			type: "offer",
			data: {
				source: callSource,
				destination: callDestination
			}
		}.toString());
	});

}

function loadCallPage() {

	document.body.innerHTML = '';

	var cameraDiv = document.createElement("div");
	cameraDiv.setAttribute("id", "camara-div");
	document.body.appendChild(cameraDiv);

	var localVideo = document.createElement("video");
	localVideo.setAttribute("id", "local-video");
	localVideo.setAttribute("autoplay", "");
	localVideo.setAttribute("muted", "");
	var remoteVideo = document.createElement("video");
	remoteVideo.setAttribute("id", "remote-video");
	remoteVideo.setAttribute("autoplay", "");

	document.getElementById("camara-div").appendChild(localVideo);
	document.getElementById("camara-div").appendChild(remoteVideo);

}
