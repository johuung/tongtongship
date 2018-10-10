var ws = new WebSocket("ws://localhost:8080");
var localVideo = document.getElementById("local_video");
var remoteVideo = document.getElementById("remote_video");
var refreshButton = document.getElementById("refresh_guest_member");
var guest_box = document.getElementById("remote_container");
var local_box = document.getElementById("local_container");

var guestArr = new Array();

for(var i=0; i<9; i++){
	guestArr[i] = document.createElement('img');
	guestArr[i].id = "blank"+i;
	guestArr[i].style.position = "absolute";
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
	video: {width : 320, height : 240}
};

navigator.mediaDevices.getUserMedia(constraints)
.then(function(localStream) {
	localVideo.srcObject = localStream;
	console.log('localStream is ', localStream);
	localVideo.width = constraints.video.width;
	localVideo.height = constraints.video.height;
	remoteVideo.width = localVideo.width;
	remoteVideo.height = localVideo.height;
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

function handleRefreshClick(){

}

function handleRequestClick(targetId){
	//        ws.send(JSON.stringify({"type" : 'request', "data" : { "destination" : targetCookie} }));
	if(targetId.substr(NaN,5)!= 'blank'){
		sendScreenshot(false);
		ws.send(JSON.stringify({
			"type": "request",
			"data": {
				"source": callSource,
				"destination" : targetId
				}
			}));
		console.log('send success to : ' + targetId);
	}
	else{
		console.log('click 0');
	}

	setLoadingImage(targetId);

}

function handleUrlsMessage(message){

	console.log("get urls message", message);

	setGuestArray(message);
	setGuestImage();
		for(var i in guestArr){
			console.log("#"+i+" "+guestArr[i].id);
		}

	//              image.src = 'https://s3.ap-northeast-2.amazonaws.com/jehyunlims-bucket93/' + document.cookie + '.jpeg?t=' + new Date().getTime();
}

function handleRequestMessage(message) {

	console.log("get response message", message);

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
					"accept": false,
					"source": callSource,
					"destination": message.data.source
				}
			}));
	}
}

function handleResponseMessage(message) {

	console.log("get response message", message);

	/* Check ACK or NAK */
	if (message.data.accept == true) { //ACK

		sendScreenshot(false);

		$.notify("Call Was Accepted!", "success");

		callDestination = message.data.source;
		//loadCallPage();


		/* Create peerConnection */
		if (peerConnection != null) {
			console.log('u have already opened RTCPeerConnection');
		}
		else {
			console.log("create peerConnection");
			peerConnection = new RTCPeerConnection({
				'iceServers': [
					{
						'urls': 'stun:stun3.l.google.com:19302'
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
			peerConnection.ontrack = handleTrackEvent;
			peerConnection.onsignalingStateChangeEvent = handleSignalingStateChangeEvent;
			peerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
		  peerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
		  peerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;

		}
		localVideo.srcObject.getTracks().forEach(track => {
			console.log("add track");
			peerConnection.addTrack(track, localVideo.srcObject);
		});

	}
	else { // NAK
		sendScreenshot(true);
		$.notify("Call Was Rejected T.T", "error");

	}


	/* Create peerConnection */

}

function handleOfferMessage(message) {

	console.log("get offer message", message);

	/* Set Destination to message.data.source */
	callDestination = message.data.source;

	/* Create peerConnection */
	if (peerConnection != null) {
		console.log('u have already opened RTCPeerConnection');
	}
	else {
		console.log("create peer connection");
		peerConnection = new RTCPeerConnection({
			'iceServers': [
				{
					'urls': 'stun:stun3.l.google.com:19302'
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
		//peerConnection.onnegotiationneeded = handleNegotiationNeededEvent;
		peerConnection.ontrack = handleTrackEvent;
		peerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
	  peerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
	  peerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;

	}

	/* Set RemoteDescription & Create and Send Answer */
	var description = new RTCSessionDescription(message.data.sdp);
	console.log("set remote description", message.data.sdp);
	peerConnection.setRemoteDescription(description).then(() => {
		console.log("remote description : ", peerConnection.remoteDescription);
		localVideo.srcObject.getTracks().forEach(track => {
			console.log("add track");
			peerConnection.addTrack(track, localVideo.srcObject);
		});
	}).then(() => {
		console.log("create answer");
		return peerConnection.createAnswer();
	}).then((answer) => {
		console.log("set local description");
		return peerConnection.setLocalDescription(answer);
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

//-------------------------------------------------- added

function handleVideoOfferMessage(message) {
	var localStream = null;

	targetUsername = message.name;
	createPeerConnection();

	var desc = new RTCSessionDescription(message.sdp);

	peerConnection.setRemoteDescription(desc).then(function () {
		return navigator.mediaDevices.getUserMedia(mediaConstraints);
	})
	.then(function(stream) {
		localStream = stream;

		document.getElementById("local_video").srcObject = localStream;
		return peerConnection.addStream(localStream);
	})
	.then(function() {
		return peerConnection.createAnswer();
	})
	.then(function(answer) {
		return peerConnection.setLocalDescription(answer);
	})
	.then(function() {
		var message = {
			name: myUsername,
			target: targetUsername,
			type: "video-answer",
			sdp: peerConnection.localDescription
		};
		sw.send(message);
	})
	.catch(handleGetUserMediaError);
}

function handleNewICECandidateMessage(message) {
	var candidate = new RTCIceCandidate(message.candidate);

	peerConnection.addIceCandidate(candidate)
		.catch(reportError);
}

function handleRemoveStreamEvent(event) {
	closeVideoCall();
}

function handleHangUpClick() {
	closeVideoCall();
	ws.send(JSON.stringify({
		"type": "hangup",
		"data": {
			"source": callSource,
			"destination": callDestination
		}
	}));
}

function closeVideoCall() {
	if (peerConnection) {
		if (remoteVideo.srcObject) {
			remoteVideo.srcObject.getTracks().forEach(track => track.stop());
			remoteVideo.srcObject = null;
		}

		if (localVideo.srcObject) {
			localVideo.srcObject.getTracks().forEach(track => track.stop());

			localVideo.srcObject = null;
		}

		peerConnection.close();
		peerConnection = null;
	}

	console.log("hang up");
	//document.getElementById("hangup-button").disabled = true;

	//targetUsername = null;
}

//------------------------------------------------------------------------------

function handleAnswerMessage(message) {

	console.log("get answer message", message);

	//var description = new RTCSessionDescription(message.data.sdp);
	console.log("set romote description", message.data.sdp);
	//peerConnection.setRemoteDescription(description);
	peerConnection.setRemoteDescription(message.data.sdp);
	console.log("(ans)remote description : ", peerConnection.remoteDescription);

}

function handleCandidateMessage(message) {

	console.log("get candidate message", message);

	var candidate = new RTCIceCandidate(message.data.candidate);

	peerConnection.addIceCandidate(candidate);

}

function handleICECandidateEvent(event) {

	console.log("ICECandidate event was emitted");

	if (event.candidate) {
		ws.send(JSON.stringify({
			"type": "candidate",
			"data": {
				"destination": callDestination,
				"source": callSource,
				"candidate": event.candidate
			}
		}));
	}

}

function handleTrackEvent(event) {

	console.log("Track event was emitted");

	if (remoteVideo.srcObject) return;
  remoteVideo.srcObject = event.streams[0];

	setRemoteVideo();

}

function handleNegotiationNeededEvent(event) {

	console.log("NegotiationNeeded event was emitted");

	console.log("create offer");
	peerConnection.createOffer().then(offer => {
		console.log("set local description");
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

function handleICEConnectionStateChangeEvent(event) {
  console.log("*** ICE connection state changed to " + peerConnection.iceConnectionState);

	switch(peerConnection.iceConnectionState) {
		case "closed":
		case "failed":
		case "disconnected":
			closeVideoCall();
			break;
	}
}

function handleSignalingStateChangeEvent(event) {
	console.log("SignalingStateChange event was emitted : ", peerConnection.signalingState);

	switch(peerConnection.signalingState) {
		case "closed":
			closeVideoCall();
			break;
	}
}

function handleICEGatheringStateChangeEvent(event) {
  console.log("*** ICE gathering state changed to: " + peerConnection.iceGatheringState);
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

function setGuestArray(message){

	for(var i in guestArr){
		var pastBool = 0;
		for(var j in message.data.guests){
			if(guestArr[i].id == message.data.guests[j]){
				pastBool = 1;
			}
		}
		if(pastBool == 0){
			guestArr[i].id = "blank"+i;
		}
	}

	for(var i in message.data.guests){
		var newBool = 0;
		for(var j in guestArr){
			if(message.data.guests[i] == guestArr[j].id){
				newBool = 1;
			}
		}
		if(newBool == 0){
			for(var k in guestArr){
				if(guestArr[k].id == "blank"+k){
					guestArr[k].id = message.data.guests[i];
					break;
				}
			}
		}
	}

}

function setGuestImage(){

	for(var i = 0; i<9; i++){
		guestArr[i].style.display = "";
		if(guestArr[i].id == "blank"+i){
			guestArr[i].src = 'http://www.kidsmathgamesonline.com/images/pictures/numbers600/number0.jpg';
		}
		else{
			guestArr[i].src = 'http://www.kidsmathgamesonline.com/images/pictures/numbers600/number'+String(i+1)+'.jpg';
		}
		guestArr[i].width = remoteVideo.width/3;
		guestArr[i].height = remoteVideo.height/3;
		guestArr[i].style.left = (String)(local_box.offsetLeft + 400 + guestArr[i].width*(i%3)) + 'px';

		if(i>=0 && i<3){
			guestArr[i].style.top = (String)(local_box.offsetTop) + 'px';
		}
		else if(i>=3 && i<6){
			guestArr[i].style.top = (String)(local_box.offsetTop + guestArr[i].height) + 'px';
		}
		else{
			guestArr[i].style.top = (String)(local_box.offsetTop + 2*guestArr[i].height) + 'px';
		}
	}

}

function setLoadingImage(targetId){

	var targetNum = 0;
	for(var i in guestArr){
		if(guestArr[i].id != targetId){
			guestArr[i].style.display = "none";
		}
		else {
			targetNum = i;
		}
	}
	guestArr[targetNum].style.top = (String)(local_box.offsetTop) + 'px';
	guestArr[targetNum].style.left = (String)(local_box.offsetLeft + 400 )+ 'px';
	guestArr[targetNum].width = remoteVideo.width;
	guestArr[targetNum].height = remoteVideo.height;

	console.log(guestArr[targetNum].style);

}

function offGuestImage(){

	for(var i in guestArr){
		guestArr[i].style.display = "none";
	}

}

function setRemoteVideo(){

	offGuestImage();
	remoteVideo.style.display = "";
  remoteVideo.style.position = "absolute";
	remoteVideo.style.top = (String)(local_box.offsetTop) + 'px';
	remoteVideo.style.left = (String)(local_box.offsetLeft + 400 ) + 'px';

	console.log(remoteVideo.style);
}
