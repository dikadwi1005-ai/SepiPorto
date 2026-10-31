// Upload results are patches: adding a PDF must not clear its image (or vice versa).
export function mediaPatch(url, isPdf = false) {
  return isPdf ? { document: url } : { image: url };
}

export function updateCertificateMedia(profile, id, patch) {
  return {
    ...profile,
    certificates: profile.certificates.map(item => item.id === id ? { ...item, ...patch } : item),
  };
}
