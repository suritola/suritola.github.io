/* 민공방 게임즈 로고 애니메이션. MGIdent.play(부모요소, {sound:true, onDone:fn, freezeAt:ms}) — build_ident.py 가 만든 파일, 손으로 고치지 않는다 */
(function(){
var D={"box":[10,0,90,92],"colors":{"paper":"#F1EADB","ink":"#22253A","red":"#C4472C"},"polys":[{"color":"ink","pts":[[10.48,14.22],[51.94,14.11],[39.55,25.79],[22.11,25.71]],"id":"m_top"},{"color":"ink","pts":[[51.99,14.85],[51.4,55.25],[39.85,43.88],[40.52,25.95]],"id":"m_right"},{"color":"ink","pts":[[11.06,56.36],[22.63,44.43],[39.17,43.77],[51.5,55.36]],"id":"m_bottom"},{"color":"ink","pts":[[9.81,14.24],[21.18,26.42],[21.63,43.92],[10.17,55.63]],"id":"m_left"},{"color":"red","pts":[[10.46,56.48],[21.5,56.06],[22.09,64.24],[10.83,63.92]],"id":"conn_a"},{"color":"ink","pts":[[10.06,64.19],[21.5,64.01],[21.87,79.54],[10.56,91.36]],"id":"n_vert"},{"color":"ink","pts":[[11.05,92.3],[21.99,79.8],[75.91,80.09],[87.98,91.8]],"id":"n_horiz"},{"color":"red","pts":[[75.73,56.65],[88.1,56.26],[87.39,91.29],[76.82,79.83]],"id":"conn_b"},{"color":"ink","pts":[[75.78,26.23],[87.36,26.03],[88.12,55.13],[76.27,55.43]],"id":"candle"},{"color":"ink","pts":[[27.44,30.23],[36.54,35.16],[27.36,39.94]],"id":"play"}],"wick":{"from":[81.9,21.2],"to":[82.3,25.6],"width":1.5},"flame":"M83 0.5C87.2 7.2 90.3 11.2 89.8 16.2C89.3 21.2 85.6 23.6 81.8 23.4C77.6 23.2 74.2 20.4 74.3 15.6C74.4 11.4 78.6 7.4 83 0.5z","flameInner":"M82.3 10.4C84.6 13.2 85.8 15.2 85.5 17.2C85.2 19.2 83.7 20.2 82 20.1C80.2 20 78.9 18.7 79 16.8C79.1 14.8 80.6 13 82.3 10.4z","flameBase":[82,23.4],"timeline":[{"id":"n_horiz","kind":"drop","t":100,"rot":-5,"note":50},{"id":"n_vert","kind":"drop","t":270,"rot":6,"note":57},{"id":"conn_a","kind":"unfold","t":470,"from":"bottom"},{"id":"m_bottom","kind":"drop","t":520,"rot":4,"note":62},{"id":"m_left","kind":"drop","t":610,"rot":-6,"note":64},{"id":"m_right","kind":"drop","t":700,"rot":5,"note":66},{"id":"m_top","kind":"drop","t":790,"rot":-4,"note":69},{"id":"conn_b","kind":"unfold","t":1010,"from":"bottom"},{"id":"candle","kind":"drop","t":1090,"rot":4,"note":71},{"id":"wick","kind":"pop","t":1330},{"id":"play","kind":"pop","t":1330,"tick":true},{"id":"flame","kind":"flame","t":1620,"arp":[74,78,81,86]}],"drop":{"durMs":330,"fallPart":0.7,"height":62,"bounce":1.8},"unfoldMs":170,"popMs":210,"flameMs":280,"arpStepMs":75,"wordmark":{"ko":"민공방 게임즈","en":"MINGONGBANG GAMES","t":1760,"fadeMs":320},"holdUntilMs":3100,"fadeOutMs":380};
var NS="http://www.w3.org/2000/svg";
function el(n,a){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);return e}
function clamp(x){return x<0?0:x>1?1:x}
function back(u){u=clamp(u);var c=1.9;return 1+(c+1)*Math.pow(u-1,3)+c*Math.pow(u-1,2)}
function center(p){var x=0,y=0;p.forEach(function(q){x+=q[0];y+=q[1]});return[x/p.length,y/p.length]}
function bounds(p){var a=[1e9,1e9,-1e9,-1e9];p.forEach(function(q){a[0]=Math.min(a[0],q[0]);a[1]=Math.min(a[1],q[1]);a[2]=Math.max(a[2],q[0]);a[3]=Math.max(a[3],q[1])});return a}
function play(parent,opt){
  opt=opt||{};
  var wrap=document.createElement("div");
  wrap.style.cssText="position:fixed;inset:0;z-index:2147483000;background:"+D.colors.paper+";display:flex;align-items:center;justify-content:center;flex-direction:column;cursor:pointer";
  wrap.setAttribute("role","img");wrap.setAttribute("aria-label",D.wordmark.ko);
  var svg=el("svg",{viewBox:"0 -8 100 108",width:"320",height:"346"});svg.style.cssText="overflow:visible;width:min(40vmin,320px);height:auto";
  var f=el("filter",{id:"mgi-rg",x:"-10%",y:"-60%",width:"120%",height:"220%"});
  f.appendChild(el("feTurbulence",{type:"fractalNoise",baseFrequency:"0.045",numOctaves:"2",seed:"4"}));
  f.appendChild(el("feDisplacementMap",{"in":"SourceGraphic",scale:"1.3"}));svg.appendChild(f);
  var root=el("g",{filter:"url(#mgi-rg)"});svg.appendChild(root);
  var nodes={},meta={};
  D.polys.forEach(function(p){var n=el("path",{d:"M"+p.pts.map(function(q){return q[0]+" "+q[1]}).join(" L")+"z",fill:D.colors[p.color]});n.style.opacity=0;root.appendChild(n);nodes[p.id]=n;meta[p.id]={c:center(p.pts),b:bounds(p.pts)}});
  var w=el("path",{d:"M"+D.wick.from.join(" ")+"L"+D.wick.to.join(" "),stroke:D.colors.ink,"stroke-width":D.wick.width,"stroke-linecap":"round"});w.style.opacity=0;root.appendChild(w);nodes.wick=w;meta.wick={c:[82.1,23.4]};
  var fl=el("g",{});fl.appendChild(el("path",{d:D.flame,fill:D.colors.red}));fl.appendChild(el("path",{d:D.flameInner,fill:D.colors.paper}));fl.style.opacity=0;root.appendChild(fl);nodes.flame=fl;
  var txt=document.createElement("div");
  txt.style.cssText="margin-top:min(4vmin,30px);text-align:center;color:"+D.colors.ink+";opacity:0;font-family:'MaruBuri','Nanum Myeongjo','Noto Serif KR',serif";
  txt.innerHTML='<div style="font-weight:700;font-size:min(6.2vmin,46px);letter-spacing:-0.03em;line-height:1.1">'+D.wordmark.ko+'</div><div style="margin-top:.7em;font-size:min(1.9vmin,14px);letter-spacing:.42em;opacity:.62;padding-left:.42em">'+D.wordmark.en+'</div>';
  wrap.appendChild(svg);wrap.appendChild(txt);(parent||document.body).appendChild(wrap);
  var dr=D.drop;
  function render(t){
    D.timeline.forEach(function(s){
      var n=nodes[s.id],u,tr="",op=1;
      if(t<s.t){n.style.opacity=0;return}
      if(s.kind==="drop"){
        var c=meta[s.id].c;u=(t-s.t)/dr.durMs;var y=0,r=0;
        if(u<dr.fallPart){var p=u/dr.fallPart;y=-dr.height*(1-p*p);r=s.rot*(1-p);op=clamp(p*4)}
        else if(u<1){var q=(u-dr.fallPart)/(1-dr.fallPart);var k=Math.sin(Math.PI*q)*(1-q);y=dr.bounce*k;r=-s.rot*0.18*k}
        tr="translate(0 "+y.toFixed(2)+") rotate("+r.toFixed(2)+" "+c[0].toFixed(2)+" "+c[1].toFixed(2)+")";
      }else if(s.kind==="unfold"){
        var b=meta[s.id].b;u=back((t-s.t)/D.unfoldMs);var oy=s.from==="bottom"?b[3]:b[1];
        tr="translate(0 "+oy+") scale(1 "+Math.max(0.001,u).toFixed(3)+") translate(0 "+(-oy)+")";
      }else if(s.kind==="pop"){
        var cc=meta[s.id].c;u=back((t-s.t)/D.popMs);
        tr="translate("+cc[0]+" "+cc[1]+") scale("+Math.max(0.001,u).toFixed(3)+") translate("+(-cc[0])+" "+(-cc[1])+")";
      }else if(s.kind==="flame"){
        var fb=D.flameBase,g=back((t-s.t)/D.flameMs),tt=t-s.t-D.flameMs;var sy=g,sk=0;
        if(tt>0){sy=1+0.05*Math.sin(tt/95)+0.03*Math.sin(tt/41);sk=2.2*Math.sin(tt/140)}
        tr="translate("+fb[0]+" "+fb[1]+") skewX("+sk.toFixed(2)+") scale("+Math.max(0.001,(g>1?1:g)*(tt>0?1:1)).toFixed(3)+" "+Math.max(0.001,sy).toFixed(3)+") translate("+(-fb[0])+" "+(-fb[1])+")";
      }
      n.style.opacity=op;n.setAttribute("transform",tr);
    });
    var wm=D.wordmark,a=clamp((t-wm.t)/wm.fadeMs),e=1-Math.pow(1-a,3);
    txt.style.opacity=e;txt.style.transform="translateY("+(8*(1-e)).toFixed(2)+"px)";
    wrap.style.opacity=1-clamp((t-D.holdUntilMs)/D.fadeOutMs);
  }
  /* 소리: 종이·나무가 닿는 짧은 '툭'(걸러진 잡음) + 마림바 같은 음(기본음 + 빨리 사라지는 4배음). 브라우저가 막으면 조용히 그림만 */
  var ac=null;
  function audio(t0){
    try{var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ac=new AC();if(ac.state==="suspended"){ac.resume().catch(function(){})}}catch(e){return}
    var out=ac.createGain();out.gain.value=0.5;out.connect(ac.destination);
    function hz(m){return 440*Math.pow(2,(m-69)/12)}
    function tone(at,m,vol,len){var o=ac.createOscillator(),o2=ac.createOscillator(),g=ac.createGain(),g2=ac.createGain();
      o.type="sine";o.frequency.value=hz(m);o2.type="sine";o2.frequency.value=hz(m)*4;
      g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(vol,at+0.004);g.gain.exponentialRampToValueAtTime(0.0001,at+len);
      g2.gain.setValueAtTime(0,at);g2.gain.linearRampToValueAtTime(vol*0.22,at+0.003);g2.gain.exponentialRampToValueAtTime(0.0001,at+0.09);
      o.connect(g);o2.connect(g2);g.connect(out);g2.connect(out);o.start(at);o2.start(at);o.stop(at+len+0.05);o2.stop(at+0.15)}
    function thud(at,vol,cut){var n=Math.floor(ac.sampleRate*0.07),buf=ac.createBuffer(1,n,ac.sampleRate),d=buf.getChannelData(0);
      for(var i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.2);
      var s=ac.createBufferSource(),lp=ac.createBiquadFilter(),g=ac.createGain();s.buffer=buf;lp.type="lowpass";lp.frequency.value=cut;g.gain.value=vol;
      s.connect(lp);lp.connect(g);g.connect(out);s.start(at)}
    var base=ac.currentTime+0.02-t0/1000;
    D.timeline.forEach(function(s){
      if(s.kind==="drop"){var at=base+(s.t+dr.durMs*dr.fallPart)/1000;if(at<ac.currentTime)return;thud(at,0.55,620);tone(at,s.note,0.34,0.55)}
      else if(s.tick){var a2=base+(s.t+40)/1000;if(a2>=ac.currentTime)thud(a2,0.4,2600)}
      else if(s.kind==="flame"){s.arp.forEach(function(m,i){var a3=base+(s.t+60+i*D.arpStepMs)/1000;if(a3>=ac.currentTime)tone(a3,m,i===s.arp.length-1?0.2:0.26,i===s.arp.length-1?1.6:0.9)})}
    });
  }
  var done=false,raf=0,start=0;
  function finish(){if(done)return;done=true;cancelAnimationFrame(raf);if(wrap.parentNode)wrap.parentNode.removeChild(wrap);try{if(ac)setTimeout(function(){ac.close()},1800)}catch(e){}if(opt.onDone)opt.onDone()}
  if(opt.freezeAt!=null){render(opt.freezeAt);return{el:wrap,stop:finish}}
  function frame(now){if(!start)start=now;var t=now-start;render(t);if(t>=D.holdUntilMs+D.fadeOutMs){finish();return}raf=requestAnimationFrame(frame)}
  wrap.addEventListener("click",finish);
  function key(e){if(e.key==="Escape"||e.key==="Enter"||e.key===" "){document.removeEventListener("keydown",key);finish()}}
  document.addEventListener("keydown",key);
  render(0);raf=requestAnimationFrame(frame);if(opt.sound!==false)audio(0);
  return{el:wrap,stop:finish};
}
window.MGIdent={play:play,data:D};
})();
