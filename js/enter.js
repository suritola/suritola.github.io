/* tasteskill head line (references/motion.md), moved out of <head> because the CSP allows no inline script:
   the hero's words wait for motion.js instead of flashing. Loaded plain, before the first paint.
   ?live keeps the motion running in a headless capture (motion.js and home.js read data-motion="live"). */
document.documentElement.classList.add('m-enter');
setTimeout(function(){ document.documentElement.classList.add('m-enter-done'); }, 700);
if (/[?&]live\b/.test(location.search)) document.documentElement.dataset.motion = 'live';
