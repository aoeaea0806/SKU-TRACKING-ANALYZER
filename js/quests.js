// ภารกิจรายวัน + รางวัลตัวละคร Wuthering Waves (เก็บข้อมูลใน localStorage ของเบราว์เซอร์)
(function(){
  const QKEY='wwQuestState',CKEY='wwCollection',SKEY='wwQuestStats';
  const ELEM={
    Aero:{c:'#55ffb5',th:'ลม'},Electro:{c:'#b96bff',th:'สายฟ้า'},Fusion:{c:'#ff7a4d',th:'หลอมรวม'},
    Glacio:{c:'#41aefb',th:'น้ำแข็ง'},Spectro:{c:'#f7e45c',th:'แสง'},Havoc:{c:'#e649a6',th:'ทำลาย'}
  };
  const CHARS=[
    // 5★
    ['Jiyan','Aero',5],['Calcharo','Electro',5],['Encore','Fusion',5],['Jianxin','Aero',5],['Lingyang','Glacio',5],
    ['Verina','Spectro',5],['Yinlin','Electro',5],['Changli','Fusion',5],['Xiangli Yao','Electro',5],['Zhezhi','Glacio',5],
    ['Jinhsi','Spectro',5],['Shorekeeper','Spectro',5],['Camellya','Havoc',5],['Carlotta','Glacio',5],['Roccia','Havoc',5],
    ['Phoebe','Spectro',5],['Brant','Fusion',5],['Cantarella','Havoc',5],['Zani','Spectro',5],['Ciaccona','Aero',5],['Cartethyia','Aero',5],
    // 4★
    ['Chixia','Fusion',4],['Baizhi','Glacio',4],['Sanhua','Glacio',4],['Danjin','Havoc',4],['Mortefi','Fusion',4],
    ['Taoqi','Havoc',4],['Yuanwu','Electro',4],['Aalto','Aero',4],['Yangyang','Aero',4],['Lumi','Electro',4],
    ['Buling','Electro',4],['Youhu','Glacio',4],['Lupa','Fusion',4]
  ];
  const QUESTS=[
    {id:'check1',icon:'🔍',title:'ตรวจ SKU ที่ตรงกัน',desc:'กด "ตรวจ SKU ที่ตรงกัน" 1 ครั้ง',goal:1,xp:1},
    {id:'login',icon:'🔑',title:'ล็อกอินเข้าใช้งาน',desc:'เข้าใช้งานระบบวันนี้',goal:1,xp:1},
    {id:'copy',icon:'📋',title:'คัดลอกผลลัพธ์',desc:'กดคัดลอกผลลัพธ์ 1 ครั้ง',goal:1,xp:1},
    {id:'result',icon:'📈',title:'ดูสรุปผล',desc:'เปิดแท็บ "สรุปผลที่ดึง"',goal:1,xp:1},
    {id:'history',icon:'🗓️',title:'ย้อนดูประวัติ',desc:'เปิดแท็บ "ประวัติรายวัน"',goal:1,xp:1}
  ];
  const $=id=>document.getElementById(id);
  const today=()=>typeof localDateKey==='function'?localDateKey():new Date().toISOString().slice(0,10);
  function load(k,d){try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}}
  function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  function state(){
    let s=load(QKEY,null);
    if(!s||s.date!==today())s={date:today(),progress:{},claimed:false};
    return s;
  }
  function bump(id){
    const q=QUESTS.find(x=>x.id===id);if(!q)return;
    const s=state();
    if(s.claimed)return;
    const before=s.progress[id]||0;
    if(before>=q.goal)return;
    s.progress[id]=before+1;
    save(QKEY,s);
    if(s.progress[id]>=q.goal&&typeof toast==='function')toast('✅ ภารกิจสำเร็จ: '+q.title);
    updateBadge();
    if($('questPanel')?.classList.contains('active'))render();
  }
  const done=s=>QUESTS.every(q=>(s.progress[q.id]||0)>=q.goal);
  function updateBadge(){
    const s=state(),n=QUESTS.filter(q=>(s.progress[q.id]||0)>=q.goal).length;
    const tab=$('questTab');if(!tab)return;
    const ready=done(s)&&!s.claimed;
    tab.classList.toggle('quest-ready',ready);
    tab.dataset.badge=s.claimed?'✓':(ready?'!':n+'/'+QUESTS.length);
  }

  // ---- ผูกกับการใช้งานจริงของแอป ----
  const _manual=window.manualCheck;
  if(typeof _manual==='function')window.manualCheck=function(){
    const r=_manual.apply(this,arguments);
    const a=($('manual1')?.value||'').trim(),b=($('manual2')?.value||'').trim();
    if(a||b)bump('check1');
    return r;
  };
  const _copy=window.copyText;
  if(typeof _copy==='function')window.copyText=function(){bump('copy');return _copy.apply(this,arguments)};
  const _tab=window.showTab;
  window.showTab=function(name){
    const r=_tab.apply(this,arguments);
    if(name==='result')bump('result');
    if(name==='daily')bump('history');
    if(name==='quest')render();
    return r;
  };

  // ---- สุ่มรางวัล ----
  function roll(stats){
    stats.claims=(stats.claims||0)+1;
    stats.pity=(stats.pity||0)+1;
    const guaranteed=stats.pity>=7;           // ครบ 7 ครั้งการันตี 5★
    const five=guaranteed||Math.random()<0.22;
    if(five)stats.pity=0;
    const pool=CHARS.filter(c=>c[2]===(five?5:4));
    return pool[Math.random()*pool.length|0];
  }
  function claim(){
    const s=state();
    if(!done(s)||s.claimed)return;
    const stats=load(SKEY,{claims:0,pity:0,streak:0,last:''});
    const y=new Date(today());y.setDate(y.getDate()-1);
    const yk=y.toISOString().slice(0,10);
    stats.streak=stats.last===yk?(stats.streak||0)+1:1;stats.last=today();
    const ch=roll(stats);
    const col=load(CKEY,{});
    const isNew=!col[ch[0]];
    col[ch[0]]=(col[ch[0]]||0)+1;
    s.claimed=true;s.reward=ch[0];
    save(CKEY,col);save(SKEY,stats);save(QKEY,s);
    updateBadge();
    reveal(ch,isNew);
    render();
  }

  function cardHTML(c,count,mini){
    const e=ELEM[c[1]],stars='★'.repeat(c[2]);
    return `<div class="wwc ${c[2]===5?'r5':'r4'} ${mini?'mini':''}" style="--ec:${e.c}">
      <div class="wwc-glow"></div>
      <img class="wwc-img" alt="${c[0]}" data-n="${c[0].toLowerCase().replace(/\s+/g,'-')}" data-i="0" src="img/chars/${c[0].toLowerCase().replace(/\s+/g,'-')}.png" onload="this.parentNode.classList.add('has-img')" onerror="wwImgErr(this)">
      <div class="wwc-el">${e.th}</div>
      <div class="wwc-init">${c[0][0]}</div>
      <div class="wwc-name">${c[0]}</div>
      <div class="wwc-stars">${stars}</div>
      ${count>1?`<div class="wwc-cnt">×${count}</div>`:''}
    </div>`;
  }
  function reveal(c,isNew){
    const e=ELEM[c[1]];
    const o=document.createElement('div');
    o.className='wwr '+(c[2]===5?'r5':'r4');
    o.style.setProperty('--ec',e.c);
    o.innerHTML=`<div class="wwr-rays"></div><div class="wwr-ring"></div><div class="wwr-ring r2"></div>
      <div class="wwr-box">
        <div class="wwr-title">🎉 ได้รับรางวัลรายวัน!</div>
        ${cardHTML(c,1,false)}
        <div class="wwr-info">${isNew?'<b class="new">NEW!</b> ':''}${c[0]} · ธาตุ${e.th} · ${'★'.repeat(c[2])}</div>
        <button class="primary" type="button">เก็บเข้าคลัง</button>
      </div>`;
    document.body.appendChild(o);
    const close=()=>{o.classList.add('out');setTimeout(()=>o.remove(),400)};
    o.querySelector('button').onclick=close;
    o.addEventListener('click',ev=>{if(ev.target===o)close()});
  }

  // ---- หน้าจอภารกิจ ----
  function render(){
    const p=$('questPanel');if(!p)return;
    const s=state(),stats=load(SKEY,{claims:0,pity:0,streak:0}),col=load(CKEY,{});
    const total=QUESTS.reduce((a,q)=>a+q.goal,0);
    const cur=QUESTS.reduce((a,q)=>a+Math.min(q.goal,s.progress[q.id]||0),0);
    const pct=Math.round(cur/total*100),ready=done(s)&&!s.claimed;
    const owned=CHARS.filter(c=>col[c[0]]);
    const ownedSorted=owned.sort((a,b)=>b[2]-a[2]);
    p.innerHTML=`
      <div class="resulttop"><div><h2>🎁 ภารกิจรายวัน</h2><div class="sub">ทำภารกิจครบทุกข้อเพื่อรับตัวละคร Wuthering Waves 1 ตัว • รีเซ็ตทุกวัน</div></div>
        <div class="q-stats"><span>🔥 ติดต่อกัน <b>${stats.streak||0}</b> วัน</span><span>✨ การันตี 5★ ใน <b>${Math.max(0,7-(stats.pity||0))}</b> ครั้ง</span></div></div>
      <div class="q-progress"><div class="q-bar"><i style="width:${pct}%"></i></div><span>${cur}/${total} • ${pct}%</span></div>
      <div class="q-list">
        ${QUESTS.map(q=>{const v=Math.min(q.goal,s.progress[q.id]||0),ok=v>=q.goal;
          return `<div class="q-item ${ok?'ok':''}"><div class="q-ic">${ok?'✅':q.icon}</div>
            <div class="q-tx"><b>${q.title}</b><small>${q.desc}</small></div>
            <div class="q-pg">${v}/${q.goal}</div></div>`}).join('')}
      </div>
      <div class="q-claim">
        ${s.claimed
          ?`<div class="q-done">✅ รับรางวัลวันนี้แล้ว${s.reward?` — ได้ <b>${s.reward}</b>`:''} กลับมาใหม่พรุ่งนี้!</div>`
          :`<button class="primary q-btn ${ready?'ready':''}" type="button" ${ready?'':'disabled'} onclick="wwClaimQuest()">${ready?'🎁 รับรางวัลตัวละคร':'🔒 ทำภารกิจให้ครบก่อน'}</button>`}
      </div>
      <h3 class="q-h3">🗂️ คลังตัวละคร <span class="badge">${owned.length}/${CHARS.length}</span></h3>
      ${owned.length?`<div class="q-grid">${ownedSorted.map(c=>cardHTML(c,col[c[0]],true)).join('')}</div>`:'<div class="empty">ยังไม่มีตัวละคร — ทำภารกิจวันนี้ให้ครบเพื่อรับตัวแรก</div>'}
    `;
  }
  // ลองหาไฟล์ภาพตามลำดับ .png → .webp → .jpg → .jpeg ถ้าไม่เจอจะแสดงตัวอักษรแทน
  window.wwImgErr=function(img){
    const ex=['webp','jpg','jpeg'],i=Number(img.dataset.i);
    if(i<ex.length){img.dataset.i=i+1;img.src='img/chars/'+img.dataset.n+'.'+ex[i]}
    else img.remove();
  };
  window.wwClaimQuest=claim;
  bump('login');   // เข้าใช้งานวันนี้ = ล็อกอินสำเร็จอัตโนมัติ
  updateBadge();
})();
