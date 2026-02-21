/**
 * API-сервис для справочников.
 */
import { get } from './client'
import type {
  Server,
  SlotType,
  AttributeDefinition,
  RelicDefinition,
  EnhancementCurvePoint,
} from '@/shared/types'

/** Список серверов */
export async function getServers(signal?: AbortSignal): Promise<Server[]> {
  const data = await get<{ servers: Server[] } | Server[]>('/api/dictionaries/servers', { signal })
  return Array.isArray(data) ? data : data.servers
}

/** Типы слотов */
export async function getSlotTypes(signal?: AbortSignal): Promise<SlotType[]> {
  const data = await get<{ slotTypes: SlotType[] } | SlotType[]>('/api/dictionaries/slot-types', { signal })
  return Array.isArray(data) ? data : data.slotTypes
}

/** Определения атрибутов */
export async function getAttributes(signal?: AbortSignal): Promise<AttributeDefinition[]> {
  const data = await get<{ attributes: AttributeDefinition[] } | AttributeDefinition[]>('/api/dictionaries/attributes', { signal })
  return Array.isArray(data) ? data : data.attributes
}

/** Определения реликвий */
export async function getRelicDefinitions(signal?: AbortSignal): Promise<RelicDefinition[]> {
  const data = await get<{ relicDefinitions: RelicDefinition[] } | RelicDefinition[]>('/api/dictionaries/relic-definitions', { signal })
  return Array.isArray(data) ? data : data.relicDefinitions
}

/** Кривая заточки */
export async function getEnhancementCurve(signal?: AbortSignal): Promise<EnhancementCurvePoint[]> {
  const data = await get<{ enhancementCurve: EnhancementCurvePoint[] } | EnhancementCurvePoint[]>('/api/dictionaries/enhancement-curve', { signal })
  return Array.isArray(data) ? data : data.enhancementCurve
}
