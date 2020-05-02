import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[appExpandable]'
})
export class ExpandableDirective implements OnInit {
  @Input('appExpandable') appExpandable: boolean;
  private hostElement: HTMLElement;
  private iconElement: HTMLElement;
  private isHostExpanded: boolean;

  private onClick(): void {
    if (!this.hostElement) {
      return;
    }
    this.iconElement.classList.toggle('expand-more');
    this.iconElement.classList.toggle('arrow-right-tip');

    this.hostElement.classList.toggle('expanded');
  }

  constructor(private el: ElementRef) {}

  ngOnInit() {
    if (!this.appExpandable) {
      return;
    }
    this.hostElement = this.el.nativeElement;

    this.iconElement = document.createElement('i');
    this.iconElement.classList.add('icon');
    this.iconElement.classList.add('action-button');
    this.iconElement.classList.add('minor');

    this.isHostExpanded = (this.el.nativeElement as HTMLElement).classList.contains('expanded');

    if (this.isHostExpanded) {
      this.iconElement.classList.add('expand-more');
    } else {
      this.iconElement.classList.add('arrow-right-tip');
    }

    this.iconElement.addEventListener('click', () => this.onClick());

    this.el.nativeElement.appendChild(this.iconElement);
  }
}
