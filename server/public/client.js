var ws = new WebSocket("ws://localhost:8080");
var localVideo = document.getElementById("local_video");
var remoteVideo = document.getElementById("remote_video");;

/*
var image = new Array();
for(var i = 0; i<9; i++){
	image[i] = document.getElementById("received_video_0"+i);
}
*/
var guest_box = document.getElementById("camera-container");

var guestArr = new Array();

for(var i=0; i<9; i++){
	guestArr[i] = document.createElement('h3');
	guestArr[i].id = "First_blank"+(i+1);
	guestArr[i].innerHTML = guestArr[i].id+"\n";
	guest_box.appendChild(guestArr[i]);
	guestArr[i].addEventListener('click', function(event){ handleRequestClick(event.target.id) });
}

var ScreenshotTimer = null;

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
	localVideo.srcObject = localStream;
	console.log('localStream is ', localStream);
	sendScreenshot(true);
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

function sendScreenshot(flag) {

	if (flag) { // Start
		ScreenshotTimer = setInterval(() => {
			try {
				var can = document.createElement("canvas");
				can.getContext('2d').drawImage(localVideo, 0, 0);
				var img = can.toDataURL('image/jpeg', 0.1);
				ws.send(JSON.stringify({
					"type": "screenshot",
					"data": {
						"image": img
					}
				}));

			} catch (e) {
				console.log('Unable to acquire screenshot: ' + e);
			}
		}, 3000);
	} else { // Stop
		clearInterval(ScreenshotTimer);
	}

}

function handleMessageEvent(event){
	var message = JSON.parse(event.data);
	console.log(message);
	switch(message.type){
		case "urls":
		handleUrlsMessage(message);
		break;
		case "request":
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
		case "candidate":
		handleCandidateMessage(message);
	}

}

function hangUpCall(){
}

function handleRequestClick(targetId){
	//        ws.send(JSON.stringify({"type" : 'request', "data" : { "destination" : targetCookie} }));
	if(targetId!= ''){
		ws.send(JSON.stringify({
			"type": "request",
			"data": {
				"source": callSource,
				"destination" : targetId
				}
			}));
		console.log('send success to : ' + targetId);
	}
}

function handleRequestMessage(message) {
	console.log('from : ' + message.data.source);
	console.log('to : ' + message.data.destination);

	var confirmflag = confirm('call from : ' + message.data.source);
	if(confirmflag){ //if ACK
		sendScreenshot(false);

			ws.send(JSON.stringify({
				"type": "response",
				"data": {
					"accept": true,
					"source": callSource,
					"destination": message.data.source
				}
			}));
	}
	else{ //if NAK
			ws.send(JSON.stringify({
				"type": "response",
				"data": {
					"false": true,
					"source": callSource,
					"destination": message.data.source
				}
			}));
	}
}

function handleResponseMessage(message) {

	/* Check ACK or NAK */
	if (message.data.accept == true) { //ACK

		sendScreenshot(false);

		console.log("ACK call");
		$.notify("Call Was Accepted!", "success");

		callDestination = message.data.source;
		//loadCallPage();

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
			peerConnection.onnegotiationneeded = handleNegotiationNeededEvent;
			peerConnection.onaddstream = handleAddStreamEvent;
		}

		peerConnection.addStream(localVideo.srcObject);
		console.log('finish addStream(localStream)', localVideo.srcObject);
	}
	else { // NAK
		console.log("NAK call");
		$.notify("Call Was Rejected T.T", "error");

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
		peerConnection.onnegotiationneeded = handleNegotiationNeededEvent;
		peerConnection.onaddstream = handleAddStreamEvent;
	}

	/* Set RemoteDescription & Create and Send Answer */
	var description = new RTCSessionDescription(message.data.sdp);
	peerConnection.setRemoteDescription(description).then(function() {
		return peerConnection.addStream(localVideo.srcObject);
	}).then(() => {
		return peerConnection.createAnswer();
	}).then((answer) => {
		peerConnection.setLocalDescription(answer);
	}).then(() => {
		ws.send(JSON.stringify({
			"type": "answer",
			"data": {
				"source": callSource,
				"destination": callDestination,
				"sdp": peerConnection.localDescription
			}
		}));
	});

}

function handleAnswerMessage(message) {

	var description = new RTCSessionDescription(message.data.sdp);

	peerConnection.setRemoteDescription(description);

}

function handleCandidateMessage(message) {

	var candidate = new RTCIceCandidate(message.data.candidate);

	peerConnection.addIceCandidate(candidate);

}

function handleICECandidateEvent(event) {

	if (event.candidate) {
		ws.send(JSON.stringify({
			"type": "candidate",
			"data": {
				"destination": callDestination,
				"candidate": event.candidate
			}
		}));
	}

}

function handleAddStreamEvent(event) {
	console.log("emitted addstream event!!!", event.stream);
  remoteVideo.srcObject = event.stream;
}

function handleNegotiationNeededEvent(event) {

	peerConnection.createOffer().then(offer => {
		peerConnection.setLocalDescription(offer);
	}).then(() => {
		ws.send(JSON.stringify({
			"type": "offer",
			"data": {
				"source": callSource,
				"destination": callDestination,
				"sdp": peerConnection.localDescription
			}
		}));
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

function handleUrlsMessage(message){

	for(var i = 0; i<9; i++){
		//				image[i].src = JSON.parse(event.data).guests[i]+'?t=' + new Date().getTime();
		var guest_num = "guest"+String(i+1);
		if(message.data.guests[guest_num] == null){
			guestArr[i].id = "blank"+(i+1);
		}
		else {
			guestArr[i].id = message.data.guests[guest_num];
		}
		guestArr[i].innerHTML = "Guest #"+ String(i+1)+" is "+ guestArr[i].id;
	}
	//              image.src = 'https://s3.ap-northeast-2.amazonaws.com/jehyunlims-bucket93/' + document.cookie + '.jpeg?t=' + new Date().getTime();

}
