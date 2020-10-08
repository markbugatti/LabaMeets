import { Component, OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import {WebcamImage, WebcamInitError, WebcamUtil} from 'ngx-webcam';
import { MediaService} from './_services/media.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})


export class AppComponent implements OnInit {
  public localVideo: HTMLVideoElement;
  public remoteVideo: HTMLVideoElement;
  public videoInputs: MediaDeviceInfo[];
  public audioInputs: MediaDeviceInfo[];
  // optional
  public audioOutputs: MediaDeviceInfo[];
  public constraints: MediaStreamConstraints;
  private videoConstraints: boolean | MediaTrackConstraints;
  private audioConstraints: boolean | MediaTrackConstraints;
  private firstName = 'Mark';
  private lastName = 'Kravchenko';
  private localStream: MediaStream;

  offerOptions: RTCOfferOptions = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
  };

  pc1: RTCPeerConnection;
  pc2: RTCPeerConnection;
  constructor() { }

  ngOnInit(): void {
    this.localVideo = document.querySelector('#localVideo') as HTMLVideoElement;
    this.remoteVideo = document.querySelector('#remoteVideo') as HTMLVideoElement;
    
    this.getIODevices();
    this.constraints = { audio: true, video: true };
    this.videoConstraints = this.constraints.video;
    this.audioConstraints = this.constraints.audio;
    console.log(navigator.mediaDevices.getSupportedConstraints());
  
  }

  // use Media Constraints to change camera. AT first stop() then StartVideo with appropriate constraints
  changeVideoInput(deviceId: string): void {
    this.constraints = {
      audio: this.audioConstraints,
      video: {
        deviceId: deviceId,
      },
    }
    this.videoConstraints = this.constraints.video;
    this.stopVideo();
    this.startVideo(this.constraints);
  }

  changeAudioIntput(deviceId: string): void {
    this.constraints = {
      audio: {
        deviceId: deviceId,
        echoCancellation: true,
        noiseSuppression: true
      },
      video: this.videoConstraints
    }
    this.audioConstraints = this.constraints.audio;
    this.stopVideo();
    this.startVideo(this.constraints);
  }

  changeAudioOutput(deviceId: string) {

  }

  getName(pc): string {
    return (pc === this.pc1) ? 'pc1' : 'pc2';
  }

  getOtherPc(pc): RTCPeerConnection {
    return (pc === this.pc1) ? this.pc1 : this.pc2;
  }

  call(): void {
    let videoTracks = this.localStream.getVideoTracks();
    let audioTracks = this.localStream.getAudioTracks();
    let servers = null;

    const configuration = {
      iceServers: [{urls: 'stun:stun.l.google.com:19302'}]
    };
    // change congf to servers
    this.pc1 = new RTCPeerConnection(servers);
    console.log('Created local peer connection object pc1');
    this.pc1.onicecandidate = e => this.onIceCandidate(this.pc1, e);
    this.pc2 = new RTCPeerConnection(servers);
    console.log('Created remote peer connection object pc2');
    this.pc2.onicecandidate = e => this.onIceCandidate(this.pc2, e);
    this.pc1.oniceconnectionstatechange = e => this.onIceStateChange(this.pc1, e);
    this.pc2.oniceconnectionstatechange = e => this.onIceStateChange(this.pc2, e);
    this.pc2.ontrack = (event) => { this.gotRemoteStream(event, this.remoteVideo); };

    this.localStream.getTracks().forEach(
      track => {
        this.pc1.addTrack(
            track,
            this.localStream
        );
      }
    );
    console.log('Added local stream to pc1');
    
    this.pc1.createOffer(this.offerOptions)
      .then((desc) => this.onCreateOfferSuccess(desc, this.pc1, this.pc2), this.onCreateSessionDescriptionError);
  }

  onCreateOfferSuccess(desc: RTCSessionDescriptionInit, pc1: RTCPeerConnection, pc2: RTCPeerConnection): void {
    console.log(`Offer from pc1\n${desc.sdp}`);
    console.log('pc1 setLocalDescription start');
    pc1.setLocalDescription(desc);
    console.log('pc2 setRemoteDescription start');
    pc2.setRemoteDescription(desc);
    console.log('pc2 createAnswer start');
    // Since the 'remote' side has no media stream we need
    // to pass in the right constraints in order for it to
    // accept the incoming offer of audio and video.
    pc2.createAnswer().then((desc1) => this.onCreateAnswerSuccess(desc1, pc1, pc2), this.onCreateSessionDescriptionError);
  }

  onCreateAnswerSuccess(desc, pc1, pc2): void {
    console.log(`Answer from pc2:\n${desc.sdp}`);
    console.log('pc2 setLocalDescription start');
    pc2.setLocalDescription(desc).then(() => this.onSetLocalSuccess(pc2), this.onSetSessionDescriptionError);
    console.log('pc1 setRemoteDescription start');
    pc1.setRemoteDescription(desc).then(() => this.onSetRemoteSuccess(pc1), this.onSetSessionDescriptionError);
  }

  onSetLocalSuccess(pc) {
    console.log(`${this.getName(pc)} setLocalDescription complete`);
  }

  onSetRemoteSuccess(pc) {
    console.log(`${this.getName(pc)} setRemoteDescription complete`);
  }

  onCreateSessionDescriptionError(error) {
    console.log(`Failed to create session description: ${error.toString()}`);
  }

  onSetSessionDescriptionError(error) {
    console.log(`Failed to set session description: ${error.toString()}`);
  }

  onIceCandidate(pc: RTCPeerConnection, event: RTCPeerConnectionIceEvent) {
    this.getOtherPc(pc).addIceCandidate(event.candidate)
    .then(
        () => this.onAddIceCandidateSuccess(pc),
        err => this.onAddIceCandidateError(pc, err)
    );
    console.log(`${this.getName(pc)} ICE candidate: ${event.candidate ? event.candidate.candidate : '(null)'}`);
  }

  gotRemoteStream(e, video: HTMLVideoElement) {
    if (video.srcObject !== e.streams[0]) {
      video.srcObject = e.streams[0];
      console.log('pc2 received remote stream');
    }
  }

  onIceStateChange(pc, event) {
    if (pc) {
      console.log(`${this.getName(pc)} ICE state: ${pc.iceConnectionState}`);
      console.log('ICE state change event: ', event);
    }
  }

  onAddIceCandidateSuccess(pc) {
    console.log(`${this.getName(pc)} addIceCandidate success`);
  }
  
  onAddIceCandidateError(pc, error) {
    console.log(`${this.getName(pc)} failed to add ICE Candidate: ${error.toString()}`);
  }

  startVideo(constraints: MediaStreamConstraints): void {
    // for old browsers
    // if (navigator.mediaDevices === undefined) {
    //   const navigator: any = {};

    //   if (navigator.mediaDevices.getUserMedia === undefined) {
    //     navigator.mediaDevices.getUserMedia = constraints => {

    //       // First get ahold of the legacy getUserMedia, if present
    //       const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia
    //         || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    //       // Some browsers just don't implement it - return a rejected promise with an error
    //       // to keep a consistent interface
    //       if (!getUserMedia) {
    //         return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
    //       }
    //       // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
    //       return new Promise((resolve, reject) => {
    //         getUserMedia.call(navigator, constraints, resolve, reject);
    //       });
    //     };
    //   }
    // }

    navigator.mediaDevices.getUserMedia(this.constraints)
      .then((stream) => {
        this.localVideo.muted = true;
        this.localVideo.srcObject = stream;
        this.localStream = stream;
        console.log(this.localStream);
        //this.model.firstName = this.firstName;
        //this.model.lastName = this.lastName;
        //this.model.stream = stream;

        //this.mediaService.streamToServer(this.model);
      }).then(() => this.call())
      .catch((error) => {
        console.log('Something went wrong!: ' + error);
      });
    
  }

  stopVideo(): void {
    const stream = this.localVideo.srcObject as MediaStream;
    const tracks = stream.getTracks();

    tracks.forEach((track) => { track.stop(); });

    this.localVideo.srcObject = null;
  }

  getIODevices(): void {
    this.getConnectedDevices('videoinput').then(values => {
      this.videoInputs = values;
    }); // catch error

    this.getConnectedDevices('audioinput').then(values => {
      this.audioInputs = values;
    });

    this.getConnectedDevices('audiooutput').then(values => {
      this.audioOutputs = values;
    });
  }

  async getConnectedDevices(type): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === type);
  }

}
