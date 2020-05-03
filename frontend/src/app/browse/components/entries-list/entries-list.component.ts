import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { Note } from 'types';
import { ApiService } from '@/api-service';

@Component({
  selector: 'app-entries-list',
  templateUrl: './entries-list.component.html',
  styleUrls: ['./entries-list.component.less']
})
export class EntriesListComponent implements OnInit {
  @Input() notes: Note['Record'][];
  public notesChildrenObservables: {
    [K: string]: Note['Record'][]
  } = {};

  constructor(
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    console.log('notes:', this.notes);
    this.notes.forEach(note => {
      this.apiService.note.getNotesChildren(note)
        .subscribe(childNotes => {
          this.notesChildrenObservables[note._id] = childNotes;
        })
    });
  }

  public notesTrackingFn = (note: Note['Record']) => note._id;
}
