import { useState, useRef, useEffect, useCallback } from "react";

// ─── Firebase (loaded via CDN) ────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAfeFD0wXJhKsMvjZOAJULkTaTAZvu9uTw",
  authDomain: "vibe-check-1315d.firebaseapp.com",
  databaseURL: "https://vibe-check-1315d-default-rtdb.firebaseio.com",
  projectId: "vibe-check-1315d",
  storageBucket: "vibe-check-1315d.firebasestorage.app",
  messagingSenderId: "630598049701",
  appId: "1:630598049701:web:9a76ca0cf986ddb30ad24c",
};

// We load Firebase from CDN dynamically
let db = null;
let firebaseRef = null;
let firebaseSet = null;
let firebaseGet = null;
let firebaseOnValue = null;
let firebaseOff = null;
let firebaseRemove = null;

async function initFirebase() {
  if (db) return true;
  try {
    const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getDatabase, ref, set, get, onValue, off, remove } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
    const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    db = getDatabase(app);
    firebaseRef = ref;
    firebaseSet = set;
    firebaseGet = get;
    firebaseOnValue = onValue;
    firebaseOff = off;
    firebaseRemove = remove;
    return true;
  } catch (e) {
    console.error("Firebase init error", e);
    return false;
  }
}

function roomRef(code) { return firebaseRef(db, `rooms/${code}`); }

async function createRoom(code, data) {
  await initFirebase();
  await firebaseSet(roomRef(code), data);
}

async function getRoom(code) {
  await initFirebase();
  const snap = await firebaseGet(roomRef(code));
  return snap.exists() ? snap.val() : null;
}

async function updateRoom(code, data) {
  await initFirebase();
  await firebaseSet(roomRef(code), data);
}

async function deleteRoom(code) {
  await initFirebase();
  await firebaseRemove(roomRef(code));
}

function listenRoom(code, cb) {
  const r = roomRef(code);
  firebaseOnValue(r, snap => { if (snap.exists()) cb(snap.val()); });
  return () => firebaseOff(r);
}

// ─── Activities ───────────────────────────────────────────────────────────────
const ALL_ACTIVITIES = [
  { id:1,  emoji:"🎬", label:"Movie marathon",         desc:"Pick a franchise & go all in" },
  { id:2,  emoji:"🌙", label:"Late night food run",    desc:"Drive somewhere new, order random" },
  { id:3,  emoji:"🎤", label:"Home karaoke",           desc:"YouTube karaoke. Full send. No excuses" },
  { id:4,  emoji:"👨‍🍳", label:"Cook together",          desc:"New recipe, make it a whole event" },
  { id:5,  emoji:"🚶", label:"Night walk",              desc:"Explore a neighborhood neither knows" },
  { id:6,  emoji:"🎮", label:"Co-op game night",       desc:"Find something you can both play" },
  { id:7,  emoji:"🍦", label:"Dessert crawl",          desc:"2-3 spots, split something at each" },
  { id:8,  emoji:"✏️", label:"Draw each other badly",  desc:"5 min timer. No peeking. Pure chaos" },
  { id:9,  emoji:"🛁", label:"Spa night at home",      desc:"Face masks, candles, lo-fi. Full reset" },
  { id:10, emoji:"🎳", label:"Bowling or arcade",      desc:"Get out, compete, talk trash" },
  { id:11, emoji:"🌅", label:"Catch the sunset",       desc:"Find a view spot, bring something warm" },
  { id:12, emoji:"🍰", label:"Bake something chaotic", desc:"Pick something too hard. Go for it" },
  { id:13, emoji:"🎵", label:"Build a playlist",       desc:"Take turns, no vetoes, just vibe" },
  { id:14, emoji:"🥡", label:"Try a new cuisine",      desc:"Close eyes, pick something never tried" },
  { id:15, emoji:"🌿", label:"Find a trail",           desc:"Doesn't need to be big, just go" },
  { id:16, emoji:"✂️", label:"Vision board night",     desc:"Map your next 6 months together" },
  { id:17, emoji:"🏎️", label:"Mario Kart tournament",  desc:"Best of 5. Loser does dishes." },
  { id:18, emoji:"🌳", label:"Park sit & snack",       desc:"Phones away for 20 mins. Just be." },
  { id:19, emoji:"🎨", label:"Paint & chill",          desc:"Cheap canvases, cheap wine, good time" },
  { id:20, emoji:"🚗", label:"Mystery drive",          desc:"One person picks direction, just go" },
];

const TRUTH_OR_DARE = [
  { type:"truth", text:"What's something you've never told me but always wanted to?" },
  { type:"truth", text:"What was your first impression of me? Be honest." },
  { type:"truth", text:"What's one habit of mine that low-key annoys you?" },
  { type:"truth", text:"What's the most embarrassing thing that's happened to you?" },
  { type:"truth", text:"What's something you're secretly really proud of?" },
  { type:"truth", text:"If you could change one thing about our relationship, what would it be?" },
  { type:"truth", text:"What's something you pretend to like just because I like it?" },
  { type:"truth", text:"Have you ever lied to me? About what?" },
  { type:"truth", text:"What do you actually think of my friends?" },
  { type:"truth", text:"What's your biggest fear about the future?" },
  { type:"dare", text:"Text someone in your contacts something nice right now, no context." },
  { type:"dare", text:"Do your best impression of me. Full send." },
  { type:"dare", text:"Let your partner post anything on your Instagram story for 10 minutes." },
  { type:"dare", text:"Sing the chorus of the last song you listened to. Right now." },
  { type:"dare", text:"Show your partner the last 5 photos in your camera roll. No deleting." },
  { type:"dare", text:"Let your partner read your last 3 text conversations." },
  { type:"dare", text:"Do 10 push-ups or give your partner a 5 min back massage. Their choice." },
  { type:"dare", text:"Say something genuinely sweet about your partner. No joking around." },
  { type:"dare", text:"Let your partner style your hair however they want for the rest of the night." },
  { type:"dare", text:"Call a family member and say 'just called to say I love you.'" },
];

const KNOW_ME_QUESTIONS = [
  "What's my go-to comfort food?",
  "What's my biggest pet peeve?",
  "What's my dream vacation destination?",
  "What was my favorite subject in school?",
  "What's the first thing I do when I wake up?",
  "What's my love language?",
  "What's a movie I could watch over and over?",
  "What am I most scared of?",
  "What's my biggest goal right now?",
  "What always makes me laugh no matter what?",
];

const NEVER_HAVE_I_EVER = [
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

const THIS_OR_THAT = [
  ["Beach 🏖️","Mountains ⛰️"],["Night owl 🦉","Early bird 🐦"],
  ["Netflix 📺","Going out 🎉"],["Text 💬","Call 📞"],
  ["Cook at home 👨‍🍳","Eat out 🍽️"],["Dogs 🐶","Cats 🐱"],
  ["Hot weather ☀️","Cold weather ❄️"],["Road trip 🚗","Flight ✈️"],
  ["Sweet 🍰","Savory 🧀"],["Morning shower 🌅","Night shower 🌙"],
  ["Introvert 🏠","Extrovert 🎊"],["Spontaneous 🎲","Planner 📅"],
];

const HOT_TAKES = [
  "Pineapple belongs on pizza",
  "Long distance relationships never work",
  "Social media ruins relationships",
  "The person who earns more should pay more on dates",
  "It's okay to look through your partner's phone",
  "Couples should have separate friend groups",
  "Jealousy is a sign of love",
  "Everyone has a type and never really changes it",
  "You should never go to bed angry",
  "Moving in together before marriage is smarter",
  "Couples that post a lot online are usually unhappy",
  "Having a work wife/husband is harmless",
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

function genCode() { return Math.random().toString(36).substring(2,7).toUpperCase(); }

// ─── Sound ────────────────────────────────────────────────────────────────────
function useSound() {
  const ctx = useRef(null);
  const go = () => {
    if (!ctx.current) ctx.current = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.current.state === "suspended") ctx.current.resume();
    return ctx.current;
  };
  const tone = (freq, type, dur, vol, delay=0) => {
    try {
      const ac=go(), o=ac.createOscillator(), g=ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.frequency.value=freq; o.type=type;
      g.gain.setValueAtTime(0, ac.currentTime+delay);
      g.gain.linearRampToValueAtTime(vol, ac.currentTime+delay+0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime+delay+dur);
      o.start(ac.currentTime+delay); o.stop(ac.currentTime+delay+dur);
    } catch(e) {}
  };
  return {
    yes:   () => { tone(523,"sine",0.15,0.07); tone(659,"sine",0.15,0.06,0.08); },
    no:    () => tone(200,"sine",0.12,0.05),
    match: () => [523,659,784,1047,1319].forEach((f,i) => tone(f,"triangle",0.5,0.07,i*0.07)),
    tap:   () => tone(440,"sine",0.08,0.04),
    pop:   () => tone(600,"sine",0.1,0.06),
  };
}

// ─── Swipe Card ───────────────────────────────────────────────────────────────
function SwipeCard({ activity, onSwipe }) {
  const startX = useRef(0), dragging = useRef(false);
  const [offset, setOffset] = useState(0), [lbl, setLbl] = useState(null);
  const start = x => { dragging.current=true; startX.current=x; };
  const move  = x => { if(!dragging.current)return; const d=x-startX.current; setOffset(d); setLbl(d>50?"yes":d<-50?"no":null); };
  const end   = () => { if(!dragging.current)return; dragging.current=false; if(offset>90)onSwipe("yes"); else if(offset<-90)onSwipe("no"); else{setOffset(0);setLbl(null);} };
  return (
    <div
      onMouseDown={e=>start(e.clientX)} onMouseMove={e=>{if(dragging.current)move(e.clientX);}} onMouseUp={end} onMouseLeave={end}
      onTouchStart={e=>{e.preventDefault();start(e.touches[0].clientX);}}
      onTouchMove={e=>{e.preventDefault();move(e.touches[0].clientX);}}
      onTouchEnd={e=>{e.preventDefault();end();}}
      style={{position:"absolute",width:"100%",userSelect:"none",touchAction:"none",cursor:"grab",transform:`translateX(${offset}px) rotate(${offset/18}deg)`,transition:dragging.current?"none":"transform 0.35s cubic-bezier(.34,1.56,.64,1)",zIndex:10}}
    >
      <div style={{background:"rgba(255,255,255,0.07)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:lbl==="yes"?"2px solid #00E676":lbl==="no"?"2px solid #FF4458":"1px solid rgba(255,255,255,0.12)",borderRadius:28,padding:"36px 24px",textAlign:"center",minHeight:260,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative"}}>
        {lbl==="yes"&&<div style={{position:"absolute",top:20,left:20,border:"3px solid #00E676",borderRadius:8,color:"#00E676",fontWeight:900,fontSize:20,padding:"3px 12px",letterSpacing:2,transform:"rotate(-15deg)",opacity:Math.min(1,Math.abs(offset)/90)}}>YES</div>}
        {lbl==="no"&&<div style={{position:"absolute",top:20,right:20,border:"3px solid #FF4458",borderRadius:8,color:"#FF4458",fontWeight:900,fontSize:20,padding:"3px 12px",letterSpacing:2,transform:"rotate(15deg)",opacity:Math.min(1,Math.abs(offset)/90)}}>NOPE</div>}
        <div style={{fontSize:64,marginBottom:16,lineHeight:1}}>{activity.emoji}</div>
        <h2 style={{fontSize:22,fontWeight:900,color:"#fff",margin:"0 0 10px",letterSpacing:"-0.5px"}}>{activity.label}</h2>
        <p style={{fontSize:14,color:"rgba(255,255,255,0.5)",lineHeight:1.6,margin:0,maxWidth:220}}>{activity.desc}</p>
      </div>
    </div>
  );
}

// ─── Match Screen ─────────────────────────────────────────────────────────────
function MatchScreen({ activity, onReset }) {
  const dots = Array.from({length:16},(_,i)=>({color:["#FF6B9D","#FFD700","#00E676","#00C9FF","#A855F7","#FF6B35"][i%6],left:Math.random()*100,top:Math.random()*100,dx:(Math.random()-.5)*250,dy:(Math.random()-.5)*250}));
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"linear-gradient(135deg,#0f0c29,#302b63,#24243e)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",textAlign:"center",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes matchPop{from{opacity:0;transform:scale(0.7)}to{opacity:1;transform:scale(1)}}@keyframes titleBounce{0%{transform:scale(0)}60%{transform:scale(1.1)}100%{transform:scale(1)}}@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}${dots.map((_,i)=>`@keyframes cd${i}{from{transform:translate(0,0) scale(0);opacity:0}to{transform:translate(${dots[i].dx}px,${dots[i].dy}px) scale(1);opacity:.8}}`).join("")}`}</style>
      {dots.map((d,i)=><div key={i} style={{position:"fixed",width:12,height:12,borderRadius:"50%",background:d.color,left:`${d.left}%`,top:`${d.top}%`,animation:`cd${i} ${1+Math.random()*0.8}s ease-out both`,pointerEvents:"none"}}/>)}
      <div style={{animation:"matchPop 0.6s cubic-bezier(.34,1.56,.64,1) both",position:"relative",zIndex:1}}>
        <div style={{fontSize:72,marginBottom:8}}>🎯</div>
        <div style={{fontSize:"clamp(36px,10vw,56px)",fontWeight:900,letterSpacing:"-2px",lineHeight:1,background:"linear-gradient(135deg,#FFD700,#FF6B9D,#00E676)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"titleBounce 0.7s cubic-bezier(.34,1.56,.64,1) .2s both,shimmer 4s linear infinite",marginBottom:8}}>TONIGHT'S<br/>THE MOVE</div>
        <div style={{background:"rgba(255,255,255,0.08)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:24,padding:"24px 28px",margin:"20px 0"}}>
          <div style={{fontSize:52,marginBottom:10}}>{activity.emoji}</div>
          <div style={{fontSize:22,fontWeight:900,color:"#fff",marginBottom:8}}>{activity.label}</div>
          <div style={{fontSize:14,color:"rgba(255,255,255,0.6)",lineHeight:1.6}}>{activity.desc}</div>
        </div>
        <p style={{color:"rgba(255,255,255,0.3)",fontSize:13,marginBottom:28}}>You both swiped yes ✓</p>
        <button onTouchEnd={e=>{e.preventDefault();onReset();}} onClick={onReset} style={{background:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:50,padding:"16px 40px",fontSize:16,fontWeight:700,cursor:"pointer",WebkitAppearance:"none"}}>Back to home</button>
      </div>
    </div>
  );
}

// ─── Shared button styles ─────────────────────────────────────────────────────
const btnP = { background:"linear-gradient(135deg,#FF6B9D,#C850C0)",color:"#fff",border:"none",borderRadius:50,padding:"18px",fontSize:17,fontWeight:800,cursor:"pointer",width:"100%",marginBottom:12,WebkitAppearance:"none",touchAction:"manipulation" };
const btnS = { background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.6)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:50,padding:"18px",fontSize:17,fontWeight:700,cursor:"pointer",width:"100%",marginBottom:12,WebkitAppearance:"none",touchAction:"manipulation" };
const btnA = bg => ({ background:bg,color:"#fff",border:"none",borderRadius:50,padding:"16px",fontSize:16,fontWeight:800,cursor:"pointer",width:"100%",marginBottom:10,WebkitAppearance:"none",touchAction:"manipulation" });

// ─── Game Shell ───────────────────────────────────────────────────────────────
function GameShell({ title, emoji, onBack, children }) {
  return (
    <div style={{width:"100%",maxWidth:440,animation:"slideUp 0.4s ease both"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <button onTouchEnd={e=>{e.preventDefault();onBack();}} onClick={onBack} style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:50,minWidth:44,height:44,color:"rgba(255,255,255,0.7)",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",WebkitAppearance:"none",touchAction:"manipulation"}}>←</button>
        <div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:1}}>Game</div>
          <div style={{fontSize:18,fontWeight:900,color:"#fff"}}>{emoji} {title}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function TruthOrDare({ onBack }) {
  const sound=useSound(), [cards]=useState(()=>shuffle(TRUTH_OR_DARE)), [idx,setIdx]=useState(0), [flipped,setFlipped]=useState(false);
  const card=cards[idx%cards.length];
  return (
    <GameShell title="Truth or Dare" emoji="🎴" onBack={onBack}>
      <div style={{width:"100%"}}>
        <div onTouchEnd={e=>{if(!flipped){e.preventDefault();sound.pop();setFlipped(true);}}} onClick={()=>{if(!flipped){sound.pop();setFlipped(true);}}} style={{background:flipped?(card.type==="truth"?"rgba(0,201,255,0.1)":"rgba(255,107,157,0.1)"):"rgba(255,255,255,0.06)",border:flipped?(card.type==="truth"?"1px solid #00C9FF55":"1px solid #FF6B9D55"):"1px solid rgba(255,255,255,0.1)",borderRadius:28,padding:"44px 24px",textAlign:"center",minHeight:210,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",touchAction:"manipulation"}}>
          {!flipped?<><div style={{fontSize:44,marginBottom:12}}>👆</div><p style={{color:"rgba(255,255,255,0.4)",fontSize:16,margin:0}}>Tap to reveal</p></>:<><div style={{fontSize:11,fontWeight:800,letterSpacing:3,textTransform:"uppercase",color:card.type==="truth"?"#00C9FF":"#FF6B9D",marginBottom:16}}>{card.type}</div><p style={{fontSize:18,fontWeight:700,color:"#fff",lineHeight:1.6,margin:0}}>{card.text}</p></>}
        </div>
        {flipped&&<button onTouchEnd={e=>{e.preventDefault();sound.tap();setIdx(i=>i+1);setFlipped(false);}} onClick={()=>{sound.tap();setIdx(i=>i+1);setFlipped(false);}} style={{...btnA("linear-gradient(135deg,#FF6B9D,#C850C0)"),marginTop:16}}>Next card →</button>}
        {!flipped&&<p style={{textAlign:"center",color:"rgba(255,255,255,0.2)",fontSize:12,marginTop:14}}>{cards.length} cards · shuffled</p>}
      </div>
    </GameShell>
  );
}

function HowWellDoYouKnowMe({ onBack }) {
  const sound=useSound(), [phase,setPhase]=useState("pick"), [qIdx,setQIdx]=useState(0), [score,setScore]=useState(0), [p1Ans,setP1Ans]=useState(""), [p2Ans,setP2Ans]=useState(""), [matched,setMatched]=useState(null);
  const total=KNOW_ME_QUESTIONS.length, q=KNOW_ME_QUESTIONS[qIdx];
  const checkMatch=()=>{ sound.tap(); const a=p1Ans.trim().toLowerCase(),b=p2Ans.trim().toLowerCase(); const hit=a===b||(b.length>2&&a.includes(b.substring(0,4))); if(hit)setScore(s=>s+1); setMatched(hit); setPhase("result"); };
  const next=()=>{ sound.tap(); if(qIdx+1>=total){setPhase("done");return;} setQIdx(i=>i+1);setP1Ans("");setP2Ans("");setMatched(null);setPhase("p1answer"); };
  return (
    <GameShell title="How Well Do You Know Me?" emoji="🧠" onBack={onBack}>
      <div style={{width:"100%"}}>
        {phase==="pick"&&<div style={{textAlign:"center"}}><p style={{color:"rgba(255,255,255,0.5)",fontSize:15,lineHeight:1.7,marginBottom:28}}>One person answers about themselves. Their partner guesses. See how well you really know each other.</p><button onTouchEnd={e=>{e.preventDefault();sound.tap();setPhase("p1answer");}} onClick={()=>{sound.tap();setPhase("p1answer");}} style={btnP}>Let's go →</button></div>}
        {phase==="p1answer"&&<div><div style={{textAlign:"center",marginBottom:20}}><div style={{fontSize:11,color:"#FF6B9D",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Person 1 — answer about yourself</div><div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginBottom:8}}>Question {qIdx+1} of {total}</div><h3 style={{fontSize:20,fontWeight:900,color:"#fff",margin:0,lineHeight:1.4}}>{q}</h3></div><textarea value={p1Ans} onChange={e=>setP1Ans(e.target.value)} placeholder="Type your answer…" rows={3} style={{width:"100%",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:16,padding:"16px",color:"#fff",fontSize:16,resize:"none",outline:"none",marginBottom:12,WebkitAppearance:"none",boxSizing:"border-box"}}/><p style={{color:"rgba(255,255,255,0.25)",fontSize:12,textAlign:"center",marginBottom:12}}>Hand the phone to your partner 🔄</p><button onTouchEnd={e=>{if(p1Ans.trim()){e.preventDefault();setPhase("p2guess");} }} onClick={()=>{if(p1Ans.trim())setPhase("p2guess");}} style={btnP}>Partner's turn →</button></div>}
        {phase==="p2guess"&&<div><div style={{textAlign:"center",marginBottom:20}}><div style={{fontSize:11,color:"#00C9FF",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Partner — what do you think they said?</div><h3 style={{fontSize:20,fontWeight:900,color:"#fff",margin:0,lineHeight:1.4}}>{q}</h3></div><textarea value={p2Ans} onChange={e=>setP2Ans(e.target.value)} placeholder="Your guess…" rows={3} style={{width:"100%",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:16,padding:"16px",color:"#fff",fontSize:16,resize:"none",outline:"none",marginBottom:12,WebkitAppearance:"none",boxSizing:"border-box"}}/><button onTouchEnd={e=>{if(p2Ans.trim()){e.preventDefault();checkMatch();}}} onClick={()=>{if(p2Ans.trim())checkMatch();}} style={btnA("linear-gradient(135deg,#6C63FF,#00C9FF)")}>Reveal →</button></div>}
        {phase==="result"&&<div style={{textAlign:"center"}}><div style={{fontSize:52,marginBottom:12}}>{matched?"🎉":"😬"}</div><h3 style={{fontSize:22,fontWeight:900,color:matched?"#00E676":"#FF4458",marginBottom:16}}>{matched?"Match!":"Not quite"}</h3><div style={{background:"rgba(255,255,255,0.06)",borderRadius:20,padding:"18px",marginBottom:10,textAlign:"left"}}><div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Their answer</div><div style={{color:"#fff",fontSize:16,fontWeight:700}}>{p1Ans}</div></div><div style={{background:"rgba(255,255,255,0.06)",borderRadius:20,padding:"18px",marginBottom:16,textAlign:"left"}}><div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Your guess</div><div style={{color:"#fff",fontSize:16,fontWeight:700}}>{p2Ans}</div></div><div style={{color:"rgba(255,255,255,0.4)",fontSize:13,marginBottom:16}}>Score: {score}/{qIdx+1}</div><button onTouchEnd={e=>{e.preventDefault();next();}} onClick={next} style={btnP}>{qIdx+1>=total?"See final score →":"Next question →"}</button></div>}
        {phase==="done"&&<div style={{textAlign:"center"}}><div style={{fontSize:64,marginBottom:12}}>{score>=8?"🥰":score>=5?"😊":"😅"}</div><h2 style={{fontSize:30,fontWeight:900,color:"#fff",marginBottom:8}}>{score}/{total}</h2><p style={{color:"rgba(255,255,255,0.5)",fontSize:16,lineHeight:1.7,marginBottom:28}}>{score>=8?"You two are incredibly in sync 🥹":score>=5?"Pretty solid — still some mysteries 👀":"Room to grow. That's what this is for 😄"}</p><button onTouchEnd={e=>{e.preventDefault();setPhase("pick");setQIdx(0);setScore(0);setP1Ans("");setP2Ans("");setMatched(null);}} onClick={()=>{setPhase("pick");setQIdx(0);setScore(0);setP1Ans("");setP2Ans("");setMatched(null);}} style={btnP}>Play again</button></div>}
      </div>
    </GameShell>
  );
}

function NeverHaveIEver({ onBack }) {
  const sound=useSound(), [cards]=useState(()=>shuffle(NEVER_HAVE_I_EVER)), [idx,setIdx]=useState(0), [p1,setP1]=useState(null), [p2,setP2]=useState(null), [revealed,setRevealed]=useState(false);
  const next=()=>{ sound.tap(); setIdx(i=>(i+1)%cards.length); setP1(null); setP2(null); setRevealed(false); };
  return (
    <GameShell title="Never Have I Ever" emoji="🍹" onBack={onBack}>
      <div style={{width:"100%"}}>
        <div style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:24,padding:"28px 20px",textAlign:"center",marginBottom:16}}><p style={{fontSize:17,fontWeight:700,color:"#fff",lineHeight:1.6,margin:0}}>{cards[idx]}</p></div>
        {!revealed?(<>
          <p style={{textAlign:"center",color:"rgba(255,255,255,0.35)",fontSize:12,marginBottom:12,textTransform:"uppercase",letterSpacing:1}}>Both pick secretly — reveal together</p>
          {[["Person 1",p1,setP1],["Person 2",p2,setP2]].map(([name,val,setVal],pi)=>(
            <div key={pi} style={{marginBottom:12}}>
              <p style={{color:"rgba(255,255,255,0.4)",fontSize:13,marginBottom:8,textAlign:"center"}}>{name}</p>
              <div style={{display:"flex",gap:10}}>
                {["✅ I have","❌ Never"].map((label,vi)=>(
                  <button key={vi} onTouchEnd={e=>{e.preventDefault();sound.pop();setVal(vi===0);}} onClick={()=>{sound.pop();setVal(vi===0);}} style={{flex:1,padding:"14px 8px",borderRadius:16,border:val===(vi===0)?`2px solid ${vi===0?"#00E676":"#FF4458"}`:"1px solid rgba(255,255,255,0.1)",background:val===(vi===0)?(vi===0?"rgba(0,230,118,0.15)":"rgba(255,68,88,0.15)"):"rgba(255,255,255,0.05)",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",WebkitAppearance:"none",touchAction:"manipulation"}}>{label}</button>
                ))}
              </div>
            </div>
          ))}
          {p1!==null&&p2!==null&&<button onTouchEnd={e=>{e.preventDefault();setRevealed(true);}} onClick={()=>setRevealed(true)} style={btnP}>Reveal 👀</button>}
        </>):(
          <div style={{textAlign:"center"}}>
            <div style={{display:"flex",gap:12,marginBottom:16,justifyContent:"center"}}>
              {[["Person 1",p1],["Person 2",p2]].map(([name,val],i)=>(
                <div key={i} style={{background:val?"rgba(0,230,118,0.1)":"rgba(255,68,88,0.1)",border:`1px solid ${val?"#00E67644":"#FF445844"}`,borderRadius:16,padding:"16px 20px",flex:1}}>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>{name}</div>
                  <div style={{fontSize:22}}>{val?"✅":"❌"}</div>
                  <div style={{color:"#fff",fontSize:13,marginTop:4}}>{val?"I have":"Never"}</div>
                </div>
              ))}
            </div>
            <p style={{color:p1&&p2?"#FFD700":(!p1&&!p2)?"#00E676":"#FF6B9D",fontWeight:700,fontSize:15,marginBottom:16}}>{p1&&p2?"You've both done this 👀":(!p1&&!p2)?"Neither of you! Clean slates 😇":"Interesting… tell me more 🤭"}</p>
            <button onTouchEnd={e=>{e.preventDefault();next();}} onClick={next} style={btnA("linear-gradient(135deg,#6C63FF,#00C9FF)")}>Next card →</button>
          </div>
        )}
      </div>
    </GameShell>
  );
}

function ThisOrThat({ onBack }) {
  const sound=useSound(), [cards]=useState(()=>shuffle(THIS_OR_THAT)), [idx,setIdx]=useState(0), [p1,setP1]=useState(null), [p2,setP2]=useState(null), [revealed,setRevealed]=useState(false), [score,setScore]=useState({match:0,diff:0});
  const [a,b]=cards[idx];
  const reveal=()=>{ sound.pop(); if(p1===p2)setScore(s=>({...s,match:s.match+1})); else setScore(s=>({...s,diff:s.diff+1})); setRevealed(true); };
  const next=()=>{ sound.tap(); setIdx(i=>(i+1)%cards.length); setP1(null); setP2(null); setRevealed(false); };
  return (
    <GameShell title="This or That" emoji="⚡" onBack={onBack}>
      <div style={{width:"100%"}}>
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:16}}>
          <span style={{background:"rgba(0,230,118,0.1)",border:"1px solid #00E67644",borderRadius:50,padding:"4px 12px",color:"#00E676",fontSize:12}}>✓ {score.match} matched</span>
          <span style={{background:"rgba(255,107,157,0.1)",border:"1px solid #FF6B9D44",borderRadius:50,padding:"4px 12px",color:"#FF6B9D",fontSize:12}}>↔ {score.diff} different</span>
        </div>
        {!revealed?(<>
          <p style={{textAlign:"center",color:"rgba(255,255,255,0.35)",fontSize:12,marginBottom:12,textTransform:"uppercase",letterSpacing:1}}>Pick secretly — reveal together</p>
          {[["Person 1",p1,setP1],["Person 2",p2,setP2]].map(([name,val,setVal],pi)=>(
            <div key={pi} style={{marginBottom:12}}>
              <p style={{color:"rgba(255,255,255,0.4)",fontSize:13,marginBottom:8,textAlign:"center"}}>{name}</p>
              <div style={{display:"flex",gap:10}}>
                {[a,b].map((opt,vi)=>(
                  <button key={vi} onTouchEnd={e=>{e.preventDefault();sound.pop();setVal(vi);}} onClick={()=>{sound.pop();setVal(vi);}} style={{flex:1,padding:"18px 8px",borderRadius:18,border:val===vi?`2px solid ${vi===0?"#FF6B9D":"#6C63FF"}`:"1px solid rgba(255,255,255,0.1)",background:val===vi?(vi===0?"rgba(255,107,157,0.15)":"rgba(108,99,255,0.15)"):"rgba(255,255,255,0.05)",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",WebkitAppearance:"none",touchAction:"manipulation"}}>{opt}</button>
                ))}
              </div>
            </div>
          ))}
          {p1!==null&&p2!==null&&<button onTouchEnd={e=>{e.preventDefault();reveal();}} onClick={reveal} style={btnP}>Reveal 👀</button>}
        </>):(
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:12}}>{p1===p2?"🎯":"😮"}</div>
            <div style={{display:"flex",gap:12,marginBottom:16}}>
              {[["Person 1",p1],["Person 2",p2]].map(([name,val],i)=>(
                <div key={i} style={{background:i===0?"rgba(255,107,157,0.1)":"rgba(108,99,255,0.1)",border:`1px solid ${i===0?"#FF6B9D44":"#6C63FF44"}`,borderRadius:16,padding:"14px 16px",flex:1}}>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>{name}</div>
                  <div style={{color:"#fff",fontSize:15,fontWeight:700}}>{val===0?a:b}</div>
                </div>
              ))}
            </div>
            <p style={{color:p1===p2?"#00E676":"#FF6B9D",fontWeight:700,fontSize:15,marginBottom:16}}>{p1===p2?"Same! You're aligned 🙌":"Different picks — talk about it 👀"}</p>
            <button onTouchEnd={e=>{e.preventDefault();next();}} onClick={next} style={btnA("linear-gradient(135deg,#6C63FF,#00C9FF)")}>Next →</button>
          </div>
        )}
      </div>
    </GameShell>
  );
}

function HotTakes({ onBack }) {
  const sound=useSound(), [cards]=useState(()=>shuffle(HOT_TAKES)), [idx,setIdx]=useState(0), [p1,setP1]=useState(null), [p2,setP2]=useState(null), [revealed,setRevealed]=useState(false);
  const next=()=>{ sound.tap(); setIdx(i=>(i+1)%cards.length); setP1(null); setP2(null); setRevealed(false); };
  return (
    <GameShell title="Hot Takes" emoji="🌶️" onBack={onBack}>
      <div style={{width:"100%"}}>
        <div style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:24,padding:"28px 20px",textAlign:"center",marginBottom:16}}><p style={{fontSize:18,fontWeight:800,color:"#fff",lineHeight:1.5,margin:0}}>{cards[idx]}</p></div>
        {!revealed?(<>
          <p style={{textAlign:"center",color:"rgba(255,255,255,0.35)",fontSize:12,marginBottom:12,textTransform:"uppercase",letterSpacing:1}}>Both pick secretly — reveal together</p>
          {[["Person 1",p1,setP1],["Person 2",p2,setP2]].map(([name,val,setVal],pi)=>(
            <div key={pi} style={{marginBottom:12}}>
              <p style={{color:"rgba(255,255,255,0.4)",fontSize:13,marginBottom:8,textAlign:"center"}}>{name}</p>
              <div style={{display:"flex",gap:10}}>
                {["agree","disagree"].map((v,vi)=>(
                  <button key={vi} onTouchEnd={e=>{e.preventDefault();sound.pop();setVal(v);}} onClick={()=>{sound.pop();setVal(v);}} style={{flex:1,padding:"14px 8px",borderRadius:16,border:val===v?`2px solid ${v==="agree"?"#00E676":"#FF4458"}`:"1px solid rgba(255,255,255,0.1)",background:val===v?(v==="agree"?"rgba(0,230,118,0.15)":"rgba(255,68,88,0.15)"):"rgba(255,255,255,0.05)",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",WebkitAppearance:"none",touchAction:"manipulation"}}>{v==="agree"?"✅ Agree":"❌ Disagree"}</button>
                ))}
              </div>
            </div>
          ))}
          {p1&&p2&&<button onTouchEnd={e=>{e.preventDefault();setRevealed(true);}} onClick={()=>setRevealed(true)} style={{...btnP,marginTop:8}}>Reveal 🌶️</button>}
        </>):(
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:12}}>{p1===p2?"🤝":"⚔️"}</div>
            <div style={{display:"flex",gap:12,marginBottom:16}}>
              {[["Person 1",p1],["Person 2",p2]].map(([name,val],i)=>(
                <div key={i} style={{background:i===0?"rgba(255,107,157,0.1)":"rgba(108,99,255,0.1)",border:`1px solid ${i===0?"#FF6B9D44":"#6C63FF44"}`,borderRadius:16,padding:"14px 16px",flex:1}}>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>{name}</div>
                  <div style={{color:val==="agree"?"#00E676":"#FF4458",fontSize:14,fontWeight:800}}>{val==="agree"?"✅ Agrees":"❌ Disagrees"}</div>
                </div>
              ))}
            </div>
            <p style={{color:p1===p2?"#00E676":"#FFD700",fontWeight:700,fontSize:15,marginBottom:16}}>{p1===p2?"You're on the same page 🙌":"Oooh this could start something 👀"}</p>
            <button onTouchEnd={e=>{e.preventDefault();next();}} onClick={next} style={btnA("linear-gradient(135deg,#6C63FF,#00C9FF)")}>Next →</button>
          </div>
        )}
      </div>
    </GameShell>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function VibeCheck() {
  const [screen, setScreen] = useState("home");
  const [activeGame, setActiveGame] = useState(null);
  const [roomCode, setRoomCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [playerNum, setPlayerNum] = useState(null);
  const [deck, setDeck] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [matchCard, setMatchCard] = useState(null);
  const [otherDone, setOtherDone] = useState(false);
  const [partnerJoined, setPartnerJoined] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const unsubRef = useRef(null);
  const sound = useSound();
  const bg = "radial-gradient(ellipse at 30% 20%,#FF6B9D18 0%,transparent 50%),radial-gradient(ellipse at 70% 80%,#6C63FF18 0%,transparent 50%),#080810";

  // ── Real-time listener ──
  const startListening = useCallback((code, pNum, myDeck) => {
    if (unsubRef.current) unsubRef.current();
    unsubRef.current = listenRoom(code, (room) => {
      // Partner joined?
      if (pNum === 1 && room.p2Joined && !partnerJoined) {
        setPartnerJoined(true);
        setScreen("swipe");
      }
      // Check match
      const myLikes   = (pNum === 1 ? room.p1Likes : room.p2Likes) || {};
      const theirLikes = (pNum === 1 ? room.p2Likes : room.p1Likes) || {};
      const myLikeIds = Object.keys(myLikes).map(Number);
      const theirLikeIds = Object.keys(theirLikes).map(Number);
      const hitId = myLikeIds.find(id => theirLikeIds.includes(id));
      if (hitId) {
        const hit = myDeck.find(c => c.id === hitId);
        if (hit) { sound.match(); setMatchCard(hit); setScreen("match"); if(unsubRef.current)unsubRef.current(); return; }
      }
      // Partner done?
      const theirDone = pNum === 1 ? room.p2Done : room.p1Done;
      if (theirDone) setOtherDone(true);
    });
  }, [sound, partnerJoined]);

  useEffect(() => () => { if (unsubRef.current) unsubRef.current(); }, []);

  const doCreateRoom = async () => {
    sound.tap(); setLoading(true); setError("");
    try {
      await initFirebase();
      const code = genCode();
      const shuffled = shuffle(ALL_ACTIVITIES);
      await createRoom(code, { deck: shuffled, p1Likes:{}, p2Likes:{}, p2Joined:false, p1Done:false, p2Done:false, created: Date.now() });
      setRoomCode(code); setPlayerNum(1); setDeck(shuffled); setCardIndex(0);
      setScreen("wait");
      startListening(code, 1, shuffled);
    } catch(e) { setError("Couldn't create room. Check your connection."); }
    setLoading(false);
  };

  const doJoinRoom = async () => {
    sound.tap(); setLoading(true); setError("");
    const code = inputCode.trim().toUpperCase();
    if (code.length < 4) { setError("Enter the code your partner shared."); setLoading(false); return; }
    try {
      await initFirebase();
      const room = await getRoom(code);
      if (!room) { setError("Room not found. Check the code."); setLoading(false); return; }
      room.p2Joined = true;
      await updateRoom(code, room);
      const myDeck = room.deck;
      setRoomCode(code); setPlayerNum(2); setDeck(myDeck); setCardIndex(0);
      setScreen("swipe");
      startListening(code, 2, myDeck);
    } catch(e) { setError("Couldn't join room. Check your connection."); }
    setLoading(false);
  };

  const doSwipe = async (dir) => {
    const card = deck[cardIndex];
    if (dir === "yes") sound.yes(); else sound.no();
    try {
      const room = await getRoom(roomCode);
      if (!room) return;
      const key = playerNum === 1 ? "p1Likes" : "p2Likes";
      if (dir === "yes") { room[key] = room[key] || {}; room[key][card.id] = true; }
      const nextIndex = cardIndex + 1;
      const isDone = nextIndex >= deck.length;
      if (isDone) room[playerNum === 1 ? "p1Done" : "p2Done"] = true;
      await updateRoom(roomCode, room);
      if (isDone) setScreen("done");
      else setCardIndex(nextIndex);
    } catch(e) {}
  };

  const reset = async () => {
    if (unsubRef.current) unsubRef.current();
    if (roomCode) { try { await deleteRoom(roomCode); } catch(e){} }
    setScreen("home"); setRoomCode(""); setInputCode(""); setPlayerNum(null);
    setDeck([]); setCardIndex(0); setMatchCard(null); setOtherDone(false);
    setPartnerJoined(false); setError(""); setLoading(false);
  };

  // Game routing
  if (activeGame==="truth")      return <TruthOrDare onBack={()=>setActiveGame(null)}/>;
  if (activeGame==="knowme")     return <HowWellDoYouKnowMe onBack={()=>setActiveGame(null)}/>;
  if (activeGame==="never")      return <NeverHaveIEver onBack={()=>setActiveGame(null)}/>;
  if (activeGame==="thisorthat") return <ThisOrThat onBack={()=>setActiveGame(null)}/>;
  if (activeGame==="hottakes")   return <HotTakes onBack={()=>setActiveGame(null)}/>;

  return (
    <div style={{minHeight:"100vh",background:bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"-apple-system,'Inter','Segoe UI',sans-serif",padding:"32px 20px",position:"relative",overflow:"hidden",WebkitOverflowScrolling:"touch"}}>
      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        *{-webkit-tap-highlight-color:transparent;box-sizing:border-box}
        input,textarea{font-size:16px!important}
      `}</style>

      {!matchCard && (
        <div style={{position:"fixed",top:0,left:0,right:0,textAlign:"center",padding:"16px 0",zIndex:10,background:"rgba(8,8,16,0.85)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)"}}>
          <span style={{fontSize:20,fontWeight:900,letterSpacing:"-1px",background:"linear-gradient(135deg,#FF6B9D,#C850C0)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"shimmer 5s linear infinite"}}>✨ Vibe Check</span>
        </div>
      )}

      <div style={{paddingTop:64,width:"100%",display:"flex",flexDirection:"column",alignItems:"center"}}>

        {/* HOME */}
        {screen==="home" && !matchCard && (
          <div style={{textAlign:"center",animation:"slideUp 0.5s ease both",maxWidth:380,width:"100%"}}>
            <div style={{fontSize:60,marginBottom:8,animation:"pulse 2.5s ease infinite"}}>✨</div>
            <h1 style={{fontSize:"clamp(48px,12vw,72px)",fontWeight:900,letterSpacing:"-4px",margin:"0 0 12px",lineHeight:.9,background:"linear-gradient(135deg,#FF6B9D,#C850C0,#4158D0,#00C9FF)",backgroundSize:"300% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"shimmer 5s linear infinite"}}>Vibe<br/>Check</h1>
            <p style={{fontSize:15,color:"rgba(255,255,255,0.4)",marginBottom:36,lineHeight:1.7}}>Both swipe yes on the same thing<br/>and tonight is decided. No debates.</p>
            <button onTouchEnd={e=>{e.preventDefault();doCreateRoom();}} onClick={doCreateRoom} style={btnP} disabled={loading}>{loading?"Creating…":"🎯 Create a room"}</button>
            <button onTouchEnd={e=>{e.preventDefault();sound.tap();setScreen("join");}} onClick={()=>{sound.tap();setScreen("join");}} style={btnS}>Join with a code</button>
            <button onTouchEnd={e=>{e.preventDefault();sound.tap();setScreen("games");}} onClick={()=>{sound.tap();setScreen("games");}} style={{...btnS,color:"rgba(255,255,255,0.5)"}}>🎮 Couples games</button>
            {error && <p style={{color:"#FF4458",fontSize:13,marginTop:8}}>{error}</p>}
          </div>
        )}

        {/* JOIN */}
        {screen==="join" && (
          <div style={{textAlign:"center",animation:"slideUp 0.4s ease both",maxWidth:360,width:"100%"}}>
            <h2 style={{fontSize:26,fontWeight:900,color:"#fff",marginBottom:10}}>Enter room code</h2>
            <p style={{color:"rgba(255,255,255,0.4)",fontSize:14,marginBottom:24}}>Ask your partner for their code</p>
            <input value={inputCode} onChange={e=>setInputCode(e.target.value.toUpperCase())} maxLength={6} placeholder="AB12C"
              style={{width:"100%",padding:"18px 24px",fontSize:28,fontWeight:900,textAlign:"center",letterSpacing:6,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:18,color:"#fff",marginBottom:8,outline:"none",WebkitAppearance:"none"}}/>
            {error && <p style={{color:"#FF4458",fontSize:13,marginBottom:8}}>{error}</p>}
            <button onTouchEnd={e=>{e.preventDefault();doJoinRoom();}} onClick={doJoinRoom} style={{...btnP,marginTop:12}} disabled={loading}>{loading?"Joining…":"Join →"}</button>
            <button onTouchEnd={e=>{e.preventDefault();setError("");setScreen("home");}} onClick={()=>{setError("");setScreen("home");}} style={btnS}>← Back</button>
          </div>
        )}

        {/* WAIT FOR PARTNER */}
        {screen==="wait" && (
          <div style={{textAlign:"center",animation:"slideUp 0.4s ease both",maxWidth:360,width:"100%"}}>
            <div style={{fontSize:44,marginBottom:14,animation:"spin 3s linear infinite"}}>🔗</div>
            <h2 style={{fontSize:24,fontWeight:900,color:"#fff",marginBottom:8}}>Room created!</h2>
            <p style={{color:"rgba(255,255,255,0.45)",fontSize:15,marginBottom:24,lineHeight:1.7}}>Share this code with your partner</p>
            <div style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:20,padding:"24px 32px",marginBottom:24}}>
              <div style={{fontSize:40,fontWeight:900,letterSpacing:8,background:"linear-gradient(135deg,#FF6B9D,#C850C0)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{roomCode}</div>
              <p style={{color:"rgba(255,255,255,0.3)",fontSize:12,marginTop:6,letterSpacing:1,textTransform:"uppercase"}}>Room code</p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,justifyContent:"center",color:"rgba(255,255,255,0.3)",fontSize:14,marginBottom:24}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:"#FFD700",animation:"pulse 1.2s ease infinite"}}/>
              Waiting for your partner to join…
            </div>
            <button onTouchEnd={e=>{e.preventDefault();reset();}} onClick={reset} style={btnS}>Cancel</button>
          </div>
        )}

        {/* SWIPING */}
        {screen==="swipe" && deck.length>0 && cardIndex<deck.length && !matchCard && (
          <div style={{width:"100%",maxWidth:400,animation:"slideUp 0.4s ease both"}}>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{display:"inline-block",fontSize:10,fontWeight:800,letterSpacing:3,textTransform:"uppercase",color:playerNum===1?"#FF6B9D":"#00C9FF",border:`1px solid ${playerNum===1?"#FF6B9D44":"#00C9FF44"}`,borderRadius:50,padding:"5px 16px",marginBottom:10}}>
                {playerNum===1?"Person 1":"Person 2"}
              </div>
              <h2 style={{fontSize:20,fontWeight:900,color:"#fff",margin:"0 0 4px"}}>Swipe on what sounds good</h2>
              <p style={{fontSize:12,color:"rgba(255,255,255,0.3)",margin:0}}>
                {deck.length-cardIndex} left · {otherDone?"🟢 Partner finished":"⏳ Partner is swiping…"}
              </p>
            </div>
            <div style={{position:"relative",height:290,width:"100%"}}>
              <SwipeCard activity={deck[cardIndex]} onSwipe={doSwipe}/>
              {cardIndex+1<deck.length&&<div style={{position:"absolute",width:"100%",transform:"scale(0.95) translateY(10px)",zIndex:1}}><div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:28,height:240}}/></div>}
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:24,marginTop:20}}>
              <button onTouchEnd={e=>{e.preventDefault();doSwipe("no");}} onClick={()=>doSwipe("no")} style={{width:64,height:64,borderRadius:"50%",background:"rgba(255,68,88,0.12)",border:"2px solid rgba(255,68,88,0.35)",fontSize:24,cursor:"pointer",color:"#FF4458",display:"flex",alignItems:"center",justifyContent:"center",WebkitAppearance:"none",touchAction:"manipulation"}}>✕</button>
              <button onTouchEnd={e=>{e.preventDefault();doSwipe("yes");}} onClick={()=>doSwipe("yes")} style={{width:64,height:64,borderRadius:"50%",background:"rgba(0,230,118,0.12)",border:"2px solid rgba(0,230,118,0.35)",fontSize:24,cursor:"pointer",color:"#00E676",display:"flex",alignItems:"center",justifyContent:"center",WebkitAppearance:"none",touchAction:"manipulation"}}>♥</button>
            </div>
            <button onTouchEnd={e=>{e.preventDefault();reset();}} onClick={reset} style={{...btnS,marginTop:20,padding:"12px"}}>← Leave room</button>
          </div>
        )}

        {/* DONE — no match yet */}
        {screen==="done" && !matchCard && (
          <div style={{textAlign:"center",animation:"slideUp 0.4s ease both",maxWidth:340}}>
            <div style={{fontSize:50,marginBottom:14,animation:"pulse 1.5s ease infinite"}}>⏳</div>
            <h2 style={{fontSize:24,fontWeight:900,color:"#fff",marginBottom:10}}>You're done swiping!</h2>
            <p style={{color:"rgba(255,255,255,0.4)",fontSize:15,lineHeight:1.7,marginBottom:28}}>
              {otherDone?"No match this round. Try again?":"Waiting for your partner to finish…"}
            </p>
            {otherDone&&<button onTouchEnd={e=>{e.preventDefault();reset();}} onClick={reset} style={btnP}>Try again</button>}
          </div>
        )}

        {/* GAMES */}
        {screen==="games" && (
          <div style={{animation:"slideUp 0.4s ease both",maxWidth:420,width:"100%"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
              <button onTouchEnd={e=>{e.preventDefault();sound.tap();setScreen("home");}} onClick={()=>{sound.tap();setScreen("home");}} style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:50,minWidth:44,height:44,color:"rgba(255,255,255,0.7)",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",WebkitAppearance:"none",touchAction:"manipulation"}}>←</button>
              <h2 style={{fontSize:22,fontWeight:900,color:"#fff",margin:0}}>Couples Games</h2>
            </div>
            {[
              {key:"truth",emoji:"🎴",title:"Truth or Dare",desc:"Spicy questions & wild dares"},
              {key:"knowme",emoji:"🧠",title:"How Well Do You Know Me?",desc:"Answer about yourself — they guess"},
              {key:"never",emoji:"🍹",title:"Never Have I Ever",desc:"Find out what you've both been up to"},
              {key:"thisorthat",emoji:"⚡",title:"This or That",desc:"Rapid fire — how in sync are you?"},
              {key:"hottakes",emoji:"🌶️",title:"Hot Takes",desc:"Agree or disagree on spicy opinions"},
            ].map(g=>(
              <button key={g.key} onTouchEnd={e=>{e.preventDefault();sound.tap();setActiveGame(g.key);}} onClick={()=>{sound.tap();setActiveGame(g.key);}} style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:20,padding:"18px 20px",display:"flex",alignItems:"center",gap:16,cursor:"pointer",color:"#fff",marginBottom:10,textAlign:"left",WebkitAppearance:"none",touchAction:"manipulation"}}>
                <span style={{fontSize:30}}>{g.emoji}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:16}}>{g.title}</div>
                  <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginTop:2}}>{g.desc}</div>
                </div>
                <span style={{color:"rgba(255,255,255,0.3)",fontSize:18}}>→</span>
              </button>
            ))}
          </div>
        )}

        {matchCard && <MatchScreen activity={matchCard} onReset={reset}/>}
      </div>
    </div>
  );
}
