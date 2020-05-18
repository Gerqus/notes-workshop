import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.less']
})
export class WidgetComponent implements OnInit {
  @Input() widgetTitle: string;
  @Input() expandableId?: string;

  @Output('onClose') onCloseHandler = new EventEmitter<void>();

  constructor() { }

  ngOnInit(): void {
  }

  onClose(): void {
    this.onCloseHandler.emit();
  }

}
