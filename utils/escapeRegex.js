/**
 * Escapes special regex characters in a string to prevent ReDoS attacks.
 * This ensures user input is treated as a literal string, not a regex pattern.
 * @param {string} text - The user input to escape
 * @returns {string} - The escaped string safe for use in new RegExp()
 */
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

module.exports = escapeRegex;
