export function getString(formData: FormData, key: string): string {
  return ((formData.get(key) as string) ?? "").trim();
}

export function getOptionalString(formData: FormData, key: string): string | null {
  const val = getString(formData, key);
  return val || null;
}

export function getNumber(formData: FormData, key: string): number {
  return parseFloat(getString(formData, key));
}

export function getInt(formData: FormData, key: string): number {
  return parseInt(getString(formData, key), 10);
}
