import { Component, OnInit } from '@angular/core';
import * as imgsToPreloadSrcs from  './imgsToPreloadSrcs.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {
  title = 'Notes Workshop';

  ngOnInit() {
    (imgsToPreloadSrcs as any as {default: string[]}).default.forEach(this.preloadImage);
  }

  private preloadImage(imgSrc: string): void {
    const img = new Image();
    img.src = imgSrc;
  }
}
