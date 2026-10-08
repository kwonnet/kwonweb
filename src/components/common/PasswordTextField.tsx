'use client';
import {useState} from 'react';
import {IconButton, InputAdornment, TextField, type TextFieldProps} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

type PasswordTextFieldProps = Omit<TextFieldProps, 'type'>;

/** MUI password adornment; each field owns its visibility state. */
export default function PasswordTextField({slotProps, disabled, label, ...props}: PasswordTextFieldProps) {
  const [visible, setVisible] = useState(false);
  const fieldName = typeof label === 'string' ? label.toLowerCase() : 'password';
  return (
    <TextField
      {...props}
      label={label}
      disabled={disabled}
      type={visible ? 'text' : 'password'}
      slotProps={{
        ...slotProps,
        input: ownerState => {
          const input = typeof slotProps?.input === 'function' ? slotProps.input(ownerState) : slotProps?.input;
          return {
            ...input,
            endAdornment: <>
              {input?.endAdornment}
              <InputAdornment position="end">
                <IconButton
                  type="button"
                  aria-label={`${visible ? 'Hide' : 'Show'} ${fieldName}`}
                  aria-pressed={visible}
                  disabled={disabled}
                  onClick={() => setVisible(current => !current)}
                  onMouseDown={event => event.preventDefault()}
                  onMouseUp={event => event.preventDefault()}
                  edge="end"
                >
                  {visible ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            </>,
          };
        },
      }}
    />
  );
}
