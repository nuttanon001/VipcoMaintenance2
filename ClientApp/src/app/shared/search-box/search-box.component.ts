import {
  Component, OnInit, Input,
  Output, EventEmitter, ElementRef, 
} from "@angular/core";

// by importing just the rxjs operators we need, We're theoretically able
// to reduce our build size vs. importing all of them.
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/fromEvent";
import "rxjs/add/operator/map";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/debounceTime";
import "rxjs/add/operator/do";
import "rxjs/add/operator/switch";
import { transformMenu, MatCheckbox } from "@angular/material";

// import { YouTubeSearchService } from './you-tube-search.service';
// import { SearchResult } from './search-result.model';

@Component({
  selector: "search-box",
  template: `
    <mat-form-field>
        <input type="text" matInput placeholder="Search here..." maxlength="50" autofocus>
    </mat-form-field>
    <mat-checkbox [disabled]="isDisabled" class="w-50" [(ngModel)]="isOnlyCreate" (change)="onCondition($event)">
        Filter Only User
    </mat-checkbox>
  `
  // <input type="text" class="form-control" placeholder="Search" autofocus>
})
export class SearchBoxComponent implements OnInit {
  @Input() isDisabled: boolean = true;
  @Input() isOnlyCreate: boolean = false;
  @Output() search: EventEmitter<string> = new EventEmitter<string>();
  @Output() onlyCreate: EventEmitter<boolean> = new EventEmitter<boolean>();

  search2: string;
  onlyCreate2: boolean;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    if (this.isOnlyCreate) {
      this.onlyCreate2 = this.isOnlyCreate;
      this.onlyCreate.emit(this.isOnlyCreate);
    }
    // convert the `keyup` event into an observable stream
    Observable.fromEvent(this.el.nativeElement, "keyup")
      .map((e: any) => e.target.value) // extract the value of the input
         // .filter((text: string) => text.length > 1) // filter out if empty
        .debounceTime(500)                         // only once every 250ms
        .distinctUntilChanged()                    // not same value
        .subscribe(
        (results: any) => { // on sucesss
            // debug here
            // console.log("Results : ", results);
          this.search2 = results;
          this.search.emit(this.search2);
        });
  }

  // on More Codition
  onCondition(event?: any): void {
    // console.log("on Condition :", event);
    this.onlyCreate2 = event.checked;
    this.onlyCreate.emit(event.checked);
  }
}
