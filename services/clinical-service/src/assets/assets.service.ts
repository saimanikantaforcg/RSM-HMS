import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from './asset.entity';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
  ) {}

  async getAssets(tenantId: string): Promise<Asset[]> {
    return this.assetRepo.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async scheduleMaintenance(data: any, tenantId: string): Promise<Asset> {
    if (data.assetId) {
      const asset = await this.assetRepo.findOne({ where: { id: data.assetId, tenantId } });
      if (!asset) throw new NotFoundException(`Asset ${data.assetId} not found`);
      asset.status = 'Under Maintenance';
      asset.nextMaintenance = data.date ?? null;
      return this.assetRepo.save(asset);
    }
    // Create new asset record if no ID
    const asset = this.assetRepo.create({
      tenantId,
      name: data.name ?? 'Equipment',
      department: data.department ?? null,
      status: 'Under Maintenance',
      nextMaintenance: data.date ?? null,
    });
    return this.assetRepo.save(asset);
  }

  async getRtlsPositions(tenantId: string) {
    const assets = await this.assetRepo.find({ where: { tenantId } });
    return assets.map(a => ({
      id: a.id,
      name: a.name,
      department: a.department,
      status: a.status,
      x: a.posX,
      y: a.posY,
      lastPing: a.lastPing,
    }));
  }
}
