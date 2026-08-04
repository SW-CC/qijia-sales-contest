/* 齊家輪盤共用音效組：Web Audio 即時合成的四種轉盤配樂（無外部音檔、無版權問題）。
   齊家獎勵輪盤 lottery.html 與 齊家次序輪盤 order.html 共用；改曲風只改這一支。
   用法：WheelSound.setMuted(bool) / .styles() / .setStyle(id) / .start(ms,id) / .preview(id,ms) / .climax() / .win()。*/
window.WheelSound = (()=>{
  let ctx=null, bus=null, timer=null, step=0, next=0, t0=0, dur=0, sty='power', muted=false;
  const CHORDS=[[0,4,7],[7,11,14],[9,12,16],[5,9,12]];   // C - G - Am - F
  const hz = n => 261.63*Math.pow(2,n/12);
  const VOL = 0.85;
  function ensure(){
    try{
      if(!ctx){
        const AC = window.AudioContext||window.webkitAudioContext;
        if(!AC) return null;
        ctx = new AC();
        bus = ctx.createGain(); bus.gain.value=VOL; bus.connect(ctx.destination);
      }
      if(ctx.state==='suspended') ctx.resume();
      return ctx;
    }catch(e){ return null; }
  }
  function tone(t,f,d,type,g,slide){
    const o=ctx.createOscillator(), a=ctx.createGain();
    o.type=type; o.frequency.setValueAtTime(f,t);
    if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,slide),t+d);
    a.gain.setValueAtTime(0.0001,t);
    a.gain.exponentialRampToValueAtTime(Math.max(0.0002,g),t+0.012);
    a.gain.exponentialRampToValueAtTime(0.0001,t+d);
    o.connect(a); a.connect(bus); o.start(t); o.stop(t+d+0.03);
  }
  function noise(t,d,g,hp){
    const n=Math.floor(ctx.sampleRate*d), b=ctx.createBuffer(1,n,ctx.sampleRate), ch=b.getChannelData(0);
    for(let i=0;i<n;i++) ch[i]=(Math.random()*2-1)*(1-i/n);
    const s=ctx.createBufferSource(); s.buffer=b;
    const f=ctx.createBiquadFilter(); f.type='highpass'; f.frequency.value=hp||6000;
    const a=ctx.createGain(); a.gain.value=g;
    s.connect(f); f.connect(a); a.connect(bus); s.start(t);
  }
  /* 四種曲風共用同一套合成器與「越轉越激昂」的 prog；差別在每 16 分音符各自彈什麼 */
  const STYLES = {
    power:{ name:'熱血衝刺', hint:'鼓＋貝斯＋琶音，最帶勁', bpm:128, play(t,s,ch,prog,I){
      if(s%4===0) tone(t, 130, 0.16, 'sine', 0.55*I, 45);
      if(s%2===1) noise(t, 0.035, 0.05+0.09*prog, 7000);
      if(s===4||s===12) noise(t, 0.11, 0.10+0.10*prog, 1800);
      if(s%4===0||s===6||s===14) tone(t, hz(ch[0]-24), 0.20, 'square', 0.16*I, null);
      if(s%2===0) tone(t, hz(ch[(s/2)%3] + (s>=8?12:0)), 0.16, 'triangle', 0.13*I, null);
      if(prog>0.55 && s%8===0) tone(t, hz(ch[2]+12), 0.5, 'sine', 0.09*I, null);
    }},
    show:{ name:'綜藝抽獎', hint:'電視節目感，鐘琴一路往上爬', bpm:132, play(t,s,ch,prog,I){
      noise(t, 0.02, 0.045+0.05*prog, 9000);                                   // 轉盤咔咔聲
      if(s%4===0) tone(t, 120, 0.14, 'sine', 0.42*I, 50);
      const run=[0,4,7,11,12,11,7,4];                                          // 鐘琴上行下行跑句
      tone(t, hz(run[s%8] + 12 + Math.floor(prog*3)*2), 0.13, 'triangle', 0.14*I, null);
      if(s===0) tone(t, hz(ch[0]-12), 0.42, 'square', 0.13*I, null);
      if(prog>0.6 && s%2===0) tone(t, hz(run[s%8]+24), 0.08, 'sine', 0.06*I, null);
    }},
    roll:{ name:'鼓聲催緊', hint:'純鼓聲滾奏，最緊張、不搶話', bpm:120, play(t,s,ch,prog,I){
      const dense = prog<0.35 ? 4 : prog<0.7 ? 2 : 1;                          // 滾奏越來越密
      if(s%dense===0) noise(t, 0.05, (0.06+0.13*prog)*(s%4===0?1.4:1), 2200);
      if(s===0) tone(t, 78, 0.5, 'sine', 0.5*I, 42);                           // 定音鼓
      if(s===8 && prog>0.4) tone(t, 92, 0.4, 'sine', 0.4*I, 48);
      if(prog>0.8 && s%8===0) noise(t, 0.35, 0.10, 5000);                      // 鈸漸強
    }},
    swing:{ name:'輕快爵士', hint:'搖擺輕鬆，會議室不吵', bpm:112, play(t,s,ch,prog,I){
      const sw = (s%2===1) ? SPB()*0.34 : 0;                                   // 後半拍延後＝swing
      if(s%2===0||s%4===3) noise(t+sw, 0.05, 0.035+0.045*prog, 8000);          // ride
      if(s%4===0) tone(t, hz(ch[0]-24), 0.24, 'triangle', 0.20*I, null);       // walking bass
      if(s===6||s===14) tone(t, hz(ch[1]-24), 0.20, 'triangle', 0.16*I, null);
      if(s===2||s===10) ch.forEach(n=>tone(t+sw, hz(n), 0.26, 'sine', 0.075*I, null)); // 切分和弦
      if(prog>0.65 && s===12) tone(t, hz(ch[2]+12), 0.3, 'triangle', 0.10*I, null);
    }},
  };
  const cur = () => STYLES[sty] || STYLES.power;
  const SPB = () => 60/cur().bpm/4;
  function schedule(){
    while(next < ctx.currentTime + 0.12){
      const s=step%16, ch=CHORDS[Math.floor(step/16)%4];
      const prog = dur ? Math.min(1,(next-t0)/dur) : 0;      // 轉動進度＝激昂度
      cur().play(next, s, ch, prog, 0.35+prog*0.65);
      next += SPB(); step++;
    }
  }
  function stopTimer(){ if(timer){ clearInterval(timer); timer=null; } }
  /* 已排進 Web Audio 的音符不會因 clearInterval 消失 → 靜音要對總線淡出，才是「按下就安靜」 */
  function gate(open){
    if(!ctx) return;
    const t=ctx.currentTime;
    bus.gain.cancelScheduledValues(t);
    bus.gain.setValueAtTime(bus.gain.value,t);
    bus.gain.setTargetAtTime(open?VOL:0.0001, t, 0.02);
  }
  return {
    ensure,
    setMuted(v){ muted=!!v; },
    styles: () => Object.keys(STYLES).map(k=>({id:k, name:STYLES[k].name, hint:STYLES[k].hint})),
    setStyle(id){ if(STYLES[id]) sty=id; },
    start(spinMs, styleId){
      if(styleId) this.setStyle(styleId);
      if(muted || !ensure()) return;
      stopTimer(); gate(true);
      step=0; dur=spinMs/1000; t0=ctx.currentTime+0.05; next=t0;
      timer=setInterval(schedule,25); schedule();
    },
    /* 試聽：用壓縮過的時間軸跑一遍，聽得到「越轉越激昂」再收在高潮 */
    preview(styleId, ms){
      this.setStyle(styleId);
      if(!ensure()) return;
      const wasMute = muted; muted = false;
      stopTimer(); gate(true);
      step=0; dur=ms/1000; t0=ctx.currentTime+0.05; next=t0;
      timer=setInterval(schedule,25); schedule();
      setTimeout(()=>{ stopTimer(); const t=ctx.currentTime;
        noise(t,0.4,0.16,1400); [0,4,7,12].forEach((n,i)=>tone(t+i*0.008, hz(n), 0.55, 'sawtooth', 0.09, null));
        setTimeout(()=>{ muted = wasMute; if(wasMute) gate(false); }, 700);
      }, ms);
    },
    climax(){
      stopTimer();
      if(muted || !ensure()) return;
      const t=ctx.currentTime;
      noise(t,0.5,0.20,1200);
      [0,4,7,12].forEach((n,i)=>tone(t+i*0.008, hz(n), 0.7, 'sawtooth', 0.10, null));
    },
    win(){
      if(muted || !ensure()) return;
      const t=ctx.currentTime+0.02;
      [0,4,7,12,16,19].forEach((n,i)=>tone(t+i*0.075, hz(n), 0.34, 'triangle', 0.20, null));
      [0,4,7,12].forEach(n=>tone(t+0.46, hz(n), 1.1, 'sine', 0.16, null));
      noise(t+0.46,0.6,0.10,900);
    },
    mute(on){ stopTimer(); if(!on) ensure(); gate(!on); }   // 解除靜音要在按鈕手勢裡建 context（Safari/iOS）
  };
})();
