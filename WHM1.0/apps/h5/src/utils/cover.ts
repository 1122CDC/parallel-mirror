export function buildBranchCoverUrl(profession: string, workplace: string) {
  const query = encodeURIComponent(`${profession},${workplace},china,work`)
  return `https://source.unsplash.com/featured/1200x900/?${query}`
}
