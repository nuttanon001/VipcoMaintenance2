import { RequireStatus } from "./require-maintenance.model";

export interface OptionRequireMaintenance {
  Filter?: string;
  ProjectId?: number;
  SDate?: Date;
  EDate?: Date;
  Skip?: number;
  Take?: number;
  /// <summary>
  /// </summary>
  Status?: RequireStatus;
}
