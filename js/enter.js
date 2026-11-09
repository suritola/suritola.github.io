/* tasteskill head lines (references/motion.md, moments.md), moved out of <head> because the CSP allows no inline script:
   the hero's words wait for motion.js instead of flashing, and the moments' guard. Loaded plain, before the first paint. */
document.documentElement.classList.add('m-enter');
setTimeout(function(){ document.documentElement.classList.add('m-enter-done'); }, 700);
document.documentElement.classList.add('mo-js');
setTimeout(function(){ document.documentElement.classList.add('mo-safe'); }, 2500);
