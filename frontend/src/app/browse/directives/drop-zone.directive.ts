import { Directive, ElementRef, OnInit, HostListener, Input } from '@angular/core';
import { Note } from 'types';
import { ApiService } from '@/api-service';

@Directive({
  selector: '[appDropZone]'
})
export class DropZoneDirective implements OnInit {
  @Input('appDropZone') noteId: Note['Record']['_id'];

  @HostListener('notedrop', ['$event'])
  public handleNoteDrop(e: CustomEvent<Note['Record']>) {
    this.apiService.note.moveNote(e.detail, this.noteId);
  }

  constructor(
    private el: ElementRef<HTMLElement>,
    private apiService: ApiService,
  ) { }

  ngOnInit(): void {
    this.el.nativeElement.classList.add('drop-zone');
    this.el.nativeElement.setAttribute('noteId', this.noteId);
  }
}
