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

  ngOnInit(): void {
    this.video = document.getElementById("videoElement") as HTMLVideoElement;
  }

  onButtonClick() {
    // <reference types="webrtc" />
    // const getUserMedia = navigator.mediaDevices.getUserMedia ||
    //                  navigator.getUserMedia ||
    //                  navigator.webkitGetUserMedia ||
    //                  navigator.mozGetUserMedia;

    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          this.video.srcObject = stream;
        })
        .catch((error) => {
          console.log("Something went wrong!: " + error);
        });
    }
  }

}