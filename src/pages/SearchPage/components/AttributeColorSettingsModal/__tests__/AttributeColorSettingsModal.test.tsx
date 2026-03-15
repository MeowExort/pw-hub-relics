import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AttributeColorSettingsModal } from '../AttributeColorSettingsModal'
import { presetService } from '@/shared/lib/presetService'

const mockUpdateSettings = vi.fn()

const mockSettings = {
  attributes: {
    1: [
      { id: 'rule-1', min: 10, max: 50, color: '#ff0000' },
      { id: 'rule-2', min: 100, max: null, color: '#00ff00' },
    ],
  },
}

const mockAttributes = [
  { id: 0, name: 'Физическая атака' },
  { id: 1, name: 'Сила' },
  { id: 2, name: 'Ловкость' },
]

vi.mock('@/shared/hooks', () => ({
  useAttributeStyles: vi.fn(() => ({
    settings: mockSettings,
    updateSettings: mockUpdateSettings,
    getAttributeColor: vi.fn(() => null),
  })),
  useDictionaries: vi.fn(() => ({
    attributes: mockAttributes,
    servers: [],
    slotTypes: [],
    isLoading: false,
    isError: false,
  })),
}))

vi.mock('@/shared/lib/presetService', () => ({
  presetService: {
    getPresets: vi.fn(() => []),
    savePreset: vi.fn(),
    deletePreset: vi.fn(),
    getPresetById: vi.fn(),
    renamePreset: vi.fn(),
    exportSettings: vi.fn((s: any) => JSON.stringify(s)),
    importSettings: vi.fn((json: string) => {
      try {
        const parsed = JSON.parse(json)
        return parsed.attributes ? parsed : null
      } catch { return null }
    }),
  },
}))

describe('AttributeColorSettingsModal — редактирование правил', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('отображает кнопку редактирования у каждого правила', () => {
    render(<AttributeColorSettingsModal open={true} onClose={vi.fn()} />)

    const editButtons = screen.getAllByLabelText('Редактировать')
    expect(editButtons).toHaveLength(2)
  })

  it('при клике на кнопку редактирования заполняет форму данными правила', () => {
    render(<AttributeColorSettingsModal open={true} onClose={vi.fn()} />)

    const editButtons = screen.getAllByLabelText('Редактировать')
    fireEvent.click(editButtons[0])

    const minInput = screen.getByPlaceholderText('Мин') as HTMLInputElement
    const maxInput = screen.getByPlaceholderText('Макс') as HTMLInputElement

    expect(minInput.value).toBe('10')
    expect(maxInput.value).toBe('50')
  })

  it('в режиме редактирования кнопка меняется на "Сохранить"', () => {
    render(<AttributeColorSettingsModal open={true} onClose={vi.fn()} />)

    const editButtons = screen.getAllByLabelText('Редактировать')
    fireEvent.click(editButtons[0])

    expect(screen.getByText('Сохранить')).toBeInTheDocument()
    expect(screen.queryByText('Добавить правило')).not.toBeInTheDocument()
  })

  it('при сохранении обновляет правило с новыми значениями', () => {
    render(<AttributeColorSettingsModal open={true} onClose={vi.fn()} />)

    const editButtons = screen.getAllByLabelText('Редактировать')
    fireEvent.click(editButtons[0])

    const minInput = screen.getByPlaceholderText('Мин')
    const maxInput = screen.getByPlaceholderText('Макс')

    fireEvent.change(minInput, { target: { value: '20' } })
    fireEvent.change(maxInput, { target: { value: '80' } })

    fireEvent.click(screen.getByText('Сохранить'))

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      attributes: {
        1: [
          { id: 'rule-1', min: 20, max: 80, color: '#ff0000' },
          { id: 'rule-2', min: 100, max: null, color: '#00ff00' },
        ],
      },
    })
  })

  it('позволяет добавить правило для атрибута с id=0', () => {
    render(<AttributeColorSettingsModal open={true} onClose={vi.fn()} />)

    // Открываем Select и выбираем «Физическая атака» (id=0)
    const selectButton = screen.getByLabelText('Характеристика')
    fireEvent.click(selectButton)
    fireEvent.click(screen.getByText('Физическая атака'))

    // Кнопка «Добавить правило» должна быть активна
    const addButton = screen.getByText('Добавить правило')
    expect(addButton).not.toBeDisabled()

    fireEvent.click(addButton)
    expect(mockUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        attributes: expect.objectContaining({
          0: expect.any(Array),
        }),
      }),
    )
  })

  it('кнопка "Отмена" сбрасывает режим редактирования', () => {
    render(<AttributeColorSettingsModal open={true} onClose={vi.fn()} />)

    const editButtons = screen.getAllByLabelText('Редактировать')
    fireEvent.click(editButtons[0])

    expect(screen.getByText('Сохранить')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Отмена'))

    expect(screen.queryByText('Сохранить')).not.toBeInTheDocument()
    expect(screen.getByText('Добавить правило')).toBeInTheDocument()
  })
})

describe('AttributeColorSettingsModal — пресеты', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('отображает секцию пресетов', () => {
    render(<AttributeColorSettingsModal open={true} onClose={vi.fn()} />)
    expect(screen.getByText('Пресеты')).toBeInTheDocument()
    expect(screen.getByLabelText('Название пресета')).toBeInTheDocument()
  })

  it('кнопка "Сохранить как пресет" заблокирована при пустом имени', () => {
    render(<AttributeColorSettingsModal open={true} onClose={vi.fn()} />)
    const btn = screen.getByText('Сохранить как пресет')
    expect(btn).toBeDisabled()
  })

  it('сохраняет пресет при вводе имени и клике', () => {
    render(<AttributeColorSettingsModal open={true} onClose={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Название пресета'), { target: { value: 'Мой пресет' } })
    fireEvent.click(screen.getByText('Сохранить как пресет'))

    expect(presetService.savePreset).toHaveBeenCalledWith('Мой пресет', mockSettings)
  })

  it('отображает сохранённые пресеты с кнопками загрузки и удаления', () => {
    vi.mocked(presetService.getPresets).mockReturnValue([
      { id: 'p1', name: 'Пресет А', settings: { attributes: {} } },
    ])

    render(<AttributeColorSettingsModal open={true} onClose={vi.fn()} />)

    expect(screen.getByText('Пресет А')).toBeInTheDocument()
    expect(screen.getByLabelText('Загрузить пресет Пресет А')).toBeInTheDocument()
    expect(screen.getByLabelText('Удалить пресет Пресет А')).toBeInTheDocument()
  })

  it('загружает пресет при клике на "Загрузить"', () => {
    const presetSettings = { attributes: { 2: [{ id: 'x', min: 1, max: 5, color: '#000' }] } }
    vi.mocked(presetService.getPresets).mockReturnValue([
      { id: 'p1', name: 'Пресет А', settings: presetSettings },
    ])

    render(<AttributeColorSettingsModal open={true} onClose={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('Загрузить пресет Пресет А'))

    expect(mockUpdateSettings).toHaveBeenCalledWith(presetSettings)
  })

  it('удаляет пресет при клике на кнопку удаления', () => {
    vi.mocked(presetService.getPresets).mockReturnValue([
      { id: 'p1', name: 'Пресет А', settings: { attributes: {} } },
    ])

    render(<AttributeColorSettingsModal open={true} onClose={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('Удалить пресет Пресет А'))

    expect(presetService.deletePreset).toHaveBeenCalledWith('p1')
  })
})

describe('AttributeColorSettingsModal — экспорт/импорт', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve()),
        readText: vi.fn(() => Promise.resolve('dGVzdA==')),
      },
    })
  })

  it('отображает секцию экспорта/импорта с base64-интерфейсом', () => {
    render(<AttributeColorSettingsModal open={true} onClose={vi.fn()} />)
    expect(screen.getByText('Экспорт / Импорт')).toBeInTheDocument()
    expect(screen.getByText('Копировать настройки')).toBeInTheDocument()
    expect(screen.getByLabelText('Импорт настроек')).toBeInTheDocument()
    expect(screen.getByText('Импортировать')).toBeInTheDocument()
  })

  it('копирует base64 в буфер обмена при экспорте', async () => {
    render(<AttributeColorSettingsModal open={true} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Копировать настройки'))

    expect(presetService.exportSettings).toHaveBeenCalledWith(mockSettings)
    await vi.waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })
  })

  it('импортирует настройки из введённой base64-строки', () => {
    const importedSettings = { attributes: { 2: [{ id: 'r1', min: 1, max: 5, color: '#000' }] } }
    vi.mocked(presetService.importSettings).mockReturnValue(importedSettings)

    render(<AttributeColorSettingsModal open={true} onClose={vi.fn()} />)

    const input = screen.getByLabelText('Импорт настроек')
    fireEvent.change(input, { target: { value: 'c29tZS1iYXNlNjQ=' } })
    fireEvent.click(screen.getByText('Импортировать'))

    expect(presetService.importSettings).toHaveBeenCalledWith('c29tZS1iYXNlNjQ=')
    expect(mockUpdateSettings).toHaveBeenCalledWith(importedSettings)
  })
})
