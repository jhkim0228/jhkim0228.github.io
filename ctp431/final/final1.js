var context;
var source = null;

var myAudioBuffer = null;
var sourceNode = null;
var mediaSourceNode = null;

var micOn = false;
var filePlayOn = false;

var filter;
var distortion;
var gain;

var micstream = null;
var gainController = null;


window.onload = function () {

    var micAudio = document.getElementById("micInput");
    micAudio.addEventListener("click", playMic, false);

    var fileAudio = document.getElementById("fileChooseInput");
    fileAudio.addEventListener("change", fileChanged, false);

    var _tone = document.getElementById("tone");
    _tone.addEventListener("change", tone_handler, false);

    var _dist = document.getElementById("dist");
    _dist.addEventListener("change", dist_handler, false);

    var _gain = document.getElementById("gain");
    _gain.addEventListener("change", gain_handler, false);

    //create audio context
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
    
    filter = context.createBiquadFilter();
    filter.type = "lowpass";

    distortion = context.createWaveShaper();
    gain = context.createGain();
}

function do_init() {
    context = new AudioContext();
    
    filter = context.createBiquadFilter();
    filter.type = "lowpass";

    distortion = context.createWaveShaper();
    gain = context.createGain();
}

function fileChanged(e) {
    var file = e.target.files[0];
    var fileReader = new FileReader();
    document.getElementById("fileName").value = file.name;
    fileReader.onload = fileLoaded;
    fileReader.readAsArrayBuffer(file);
}

function fileLoaded(e) {
    context.decodeAudioData(e.target.result, function (buffer) {
        myAudioBuffer = buffer;
    });
}


function playMic() {
    if (filePlayOn) {
        turnOffFileAudio();
    }

    if (micOn) {
        turnOffMicAudio();
        return;
    }

    if (!navigator.getUserMedia)
        navigator.getUserMedia = (navigator.getUserMedia({ audio: true }) || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

    if (!navigator.getUserMedia)
        alert("Error: getUserMedia not supported!");

    // get audio input streaming 				 
    navigator.getUserMedia({ audio: true }, onStream, onStreamError)

    micOn = true;

    var mic = document.getElementById("micInput");
    mic.innerHTML = 'Mic Off'
    
    do_filter();
}

// success callback
function onStream(stream) {
    mediaSourceNode = context.createMediaStreamSource(stream);
    if (micstream == null) { micstream = stream; }
//    if (gainController == null) { gainController = new MicGainController(); }
//    gainController.on();
    source = mediaSourceNode;
}

// errorCallback			 
function onStreamError(error) {
    console.error('Error getting microphone', error);

    micOn = false;
}

function playFile(anybuffer) {
    if (filePlayOn) {
        turnOffFileAudio();
        return;
    }

    if (micOn) {
        turnOffMicAudio();
    }
    sourceNode = context.createBufferSource();
    sourceNode.buffer = anybuffer;
    sourceNode.connect(context.destination);
    
    filePlayOn = true;

    var fileAudio = document.getElementById("fileAudio");
    fileAudio.innerHTML = 'File Audio Stop'

    source = sourceNode;

    do_filter();

    sourceNode.start(0);
}


function turnOffMicAudio() {
    var mic = document.getElementById("micInput");
    mic.innerHTML = 'Mic On'
    mediaSourceNode = null;
    micOn = false;
}

function turnOffFileAudio() {
    var fileAudio = document.getElementById("fileAudio");
    fileAudio.innerHTML = 'File Audio Play'
    sourceNode.stop(0);
    sourceNode = null;
    filePlayOn = false;
}

function tone_handler() {
    filter.frequency.value = 20 * Math.pow(10, this.value / 20);
}

function dist_handler() {
    distortion.curve = makeDistortionCurve(this.value);
}

function gain_handler() {
    gain.gain.value = Math.pow(10, this.value / 20);
}

function do_filter() {
    
    //connect
    source.connect(filter);
    filter.connect(distortion);
    distortion.connect(gain);
    gain.connect(context.destination);

}

function makeDistortionCurve(amount) {
    var k = typeof amount === 'number' ? amount : 50;
    var n_samples = 44100;
    var curve = new Float32Array(n_samples);
    var deg = Math.PI / 180;
    var i = 0;
    var x;
    for (; i < n_samples; ++i) {
        x = i * 2 / n_samples - 1;
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
};