import { Directive, ElementRef, Input, OnChanges } from '@angular/core';

@Directive({
  selector: '[appExpandable]'
})
export class ExpandableDirective implements OnChanges {
  @Input('appExpandable') appExpandable: boolean = true;
  private iconElement: HTMLElement;
  private isHostExpanded: boolean;

  private onClick(): void {
    if (!this.el.nativeElement) {
      return;
    }
    this.iconElement.classList.toggle('expand-more');
    this.iconElement.classList.toggle('arrow-right-tip');

    this.el.nativeElement.classList.toggle('expanded');
  }

  constructor(private el: ElementRef) {}

  ngOnChanges() {
    if (this.appExpandable === false) {
      if (this.iconElement) {
        this.iconElement.remove();
      }
      this.el.nativeElement.classList.remove('expanded');
      return;
    }

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
