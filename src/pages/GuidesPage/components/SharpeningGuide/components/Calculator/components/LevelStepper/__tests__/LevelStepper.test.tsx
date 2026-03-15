import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LevelStepper } from '../LevelStepper';

describe('LevelStepper', () => {
  it('рендерит текущее значение', () => {
    render(<LevelStepper value={5} onChange={() => {}} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue(5);
  });

  it('вызывает onChange при ручном вводе', () => {
    const onChange = vi.fn();
    render(<LevelStepper value={5} onChange={onChange} />);
    const input = screen.getByRole('spinbutton');
    
    fireEvent.change(input, { target: { value: '10' } });
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('ограничивает ввод максимальным значением', () => {
    const onChange = vi.fn();
    render(<LevelStepper value={5} onChange={onChange} max={20} />);
    const input = screen.getByRole('spinbutton');
    
    fireEvent.change(input, { target: { value: '25' } });
    expect(onChange).toHaveBeenCalledWith(20);
  });

  it('шаг вверх примагничивается к следующему разрешенному значению (4, 8, 12, 16, 20)', () => {
    const onChange = vi.fn();
    // Текущий 5, следующее разрешенное 8
    render(<LevelStepper value={5} onChange={onChange} />);
    const upBtn = screen.getByTitle('Увеличить');
    
    fireEvent.click(upBtn);
    expect(onChange).toHaveBeenCalledWith(8);
  });

  it('шаг вниз примагничивается к предыдущему разрешенному значению', () => {
    const onChange = vi.fn();
    // Текущий 9, предыдущее разрешенное 8
    render(<LevelStepper value={9} onChange={onChange} />);
    const downBtn = screen.getByTitle('Уменьшить');
    
    fireEvent.click(downBtn);
    expect(onChange).toHaveBeenCalledWith(8);
  });

  it('шаг вверх увеличивает на 1, если нет разрешенных выше (кроме стандартных)', () => {
    const onChange = vi.fn();
    // Текущий 2, следующее разрешенное 4
    render(<LevelStepper value={2} onChange={onChange} />);
    const upBtn = screen.getByTitle('Увеличить');
    
    fireEvent.click(upBtn);
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('шаг вниз уменьшает на 1, если нет разрешенных ниже', () => {
    const onChange = vi.fn();
    // Текущий 2, разрешенных ниже нет (минимум 4 в списке)
    render(<LevelStepper value={2} onChange={onChange} min={0} />);
    const downBtn = screen.getByTitle('Уменьшить');
    
    fireEvent.click(downBtn);
    expect(onChange).toHaveBeenCalledWith(1);
  });
  
  it('шаг вверх от 20 не работает (disabled)', () => {
    const onChange = vi.fn();
    render(<LevelStepper value={20} onChange={onChange} max={20} />);
    const upBtn = screen.getByTitle('Увеличить');
    
    expect(upBtn).toBeDisabled();
  });
});
