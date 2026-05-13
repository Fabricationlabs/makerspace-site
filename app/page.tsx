import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import type { Equipment, EquipmentLocation } from '@/lib/types'

const STATUS_STYLES: Record<string, string> = {
  Operational: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  Maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  Down:        'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  Other:       'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
}

const LOCATION_ORDER: EquipmentLocation[] = [
  'Rapid Fabrication 104',
  'Woodshop 105',
  'Metal Shop 107',
  'Paint Booth',
  'Other',
]

export default async function HomePage() {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .order('name')

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-red-600 dark:text-red-400">
        Failed to load equipment: {error.message}
      </div>
    )
  }

  const equipment = (data ?? []) as Equipment[]

  const byLocation = new Map<EquipmentLocation, Equipment[]>()
  for (const item of equipment) {
    const list = byLocation.get(item.location) ?? []
    list.push(item)
    byLocation.set(item.location, list)
  }

  const locations = LOCATION_ORDER.filter((loc) => byLocation.has(loc))

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">
      {locations.length === 0 && (
        <p className="text-zinc-500 dark:text-zinc-400">No equipment found.</p>
      )}

      {locations.map((location) => (
        <section key={location}>
          <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-700">
            {location}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {byLocation.get(location)!.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/equipment/${item.slug}`}
                  className="flex flex-row gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="shrink-0 w-20 h-20 rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    {item.photo_url ? (
                      <Image
                        src={item.photo_url}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-zinc-400 dark:text-zinc-600">No photo</span>
                    )}
                  </div>

                  {/* Text content */}
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
                        {item.name}
                        {item.unit_identifier && (
                          <span className="ml-1.5 text-zinc-400 dark:text-zinc-500 font-normal text-sm">
                            #{item.unit_identifier}
                          </span>
                        )}
                      </span>
                      <span
                        className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[item.status] ?? STATUS_STYLES.Other}`}
                      >
                        {item.status}
                      </span>
                    </div>
                    {(item.manufacturer || item.model) && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {[item.manufacturer, item.model].filter(Boolean).join(' ')}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
