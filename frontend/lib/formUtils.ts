export const fieldLabelMap: Record<string,string> = {
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  department: 'Department',
  position: 'Position',
  nin: 'NIN',
  status: 'Status',
  notes: 'Notes',

  asset: 'Asset',
  user: 'User',
  assigned_date: 'Assigned Date',
  return_date: 'Return Date',
  description: 'Description',
  approved_by: 'Approved By',

  building: 'Building',
  postal_address: 'Postal Address',
  geographical_location: 'Geographical Location',
  contactPerson: 'Contact Person',
  address: 'Address',
  website: 'Website'
}

export function mapServerErrorsToFieldErrors(parsed: any): Record<string,string[]> {
  const out: Record<string,string[]> = {}
  if (!parsed || typeof parsed !== 'object') return out
  Object.entries(parsed).forEach(([k,v]) => {
    out[k] = Array.isArray(v) ? v.map(String) : [String(v)]
  })
  return out
}

export function friendlySummary(parsed: any) {
  if (!parsed || typeof parsed !== 'object') return ''
  return Object.entries(parsed).map(([k,v]) => `${fieldLabelMap[k] ?? k}: ${Array.isArray(v) ? v.join('; ') : v}`).join(' — ')
}
