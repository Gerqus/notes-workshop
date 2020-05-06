import { Directive, ElementRef, OnInit, HostListener, Input } from '@angular/core';
import { Note } from 'types';
import { ApiService } from '@/api-service';
import { ExpandableDirectiveStateKeeperService } from '@/common/services/expandable-directive-state-keeper.service';

@Directive({
  selector: '[appDropZone]'
})
export class DropZoneDirective implements OnInit {
  @Input('appDropZone') parentNoteId: Note['Record']['_id'];

  constructor(
    private el: ElementRef<HTMLElement>,
    private apiService: ApiService,
    private expandableDirectiveStateKeeperService: ExpandableDirectiveStateKeeperService,
  ) { }

  ngOnInit(): void {
    this.el.nativeElement.classList.add('drop-zone');
    this.el.nativeElement.setAttribute('noteId', this.parentNoteId);
  }

  @HostListener('notedrop', ['$event'])
  public handleNoteDrop(e: CustomEvent<Note['Record']>) {
    this.apiService.note.moveNote(e.detail, this.parentNoteId);
    this.expandableDirectiveStateKeeperService.setState(this.parentNoteId, true); // will set value also for 'top' noteId, but it shouldn't be an issue (it's never read)
  }
}
