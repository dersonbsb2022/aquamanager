export const EQUIPMENT_TYPE_OPTIONS = [
  { value: 'FILTER', label: 'Filtro' },
  { value: 'HEATER', label: 'Aquecedor' },
  { value: 'LIGHT', label: 'Iluminação' },
  { value: 'CO2', label: 'CO₂' },
  { value: 'PUMP', label: 'Bomba' },
  { value: 'SKIMMER', label: 'Skimmer' },
  { value: 'UV_STERILIZER', label: 'UV' },
  { value: 'OTHER', label: 'Outro' },
] as const;

export type EquipmentTypeValue = (typeof EQUIPMENT_TYPE_OPTIONS)[number]['value'];

export function equipmentTypeLabel(type: string): string {
  return EQUIPMENT_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}
