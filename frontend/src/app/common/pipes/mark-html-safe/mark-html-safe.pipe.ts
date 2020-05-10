import { DomSanitizer } from '@angular/platform-browser'
import { PipeTransform, Pipe } from "@angular/core";

@Pipe({ name: 'markHTMLsafe'})
export class MarkHTMLSafePipe implements PipeTransform  {
  constructor(private sanitized: DomSanitizer) {}
  transform(value: string) {
    return this.sanitized.bypassSecurityTrustHtml(value);
  }
}