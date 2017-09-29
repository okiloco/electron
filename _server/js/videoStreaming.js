var http = require('http');
var util = require('util');
var request = require('request');
var fs = require('fs');
var vapix = require('../lib/vapix');
var recorder = require('../lib/rtsprecorder');


function Streaming(options) {
  var camera = createCamera(options);
  
  this.playing = false;

  function createCamera(options){
  	return vapix.createCamera(options);
  }
  function createRecord(options){
  	options["cameraIP"] = camera.address;
  	var rec = recorder.createRecorder(options);
  	return rec;
  }


  function requestImage(options,callback){

    
    var image = camera.captureImage(options,callback);
  }

  
  return {
    requestImage:requestImage,
  	createRecord:createRecord
  }

}

var streaming = function(options){
	return new Streaming(options);
}

module.exports = streaming;