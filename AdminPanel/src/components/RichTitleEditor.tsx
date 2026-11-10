'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bold, Eraser, Italic, Redo2, Undo2 } from 'lucide-react';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  hint?: string;
  variables?: Array<{ token: string; label?: string }>;
  compact?: boolean;
};

export function RichTitleEditor({
  value,
  onChange,
  placeholder = 'Введіть текст…',
  ariaLabel = 'Текст',
  hint = 'Виділіть текст, а потім застосуйте стиль. Enter — новий рядок.',
  variables = [],
  compact = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [active, setActive] = useState({ bold: false, italic: false, script: false });

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  const rememberSelection = useCallback(() => {
    const selection = window.getSelection();
    const editor = ref.current;
    if (!selection || selection.rangeCount === 0 || !editor) {
      return;
    }
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) {
      return;
    }
    savedRange.current = range.cloneRange();
    const element =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as Element)
        : range.commonAncestorContainer.parentElement;
    setActive({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      script: Boolean(element?.closest('.script')),
    });
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', rememberSelection);
    return () => document.removeEventListener('selectionchange', rememberSelection);
  }, [rememberSelection]);

  function emit() {
    onChange(normalizeEditorHtml(ref.current?.innerHTML ?? ''));
    rememberSelection();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    // Browsers otherwise insert <div>/<p>, which the API strips — keep real line breaks.
    document.execCommand('insertLineBreak');
    emit();
  }

  function restoreSelection() {
    const editor = ref.current;
    const range = savedRange.current;
    editor?.focus();
    if (!editor || !range || !editor.contains(range.commonAncestorContainer)) {
      return false;
    }
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    return true;
  }

  function command(name: string, arg?: string) {
    restoreSelection();
    if (name === 'foreColor') {
      document.execCommand('styleWithCSS', false, 'true');
    }
    document.execCommand(name, false, arg);
    emit();
  }

  function applyColor(color: string) {
    if (!restoreSelection()) {
      return;
    }
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }
    // Prefer an explicit span so color survives sanitize (font tags used to be stripped).
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('foreColor', false, color);
    emit();
  }

  function toggleScript() {
    if (!restoreSelection()) {
      return;
    }
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }
    const range = selection.getRangeAt(0);
    const element =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as Element)
        : range.commonAncestorContainer.parentElement;
    const existing = element?.closest('.script');
    if (existing && ref.current?.contains(existing)) {
      existing.replaceWith(...Array.from(existing.childNodes));
      ref.current?.focus();
      emit();
      return;
    }
    const span = document.createElement('span');
    span.className = 'script';
    span.appendChild(range.extractContents());
    range.insertNode(span);
    selection.removeAllRanges();
    const next = document.createRange();
    next.selectNodeContents(span);
    selection.addRange(next);
    emit();
  }

  function clearFormatting() {
    restoreSelection();
    document.execCommand('removeFormat');
    emit();
  }

  function insertVariable(token: string) {
    if (!restoreSelection()) {
      ref.current?.focus();
    }
    document.execCommand('insertText', false, token);
    emit();
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    emit();
  }

  function keepSelection(event: React.MouseEvent) {
    event.preventDefault();
    rememberSelection();
  }

  return (
    <div className={`rich${compact ? ' is-compact' : ''}`}>
      <div className="rich-toolbar" role="toolbar" aria-label="Форматування тексту">
        <button
          type="button"
          className={active.bold ? 'is-active' : ''}
          onMouseDown={keepSelection}
          onClick={() => command('bold')}
          aria-label="Жирний"
          title="Жирний (Ctrl+B)"
        >
          <Bold size={16} />
          <span>Жирний</span>
        </button>
        <button
          type="button"
          className={active.italic ? 'is-active' : ''}
          onMouseDown={keepSelection}
          onClick={() => command('italic')}
          aria-label="Курсив"
          title="Курсив (Ctrl+I)"
        >
          <Italic size={16} />
          <span>Курсив</span>
        </button>
        <button
          type="button"
          className={active.script ? 'is-active rich-script-button' : 'rich-script-button'}
          onMouseDown={keepSelection}
          onClick={toggleScript}
          aria-label="Рукописний стиль"
          title="Рукописний стиль"
        >
          <span aria-hidden="true">Aa</span>
          <span>Рукописний</span>
        </button>
        <label className="rich-color">
          <span>Колір</span>
          <input
            type="color"
            defaultValue="#f0508e"
            onMouseDown={rememberSelection}
            onChange={(event) => applyColor(event.target.value)}
            aria-label="Колір тексту"
          />
        </label>
        <span className="rich-toolbar-divider" />
        {variables.length ? (
          <>
            <span className="rich-toolbar-vars-label">Змінні:</span>
            {variables.map((item) => (
              <button
                key={item.token}
                type="button"
                className="rich-var-button"
                onMouseDown={keepSelection}
                onClick={() => insertVariable(item.token)}
                title={item.label || item.token}
              >
                <code className="rich-var-token">{item.token}</code>
              </button>
            ))}
            <span className="rich-toolbar-divider" />
          </>
        ) : null}
        <button type="button" className="rich-icon-button" onMouseDown={keepSelection} onClick={() => command('undo')} aria-label="Скасувати" title="Скасувати">
          <Undo2 size={16} />
        </button>
        <button type="button" className="rich-icon-button" onMouseDown={keepSelection} onClick={() => command('redo')} aria-label="Повторити" title="Повторити">
          <Redo2 size={16} />
        </button>
        <button type="button" className="rich-icon-button" onMouseDown={keepSelection} onClick={clearFormatting} aria-label="Очистити форматування" title="Очистити форматування">
          <Eraser size={16} />
        </button>
      </div>
      <div
        ref={ref}
        className="rich-editor"
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        data-placeholder={placeholder}
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />
      <p className="rich-hint">{hint}</p>
    </div>
  );
}

/** Turn contentEditable block wrappers into &lt;br&gt; so line breaks survive save/sanitize. */
function normalizeEditorHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, '<br>')
    .replace(/<\/(div|p)>/gi, '<br>')
    .replace(/<(div|p)\b[^>]*>/gi, '')
    .replace(/(?:<br>\s*){3,}/gi, '<br><br>')
    .replace(/^(?:\s|<br>)+|(?:\s|<br>)+$/gi, '');
}
