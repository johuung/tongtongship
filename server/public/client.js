var ws = new WebSocket("ws://localhost");
var localVideo = document.getElementById("local_video");
var remoteVideo = document.getElementById("remote_video");
var refreshButton = document.getElementById("refresh_guest_member");
var guest_box = document.getElementById("guest_image_array");
var local_box = document.getElementById("local_container");
var remote_box = document.getElementById("remote_container");
//var ACKButton = document.getElementById("ACK_btn");
//var NAKButton = document.getElementById("NAK_btn");
var remoteButtons = document.getElementById("remote_container_buttons");
var on_guest_box = document.getElementById("on_guest_img_container");
var hangupButton = document.getElementById("hangup_button");

var onGuestImg = document.createElement('img');
on_guest_box.appendChild(onGuestImg);


var guestArr = new Array();

for(var i=0; i<9; i++){
	guestArr[i] = document.createElement('img');
	guestArr[i].id = "blank"+i;
//	guestArr[i].style.position = "absolute";
	guest_box.appendChild(guestArr[i]);
	guestArr[i].addEventListener('click', function(event){ handleRequestClick(event.target.id) });
	guestArr[i].onerror = function(e){	//error handle except IE
		e.target.src = '/static/images/failed.png';
	};
	/* error hande in IE
	guestArr[i].attachEvent("onerror", function(e){
		e.srcElement.src = '/static/images/failed.png';
	};
	*/
}

var ScreenshotTimer = null;
var LoadingTimer = null;

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
	audio: true,
	video: {width : 640, height : 480, frameRate: 30}
};

navigator.mediaDevices.getUserMedia(constraints)
.then(function(localStream) {
	localVideo.srcObject = localStream;
	console.log('localStream is ', localStream);
	//localVideo.width = constraints.video.width;
	//localVideo.height = constraints.video.height;
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
				can.width = 640;
				can.height = 480;
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
		break;
		case "complete_caller":
		handleCompleteMessage(message);
	}

}

function handleRefreshClick(){
	ws.send(JSON.stringify({
		"type": "refresh",
		"data": {
			"source": callSource
			}
		}));
		console.log("send refresh");
}

function handleRequestClick(targetId){
	//        ws.send(JSON.stringify({"type" : 'request', "data" : { "destination" : targetCookie} }));
	if(targetId.substr(NaN,5)!= 'blank'){
//		sendScreenshot(false);
		setLoadingImage(targetId);
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

	setLoadingImage(message.data.source);
//	ACKButton.style.display="";
//	NAKButton.style.display="";
	remoteButtons.style.display = "";

	callDestination = message.data.source;
/*
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
	*/

}

function handleResponseMessage(message) {

	console.log("get response message", message);

	/* Check ACK or NAK */
	if (message.data.accept == true) { //ACK

//		sendScreenshot(false);

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
						'urls': 'turn:numb.viagenie.ca',
						'credential': 'muazkh',
						'username': 'webrtc@live.com'
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
	}
	else { // NAK
//		sendScreenshot(true);
		$.notify("Call Was Rejected T.T", "error");
		refreshButton.style.display = "";
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
					'urls': 'turn:numb.viagenie.ca',
					'credential': 'muazkh',
					'username': 'webrtc@live.com'
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
	ws.send(JSON.stringify({
		"type": "hangup",
		"data": {
			"source": callSource,
			"destination": callDestination
		}
	}));
	closeVideoCall();
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

	location.reload(true);

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
		case "completed":
		sendScreenshot(false);
		remote_box.style.display = "none";
		localVideo.width = "160";
		localVideo.height = "120";
		hangupButton.style.display = "";
		ws.send(JSON.stringify({
			"type": "complete_caller",
			"data": {
				"source": callSource,
				"destination": callDestination
			}
		}));
		break;
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
/*
function imgError(image){
	image.onerror = "";
	image.src = '/static/images/failed.png';
	return true;
}
*/
function setGuestImage(){
	onGuestImg.style.display = "none";
	for(var i = 0; i<9; i++){
		guestArr[i].style.display = "";
		if(guestArr[i].id == "blank"+i){
			guestArr[i].src = '/static/images/waiting.jpg';
		}
		else{
			//guestArr[i].src = 'http://www.kidsmathgamesonline.com/images/pictures/numbers600/number'+String(i+1)+'.jpg';
			guestArr[i].src = 'userImages/'+guestArr[i].id+'?t=' + new Date().getTime();
//			guestArr[i].onerror = imgError(guestArr[i]);
		}
		/*
		guestArr[i].width = remoteVideo.width/3;
		guestArr[i].height = remoteVideo.height/3;
		*/
		/*
		guestArr[i].style.left = (String)(guest_box.offsetLeft + 400 + guestArr[i].width*(i%3)) + 'px';

		if(i>=0 && i<3){
			guestArr[i].style.top = (String)(guest_box.offsetTop) + 'px';
		}
		else if(i>=3 && i<6){
			guestArr[i].style.top = (String)(guest_box.offsetTop + guestArr[i].height) + 'px';
		}
		else{
			guestArr[i].style.top = (String)(guest_box.offsetTop + 2*guestArr[i].height) + 'px';
		}
		*/
	}

}

function refreshLoadingImage(flag, source){

	if (flag) { // Start
		LoadingTimer = setInterval(() => {
			try {
				onGuestImg.src = 'userImages/'+source+'?t=' + new Date().getTime();
			} catch (e) {
				console.log('Unable to Load Img: ' + e);
			}
		}, 3000);
	} else { // Stop
		clearInterval(LoadingTimer);
	}

}

function setLoadingImage(targetId){
/*
	var targetNum = 0;
	for(var i in guestArr){
		if(guestArr[i].id != targetId){
//			guestArr[i].style.display = "none";
		}
		else {
			targetNum = i;
		}
	}
	*/
//	onGuestImg.src = guestArr[targetNum].src;
	refreshButton.style.display = "none";
	refreshLoadingImage(true, targetId);
	offGuestImage();
	/*
	guestArr[targetNum].style.top = (String)(guest_box.offsetTop) + 'px';
	guestArr[targetNum].style.left = (String)(guest_box.offsetLeft + 400 )+ 'px';
	*/
	/*
	guestArr[targetNum].width = remoteVideo.width;
	guestArr[targetNum].height = remoteVideo.height;
	*/
	onGuestImg.width = remoteVideo.width;
	onGuestImg.height = remoteVideo.height;
	onGuestImg.style.display = "";
}

function offGuestImage(){

	for(var i in guestArr){
		guestArr[i].style.display = "none";
	}

}

function setRemoteVideo(){

	offGuestImage();
	onGuestImg.style.display = "none";
	remoteVideo.style.display = "";
	/*
  remoteVideo.style.position = "absolute";
	remoteVideo.style.top = (String)(guest_box.offsetTop) + 'px';
	remoteVideo.style.left = (String)(guest_box.offsetLeft + 400 ) + 'px';
*/
}

function handleACKBtn(){
console.log("send ACK");
		ws.send(JSON.stringify({
			"type": "response",
			"data": {
				"accept": true,
				"source": callSource,
				"destination": callDestination
			}
		}));

//		ACKButton.style.display="none";
//		NAKButton.style.display="none";
		remoteButtons.style.display="none";
		refreshLoadingImage(false, callDestination);
/*
		ACKButton.removeEventListener('click', handleACKBtn(message), true);
		NAKButton.removeEventListener('click', handleNAKBtn(message), true);
*/
}

function handleNAKBtn(){
console.log("send NAK");
	ws.send(JSON.stringify({
		"type": "response",
		"data": {
			"accept": false,
			"source": callSource,
			"destination": callDestination
		}
	}));

//	ACKButton.style.display="none";
//	NAKButton.style.display="none";
	remoteButtons.style.display="none";
	refreshButton.style.display = "";
	refreshLoadingImage(false, callDestination);
/*
	ACKButton.removeEventListener('click', handleACKBtn(message), true);
	NAKButton.removeEventListener('click', handleNAKBtn(message), true);
*/
}

function handleCompleteMessage(message){
	hangupButton.style.display = "";
	remote_box.style.display = "none";
	localVideo.width = "160";
	localVideo.height = "120";
	sendScreenshot(false);
	ws.send(JSON.stringify({
		"type": "complete_callee",
		"data": {
			"source": callSource
		}
	}));

}
