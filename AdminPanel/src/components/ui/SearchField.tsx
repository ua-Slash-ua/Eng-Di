type SearchFieldProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchField({ id = 'search', value, onChange, placeholder = 'Пошук…' }: SearchFieldProps) {
  return (
    <input
      id={id}
      className="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
  );
}
