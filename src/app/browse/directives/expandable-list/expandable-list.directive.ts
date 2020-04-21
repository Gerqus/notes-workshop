import { Directive, ElementRef, HostListener, HostBinding, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appExpandableList]'
})
export class ExpandableListDirective {
  private hostElement: HTMLElement;
  private iconElement: HTMLElement;

  private onClick(): void {
    if (!this.hostElement) {
      return;
    }
    this.iconElement.classList.toggle('expand-more');
    this.iconElement.classList.toggle('arrow-right');

    this.hostElement.classList.toggle('expanded');
  }

  constructor(el: ElementRef) {
    this.hostElement = el.nativeElement;

    this.iconElement = document.createElement('i');
    this.iconElement.classList.add('icon');
    this.iconElement.classList.add('arrow-right');
    this.iconElement.classList.add('action-button');

    this.hostElement.classList.remove('expanded');

    this.iconElement.addEventListener('click', () => this.onClick());

    el.nativeElement.appendChild(this.iconElement);
  }
}
