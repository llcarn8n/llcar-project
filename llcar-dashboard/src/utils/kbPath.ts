/**
 * Derive KB generation folder path from brandId and generation name.
 * Generation name format: "K5 II 2023-н.в." → "kia/k5/k5_ii_2023"
 */
export function deriveKBGenPath(brandId: string, generationName: string): string | null {
  const match = generationName.match(/^(.+?)\s+(I{1,3}V?|V?I{0,3})\s+(\d{4})/)
  if (!match) return null
  const model = match[1].toLowerCase().replace(/\s+/g, '_')
  const roman = match[2].toLowerCase()
  const year = match[3]
  return `${brandId}/${model}/${model}_${roman}_${year}`
}
