import { Component, OnInit } from '@angular/core';
import { ApiService } from '@/services/api-service';

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
    this.apiService.note.addNote().subscribe();
  }
}
