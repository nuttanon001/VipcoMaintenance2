import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
// service
import { HttpErrorHandler } from "../../shared/http-error-handler.service";
// models
import { ProjectMaster } from "./project-master.model";
// component
import { BaseRestService } from "../../shared/base-rest.service";
// rxjs
import { Observable } from "rxjs/Observable";

@Injectable()
export class ProjectMasterService extends BaseRestService<ProjectMaster> {
  constructor(
    http: HttpClient,
    httpErrorHandler: HttpErrorHandler
  ) {
    super(
      http,
      "api/ProjectCodeMaster/",
      "ProjectMasterService",
      "ProjectCodeMasterId",
      httpErrorHandler
    )
  }
}
