import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, SimpleChanges } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { APIsService } from '../../../services/api.service';
import { DrawService } from '../../../services/draw.service';
import { MapService } from '../../../services/map.service';
import { NotificationService } from '../../../services/notifications.service';
import { UserService } from '../../../services/user.service';
import { BuildingTabComponent } from '../building-tab/building-tab.component';
import { LoaderComponent } from '../loader/loader.component';

type BuildingV2SectionKey =
  | 'summary'
  | 'spatial'
  | 'utilities'
  | 'rrr'
  | 'units'
  | 'relationships'
  | 'metadata'
  | 'valuation';

@Component({
  selector: 'app-building-tab-v2',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, LoaderComponent, MatTooltipModule],
  templateUrl: './building-tab-v2.component.html',
  styleUrl: './building-tab-v2.component.css',
})
export class BuildingTabV2Component extends BuildingTabComponent {
  expandedSections: Record<BuildingV2SectionKey, boolean> = {
    summary: true,
    spatial: false,
    utilities: false,
    rrr: false,
    units: false,
    relationships: false,
    metadata: false,
    valuation: false,
  };

  constructor(
    notificationService: NotificationService,
    http: HttpClient,
    mapService: MapService,
    apiService: APIsService,
    drawService: DrawService,
    dialog: MatDialog,
    userService: UserService,
  ) {
    super(notificationService, http, mapService, apiService, drawService, dialog, userService);
  }

  override ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);

    const featureChange = changes['selected_feature_ID'];
    if (!featureChange || featureChange.previousValue === featureChange.currentValue) {
      return;
    }

    if (!this.selected_feature_ID) {
      return;
    }

    this.loadV2Data();
  }

  toggleSection(section: BuildingV2SectionKey): void {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  isSectionExpanded(section: BuildingV2SectionKey): boolean {
    return this.expandedSections[section] === true;
  }

  get isValuationEditMode(): boolean {
    return this.isTaxAssesmentInfoEditMode || this.isTaxInfoEditMode;
  }

  get lodLevelLabel(): string {
    if (!this.landInfo?.dimension_2d_3d) {
      return '-';
    }

    const raw = String(this.landInfo.dimension_2d_3d).toLowerCase();
    if (raw.includes('3')) {
      return 'LoD3';
    }
    if (raw.includes('2')) {
      return 'LoD2';
    }
    if (raw.includes('1')) {
      return 'LoD1';
    }
    return this.valueOrDash(this.landInfo.dimension_2d_3d);
  }

  get crsLabel(): string {
    return this.landInfo?.reference_coordinate ? 'WGS84' : '-';
  }

  get taxStatusLabel(): string {
    const outstanding = Number(this.lt_asses_and_tax?.outstanding_balance);
    if (!Number.isNaN(outstanding) && outstanding > 0) {
      return 'Overdue';
    }
    return 'Paid';
  }

  get lastUpdatedLabel(): string {
    return this.valueOrDash(
      this.lt_asses_and_tax?.date_of_valuation || this.lt_asses_and_tax?.tax_date,
    );
  }

  get responsiblePartyLabel(): string {
    return this.valueOrDash(this.summaryOwner || this.residents_infromation?.name);
  }

  startValuationEdit(): void {
    this.isTaxAssesmentInfoEditMode = true;
    this.isTaxInfoEditMode = true;
  }

  cancelValuationEdit(): void {
    this.isTaxAssesmentInfoEditMode = false;
    this.isTaxInfoEditMode = false;
  }

  saveValuation(): void {
    this.saveData('lt_asses');
    this.saveData('tax_info');
    this.cancelValuationEdit();
  }

  valueOrDash(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return String(value);
  }

  private loadV2Data(): void {
    this.getSummaryPermisions();
    this.getAdminPermisions();
    this.getLandOverViewPermisions();
    this.getUtilityPermisions();
    this.getTaxandAssessmentPermisions();
    this.getTaxInformationPermisions();
    this.getBuldingTenurePermisions();
    this.getResidentialPermisions();

    this.getDataOnCollapsibleClick('adminInfo');
    this.getDataOnCollapsibleClick('land_overview');
    this.getDataOnCollapsibleClick('lt_util_info');
    this.getDataOnCollapsibleClick('tax_and_asses_information');
    this.getDataOnCollapsibleClick('land_tenure');
    this.getDataOnCollapsibleClick('residents_infromation');
  }
}
