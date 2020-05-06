import { Directive, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { ExpandableDirectiveStateKeeperService } from '@/common/services/expandable-directive-state-keeper.service';
import { Subscription, BehaviorSubject } from 'rxjs';

@Directive({
  selector: '[appExpandable]'
})
export class ExpandableDirective implements OnChanges, OnInit, OnDestroy {
  @Input('canExpand') canExpand: boolean = true;
  @Input('itemId') itemId: string;
  private iconElement: HTMLElement;
  private expansionStateSubscription: Subscription;
  private expansionStateSubject: BehaviorSubject<boolean>;
  private expansionState: boolean;
  private initialized = false;

  constructor(
    private el: ElementRef<HTMLElement>,
    private expandableDirectiveStateKeeperService: ExpandableDirectiveStateKeeperService
  ) {
    this.iconElement = document.createElement('i');
    this.iconElement.classList.add('icon');
    this.iconElement.classList.add('action-button');
    this.iconElement.classList.add('minor');
    this.iconElement.classList.add('expansion-arrow');
    this.iconElement.addEventListener('getItemId', (e: CustomEvent) => {e.detail.cb(this.itemId)});
    this.iconElement.addEventListener('click', () => this.onIconClick());
  }

  ngOnChanges(changes: SimpleChanges): void {
    // z jakiegoś powodu notatka po doddaniu do niej wnuka otrzymuje stan expanded = false w serwisie. Taka notatka nie może się też w ogóle rozwinąć - może ma to związek?
    if (this.initialized) {
      if (this.canExpand) {
        this.iconElement.style.opacity = '1';
      } else {
        this.iconElement.style.opacity = '0';
        this.setExpansionState(false);
      }
      this.applyExpansionStyling(this.expansionStateSubject.getValue());
    }
  }

  ngOnInit(): void {
    this.expansionStateSubject = this.expandableDirectiveStateKeeperService.getStateSubject(this.itemId);

    if (this.el.nativeElement.classList.contains('expanded')) {
      this.setExpansionState(true);
    }

    if (this.canExpand) {
      this.iconElement.style.opacity = '1';
    } else {
      this.iconElement.style.opacity = '0';
      this.setExpansionState(false);
    }
    this.el.nativeElement.appendChild(this.iconElement);

    this.expansionStateSubscription = this.expansionStateSubject
      .subscribe((expansionState) => {
        this.applyExpansionStyling(expansionState);
      });

    this.initialized = true;
  }

  ngOnDestroy(): void {
    this.expansionStateSubscription.unsubscribe();
  }

  private onIconClick(): void {
    this.toggleExpansionState();
  }

  private applyExpansionStyling(expansionState: boolean): void {
    if (expansionState) {
      this.iconElement.classList.add('expand-more');
      this.iconElement.classList.remove('arrow-right-tip');
      this.el.nativeElement.classList.add('expanded');
    } else {
      this.iconElement.classList.add('arrow-right-tip');
      this.iconElement.classList.remove('expand-more');
      this.el.nativeElement.classList.remove('expanded');
    }
  }

  private setExpansionState(expansionState: boolean): void {
    this.expandableDirectiveStateKeeperService.setState(this.itemId, expansionState);
  }

  private toggleExpansionState(): void {
    this.expandableDirectiveStateKeeperService.toggleState(this.itemId);
  }
}
