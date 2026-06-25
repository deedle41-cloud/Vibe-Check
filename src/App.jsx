import { useState, useRef, useEffect, useCallback } from "react";

// ─── Pre-warm audio on first touch (iOS fix) ──────────────────────────────────
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}
// Pre-warm on first user gesture
if (typeof window !== "undefined") {
  const warm = () => { getAudio(); document.removeEventListener("touchstart", warm); document.removeEventListener("mousedown", warm); };
  document.addEventListener("touchstart", warm, { passive: true });
  document.addEventListener("mousedown", warm, { passive: true });
}
function tone(freq, type, dur, vol, delay = 0) {
  try {
    const ac = getAudio(), o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.frequency.value = freq; o.type = type;
    g.gain.setValueAtTime(0, ac.currentTime + delay);
    g.gain.linearRampToValueAtTime(vol, ac.currentTime + delay + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + dur);
    o.start(ac.currentTime + delay); o.stop(ac.currentTime + delay + dur);
  } catch(e) {}
}
const SFX = {
  yes:   () => { tone(523,"sine",0.15,0.07); tone(659,"sine",0.15,0.06,0.08); },
  no:    () => tone(200,"sine",0.12,0.04),
  match: () => [523,659,784,1047,1319].forEach((f,i) => tone(f,"triangle",0.5,0.06,i*0.07)),
  tap:   () => tone(440,"sine",0.08,0.04),
  pop:   () => tone(600,"sine",0.1,0.05),
  star:  () => tone(880,"sine",0.12,0.05),
};

// ─── Firebase ─────────────────────────────────────────────────────────────────
const FB = {
  apiKey: "AIzaSyAfeFD0wXJhKsMvjZOAJULkTaTAZvu9uTw",
  authDomain: "vibe-check-1315d.firebaseapp.com",
  databaseURL: "https://vibe-check-1315d-default-rtdb.firebaseio.com",
  projectId: "vibe-check-1315d",
};
let db = null, fbRef, fbSet, fbGet, fbOn, fbOff, fbRemove;
async function initFB() {
  if (db) return;
  const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
  const { getDatabase, ref, set, get, onValue, off, remove } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
  const app = getApps().length ? getApps()[0] : initializeApp(FB);
  db = getDatabase(app);
  fbRef = ref; fbSet = set; fbGet = get; fbOn = onValue; fbOff = off; fbRemove = remove;
}
const rRef = c => fbRef(db, `rooms/${c}`);
const pRef = p => fbRef(db, `pairs/${p}`);
async function getRoom(c) { await initFB(); const s = await fbGet(rRef(c)); return s.exists() ? s.val() : null; }
async function setRoom(c, d) { await initFB(); await fbSet(rRef(c), d); }
async function delRoom(c) { await initFB(); try { await fbRemove(rRef(c)); } catch(e){} }
function watchRoom(c, cb) { fbOn(rRef(c), s => { if(s.exists()) cb(s.val()); }); return () => fbOff(rRef(c)); }
async function getPair(p) { await initFB(); const s = await fbGet(pRef(p)); return s.exists() ? s.val() : { history:[], compatibility:0 }; }
async function setPair(p, d) { await initFB(); await fbSet(pRef(p), d); }
function watchPair(p, cb) { fbOn(pRef(p), s => { if(s.exists()) cb(s.val()); }); return () => fbOff(pRef(p)); }

// ─── Data ─────────────────────────────────────────────────────────────────────
const ACTIVITIES = [
  {id:1,emoji:"🎬",label:"Movie marathon",desc:"Pick a franchise & go all in"},
  {id:2,emoji:"🌙",label:"Late night food run",desc:"Drive somewhere new, order random"},
  {id:3,emoji:"🎤",label:"Home karaoke",desc:"YouTube karaoke. Full send. No excuses"},
  {id:4,emoji:"👨‍🍳",label:"Cook together",desc:"New recipe, make it a whole event"},
  {id:5,emoji:"🚶",label:"Night walk",desc:"Explore a neighborhood neither knows"},
  {id:6,emoji:"🎮",label:"Co-op game night",desc:"Find something you can both play"},
  {id:7,emoji:"🍦",label:"Dessert crawl",desc:"2-3 spots, split something at each"},
  {id:8,emoji:"✏️",label:"Draw each other badly",desc:"5 min timer. No peeking. Pure chaos"},
  {id:9,emoji:"🛁",label:"Spa night at home",desc:"Face masks, candles, lo-fi. Full reset"},
  {id:10,emoji:"🎳",label:"Bowling or arcade",desc:"Get out, compete, talk trash"},
  {id:11,emoji:"🌅",label:"Catch the sunset",desc:"Find a view spot, bring something warm"},
  {id:12,emoji:"🍰",label:"Bake something chaotic",desc:"Pick something too hard. Go for it"},
  {id:13,emoji:"🎵",label:"Build a playlist",desc:"Take turns, no vetoes, just vibe"},
  {id:14,emoji:"🥡",label:"Try a new cuisine",desc:"Close eyes, pick something never tried"},
  {id:15,emoji:"🌿",label:"Find a trail",desc:"Doesn't need to be big, just go"},
  {id:16,emoji:"✂️",label:"Vision board night",desc:"Map your next 6 months together"},
  {id:17,emoji:"🏎️",label:"Mario Kart tournament",desc:"Best of 5. Loser does dishes."},
  {id:18,emoji:"🌳",label:"Park sit & snack",desc:"Phones away for 20 mins. Just be."},
  {id:19,emoji:"🎨",label:"Paint & chill",desc:"Cheap canvases, cheap wine, good time"},
  {id:20,emoji:"🚗",label:"Mystery drive",desc:"One person picks direction, just go"},
];

const TOD = [
  {type:"truth",text:"What's something you've never told me but always wanted to?"},
  {type:"truth",text:"What was your first impression of me? Be honest."},
  {type:"truth",text:"What's one habit of mine that low-key annoys you?"},
  {type:"truth",text:"What's the most embarrassing thing that's happened to you?"},
  {type:"truth",text:"What's something you're secretly really proud of?"},
  {type:"truth",text:"If you could change one thing about our relationship, what would it be?"},
  {type:"truth",text:"What's something you pretend to like just because I like it?"},
  {type:"truth",text:"Have you ever lied to me? About what?"},
  {type:"truth",text:"What do you actually think of my friends?"},
  {type:"truth",text:"What's your biggest fear about the future?"},
  {type:"dare",text:"Text someone in your contacts something nice right now, no context."},
  {type:"dare",text:"Do your best impression of me. Full send."},
  {type:"dare",text:"Let your partner post anything on your Instagram story for 10 minutes."},
  {type:"dare",text:"Sing the chorus of the last song you listened to. Right now."},
  {type:"dare",text:"Show your partner the last 5 photos in your camera roll. No deleting."},
  {type:"dare",text:"Let your partner read your last 3 text conversations."},
  {type:"dare",text:"Do 10 push-ups or give your partner a 5 min back massage. Their choice."},
  {type:"dare",text:"Say something genuinely sweet about your partner. No joking around."},
  {type:"dare",text:"Let your partner style your hair however they want for the rest of the night."},
  {type:"dare",text:"Call a family member and say 'just called to say I love you.'"},
];

const KMQ = [
  "What's my go-to comfort food?","What's my biggest pet peeve?",
  "What's my dream vacation destination?","What was my favorite subject in school?",
  "What's the first thing I do when I wake up?","What's my love language?",
  "What's a movie I could watch over and over?","What am I most scared of?",
  "What's my biggest goal right now?","What always makes me laugh no matter what?",
];

const NHIE = [
  "Never have I ever stalked an ex on social media in the last month",
  "Never have I ever cried at a movie and pretended I wasn't",
  "Never have I ever texted someone and immediately regretted it",
  "Never have I ever lied about my age",
  "Never have I ever pretended to be asleep to avoid a conversation",
  "Never have I ever eaten food I dropped on the floor",
  "Never have I ever gone through someone's phone without permission",
  "Never have I ever ghosted someone",
  "Never have I ever called in sick when I wasn't",
  "Never have I ever had a crush on a friend's partner",
  "Never have I ever sent a risky text to the wrong person",
  "Never have I ever laughed at something I definitely shouldn't have",
];

const TOT = [
  ["Beach 🏖️","Mountains ⛰️"],["Night owl 🦉","Early bird 🐦"],
  ["Netflix 📺","Going out 🎉"],["Text 💬","Call 📞"],
  ["Cook at home 👨‍🍳","Eat out 🍽️"],["Dogs 🐶","Cats 🐱"],
  ["Hot weather ☀️","Cold weather ❄️"],["Road trip 🚗","Flight ✈️"],
  ["Sweet 🍰","Savory 🧀"],["Morning shower 🌅","Night shower 🌙"],
  ["Introvert 🏠","Extrovert 🎊"],["Spontaneous 🎲","Planner 📅"],
];

const HT = [
  "Pineapple belongs on pizza","Long distance relationships never work",
  "Social media ruins relationships","The person who earns more should pay more on dates",
  "It's okay to look through your partner's phone","Couples should have separate friend groups",
  "Jealousy is a sign of love","Everyone has a type and never really changes it",
  "You should never go to bed angry","Moving in together before marriage is smarter",
  "Couples that post a lot online are usually unhappy","Having a work wife/husband is harmless",
];

const COMPAT = [
  {min:90,label:"Literally the same person 🥹",color:"#FF2D78"},
  {min:75,label:"Deeply in sync 💞",color:"#FF2D78"},
  {min:60,label:"Pretty solid duo ⚡",color:"#00F5FF"},
  {min:40,label:"Still figuring each other out 👀",color:"#00F5FF"},
  {min:0, label:"Opposites attract? 😅",color:"#a855f7"},
];

function getCompat(score) { return COMPAT.find(c => score >= c.min) || COMPAT[COMPAT.length-1]; }
function calcScore(history) {
  if (!history?.length) return 0;
  const avg = history.reduce((s,h) => s+((h.p1Rating||3)+(h.p2Rating||3))/2, 0) / history.length;
  return Math.min(Math.round(((avg-1)/4)*70 + Math.min(history.length*2,30)), 99);
}
function shuffle(arr) { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
function genCode() { return Math.random().toString(36).substring(2,7).toUpperCase(); }

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = { pink:"#FF2D78", cyan:"#00F5FF", purple:"#a855f7", bg:"#050508", card:"rgba(255,255,255,0.04)", border:"rgba(255,255,255,0.08)", text:"#fff", muted:"rgba(255,255,255,0.4)", dim:"rgba(255,255,255,0.15)" };
const glow = (color, size=20) => `0 0 ${size}px ${color}55`;

// ─── Shared button styles ─────────────────────────────────────────────────────
const PBtn = (color=C.pink, extra={}) => ({
  width:"100%", border:"none", borderRadius:16, padding:"17px",
  fontSize:16, fontWeight:800, cursor:"pointer", marginBottom:12,
  WebkitAppearance:"none", touchAction:"manipulation",
  background:`linear-gradient(135deg,${color},${color}bb)`,
  color:"#000", boxShadow:glow(color,15), ...extra,
});
const SBtn = (extra={}) => ({
  width:"100%", borderRadius:16, padding:"17px",
  fontSize:15, fontWeight:700, cursor:"pointer", marginBottom:12,
  WebkitAppearance:"none", touchAction:"manipulation",
  background:"transparent", color:C.muted,
  border:`1px solid ${C.border}`, ...extra,
});

// ─── Swipe Card ───────────────────────────────────────────────────────────────
function SwipeCard({ activity, onSwipe }) {
  const startX=useRef(0), dragging=useRef(false), currentX=useRef(0);
  const [offset,setOffset]=useState(0), [lbl,setLbl]=useState(null);
  const start=x=>{ dragging.current=true; startX.current=x; };
  const move=x=>{ if(!dragging.current)return; const d=x-startX.current; currentX.current=d; setOffset(d); setLbl(d>50?"yes":d<-50?"no":null); };
  const end=()=>{ if(!dragging.current)return; dragging.current=false; const d=currentX.current; if(d>90)onSwipe("yes"); else if(d<-90)onSwipe("no"); else{setOffset(0);setLbl(null);} };
  return (
    <div
      onMouseDown={e=>start(e.clientX)} onMouseMove={e=>{if(dragging.current)move(e.clientX);}} onMouseUp={end} onMouseLeave={end}
      onTouchStart={e=>{e.preventDefault();start(e.touches[0].clientX);}}
      onTouchMove={e=>{e.preventDefault();move(e.touches[0].clientX);}}
      onTouchEnd={e=>{e.preventDefault();end();}}
      style={{position:"absolute",width:"100%",userSelect:"none",touchAction:"none",cursor:"grab",
        transform:`translateX(${offset}px) rotate(${offset/18}deg)`,
        transition:dragging.current?"none":"transform 0.3s ease",zIndex:10}}
    >
      <div style={{
        background:"linear-gradient(135deg,rgba(255,45,120,0.06),rgba(0,245,255,0.04))",
        border:lbl==="yes"?`2px solid ${C.cyan}`:lbl==="no"?`2px solid ${C.pink}`:`1px solid ${C.border}`,
        borderRadius:28,padding:"36px 24px",textAlign:"center",minHeight:260,
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative",
      }}>
        {lbl==="yes"&&<div style={{position:"absolute",top:20,left:20,border:`2px solid ${C.cyan}`,borderRadius:8,color:C.cyan,fontWeight:900,fontSize:18,padding:"3px 12px",letterSpacing:2,transform:"rotate(-15deg)",opacity:Math.min(1,Math.abs(offset)/90)}}>YES</div>}
        {lbl==="no"&&<div style={{position:"absolute",top:20,right:20,border:`2px solid ${C.pink}`,borderRadius:8,color:C.pink,fontWeight:900,fontSize:18,padding:"3px 12px",letterSpacing:2,transform:"rotate(15deg)",opacity:Math.min(1,Math.abs(offset)/90)}}>NOPE</div>}
        <div style={{fontSize:60,marginBottom:14,lineHeight:1}}>{activity.emoji}</div>
        <h2 style={{fontSize:22,fontWeight:900,color:C.text,margin:"0 0 8px"}}>{activity.label}</h2>
        <p style={{fontSize:14,color:C.muted,lineHeight:1.5,margin:0,maxWidth:220}}>{activity.desc}</p>
      </div>
    </div>
  );
}

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars({ value, onChange, size=40 }) {
  return (
    <div style={{display:"flex",gap:8,justifyContent:"center"}}>
      {[1,2,3,4,5].map(s=>(
        <button key={s} onClick={()=>{SFX.star();onChange(s);}}
          onTouchEnd={e=>{e.preventDefault();SFX.star();onChange(s);}}
          style={{fontSize:size,background:"none",border:"none",cursor:"pointer",opacity:s<=value?1:0.2,WebkitAppearance:"none",touchAction:"manipulation",transition:"opacity 0.1s"}}>
          {s<=value?"⭐":"☆"}
        </button>
      ))}
    </div>
  );
}

// ─── Match Screen ─────────────────────────────────────────────────────────────
function MatchScreen({ activity, onRate }) {
  const dots=Array.from({length:16},(_,i)=>({color:[C.pink,C.cyan,"#FFD700",C.purple][i%4],left:Math.random()*100,top:Math.random()*100,dx:(Math.random()-.5)*260,dy:(Math.random()-.5)*260}));
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"#020205",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",textAlign:"center",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
      {dots.map((d,i)=><div key={i} style={{position:"fixed",width:10,height:10,borderRadius:"50%",background:d.color,left:`${d.left}%`,top:`${d.top}%`,animation:`cd${i} ${0.8+Math.random()*0.6}s ease-out both`,pointerEvents:"none"}}/>)}
      <style>{`
        @keyframes popIn{from{opacity:0;transform:scale(0.7)}to{opacity:1;transform:scale(1)}}
        @keyframes bounce{0%{transform:scale(0)}60%{transform:scale(1.1)}100%{transform:scale(1)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        ${dots.map((_,i)=>`@keyframes cd${i}{from{transform:translate(0,0) scale(0);opacity:0}to{transform:translate(${dots[i].dx}px,${dots[i].dy}px) scale(1);opacity:.9}}`).join("")}
      `}</style>
      <div style={{animation:"popIn 0.6s cubic-bezier(.34,1.56,.64,1) both",width:"100%",maxWidth:400,position:"relative",zIndex:1}}>
        <div style={{fontSize:64,marginBottom:8}}>🎯</div>
        <div style={{fontSize:"clamp(38px,10vw,56px)",fontWeight:900,letterSpacing:"-3px",lineHeight:.95,background:`linear-gradient(135deg,${C.pink},${C.cyan})`,backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"bounce 0.7s cubic-bezier(.34,1.56,.64,1) .2s both,shimmer 4s linear infinite",marginBottom:16}}>
          TONIGHT'S<br/>THE MOVE
        </div>
        <div style={{background:`linear-gradient(135deg,rgba(255,45,120,0.1),rgba(0,245,255,0.06))`,border:`1px solid ${C.pink}44`,borderRadius:24,padding:"24px",margin:"0 0 20px",boxShadow:glow(C.pink,12)}}>
          <div style={{fontSize:48,marginBottom:10}}>{activity.emoji}</div>
          <div style={{fontSize:20,fontWeight:900,color:C.text,marginBottom:6}}>{activity.label}</div>
          <div style={{fontSize:14,color:C.muted,lineHeight:1.5}}>{activity.desc}</div>
        </div>
        <p style={{color:C.dim,fontSize:13,marginBottom:20}}>You both swiped yes ✓</p>
        <button onClick={()=>{SFX.tap();onRate();}} onTouchEnd={e=>{e.preventDefault();SFX.tap();onRate();}}
          style={PBtn(C.pink)}>Rate tonight ⭐</button>
      </div>
    </div>
  );
}

// ─── Rating Screen ────────────────────────────────────────────────────────────
function RatingScreen({ activity, playerNum, pairId, roomCode, onDone }) {
  const [rating,setRating]=useState(0), [submitted,setSubmitted]=useState(false), [result,setResult]=useState(null);
  const unsubRef=useRef(null);

  const submit = async () => {
    if (!rating) return;
    SFX.star(); setSubmitted(true);
    const room = await getRoom(roomCode);
    if (room) { room[playerNum===1?"p1Rating":"p2Rating"]=rating; await setRoom(roomCode,room); }
    unsubRef.current = watchRoom(roomCode, async room => {
      if (room.p1Rating && room.p2Rating) {
        if (unsubRef.current) unsubRef.current();
        SFX.match();
        const pair = await getPair(pairId);
        const entry = { activity:activity.label, emoji:activity.emoji, date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"}), p1Rating:room.p1Rating, p2Rating:room.p2Rating, avgRating:((room.p1Rating+room.p2Rating)/2).toFixed(1) };
        const history=[...(pair.history||[]),entry];
        const compatibility=calcScore(history);
        await setPair(pairId,{history,compatibility});
        setResult({entry,compatibility,history});
      }
    });
  };

  useEffect(()=>()=>{if(unsubRef.current)unsubRef.current();},[]);

  if (result) {
    const {entry,compatibility,history}=result, compat=getCompat(compatibility);
    return (
      <div style={{position:"fixed",inset:0,zIndex:300,background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={{width:"100%",maxWidth:400,textAlign:"center"}}>
          <div style={{background:`linear-gradient(135deg,rgba(255,45,120,0.12),rgba(0,245,255,0.08))`,border:`1px solid ${C.pink}44`,borderRadius:28,padding:"32px 24px",marginBottom:16,boxShadow:`${glow(C.pink,15)},${glow(C.cyan,10)}`}}>
            <div style={{fontSize:11,color:C.pink,letterSpacing:3,textTransform:"uppercase",marginBottom:14,fontWeight:800}}>✦ Vibe Check · {entry.date}</div>
            <div style={{fontSize:44,marginBottom:8}}>{entry.emoji}</div>
            <div style={{fontSize:20,fontWeight:900,color:C.text,marginBottom:16}}>{entry.activity}</div>
            <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:20}}>
              {[["You",entry.p1Rating],["Them",entry.p2Rating]].map(([n,r],i)=>(
                <div key={i} style={{background:"rgba(255,255,255,0.05)",borderRadius:14,padding:"10px 16px",flex:1}}>
                  <div style={{fontSize:11,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>{n}</div>
                  <div style={{fontSize:20}}>{"⭐".repeat(r)}</div>
                </div>
              ))}
            </div>
            <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16}}>
              <div style={{fontSize:11,color:C.muted,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Compatibility</div>
              <div style={{fontSize:52,fontWeight:900,letterSpacing:"-3px",background:`linear-gradient(135deg,${C.pink},${C.cyan})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>{compatibility}%</div>
              <div style={{fontSize:15,color:compat.color,fontWeight:700}}>{compat.label}</div>
              <div style={{fontSize:12,color:C.dim,marginTop:6}}>{history.length} night{history.length!==1?"s":""} together</div>
            </div>
          </div>
          <p style={{color:C.muted,fontSize:13,marginBottom:16}}>Screenshot this and flex 📸</p>
          <button onClick={()=>{SFX.tap();onDone();}} onTouchEnd={e=>{e.preventDefault();SFX.tap();onDone();}} style={PBtn(C.pink)}>Back to home ✨</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px"}}>
      <div style={{width:"100%",maxWidth:400,textAlign:"center"}}>
        {!submitted ? (
          <>
            <div style={{fontSize:48,marginBottom:12}}>{activity.emoji}</div>
            <h2 style={{fontSize:24,fontWeight:900,color:C.text,marginBottom:6}}>How was tonight?</h2>
            <p style={{color:C.muted,fontSize:15,marginBottom:28}}>{activity.label}</p>
            <Stars value={rating} onChange={setRating} size={44}/>
            <div style={{marginTop:28}}>
              <button onClick={submit} onTouchEnd={e=>{e.preventDefault();submit();}}
                style={PBtn(C.pink,{opacity:rating?1:0.4})}>Submit my rating →</button>
            </div>
          </>
        ) : (
          <>
            <div style={{fontSize:48,marginBottom:14}}>⏳</div>
            <h2 style={{fontSize:22,fontWeight:900,color:C.text,marginBottom:8}}>Rating submitted!</h2>
            <p style={{color:C.muted,fontSize:15}}>Waiting for your partner…</p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── History ──────────────────────────────────────────────────────────────────
function HistoryScreen({ pairId, onBack }) {
  const [pair,setPair]=useState(null);
  useEffect(()=>{ initFB().then(()=>{ const unsub=watchPair(pairId,setPair); return unsub; }); },[pairId]);
  const history=pair?[...(pair.history||[])].reverse():[];
  const compat=getCompat(pair?.compatibility||0);
  return (
    <div style={{minHeight:"100vh",background:C.bg,padding:"80px 20px 32px",fontFamily:"-apple-system,'Inter',sans-serif"}}>
      <div style={{maxWidth:440,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
          <button onClick={()=>{SFX.tap();onBack();}} onTouchEnd={e=>{e.preventDefault();SFX.tap();onBack();}}
            style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:50,minWidth:44,height:44,color:C.muted,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",WebkitAppearance:"none",touchAction:"manipulation"}}>←</button>
          <div>
            <div style={{fontSize:11,color:C.pink,textTransform:"uppercase",letterSpacing:2,fontWeight:800}}>Your Story</div>
            <div style={{fontSize:20,fontWeight:900,color:C.text}}>Date History</div>
          </div>
        </div>
        <div style={{background:`linear-gradient(135deg,rgba(255,45,120,0.1),rgba(0,245,255,0.06))`,border:`1px solid ${C.pink}44`,borderRadius:24,padding:"24px",textAlign:"center",marginBottom:16,boxShadow:glow(C.pink,12)}}>
          <div style={{fontSize:11,color:C.muted,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Compatibility Score</div>
          <div style={{fontSize:64,fontWeight:900,letterSpacing:"-4px",background:`linear-gradient(135deg,${C.pink},${C.cyan})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>{pair?.compatibility||0}%</div>
          <div style={{fontSize:15,color:compat.color,fontWeight:700}}>{compat.label}</div>
          <div style={{fontSize:12,color:C.dim,marginTop:4}}>{history.length} date night{history.length!==1?"s":""} logged</div>
        </div>
        {history.length===0?(
          <div style={{textAlign:"center",padding:"40px 0"}}>
            <div style={{fontSize:44,marginBottom:12}}>🌙</div>
            <p style={{color:C.muted,fontSize:15,lineHeight:1.7}}>No date nights yet.<br/>Go find your first match!</p>
          </div>
        ):history.map((h,i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:"16px 18px",marginBottom:10,display:"flex",alignItems:"center",gap:14}}>
            <div style={{fontSize:32}}>{h.emoji}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:15,color:C.text}}>{h.activity}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:2}}>{h.date}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:14}}>{"⭐".repeat(Math.round(h.avgRating))}</div>
              <div style={{fontSize:11,color:C.dim,marginTop:2}}>{h.avgRating}/5</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Game Shell ───────────────────────────────────────────────────────────────
function GameShell({ title, emoji, color=C.pink, onBack, children }) {
  return (
    <div style={{minHeight:"100vh",background:C.bg,padding:"80px 20px 32px",fontFamily:"-apple-system,'Inter',sans-serif"}}>
      <div style={{maxWidth:440,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
          <button onClick={()=>{SFX.tap();onBack();}} onTouchEnd={e=>{e.preventDefault();SFX.tap();onBack();}}
            style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:50,minWidth:44,height:44,color:C.muted,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",WebkitAppearance:"none",touchAction:"manipulation"}}>←</button>
          <div>
            <div style={{fontSize:11,color:color,textTransform:"uppercase",letterSpacing:2,fontWeight:800}}>Game</div>
            <div style={{fontSize:18,fontWeight:900,color:C.text}}>{emoji} {title}</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Game: Truth or Dare ──────────────────────────────────────────────────────
function TruthOrDare({ onBack }) {
  const [cards]=useState(()=>shuffle(TOD)), [idx,setIdx]=useState(0), [flipped,setFlipped]=useState(false);
  const card=cards[idx%cards.length];
  return (
    <GameShell title="Truth or Dare" emoji="🎴" color={C.pink} onBack={onBack}>
      <div onClick={()=>{if(!flipped){SFX.pop();setFlipped(true);}}} onTouchEnd={e=>{if(!flipped){e.preventDefault();SFX.pop();setFlipped(true);}}}
        style={{background:flipped?(card.type==="truth"?"rgba(0,245,255,0.08)":"rgba(255,45,120,0.08)"):C.card,border:`1px solid ${flipped?(card.type==="truth"?C.cyan:C.pink):C.border}`,borderRadius:24,padding:"40px 24px",textAlign:"center",minHeight:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",marginBottom:16,touchAction:"manipulation",boxShadow:flipped?glow(card.type==="truth"?C.cyan:C.pink,10):"none"}}>
        {!flipped?<><div style={{fontSize:40,marginBottom:10}}>👆</div><p style={{color:C.muted,fontSize:16,margin:0}}>Tap to reveal</p></>
          :<><div style={{fontSize:11,fontWeight:800,letterSpacing:3,textTransform:"uppercase",color:card.type==="truth"?C.cyan:C.pink,marginBottom:14}}>{card.type}</div><p style={{fontSize:18,fontWeight:700,color:C.text,lineHeight:1.6,margin:0}}>{card.text}</p></>}
      </div>
      {flipped&&<button onClick={()=>{SFX.tap();setIdx(i=>i+1);setFlipped(false);}} onTouchEnd={e=>{e.preventDefault();SFX.tap();setIdx(i=>i+1);setFlipped(false);}} style={PBtn(C.pink)}>Next card →</button>}
      {!flipped&&<p style={{textAlign:"center",color:C.dim,fontSize:12}}>{cards.length} cards · shuffled</p>}
    </GameShell>
  );
}

// ─── Game: Know Me ────────────────────────────────────────────────────────────
function KnowMe({ onBack }) {
  const [phase,setPhase]=useState("pick"), [qi,setQi]=useState(0), [score,setScore]=useState(0), [a1,setA1]=useState(""), [a2,setA2]=useState(""), [matched,setMatched]=useState(null);
  const total=KMQ.length, q=KMQ[qi];
  const check=()=>{ SFX.tap(); const x=a1.trim().toLowerCase(),y=a2.trim().toLowerCase(); const hit=x===y||(y.length>2&&x.includes(y.substring(0,4))); if(hit)setScore(s=>s+1); setMatched(hit); setPhase("result"); };
  const next=()=>{ SFX.tap(); if(qi+1>=total){setPhase("done");return;} setQi(i=>i+1);setA1("");setA2("");setMatched(null);setPhase("p1"); };
  const ta={width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${C.border}`,borderRadius:14,padding:"14px",color:C.text,fontSize:16,resize:"none",outline:"none",marginBottom:10,WebkitAppearance:"none",boxSizing:"border-box",fontFamily:"-apple-system,sans-serif"};
  return (
    <GameShell title="How Well Do You Know Me?" emoji="🧠" color={C.cyan} onBack={onBack}>
      {phase==="pick"&&<div style={{textAlign:"center"}}><p style={{color:C.muted,fontSize:15,lineHeight:1.7,marginBottom:24}}>One person answers about themselves. Their partner guesses. See how well you really know each other.</p><button onClick={()=>{SFX.tap();setPhase("p1");}} onTouchEnd={e=>{e.preventDefault();SFX.tap();setPhase("p1");}} style={PBtn(C.pink)}>Let's go →</button></div>}
      {phase==="p1"&&<div><div style={{textAlign:"center",marginBottom:16}}><div style={{fontSize:11,color:C.pink,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Person 1 — answer about yourself</div><div style={{fontSize:11,color:C.muted,marginBottom:8}}>Question {qi+1} of {total}</div><h3 style={{fontSize:19,fontWeight:900,color:C.text,margin:0,lineHeight:1.4}}>{q}</h3></div><textarea value={a1} onChange={e=>setA1(e.target.value)} placeholder="Type your answer…" rows={3} style={ta}/><p style={{color:C.dim,fontSize:12,textAlign:"center",marginBottom:10}}>Hand the phone to your partner 🔄</p><button onClick={()=>{if(a1.trim())setPhase("p2");}} onTouchEnd={e=>{if(a1.trim()){e.preventDefault();setPhase("p2");}}} style={PBtn(C.pink)}>Partner's turn →</button></div>}
      {phase==="p2"&&<div><div style={{textAlign:"center",marginBottom:16}}><div style={{fontSize:11,color:C.cyan,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Partner — what do you think they said?</div><h3 style={{fontSize:19,fontWeight:900,color:C.text,margin:0,lineHeight:1.4}}>{q}</h3></div><textarea value={a2} onChange={e=>setA2(e.target.value)} placeholder="Your guess…" rows={3} style={ta}/><button onClick={()=>{if(a2.trim())check();}} onTouchEnd={e=>{if(a2.trim()){e.preventDefault();check();}}} style={PBtn(C.cyan)}>Reveal →</button></div>}
      {phase==="result"&&<div style={{textAlign:"center"}}><div style={{fontSize:48,marginBottom:10}}>{matched?"🎉":"😬"}</div><h3 style={{fontSize:22,fontWeight:900,color:matched?C.cyan:C.pink,marginBottom:14}}>{matched?"Match!":"Not quite"}</h3><div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"14px",marginBottom:8,textAlign:"left"}}><div style={{fontSize:11,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>Their answer</div><div style={{color:C.text,fontSize:15,fontWeight:700}}>{a1}</div></div><div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"14px",marginBottom:14,textAlign:"left"}}><div style={{fontSize:11,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>Your guess</div><div style={{color:C.text,fontSize:15,fontWeight:700}}>{a2}</div></div><div style={{color:C.muted,fontSize:13,marginBottom:14}}>Score: {score}/{qi+1}</div><button onClick={next} onTouchEnd={e=>{e.preventDefault();next();}} style={PBtn(C.pink)}>{qi+1>=total?"See final score →":"Next question →"}</button></div>}
      {phase==="done"&&<div style={{textAlign:"center"}}><div style={{fontSize:60,marginBottom:10}}>{score>=8?"🥰":score>=5?"😊":"😅"}</div><h2 style={{fontSize:28,fontWeight:900,color:C.text,marginBottom:6}}>{score}/{total}</h2><p style={{color:C.muted,fontSize:15,lineHeight:1.7,marginBottom:24}}>{score>=8?"You two are incredibly in sync 🥹":score>=5?"Pretty solid — still some mysteries 👀":"Room to grow. That's what this is for 😄"}</p><button onClick={()=>{setPhase("pick");setQi(0);setScore(0);setA1("");setA2("");setMatched(null);}} onTouchEnd={e=>{e.preventDefault();setPhase("pick");setQi(0);setScore(0);setA1("");setA2("");setMatched(null);}} style={PBtn(C.pink)}>Play again</button></div>}
    </GameShell>
  );
}

// ─── Game: Never Have I Ever ──────────────────────────────────────────────────
function Never({ onBack }) {
  const [cards]=useState(()=>shuffle(NHIE)), [idx,setIdx]=useState(0), [p1,setP1]=useState(null), [p2,setP2]=useState(null), [rev,setRev]=useState(false);
  const next=()=>{ SFX.tap(); setIdx(i=>(i+1)%cards.length); setP1(null); setP2(null); setRev(false); };
  const PickBtns=({val,setVal})=>(
    <div style={{display:"flex",gap:10}}>
      {["✅ I have","❌ Never"].map((l,vi)=>(
        <button key={vi} onClick={()=>{SFX.pop();setVal(vi===0);}} onTouchEnd={e=>{e.preventDefault();SFX.pop();setVal(vi===0);}}
          style={{flex:1,padding:"13px 8px",borderRadius:14,border:val===(vi===0)?`2px solid ${vi===0?C.cyan:C.pink}`:`1px solid ${C.border}`,background:val===(vi===0)?(vi===0?"rgba(0,245,255,0.08)":"rgba(255,45,120,0.08)"):C.card,color:C.text,fontSize:14,fontWeight:700,cursor:"pointer",WebkitAppearance:"none",touchAction:"manipulation"}}>{l}</button>
      ))}
    </div>
  );
  return (
    <GameShell title="Never Have I Ever" emoji="🍹" color={C.purple} onBack={onBack}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:"24px",textAlign:"center",marginBottom:14}}><p style={{fontSize:17,fontWeight:700,color:C.text,lineHeight:1.6,margin:0}}>{cards[idx]}</p></div>
      {!rev?(<>
        <p style={{textAlign:"center",color:C.muted,fontSize:12,marginBottom:10,textTransform:"uppercase",letterSpacing:1}}>Both pick secretly — reveal together</p>
        <p style={{color:C.muted,fontSize:13,marginBottom:6,textAlign:"center"}}>Person 1</p>
        <div style={{marginBottom:10}}><PickBtns val={p1} setVal={setP1}/></div>
        <p style={{color:C.muted,fontSize:13,marginBottom:6,textAlign:"center"}}>Person 2</p>
        <div style={{marginBottom:14}}><PickBtns val={p2} setVal={setP2}/></div>
        {p1!==null&&p2!==null&&<button onClick={()=>setRev(true)} onTouchEnd={e=>{e.preventDefault();setRev(true);}} style={PBtn(C.purple)}>Reveal 👀</button>}
      </>):(
        <div style={{textAlign:"center"}}>
          <div style={{display:"flex",gap:10,marginBottom:14,justifyContent:"center"}}>
            {[["Person 1",p1],["Person 2",p2]].map(([n,v],i)=>(
              <div key={i} style={{background:v?"rgba(0,245,255,0.08)":"rgba(255,45,120,0.08)",border:`1px solid ${v?C.cyan:C.pink}44`,borderRadius:14,padding:"14px",flex:1}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>{n}</div>
                <div style={{fontSize:20}}>{v?"✅":"❌"}</div>
                <div style={{color:C.text,fontSize:12,marginTop:4}}>{v?"I have":"Never"}</div>
              </div>
            ))}
          </div>
          <p style={{color:p1&&p2?"#FFD700":(!p1&&!p2)?C.cyan:C.pink,fontWeight:700,fontSize:15,marginBottom:14}}>{p1&&p2?"You've both done this 👀":(!p1&&!p2)?"Neither of you! 😇":"Interesting… tell me more 🤭"}</p>
          <button onClick={next} onTouchEnd={e=>{e.preventDefault();next();}} style={PBtn(C.cyan)}>Next card →</button>
        </div>
      )}
    </GameShell>
  );
}

// ─── Game: This or That ───────────────────────────────────────────────────────
function ThisOrThat({ onBack }) {
  const [cards]=useState(()=>shuffle(TOT)), [idx,setIdx]=useState(0), [p1,setP1]=useState(null), [p2,setP2]=useState(null), [rev,setRev]=useState(false), [score,setScore]=useState({m:0,d:0});
  const [a,b]=cards[idx];
  const reveal=()=>{ SFX.pop(); if(p1===p2)setScore(s=>({...s,m:s.m+1})); else setScore(s=>({...s,d:s.d+1})); setRev(true); };
  const next=()=>{ SFX.tap(); setIdx(i=>(i+1)%cards.length); setP1(null); setP2(null); setRev(false); };
  const PickBtns=({val,setVal,colors})=>(
    <div style={{display:"flex",gap:10}}>
      {[a,b].map((opt,vi)=>(
        <button key={vi} onClick={()=>{SFX.pop();setVal(vi);}} onTouchEnd={e=>{e.preventDefault();SFX.pop();setVal(vi);}}
          style={{flex:1,padding:"16px 8px",borderRadius:16,border:val===vi?`2px solid ${colors[vi]}`:`1px solid ${C.border}`,background:val===vi?`${colors[vi]}14`:C.card,color:C.text,fontSize:15,fontWeight:700,cursor:"pointer",WebkitAppearance:"none",touchAction:"manipulation"}}>{opt}</button>
      ))}
    </div>
  );
  return (
    <GameShell title="This or That" emoji="⚡" color={C.cyan} onBack={onBack}>
      <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:14}}>
        <span style={{background:"rgba(0,245,255,0.08)",border:`1px solid ${C.cyan}44`,borderRadius:50,padding:"4px 12px",color:C.cyan,fontSize:12}}>✓ {score.m} matched</span>
        <span style={{background:"rgba(255,45,120,0.08)",border:`1px solid ${C.pink}44`,borderRadius:50,padding:"4px 12px",color:C.pink,fontSize:12}}>↔ {score.d} different</span>
      </div>
      {!rev?(<>
        <p style={{textAlign:"center",color:C.muted,fontSize:12,marginBottom:10,textTransform:"uppercase",letterSpacing:1}}>Pick secretly — reveal together</p>
        <p style={{color:C.muted,fontSize:13,marginBottom:6,textAlign:"center"}}>Person 1</p>
        <div style={{marginBottom:10}}><PickBtns val={p1} setVal={setP1} colors={[C.pink,C.cyan]}/></div>
        <p style={{color:C.muted,fontSize:13,marginBottom:6,textAlign:"center"}}>Person 2</p>
        <div style={{marginBottom:14}}><PickBtns val={p2} setVal={setP2} colors={[C.pink,C.cyan]}/></div>
        {p1!==null&&p2!==null&&<button onClick={reveal} onTouchEnd={e=>{e.preventDefault();reveal();}} style={PBtn(C.pink)}>Reveal 👀</button>}
      </>):(
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:10}}>{p1===p2?"🎯":"😮"}</div>
          <div style={{display:"flex",gap:10,marginBottom:14}}>
            {[["Person 1",p1],["Person 2",p2]].map(([n,v],i)=>(
              <div key={i} style={{background:C.card,border:`1px solid ${i===0?C.pink:C.cyan}44`,borderRadius:14,padding:"12px",flex:1}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>{n}</div>
                <div style={{color:C.text,fontSize:14,fontWeight:700}}>{v===0?a:b}</div>
              </div>
            ))}
          </div>
          <p style={{color:p1===p2?C.cyan:C.pink,fontWeight:700,fontSize:15,marginBottom:14}}>{p1===p2?"Same! You're aligned 🙌":"Different picks — talk about it 👀"}</p>
          <button onClick={next} onTouchEnd={e=>{e.preventDefault();next();}} style={PBtn(C.cyan)}>Next →</button>
        </div>
      )}
    </GameShell>
  );
}

// ─── Game: Hot Takes ──────────────────────────────────────────────────────────
function HotTakes({ onBack }) {
  const [cards]=useState(()=>shuffle(HT)), [idx,setIdx]=useState(0), [p1,setP1]=useState(null), [p2,setP2]=useState(null), [rev,setRev]=useState(false);
  const next=()=>{ SFX.tap(); setIdx(i=>(i+1)%cards.length); setP1(null); setP2(null); setRev(false); };
  const PickBtns=({val,setVal})=>(
    <div style={{display:"flex",gap:10}}>
      {["agree","disagree"].map((v,vi)=>(
        <button key={vi} onClick={()=>{SFX.pop();setVal(v);}} onTouchEnd={e=>{e.preventDefault();SFX.pop();setVal(v);}}
          style={{flex:1,padding:"13px 8px",borderRadius:14,border:val===v?`2px solid ${v==="agree"?C.cyan:C.pink}`:`1px solid ${C.border}`,background:val===v?(v==="agree"?"rgba(0,245,255,0.08)":"rgba(255,45,120,0.08)"):C.card,color:C.text,fontSize:14,fontWeight:700,cursor:"pointer",WebkitAppearance:"none",touchAction:"manipulation"}}>{v==="agree"?"✅ Agree":"❌ Disagree"}</button>
      ))}
    </div>
  );
  return (
    <GameShell title="Hot Takes" emoji="🌶️" color={C.pink} onBack={onBack}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:"24px",textAlign:"center",marginBottom:14}}><p style={{fontSize:17,fontWeight:800,color:C.text,lineHeight:1.5,margin:0}}>{cards[idx]}</p></div>
      {!rev?(<>
        <p style={{textAlign:"center",color:C.muted,fontSize:12,marginBottom:10,textTransform:"uppercase",letterSpacing:1}}>Both pick secretly — reveal together</p>
        <p style={{color:C.muted,fontSize:13,marginBottom:6,textAlign:"center"}}>Person 1</p>
        <div style={{marginBottom:10}}><PickBtns val={p1} setVal={setP1}/></div>
        <p style={{color:C.muted,fontSize:13,marginBottom:6,textAlign:"center"}}>Person 2</p>
        <div style={{marginBottom:14}}><PickBtns val={p2} setVal={setP2}/></div>
        {p1&&p2&&<button onClick={()=>setRev(true)} onTouchEnd={e=>{e.preventDefault();setRev(true);}} style={PBtn(C.pink)}>Reveal 🌶️</button>}
      </>):(
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:10}}>{p1===p2?"🤝":"⚔️"}</div>
          <div style={{display:"flex",gap:10,marginBottom:14}}>
            {[["Person 1",p1],["Person 2",p2]].map(([n,v],i)=>(
              <div key={i} style={{background:C.card,border:`1px solid ${i===0?C.pink:C.cyan}44`,borderRadius:14,padding:"12px",flex:1}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>{n}</div>
                <div style={{color:v==="agree"?C.cyan:C.pink,fontSize:13,fontWeight:800}}>{v==="agree"?"✅ Agrees":"❌ Disagrees"}</div>
              </div>
            ))}
          </div>
          <p style={{color:p1===p2?C.cyan:"#FFD700",fontWeight:700,fontSize:15,marginBottom:14}}>{p1===p2?"You're on the same page 🙌":"Oooh this could start something 👀"}</p>
          <button onClick={next} onTouchEnd={e=>{e.preventDefault();next();}} style={PBtn(C.cyan)}>Next →</button>
        </div>
      )}
    </GameShell>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function VibeCheck() {
  const [screen,setScreen]=useState("home");
  const [game,setGame]=useState(null);
  const [roomCode,setRoomCode]=useState("");
  const [pairId,setPairId]=useState("");
  const [inputCode,setInputCode]=useState("");
  const [playerNum,setPlayerNum]=useState(null);
  const [deck,setDeck]=useState([]);
  const [cardIdx,setCardIdx]=useState(0);
  const [localLikes,setLocalLikes]=useState(new Set());
  const [matchCard,setMatchCard]=useState(null);
  const [showRating,setShowRating]=useState(false);
  const [otherDone,setOtherDone]=useState(false);
  const [partnerJoined,setPartnerJoined]=useState(false);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const unsubRef=useRef(null);

  const startListening=useCallback((code,pNum,myDeck,myLikes)=>{
    if(unsubRef.current)unsubRef.current();
    unsubRef.current=watchRoom(code,room=>{
      if(pNum===1&&room.p2Joined&&!partnerJoined){setPartnerJoined(true);setScreen("swipe");}
      const theirLikes=Object.keys((pNum===1?room.p2Likes:room.p1Likes)||{}).map(Number);
      const myLikeIds=[...myLikes];
      const hitId=myLikeIds.find(id=>theirLikes.includes(id));
      if(hitId){const hit=myDeck.find(c=>c.id===hitId);if(hit){SFX.match();setMatchCard(hit);if(unsubRef.current)unsubRef.current();return;}}
      if(pNum===1?room.p2Done:room.p1Done)setOtherDone(true);
    });
  },[partnerJoined]);

  useEffect(()=>()=>{if(unsubRef.current)unsubRef.current();},[]);

  const doCreate=async()=>{
    SFX.tap();setLoading(true);setError("");
    try{
      await initFB();
      const code=genCode(),pid=genCode()+genCode(),shuffled=shuffle(ACTIVITIES);
      await setRoom(code,{deck:shuffled,p1Likes:{},p2Likes:{},p2Joined:false,p1Done:false,p2Done:false,pairId:pid,created:Date.now()});
      setRoomCode(code);setPairId(pid);setPlayerNum(1);setDeck(shuffled);setCardIdx(0);setLocalLikes(new Set());
      setScreen("wait");startListening(code,1,shuffled,new Set());
    }catch(e){setError("Couldn't create room. Check your connection.");}
    setLoading(false);
  };

  const doJoin=async()=>{
    SFX.tap();setLoading(true);setError("");
    const code=inputCode.trim().toUpperCase();
    if(code.length<4){setError("Enter the code your partner shared.");setLoading(false);return;}
    try{
      await initFB();
      const room=await getRoom(code);
      if(!room){setError("Room not found. Check the code.");setLoading(false);return;}
      room.p2Joined=true;await setRoom(code,room);
      setRoomCode(code);setPairId(room.pairId||"default");setPlayerNum(2);
      setDeck(room.deck);setCardIdx(0);setLocalLikes(new Set());setScreen("swipe");
      startListening(code,2,room.deck,new Set());
    }catch(e){setError("Couldn't join room.");}
    setLoading(false);
  };

  // Fast local swipe — only writes to Firebase when done
  const doSwipe=async(dir)=>{
    const card=deck[cardIdx];
    const newLikes=new Set(localLikes);
    if(dir==="yes"){SFX.yes();newLikes.add(card.id);setLocalLikes(newLikes);}
    else SFX.no();
    const next=cardIdx+1,isDone=next>=deck.length;
    if(isDone){
      // Write all likes at once at the end
      try{
        const room=await getRoom(roomCode);
        if(room){
          const key=playerNum===1?"p1Likes":"p2Likes";
          room[key]={};
          newLikes.forEach(id=>{room[key][id]=true;});
          room[playerNum===1?"p1Done":"p2Done"]=true;
          await setRoom(roomCode,room);
          // Restart listener with updated likes
          startListening(roomCode,playerNum,deck,newLikes);
        }
      }catch(e){}
      setScreen("done");
    }else{
      setCardIdx(next);
    }
  };

  const reset=async()=>{
    if(unsubRef.current)unsubRef.current();
    if(roomCode){try{await delRoom(roomCode);}catch(e){}}
    setScreen("home");setRoomCode("");setPairId("");setInputCode("");
    setPlayerNum(null);setDeck([]);setCardIdx(0);setLocalLikes(new Set());
    setMatchCard(null);setShowRating(false);setOtherDone(false);setPartnerJoined(false);
    setError("");setLoading(false);
  };

  if(game==="truth")   return <TruthOrDare onBack={()=>setGame(null)}/>;
  if(game==="knowme")  return <KnowMe onBack={()=>setGame(null)}/>;
  if(game==="never")   return <Never onBack={()=>setGame(null)}/>;
  if(game==="tot")     return <ThisOrThat onBack={()=>setGame(null)}/>;
  if(game==="hot")     return <HotTakes onBack={()=>setGame(null)}/>;
  if(screen==="history") return <HistoryScreen pairId={pairId||"default"} onBack={()=>setScreen("home")}/>;

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"-apple-system,'Inter',sans-serif",padding:"32px 20px",position:"relative",overflow:"hidden",WebkitOverflowScrolling:"touch"}}>
      <style>{`
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes flicker{0%,100%{opacity:1}93%{opacity:0.85}94%{opacity:1}}
        *{-webkit-tap-highlight-color:transparent;box-sizing:border-box}
        input,textarea{font-size:16px!important}
      `}</style>

      {/* Grid bg */}
      <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(${C.pink}07 1px,transparent 1px),linear-gradient(90deg,${C.pink}07 1px,transparent 1px)`,backgroundSize:"44px 44px"}}/>
        <div style={{position:"absolute",top:"15%",left:"5%",width:280,height:280,borderRadius:"50%",background:C.pink,filter:"blur(110px)",opacity:0.07}}/>
        <div style={{position:"absolute",bottom:"15%",right:"5%",width:280,height:280,borderRadius:"50%",background:C.cyan,filter:"blur(110px)",opacity:0.07}}/>
      </div>

      {/* Header */}
      {!matchCard&&!showRating&&(
        <div style={{position:"fixed",top:0,left:0,right:0,zIndex:10}}>
          <div style={{maxWidth:440,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:`1px solid ${C.border}`}}>
            <span style={{fontSize:18,fontWeight:900,letterSpacing:"-1px",background:`linear-gradient(135deg,${C.pink},${C.cyan})`,backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"shimmer 5s linear infinite,flicker 8s ease infinite"}}>
              ✦ Vibe Check
            </span>
            <button onClick={()=>{SFX.tap();if(pairId)setScreen("history");}} onTouchEnd={e=>{e.preventDefault();SFX.tap();if(pairId)setScreen("history");}}
              style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:50,padding:"7px 14px",color:C.muted,fontSize:12,fontWeight:700,cursor:"pointer",WebkitAppearance:"none",touchAction:"manipulation",letterSpacing:1,textTransform:"uppercase"}}>
              History
            </button>
          </div>
        </div>
      )}

      <div style={{paddingTop:70,width:"100%",maxWidth:440,position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center"}}>

        {/* HOME */}
        {screen==="home"&&!matchCard&&(
          <div style={{textAlign:"center",animation:"slideUp 0.4s ease both",width:"100%"}}>
            <div style={{fontSize:"clamp(54px,13vw,84px)",fontWeight:900,letterSpacing:"-5px",lineHeight:.85,margin:"0 0 14px",background:`linear-gradient(135deg,${C.pink},${C.cyan})`,backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"shimmer 4s linear infinite,flicker 8s ease infinite"}}>
              VIBE<br/>CHECK
            </div>
            <p style={{fontSize:15,color:C.muted,marginBottom:36,lineHeight:1.7}}>Both swipe yes on the same thing<br/>and tonight is decided. No debates.</p>
            <button onClick={doCreate} onTouchEnd={e=>{e.preventDefault();doCreate();}} style={PBtn(C.pink)} disabled={loading}>{loading?"Creating…":"⚡ Create a room"}</button>
            <button onClick={()=>{SFX.tap();setScreen("join");}} onTouchEnd={e=>{e.preventDefault();SFX.tap();setScreen("join");}} style={SBtn()}>Join with a code</button>
            <button onClick={()=>{SFX.tap();setScreen("games");}} onTouchEnd={e=>{e.preventDefault();SFX.tap();setScreen("games");}} style={SBtn({color:C.cyan,border:`1px solid ${C.cyan}33`})}>🎮 Couples games</button>
            {error&&<p style={{color:C.pink,fontSize:13,marginTop:4}}>{error}</p>}
          </div>
        )}

        {/* JOIN */}
        {screen==="join"&&(
          <div style={{textAlign:"center",animation:"slideUp 0.4s ease both",width:"100%"}}>
            <h2 style={{fontSize:24,fontWeight:900,color:C.text,marginBottom:8}}>Enter room code</h2>
            <p style={{color:C.muted,fontSize:14,marginBottom:20}}>Ask your partner for their code</p>
            <input value={inputCode} onChange={e=>setInputCode(e.target.value.toUpperCase())} maxLength={6} placeholder="AB12C"
              style={{width:"100%",padding:"16px 20px",fontSize:26,fontWeight:900,textAlign:"center",letterSpacing:6,background:`rgba(255,45,120,0.05)`,border:`1px solid ${C.pink}44`,borderRadius:16,color:C.text,marginBottom:8,outline:"none",WebkitAppearance:"none",boxShadow:glow(C.pink,8)}}/>
            {error&&<p style={{color:C.pink,fontSize:13,marginBottom:8}}>{error}</p>}
            <button onClick={doJoin} onTouchEnd={e=>{e.preventDefault();doJoin();}} style={PBtn(C.pink,{marginTop:10})} disabled={loading}>{loading?"Joining…":"Join →"}</button>
            <button onClick={()=>{setError("");setScreen("home");}} onTouchEnd={e=>{e.preventDefault();setError("");setScreen("home");}} style={SBtn()}>← Back</button>
          </div>
        )}

        {/* WAIT */}
        {screen==="wait"&&(
          <div style={{textAlign:"center",animation:"slideUp 0.4s ease both",width:"100%"}}>
            <div style={{fontSize:40,marginBottom:12,animation:"spin 3s linear infinite"}}>🔗</div>
            <h2 style={{fontSize:22,fontWeight:900,color:C.text,marginBottom:8}}>Room created!</h2>
            <p style={{color:C.muted,fontSize:14,marginBottom:20,lineHeight:1.7}}>Share this code with your partner</p>
            <div style={{background:`rgba(255,45,120,0.06)`,border:`1px solid ${C.pink}44`,borderRadius:20,padding:"20px",marginBottom:20,boxShadow:glow(C.pink,10)}}>
              <div style={{fontSize:40,fontWeight:900,letterSpacing:8,background:`linear-gradient(135deg,${C.pink},${C.cyan})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{roomCode}</div>
              <p style={{color:C.dim,fontSize:11,marginTop:4,letterSpacing:1,textTransform:"uppercase"}}>Room code</p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center",color:C.dim,fontSize:14,marginBottom:20}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:C.cyan,boxShadow:glow(C.cyan,6),animation:"pulse 1.2s ease infinite"}}/>
              Waiting for your partner…
            </div>
            <button onClick={reset} onTouchEnd={e=>{e.preventDefault();reset();}} style={SBtn()}>Cancel</button>
          </div>
        )}

        {/* SWIPE */}
        {screen==="swipe"&&deck.length>0&&cardIdx<deck.length&&!matchCard&&(
          <div style={{width:"100%",animation:"slideUp 0.4s ease both"}}>
            <div style={{textAlign:"center",marginBottom:18}}>
              <div style={{display:"inline-block",fontSize:10,fontWeight:800,letterSpacing:3,textTransform:"uppercase",color:playerNum===1?C.pink:C.cyan,border:`1px solid ${playerNum===1?C.pink:C.cyan}44`,borderRadius:50,padding:"5px 14px",marginBottom:8}}>
                {playerNum===1?"Person 1":"Person 2"}
              </div>
              <h2 style={{fontSize:19,fontWeight:900,color:C.text,margin:"0 0 4px"}}>Swipe on what sounds good</h2>
              <p style={{fontSize:12,color:C.muted,margin:0}}>{deck.length-cardIdx} left · {otherDone?"🟢 Partner finished":"⏳ Partner is swiping…"}</p>
            </div>
            <div style={{position:"relative",height:280,width:"100%"}}>
              <SwipeCard activity={deck[cardIdx]} onSwipe={doSwipe}/>
              {cardIdx+1<deck.length&&<div style={{position:"absolute",width:"100%",transform:"scale(0.95) translateY(10px)",zIndex:1}}><div style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${C.border}`,borderRadius:28,height:230}}/></div>}
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:24,marginTop:18}}>
              <button onClick={()=>doSwipe("no")} onTouchEnd={e=>{e.preventDefault();doSwipe("no");}}
                style={{width:62,height:62,borderRadius:"50%",background:`rgba(255,45,120,0.1)`,border:`2px solid ${C.pink}55`,fontSize:22,cursor:"pointer",color:C.pink,display:"flex",alignItems:"center",justifyContent:"center",WebkitAppearance:"none",touchAction:"manipulation"}}>✕</button>
              <button onClick={()=>doSwipe("yes")} onTouchEnd={e=>{e.preventDefault();doSwipe("yes");}}
                style={{width:62,height:62,borderRadius:"50%",background:`rgba(0,245,255,0.1)`,border:`2px solid ${C.cyan}55`,fontSize:22,cursor:"pointer",color:C.cyan,display:"flex",alignItems:"center",justifyContent:"center",WebkitAppearance:"none",touchAction:"manipulation"}}>♥</button>
            </div>
            <button onClick={reset} onTouchEnd={e=>{e.preventDefault();reset();}} style={SBtn({marginTop:18,padding:"12px"})}>← Leave room</button>
          </div>
        )}

        {/* DONE */}
        {screen==="done"&&!matchCard&&(
          <div style={{textAlign:"center",animation:"slideUp 0.4s ease both",width:"100%"}}>
            <div style={{fontSize:48,marginBottom:12,animation:"pulse 1.5s ease infinite"}}>⏳</div>
            <h2 style={{fontSize:22,fontWeight:900,color:C.text,marginBottom:8}}>You're done swiping!</h2>
            <p style={{color:C.muted,fontSize:15,lineHeight:1.7,marginBottom:24}}>{otherDone?"No match this round. Try again?":"Waiting for your partner…"}</p>
            {otherDone&&<button onClick={reset} onTouchEnd={e=>{e.preventDefault();reset();}} style={PBtn(C.pink)}>Try again</button>}
          </div>
        )}

        {/* GAMES */}
        {screen==="games"&&(
          <div style={{animation:"slideUp 0.4s ease both",width:"100%"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
              <button onClick={()=>{SFX.tap();setScreen("home");}} onTouchEnd={e=>{e.preventDefault();SFX.tap();setScreen("home");}}
                style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:50,minWidth:44,height:44,color:C.muted,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",WebkitAppearance:"none",touchAction:"manipulation"}}>←</button>
              <div>
                <div style={{fontSize:11,color:C.cyan,textTransform:"uppercase",letterSpacing:2,fontWeight:800}}>Play Together</div>
                <div style={{fontSize:20,fontWeight:900,color:C.text}}>Couples Games</div>
              </div>
            </div>
            {[
              {key:"truth",emoji:"🎴",title:"Truth or Dare",desc:"Spicy questions & wild dares",color:C.pink},
              {key:"knowme",emoji:"🧠",title:"How Well Do You Know Me?",desc:"Answer about yourself — they guess",color:C.cyan},
              {key:"never",emoji:"🍹",title:"Never Have I Ever",desc:"Find out what you've both been up to",color:C.purple},
              {key:"tot",emoji:"⚡",title:"This or That",desc:"Rapid fire — how in sync are you?",color:C.cyan},
              {key:"hot",emoji:"🌶️",title:"Hot Takes",desc:"Agree or disagree on spicy opinions",color:C.pink},
            ].map(g=>(
              <button key={g.key} onClick={()=>{SFX.tap();setGame(g.key);}} onTouchEnd={e=>{e.preventDefault();SFX.tap();setGame(g.key);}}
                style={{width:"100%",background:C.card,border:`1px solid ${g.color}22`,borderRadius:18,padding:"16px 18px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",color:C.text,marginBottom:10,textAlign:"left",WebkitAppearance:"none",touchAction:"manipulation"}}>
                <span style={{fontSize:26}}>{g.emoji}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:15}}>{g.title}</div>
                  <div style={{fontSize:13,color:C.muted,marginTop:2}}>{g.desc}</div>
                </div>
                <span style={{color:g.color,fontSize:16}}>→</span>
              </button>
            ))}
          </div>
        )}

        {matchCard&&!showRating&&<MatchScreen activity={matchCard} onRate={()=>setShowRating(true)}/>}
        {matchCard&&showRating&&<RatingScreen activity={matchCard} playerNum={playerNum} pairId={pairId||"default"} roomCode={roomCode} onDone={reset}/>}
      </div>
    </div>
  );
}
