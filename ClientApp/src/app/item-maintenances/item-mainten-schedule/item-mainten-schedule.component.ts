import { Component, OnInit, OnDestroy, ViewContainerRef, ViewEncapsulation } from "@angular/core";
import { FormBuilder, FormGroup, FormControl, Validators } from "@angular/forms";
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
// rxjs
import { Observable } from "rxjs/Rx";
import { Subscription } from "rxjs/Subscription";
// model
import { OptionItemMaintenSchedule } from "../shared/option-item-mainten-schedule.model";
import { ItemMaintenance } from "../shared/item-maintenance.model";
// 3rd patry
import { Column, SelectItem, LazyLoadEvent } from "primeng/primeng";
// service
import { AuthService } from "../../core/auth/auth.service";
import { DialogsService } from "../../dialogs/shared/dialogs.service";
import { ItemMaintenService, ItemMaintenCommunicateService } from "../shared/item-mainten.service";
import { RequireMaintenService } from "../../require-maintenances/shared/require-mainten.service";
import { fadeInContent } from "@angular/material";

@Component({
  selector: 'app-item-mainten-schedule',
  templateUrl: './item-mainten-schedule.component.html',
  styleUrls: ['./item-mainten-schedule.component.scss']
})
export class ItemMaintenScheduleComponent implements OnInit, OnDestroy {
  /** paint-task-schedule ctor */
  constructor(
    private service: ItemMaintenService,
    private serviceRequire: RequireMaintenService,
    private serviceCom: ItemMaintenCommunicateService,
    private serviceDialogs: DialogsService,
    private serviceAuth: AuthService,
    private viewContainerRef: ViewContainerRef,
    private fb: FormBuilder,
    private router: Router,
    public route: ActivatedRoute) { }

  // Parameter
  // form
  reportForm: FormGroup;
  // model
  columnsUpper: Array<any>;
  columnsLower: Array<any>;
  columns: Array<any>;
  itemMaintenances: Array<any>;
  // subscription
  subscription: Subscription;
  subscription1: Subscription;
  // time
  message: number = 0;
  count: number = 0;
  time: number = 300;
  totalRecords: number;
  // mode
  mode: number | undefined;
  schedule: OptionItemMaintenSchedule;
  ItemMaintenanceId: number | undefined;
  ItemMaintenanceEdit: ItemMaintenance | undefined;
  canSave: boolean = false;
  // report
  isLinkMail: boolean = false;
  loadReport: boolean;
  ReportType?: string;
  // angular hook
  ngOnInit(): void {
    this.loadReport = false;
    this.ReportType = "";

    this.itemMaintenances = new Array;
    this.route.paramMap.subscribe((param: ParamMap) => {
      let key: number = Number(param.get("condition") || 0);

      // debug here
      // console.log("Mode is", key);

      if (key) {
        this.mode = key;

        let schedule: OptionItemMaintenSchedule = {
          Mode: this.mode
        };

        if (this.serviceAuth.getAuth) {
          if (this.mode === 1) {
            schedule.Creator = this.serviceAuth.getAuth.EmpCode;
            schedule.CreatorName = this.serviceAuth.getAuth.NameThai;
          }
        }

        this.buildForm(schedule);

        //if (this.reportForm) {
        //  this.onValueChanged();
        //}
      }
    }, error => console.error(error));

    this.subscription1 = this.serviceCom.ToParent$.subscribe(
      (TypeValue: [ItemMaintenance, boolean]) => {
        this.ItemMaintenanceEdit = TypeValue[0];
        this.canSave = TypeValue[1];
      });
  }

  // destroy
  ngOnDestroy(): void {
    if (this.subscription) {
      // prevent memory leak when component destroyed
      this.subscription.unsubscribe();
    }

    if (this.subscription1) {
      this.subscription1.unsubscribe();
    }
  }

  // build form
  buildForm(schedule?: OptionItemMaintenSchedule): void {
    if (!schedule) {
      schedule = {
        Mode: this.mode || 2,
      };
    }
    this.schedule = schedule;

    this.reportForm = this.fb.group({
      Filter: [this.schedule.Filter],
      ProjectMasterId: [this.schedule.ProjectMasterId],
      ProjectMasterString: [this.schedule.ProjectMasterString],
      Mode: [this.schedule.Mode],
      Skip: [this.schedule.Skip],
      Take: [this.schedule.Take],
      ItemMaintenanceId: [this.schedule.ItemMaintenanceId],
      RequireMaintenanceId: [this.schedule.RequireMaintenanceId],
      GroupMaintenanceId: [this.schedule.GroupMaintenanceId],
      Creator: [this.schedule.Creator],
      SDate: [this.schedule.SDate],
      EDate: [this.schedule.EDate],
      // template
      CreatorName: [this.schedule.CreatorName],
    });

    this.reportForm.valueChanges.subscribe((data: any) => this.onValueChanged(data));
    // this.onValueChanged();
  }

  // on value change
  onValueChanged(data?: any): void {
    if (!this.reportForm) { return; }

    this.schedule = this.reportForm.value;
    this.onGetTaskMasterSchedule(this.schedule);
  }

  // get task master schedule data
  onGetTaskMasterSchedule(schedule: OptionItemMaintenSchedule): void {
    if (this.ItemMaintenanceId) {
      schedule.ItemMaintenanceId = this.ItemMaintenanceId;
    }
    if (this.mode) {
      if (this.mode > 1) {
          this.service.getItemMaintenanceSchedule(schedule)
              .subscribe(dbDataSchedule => {
            this.onSetupDataTable(dbDataSchedule);
          }, error => {
            this.totalRecords = 0;
            this.columns = new Array;
            this.itemMaintenances = new Array;
            this.reloadData();
          });
        return;
      }
    }

    this.serviceRequire.getRequireMaintenanceWithItemMaintenanceSchedule(schedule)
      .subscribe(dbDataSchedule => {
        this.onSetupDataTable(dbDataSchedule);
      }, error => {
        this.columns = new Array;
        this.itemMaintenances = new Array;
        this.reloadData();
      });

  }

  // on setup datatable
  onSetupDataTable(dbDataSchedule: any): void {
    if (!dbDataSchedule || dbDataSchedule.length < 1) {
      this.columns = new Array;
      this.itemMaintenances = new Array;
      this.reloadData();
      return;
    }

    //Debug here Data Schedule
    // console.log("JsonData", JSON.stringify(dbDataSchedule));

    this.totalRecords = dbDataSchedule.TotalRow;

    this.columns = new Array;
    this.columnsUpper = new Array;

    let ProMasterWidth: string = "200px";
    let GroupMainWidth: string = "150px";
    let ItemWidth: string = "200px";
    let ProgressWidth: string = "100px";

    // column Row1
    this.columnsUpper.push({ header: "JobNo", rowspan: 2, style: { "width": ProMasterWidth, } });
    this.columnsUpper.push({ header: "GroupMTN", rowspan: 2, style: { "width": GroupMainWidth, } });
    this.columnsUpper.push({ header: "Item", rowspan: 2, style: { "width": ItemWidth, } });
    this.columnsUpper.push({ header: "Progress", rowspan: 2, style: { "width": ProgressWidth, } });

    for (let month of dbDataSchedule.ColumnsTop) {
      this.columnsUpper.push({
        header: month.Name,
        colspan: month.Value,
        style: { "width": (month.Value * 35).toString() + "px", }
      });
    }
    // column Row2
    this.columnsLower = new Array;

    for (let name of dbDataSchedule.ColumnsLow) {
      this.columnsLower.push({
        header: name,
        // style: { "width": "25px" }
      });
    }

    // column Main
    this.columns = new Array;
    this.columns.push({
      header: "JobNo",
      field: "ProjectMaster",
      style: { "width": ProMasterWidth, }
    });
    this.columns.push({
      header: "GroupMTN",
      field: "GroupMaintenance",
      style: { "width": GroupMainWidth, },
    });
    this.columns.push({
      header: "Item",
      field: "Item",
      style: { "width": ItemWidth, },
      isLink: true
    });
    this.columns.push({
      header: "Progress",
      field: "Progress",
      style: { "width": ProgressWidth, }
    });

    let i: number = 0;
    for (let name of dbDataSchedule.ColumnsAll) {
      if (name.indexOf("Col") >= -1) {
        this.columns.push({
          header: this.columnsLower[i], field: name, style: { "width": "35px" }, isCol: true,
        });
        i++;
      }
    }

    this.itemMaintenances = dbDataSchedule.DataTable.slice();
    this.reloadData();
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
            ;
            this.onGetTaskMasterSchedule(this.reportForm.value);
          }
        }
      });
  }

  // reset
  resetFilter(): void {
    this.itemMaintenances = new Array;
    this.buildForm();

    this.reportForm.patchValue({
      Skip: 0,
      Take: 10,
    });

    // this.onGetTaskMasterSchedule(this.reportForm.value);
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
      // mark Take: ((event.first || 0) + (event.rows || 4)),
      Take: (event.rows || 10),
    });
  }

  // on select dialog
  onShowDialog(type?: string): void {
    if (type) {
      if (type === "Employee") {
        this.serviceDialogs.dialogSelectEmployee(this.viewContainerRef)
          .subscribe(emp => {
            // console.log(emp);
            if (emp) {
              this.reportForm.patchValue({
                Creator: emp.EmpCode,
                CreatorName: `คุณ${emp.NameThai}`,
              });
            }
          });
      } else if (type === "Project") {
        this.serviceDialogs.dialogSelectProject(this.viewContainerRef)
          .subscribe(project => {
            if (project) {
              this.reportForm.patchValue({
                ProjectMasterId: project.ProjectCodeMasterId,
                ProjectMasterString: `${project.ProjectCode}/${project.ProjectName}`,
              });
            }
          });
      }
    }
  }

  // on update progress
  onSelectItemMaintenanceId(ItemMaintenanceId?: number): void {
    if (ItemMaintenanceId && this.mode) {
      if (this.mode > 1) {
        if (ItemMaintenanceId) {
          this.service.getOneKeyNumber({
            ItemMaintenanceId: ItemMaintenanceId || 0,
            PlanStartDate: new Date,
            PlanEndDate: new Date
          }).subscribe(dbData => {
            this.ItemMaintenanceEdit = dbData;
            setTimeout(() => this.serviceCom.toChildEdit(dbData), 1000);
          });
        }
      } else {
        // On Schedule readonly show dialog
        this.serviceDialogs.dialogSelectItemMaintenance(ItemMaintenanceId, this.viewContainerRef);
      }
    } else {
      this.serviceDialogs.error("Warning Message", "This maintenance not plan yet.", this.viewContainerRef);
    }
  }

  // on cancel edit
  onCancelEdit(): void {
    this.ItemMaintenanceEdit = undefined;
    this.canSave = false;
  }
 
  // on update data
  onUpdateToDataBase(): void {
    if (this.ItemMaintenanceEdit) {
      let tempValue: ItemMaintenance = Object.assign({}, this.ItemMaintenanceEdit);

      if (this.serviceAuth.getAuth) {
        tempValue.Modifyer = this.serviceAuth.getAuth.UserName || "";
      }
      // update data
      this.service.updateModelWithKey(tempValue).subscribe(
        (complete: any) => {
          console.log("complete", JSON.stringify(complete));
          this.serviceDialogs
            .context("System message", "Save completed.", this.viewContainerRef)
            .subscribe(result => {
              this.onCancelEdit();
              this.onGetTaskMasterSchedule(this.reportForm.value);
            });
        },
        (error: any) => {
          this.canSave = true;
          this.serviceDialogs.error("Failed !",
            "Save failed with the following error: Invalid Identifier code !!!", this.viewContainerRef);
        }
      );
    }
  }

  // on show report
  onShowReportPaint(ItemMaintenanceId?: number, type?: string): void {
    if (ItemMaintenanceId && type) {
      this.ItemMaintenanceId = ItemMaintenanceId;
      this.loadReport = !this.loadReport;
      this.ReportType = type;
    }
  }

  // on back from report
  onBack(): void {
    this.loadReport = !this.loadReport;
    this.ReportType = "";
    setTimeout(() => {
      if (this.ItemMaintenanceEdit) {
        this.serviceCom.toChildEdit(this.ItemMaintenanceEdit);
      }
    }, 500);
  }
}
