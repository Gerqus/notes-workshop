import { Component, OnInit } from '@angular/core';
import { Note } from 'types';

@Component({
  selector: 'app-browsers-section',
  templateUrl: './browsers-section.component.html',
  styleUrls: ['./browsers-section.component.less']
})
export class BrowsersSectionComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  public newBrowser(categoryToOpen: Note['Record']['_id'] = ''): void {

  }

}
