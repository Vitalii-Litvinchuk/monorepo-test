'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import styles from './custom-select.module.scss';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  onActionClick?: () => void;
  actionLabel?: string;
  ariaLabel?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  style,
  onActionClick,
  actionLabel,
  ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className}`}
      style={style}
    >
      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || displayLabel}
      >
        <span className={styles.valueText} title={displayLabel}>
          {displayLabel}
        </span>
        <ChevronDown
          size={16}
          className={`${styles.chevron} ${isOpen ? styles.rotated : ''}`}
        />
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu} role="listbox">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                className={`${styles.optionItem} ${
                  isSelected ? styles.selected : ''
                }`}
                onClick={() => handleSelect(opt.value)}
                role="option"
                aria-selected={isSelected}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={14} />}
              </div>
            );
          })}

          {onActionClick && actionLabel && (
            <>
              <div className={styles.actionDivider} />
              <div
                className={styles.actionItem}
                onClick={() => {
                  setIsOpen(false);
                  onActionClick();
                }}
              >
                <Plus size={14} />
                <span>{actionLabel}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
