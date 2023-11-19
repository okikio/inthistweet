/**
 * Converts a URL to a file path including the origin.
 * 
 * This function takes a URL and transforms it into a file path format. The origin of the URL
 * (protocol and domain) is included in the path, and special characters are handled to ensure
 * a valid file path is generated. This is useful for creating unique file paths based on URLs.
 * 
 * @param urlStr - The URL string to be converted to a file path.
 * @returns A string representing the file path including the URL's origin.
 */
export function urlToFilePath(urlStr: string): string {
  const url = new URL(urlStr);

  // Replace special characters that are not valid in file paths.
  // Adjust the replacement logic based on your file system and requirements.
  const safePath = url.pathname.replace(/[^a-zA-Z0-9\-_\.\/]/g, '_');

  // Combine the origin and the pathname to form the file path.
  // The origin replaces '://' with '_' and removes any trailing slashes for a cleaner path.
  return `${url.origin.replace(/[:\/]/g, '_')}${safePath}`;
}