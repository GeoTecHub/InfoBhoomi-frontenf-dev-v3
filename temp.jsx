import { useState } from 'react';

const QUERY_CATEGORIES = {
  disaster: {
    label: 'Disaster & Risk',
    icon: '⚠',
    color: '#e74c3c',
    queries: [
      {
        id: 'flood_elev',
        name: 'Flood Risk by Elevation',
        description: 'Highlight parcels below a given elevation threshold',
        params: [
          { key: 'elevation', label: 'Max Elevation (m)', type: 'number', default: 5, unit: 'm' },
          {
            key: 'zone',
            label: 'Zone',
            type: 'select',
            options: [
              'All Wards',
              'Ward 1 - Fort',
              'Ward 2 - Pettah',
              'Ward 3 - Maradana',
              'Ward 4 - Slave Island',
              'Ward 5 - Kollupitiya',
            ],
          },
        ],
        sql: (p) =>
          `SELECT * FROM land_parcels\nWHERE elevation < ${p.elevation}\n  AND zone = '${p.zone}';`,
      },
      {
        id: 'river_buffer',
        name: 'River Proximity Analysis',
        description: 'Find parcels within buffer distance of rivers/canals',
        params: [
          { key: 'buffer', label: 'Buffer Distance', type: 'number', default: 100, unit: 'm' },
          {
            key: 'river',
            label: 'Water Body',
            type: 'select',
            options: [
              'All Rivers',
              'Kelani River',
              'Beira Lake',
              'Diyawanna Oya',
              'San Sebastian Canal',
            ],
          },
        ],
        sql: (p) =>
          `SELECT p.* FROM land_parcels p\nJOIN water_bodies w ON\n  ST_DWithin(p.geom, w.geom, ${p.buffer})\nWHERE w.name = '${p.river}';`,
      },
      {
        id: 'landslide_slope',
        name: 'Landslide Susceptibility',
        description: 'Identify parcels on steep slopes with risk factors',
        params: [
          { key: 'slope', label: 'Min Slope (°)', type: 'number', default: 30, unit: '°' },
          {
            key: 'soil',
            label: 'Soil Type',
            type: 'select',
            options: ['All Types', 'Laterite', 'Red-Yellow Podzolic', 'Alluvial', 'Bog & Half-Bog'],
          },
        ],
        sql: (p) =>
          `SELECT p.* FROM land_parcels p\nJOIN slope_data s ON ST_Intersects(p.geom, s.geom)\nJOIN soil_map sm ON ST_Intersects(p.geom, sm.geom)\nWHERE s.gradient > ${p.slope}\n  AND sm.soil_type = '${p.soil}';`,
      },
      {
        id: 'coastal_zone',
        name: 'Coastal Reservation Violations',
        description: 'Structures within the coastal buffer zone',
        params: [
          { key: 'buffer', label: 'Coastal Buffer', type: 'number', default: 100, unit: 'm' },
        ],
        sql: (p) =>
          `SELECT b.* FROM buildings b\nJOIN coastline c ON\n  ST_DWithin(b.geom, c.geom, ${p.buffer})\nWHERE b.permit_status != 'Approved';`,
      },
    ],
  },
  land: {
    label: 'Land & Property',
    icon: '🏗',
    color: '#2ecc71',
    queries: [
      {
        id: 'parcel_search',
        name: 'Parcel Search',
        description: 'Search by owner, deed, or assessment number',
        params: [
          {
            key: 'search_by',
            label: 'Search By',
            type: 'select',
            options: ['Owner Name', 'Deed Number', 'Assessment No', 'Survey Plan No'],
          },
          { key: 'value', label: 'Search Value', type: 'text', default: '' },
        ],
        sql: (p) =>
          `SELECT * FROM land_parcels\nWHERE ${p.search_by === 'Owner Name' ? 'owner_name' : p.search_by === 'Deed Number' ? 'deed_no' : p.search_by === 'Assessment No' ? 'assessment_no' : 'survey_plan_no'} \n  ILIKE '%${p.value}%';`,
      },
      {
        id: 'gov_land',
        name: 'Government Land Parcels',
        description: 'Identify all state-owned land within boundary',
        params: [
          {
            key: 'zone',
            label: 'GN Division',
            type: 'select',
            options: ['All Divisions', 'Colombo', 'Dehiwala', 'Moratuwa', 'Kotte', 'Maharagama'],
          },
        ],
        sql: (p) =>
          `SELECT * FROM land_parcels\nWHERE ownership_type = 'Government'\n  AND gn_division = '${p.zone}';`,
      },
      {
        id: 'land_use',
        name: 'Land Use Classification',
        description: 'Query parcels by current land use type',
        params: [
          {
            key: 'use_type',
            label: 'Land Use',
            type: 'select',
            options: [
              'Residential',
              'Commercial',
              'Industrial',
              'Agricultural',
              'Mixed Use',
              'Vacant',
            ],
          },
          {
            key: 'min_area',
            label: 'Min Area (perches)',
            type: 'number',
            default: 0,
            unit: 'perch',
          },
        ],
        sql: (p) =>
          `SELECT * FROM land_parcels\nWHERE land_use = '${p.use_type}'\n  AND area_perches >= ${p.min_area};`,
      },
      {
        id: 'vacant_land',
        name: 'Vacant / Undeveloped Land',
        description: 'Find undeveloped parcels above minimum area',
        params: [
          {
            key: 'min_area',
            label: 'Min Area (perches)',
            type: 'number',
            default: 10,
            unit: 'perch',
          },
          {
            key: 'zone',
            label: 'Zone',
            type: 'select',
            options: ['All Zones', 'Residential', 'Commercial', 'Mixed'],
          },
        ],
        sql: (p) =>
          `SELECT * FROM land_parcels\nWHERE land_use = 'Vacant'\n  AND area_perches >= ${p.min_area}\n  AND zoning = '${p.zone}';`,
      },
    ],
  },
  planning: {
    label: 'Urban Planning',
    icon: '🏙',
    color: '#3498db',
    queries: [
      {
        id: 'zoning_check',
        name: 'Zoning Compliance Check',
        description: 'Verify if land use conforms to zoning regulations',
        params: [
          {
            key: 'zone_type',
            label: 'Expected Zone',
            type: 'select',
            options: ['Residential', 'Commercial', 'Industrial', 'Conservation', 'Mixed Use'],
          },
        ],
        sql: (p) =>
          `SELECT * FROM land_parcels\nWHERE zoning = '${p.zone_type}'\n  AND land_use != zoning;`,
      },
      {
        id: 'road_widening',
        name: 'Road Widening Impact',
        description: 'Parcels affected by proposed road widening',
        params: [
          { key: 'road', label: 'Road Name', type: 'text', default: '' },
          { key: 'width', label: 'Widening Distance', type: 'number', default: 5, unit: 'm' },
        ],
        sql: (p) =>
          `SELECT p.* FROM land_parcels p\nJOIN road_centerlines r ON\n  ST_DWithin(p.geom, r.geom, ${p.width})\nWHERE r.road_name ILIKE '%${p.road}%';`,
      },
      {
        id: 'far_violation',
        name: 'FAR / Coverage Violations',
        description: 'Buildings exceeding floor area ratio or plot coverage',
        params: [
          { key: 'max_far', label: 'Max FAR', type: 'number', default: 2.5, unit: '' },
          { key: 'max_coverage', label: 'Max Coverage %', type: 'number', default: 65, unit: '%' },
        ],
        sql: (p) =>
          `SELECT b.*, p.assessment_no FROM buildings b\nJOIN land_parcels p ON\n  ST_Within(b.geom, p.geom)\nWHERE b.floor_area_ratio > ${p.max_far}\n  OR b.plot_coverage > ${p.max_coverage};`,
      },
      {
        id: 'building_permit',
        name: 'Building Permit Status',
        description: 'Query building applications by status and area',
        params: [
          {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: ['All', 'Pending', 'Approved', 'Rejected', 'Expired'],
          },
          {
            key: 'zone',
            label: 'Ward',
            type: 'select',
            options: ['All Wards', 'Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5'],
          },
        ],
        sql: (p) =>
          `SELECT * FROM building_permits\nWHERE status = '${p.status}'\n  AND ward = '${p.zone}'\nORDER BY application_date DESC;`,
      },
    ],
  },
  utilities: {
    label: 'Utilities & Infra',
    icon: '🔧',
    color: '#f39c12',
    queries: [
      {
        id: 'water_coverage',
        name: 'Water Supply Coverage Gap',
        description: 'Properties not connected to municipal water supply',
        params: [
          {
            key: 'zone',
            label: 'GN Division',
            type: 'select',
            options: ['All Divisions', 'Colombo', 'Dehiwala', 'Moratuwa', 'Kotte'],
          },
        ],
        sql: (p) =>
          `SELECT p.* FROM land_parcels p\nLEFT JOIN water_connections w\n  ON p.assessment_no = w.assessment_no\nWHERE w.id IS NULL\n  AND p.gn_division = '${p.zone}';`,
      },
      {
        id: 'drain_catchment',
        name: 'Drainage Catchment Analysis',
        description: 'Upstream parcels contributing to a drain outfall',
        params: [
          {
            key: 'outfall',
            label: 'Outfall Point',
            type: 'select',
            options: [
              'Outfall A - Beira',
              'Outfall B - Kelani',
              'Outfall C - Canal',
              'Outfall D - Coast',
            ],
          },
        ],
        sql: (p) =>
          `SELECT p.* FROM land_parcels p\nJOIN drainage_catchments dc\n  ON ST_Within(p.geom, dc.geom)\nWHERE dc.outfall_name = '${p.outfall}';`,
      },
      {
        id: 'waste_service',
        name: 'Waste Collection Gaps',
        description: 'Areas beyond collection route service radius',
        params: [
          { key: 'radius', label: 'Service Radius', type: 'number', default: 200, unit: 'm' },
        ],
        sql: (p) =>
          `SELECT p.* FROM land_parcels p\nWHERE NOT EXISTS (\n  SELECT 1 FROM waste_routes w\n  WHERE ST_DWithin(p.geom, w.geom, ${p.radius})\n);`,
      },
    ],
  },
  revenue: {
    label: 'Revenue & Tax',
    icon: '💰',
    color: '#9b59b6',
    queries: [
      {
        id: 'outstanding_rates',
        name: 'Outstanding Rates',
        description: 'Properties with unpaid rates or taxes',
        params: [
          {
            key: 'min_arrears',
            label: 'Min Arrears (LKR)',
            type: 'number',
            default: 10000,
            unit: 'LKR',
          },
          {
            key: 'ward',
            label: 'Ward',
            type: 'select',
            options: ['All Wards', 'Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5'],
          },
        ],
        sql: (p) =>
          `SELECT p.*, r.total_arrears\nFROM land_parcels p\nJOIN rate_ledger r\n  ON p.assessment_no = r.assessment_no\nWHERE r.total_arrears > ${p.min_arrears}\n  AND p.ward = '${p.ward}'\nORDER BY r.total_arrears DESC;`,
      },
      {
        id: 'trade_license',
        name: 'Trade License Status',
        description: 'Commercial establishments and license compliance',
        params: [
          {
            key: 'status',
            label: 'License Status',
            type: 'select',
            options: ['All', 'Active', 'Expired', 'Not Applied', 'Suspended'],
          },
        ],
        sql: (p) =>
          `SELECT e.*, p.geom\nFROM trade_licenses e\nJOIN land_parcels p\n  ON e.assessment_no = p.assessment_no\nWHERE e.license_status = '${p.status}';`,
      },
      {
        id: 'revenue_ward',
        name: 'Ward-wise Revenue Summary',
        description: 'Revenue collection vs arrears by ward',
        params: [
          {
            key: 'year',
            label: 'Financial Year',
            type: 'select',
            options: ['2024/2025', '2023/2024', '2022/2023', '2021/2022'],
          },
        ],
        sql: (p) =>
          `SELECT p.ward,\n  SUM(r.amount_collected) AS collected,\n  SUM(r.amount_due - r.amount_collected) AS arrears\nFROM rate_ledger r\nJOIN land_parcels p\n  ON r.assessment_no = p.assessment_no\nWHERE r.financial_year = '${p.year}'\nGROUP BY p.ward;`,
      },
    ],
  },
  environment: {
    label: 'Environment & Health',
    icon: '🌿',
    color: '#1abc9c',
    queries: [
      {
        id: 'sensitive_zone',
        name: 'Sensitive Zone Buffer',
        description: 'Parcels within buffer of environmental zones',
        params: [
          {
            key: 'zone_type',
            label: 'Zone Type',
            type: 'select',
            options: ['Wetland', 'Forest Reserve', 'Tank Bund', 'Mangrove', 'Wildlife Corridor'],
          },
          { key: 'buffer', label: 'Buffer Distance', type: 'number', default: 50, unit: 'm' },
        ],
        sql: (p) =>
          `SELECT p.* FROM land_parcels p\nJOIN environmental_zones ez\n  ON ST_DWithin(p.geom, ez.geom, ${p.buffer})\nWHERE ez.zone_type = '${p.zone_type}';`,
      },
      {
        id: 'dengue_hotspot',
        name: 'Dengue Hotspot Analysis',
        description: 'Correlate dengue cases with land use patterns',
        params: [
          { key: 'radius', label: 'Cluster Radius', type: 'number', default: 250, unit: 'm' },
          {
            key: 'period',
            label: 'Period',
            type: 'select',
            options: ['Last 30 Days', 'Last 90 Days', 'Last 6 Months', 'Last Year'],
          },
        ],
        sql: (p) =>
          `SELECT p.land_use,\n  COUNT(d.id) AS cases,\n  p.geom\nFROM dengue_reports d\nJOIN land_parcels p\n  ON ST_DWithin(d.geom, p.geom, ${p.radius})\nWHERE d.reported_date >= NOW()\n  - INTERVAL '${p.period === 'Last 30 Days' ? '30 days' : p.period === 'Last 90 Days' ? '90 days' : p.period === 'Last 6 Months' ? '6 months' : '1 year'}'\nGROUP BY p.land_use, p.geom;`,
      },
    ],
  },
  social: {
    label: 'Social & Services',
    icon: '👥',
    color: '#e67e22',
    queries: [
      {
        id: 'nearest_facility',
        name: 'Nearest Public Facility',
        description: 'Find closest facility from any location',
        params: [
          {
            key: 'facility',
            label: 'Facility Type',
            type: 'select',
            options: [
              'Hospital',
              'School',
              'Playground',
              'Library',
              'Police Station',
              'Fire Station',
            ],
          },
          { key: 'max_dist', label: 'Max Distance', type: 'number', default: 1000, unit: 'm' },
        ],
        sql: (p) =>
          `SELECT f.name, f.type,\n  ST_Distance(f.geom,\n    ST_SetSRID(ST_MakePoint(lon, lat), 4326)\n  ) AS distance\nFROM public_facilities f\nWHERE f.type = '${p.facility}'\nORDER BY distance\nLIMIT 5;`,
      },
      {
        id: 'underserved',
        name: 'Underserved Areas',
        description: 'Residential zones far from key services',
        params: [
          {
            key: 'facility',
            label: 'Service Type',
            type: 'select',
            options: ['School', 'Hospital', 'Public Transport', 'Market', 'Water Supply'],
          },
          { key: 'threshold', label: 'Min Distance', type: 'number', default: 500, unit: 'm' },
        ],
        sql: (p) =>
          `SELECT p.* FROM land_parcels p\nWHERE p.land_use = 'Residential'\n  AND NOT EXISTS (\n    SELECT 1 FROM public_facilities f\n    WHERE f.type = '${p.facility}'\n    AND ST_DWithin(p.geom, f.geom, ${p.threshold})\n  );`,
      },
    ],
  },
};

// Simulated map parcels for the mini-map
const MOCK_PARCELS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: 15 + (i % 10) * 9.2 + Math.random() * 3,
  y: 10 + Math.floor(i / 10) * 14 + Math.random() * 4,
  w: 6 + Math.random() * 4,
  h: 8 + Math.random() * 6,
  elevation: Math.random() * 15,
  risk: Math.random(),
}));

function MiniMap({ activeQuery, isRunning, results }) {
  const highlighted = results
    ? MOCK_PARCELS.filter((p) => {
        if (!activeQuery) return false;
        if (activeQuery.id === 'flood_elev') return p.elevation < 5;
        if (activeQuery.id === 'landslide_slope') return p.risk > 0.7;
        return p.risk > 0.5;
      })
    : [];

  return (
    <div
      style={{
        background: '#0a1628',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        height: '100%',
        minHeight: 380,
        border: '1px solid #1a2d4a',
      }}
    >
      {/* Grid overlay */}
      <svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0, opacity: 0.08 }}
      >
        {Array.from({ length: 20 }, (_, i) => (
          <line
            key={`h${i}`}
            x1="0"
            y1={`${i * 5}%`}
            x2="100%"
            y2={`${i * 5}%`}
            stroke="#4a9eff"
            strokeWidth="0.5"
          />
        ))}
        {Array.from({ length: 20 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={`${i * 5}%`}
            y1="0"
            x2={`${i * 5}%`}
            y2="100%"
            stroke="#4a9eff"
            strokeWidth="0.5"
          />
        ))}
      </svg>

      {/* Parcels */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute' }}
      >
        {/* Water body */}
        <path
          d="M 0 45 Q 25 38, 45 42 Q 65 46, 85 40 L 100 40 L 100 50 Q 80 52, 60 48 Q 35 44, 15 50 L 0 52 Z"
          fill="#0d3b66"
          opacity="0.5"
        />
        <path
          d="M 0 45 Q 25 38, 45 42 Q 65 46, 85 40"
          fill="none"
          stroke="#1a6fb5"
          strokeWidth="0.4"
          opacity="0.6"
        />

        {/* Road lines */}
        <line x1="5" y1="0" x2="5" y2="100" stroke="#1a2d4a" strokeWidth="1.2" />
        <line x1="50" y1="0" x2="50" y2="100" stroke="#1a2d4a" strokeWidth="0.8" />
        <line x1="0" y1="52" x2="100" y2="52" stroke="#1a2d4a" strokeWidth="1" />

        {MOCK_PARCELS.map((p) => {
          const isHit = highlighted.includes(p);
          return (
            <rect
              key={p.id}
              x={p.x}
              y={p.y}
              width={p.w}
              height={p.h}
              rx={0.5}
              fill={
                isHit
                  ? activeQuery?.id === 'flood_elev'
                    ? '#e74c3c'
                    : activeQuery?.id === 'landslide_slope'
                      ? '#f39c12'
                      : '#3498db'
                  : '#132744'
              }
              stroke={isHit ? '#fff' : '#1e3a5f'}
              strokeWidth={isHit ? 0.5 : 0.25}
              opacity={results ? (isHit ? 0.85 : 0.25) : 0.45}
              style={{
                transition: 'all 0.6s ease',
                filter: isHit ? 'drop-shadow(0 0 2px rgba(255,255,255,0.3))' : 'none',
              }}
            />
          );
        })}
      </svg>

      {/* Map controls */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {['+', '−', '◎'].map((t) => (
          <button
            key={t}
            style={{
              width: 30,
              height: 30,
              background: 'rgba(10,22,40,0.85)',
              border: '1px solid #1e3a5f',
              color: '#6ba3d6',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Scale bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <div
          style={{
            width: 60,
            height: 3,
            background: '#6ba3d6',
            borderRadius: 2,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: -2,
              width: 1,
              height: 7,
              background: '#6ba3d6',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: -2,
              width: 1,
              height: 7,
              background: '#6ba3d6',
            }}
          />
        </div>
        <span style={{ color: '#6ba3d6', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>
          500m
        </span>
      </div>

      {/* Coordinates */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          color: '#4a7a9b',
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        6.9271°N, 79.8612°E
      </div>

      {/* Status overlay */}
      {isRunning && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(10,22,40,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(2px)',
          }}
        >
          <div
            style={{
              color: '#4a9eff',
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              animation: 'pulse 1.5s ease infinite',
            }}
          >
            ◉ Processing spatial query...
          </div>
        </div>
      )}

      {results && !isRunning && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: 'rgba(10,22,40,0.9)',
            border: '1px solid #1e3a5f',
            borderRadius: 8,
            padding: '8px 14px',
          }}
        >
          <div
            style={{ color: '#4a9eff', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
          >
            ● {highlighted.length} features highlighted
          </div>
        </div>
      )}
    </div>
  );
}

function SQLPreview({ sql }) {
  const keywords = [
    'SELECT',
    'FROM',
    'WHERE',
    'JOIN',
    'ON',
    'AND',
    'OR',
    'NOT',
    'EXISTS',
    'AS',
    'LEFT',
    'ORDER',
    'BY',
    'GROUP',
    'LIMIT',
    'SUM',
    'COUNT',
    'DESC',
    'ILIKE',
    'IN',
    'INTERVAL',
    'NOW()',
  ];
  const functions = [
    'ST_DWithin',
    'ST_Within',
    'ST_Intersects',
    'ST_Distance',
    'ST_SetSRID',
    'ST_MakePoint',
  ];

  const highlightSQL = (text) => {
    let result = text;
    functions.forEach((fn) => {
      result = result.replace(new RegExp(`\\b${fn}\\b`, 'g'), `⟨FN⟩${fn}⟨/FN⟩`);
    });
    keywords.forEach((kw) => {
      result = result.replace(new RegExp(`\\b${kw}\\b`, 'g'), `⟨KW⟩${kw}⟨/KW⟩`);
    });
    return result.split('\n').map((line, i) => {
      const parts = line.split(/⟨\/?(?:KW|FN)⟩/);
      const tags = [...line.matchAll(/⟨(KW|FN)⟩([^⟨]+)⟨\/\1⟩/g)];
      let elements = [];
      let partIdx = 0;
      let tagIdx = 0;
      let fullStr = line;

      // Simple approach: just color keywords
      let colored = line;
      colored = colored.replace(/⟨KW⟩([^⟨]+)⟨\/KW⟩/g, `<kw>$1</kw>`);
      colored = colored.replace(/⟨FN⟩([^⟨]+)⟨\/FN⟩/g, `<fn>$1</fn>`);
      colored = colored.replace(/'([^']+)'/g, `<str>'$1'</str>`);
      colored = colored.replace(/\b(\d+\.?\d*)\b/g, `<num>$1</num>`);

      return (
        <div key={i} style={{ display: 'flex', gap: 12 }}>
          <span style={{ color: '#3a5068', minWidth: 20, textAlign: 'right', userSelect: 'none' }}>
            {i + 1}
          </span>
          <span
            dangerouslySetInnerHTML={{
              __html: colored
                .replace(/<kw>/g, '<span style="color:#c792ea;font-weight:600">')
                .replace(/<\/kw>/g, '</span>')
                .replace(/<fn>/g, '<span style="color:#82aaff">')
                .replace(/<\/fn>/g, '</span>')
                .replace(/<str>/g, '<span style="color:#c3e88d">')
                .replace(/<\/str>/g, '</span>')
                .replace(/<num>/g, '<span style="color:#f78c6c">')
                .replace(/<\/num>/g, '</span>'),
            }}
          />
        </div>
      );
    });
  };

  return (
    <div
      style={{
        background: '#0d1b2a',
        borderRadius: 8,
        padding: '12px 16px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        lineHeight: 1.7,
        color: '#a8c4d8',
        border: '1px solid #1a2d4a',
        overflowX: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 8,
          color: '#3a6080',
          fontSize: 10,
        }}
      >
        <span>⬡</span> PostGIS / SQL Preview
      </div>
      {highlightSQL(sql)}
    </div>
  );
}

export default function GISQueryBuilder() {
  const [activeCategory, setActiveCategory] = useState('disaster');
  const [activeQuery, setActiveQuery] = useState(null);
  const [params, setParams] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [showSQL, setShowSQL] = useState(false);
  const [history, setHistory] = useState([]);

  const category = QUERY_CATEGORIES[activeCategory];

  const selectQuery = (q) => {
    setActiveQuery(q);
    setResults(null);
    const defaults = {};
    q.params.forEach((p) => {
      defaults[p.key] = p.default !== undefined ? p.default : p.options?.[0] || '';
    });
    setParams(defaults);
    setShowSQL(false);
  };

  const runQuery = () => {
    setIsRunning(true);
    setResults(null);
    setTimeout(() => {
      setIsRunning(false);
      const count = Math.floor(Math.random() * 180) + 20;
      setResults({
        count,
        time: (Math.random() * 2 + 0.3).toFixed(2),
        query: activeQuery.name,
      });
      setHistory((prev) => [
        {
          query: activeQuery.name,
          category: category.label,
          time: new Date().toLocaleTimeString(),
          count,
        },
        ...prev.slice(0, 9),
      ]);
    }, 1800);
  };

  const generatedSQL = activeQuery ? activeQuery.sql(params) : '';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#070e1a',
        color: '#c8dae8',
        fontFamily: "'Segoe UI', 'SF Pro Display', -apple-system, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a1628; }
        ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 3px; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        body { margin: 0; background: #070e1a; }
      `}</style>

      {/* Header */}
      <header
        style={{
          background: 'linear-gradient(135deg, #0a1628 0%, #0f2035 100%)',
          borderBottom: '1px solid #1a2d4a',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #4a9eff, #1a6fb5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            ◈
          </div>
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#e8f0f8',
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: -0.3,
              }}
            >
              Municipal GIS Query Console
            </div>
            <div
              style={{ fontSize: 11, color: '#4a7a9b', fontFamily: "'JetBrains Mono', monospace" }}
            >
              Sri Lanka Urban Development Authority — Spatial Intelligence Platform
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              padding: '5px 12px',
              borderRadius: 20,
              background: '#0d2b1a',
              border: '1px solid #1a5c35',
              color: '#2ecc71',
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ● PostGIS Connected
          </div>
          <div
            style={{
              padding: '5px 12px',
              borderRadius: 20,
              background: '#1a1a2e',
              border: '1px solid #2a2a4a',
              color: '#a8b4c8',
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            EPSG:5235 — SL Grid
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div style={{ display: 'flex', height: 'calc(100vh - 65px)' }}>
        {/* Left sidebar - Categories */}
        <nav
          style={{
            width: 220,
            background: '#0a1628',
            borderRight: '1px solid #1a2d4a',
            padding: '16px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              padding: '0 16px 12px',
              fontSize: 10,
              color: '#3a6080',
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: 1.5,
            }}
          >
            Query Categories
          </div>
          {Object.entries(QUERY_CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => {
                setActiveCategory(key);
                setActiveQuery(null);
                setResults(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                background:
                  activeCategory === key
                    ? 'linear-gradient(90deg, rgba(74,158,255,0.1), transparent)'
                    : 'transparent',
                border: 'none',
                borderLeft:
                  activeCategory === key ? `3px solid ${cat.color}` : '3px solid transparent',
                color: activeCategory === key ? '#e8f0f8' : '#6a8aa8',
                cursor: 'pointer',
                fontSize: 13,
                textAlign: 'left',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{cat.icon}</span>
              <span style={{ fontWeight: activeCategory === key ? 600 : 400 }}>{cat.label}</span>
            </button>
          ))}

          {/* History */}
          {history.length > 0 && (
            <div
              style={{ marginTop: 'auto', borderTop: '1px solid #1a2d4a', padding: '12px 16px' }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: '#3a6080',
                  fontFamily: "'JetBrains Mono', monospace",
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  marginBottom: 8,
                }}
              >
                Recent Queries
              </div>
              {history.slice(0, 5).map((h, i) => (
                <div
                  key={i}
                  style={{
                    padding: '6px 0',
                    fontSize: 11,
                    color: '#4a7a9b',
                    borderBottom: '1px solid #0f1e30',
                    animation: 'slideIn 0.3s ease',
                  }}
                >
                  <div style={{ color: '#6ba3d6', fontSize: 11 }}>{h.query}</div>
                  <div style={{ fontSize: 10, marginTop: 2 }}>
                    {h.time} — {h.count} results
                  </div>
                </div>
              ))}
            </div>
          )}
        </nav>

        {/* Center - Query builder */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Query list + builder */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Query list */}
            <div
              style={{
                width: 300,
                borderRight: '1px solid #1a2d4a',
                padding: 16,
                overflowY: 'auto',
                background: '#0b1726',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: '#3a6080',
                  fontFamily: "'JetBrains Mono', monospace",
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  marginBottom: 12,
                }}
              >
                {category.icon} {category.label} Queries
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {category.queries.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => selectQuery(q)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      textAlign: 'left',
                      cursor: 'pointer',
                      background:
                        activeQuery?.id === q.id
                          ? `linear-gradient(135deg, ${category.color}18, ${category.color}08)`
                          : '#0d1f33',
                      border:
                        activeQuery?.id === q.id
                          ? `1px solid ${category.color}44`
                          : '1px solid #152a42',
                      transition: 'all 0.25s',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: activeQuery?.id === q.id ? '#e8f0f8' : '#8aaec4',
                        fontFamily: "'DM Sans', sans-serif",
                        marginBottom: 4,
                      }}
                    >
                      {q.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#4a6a82', lineHeight: 1.4 }}>
                      {q.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Parameter panel + map */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {activeQuery ? (
                <>
                  {/* Parameters */}
                  <div
                    style={{
                      padding: '20px 24px',
                      borderBottom: '1px solid #1a2d4a',
                      background: '#0b1726',
                      animation: 'fadeIn 0.3s ease',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 16,
                      }}
                    >
                      <div>
                        <h2
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: '#e8f0f8',
                            margin: 0,
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          {activeQuery.name}
                        </h2>
                        <p style={{ fontSize: 12, color: '#4a7a9b', marginTop: 4 }}>
                          {activeQuery.description}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => setShowSQL(!showSQL)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 6,
                            cursor: 'pointer',
                            background: showSQL ? '#1a2d4a' : 'transparent',
                            border: '1px solid #1e3a5f',
                            color: '#6ba3d6',
                            fontSize: 12,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {showSQL ? '⟨/⟩ Hide SQL' : '⟨/⟩ Show SQL'}
                        </button>
                        <button
                          onClick={runQuery}
                          disabled={isRunning}
                          style={{
                            padding: '8px 24px',
                            borderRadius: 6,
                            cursor: isRunning ? 'wait' : 'pointer',
                            background: isRunning
                              ? '#1a2d4a'
                              : `linear-gradient(135deg, ${category.color}, ${category.color}cc)`,
                            border: 'none',
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 600,
                            fontFamily: "'DM Sans', sans-serif",
                            opacity: isRunning ? 0.6 : 1,
                          }}
                        >
                          {isRunning ? '◌ Running...' : '▶ Execute Query'}
                        </button>
                      </div>
                    </div>

                    {/* Param inputs */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                      {activeQuery.params.map((p) => (
                        <div key={p.key} style={{ minWidth: 180, flex: '1 1 180px' }}>
                          <label
                            style={{
                              display: 'block',
                              fontSize: 11,
                              color: '#4a7a9b',
                              marginBottom: 6,
                              fontFamily: "'JetBrains Mono', monospace",
                              textTransform: 'uppercase',
                              letterSpacing: 0.8,
                            }}
                          >
                            {p.label}{' '}
                            {p.unit && <span style={{ color: '#3a5068' }}>({p.unit})</span>}
                          </label>
                          {p.type === 'select' ? (
                            <select
                              value={params[p.key] || ''}
                              onChange={(e) => setParams({ ...params, [p.key]: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: 6,
                                background: '#0d1b2a',
                                border: '1px solid #1e3a5f',
                                color: '#c8dae8',
                                fontSize: 13,
                                outline: 'none',
                                fontFamily: "'DM Sans', sans-serif",
                              }}
                            >
                              {p.options.map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={p.type}
                              value={params[p.key] ?? ''}
                              onChange={(e) =>
                                setParams({
                                  ...params,
                                  [p.key]:
                                    p.type === 'number' ? Number(e.target.value) : e.target.value,
                                })
                              }
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: 6,
                                background: '#0d1b2a',
                                border: '1px solid #1e3a5f',
                                color: '#c8dae8',
                                fontSize: 13,
                                outline: 'none',
                                fontFamily:
                                  p.type === 'number'
                                    ? "'JetBrains Mono', monospace"
                                    : "'DM Sans', sans-serif",
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* SQL Preview */}
                    {showSQL && (
                      <div style={{ marginTop: 16, animation: 'slideIn 0.3s ease' }}>
                        <SQLPreview sql={generatedSQL} />
                      </div>
                    )}

                    {/* Results bar */}
                    {results && !isRunning && (
                      <div
                        style={{
                          marginTop: 16,
                          padding: '10px 16px',
                          borderRadius: 8,
                          background: 'linear-gradient(135deg, rgba(46,204,113,0.08), transparent)',
                          border: '1px solid rgba(46,204,113,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          animation: 'slideIn 0.3s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ color: '#2ecc71', fontSize: 14 }}>✓</span>
                          <span
                            style={{
                              color: '#2ecc71',
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 12,
                            }}
                          >
                            Query returned <strong>{results.count}</strong> features in{' '}
                            {results.time}s
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {['Export CSV', 'Export SHP', 'Print Map'].map((action) => (
                            <button
                              key={action}
                              style={{
                                padding: '4px 12px',
                                borderRadius: 4,
                                background: 'transparent',
                                border: '1px solid #1e3a5f',
                                color: '#6ba3d6',
                                fontSize: 11,
                                cursor: 'pointer',
                                fontFamily: "'JetBrains Mono', monospace",
                              }}
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Map area */}
                  <div style={{ flex: 1, padding: 16 }}>
                    <MiniMap activeQuery={activeQuery} isRunning={isRunning} results={results} />
                  </div>
                </>
              ) : (
                /* Empty state */
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2a4a68',
                    textAlign: 'center',
                    padding: 40,
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>◈</div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: '#3a6080',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Select a Query to Begin
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: '#2a4a68',
                      marginTop: 8,
                      maxWidth: 360,
                      lineHeight: 1.6,
                    }}
                  >
                    Choose a category from the left panel and select a spatial or attribute query to
                    configure and execute against the municipal GIS database.
                  </div>
                  <div
                    style={{
                      marginTop: 24,
                      display: 'flex',
                      gap: 12,
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                    }}
                  >
                    {['Flood Analysis', 'Land Search', 'Zoning Check', 'Revenue Report'].map(
                      (tag) => (
                        <span
                          key={tag}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 20,
                            background: '#0d1f33',
                            border: '1px solid #1a2d4a',
                            fontSize: 12,
                            color: '#4a7a9b',
                          }}
                        >
                          {tag}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
