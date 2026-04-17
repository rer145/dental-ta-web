/**
 * Global type declarations for vendor libraries exposed on window
 */

import type jQuery from 'jquery';
import type Popper from 'popper.js';
import type moment from 'moment';

// Declare module for node-snackbar
declare module 'node-snackbar/src/js/snackbar.js' {
  const Snackbar: any;
  export default Snackbar;
}

declare global {
  interface Window {
    $: typeof jQuery;
    jQuery: typeof jQuery;
    Popper: typeof Popper;
    moment: typeof moment;
    Snackbar: any;
  }

  // Make $ and jQuery available globally in non-module scripts
  const $: typeof jQuery;
  const jQuery: typeof jQuery;

  // Make Popper available globally
  const Popper: typeof Popper;
}

export {};
