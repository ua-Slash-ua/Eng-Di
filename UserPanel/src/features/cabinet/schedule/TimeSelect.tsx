'use client';

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { formatMinute } from './hours';

const MENU_HEIGHT = 260;

export type MenuOption<T extends string | number = string> = { value: T; label: string };

export function MenuSelect<T extends string | number>({
  value,
  options,
  onChange,
  disabled = false,
  ariaLabel,
  variant = 'field',
}: {
  value: T;
  options: MenuOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  ariaLabel?: string;
  variant?: 'time' | 'field';
}) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState<{ top: number; left: number; width: number; drop: 'down' | 'up' } | null>(
    null,
  );

  const selectedIndex = useMemo(() => options.findIndex((option) => option.value === value), [options, value]);
  const label =
    selectedIndex >= 0
      ? options[selectedIndex].label
      : typeof value === 'number'
        ? formatMinute(value)
        : String(value);
  const aligned = useRef(false);

  function updatePosition() {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom;
    const drop = below < MENU_HEIGHT && rect.top > below ? 'up' : 'down';
    const width = Math.max(rect.width, variant === 'time' ? 92 : rect.width);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    const top = drop === 'down' ? rect.bottom + 6 : Math.max(8, rect.top - 6);
    setPosition({ top, left, width, drop });
  }

  function reveal(index: number) {
    const menu = menuRef.current;
    const el = menu?.querySelector<HTMLElement>(`[data-index="${index}"]`);
    if (!menu || !el) return;
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    if (top < menu.scrollTop) {
      menu.scrollTop = top;
    } else if (bottom > menu.scrollTop + menu.clientHeight) {
      menu.scrollTop = bottom - menu.clientHeight;
    }
  }

  function commit(index: number) {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function step(from: number, delta: number) {
    if (options.length === 0) return -1;
    const next = from + delta;
    if (next < 0) return options.length - 1;
    if (next >= options.length) return 0;
    return next;
  }

  useLayoutEffect(() => {
    if (!open) {
      aligned.current = false;
      return;
    }
    updatePosition();
    const onMove = () => updatePosition();
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [open, variant]);

  useLayoutEffect(() => {
    if (!open || !position || aligned.current) return;
    aligned.current = true;
    const index = selectedIndex >= 0 ? selectedIndex : 0;
    setActiveIndex(index);
    requestAnimationFrame(() => reveal(index));
  }, [open, position, selectedIndex]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onDocKey(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onDocKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onDocKey);
    };
  }, [open]);

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((current) => {
          const next = step(current, 1);
          reveal(next);
          return next;
        });
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((current) => {
          const next = step(current, -1);
          reveal(next);
          return next;
        });
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        reveal(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(options.length - 1);
        reveal(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        commit(activeIndex);
        break;
      default:
        break;
    }
  }

  return (
    <div className={`menu-select is-${variant}${disabled ? ' is-disabled' : ''}${open ? ' is-open' : ''}`}>
      <button
        ref={triggerRef}
        id={id}
        className="menu-select-trigger"
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => {
          if (disabled) return;
          setOpen((current) => !current);
        }}
        onKeyDown={onTriggerKeyDown}
      >
        <span>{label}</span>
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.4 4.2 6 8l3.6-3.8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && position
        ? createPortal(
            <div
              ref={menuRef}
              className={`menu-select-menu is-${variant} is-${position.drop}`}
              role="listbox"
              aria-labelledby={id}
              style={{
                top: position.drop === 'down' ? position.top : undefined,
                bottom: position.drop === 'up' ? window.innerHeight - position.top : undefined,
                left: position.left,
                width: position.width,
              }}
            >
              {options.map((option, index) => (
                <button
                  key={String(option.value)}
                  className={`menu-select-option${option.value === value ? ' is-selected' : ''}${
                    index === activeIndex ? ' is-active' : ''
                  }`}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  data-index={index}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => commit(index)}
                >
                  {option.label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export function TimeSelect({
  value,
  options,
  onChange,
  disabled = false,
  ariaLabel = 'Час',
}: {
  value: number;
  options: MenuOption<number>[];
  onChange: (value: number) => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <MenuSelect
      variant="time"
      value={value}
      options={options}
      onChange={onChange}
      disabled={disabled}
      ariaLabel={ariaLabel}
    />
  );
}
