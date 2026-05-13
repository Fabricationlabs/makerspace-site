import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Equipment, EquipmentLink, EquipmentLinkType } from '@/lib/types'

const STATUS_STYLES: Record<string, string> = {
  Operational: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  Maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  Down:        'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  Other:       'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
}

const LINK_TYPE_LABELS: Record<EquipmentLinkType, string> = {
  manual:          'Manuals',
  video:           'Videos',
  vendor:          'Vendor',
  project_example: 'Project Examples',
  other:           'Other Links',
}

const LINK_TYPE_ORDER: EquipmentLinkType[] = [
  'manual', 'video', 'vendor', 'project_example', 'other',
]

interface Props {
  params: Promise<{ slug: string }>
}

export default async function EquipmentDetailPage({ params }: Props) {
  const { slug } = await params

  const { data: equipmentData, error } = await supabase
    .from('equipment')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !equipmentData) {
    notFound()
  }

  const item = equipmentData as Equipment

  const { data: links } = await supabase
    .from('equipment_links')
    .select('*')
    .eq('equipment_id', item.id)
    .order('link_type')

  const equipmentLinks = (links ?? []) as EquipmentLink[]

  const linksByType = new Map<EquipmentLinkType, EquipmentLink[]>()
  for (const link of equipmentLinks) {
    const list = linksByType.get(link.link_type) ?? []
    list.push(link)
    linksByType.set(link.link_type, list)
  }

  const linkTypes = LINK_TYPE_ORDER.filter((t) => linksByType.has(t))

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 mb-8 transition-colors"
      >
        ← All equipment
      </Link>

      <div className="space-y-8">
        {/* Photo */}
        {item.photo_url ? (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
            <Image
              src={item.photo_url}
              alt={item.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-full aspect-video rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-sm">
            No photo available
          </div>
        )}

        {/* Header */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {item.name}
              {item.unit_identifier && (
                <span className="ml-2 text-zinc-400 dark:text-zinc-500 font-normal text-lg">
                  #{item.unit_identifier}
                </span>
              )}
            </h1>
            <span
              className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${STATUS_STYLES[item.status] ?? STATUS_STYLES.Other}`}
            >
              {item.status}
            </span>
          </div>

          {item.status === 'Down' && item.expected_return_date && (
            <p className="text-sm text-red-600 dark:text-red-400">
              Expected return:{' '}
              {new Date(item.expected_return_date).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          )}
        </div>

        {/* Details */}
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          {item.manufacturer && (
            <>
              <dt className="text-zinc-500 dark:text-zinc-400">Manufacturer</dt>
              <dd className="text-zinc-900 dark:text-zinc-100">{item.manufacturer}</dd>
            </>
          )}
          {item.model && (
            <>
              <dt className="text-zinc-500 dark:text-zinc-400">Model</dt>
              <dd className="text-zinc-900 dark:text-zinc-100">{item.model}</dd>
            </>
          )}
          <dt className="text-zinc-500 dark:text-zinc-400">Location</dt>
          <dd className="text-zinc-900 dark:text-zinc-100">{item.location}</dd>
        </dl>

        {/* Description */}
        {item.description && (
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {item.description}
          </p>
        )}

        {/* Links */}
        {linkTypes.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
              Resources
            </h2>
            {linkTypes.map((type) => (
              <div key={type}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                  {LINK_TYPE_LABELS[type]}
                </h3>
                <ul className="space-y-1">
                  {linksByType.get(type)!.map((link) => (
                    <li key={link.id}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
