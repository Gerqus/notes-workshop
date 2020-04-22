import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {
  title = 'Notes Workshop';
  private imgsToPreloadSrcs: string[] = [
    '/assets/icons/expand_more-24px.svg',
    '/assets/icons/search-24px.svg',
    '/assets/icons/arrow_right_tip-24px.svg',
    '/assets/icons/arrow_right_full-24px.svg',
    '/assets/icons/drag_indicator-24px.svg',
  ];

  ngOnInit() {
    this.imgsToPreloadSrcs.forEach(this.preloadImage);
  }

  private preloadImage(imgSrc: string): void {
    const img = new Image();
    img.src = imgSrc;
  }
}
