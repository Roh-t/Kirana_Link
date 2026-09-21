export function getOptimizedImageUrl(url, width = 480) {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) {
    return url;
  }

  return url.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_${width},c_fill/`);
}
