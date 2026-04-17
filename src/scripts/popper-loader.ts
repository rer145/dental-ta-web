/**
 * Popper.js loader - loads Popper and exposes it globally
 * Bootstrap requires Popper to be available on window.Popper
 */

import Popper from 'popper.js';

// Expose Popper globally for Bootstrap
window.Popper = Popper;

console.log('Popper.js loaded and available globally');

// Export for modules that want to import it
export default Popper;
export { Popper };
