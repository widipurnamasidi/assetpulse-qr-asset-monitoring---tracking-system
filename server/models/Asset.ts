import { IAsset, AssetStatus, AssetCondition, IAssetCustody } from '../types/index.js';
import { generateAssetQRCode } from '../services/qrService.js';
import { TransactionSession } from './TransactionSession.js';

class AssetModel {
  private assets: IAsset[] = [];

  constructor() {
    this.seedInitialAssets();
  }

  private async seedInitialAssets() {
    interface SeedAsset {
      id: string;
      assetTag: string;
      name: string;
      category: string;
      serialNumber: string;
      modelNumber: string;
      manufacturer: string;
      status: AssetStatus;
      condition: AssetCondition;
      location: string;
      department: string;
      purchaseDate: string;
      purchaseCost: number;
      currentCustody?: IAssetCustody | null;
      lastAuditedAt?: string;
      lastAuditedBy?: string;
      specifications: Record<string, any>;
      notes?: string;
    }

    const rawSeeds: SeedAsset[] = [
      {
        id: 'ast_fluke_901',
        assetTag: 'AST-7102',
        name: 'Fluke 1738 Three-Phase Power Logger',
        category: 'Diagnostic & Electrical',
        serialNumber: 'FLK-99201948',
        modelNumber: 'Fluke 1738 Advanced',
        manufacturer: 'Fluke Corporation',
        status: 'available' as AssetStatus,
        condition: 'excellent' as AssetCondition,
        location: 'Warehouse B - Calibration Bay 2',
        department: 'Field Diagnostics & Survey',
        purchaseDate: '2025-04-12',
        purchaseCost: 5850.00,
        specifications: {
          voltageRange: '1000V RMS',
          frequency: '42.5 Hz to 69 Hz',
          calibrationValidUntil: '2027-04-12',
        },
        notes: 'Calibrated certified logger. Always pack hard shell case with current probes.',
      },
      {
        id: 'ast_leica_ts16',
        assetTag: 'AST-8492',
        name: 'Leica Viva TS16 Total Station Survey Kit',
        category: 'Survey Instruments',
        serialNumber: 'LCA-77341209',
        modelNumber: 'TS16 P 1" R1000',
        manufacturer: 'Leica Geosystems',
        status: 'checked_out' as AssetStatus,
        condition: 'good' as AssetCondition,
        location: 'Metro Rail Phase IV Field Station',
        department: 'Civil Engineering & Survey',
        purchaseDate: '2024-11-03',
        purchaseCost: 22400.00,
        currentCustody: {
          userId: 'usr_tech_01',
          name: 'Alex Rivera',
          email: 'alex.rivera@fieldops.com',
          department: 'Field Diagnostics & Survey',
          checkoutDate: '2026-09-20T08:30:00.000Z',
          expectedReturnDate: '2026-09-27T17:00:00.000Z',
          purpose: 'High-precision tunnel bore elevation and alignment monitoring',
          projectCode: 'PRJ-METRO-4B',
        },
        specifications: {
          angularAccuracy: '1 arc-second',
          distanceRange: '1000m reflectorless',
          prismTracking: 'ATRplus Auto-Target Recognition',
        },
        notes: 'Assigned to Alex Rivera for tunnel geodetic audit.',
      },
      {
        id: 'ast_thermal_flir',
        assetTag: 'AST-3901',
        name: 'FLIR T865 High-Resolution Infrared Thermal Camera',
        category: 'Thermal Imaging & Inspection',
        serialNumber: 'FLR-88310023',
        modelNumber: 'T865 42-Degree',
        manufacturer: 'Teledyne FLIR',
        status: 'available' as AssetStatus,
        condition: 'excellent' as AssetCondition,
        location: 'HQ Engineering Lab - Safe 1',
        department: 'Quality Assurance & Non-Destructive Testing',
        purchaseDate: '2025-08-22',
        purchaseCost: 18900.00,
        specifications: {
          detectorResolution: '640 x 480 (307,200 pixels)',
          tempRange: '-40°C to 2000°C',
          lens: '42° AutoCal',
        },
        notes: 'Optics cleaned post-inspection. Equipped with interchangeable lens kit.',
      },
      {
        id: 'ast_toughbook_55',
        assetTag: 'AST-2488',
        name: 'Panasonic Toughbook 55 Mk2 Rugged Laptop',
        category: 'Field Computing',
        serialNumber: 'TB55-4491028',
        modelNumber: 'FZ-55 Mk2 Core i7',
        manufacturer: 'Panasonic Toughbook',
        status: 'in_audit' as AssetStatus,
        condition: 'good' as AssetCondition,
        location: 'Field Site Alpha - Mobile Command Unit',
        department: 'Field Diagnostics & Survey',
        purchaseDate: '2025-02-14',
        purchaseCost: 3600.00,
        lastAuditedAt: '2026-09-21T14:15:00.000Z',
        lastAuditedBy: 'David Chen',
        specifications: {
          cpu: 'Intel Core i7-1185G7 vPro',
          ram: '32GB DDR4',
          storage: '1TB NVMe Encrypted OPAL',
          ruggedRating: 'MIL-STD-810H & IP53',
        },
        notes: 'Undergoing annual audit for hardware security compliance.',
      },
      {
        id: 'ast_honda_gen',
        assetTag: 'AST-6120',
        name: 'Honda EU7000is Inverter Field Generator',
        category: 'Power & Utilities',
        serialNumber: 'HND-5529188',
        modelNumber: 'EU7000iAT',
        manufacturer: 'Honda Power Equipment',
        status: 'under_maintenance' as AssetStatus,
        condition: 'needs_repair' as AssetCondition,
        location: 'Central Fleet Workshop - Bay 4',
        department: 'Facilities & Logistics',
        purchaseDate: '2024-06-19',
        purchaseCost: 4799.00,
        specifications: {
          maxOutput: '7000W 120/240V',
          engine: 'Honda GX390 EFI',
          fuelTank: '5.1 Gallons Fuel-Injected',
        },
        notes: 'Scheduled 500-hour fuel-injection nozzle servicing and oil change.',
      },
      {
        id: 'ast_dji_matrice',
        assetTag: 'AST-9104',
        name: 'DJI Matrice 350 RTK Industrial Inspection Drone',
        category: 'Aerial Inspection & LiDAR',
        serialNumber: 'DJI-M350-09318',
        modelNumber: 'Matrice 350 RTK + Zenmuse H20T',
        manufacturer: 'DJI Enterprise',
        status: 'available' as AssetStatus,
        condition: 'excellent' as AssetCondition,
        location: 'Hangar Bay 1 - Flight Ops Locker',
        department: 'Infrastructure Inspection',
        purchaseDate: '2025-10-05',
        purchaseCost: 14250.00,
        specifications: {
          flightTime: '55 Minutes max',
          payload: 'Zenmuse H20T Thermal + Laser Rangefinder',
          ipRating: 'IP55 Weather-resistant',
        },
        notes: 'FAA registered. Firmware updated to v08.01.24.',
      },
    ];

    for (const seed of rawSeeds) {
      const qrCodeDataUrl = await generateAssetQRCode(
        seed.assetTag,
        seed.id,
        seed.name,
        seed.serialNumber
      );

      this.assets.push({
        ...seed,
        currentCustody: seed.currentCustody || null,
        qrCodeDataUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  async findAll(filter: {
    status?: string;
    category?: string;
    condition?: string;
    search?: string;
    location?: string;
  } = {}): Promise<IAsset[]> {
    let list = [...this.assets];

    if (filter.status && filter.status !== 'all') {
      list = list.filter((a) => a.status === filter.status);
    }
    if (filter.category && filter.category !== 'all') {
      list = list.filter((a) => a.category === filter.category);
    }
    if (filter.condition && filter.condition !== 'all') {
      list = list.filter((a) => a.condition === filter.condition);
    }
    if (filter.location && filter.location !== 'all') {
      list = list.filter((a) => a.location.toLowerCase().includes(filter.location!.toLowerCase()));
    }
    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.assetTag.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.serialNumber.toLowerCase().includes(q) ||
          a.modelNumber.toLowerCase().includes(q) ||
          a.location.toLowerCase().includes(q) ||
          a.department.toLowerCase().includes(q) ||
          (a.currentCustody?.name && a.currentCustody.name.toLowerCase().includes(q))
      );
    }

    return list;
  }

  async findById(id: string): Promise<IAsset | undefined> {
    return this.assets.find((a) => a.id === id);
  }

  async findByTag(assetTag: string): Promise<IAsset | undefined> {
    const cleanTag = assetTag.trim().toUpperCase();
    return this.assets.find((a) => a.assetTag.toUpperCase() === cleanTag);
  }

  async create(data: Omit<IAsset, 'id' | 'qrCodeDataUrl' | 'createdAt' | 'updatedAt'>, session?: TransactionSession): Promise<IAsset> {
    const id = `ast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const qrCodeDataUrl = await generateAssetQRCode(data.assetTag, id, data.name, data.serialNumber);

    const newAsset: IAsset = {
      ...data,
      id,
      qrCodeDataUrl,
      currentCustody: data.currentCustody || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (session && session.inTransaction) {
      session.register({
        description: `Create asset ${newAsset.assetTag}`,
        execute: () => {
          this.assets.push(newAsset);
        },
        rollback: () => {
          const idx = this.assets.findIndex((a) => a.id === id);
          if (idx !== -1) this.assets.splice(idx, 1);
        },
      });
    } else {
      this.assets.push(newAsset);
    }

    return newAsset;
  }

  async updateWithSession(
    id: string,
    updates: Partial<IAsset>,
    session?: TransactionSession
  ): Promise<IAsset | null> {
    const asset = await this.findById(id);
    if (!asset) return null;

    const previousSnapshot = { ...asset };
    const merged = {
      ...asset,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (session && session.inTransaction) {
      session.register({
        description: `Update asset ${asset.assetTag} state`,
        execute: () => {
          const idx = this.assets.findIndex((a) => a.id === id);
          if (idx !== -1) {
            this.assets[idx] = merged;
          }
        },
        rollback: () => {
          const idx = this.assets.findIndex((a) => a.id === id);
          if (idx !== -1) {
            this.assets[idx] = previousSnapshot;
          }
        },
      });
      return merged;
    } else {
      const idx = this.assets.findIndex((a) => a.id === id);
      if (idx !== -1) {
        this.assets[idx] = merged;
      }
      return merged;
    }
  }

  getCategories(): string[] {
    const cats = new Set(this.assets.map((a) => a.category));
    return Array.from(cats);
  }

  getMetrics() {
    const total = this.assets.length;
    const available = this.assets.filter((a) => a.status === 'available').length;
    const checkedOut = this.assets.filter((a) => a.status === 'checked_out').length;
    const underMaintenance = this.assets.filter((a) => a.status === 'under_maintenance').length;
    const inAudit = this.assets.filter((a) => a.status === 'in_audit').length;
    const totalValue = this.assets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
    const utilizationRate = total > 0 ? Math.round((checkedOut / total) * 100) : 0;

    return {
      total,
      available,
      checkedOut,
      underMaintenance,
      inAudit,
      totalValue,
      utilizationRate,
    };
  }
}

export const Asset = new AssetModel();
