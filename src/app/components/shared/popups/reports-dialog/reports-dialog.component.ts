import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogModule,
} from '@angular/material/dialog';
import { CustomButtonsComponent } from '../../custom-buttons/custom-buttons.component';

type ReportTabId = 'overview' | 'ownership' | 'land' | 'admin' | 'valuation' | 'encumbrances';
type ParcelStatus = 'Active' | 'Disputed' | 'Subdivided' | 'Acquired';

interface ParcelOwner {
  name: string;
  nic: string;
  share: string;
  since: string;
}

interface ParcelEncumbrance {
  type: string;
  institution: string;
  amount: string;
  date: string;
}

interface ParcelSummary {
  parcelId: string;
  surveyPlan: string;
  surveyDate: string;
  deedNo: string;
  registrationDate: string;
  landRegistryFolio: string;
  province: string;
  district: string;
  divisionalSecretariat: string;
  gnDivision: string;
  gnOfficer: string;
  wardNo: string;
  streetAddress: string;
  owners: ParcelOwner[];
  extent: { acres: number; roods: number; perches: number; sqMeters: number };
  landUse: string;
  zoning: string;
  buildingCoverage: string;
  floorAreaRatio: string;
  assessmentNo: string;
  annualValue: number;
  rates: number;
  ratesPaidUpto: string;
  encumbrances: ParcelEncumbrance[];
  boundaries: Record<'north' | 'south' | 'east' | 'west', string>;
  elevation: string;
  terrain: string;
  floodZone: string;
  soilType: string;
  utilities: string[];
  roadFrontage: string;
  accessRoad: string;
  lastUpdated: string;
  status: ParcelStatus;
}

@Component({
  selector: 'app-reports-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogClose,
    MatDialogActions,
    MatDialogContent,
    MatDialogModule,
    CustomButtonsComponent,
  ],
  templateUrl: './reports-dialog.component.html',
  styleUrl: './reports-dialog.component.css',
})
export class ReportsDialogComponent {
  readonly dialogData = inject<{ feature_id?: string | number; context?: string } | null>(
    MAT_DIALOG_DATA,
    { optional: true },
  );

  activeTab: ReportTabId = 'overview';
  tabs: Array<{ id: ReportTabId; label: string; count?: number }> = [];

  parcel: ParcelSummary = {
    parcelId: 'WP/COL/THI/GN-452/P-1078',
    surveyPlan: 'SP/2023/COL/4521',
    surveyDate: '2023-08-15',
    deedNo: 'D-2019/4782',
    registrationDate: '2019-03-22',
    landRegistryFolio: 'FR/COL/2019/8834',
    province: 'Western Province',
    district: 'Colombo',
    divisionalSecretariat: 'Thimbirigasyaya',
    gnDivision: 'Narahenpita South (452)',
    gnOfficer: 'H.M. Karunaratne',
    wardNo: '12',
    streetAddress: 'No. 47/2, Bauddhaloka Mawatha, Colombo 07',
    owners: [
      { name: 'W.A. Perera', nic: '199234500123', share: '1/2', since: '2019' },
      { name: 'K.D. Silva', nic: '198712300456', share: '1/2', since: '2019' },
    ],
    extent: { acres: 0, roods: 1, perches: 22.5, sqMeters: 726.8 },
    landUse: 'Residential',
    zoning: 'Residential Zone - Medium Density (R2)',
    buildingCoverage: '65%',
    floorAreaRatio: '2.5',
    assessmentNo: 'COL/THI/2024/A-3892',
    annualValue: 480000,
    rates: 24000,
    ratesPaidUpto: '2024-Q2',
    encumbrances: [
      {
        type: 'Mortgage',
        institution: 'Bank of Ceylon',
        amount: 'LKR 8,500,000',
        date: '2019-04-10',
      },
    ],
    boundaries: {
      north: 'P-1077 (D. Fernando)',
      south: 'Bauddhaloka Mawatha (40ft Road)',
      east: 'P-1079 (Municipal Land)',
      west: 'P-1076 (S. Jayawardena)',
    },
    elevation: '8m MSL',
    terrain: 'Flat',
    floodZone: 'Zone B (Low Risk)',
    soilType: 'Laterite',
    utilities: ['Electricity (LECO)', 'Pipe-borne Water (NWSDB)', 'Sewerage', 'Telephone'],
    roadFrontage: '12.2m on Bauddhaloka Mawatha',
    accessRoad: 'Class A - National Highway',
    lastUpdated: '2024-11-28',
    status: 'Active',
  };

  constructor() {
    this.tabs = [
      { id: 'overview', label: 'Overview' },
      { id: 'ownership', label: 'Ownership', count: this.parcel.owners.length },
      { id: 'land', label: 'Land Details' },
      { id: 'admin', label: 'Administrative' },
      { id: 'valuation', label: 'Valuation' },
      { id: 'encumbrances', label: 'Legal', count: this.parcel.encumbrances.length },
    ];
  }

  setTab(tab: ReportTabId): void {
    this.activeTab = tab;
  }

  get displayFeatureId(): string {
    return String(this.dialogData?.feature_id || this.parcel.parcelId);
  }

  get statusClass(): string {
    return `status-${this.parcel.status.toLowerCase()}`;
  }

  get quickStats(): Array<{ label: string; value: string; sub?: string }> {
    return [
      {
        label: 'Extent',
        value: `${this.parcel.extent.roods}R ${this.parcel.extent.perches}P`,
        sub: `${this.parcel.extent.sqMeters} m2`,
      },
      { label: 'Land Use', value: this.parcel.landUse },
      { label: 'District', value: this.parcel.district },
      { label: 'DS Division', value: this.parcel.divisionalSecretariat },
      { label: 'GN Division', value: this.parcel.gnDivision.split('(')[0].trim() },
    ];
  }

  get boundaryCards(): Array<{ short: string; label: string; value: string }> {
    return [
      { short: 'N', label: 'North', value: this.parcel.boundaries.north },
      { short: 'S', label: 'South', value: this.parcel.boundaries.south },
      { short: 'E', label: 'East', value: this.parcel.boundaries.east },
      { short: 'W', label: 'West', value: this.parcel.boundaries.west },
    ];
  }

  get adminHierarchy(): Array<{ level: string; value: string }> {
    return [
      { level: 'Province', value: this.parcel.province },
      { level: 'District', value: this.parcel.district },
      { level: 'Divisional Secretariat', value: this.parcel.divisionalSecretariat },
      { level: 'GN Division', value: this.parcel.gnDivision },
      { level: 'Ward', value: `Ward No. ${this.parcel.wardNo}` },
    ];
  }

  formatCurrency(amount: number): string {
    return `LKR ${amount.toLocaleString()}`;
  }

  downloadPdf(): void {
    const rawLines = this.buildPdfLines();
    const wrappedLines = this.wrapLines(rawLines, 105);
    const pages = this.splitIntoPages(wrappedLines, 46);
    const pdfData = this.createSimplePdf(pages);
    const pdfBuffer = this.toArrayBuffer(pdfData);

    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `parcel-report-${this.displayFeatureId.replace(/[^\w-]+/g, '_')}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private buildPdfLines(): string[] {
    const p = this.parcel;
    const lines: string[] = [];

    lines.push(`Feature ID: ${this.displayFeatureId}`);
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push('');

    lines.push('Summary');
    lines.push(`Parcel ID: ${p.parcelId}`);
    lines.push(`Status: ${p.status}`);
    lines.push(`Last Updated: ${p.lastUpdated}`);
    lines.push(`Address: ${p.streetAddress}`);
    lines.push(`District: ${p.district}`);
    lines.push(`GN Division: ${p.gnDivision}`);
    lines.push('');

    lines.push('Overview');
    lines.push(`Survey Plan No.: ${p.surveyPlan}`);
    lines.push(`Survey Date: ${p.surveyDate}`);
    lines.push(`Deed Number: ${p.deedNo}`);
    lines.push(`Registration Date: ${p.registrationDate}`);
    lines.push(`Land Registry Folio: ${p.landRegistryFolio}`);
    lines.push(`Assessment Number: ${p.assessmentNo}`);
    lines.push('');

    lines.push('Boundaries');
    lines.push(`North: ${p.boundaries.north}`);
    lines.push(`South: ${p.boundaries.south}`);
    lines.push(`East: ${p.boundaries.east}`);
    lines.push(`West: ${p.boundaries.west}`);
    lines.push('');

    lines.push('Ownership');
    p.owners.forEach((owner, index) => {
      lines.push(
        `${index + 1}. ${owner.name} | NIC: ${owner.nic} | Share: ${owner.share} | Since: ${owner.since}`,
      );
    });
    lines.push('');

    lines.push('Land Details');
    lines.push(
      `Extent: ${p.extent.acres} Ac, ${p.extent.roods} Rd, ${p.extent.perches} P (${p.extent.sqMeters} m2)`,
    );
    lines.push(`Land Use: ${p.landUse}`);
    lines.push(`Zoning: ${p.zoning}`);
    lines.push(`Building Coverage: ${p.buildingCoverage}`);
    lines.push(`Floor Area Ratio: ${p.floorAreaRatio}`);
    lines.push(`Elevation: ${p.elevation}`);
    lines.push(`Terrain: ${p.terrain}`);
    lines.push(`Flood Zone: ${p.floodZone}`);
    lines.push(`Soil Type: ${p.soilType}`);
    lines.push(`Road Frontage: ${p.roadFrontage}`);
    lines.push(`Access Road: ${p.accessRoad}`);
    lines.push('');

    lines.push('Utilities');
    p.utilities.forEach((utility, index) => lines.push(`${index + 1}. ${utility}`));
    lines.push('');

    lines.push('Administrative');
    lines.push(`Province: ${p.province}`);
    lines.push(`District: ${p.district}`);
    lines.push(`Divisional Secretariat: ${p.divisionalSecretariat}`);
    lines.push(`GN Division: ${p.gnDivision}`);
    lines.push(`Ward: ${p.wardNo}`);
    lines.push(`GN Officer: ${p.gnOfficer}`);
    lines.push('');

    lines.push('Valuation');
    lines.push(`Annual Value: ${this.formatCurrency(p.annualValue)}`);
    lines.push(`Annual Rates: ${this.formatCurrency(p.rates)}`);
    lines.push(`Rates Paid Up To: ${p.ratesPaidUpto}`);
    lines.push('');

    lines.push('Encumbrances & Legal');
    if (p.encumbrances.length) {
      p.encumbrances.forEach((enc, index) => {
        lines.push(
          `${index + 1}. ${enc.type} | Institution: ${enc.institution} | Amount: ${enc.amount} | Date: ${enc.date}`,
        );
      });
    } else {
      lines.push('No encumbrances registered against this parcel.');
    }

    return lines;
  }

  private wrapLines(lines: string[], maxChars: number): string[] {
    const wrapped: string[] = [];

    for (const rawLine of lines) {
      if (!rawLine) {
        wrapped.push('');
        continue;
      }

      const sanitized = rawLine.replace(/\s+/g, ' ').trim();
      if (sanitized.length <= maxChars) {
        wrapped.push(sanitized);
        continue;
      }

      let current = '';
      for (const word of sanitized.split(' ')) {
        if (!current.length) {
          current = word;
          continue;
        }

        const next = `${current} ${word}`;
        if (next.length <= maxChars) {
          current = next;
        } else {
          wrapped.push(current);
          current = word;
        }
      }

      if (current.length) {
        wrapped.push(current);
      }
    }

    return wrapped;
  }

  private splitIntoPages(lines: string[], linesPerPage: number): string[][] {
    const pages: string[][] = [];
    for (let i = 0; i < lines.length; i += linesPerPage) {
      pages.push(lines.slice(i, i + linesPerPage));
    }
    return pages.length ? pages : [[]];
  }

  private createSimplePdf(pages: string[][]): Uint8Array {
    const fontObjectId = 3 + pages.length * 2;
    const objects: Array<{ id: number; body: string }> = [];

    objects.push({ id: 1, body: '<< /Type /Catalog /Pages 2 0 R >>' });

    const kids = pages.map((_, pageIndex) => `${3 + pageIndex * 2} 0 R`).join(' ');
    objects.push({ id: 2, body: `<< /Type /Pages /Count ${pages.length} /Kids [ ${kids} ] >>` });

    pages.forEach((pageLines, pageIndex) => {
      const pageObjectId = 3 + pageIndex * 2;
      const contentObjectId = pageObjectId + 1;
      const content = this.buildPdfContentStream(pageLines);
      const contentLength = content.length;

      objects.push({
        id: pageObjectId,
        body:
          `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ` +
          `/Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
      });

      objects.push({
        id: contentObjectId,
        body: `<< /Length ${contentLength} >>\nstream\n${content}\nendstream`,
      });
    });

    objects.push({
      id: fontObjectId,
      body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    });

    objects.sort((a, b) => a.id - b.id);

    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [0];

    for (const obj of objects) {
      offsets[obj.id] = pdf.length;
      pdf += `${obj.id} 0 obj\n${obj.body}\nendobj\n`;
    }

    const xrefPosition = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';

    for (let i = 1; i <= objects.length; i++) {
      const offset = String(offsets[i] || 0).padStart(10, '0');
      pdf += `${offset} 00000 n \n`;
    }

    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
    pdf += `startxref\n${xrefPosition}\n%%EOF`;

    return new TextEncoder().encode(pdf);
  }

  private toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    const arrayBuffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(arrayBuffer).set(bytes);
    return arrayBuffer;
  }

  private buildPdfContentStream(lines: string[]): string {
    let stream = 'BT\n/F1 11 Tf\n40 802 Td\n14 TL\n';

    for (const line of lines) {
      const safe = this.escapePdfText(this.normalizeAscii(line));
      stream += `(${safe}) Tj\nT*\n`;
    }

    stream += 'ET';
    return stream;
  }

  private normalizeAscii(value: string): string {
    return value.replace(/[^\x20-\x7E]/g, '?');
  }

  private escapePdfText(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }
}
