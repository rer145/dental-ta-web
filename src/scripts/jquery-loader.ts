/**
 * jQuery loader - loads jQuery and exposes it globally
 * Other modules should import this file to ensure jQuery is available
 */

import $ from 'jquery';

// Expose jQuery globally for legacy code
window.$ = window.jQuery = $;

console.log('jQuery loaded and available globally');

// Export for modules that want to import it
export default $;
export { $ };
