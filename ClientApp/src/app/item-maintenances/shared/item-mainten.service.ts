import { Injectable } from "@angular/core";
import { HttpClient, HttpParams, HttpHeaders } from "@angular/common/http";
// services
import { HttpErrorHandler } from "../../shared/http-error-handler.service";
// models
import { ItemMaintenance } from "../shared/item-maintenance.model";
// Base-Services
import { BaseRestService } from "../../shared/base-rest.service";
import { BaseCommunicateService } from "../../shared/base-communicate.service";
// rxjs
import { Observable } from "rxjs/Observable";
import { catchError } from "rxjs/operators";
import { OptionItemMaintenSchedule } from "./option-item-mainten-schedule.model";
import { retry } from "rxjs/operator/retry";

@Injectable()
export class ItemMaintenService extends BaseRestService<ItemMaintenance> {
  constructor(
    http: HttpClient,
    httpErrorHandler: HttpErrorHandler
  ) {
    super(
      http,
      "api/ItemMaintenance/",
      "ItemMaintenService",
      "ItemMaintenanceId",
      httpErrorHandler
    )
  }

  // ===================== Item Maintenance Report ===========================\\
  /**
   * Item Maintenance Report
   * @param ItmeMaintenanceId
   */
  getItemMaintenanceReport(ItmeMaintenanceId: number): Observable<any> {
    return this.http.get<any>(this.baseUrl + "ItemMaintenanceReport/", {
      params: new HttpParams().set("key", ItmeMaintenanceId.toString()) 
    }).pipe(catchError(this.handleError(this.serviceName + "/get item maintenance report", <any>{})));
  }

  // ===================== Item Maintenance Schedule ===========================\\
  /**
   * Item Maintenance Schedule
   * @param option = option for schedul item maintenance
   */
  getItemMaintenanceSchedule(option: OptionItemMaintenSchedule): Observable<any> {
    return this.http.post<any>(this.baseUrl + "Schedule/",JSON.stringify(option), {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
      })
    }).pipe(catchError(
      this.handleError(this.serviceName + "/get item maintenance schedule", new Array<any>())));
  }
}

@Injectable()
export class ItemMaintenCommunicateService extends BaseCommunicateService<ItemMaintenance> {
  constructor() { super(); }
}
