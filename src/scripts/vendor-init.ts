/**
 * Vendor dependencies initialization
 * Imports npm packages and exposes them globally for legacy code compatibility
 */

// Import jQuery from our jquery-loader (which also sets it on window)
import $ from './jquery-loader';

// Import Popper from our popper-loader (which also sets it on window)
// This MUST be imported before Bootstrap Material Design
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Popper from './popper-loader';

// Import Moment and expose globally
import moment from 'moment';
window.moment = moment;

// Import Bootstrap - requires Popper to be available
import 'bootstrap';

// Import Bootstrap Material Design - requires both jQuery and Popper
import 'bootstrap-material-design';

// Import Snackbar and expose globally
import Snackbar from 'node-snackbar/src/js/snackbar.js';
window.Snackbar = Snackbar;

// Initialize Bootstrap Material Design when DOM is ready
$(function() {
  // @ts-ignore - bootstrapMaterialDesign is added by bootstrap-material-design
  $('body').bootstrapMaterialDesign();
});

console.log('Vendor dependencies loaded and initialized');
