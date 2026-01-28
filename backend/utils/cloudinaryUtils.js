function extractCloudinaryPublicId(url) {
  if (!url) return null;

  const parts = url.split("/");
  const fileWithExt = parts.pop();
  const folder = parts.pop();

  return `${folder}/${fileWithExt.split(".")[0]}`;
}

module.exports = { extractCloudinaryPublicId };
