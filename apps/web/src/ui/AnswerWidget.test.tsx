import { describe, it, expect, afterEach } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AnswerWidget, correctLettersFrom } from './AnswerWidget';

function Harness({ q, initial = '' }: { q: Record<string, unknown>; initial?: string }) {
  const [v, setV] = useState(initial);
  return <><AnswerWidget q={q} value={v} onChange={setV} /><output data-testid="v">{v}</output></>;
}

afterEach(cleanup);

describe('AnswerWidget', () => {
  it('single choice keeps one letter', () => {
    render(<Harness q={{ options: ['Red', 'Green', 'Blue'] }} />);
    fireEvent.click(screen.getByText('Green')); fireEvent.click(screen.getByText('Blue'));
    expect(screen.getByTestId('v').textContent).toBe('C');
  });
  it('multi-select sorts letters and toggles', () => {
    render(<Harness q={{ options: ['a', 'b', 'c', 'd'], multi: true }} />);
    fireEvent.click(screen.getByText('d')); fireEvent.click(screen.getByText('a')); fireEvent.click(screen.getByText('b')); fireEvent.click(screen.getByText('b'));
    expect(screen.getByTestId('v').textContent).toBe('AD');
  });
  it('ordering records the tap order', () => {
    render(<Harness q={{ options: ['x', 'y', 'z'], ordering: true }} />);
    fireEvent.click(screen.getByText('z')); fireEvent.click(screen.getByText('x')); fireEvent.click(screen.getByText('y'));
    expect(screen.getByTestId('v').textContent).toBe('CAB');
  });
  it('typed answers use the maths keypad', () => {
    render(<Harness q={{ html: 'x', unit: 'cm' }} />);
    fireEvent.change(screen.getByLabelText('Your answer'), { target: { value: 'x' } });
    fireEvent.click(screen.getByText('²'));
    expect(screen.getByTestId('v').textContent).toBe('x^2');
    expect(screen.getByText('cm')).toBeTruthy();
  });
  it('extracts correct letters from the server’s answer HTML', () => {
    expect(correctLettersFrom('B) Mitochondria<br>D) Ribosome')).toBe('BD');
  });
});
