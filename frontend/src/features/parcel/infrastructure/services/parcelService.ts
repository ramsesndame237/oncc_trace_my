import { injectable } from "tsyringe";
import type { ApiParcelResponse, CreateParcelData } from "../../domain";

@injectable()
export class ParcelService {

  formatArea(area: number): string {
    return `${area.toLocaleString('fr-FR')} m²`;
  }

  formatCoordinates(latitude?: number, longitude?: number): string {
    if (!latitude || !longitude) return 'Non renseignées';
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }

  formatParcelCode(code: string): string {
    return code.toUpperCase();
  }

  validateParcelData(data: CreateParcelData): boolean {
    return !!(
      data.locationCode?.trim() &&
      data.parcelType &&
      (data.surfaceArea === undefined || data.surfaceArea > 0)
    );
  }

  calculateTotalArea(parcels: ApiParcelResponse[]): number {
    return parcels.reduce((total, parcel) => total + (parcel.surfaceArea || 0), 0);
  }
}