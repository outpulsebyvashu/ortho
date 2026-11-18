(function(){
var reg={};
function mk(cid,did){
var c=document.getElementById(cid),d=document.getElementById(did);if(!c)return;
var orig=[].slice.call(c.children),N=orig.length;
[0,1].forEach(function(){orig.forEach(function(e){var k=e.cloneNode(true);k.setAttribute('aria-hidden','true');c.appendChild(k)})});
for(var i=0;i<N;i++){d.appendChild(document.createElement('i'))}
function step(){return c.children[0].offsetWidth+20}
function idx(){return Math.round(c.scrollLeft/step())}
function dots(){var k=((idx()%N)+N)%N;[].forEach.call(d.children,function(x,i){x.className=i===k?'on':''})}
function jump(i){c.style.scrollSnapType='none';c.style.scrollBehavior='auto';c.scrollLeft=i*step();void c.offsetWidth;c.style.scrollSnapType='';c.style.scrollBehavior=''}
function norm(){var i=idx();if(i<N){jump(i+N)}else if(i>=2*N){jump(i-N)}}
requestAnimationFrame(function(){jump(N);dots()});
var t;c.addEventListener('scroll',function(){dots();clearTimeout(t);t=setTimeout(norm,140)});
function go(dir){c.scrollTo({left:(idx()+dir)*step(),behavior:'smooth'})}
reg[cid]=go;
var paused=false,rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
['pointerdown','touchstart','mouseenter','focusin'].forEach(function(ev){c.addEventListener(ev,function(){paused=true})});
['pointerup','touchend','mouseleave','focusout'].forEach(function(ev){c.addEventListener(ev,function(){setTimeout(function(){paused=false},1800)})});
if(!rm)setInterval(function(){if(!paused&&!document.hidden)go(1)},3500);
window.addEventListener('resize',function(){jump(idx())});
}
window.carGo=function(id,dir){if(reg[id])reg[id](dir)};
mk('car','dots');mk('car2','dots2');
})();
(function(){
if(!('IntersectionObserver' in window))return;
var els=[];
document.querySelectorAll('section .wrap > *').forEach(function(e){els.push(e)});
document.querySelectorAll('.card,.steps div,.stats > div,.vids figure,.ph,.ph').forEach(function(e){
  var p=e.parentElement;var i=[].indexOf.call(p.children,e);e.style.setProperty('--d',(i*0.1)+'s');
  var a=e.closest('section .wrap > *');if(a&&a!==e){var k=els.indexOf(a);if(k>-1)els.splice(k,1)}
  if(els.indexOf(e)<0)els.push(e)});
var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
els.forEach(function(e){e.classList.add('rv');io.observe(e)});
})();
(function(){
var items=[].slice.call(document.querySelectorAll('.has-menu'));
items.forEach(function(li){var b=li.querySelector('.nav-btn');
 b.addEventListener('click',function(e){e.stopPropagation();var o=li.classList.contains('open');items.forEach(function(x){x.classList.remove('open');x.querySelector('.nav-btn').setAttribute('aria-expanded','false')});if(!o){li.classList.add('open');b.setAttribute('aria-expanded','true')}});
 li.addEventListener('mouseenter',function(){b.setAttribute('aria-expanded','true')});
 li.addEventListener('mouseleave',function(){if(!li.classList.contains('open'))b.setAttribute('aria-expanded','false')});});
document.addEventListener('click',function(){items.forEach(function(x){x.classList.remove('open');x.querySelector('.nav-btn').setAttribute('aria-expanded','false')})});
document.addEventListener('keydown',function(e){if(e.key==='Escape')items.forEach(function(x){x.classList.remove('open');x.querySelector('.nav-btn').setAttribute('aria-expanded','false');if(x.contains(document.activeElement)&&document.activeElement.blur)document.activeElement.blur()})});
})();

(function(){
var de=document.documentElement;
function cookie(n){var m=document.cookie.match(new RegExp('(?:^|; )'+n+'=([^;]*)'));return m?decodeURIComponent(m[1]):null}
function setCookie(n,v){document.cookie=n+'='+encodeURIComponent(v)+'; Max-Age=15552000; Path=/; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'')}
var ck=document.getElementById('ck');
if(ck){if(!cookie('consent')){ck.hidden=false}
 [].forEach.call(ck.querySelectorAll('button'),function(b){b.addEventListener('click',function(){setCookie('consent',b.getAttribute('data-v'));ck.hidden=true})})}
var lite=de.className.indexOf('lite')>-1;
var vs=[].slice.call(document.querySelectorAll('video[data-src]'));
if(lite||!('IntersectionObserver' in window)){return}
var io=new IntersectionObserver(function(en){en.forEach(function(x){var v=x.target;
 if(x.isIntersecting){if(!v.getAttribute('src')){v.setAttribute('src',v.getAttribute('data-src'))}var p=v.play&&v.play();if(p&&p.catch)p.catch(function(){})}else if(v.pause){v.pause()}})},{rootMargin:'120px'});
vs.forEach(function(v){io.observe(v)});
document.addEventListener('visibilitychange',function(){if(document.hidden)vs.forEach(function(v){v.pause&&v.pause()})});
})();
