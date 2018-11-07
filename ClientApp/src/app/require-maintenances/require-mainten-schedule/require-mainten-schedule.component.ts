import { Component, OnInit, OnDestroy, ViewContainerRef, ViewEncapsulation } from "@angular/core";
import { FormBuilder, FormGroup, FormControl, Validators } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
// rxjs
import { Observable } from "rxjs/Rx";
import { Subscription } from "rxjs/Subscription";
// model
import { OptionRequireMaintenance } from "../shared/option-require-maintenance.model";
import { RequireMaintenance } from "../shared/require-maintenance.model";
// 3rd patry
import { Column, SelectItem, LazyLoadEvent } from "primeng/primeng";
// service
import { DialogsService } from "../../dialogs/shared/dialogs.service";
import { AuthService } from "../../core/auth/auth.service";
import { RequireMaintenService } from "../shared/require-mainten.service";

@Component({
  selector: "app-require-mainten-schedule",
  templateUrl: "./require-mainten-schedule.component.html",
  styleUrls: ["./require-mainten-schedule.component.scss"]
})

export class RequireMaintenScheduleComponent implements OnInit, OnDestroy {

  constructor(
    private service: RequireMaintenService,
    private serviceDialogs: DialogsService,
    private serviceAuth: AuthService,
    private viewContainerRef: ViewContainerRef,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
  ) { }

  // Parameter
  // model
  columns: Array<any>;
  requireMaintenance: Array<any>;
  scrollHeight: string;
  subscription: Subscription;
  // time
  message: number = 0;
  count: number = 0;
  time: number = 1800;
  totalRecords: number;
  // value
  status: number | undefined;
  ProjectString: string;
  schedule: OptionRequireMaintenance;
  // form
  reportForm: FormGroup;

  // called by Angular after jobcard-waiting component initialized
  ngOnInit(): void {
    if (window.innerWidth >= 1600) {
      this.scrollHeight = 75 + "vh";
    } else if (window.innerWidth > 1360 && window.innerWidth < 1600) {
      this.scrollHeight = 68 + "vh";
    } else {
      this.scrollHeight = 65 + "vh";
    }

    this.requireMaintenance = new Array;
    this.buildForm();
  }

  // destroy
  ngOnDestroy(): void {
    if (this.subscription) {
      // prevent memory leak when component destroyed
      this.subscription.unsubscribe();
    }
  }

  // build form
  buildForm(): void {
    this.schedule = {
      Status: this.status || 1,
    };

    this.reportForm = this.fb.group({
      Filter: [this.schedule.Filter],
      ProjectId: [this.schedule.ProjectId],
      ProjectString: [this.ProjectString],
      SDate: [this.schedule.SDate],
      EDate: [this.schedule.EDate],
      Status: [this.schedule.Status],
      Skip: [this.schedule.Skip],
      Take: [this.schedule.Take],
    });

    this.reportForm.valueChanges
      .debounceTime(500)
      .subscribe((data: any) => this.onValueChanged(data));
    // this.onValueChanged();
  }

  // on value change
  onValueChanged(data?: any): void {
    if (!this.reportForm) { return; }
    this.schedule = this.reportForm.value;
    this.onGetData(this.schedule);
  }

  // get request data
  onGetData(schedule: OptionRequireMaintenance): void {
    this.service.getRequireMaintenanceSchedule(schedule)
      .subscribe(dbDataSchedule => {
        // console.log("Api Send is", dbDataSchedule);
        // debug here
        //console.log("JsonData", dbDataSchedule);

        this.totalRecords = dbDataSchedule.TotalRow;
        this.columns = new Array;

        let ColJobNumberWidth: string = "150px";
        let ColDateWidth: string = "250px";
        // column Main
        this.columns = new Array;
        this.columns.push({
          header: "Group item", field: "ItemTypeName",
          style: { "width": ColJobNumberWidth }, styleclass: "time-col",
        });

        let i: number = 0;
        for (let name of dbDataSchedule.Columns) {
          this.columns.push({
            header: name, field: name, style: { "width": ColDateWidth }, isCol: true,
          });
        }

        this.requireMaintenance = dbDataSchedule.DataTable.slice();
        // console.log("requireMaintenance is:", JSON.stringify(this.requireMaintenance));
        this.reloadData();
      }, error => {
        this.totalRecords = 0;
        this.columns = new Array;
        this.requireMaintenance = new Array;
        this.reloadData();
      });
  }

  // reload data
  reloadData(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.subscription = Observable.interval(1000)
      .take(this.time).map((x) => x + 1)
      .subscribe((x) => {
        this.message = this.time - x;
        this.count = (x / this.time) * 100;
        if (x === this.time) {
          if (this.reportForm.value) {
            this.onGetData(this.reportForm.value);
          }
        }
      });
  }

  // open dialog
  openDialog(type?: string): void {
    if (type) {
      if (type === "Project") {
        this.serviceDialogs.dialogSelectProject(this.viewContainerRef)
          .subscribe(project => {
            if (project) {
              this.reportForm.patchValue({
                ProjectId: project.ProjectCodeMasterId,
                ProjectString: `${project.ProjectCode}/${project.ProjectName}`,
              });
            }
          });
      }
    }
  }

  // reset
  resetFilter(): void {
    this.requireMaintenance = new Array;
    this.buildForm();
    this.onGetData(this.schedule);
  }

  // load Data Lazy
  loadDataLazy(event: LazyLoadEvent): void {
    // in a real application, make a remote request to load data using state metadata from event
    // event.first = First row offset
    // event.rows = Number of rows per page
    // event.sortField = Field name to sort with
    // event.sortOrder = Sort order as number, 1 for asc and -1 for dec
    // filters: FilterMetadata object having field as key and filter value, filter matchMode as value

    // imitate db connection over a network
    this.reportForm.patchValue({
      Skip: event.first,
      Take: (event.rows || 10),
    });
  }

  // on selected data
  onSelectRow(master?: RequireMaintenance): void {
    if (master) {
      if (master.ItemMaintenanceId) {
        this.serviceDialogs.dialogSelectItemMaintenance(master.ItemMaintenanceId, this.viewContainerRef,true)
          .subscribe(condition => {
            if (condition) {
              if (condition === 1) {
                this.router.navigate(["maintenance/actual-info/", master.ItemMaintenanceId]);
              }
            }
          });
      } else {
        this.serviceDialogs.dialogSelectRequireMaintenance(master.RequireMaintenanceId, this.viewContainerRef)
          .subscribe(conditionNumber => {
            if (conditionNumber) {
              if (conditionNumber === -1) {
                this.onUpdateRequireMaintenance(master.RequireMaintenanceId);
                setTimeout(() => { this.onGetData(this.reportForm.value); }, 750);
              } else if (conditionNumber === 1) {
                this.router.navigate(["maintenance/", master.RequireMaintenanceId]);
              }
            }
          });
      }
    }
  }
  // RequireMaintenance Has Action
  onUpdateRequireMaintenance(RequireMaintenanceId:number): void {
    this.service.actionRequireMaintenance(RequireMaintenanceId, (this.serviceAuth.getAuth.UserName || ""))
      .subscribe();
  }
}
