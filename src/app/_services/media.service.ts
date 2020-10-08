import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  streamToServer(model: any): any {
    return this.http.post(this.baseUrl + 'participants', model);
  }

}
