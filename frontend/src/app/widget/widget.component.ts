import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.less']
})
export class WidgetComponent implements OnInit {
  @Input() widgetTitle: string;
  @Input() expandableId?: string;

  constructor() { }

  ngOnInit(): void {
  }

}
