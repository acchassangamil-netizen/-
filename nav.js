const mainNavigation=document.getElementById('main-nav');
const navigationGroups=Array.from(mainNavigation.querySelectorAll('.nav-dropdown'));
function closeNavigation(){navigationGroups.forEach(g=>g.open=false)}
function updateNavigation(currentView){
 const fromNav=mainNavigation.contains(document.activeElement);
 mainNavigation.querySelectorAll('button[data-view]').forEach(b=>{const active=b.dataset.view===currentView;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
 navigationGroups.forEach(g=>{g.classList.toggle('has-active',!!g.querySelector('button.active'));g.open=false});
 if(fromNav){const title=document.getElementById('title');title.setAttribute('tabindex','-1');title.focus({preventScroll:true})}
}
navigationGroups.forEach(g=>{
 const summary=g.querySelector('summary'),items=()=>Array.from(g.querySelectorAll('button[data-view]'));
 g.addEventListener('toggle',()=>{summary.setAttribute('aria-expanded',String(g.open));if(g.open)navigationGroups.forEach(other=>{if(other!==g)other.open=false})});
 summary.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();g.open=true;const list=items();list[e.key==='ArrowDown'?0:list.length-1]?.focus()}});
 g.querySelector('.nav-menu').addEventListener('keydown',e=>{const list=items(),i=list.indexOf(document.activeElement);let next;if(e.key==='ArrowDown')next=(i+1)%list.length;else if(e.key==='ArrowUp')next=(i-1+list.length)%list.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=list.length-1;else return;e.preventDefault();list[next]?.focus()});
 summary.setAttribute('aria-expanded','false');
});
document.addEventListener('pointerdown',e=>{if(!mainNavigation.contains(e.target))closeNavigation()});
mainNavigation.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const open=navigationGroups.find(g=>g.open);if(open){e.preventDefault();closeNavigation();open.querySelector('summary').focus()}});
// focusout occurs before the browser focuses the next menu button. Use the
// destination, rather than activeElement, to avoid hiding it before click fires.
mainNavigation.addEventListener('focusout',e=>{if(e.relatedTarget&&!mainNavigation.contains(e.relatedTarget))closeNavigation()});
updateNavigation(view);

