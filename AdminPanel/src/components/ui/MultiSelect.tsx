'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, X } from 'lucide-react';
import type { SelectOption } from './Select';

type MultiSelectProps = {
  values: string[];
  onChange: (values: string[]) => void;
  options: SelectOption[];
  id?: string;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
};

export function MultiSelect({
  values,
  onChange,
  options,
  id,
  placeholder = 'Усі',
  ariaLabel,
  disabled = false,
}: MultiSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const listboxId = `${selectId}-listbox`;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState<{ top: number; left: number; width: number; drop: 'down' | 'up' } | null>(
    null,
  );

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom;
    const drop = below < 220 && rect.top > below ? 'up' : 'down';
    setPosition({
      top: drop === 'down' ? rect.bottom + 6 : Math.max(8, rect.top - 6),
      left: rect.left,
      width: rect.width,
      drop,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const onViewportChange = () => updatePosition();
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
    return () => {
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    menuRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  function toggle(value: string) {
    onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  function step(from: number, delta: number) {
    if (options.length === 0) return -1;
    const next = from + delta;
    if (next < 0) return options.length - 1;
    if (next >= options.length) return 0;
    return next;
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    if (event.key === 'Escape') {
      if (open) {
        // The surrounding modal also closes on Escape, so swallow it while the menu is open.
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
      }
      return;
    }

    if (event.key === 'Tab') {
      setOpen(false);
      return;
    }

    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setActiveIndex(0);
        setOpen(true);
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((current) => step(current, 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((current) => step(current, -1));
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const option = options[activeIndex];
        if (option) toggle(option.value);
        break;
      }
      default:
        break;
    }
  }

  const selectedLabels = options.filter((option) => values.includes(option.value));
  const summary =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length === 1
        ? selectedLabels[0].label
        : `Вибрано ${selectedLabels.length}`;

  return (
    <>
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        role="combobox"
        className={`select-trigger is-compact is-filter${open ? ' is-open' : ''}${
          values.length ? ' has-value' : ''
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : (setActiveIndex(0), setOpen(true)))}
        onKeyDown={onKeyDown}
      >
        <span className={`select-value${values.length ? '' : ' is-placeholder'}`}>
          {selectedLabels.length === 1 && selectedLabels[0].swatch ? (
            <i className="select-swatch" style={{ background: selectedLabels[0].swatch }} />
          ) : null}
          {summary}
        </span>
        {values.length ? (
          <span
            className="select-clear"
            role="button"
            tabIndex={-1}
            aria-label="Очистити фільтр"
            onClick={(event) => {
              event.stopPropagation();
              onChange([]);
            }}
          >
            <X size={13} />
          </span>
        ) : (
          <ChevronDown className="select-arrow" size={15} />
        )}
      </button>

      {open && position
        ? createPortal(
            <div
              ref={menuRef}
              className="select-menu"
              style={{
                top: position.drop === 'down' ? position.top : undefined,
                bottom: position.drop === 'up' ? window.innerHeight - position.top : undefined,
                left: position.left,
                minWidth: Math.max(position.width, 180),
              }}
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              <ul id={listboxId} role="listbox" aria-multiselectable="true" aria-labelledby={selectId} tabIndex={-1}>
                {options.map((option, index) => {
                  const isSelected = values.includes(option.value);
                  return (
                    <li
                      key={option.value}
                      data-index={index}
                      role="option"
                      aria-selected={isSelected}
                      className={`select-option${index === activeIndex ? ' is-active' : ''}${
                        isSelected ? ' is-selected' : ''
                      }`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => toggle(option.value)}
                    >
                      <span className={`select-check${isSelected ? ' is-on' : ''}`}>
                        {isSelected ? <Check size={12} /> : null}
                      </span>
                      {option.swatch ? <i className="select-swatch" style={{ background: option.swatch }} /> : null}
                      <span className="select-option-text">
                        {option.label}
                        {option.hint ? <small>{option.hint}</small> : null}
                      </span>
                    </li>
                  );
                })}
                {options.length === 0 ? <li className="select-empty">Немає варіантів</li> : null}
              </ul>
              {values.length ? (
                <button className="select-footer" type="button" onClick={() => onChange([])}>
                  Очистити вибір
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
