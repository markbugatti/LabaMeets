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
  preview: any = document.getElementById("preview");
  recording: any = document.getElementById("recording");
  startButton: any = document.getElementById("startButton");
  stopButton: any = document.getElementById("stopButton");
  downloadButton: any = document.getElementById("downloadButton");
  logElement: any = document.getElementById("log");
  stream1: any;

  recordingTimeMS = 5000;

  ngOnInit(): void {

  }

  log(msg: string): void {
    this.logElement.innerHTML += msg + '\n';
  }

  wait(delayInMs): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, delayInMs));
  }

  startRecording(stream, lengthInMS): Promise<any> {
    const recorder = new MediaRecorder(stream);
    const data = [];

    recorder.ondataavailable = event => data.push(event.data);
    recorder.start();
    this.log(recorder.state + ' for ' + (lengthInMS/1000) + ' seconds...');

    const stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = event => reject(event.timeStamp);
    });

    const recorded = this.wait(lengthInMS).then(
      () => recorder.state === 'recording' && recorder.stop()
    );
 
    return Promise.all([
      stopped,
      recorded
    ])
    .then(() => data);
  }

  stop(stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  previewing(): void {
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).then(stream => {
      this.preview.srcObject = stream;
      this.downloadButton.href = stream;
      this.stream1 = stream;
      this.preview.captureStream = this.preview.captureStream || this.preview.mozCaptureStream;
      return new Promise(resolve => this.preview.onplaying = resolve);
    }).then(() => this.startRecording(this.preview.captureStream(), this.recordingTimeMS))
    .then (recordedChunks => {
      const recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
      this.recording.src = URL.createObjectURL(recordedBlob);
      this.downloadButton.href = this.recording.src;
      this.downloadButton.download = "RecordedVideo.webm";

      this.log("Successfully recorded " + recordedBlob.size + " bytes of " +
          recordedBlob.type + " media.");
    })
    .catch(this.log);
  }

}
