/**
 * API-сервис для справочников.
 * Все запросы проксируются через BFF.
 */
import { proxyRequest } from './proxy'
import type {
  Server,
  SlotType,
  AttributeDefinition,
  RelicDefinition,
  EnhancementCurvePoint,
} from '@/shared/types'

/** Список серверов */
export async function getServers(signal?: AbortSignal): Promise<Server[]> {
  const data = await proxyRequest<{ servers: Server[] } | Server[]>('getServers', {}, signal)
  return Array.isArray(data) ? data : data.servers
}

/** Типы слотов */
export async function getSlotTypes(signal?: AbortSignal): Promise<SlotType[]> {
  const data = await proxyRequest<{ slotTypes: SlotType[] } | SlotType[]>('getSlotTypes', {}, signal)
  return Array.isArray(data) ? data : data.slotTypes
}

/** Определения атрибутов */
export async function getAttributes(signal?: AbortSignal): Promise<AttributeDefinition[]> {
  const data = await proxyRequest<{ attributes: AttributeDefinition[] } | AttributeDefinition[]>('getAttributes', {}, signal)
  return Array.isArray(data) ? data : data.attributes
}

/** Определения реликвий */
export async function getRelicDefinitions(signal?: AbortSignal): Promise<RelicDefinition[]> {
  const data = await proxyRequest<{ relicDefinitions: RelicDefinition[] } | RelicDefinition[]>('getRelicDefinitions', {}, signal)
  return Array.isArray(data) ? data : data.relicDefinitions
}

/** Кривая заточки */
export async function getEnhancementCurve(signal?: AbortSignal): Promise<EnhancementCurvePoint[]> {
  const data = await proxyRequest<{ enhancementCurve: EnhancementCurvePoint[] } | EnhancementCurvePoint[]>('getEnhancementCurve', {}, signal)
  return Array.isArray(data) ? data : data.enhancementCurve
}
