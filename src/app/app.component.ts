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
  public videoElement: HTMLVideoElement;
  public videoInputs: MediaDeviceInfo[];
  public audioInputs: MediaDeviceInfo[];
  // optional
  public audioOutputs: MediaDeviceInfo[];
  public constraints: MediaStreamConstraints;
  private videoConstraints: boolean | MediaTrackConstraints;
  private audioConstraints: boolean | MediaTrackConstraints;

  ngOnInit(): void {
    this.videoElement = document.querySelector('#videoElement') as HTMLVideoElement;
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

  startVideo(constraints: MediaStreamConstraints): void {
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

    navigator.mediaDevices.getUserMedia(this.constraints)
      .then((stream) => {
        this.videoElement.srcObject = stream;
        this.videoElement.muted = true;
      })
      .catch((error) => {
        console.log('Something went wrong!: ' + error);
      });

  }

  stopVideo(): void {
    const stream = this.videoElement.srcObject as MediaStream;
    const tracks = stream.getTracks();

    tracks.forEach((track) => { track.stop(); });

    this.videoElement.srcObject = null;
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
