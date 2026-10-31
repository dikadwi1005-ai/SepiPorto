// Compare all section positions together, rather than only the entries changed
// in one IntersectionObserver callback (which can leave an older item active).
export function sectionAtViewport(sections, viewportHeight) {
  const line = Math.min(200, viewportHeight * .28);
  let active = 'utama';
  for (const section of sections) {
    if (section.top <= line) active = section.id;
  }
  return active;
}
