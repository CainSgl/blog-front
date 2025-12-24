/**
 * Generate an anchor ID from a title string
 * @param {string} title - The title text
 * @returns {string} - The generated anchor ID
 */
export function generateAnchorId(title) {
  // Convert to lowercase and replace spaces with hyphens
  // Remove special characters and keep only alphanumeric and hyphens
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Add anchors to markdown headings
 * @param {string} markdown - The markdown content
 * @returns {string} - The markdown content with added anchors
 */
export function addAnchorsToMarkdown(markdown) {
  // Regular expression to match markdown headings (h1-h6)
  // This matches lines starting with 1-6 # characters followed by a space and the title
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  
  return markdown.replace(headingRegex, (match, hashes, title) => {
    const anchorId = generateAnchorId(title);
    // Add the anchor ID to the heading
    return `${hashes} ${title}{#${anchorId}}`;
  });
}

export default {
  generateAnchorId,
  addAnchorsToMarkdown
};