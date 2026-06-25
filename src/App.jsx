import { useState, useRef, useEffect, useCallback } from "react";

// ─── Firebase ─────────────────────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAfeFD0wXJhKsMvjZOAJULkTaTAZvu9uTw",
  authDomain: "vibe-check-1315d.firebaseapp.com",
  databaseURL: "https://vibe-check-1315d-default-rtdb.firebaseio.com",
  projectId: "vibe-check-1315d",
  storageBucket: "vibe-check-1315d.firebasestorage.app",
  messagingSenderId: "630598049701",
  appId: "1:630598049701:web:9a76ca0cf986ddb30ad24c",
};

let db = null, firebaseRef, firebaseSet, firebaseGet, firebaseOnValue, firebaseOff, firebaseRemove;

async function initFirebase() {
  if (db) return true;
  try {
    const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getDatabase, ref, set, get, onValue, off, remove } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
    const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    db = getDatabase(app);
    firebaseRef = ref; firebaseSet = set; firebaseGet = get;
    firebaseOnValue = onValue; firebaseOff = off; firebaseRemove = remove;
    return true;
  } catch(e) { return false; }
}

const rRef = code => firebaseRef(db, `rooms/${code}`);
const pRef = pairId => firebaseRef(db, `pairs/${pairId}`);

async function createRoom(code, data) { await initFirebase(); await firebaseSet(rRef(code), data); }
async function getRoom(code) { await initFirebase(); const s = await firebaseGet(rRef(code)); return s.exists() ? s.val() : null; }
async function updateRoom(code, data) { await initFirebase(); await firebaseSet(rRef(code), data); }
async function deleteRoom(code) { await initFirebase(); try { await firebaseRemove(rRef(code)); } catch(e){} }
function listenRoom(code, cb) { const r = rRef(code); firebaseOnValue(r, s => { if(s.exists()) cb(s.val()); }); return () => firebaseOff(r); }

async function getPair(pairId) { await initFirebase(); const s = await firebaseGet(pRef(pairId)); return s.exists() ? s.val() : { history:[], compatibility:0 }; }
async function updatePair(pairId, data) { await initFirebase(); await firebaseSet(pRef(pairId), data); }
function listenPair(pairId, cb) { const r = pRef(pairId); firebaseOnValue(r, s => { if(s.exists()) cb(s.val()); }); return () => firebaseOff(r); }

// ─── Data ─────────────────────────────────────────────────────────────────────
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
  "What's my go-to comfort food?","What's my biggest pet peeve?",
  "What's my dream vacation destination?","What was my favorite subject in school?",
  "What's the first thing I do when I wake up?","What's my love language?",
  "What's a movie I could watch over and over?","What am I most scared of?",
  "What's my biggest goal right now?","What always makes me laugh no matter what?",
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
  "Pineapple belongs on pizza","Long distance relationships never work",
  "Social media ruins relationships","The person who earns more should pay more on dates",
  "It's okay to look through your partner's phone","Couples should have separate friend groups",
  "Jealousy is a sign of love","Everyone has a type and never really changes it",
  "You should never go to bed angry","Moving in together before marriage is smarter",
  "Couples that post a lot online are usually unhappy","Having a work wife/husband is harmless",
];

const COMPAT_LABELS = [
  { min:90, label:"Literally the same person 🥹", color:"#FF2D78" },
  { min:75, label:"Deeply in sync 💞", color:"#FF2D78" },
  { min:60, label:"Pretty solid duo ⚡", color:"#00F5FF" },
  { min:40, label:"Still figuring each other out 👀", color:"#00F5FF" },
  { min:0,  label:"Opposites attract? 😅", color:"#a855f7" },
];

function getCompatLabel(score) {
  return COMPAT_LABELS.find(l => score >= l.min) || COMPAT_LABELS[COMPAT_LABELS.length-1];
}

function calcCompatibility(history) {
  if (!history || history.length === 0) return 0;
  const avgRating = history.reduce((s,h) => s + ((h.p1Rating||3)+(h.p2Rating||3))/2, 0) / history.length;
  const matchBonus = Math.min(history.length * 2, 30);
  const ratingScore = ((avgRating - 1) / 4) * 70;
  return Math.min(Math.round(ratingScore + matchBonus), 99);
}

function shuffle(arr) {
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
function genCode() { return Math.random().toString(36).substring(2,7).toUpperCase(); }

// ─── Sound ────────────────────────────────────────────────────────────────────
function useSound() {
  const ctx = useRef(null);
  const go = () => {
    if(!ctx.current) ctx.current = new (window.AudioContext||window.webkitAudioContext)();
    if(ctx.current.state==="suspended") ctx.current.resume();
    return ctx.current;
  };
  const tone = (freq,type,dur,vol,delay=0) => {
    try {
      const ac=go(),o=ac.createOscillator(),g=ac.createGain();
      o.connect(g);g.connect(ac.destination);
      o.frequency.value=freq;o.type=type;
      g.gain.setValueAtTime(0,ac.currentTime+delay);
      g.gain.linearRampToValueAtTime(vol,ac.currentTime+delay+0.02);
      g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+delay+dur);
      o.start(ac.currentTime+delay);o.stop(ac.currentTime+delay+dur);
    } catch(e){}
  };
  return {
    yes:   ()=>{ tone(523,"sine",0.15,0.07); tone(659,"sine",0.15,0.06,0.08); },
    no:    ()=>tone(200,"sine",0.12,0.05),
    match: ()=>[523,659,784,1047,1319].forEach((f,i)=>tone(f,"triangle",0.5,0.07,i*0.07)),
    tap:   ()=>tone(440,"sine",0.08,0.04),
    pop:   ()=>tone(600,"sine",0.1,0.06),
    star:  ()=>tone(880,"sine",0.12,0.06),
  };
}

// ─── Neon Design Tokens ───────────────────────────────────────────────────────
const N = {
  pink:   "#FF2D78",
  cyan:   "#00F5FF",
  purple: "#a855f7",
  bg:     "#050508",
  card:   "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  text:   "#fff",
  muted:  "rgba(255,255,255,0.4)",
  dim:    "rgba(255,255,255,0.15)",
};

const glow = (color, size=40) => `0 0 ${size}px ${color}66, 0 0 ${size*2}px ${color}22`;

// ─── Neon Button ──────────────────────────────────────────────────────────────
function NeonBtn({ children, onClick, color=N.pink, secondary=false, style={}, disabled=false }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onTouchStart={()=>setPressed(true)} onTouchEnd={e=>{setPressed(false);e.preventDefault();if(!disabled)onClick();}}
      onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)}
      onClick={()=>{ if(!disabled) onClick(); }}
      disabled={disabled}
      style={{
        width:"100%", border:"none", borderRadius:16, padding:"18px",
        fontSize:16, fontWeight:800, cursor:"pointer",
        letterSpacing:"0.5px", marginBottom:12,
        WebkitAppearance:"none", touchAction:"manipulation",
        transition:"all 0.15s",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        background: secondary
          ? "transparent"
          : `linear-gradient(135deg, ${color}, ${color}cc)`,
        color: secondary ? N.muted : "#000",
        boxShadow: secondary ? "none" : (pressed ? "none" : glow(color, 20)),
        border: secondary ? `1px solid ${N.border}` : "none",
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >{children}</button>
  );
}

// ─── Neon Card ────────────────────────────────────────────────────────────────
function NeonCard({ children, glowColor, style={} }) {
  return (
    <div style={{
      background: N.card,
      border: `1px solid ${glowColor ? glowColor+"44" : N.border}`,
      borderRadius: 24,
      padding: "24px 20px",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      boxShadow: glowColor ? glow(glowColor, 15) : "none",
      ...style,
    }}>{children}</div>
  );
}

// ─── Swipe Card ───────────────────────────────────────────────────────────────
function SwipeCard({ activity, onSwipe }) {
  const startX=useRef(0), dragging=useRef(false);
  const [offset,setOffset]=useState(0), [lbl,setLbl]=useState(null);
  const start=x=>{dragging.current=true;startX.current=x;};
  const move=x=>{if(!dragging.current)return;const d=x-startX.current;setOffset(d);setLbl(d>50?"yes":d<-50?"no":null);};
  const end=()=>{if(!dragging.current)return;dragging.current=false;if(offset>90)onSwipe("yes");else if(offset<-90)onSwipe("no");else{setOffset(0);setLbl(null);}};
  return (
    <div
      onMouseDown={e=>start(e.clientX)} onMouseMove={e=>{if(dragging.current)move(e.clientX);}} onMouseUp={end} onMouseLeave={end}
      onTouchStart={e=>{e.preventDefault();start(e.touches[0].clientX);}}
      onTouchMove={e=>{e.preventDefault();move(e.touches[0].clientX);}}
      onTouchEnd={e=>{e.preventDefault();end();}}
      style={{position:"absolute",width:"100%",userSelect:"none",touchAction:"none",cursor:"grab",transform:`translateX(${offset}px) rotate(${offset/18}deg)`,transition:dragging.current?"none":"transform 0.35s cubic-bezier(.34,1.56,.64,1)",zIndex:10}}
    >
      <div style={{
        background:"linear-gradient(135deg, rgba(255,45,120,0.08), rgba(0,245,255,0.05))",
        border: lbl==="yes" ? `2px solid ${N.cyan}` : lbl==="no" ? `2px solid ${N.pink}` : `1px solid ${N.border}`,
        borderRadius:28, padding:"40px 24px", textAlign:"center",
        minHeight:270, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", position:"relative",
        boxShadow: lbl==="yes" ? glow(N.cyan,20) : lbl==="no" ? glow(N.pink,20) : "none",
        transition:"border 0.1s, box-shadow 0.1s",
      }}>
        {lbl==="yes"&&<div style={{position:"absolute",top:20,left:20,border:`2px solid ${N.cyan}`,borderRadius:8,color:N.cyan,fontWeight:900,fontSize:18,padding:"3px 12px",letterSpacing:2,transform:"rotate(-15deg)",opacity:Math.min(1,Math.abs(offset)/90),textShadow:`0 0 10px ${N.cyan}`}}>YES</div>}
        {lbl==="no"&&<div style={{position:"absolute",top:20,right:20,border:`2px solid ${N.pink}`,borderRadius:8,color:N.pink,fontWeight:900,fontSize:18,padding:"3px 12px",letterSpacing:2,transform:"rotate(15deg)",opacity:Math.min(1,Math.abs(offset)/90),textShadow:`0 0 10px ${N.pink}`}}>NOPE</div>}
        <div style={{fontSize:64,marginBottom:16,lineHeight:1,filter:"drop-shadow(0 0 20px rgba(255,255,255,0.3))"}}>{activity.emoji}</div>
        <h2 style={{fontSize:22,fontWeight:900,color:N.text,margin:"0 0 10px",letterSpacing:"-0.5px"}}>{activity.label}</h2>
        <p style={{fontSize:14,color:N.muted,lineHeight:1.6,margin:0,maxWidth:220}}>{activity.desc}</p>
      </div>
    </div>
  );
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ value, onChange, size=36 }) {
  return (
    <div style={{display:"flex",gap:8,justifyContent:"center"}}>
      {[1,2,3,4,5].map(s=>(
        <button key={s}
          onTouchEnd={e=>{e.preventDefault();onChange(s);}}
          onClick={()=>onChange(s)}
          style={{fontSize:size,background:"none",border:"none",cursor:"pointer",
            filter:s<=value?`drop-shadow(0 0 8px ${N.pink})`:"none",
            opacity:s<=value?1:0.25, transition:"all 0.15s",
            WebkitAppearance:"none",touchAction:"manipulation",
          }}
        >{s<=value?"⭐":"☆"}</button>
      ))}
    </div>
  );
}

// ─── Rating Screen ────────────────────────────────────────────────────────────
function RatingScreen({ activity, playerNum, pairId, roomCode, onDone }) {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [bothDone, setBothDone] = useState(false);
  const [finalData, setFinalData] = useState(null);
  const sound = useSound();
  const unsubRef = useRef(null);

  const submit = async () => {
    if (rating === 0) return;
    sound.star();
    setSubmitted(true);
    setWaiting(true);

    // Save rating to room
    const room = await getRoom(roomCode);
    if (room) {
      const key = playerNum === 1 ? "p1Rating" : "p2Rating";
      room[key] = rating;
      await updateRoom(roomCode, room);
    }

    // Listen for both ratings
    unsubRef.current = listenRoom(roomCode, async (room) => {
      if (room.p1Rating && room.p2Rating) {
        // Both submitted — save to pair history
        const pair = await getPair(pairId);
        const entry = {
          activity: activity.label,
          emoji: activity.emoji,
          date: new Date().toLocaleDateString("en-US", { month:"short", day:"numeric" }),
          p1Rating: room.p1Rating,
          p2Rating: room.p2Rating,
          avgRating: ((room.p1Rating + room.p2Rating) / 2).toFixed(1),
        };
        const history = [...(pair.history || []), entry];
        const compatibility = calcCompatibility(history);
        await updatePair(pairId, { history, compatibility });
        setFinalData({ entry, compatibility, history });
        setBothDone(true);
        if (unsubRef.current) unsubRef.current();
      }
    });
  };

  useEffect(() => () => { if(unsubRef.current) unsubRef.current(); }, []);

  if (bothDone && finalData) {
    const { entry, compatibility, history } = finalData;
    const compat = getCompatLabel(compatibility);
    return (
      <div style={{position:"fixed",inset:0,zIndex:300,background:N.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px",overflowY:"auto"}}>
        <div style={{width:"100%",maxWidth:400,textAlign:"center",animation:"popIn 0.5s cubic-bezier(.34,1.56,.64,1) both"}}>
          {/* Compatibility Card — this is the screenshot moment */}
          <div style={{
            background:"linear-gradient(135deg, rgba(255,45,120,0.15), rgba(0,245,255,0.1))",
            border:`1px solid ${N.pink}44`,
            borderRadius:28, padding:"36px 28px", marginBottom:20,
            boxShadow:`${glow(N.pink,20)}, ${glow(N.cyan,15)}`,
          }}>
            <div style={{fontSize:11,color:N.pink,letterSpacing:3,textTransform:"uppercase",marginBottom:16,fontWeight:800}}>Vibe Check · {entry.date}</div>
            <div style={{fontSize:48,marginBottom:8}}>{entry.emoji}</div>
            <div style={{fontSize:20,fontWeight:900,color:N.text,marginBottom:20}}>{entry.activity}</div>

            {/* Ratings */}
            <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:24}}>
              {[["You",entry.p1Rating],["Them",entry.p2Rating]].map(([name,r],i)=>(
                <div key={i} style={{background:"rgba(255,255,255,0.05)",borderRadius:16,padding:"12px 20px",flex:1}}>
                  <div style={{fontSize:11,color:N.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>{name}</div>
                  <div style={{fontSize:22}}>{"⭐".repeat(r)}</div>
                </div>
              ))}
            </div>

            {/* Compatibility score */}
            <div style={{borderTop:`1px solid ${N.border}`,paddingTop:20}}>
              <div style={{fontSize:11,color:N.muted,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Compatibility</div>
              <div style={{
                fontSize:56,fontWeight:900,letterSpacing:"-3px",
                background:`linear-gradient(135deg, ${N.pink}, ${N.cyan})`,
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
                marginBottom:4,
              }}>{compatibility}%</div>
              <div style={{fontSize:15,color:compat.color,fontWeight:700}}>{compat.label}</div>
              <div style={{fontSize:12,color:N.dim,marginTop:8}}>{history.length} night{history.length!==1?"s":""} together</div>
            </div>
          </div>

          <p style={{color:N.muted,fontSize:13,marginBottom:24}}>Screenshot this and flex on the timeline 📸</p>
          <NeonBtn onClick={onDone} color={N.pink}>Back to home ✨</NeonBtn>
        </div>
      </div>
    );
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:N.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px"}}>
      <div style={{width:"100%",maxWidth:400,textAlign:"center"}}>
        {!submitted ? (
          <>
            <div style={{fontSize:52,marginBottom:12}}>{activity.emoji}</div>
            <h2 style={{fontSize:26,fontWeight:900,color:N.text,marginBottom:6}}>How was tonight?</h2>
            <p style={{color:N.muted,fontSize:15,marginBottom:32,lineHeight:1.6}}>{activity.label}</p>
            <StarRating value={rating} onChange={r=>{sound.star();setRating(r);}} size={44}/>
            <div style={{marginTop:32}}>
              <NeonBtn onClick={submit} color={N.pink} disabled={rating===0}>Submit my rating →</NeonBtn>
            </div>
          </>
        ) : (
          <>
            <div style={{fontSize:52,marginBottom:16,animation:"pulse 1.5s ease infinite"}}>⏳</div>
            <h2 style={{fontSize:22,fontWeight:900,color:N.text,marginBottom:8}}>Rating submitted!</h2>
            <p style={{color:N.muted,fontSize:15}}>Waiting for your partner to rate…</p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Match Screen ─────────────────────────────────────────────────────────────
function MatchScreen({ activity, onRate }) {
  const dots = Array.from({length:18},(_,i)=>({
    color:[N.pink,N.cyan,"#FFD700",N.purple,"#00FF88","#FF6B35"][i%6],
    left:Math.random()*100,top:Math.random()*100,
    dx:(Math.random()-.5)*280,dy:(Math.random()-.5)*280,
  }));
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"#020205",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",textAlign:"center",overflowY:"auto"}}>
      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes popIn{from{opacity:0;transform:scale(0.7)}to{opacity:1;transform:scale(1)}}
        @keyframes titleBounce{0%{transform:scale(0)}60%{transform:scale(1.1)}100%{transform:scale(1)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes neonPulse{0%,100%{opacity:1}50%{opacity:0.6}}
        ${dots.map((_,i)=>`@keyframes cd${i}{from{transform:translate(0,0) scale(0);opacity:0}to{transform:translate(${dots[i].dx}px,${dots[i].dy}px) scale(1);opacity:.9}}`).join("")}
      `}</style>
      {dots.map((d,i)=><div key={i} style={{position:"fixed",width:10,height:10,borderRadius:"50%",background:d.color,boxShadow:`0 0 6px ${d.color}`,left:`${d.left}%`,top:`${d.top}%`,animation:`cd${i} ${0.8+Math.random()*0.6}s ease-out both`,pointerEvents:"none"}}/>)}
      <div style={{animation:"popIn 0.6s cubic-bezier(.34,1.56,.64,1) both",position:"relative",zIndex:1,width:"100%",maxWidth:400}}>
        <div style={{fontSize:68,marginBottom:8,filter:`drop-shadow(0 0 20px ${N.pink})`}}>🎯</div>
        <div style={{
          fontSize:"clamp(40px,11vw,60px)",fontWeight:900,letterSpacing:"-3px",lineHeight:.95,
          background:`linear-gradient(135deg, ${N.pink}, ${N.cyan})`,
          backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
          animation:"titleBounce 0.7s cubic-bezier(.34,1.56,.64,1) .2s both,shimmer 4s linear infinite",
          marginBottom:8,textShadow:"none",
        }}>TONIGHT'S<br/>THE MOVE</div>

        <div style={{
          background:"linear-gradient(135deg,rgba(255,45,120,0.12),rgba(0,245,255,0.08))",
          border:`1px solid ${N.pink}44`,
          borderRadius:24,padding:"28px 24px",margin:"24px 0",
          boxShadow:glow(N.pink,15),
          animation:"popIn 0.5s cubic-bezier(.34,1.56,.64,1) .4s both",
        }}>
          <div style={{fontSize:52,marginBottom:12,filter:`drop-shadow(0 0 12px rgba(255,255,255,0.4))`}}>{activity.emoji}</div>
          <div style={{fontSize:22,fontWeight:900,color:N.text,marginBottom:8}}>{activity.label}</div>
          <div style={{fontSize:14,color:N.muted,lineHeight:1.6}}>{activity.desc}</div>
        </div>

        <p style={{color:N.dim,fontSize:13,marginBottom:24}}>You both swiped yes ✓</p>
        <NeonBtn onClick={onRate} color={N.pink}>Rate tonight ⭐</NeonBtn>
      </div>
    </div>
  );
}

// ─── History Screen ───────────────────────────────────────────────────────────
function HistoryScreen({ pairId, onBack }) {
  const [pair, setPair] = useState(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    initFirebase().then(() => {
      unsubRef.current = listenPair(pairId, setPair);
    });
    return () => { if(unsubRef.current) unsubRef.current(); };
  }, [pairId]);

  const compatibility = pair ? pair.compatibility || 0 : 0;
  const history = pair ? [...(pair.history||[])].reverse() : [];
  const compat = getCompatLabel(compatibility);

  return (
    <div style={{minHeight:"100vh",background:N.bg,padding:"80px 20px 32px",fontFamily:"-apple-system,'Inter',sans-serif"}}>
      <div style={{maxWidth:440,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
          <button onTouchEnd={e=>{e.preventDefault();onBack();}} onClick={onBack}
            style={{background:N.card,border:`1px solid ${N.border}`,borderRadius:50,minWidth:44,height:44,color:N.muted,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",WebkitAppearance:"none",touchAction:"manipulation"}}>←</button>
          <div>
            <div style={{fontSize:11,color:N.pink,textTransform:"uppercase",letterSpacing:2,fontWeight:800}}>Your Story</div>
            <div style={{fontSize:20,fontWeight:900,color:N.text}}>Date History</div>
          </div>
        </div>

        {/* Big compatibility score */}
        <NeonCard glowColor={N.pink} style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:11,color:N.muted,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>Compatibility Score</div>
          <div style={{
            fontSize:72,fontWeight:900,letterSpacing:"-4px",
            background:`linear-gradient(135deg,${N.pink},${N.cyan})`,
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
            marginBottom:6,
          }}>{compatibility}%</div>
          <div style={{fontSize:16,color:compat.color,fontWeight:700,marginBottom:4}}>{compat.label}</div>
          <div style={{fontSize:12,color:N.dim}}>{history.length} date night{history.length!==1?"s":""} logged</div>
        </NeonCard>

        {/* History list */}
        {history.length === 0 ? (
          <div style={{textAlign:"center",padding:"40px 0"}}>
            <div style={{fontSize:48,marginBottom:12}}>🌙</div>
            <p style={{color:N.muted,fontSize:15,lineHeight:1.7}}>No date nights yet.<br/>Go find your first match!</p>
          </div>
        ) : (
          history.map((h,i) => (
            <NeonCard key={i} style={{marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{fontSize:36}}>{h.emoji}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:16,color:N.text}}>{h.activity}</div>
                  <div style={{fontSize:12,color:N.muted,marginTop:2}}>{h.date}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:16}}>{"⭐".repeat(Math.round(h.avgRating))}</div>
                  <div style={{fontSize:11,color:N.dim,marginTop:2}}>{h.avgRating}/5</div>
                </div>
              </div>
            </NeonCard>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Game Shell ───────────────────────────────────────────────────────────────
function GameShell({ title, emoji, onBack, children }) {
  return (
    <div style={{minHeight:"100vh",background:N.bg,padding:"80px 20px 32px",fontFamily:"-apple-system,'Inter',sans-serif"}}>
      <div style={{maxWidth:440,margin:"0 auto",animation:"slideUp 0.4s ease both"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
          <button onTouchEnd={e=>{e.preventDefault();onBack();}} onClick={onBack}
            style={{background:N.card,border:`1px solid ${N.border}`,borderRadius:50,minWidth:44,height:44,color:N.muted,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",WebkitAppearance:"none",touchAction:"manipulation"}}>←</button>
          <div>
            <div style={{fontSize:11,color:N.muted,textTransform:"uppercase",letterSpacing:1}}>Game</div>
            <div style={{fontSize:18,fontWeight:900,color:N.text}}>{emoji} {title}</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function TruthOrDare({ onBack }) {
  const sound=useSound(),[cards]=useState(()=>shuffle(TRUTH_OR_DARE)),[idx,setIdx]=useState(0),[flipped,setFlipped]=useState(false);
  const card=cards[idx%cards.length];
  return (
    <GameShell title="Truth or Dare" emoji="🎴" onBack={onBack}>
      <NeonCard glowColor={flipped?(card.type==="truth"?N.cyan:N.pink):null} style={{textAlign:"center",minHeight:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",marginBottom:16,touchAction:"manipulation"}}
        onClick={()=>{if(!flipped){sound.pop();setFlipped(true);}}}
      >
        {!flipped
          ?<><div style={{fontSize:44,marginBottom:12}}>👆</div><p style={{color:N.muted,fontSize:16,margin:0}}>Tap to reveal</p></>
          :<><div style={{fontSize:11,fontWeight:800,letterSpacing:3,textTransform:"uppercase",color:card.type==="truth"?N.cyan:N.pink,marginBottom:16,textShadow:`0 0 10px ${card.type==="truth"?N.cyan:N.pink}`}}>{card.type}</div><p style={{fontSize:18,fontWeight:700,color:N.text,lineHeight:1.6,margin:0}}>{card.text}</p></>
        }
      </NeonCard>
      {flipped&&<NeonBtn onClick={()=>{sound.tap();setIdx(i=>i+1);setFlipped(false);}} color={N.pink}>Next card →</NeonBtn>}
      {!flipped&&<p style={{textAlign:"center",color:N.dim,fontSize:12,marginTop:8}}>{cards.length} cards · shuffled</p>}
    </GameShell>
  );
}

function HowWellDoYouKnowMe({ onBack }) {
  const sound=useSound(),[phase,setPhase]=useState("pick"),[qIdx,setQIdx]=useState(0),[score,setScore]=useState(0),[p1Ans,setP1Ans]=useState(""),[p2Ans,setP2Ans]=useState(""),[matched,setMatched]=useState(null);
  const total=KNOW_ME_QUESTIONS.length,q=KNOW_ME_QUESTIONS[qIdx];
  const checkMatch=()=>{sound.tap();const a=p1Ans.trim().toLowerCase(),b=p2Ans.trim().toLowerCase();const hit=a===b||(b.length>2&&a.includes(b.substring(0,4)));if(hit)setScore(s=>s+1);setMatched(hit);setPhase("result");};
  const next=()=>{sound.tap();if(qIdx+1>=total){setPhase("done");return;}setQIdx(i=>i+1);setP1Ans("");setP2Ans("");setMatched(null);setPhase("p1answer");};
  return (
    <GameShell title="How Well Do You Know Me?" emoji="🧠" onBack={onBack}>
      {phase==="pick"&&<div style={{textAlign:"center"}}><p style={{color:N.muted,fontSize:15,lineHeight:1.7,marginBottom:28}}>One person answers about themselves. Their partner guesses. See how well you really know each other.</p><NeonBtn onClick={()=>{sound.tap();setPhase("p1answer");}} color={N.pink}>Let's go →</NeonBtn></div>}
      {phase==="p1answer"&&<div><div style={{textAlign:"center",marginBottom:20}}><div style={{fontSize:11,color:N.pink,letterSpacing:2,textTransform:"uppercase",marginBottom:8,textShadow:`0 0 8px ${N.pink}`}}>Person 1 — answer about yourself</div><div style={{fontSize:11,color:N.muted,marginBottom:8}}>Question {qIdx+1} of {total}</div><h3 style={{fontSize:20,fontWeight:900,color:N.text,margin:0,lineHeight:1.4}}>{q}</h3></div><textarea value={p1Ans} onChange={e=>setP1Ans(e.target.value)} placeholder="Type your answer…" rows={3} style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${N.border}`,borderRadius:16,padding:"16px",color:N.text,fontSize:16,resize:"none",outline:"none",marginBottom:12,WebkitAppearance:"none",boxSizing:"border-box",fontFamily:"-apple-system,sans-serif"}}/><p style={{color:N.dim,fontSize:12,textAlign:"center",marginBottom:12}}>Hand the phone to your partner 🔄</p><NeonBtn onClick={()=>{if(p1Ans.trim())setPhase("p2guess");}} color={N.pink}>Partner's turn →</NeonBtn></div>}
      {phase==="p2guess"&&<div><div style={{textAlign:"center",marginBottom:20}}><div style={{fontSize:11,color:N.cyan,letterSpacing:2,textTransform:"uppercase",marginBottom:8,textShadow:`0 0 8px ${N.cyan}`}}>Partner — what do you think they said?</div><h3 style={{fontSize:20,fontWeight:900,color:N.text,margin:0,lineHeight:1.4}}>{q}</h3></div><textarea value={p2Ans} onChange={e=>setP2Ans(e.target.value)} placeholder="Your guess…" rows={3} style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${N.border}`,borderRadius:16,padding:"16px",color:N.text,fontSize:16,resize:"none",outline:"none",marginBottom:12,WebkitAppearance:"none",boxSizing:"border-box",fontFamily:"-apple-system,sans-serif"}}/><NeonBtn onClick={()=>{if(p2Ans.trim())checkMatch();}} color={N.cyan}>Reveal →</NeonBtn></div>}
      {phase==="result"&&<div style={{textAlign:"center"}}><div style={{fontSize:52,marginBottom:12}}>{matched?"🎉":"😬"}</div><h3 style={{fontSize:22,fontWeight:900,color:matched?N.cyan:N.pink,marginBottom:16}}>{matched?"Match!":"Not quite"}</h3><NeonCard style={{textAlign:"left",marginBottom:10}}><div style={{fontSize:11,color:N.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Their answer</div><div style={{color:N.text,fontSize:16,fontWeight:700}}>{p1Ans}</div></NeonCard><NeonCard style={{textAlign:"left",marginBottom:16}}><div style={{fontSize:11,color:N.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Your guess</div><div style={{color:N.text,fontSize:16,fontWeight:700}}>{p2Ans}</div></NeonCard><div style={{color:N.muted,fontSize:13,marginBottom:16}}>Score: {score}/{qIdx+1}</div><NeonBtn onClick={next} color={N.pink}>{qIdx+1>=total?"See final score →":"Next question →"}</NeonBtn></div>}
      {phase==="done"&&<div style={{textAlign:"center"}}><div style={{fontSize:64,marginBottom:12}}>{score>=8?"🥰":score>=5?"😊":"😅"}</div><h2 style={{fontSize:30,fontWeight:900,color:N.text,marginBottom:8}}>{score}/{total}</h2><p style={{color:N.muted,fontSize:16,lineHeight:1.7,marginBottom:28}}>{score>=8?"You two are incredibly in sync 🥹":score>=5?"Pretty solid — still some mysteries 👀":"Room to grow. That's what this is for 😄"}</p><NeonBtn onClick={()=>{setPhase("pick");setQIdx(0);setScore(0);setP1Ans("");setP2Ans("");setMatched(null);}} color={N.pink}>Play again</NeonBtn></div>}
    </GameShell>
  );
}

function NeverHaveIEver({ onBack }) {
  const sound=useSound(),[cards]=useState(()=>shuffle(NEVER_HAVE_I_EVER)),[idx,setIdx]=useState(0),[p1,setP1]=useState(null),[p2,setP2]=useState(null),[revealed,setRevealed]=useState(false);
  const next=()=>{sound.tap();setIdx(i=>(i+1)%cards.length);setP1(null);setP2(null);setRevealed(false);};
  return (
    <GameShell title="Never Have I Ever" emoji="🍹" onBack={onBack}>
      <NeonCard style={{textAlign:"center",marginBottom:16}}><p style={{fontSize:17,fontWeight:700,color:N.text,lineHeight:1.6,margin:0}}>{cards[idx]}</p></NeonCard>
      {!revealed?(<>
        <p style={{textAlign:"center",color:N.muted,fontSize:12,marginBottom:12,textTransform:"uppercase",letterSpacing:1}}>Both pick secretly — reveal together</p>
        {[["Person 1",p1,setP1],["Person 2",p2,setP2]].map(([name,val,setVal],pi)=>(
          <div key={pi} style={{marginBottom:12}}>
            <p style={{color:N.muted,fontSize:13,marginBottom:8,textAlign:"center"}}>{name}</p>
            <div style={{display:"flex",gap:10}}>
              {["✅ I have","❌ Never"].map((label,vi)=>(
                <button key={vi} onTouchEnd={e=>{e.preventDefault();sound.pop();setVal(vi===0);}} onClick={()=>{sound.pop();setVal(vi===0);}}
                  style={{flex:1,padding:"14px 8px",borderRadius:16,border:val===(vi===0)?`2px solid ${vi===0?N.cyan:N.pink}`:`1px solid ${N.border}`,background:val===(vi===0)?(vi===0?"rgba(0,245,255,0.1)":"rgba(255,45,120,0.1)"):N.card,color:N.text,fontSize:14,fontWeight:700,cursor:"pointer",WebkitAppearance:"none",touchAction:"manipulation",boxShadow:val===(vi===0)?glow(vi===0?N.cyan:N.pink,10):"none"}}>{label}</button>
              ))}
            </div>
          </div>
        ))}
        {p1!==null&&p2!==null&&<NeonBtn onClick={()=>setRevealed(true)} color={N.pink} style={{marginTop:8}}>Reveal 👀</NeonBtn>}
      </>):(
        <div style={{textAlign:"center"}}>
          <div style={{display:"flex",gap:12,marginBottom:16,justifyContent:"center"}}>
            {[["Person 1",p1],["Person 2",p2]].map(([name,val],i)=>(
              <NeonCard key={i} glowColor={val?N.cyan:N.pink} style={{flex:1,textAlign:"center",padding:"16px 12px"}}>
                <div style={{fontSize:11,color:N.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>{name}</div>
                <div style={{fontSize:22}}>{val?"✅":"❌"}</div>
                <div style={{color:N.text,fontSize:13,marginTop:4}}>{val?"I have":"Never"}</div>
              </NeonCard>
            ))}
          </div>
          <p style={{color:p1&&p2?"#FFD700":(!p1&&!p2)?N.cyan:N.pink,fontWeight:700,fontSize:15,marginBottom:16}}>{p1&&p2?"You've both done this 👀":(!p1&&!p2)?"Neither of you! Clean slates 😇":"Interesting… tell me more 🤭"}</p>
          <NeonBtn onClick={next} color={N.cyan}>Next card →</NeonBtn>
        </div>
      )}
    </GameShell>
  );
}

function ThisOrThat({ onBack }) {
  const sound=useSound(),[cards]=useState(()=>shuffle(THIS_OR_THAT)),[idx,setIdx]=useState(0),[p1,setP1]=useState(null),[p2,setP2]=useState(null),[revealed,setRevealed]=useState(false),[score,setScore]=useState({match:0,diff:0});
  const [a,b]=cards[idx];
  const reveal=()=>{sound.pop();if(p1===p2)setScore(s=>({...s,match:s.match+1}));else setScore(s=>({...s,diff:s.diff+1}));setRevealed(true);};
  const next=()=>{sound.tap();setIdx(i=>(i+1)%cards.length);setP1(null);setP2(null);setRevealed(false);};
  return (
    <GameShell title="This or That" emoji="⚡" onBack={onBack}>
      <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:16}}>
        <span style={{background:"rgba(0,245,255,0.1)",border:`1px solid ${N.cyan}44`,borderRadius:50,padding:"4px 12px",color:N.cyan,fontSize:12}}>✓ {score.match} matched</span>
        <span style={{background:"rgba(255,45,120,0.1)",border:`1px solid ${N.pink}44`,borderRadius:50,padding:"4px 12px",color:N.pink,fontSize:12}}>↔ {score.diff} different</span>
      </div>
      {!revealed?(<>
        <p style={{textAlign:"center",color:N.muted,fontSize:12,marginBottom:12,textTransform:"uppercase",letterSpacing:1}}>Pick secretly — reveal together</p>
        {[["Person 1",p1,setP1],["Person 2",p2,setP2]].map(([name,val,setVal],pi)=>(
          <div key={pi} style={{marginBottom:12}}>
            <p style={{color:N.muted,fontSize:13,marginBottom:8,textAlign:"center"}}>{name}</p>
            <div style={{display:"flex",gap:10}}>
              {[a,b].map((opt,vi)=>(
                <button key={vi} onTouchEnd={e=>{e.preventDefault();sound.pop();setVal(vi);}} onClick={()=>{sound.pop();setVal(vi);}}
                  style={{flex:1,padding:"18px 8px",borderRadius:18,border:val===vi?`2px solid ${vi===0?N.pink:N.cyan}`:`1px solid ${N.border}`,background:val===vi?(vi===0?"rgba(255,45,120,0.1)":"rgba(0,245,255,0.1)"):N.card,color:N.text,fontSize:15,fontWeight:700,cursor:"pointer",WebkitAppearance:"none",touchAction:"manipulation",boxShadow:val===vi?glow(vi===0?N.pink:N.cyan,10):"none"}}>{opt}</button>
              ))}
            </div>
          </div>
        ))}
        {p1!==null&&p2!==null&&<NeonBtn onClick={reveal} color={N.pink} style={{marginTop:8}}>Reveal 👀</NeonBtn>}
      </>):(
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:12}}>{p1===p2?"🎯":"😮"}</div>
          <div style={{display:"flex",gap:12,marginBottom:16}}>
            {[["Person 1",p1],["Person 2",p2]].map(([name,val],i)=>(
              <NeonCard key={i} glowColor={i===0?N.pink:N.cyan} style={{flex:1,textAlign:"center",padding:"14px 12px"}}>
                <div style={{fontSize:11,color:N.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>{name}</div>
                <div style={{color:N.text,fontSize:15,fontWeight:700}}>{val===0?a:b}</div>
              </NeonCard>
            ))}
          </div>
          <p style={{color:p1===p2?N.cyan:N.pink,fontWeight:700,fontSize:15,marginBottom:16}}>{p1===p2?"Same! You're aligned 🙌":"Different picks — talk about it 👀"}</p>
          <NeonBtn onClick={next} color={N.cyan}>Next →</NeonBtn>
        </div>
      )}
    </GameShell>
  );
}

function HotTakes({ onBack }) {
  const sound=useSound(),[cards]=useState(()=>shuffle(HOT_TAKES)),[idx,setIdx]=useState(0),[p1,setP1]=useState(null),[p2,setP2]=useState(null),[revealed,setRevealed]=useState(false);
  const next=()=>{sound.tap();setIdx(i=>(i+1)%cards.length);setP1(null);setP2(null);setRevealed(false);};
  return (
    <GameShell title="Hot Takes" emoji="🌶️" onBack={onBack}>
      <NeonCard style={{textAlign:"center",marginBottom:16}}><p style={{fontSize:18,fontWeight:800,color:N.text,lineHeight:1.5,margin:0}}>{cards[idx]}</p></NeonCard>
      {!revealed?(<>
        <p style={{textAlign:"center",color:N.muted,fontSize:12,marginBottom:12,textTransform:"uppercase",letterSpacing:1}}>Both pick secretly — reveal together</p>
        {[["Person 1",p1,setP1],["Person 2",p2,setP2]].map(([name,val,setVal],pi)=>(
          <div key={pi} style={{marginBottom:12}}>
            <p style={{color:N.muted,fontSize:13,marginBottom:8,textAlign:"center"}}>{name}</p>
            <div style={{display:"flex",gap:10}}>
              {["agree","disagree"].map((v,vi)=>(
                <button key={vi} onTouchEnd={e=>{e.preventDefault();sound.pop();setVal(v);}} onClick={()=>{sound.pop();setVal(v);}}
                  style={{flex:1,padding:"14px 8px",borderRadius:16,border:val===v?`2px solid ${v==="agree"?N.cyan:N.pink}`:`1px solid ${N.border}`,background:val===v?(v==="agree"?"rgba(0,245,255,0.1)":"rgba(255,45,120,0.1)"):N.card,color:N.text,fontSize:14,fontWeight:700,cursor:"pointer",WebkitAppearance:"none",touchAction:"manipulation",boxShadow:val===v?glow(v==="agree"?N.cyan:N.pink,10):"none"}}>{v==="agree"?"✅ Agree":"❌ Disagree"}</button>
              ))}
            </div>
          </div>
        ))}
        {p1&&p2&&<NeonBtn onClick={()=>setRevealed(true)} color={N.pink} style={{marginTop:8}}>Reveal 🌶️</NeonBtn>}
      </>):(
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:12}}>{p1===p2?"🤝":"⚔️"}</div>
          <div style={{display:"flex",gap:12,marginBottom:16}}>
            {[["Person 1",p1],["Person 2",p2]].map(([name,val],i)=>(
              <NeonCard key={i} glowColor={i===0?N.pink:N.cyan} style={{flex:1,textAlign:"center",padding:"14px 12px"}}>
                <div style={{fontSize:11,color:N.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>{name}</div>
                <div style={{color:val==="agree"?N.cyan:N.pink,fontSize:14,fontWeight:800}}>{val==="agree"?"✅ Agrees":"❌ Disagrees"}</div>
              </NeonCard>
            ))}
          </div>
          <p style={{color:p1===p2?N.cyan:"#FFD700",fontWeight:700,fontSize:15,marginBottom:16}}>{p1===p2?"You're on the same page 🙌":"Oooh this could start something 👀"}</p>
          <NeonBtn onClick={next} color={N.cyan}>Next →</NeonBtn>
        </div>
      )}
    </GameShell>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function VibeCheck() {
  const [screen, setScreen] = useState("home");
  const [activeGame, setActiveGame] = useState(null);
  const [roomCode, setRoomCode] = useState("");
  const [pairId, setPairId] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [inputPairId, setInputPairId] = useState("");
  const [playerNum, setPlayerNum] = useState(null);
  const [deck, setDeck] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [matchCard, setMatchCard] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [otherDone, setOtherDone] = useState(false);
  const [partnerJoined, setPartnerJoined] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const unsubRef = useRef(null);
  const sound = useSound();

  const startListening = useCallback((code, pNum, myDeck) => {
    if (unsubRef.current) unsubRef.current();
    unsubRef.current = listenRoom(code, (room) => {
      if (pNum===1 && room.p2Joined && !partnerJoined) { setPartnerJoined(true); setScreen("swipe"); }
      const myLikes = (pNum===1?room.p1Likes:room.p2Likes)||{};
      const theirLikes = (pNum===1?room.p2Likes:room.p1Likes)||{};
      const myIds = Object.keys(myLikes).map(Number);
      const theirIds = Object.keys(theirLikes).map(Number);
      const hitId = myIds.find(id=>theirIds.includes(id));
      if (hitId) {
        const hit = myDeck.find(c=>c.id===hitId);
        if (hit) { sound.match(); setMatchCard(hit); if(unsubRef.current)unsubRef.current(); return; }
      }
      if (pNum===1?room.p2Done:room.p1Done) setOtherDone(true);
    });
  }, [sound, partnerJoined]);

  useEffect(() => () => { if(unsubRef.current) unsubRef.current(); }, []);

  const doCreateRoom = async () => {
    sound.tap(); setLoading(true); setError("");
    try {
      await initFirebase();
      const code = genCode();
      const pid = genCode() + genCode();
      const shuffled = shuffle(ALL_ACTIVITIES);
      await createRoom(code, { deck:shuffled, p1Likes:{}, p2Likes:{}, p2Joined:false, p1Done:false, p2Done:false, pairId:pid, created:Date.now() });
      setRoomCode(code); setPairId(pid); setPlayerNum(1); setDeck(shuffled); setCardIndex(0);
      setScreen("wait"); startListening(code, 1, shuffled);
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
      setError(""); room.p2Joined = true; await updateRoom(code, room);
      setRoomCode(code); setPairId(room.pairId||"default"); setPlayerNum(2);
      setDeck(room.deck); setCardIndex(0); setScreen("swipe");
      startListening(code, 2, room.deck);
    } catch(e) { setError("Couldn't join room. Check your connection."); }
    setLoading(false);
  };

  const doSwipe = async (dir) => {
    const card = deck[cardIndex];
    if (dir==="yes") sound.yes(); else sound.no();
    try {
      const room = await getRoom(roomCode); if(!room) return;
      const key = playerNum===1?"p1Likes":"p2Likes";
      if (dir==="yes") { room[key]=room[key]||{}; room[key][card.id]=true; }
      const next = cardIndex+1, isDone = next>=deck.length;
      if (isDone) room[playerNum===1?"p1Done":"p2Done"]=true;
      await updateRoom(roomCode, room);
      if (isDone) setScreen("done"); else setCardIndex(next);
    } catch(e){}
  };

  const reset = async () => {
    if (unsubRef.current) unsubRef.current();
    if (roomCode) { try { await deleteRoom(roomCode); } catch(e){} }
    setScreen("home"); setRoomCode(""); setPairId(""); setInputCode("");
    setPlayerNum(null); setDeck([]); setCardIndex(0); setMatchCard(null);
    setShowRating(false); setOtherDone(false); setPartnerJoined(false);
    setError(""); setLoading(false);
  };

  if (activeGame==="truth")      return <TruthOrDare onBack={()=>setActiveGame(null)}/>;
  if (activeGame==="knowme")     return <HowWellDoYouKnowMe onBack={()=>setActiveGame(null)}/>;
  if (activeGame==="never")      return <NeverHaveIEver onBack={()=>setActiveGame(null)}/>;
  if (activeGame==="thisorthat") return <ThisOrThat onBack={()=>setActiveGame(null)}/>;
  if (activeGame==="hottakes")   return <HotTakes onBack={()=>setActiveGame(null)}/>;
  if (screen==="history")        return <HistoryScreen pairId={pairId||"default"} onBack={()=>setScreen("home")}/>;

  return (
    <div style={{minHeight:"100vh",background:N.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"-apple-system,'Inter','Segoe UI',sans-serif",padding:"32px 20px",position:"relative",overflow:"hidden",WebkitOverflowScrolling:"touch"}}>
      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes popIn{from{opacity:0;transform:scale(0.7)}to{opacity:1;transform:scale(1)}}
        @keyframes neonFlicker{0%,100%{opacity:1}92%{opacity:1}93%{opacity:0.8}94%{opacity:1}}
        *{-webkit-tap-highlight-color:transparent;box-sizing:border-box}
        input,textarea{font-size:16px!important}
      `}</style>

      {/* Neon grid background */}
      <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(${N.pink}08 1px,transparent 1px),linear-gradient(90deg,${N.pink}08 1px,transparent 1px)`,backgroundSize:"40px 40px"}}/>
        <div style={{position:"absolute",top:"20%",left:"10%",width:300,height:300,borderRadius:"50%",background:N.pink,filter:"blur(120px)",opacity:0.06}}/>
        <div style={{position:"absolute",bottom:"20%",right:"10%",width:300,height:300,borderRadius:"50%",background:N.cyan,filter:"blur(120px)",opacity:0.06}}/>
      </div>

      {/* Header */}
      {!matchCard && !showRating && (
        <div style={{position:"fixed",top:0,left:0,right:0,zIndex:10,padding:"0 20px"}}>
          <div style={{maxWidth:440,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 0",borderBottom:`1px solid ${N.border}`}}>
            <span style={{fontSize:18,fontWeight:900,letterSpacing:"-1px",background:`linear-gradient(135deg,${N.pink},${N.cyan})`,backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"shimmer 5s linear infinite",textShadow:"none"}}>
              ✦ Vibe Check
            </span>
            <button onTouchEnd={e=>{e.preventDefault();if(pairId)setScreen("history");}} onClick={()=>{if(pairId)setScreen("history");}}
              style={{background:N.card,border:`1px solid ${N.border}`,borderRadius:50,padding:"8px 14px",color:N.muted,fontSize:12,fontWeight:700,cursor:"pointer",WebkitAppearance:"none",touchAction:"manipulation",letterSpacing:1,textTransform:"uppercase"}}>
              History
            </button>
          </div>
        </div>
      )}

      <div style={{paddingTop:72,width:"100%",maxWidth:440,position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center"}}>

        {/* HOME */}
        {screen==="home" && !matchCard && (
          <div style={{textAlign:"center",animation:"slideUp 0.5s ease both",width:"100%"}}>
            {/* Big neon title */}
            <div style={{marginBottom:40}}>
              <div style={{fontSize:"clamp(56px,14vw,88px)",fontWeight:900,letterSpacing:"-5px",lineHeight:.85,margin:"0 0 16px",background:`linear-gradient(135deg,${N.pink},${N.cyan})`,backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"shimmer 4s linear infinite, neonFlicker 8s ease infinite",}}>
                VIBE<br/>CHECK
              </div>
              <p style={{fontSize:15,color:N.muted,lineHeight:1.7,margin:0}}>
                Both swipe yes on the same thing<br/>and tonight is decided. No debates.
              </p>
            </div>

            <NeonBtn onClick={doCreateRoom} color={N.pink} disabled={loading}>
              {loading?"Creating…":"⚡ Create a room"}
            </NeonBtn>
            <NeonBtn onClick={()=>{sound.tap();setScreen("join");}} secondary>
              Join with a code
            </NeonBtn>
            <NeonBtn onClick={()=>{sound.tap();setScreen("games");}} secondary style={{color:N.cyan,border:`1px solid ${N.cyan}33`}}>
              🎮 Couples games
            </NeonBtn>
            {error&&<p style={{color:N.pink,fontSize:13,marginTop:8}}>{error}</p>}
          </div>
        )}

        {/* JOIN */}
        {screen==="join" && (
          <div style={{textAlign:"center",animation:"slideUp 0.4s ease both",width:"100%"}}>
            <h2 style={{fontSize:26,fontWeight:900,color:N.text,marginBottom:8}}>Enter room code</h2>
            <p style={{color:N.muted,fontSize:14,marginBottom:24}}>Ask your partner for their code</p>
            <input value={inputCode} onChange={e=>setInputCode(e.target.value.toUpperCase())} maxLength={6} placeholder="AB12C"
              style={{width:"100%",padding:"18px 24px",fontSize:28,fontWeight:900,textAlign:"center",letterSpacing:6,background:"rgba(255,45,120,0.05)",border:`1px solid ${N.pink}44`,borderRadius:18,color:N.text,marginBottom:8,outline:"none",WebkitAppearance:"none",boxShadow:glow(N.pink,10)}}/>
            {error&&<p style={{color:N.pink,fontSize:13,marginBottom:8}}>{error}</p>}
            <NeonBtn onClick={doJoinRoom} color={N.pink} style={{marginTop:12}} disabled={loading}>{loading?"Joining…":"Join →"}</NeonBtn>
            <NeonBtn onClick={()=>{setError("");setScreen("home");}} secondary>← Back</NeonBtn>
          </div>
        )}

        {/* WAIT */}
        {screen==="wait" && (
          <div style={{textAlign:"center",animation:"slideUp 0.4s ease both",width:"100%"}}>
            <div style={{fontSize:44,marginBottom:14,animation:"spin 3s linear infinite",filter:`drop-shadow(0 0 12px ${N.cyan})`}}>🔗</div>
            <h2 style={{fontSize:24,fontWeight:900,color:N.text,marginBottom:8}}>Room created!</h2>
            <p style={{color:N.muted,fontSize:15,marginBottom:24,lineHeight:1.7}}>Share this code with your partner</p>
            <NeonCard glowColor={N.pink} style={{textAlign:"center",marginBottom:24}}>
              <div style={{fontSize:44,fontWeight:900,letterSpacing:10,background:`linear-gradient(135deg,${N.pink},${N.cyan})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",textShadow:"none"}}>{roomCode}</div>
              <p style={{color:N.dim,fontSize:12,marginTop:6,letterSpacing:1,textTransform:"uppercase"}}>Room code</p>
            </NeonCard>
            <div style={{display:"flex",alignItems:"center",gap:10,justifyContent:"center",color:N.dim,fontSize:14,marginBottom:24}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:N.cyan,boxShadow:glow(N.cyan,8),animation:"pulse 1.2s ease infinite"}}/>
              Waiting for your partner…
            </div>
            <NeonBtn onClick={reset} secondary>Cancel</NeonBtn>
          </div>
        )}

        {/* SWIPE */}
        {screen==="swipe" && deck.length>0 && cardIndex<deck.length && !matchCard && (
          <div style={{width:"100%",animation:"slideUp 0.4s ease both"}}>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{display:"inline-block",fontSize:10,fontWeight:800,letterSpacing:3,textTransform:"uppercase",color:playerNum===1?N.pink:N.cyan,border:`1px solid ${playerNum===1?N.pink:N.cyan}44`,borderRadius:50,padding:"5px 16px",marginBottom:10,textShadow:`0 0 8px ${playerNum===1?N.pink:N.cyan}`}}>
                {playerNum===1?"Person 1":"Person 2"}
              </div>
              <h2 style={{fontSize:20,fontWeight:900,color:N.text,margin:"0 0 4px"}}>Swipe on what sounds good</h2>
              <p style={{fontSize:12,color:N.muted,margin:0}}>{deck.length-cardIndex} left · {otherDone?"🟢 Partner finished":"⏳ Partner is swiping…"}</p>
            </div>
            <div style={{position:"relative",height:290,width:"100%"}}>
              <SwipeCard activity={deck[cardIndex]} onSwipe={doSwipe}/>
              {cardIndex+1<deck.length&&<div style={{position:"absolute",width:"100%",transform:"scale(0.95) translateY(10px)",zIndex:1}}><div style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${N.border}`,borderRadius:28,height:240}}/></div>}
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:24,marginTop:20}}>
              <button onTouchEnd={e=>{e.preventDefault();doSwipe("no");}} onClick={()=>doSwipe("no")}
                style={{width:64,height:64,borderRadius:"50%",background:`rgba(255,45,120,0.1)`,border:`2px solid ${N.pink}55`,fontSize:24,cursor:"pointer",color:N.pink,display:"flex",alignItems:"center",justifyContent:"center",WebkitAppearance:"none",touchAction:"manipulation",boxShadow:glow(N.pink,8)}}>✕</button>
              <button onTouchEnd={e=>{e.preventDefault();doSwipe("yes");}} onClick={()=>doSwipe("yes")}
                style={{width:64,height:64,borderRadius:"50%",background:`rgba(0,245,255,0.1)`,border:`2px solid ${N.cyan}55`,fontSize:24,cursor:"pointer",color:N.cyan,display:"flex",alignItems:"center",justifyContent:"center",WebkitAppearance:"none",touchAction:"manipulation",boxShadow:glow(N.cyan,8)}}>♥</button>
            </div>
            <NeonBtn onClick={reset} secondary style={{marginTop:20,padding:"12px"}}>← Leave room</NeonBtn>
          </div>
        )}

        {/* DONE */}
        {screen==="done" && !matchCard && (
          <div style={{textAlign:"center",animation:"slideUp 0.4s ease both",width:"100%"}}>
            <div style={{fontSize:50,marginBottom:14,animation:"pulse 1.5s ease infinite"}}>⏳</div>
            <h2 style={{fontSize:24,fontWeight:900,color:N.text,marginBottom:10}}>You're done swiping!</h2>
            <p style={{color:N.muted,fontSize:15,lineHeight:1.7,marginBottom:28}}>{otherDone?"No match this round. Try again?":"Waiting for your partner…"}</p>
            {otherDone&&<NeonBtn onClick={reset} color={N.pink}>Try again</NeonBtn>}
          </div>
        )}

        {/* GAMES */}
        {screen==="games" && (
          <div style={{animation:"slideUp 0.4s ease both",width:"100%"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
              <button onTouchEnd={e=>{e.preventDefault();sound.tap();setScreen("home");}} onClick={()=>{sound.tap();setScreen("home");}}
                style={{background:N.card,border:`1px solid ${N.border}`,borderRadius:50,minWidth:44,height:44,color:N.muted,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",WebkitAppearance:"none",touchAction:"manipulation"}}>←</button>
              <div>
                <div style={{fontSize:11,color:N.cyan,textTransform:"uppercase",letterSpacing:2,fontWeight:800}}>Play Together</div>
                <div style={{fontSize:20,fontWeight:900,color:N.text}}>Couples Games</div>
              </div>
            </div>
            {[
              {key:"truth",emoji:"🎴",title:"Truth or Dare",desc:"Spicy questions & wild dares",color:N.pink},
              {key:"knowme",emoji:"🧠",title:"How Well Do You Know Me?",desc:"Answer about yourself — they guess",color:N.cyan},
              {key:"never",emoji:"🍹",title:"Never Have I Ever",desc:"Find out what you've both been up to",color:N.purple},
              {key:"thisorthat",emoji:"⚡",title:"This or That",desc:"Rapid fire — how in sync are you?",color:N.cyan},
              {key:"hottakes",emoji:"🌶️",title:"Hot Takes",desc:"Agree or disagree on spicy opinions",color:N.pink},
            ].map(g=>(
              <button key={g.key}
                onTouchEnd={e=>{e.preventDefault();sound.tap();setActiveGame(g.key);}}
                onClick={()=>{sound.tap();setActiveGame(g.key);}}
                style={{width:"100%",background:N.card,border:`1px solid ${g.color}22`,borderRadius:20,padding:"18px 20px",display:"flex",alignItems:"center",gap:16,cursor:"pointer",color:N.text,marginBottom:10,textAlign:"left",WebkitAppearance:"none",touchAction:"manipulation",boxShadow:glow(g.color,5)}}
              >
                <span style={{fontSize:28,filter:`drop-shadow(0 0 8px ${g.color})`}}>{g.emoji}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:16}}>{g.title}</div>
                  <div style={{fontSize:13,color:N.muted,marginTop:2}}>{g.desc}</div>
                </div>
                <span style={{color:g.color,fontSize:16,textShadow:`0 0 8px ${g.color}`}}>→</span>
              </button>
            ))}
          </div>
        )}

        {/* MATCH */}
        {matchCard && !showRating && (
          <MatchScreen activity={matchCard} onRate={()=>setShowRating(true)}/>
        )}

        {/* RATING */}
        {matchCard && showRating && (
          <RatingScreen
            activity={matchCard}
            playerNum={playerNum}
            pairId={pairId||"default"}
            roomCode={roomCode}
            onDone={reset}
          />
        )}
      </div>
    </div>
  );
}
