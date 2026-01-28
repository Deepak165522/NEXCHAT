export const urlToFile = async (url, filename = "forwarded") => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
};
