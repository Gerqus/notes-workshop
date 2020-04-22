import { Directive, ElementRef, HostBinding } from '@angular/core';

@Directive({
  selector: '[appExpandable]'
})
export class ExpandableDirective {
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

  constructor(el: ElementRef) {
    this.hostElement = el.nativeElement;

    this.iconElement = document.createElement('i');
    this.iconElement.classList.add('icon');
    this.iconElement.classList.add('action-button');

    this.isHostExpanded = (el.nativeElement as HTMLElement).classList.contains('expanded');

    if (this.isHostExpanded) {
      this.iconElement.classList.add('expand-more');
    } else {
      this.iconElement.classList.add('arrow-right-tip');
    }

    this.iconElement.addEventListener('click', () => this.onClick());

    el.nativeElement.appendChild(this.iconElement);
  }
}
