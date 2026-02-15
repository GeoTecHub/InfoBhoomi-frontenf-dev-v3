import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, SimpleChanges } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { APIsService } from '../../../services/api.service';
import { DrawService } from '../../../services/draw.service';
import { MapService } from '../../../services/map.service';
import { NotificationService } from '../../../services/notifications.service';
import { UserService } from '../../../services/user.service';
import { LandTabComponent } from '../land-tab/land-tab.component';
import { LoaderComponent } from '../loader/loader.component';

type V2SectionKey =
  | 'identification'
  | 'spatial'
  | 'physical'
  | 'zoning'
  | 'rrr'
  | 'valuation'
  | 'relationships'
  | 'metadata';

@Component({
  selector: 'app-land-tab-v2',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    LoaderComponent,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './land-tab-v2.component.html',
  styleUrl: './land-tab-v2.component.css',
})
export class LandTabV2Component extends LandTabComponent {
  expandedSections: Record<V2SectionKey, boolean> = {
    identification: true,
    spatial: false,
    physical: false,
    zoning: false,
    rrr: false,
    valuation: false,
    relationships: false,
    metadata: false,
  };

  constructor(
    notificationService: NotificationService,
    http: HttpClient,
    mapService: MapService,
    apiService: APIsService,
    dialog: MatDialog,
    drawService: DrawService,
    changeDetectorRef: ChangeDetectorRef,
    userService: UserService,
  ) {
    super(
      notificationService,
      http,
      mapService,
      apiService,
      dialog,
      drawService,
      changeDetectorRef,
      userService,
    );
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

  toggleSection(section: V2SectionKey): void {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  isSectionExpanded(section: V2SectionKey): boolean {
    return this.expandedSections[section] === true;
  }

  get cadastralReference(): string {
    return this.valueOrDash(this.land_tenure?.reference_no || this.summaryAssessmentNo);
  }

  get parcelTypeLabel(): string {
    return this.valueOrDash(this.lt_asses_and_tax?.property_type || this.adminInfo?.sl_land_type);
  }

  get parcelStatusLabel(): string {
    return this.valueOrDash(this.summaryPropertyType || 'Active');
  }

  get landUseLabel(): string {
    return this.valueOrDash(this.landInfo?.ext_landuse_type);
  }

  get tenureTypeLabel(): string {
    return this.valueOrDash(this.land_tenure?.right_type);
  }

  get registrationDateLabel(): string {
    return this.valueOrDash(
      this.lt_asses_and_tax?.date_of_valuation || this.lt_asses_and_tax?.tax_date,
    );
  }

  get localAuthorityLabel(): string {
    return this.valueOrDash(this.adminInfo?.local_auth);
  }

  get areaLabel(): string {
    return this.valueOrDash(this.landInfo?.area);
  }

  get perimeterLabel(): string {
    return '-';
  }

  get geometryTypeLabel(): string {
    return 'Polygon';
  }

  get boundaryTypeLabel(): string {
    return this.valueOrDash(this.adminInfo?.sl_land_type || this.adminInfo?.administrative_type);
  }

  get verticesCountLabel(): string {
    return '-';
  }

  get crsLabel(): string {
    return '-';
  }

  get centroidLonLabel(): string {
    return this.parseRefCoordPart(0);
  }

  get centroidLatLabel(): string {
    return this.parseRefCoordPart(1);
  }

  get utilitiesLabel(): string {
    const values = [
      this.lt_util_Info?.water_supply,
      this.lt_util_Info?.sanitation_sewerage,
      this.lt_util_Info?.sanitation_gully,
      this.lt_util_Info?.drainage_system,
      this.lt_util_Info?.electricity,
      this.lt_util_Info?.garbage_disposal,
    ].filter((value) => !!value);

    return values.length ? values.join(', ') : '-';
  }

  get hasRoadAccess(): string {
    return this.adminInfo?.access_road ? 'Yes' : 'No';
  }

  get zoningCategoryLabel(): string {
    return this.valueOrDash(this.adminInfo?.administrative_type);
  }

  get maxCoverageLabel(): string {
    return this.valueOrDash(this.lt_asses_and_tax?.assessment_percentage);
  }

  get maxFarLabel(): string {
    return this.valueOrDash(this.lt_asses_and_tax?.tax_percentage);
  }

  get specialOverlayLabel(): string {
    return this.valueOrDash(this.adminInfo?.remark);
  }

  get rrrEntries(): any[] {
    const currentGroup = (this.rrrGroups || []).find((group: any) => group?.isCurrent);
    return Array.isArray(currentGroup?.rows) ? currentGroup.rows : [];
  }

  get annualTaxLabel(): string {
    return this.valueOrDash(this.anual_fee_of_tax || this.lt_asses_and_tax?.tax_annual_value);
  }

  get taxStatusLabel(): string {
    const outstanding = Number(this.lt_asses_and_tax?.outstanding_balance);
    if (!Number.isNaN(outstanding) && outstanding > 0) {
      return 'Overdue';
    }
    return 'Paid';
  }

  get metadataLastUpdatedLabel(): string {
    return this.valueOrDash(
      this.lt_asses_and_tax?.date_of_valuation || this.lt_asses_and_tax?.tax_date,
    );
  }

  get metadataResponsibleLabel(): string {
    return this.valueOrDash(this.summaryOwner);
  }

  get metadataSourceDocLabel(): string {
    return this.valueOrDash(this.land_tenure?.reference_no);
  }

  valueOrDash(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return String(value);
  }

  private parseRefCoordPart(index: number): string {
    const raw = this.landInfo?.reference_coordinate;
    if (!raw) return '-';

    const parts = String(raw)
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    return parts[index] || '-';
  }

  private loadV2Data(): void {
    this.getDataOnCollapsibleClick('adminInfo');
    this.getDataOnCollapsibleClick('land_overview');
    this.getDataOnCollapsibleClick('lt_util_info');
    this.getDataOnCollapsibleClick('tax_and_asses_information');
    this.getDataOnCollapsibleClick('land_tenure');

    this.getSummaryPermisions();
    this.getAdminPermisions();
    this.getLandOverViewPermisions();
    this.getUtilityPermisions();
    this.getTaxandAssessmentPermisions();
    this.getTaxInformationPermisions();
    this.getLandTenurePermisions();
    this.getRRRPermisions();
  }
}
