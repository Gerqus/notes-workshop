import { Component, OnInit } from '@angular/core';
import { ApiService } from '@/api.service';

@Component({
  selector: 'app-actions',
  templateUrl: './actions.component.html',
  styleUrls: ['./actions.component.less']
})
export class ActionsComponent implements OnInit {

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
  }

  public newNote() {
    this.apiService.addNote({
      title: 'test note title form frontend',
      content: 'sample note content',
    })
      .then(() => {
        console.log('Updating notes list...');
        this.apiService.updateNotesList();
      });
  }
}
