export type EquipmentLocation =
  | 'Rapid Fabrication 104'
  | 'Woodshop 105'
  | 'Metal Shop 107'
  | 'Paint Booth'
  | 'Other'

export type EquipmentStatus = 'Operational' | 'Maintenance' | 'Down' | 'Other'

export type EquipmentLinkType =
  | 'manual'
  | 'video'
  | 'vendor'
  | 'project_example'
  | 'other'

export interface Equipment {
  id: string
  name: string
  slug: string
  manufacturer: string | null
  model: string | null
  unit_identifier: string | null
  location: EquipmentLocation
  description: string | null
  photo_url: string | null
  status: EquipmentStatus
  expected_return_date: string | null
  staff_only: boolean
  created_at: string
  updated_at: string
}

export interface EquipmentLink {
  id: string
  equipment_id: string
  label: string
  url: string
  link_type: EquipmentLinkType
  created_at: string
}
