'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';

export type SelectOption = {
  value: string;
  label: string;
  hint?: string;
  /** CSS color for the leading dot, useful for accent/variant pickers. */
  swatch?: string;
  /** Soft danger styling for destructive actions. */
  danger?: boolean;
};

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  /** `field` fills the form width, `compact` hugs its content for toolbars, `filter` fills a column filter cell. */
  variant?: 'field' | 'compact' | 'filter';
  /** Anchor the menu to the start or end of the trigger. */
  menuAlign?: 'start' | 'end';
  /** Minimum menu width in vw when the trigger is narrower than its labels. */
  menuMinWidth?: number;
  /** Show a search field inside the dropdown (useful for long lists). */
  searchable?: boolean;
  searchPlaceholder?: string;
};

const MAX_MENU_HEIGHT = 280;

export function Select({
  value,
  onChange,
  options,
  id,
  placeholder = 'Оберіть…',
  disabled = false,
  ariaLabel,
  variant = 'field',
  menuAlign = 'start',
  menuMinWidth,
  searchable = false,
  searchPlaceholder = 'Пошук…',
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const listboxId = `${selectId}-listbox`;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const typeahead = useRef({ query: '', at: 0 });

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const [position, setPosition] = useState<{ top: number; left: number; width: number; drop: 'down' | 'up' } | null>(
    null,
  );

  const visibleOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) return options;
    const needle = searchQuery.trim().toLowerCase();
    return options.filter((option) => {
      const hay = `${option.label} ${option.hint ?? ''}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [options, searchable, searchQuery]);

  const selectedIndex = useMemo(() => options.findIndex((option) => option.value === value), [options, value]);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom;
    const drop = below < Math.min(MAX_MENU_HEIGHT, 220) && rect.top > below ? 'up' : 'down';
    const measured = menuRef.current?.getBoundingClientRect().width ?? 0;
    const width = Math.max(rect.width, menuMinWidth ?? 0, measured);
    let left = menuAlign === 'end' ? rect.right - width : rect.left;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    const top = drop === 'down' ? rect.bottom + 6 : Math.max(8, rect.top - 6);
    setPosition((prev) => {
      if (prev && prev.top === top && prev.left === left && prev.width === width && prev.drop === drop) {
        return prev;
      }
      return { top, left, width, drop };
    });
  }, [menuAlign, menuMinWidth]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const frame = requestAnimationFrame(() => updatePosition());
    const onViewportChange = () => updatePosition();
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [open, updatePosition, options]);

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
    if (!open) {
      setSearchQuery('');
      return;
    }
    if (searchable) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open, searchable]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    menuRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex, visibleOptions]);

  function openMenu(startAt?: number) {
    if (disabled) return;
    const selectedInVisible = visibleOptions.findIndex((option) => option.value === value);
    const index = startAt ?? (selectedInVisible >= 0 ? selectedInVisible : 0);
    setActiveIndex(Math.max(0, Math.min(index, Math.max(visibleOptions.length - 1, 0))));
    setOpen(true);
  }

  function commit(index: number) {
    const option = visibleOptions[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function step(from: number, delta: number) {
    if (visibleOptions.length === 0) return -1;
    const next = from + delta;
    if (next < 0) return visibleOptions.length - 1;
    if (next >= visibleOptions.length) return 0;
    return next;
  }

  function onTypeahead(key: string) {
    if (searchable) return;
    const now = Date.now();
    const state = typeahead.current;
    state.query = now - state.at > 700 ? key : state.query + key;
    state.at = now;
    const match = visibleOptions.findIndex((option) => option.label.toLowerCase().startsWith(state.query.toLowerCase()));
    if (match >= 0) {
      setActiveIndex(match);
      if (!open) commit(match);
    }
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
        openMenu();
      } else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
        onTypeahead(event.key);
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
        setActiveIndex(visibleOptions.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        commit(activeIndex);
        break;
      default:
        if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
          onTypeahead(event.key);
        }
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        role="combobox"
        className={`select-trigger${variant === 'compact' || variant === 'filter' ? ' is-compact' : ''}${
          variant === 'filter' ? ' is-filter' : ''
        }${open ? ' is-open' : ''}${value ? ' has-value' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open && activeIndex >= 0 ? `${selectId}-option-${activeIndex}` : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
      >
        <span className={`select-value${selected ? '' : ' is-placeholder'}`}>
          {selected?.swatch ? <i className="select-swatch" style={{ background: selected.swatch }} /> : null}
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className="select-arrow" size={16} />
      </button>

      {open && position
        ? createPortal(
            <div
              ref={menuRef}
              className={`select-menu${position.drop === 'up' ? ' is-up' : ''}`}
              style={{
                top: position.drop === 'down' ? position.top : undefined,
                bottom: position.drop === 'up' ? window.innerHeight - position.top : undefined,
                left: position.left,
                minWidth: position.width,
              }}
              // Portals bubble through the React tree, so a click here would otherwise reach the modal backdrop.
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              {searchable ? (
                <div className="select-search">
                  <Search size={14} aria-hidden />
                  <input
                    ref={searchRef}
                    type="search"
                    value={searchQuery}
                    placeholder={searchPlaceholder}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setActiveIndex(0);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        setActiveIndex((current) => step(current < 0 ? 0 : current, 1));
                      } else if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        setActiveIndex((current) => step(current < 0 ? 0 : current, -1));
                      } else if (event.key === 'Enter') {
                        event.preventDefault();
                        if (activeIndex >= 0) commit(activeIndex);
                      } else if (event.key === 'Escape') {
                        event.preventDefault();
                        event.stopPropagation();
                        setOpen(false);
                      }
                    }}
                  />
                </div>
              ) : null}
              <ul id={listboxId} role="listbox" aria-labelledby={selectId} tabIndex={-1}>
                {visibleOptions.map((option, index) => {
                  const isSelected = option.value === value;
                  return (
                    <li
                      key={option.value}
                      id={`${selectId}-option-${index}`}
                      data-index={index}
                      role="option"
                      aria-selected={isSelected}
                      className={`select-option${index === activeIndex ? ' is-active' : ''}${
                        isSelected ? ' is-selected' : ''
                      }${option.danger ? ' is-danger' : ''}`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => commit(index)}
                    >
                      {option.swatch ? <i className="select-swatch" style={{ background: option.swatch }} /> : null}
                      <span className="select-option-text">
                        {option.label}
                        {option.hint ? <small>{option.hint}</small> : null}
                      </span>
                      {isSelected ? <Check size={15} /> : null}
                    </li>
                  );
                })}
                {visibleOptions.length === 0 ? (
                  <li className="select-empty">{searchQuery.trim() ? 'Нічого не знайдено' : 'Немає варіантів'}</li>
                ) : null}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
