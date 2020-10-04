import { Component, OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import {WebcamImage, WebcamInitError, WebcamUtil} from 'ngx-webcam';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})


export class AppComponent implements OnInit {
  public video: HTMLVideoElement;
  public videoInputs: MediaDeviceInfo[];
  public audioInputs: MediaDeviceInfo[];
  // optional
  public audioOutputs: MediaDeviceInfo[];

  ngOnInit(): void {
    this.video = document.querySelector('#videoElement') as HTMLVideoElement;
    this.getIODevices();
  }

  // use Media Constraints to change camera. AT first stop() then StartVideo with appropriate constraints
  changeVideoInput() {

  }

  changeAudioIntpu() {

  }

  changeAudioOutput() {

  }

  startVideo(): void {
    const constraints = { audio: true, video: true }; 
    // for old browsers
    if (navigator.mediaDevices === undefined) {
      const navigator: any = {};

      if (navigator.mediaDevices.getUserMedia === undefined) {
        navigator.mediaDevices.getUserMedia = constraints => {

          // First get ahold of the legacy getUserMedia, if present
          const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia
            || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

          // Some browsers just don't implement it - return a rejected promise with an error
          // to keep a consistent interface
          if (!getUserMedia) {
            return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
          }
          // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
          return new Promise((resolve, reject) => {
            getUserMedia.call(navigator, constraints, resolve, reject);
          });
        };
      }
    }

    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        this.video.srcObject = stream;
      })
      .catch((error) => {
        console.log('Something went wrong!: ' + error);
      });

  }

  stopVideo(): void {
    const stream = this.video.srcObject as MediaStream;
    const tracks = stream.getTracks();

    tracks.forEach((track) => { track.stop(); });

    this.video.srcObject = null;
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
