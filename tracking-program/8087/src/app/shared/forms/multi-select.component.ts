import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormArray, FormBuilder, FormControl} from '@angular/forms';

@Component({
  selector: 'multi-select',
  template: `
    <input [(ngModel)]="filter" class="form-control" placeholder="Filter Meters">
    <div style="margin-top:10px;">
      <button type="button" class="default-button green-button pull-right" (click)="setAll(true)">Select All</button>
      <button type="button" class="default-button red-button" (click)="setAll(false)">Deselect All</button>
    </div>
    <div *ngFor="let control of formArray.controls | whereLike:['controls.name.value', filter]; let i = index; " class="checkbox">
      <label [formGroup]="control">
        <input type="checkbox" formControlName="value" (click)="select()">
        {{models[i].name}}
      </label>
    </div>
  `
})
export class MultiSelectComponent implements OnInit {
  @Input() formArray: FormArray;
  @Input() currentArray = [];
  @Input() dataSource;

  @Output() selected = new EventEmitter<any>();

  public models = [];
  protected originalArray = [];
  private filter;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit() {
    this.dataSource.subscribe(data => {
      this.models = data.response;
      this.setupFormGroup();
    });
  }

  select() {
    this.selected.emit(this.formArray.controls.reduce((acc, meter) => {
      return acc += meter.value.value;
    }, 0));
  }

  reset() {
    this.setupFormGroup();
    this.selected.emit(0);
  }

  isInCurrentArray(id) {
    return this.currentArray.find(model => {
      return model.id == id;
    })
  }

  setAll(value) {
    this.formArray.controls.forEach((control:any) => {
      control.patchValue({value: value});
    });
  }

  public setupFormGroup() {
    this.formArray.controls = [];
    for(let i in this.models) {
      this.formArray.push(
        this.formBuilder.group({
          value: new FormControl(this.isInCurrentArray(this.models[i].id) ? 1 : 0),
          name: this.models[i].name,
          id: this.models[i].id
        })
      );
      this.formArray.valueChanges.subscribe(value => {
        this.select();
      })
    }
  }
}
