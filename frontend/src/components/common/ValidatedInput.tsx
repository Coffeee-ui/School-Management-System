import React, { useState, useEffect, useId, forwardRef } from 'react';

export interface ValidatedInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  validator?: (val: string) => string | null;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
  externalError?: string | null;
  name?: string;
  autoComplete?: string;
}

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  (
    {
      label,
      value,
      onChange,
      validator,
      type = 'text',
      placeholder,
      required = false,
      disabled = false,
      helpText,
      externalError,
      name,
      autoComplete,
    },
    ref
  ) => {
    const id = useId();
    const errorId = `${id}-error`;
    const helpId = `${id}-help`;

    const [touched, setTouched] = useState<boolean>(false);
    const [internalError, setInternalError] = useState<string | null>(null);

    // Validate on value change if touched
    useEffect(() => {
      if (validator && touched) {
        setInternalError(validator(value));
      }
    }, [value, validator, touched]);

    const handleBlur = () => {
      setTouched(true);
      if (validator) {
        setInternalError(validator(value));
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVal = e.target.value;
      onChange(newVal);
      if (touched && validator) {
        setInternalError(validator(newVal));
      }
    };

    const displayError = externalError || (touched ? internalError : null);
    const isInvalid = Boolean(displayError);

    return (
      <div className={`form-field ${isInvalid ? 'has-error' : ''}`}>
        <label htmlFor={id} className="field-label">
          {label}
          {required && <span className="required-star" aria-hidden="true">*</span>}
        </label>

        <div className="input-wrapper">
          <input
            ref={ref}
            id={id}
            name={name}
            type={type}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            autoComplete={autoComplete}
            aria-invalid={isInvalid}
            aria-describedby={
              displayError ? errorId : helpText ? helpId : undefined
            }
            className={`field-input ${isInvalid ? 'input-error' : ''}`}
          />
        </div>

        {displayError && (
          <div id={errorId} className="field-error-message" role="alert">
            {displayError}
          </div>
        )}

        {helpText && !displayError && (
          <div id={helpId} className="field-help-text">
            {helpText}
          </div>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = 'ValidatedInput';
