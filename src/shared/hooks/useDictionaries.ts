import { useQuery } from '@tanstack/react-query'
import { getServers, getSlotTypes, getAttributes } from '@/shared/api'

/** Хук для загрузки списка серверов */
export function useServers() {
  return useQuery({
    queryKey: ['dictionaries', 'servers'],
    queryFn: ({ signal }) => getServers(signal),
    staleTime: 5 * 60 * 1000,
  })
}

/** Хук для загрузки типов слотов */
export function useSlotTypes() {
  return useQuery({
    queryKey: ['dictionaries', 'slotTypes'],
    queryFn: ({ signal }) => getSlotTypes(signal),
    staleTime: 5 * 60 * 1000,
  })
}

/** Хук для загрузки определений атрибутов */
export function useAttributes() {
  return useQuery({
    queryKey: ['dictionaries', 'attributes'],
    queryFn: ({ signal }) => getAttributes(signal),
    staleTime: 5 * 60 * 1000,
  })
}

/** Комбинированный хук для всех справочников */
export function useDictionaries() {
  const servers = useServers()
  const slotTypes = useSlotTypes()
  const attributes = useAttributes()

  return {
    servers: Array.isArray(servers.data) ? servers.data : [],
    slotTypes: Array.isArray(slotTypes.data) ? slotTypes.data : [],
    attributes: Array.isArray(attributes.data) ? attributes.data : [],
    isLoading: servers.isLoading || slotTypes.isLoading || attributes.isLoading,
    isError: servers.isError || slotTypes.isError || attributes.isError,
  }
}
