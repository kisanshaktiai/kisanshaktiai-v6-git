import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useDebouncedCallback } from '@/hooks/useDebounce';

interface DebouncedInputProps extends React.ComponentProps<typeof Input> {
  onDebouncedChange: (value: string) => void;
  debounceMs?: number;
}

export const DebouncedInput: React.FC<DebouncedInputProps> = React.memo(({
  onDebouncedChange,
  debounceMs = 300,
  ...props
}) => {
  const [value, setValue] = useState(props.value || '');

  const debouncedCallback = useDebouncedCallback(
    (newValue: string) => {
      onDebouncedChange(newValue);
    },
    debounceMs
  );

  useEffect(() => {
    debouncedCallback(value as string);
  }, [value, debouncedCallback]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    // Call original onChange if provided
    if (props.onChange) {
      props.onChange(e);
    }
  };

  return (
    <Input
      {...props}
      value={value}
      onChange={handleChange}
    />
  );
});