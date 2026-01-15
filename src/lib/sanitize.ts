import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks.
 * This function removes potentially dangerous HTML elements and attributes
 * while preserving safe formatting tags.
 * 
 * @param dirty - The potentially unsafe HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export const sanitizeHTML = (dirty: string | null | undefined): string => {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 
      'a', 'blockquote', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img', 'figure', 'figcaption',
      'hr', 'span', 'div'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 
      'src', 'alt', 'title', 'width', 'height',
      'class', 'id'
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'style', 'link', 'form', 'input', 'button', 'textarea'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit', 'onchange', 'onkeydown', 'onkeyup', 'onkeypress'],
    // Force all links to open in new tab with security attributes
    ADD_ATTR: ['target', 'rel'],
    RETURN_TRUSTED_TYPE: false,
  });
};

/**
 * Sanitize and add security attributes to links in HTML content.
 * @param dirty - The potentially unsafe HTML string
 * @returns Sanitized HTML with secure link attributes
 */
export const sanitizeHTMLWithSecureLinks = (dirty: string | null | undefined): string => {
  const sanitized = sanitizeHTML(dirty);
  
  // Add rel="noopener noreferrer" to all links for security
  return sanitized.replace(
    /<a\s+([^>]*href[^>]*)>/gi,
    (match, attrs) => {
      if (!attrs.includes('rel=')) {
        return `<a ${attrs} rel="noopener noreferrer">`;
      }
      return match;
    }
  );
};
