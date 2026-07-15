"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import styles from "./combobox.module.css";

export type ComboboxOption = {
  value: string;
  label: string;
  keywords?: string;
};

type ComboboxProps = {
  label: string;
  value: string;
  options: ComboboxOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  help?: string;
  required?: boolean;
  disabled?: boolean;
};

export function Combobox({
  label,
  value,
  options,
  onChange,
  placeholder = "Search options",
  help,
  required,
  disabled,
}: ComboboxProps) {
  const fieldId = useId();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = options.find((option) => option.value === value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selected?.label ?? "");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = !needle || needle === selected?.label.toLowerCase()
      ? options
      : options.filter((option) =>
          `${option.label} ${option.value} ${option.keywords ?? ""}`
            .toLowerCase()
            .includes(needle),
        );
    return matches.slice(0, 60);
  }, [options, query, selected?.label]);

  function choose(option: ComboboxOption) {
    onChange(option.value);
    setQuery(option.label);
    setOpen(false);
    setActiveIndex(0);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && open && filtered[activeIndex]) {
      event.preventDefault();
      choose(filtered[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setQuery(selected?.label ?? "");
    }
  }

  return (
    <div ref={rootRef} className={styles.field}>
      <label htmlFor={fieldId}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <div className={styles.control}>
        <Search aria-hidden="true" />
        <input
          ref={inputRef}
          id={fieldId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && filtered[activeIndex]
              ? `${listId}-${filtered[activeIndex].value}`
              : undefined
          }
          value={open ? query : (selected?.label ?? "")}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          onFocus={(event) => {
            setQuery(selected?.label ?? "");
            setOpen(true);
            event.currentTarget.select();
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(0);
            if (value) onChange("");
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={`${open ? "Hide" : "Show"} ${label.toLowerCase()} options`}
          onClick={() => {
            if (open) {
              setOpen(false);
              return;
            }
            setQuery(selected?.label ?? "");
            inputRef.current?.focus();
          }}
        >
          <ChevronDown aria-hidden="true" />
        </button>
      </div>
      {help && <small>{help}</small>}
      {open && (
        <ul id={listId} className={styles.list} role="listbox">
          {filtered.length ? (
            filtered.map((option, index) => (
              <li
                id={`${listId}-${option.value}`}
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                className={index === activeIndex ? styles.active : undefined}
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(option);
                }}
              >
                <span>{option.label}</span>
                {option.value === value && <Check aria-hidden="true" />}
              </li>
            ))
          ) : (
            <li className={styles.empty}>No matching option</li>
          )}
        </ul>
      )}
    </div>
  );
}
