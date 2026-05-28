import { useState, useRef, useEffect, useCallback } from "react";

const KERUGOYA = { lat: -0.4942, lon: 37.2828 };

const SYSTEM_PROMPT = `You are Shamba AI (Shamba means "farm" in Swahili), an expert agricultural advisor for smallholder farmers in Kirinyaga County, Kenya. You are warm, practical, and always speak with respect.

LOCATION CONTEXT:
- Kirinyaga County, Kenya — includes the famous Mwea Irrigation Scheme (Kenya's largest rice-growing area)
- Key crops: Rice (Mwea), Tomatoes, Coffee, Avocados, Maize, Beans, Sorghum
- Livestock: Dairy cattle, poultry, goats, pigs
- Elevation: ~1,200-1,800m (central highlands, fertile soils)
- Climate: Long rains (March-May), Short rains (October-December), dry seasons Jan-Feb and July-Sep
- Active programs: Wezesha Kirinyaga (county empowerment program supporting 100,000+ farm households)

YOUR EXPERTISE:
1. Crop advisory: optimal planting times, seed varieties, spacing, fertilizer, irrigation, harvesting
2. Disease and pest ID from photos: coffee berry borer, rice blast, tomato blight, fall armyworm, aphids, rust, powdery mildew, etc.
3. Livestock health: East Coast Fever, mastitis, worms, foot-and-mouth disease
4. Market intelligence: price ranges at Kerugoya, Embu, Nairobi markets
5. Input costs: fertilizers (CAN, DAP, NPK), seeds, pesticides
6. Climate-smart farming: drought-resistant varieties, water harvesting, agroforestry
7. Financial: SACCOs, Wezesha Kirinyaga funding, cooperative membership

PHOTO DIAGNOSIS PROTOCOL — when shown a plant/crop/livestock image:
1. Identify the crop/plant/animal you see
2. Name the disease, pest, or condition visible (be specific)
3. Severity: mild / moderate / severe
4. Immediate action (what to do TODAY)
5. Treatment: specific product names available in Kenya, dosage, application method
6. Prevention: how to stop it coming back
7. When to call the agriculture officer or vet in person

LANGUAGE: Respond in the same language the farmer writes in — English or Swahili. Mix naturally if they do.

STYLE: Concise and actionable. Use bullet points for step-by-step instructions. Give specific quantities (kg per acre, litres per plant). Mention when to seek expert help in person.

PRICES (2025): Paddy rice KSh 40-55/kg | Tomatoes KSh 30-80/kg | Coffee cherry KSh 60-80/kg | Avocados KSh 5-40/fruit | Milk KSh 40-55/L | Maize KSh 35-50/kg | DAP ~KSh 3,500-4,200/50kg | CAN ~KSh 3,000-3,600/50kg

End with encouragement when appropriate. "Shamba lako litafanikiwa!" = Your farm will succeed!`;

const WX_CODES = {
  0:  { label:"Clear sky",     labelSw:"Anga wazi",       icon:"ti-sun",          tip:"Great day to spray or apply fertilizer.",       tipSw:"Siku nzuri ya kunyunyiza au kuweka mbolea." },
  1:  { label:"Mainly clear",  labelSw:"Hewa nzuri",      icon:"ti-sun",          tip:"Good conditions for fieldwork.",                tipSw:"Hali nzuri ya kufanya kazi shambani." },
  2:  { label:"Partly cloudy", labelSw:"Mawingu kidogo",  icon:"ti-cloud",        tip:"Good for transplanting seedlings.",             tipSw:"Nzuri kwa kupanda miche." },
  3:  { label:"Overcast",      labelSw:"Mawingu mengi",   icon:"ti-cloud",        tip:"Watch for fungal diseases in humidity.",        tipSw:"Angalia magonjwa ya ukungu." },
  45: { label:"Foggy",         labelSw:"Ukungu",          icon:"ti-wind",         tip:"Fog promotes fungal disease — inspect crops.",  tipSw:"Ukungu unakuza magonjwa — kagua mazao." },
  51: { label:"Light drizzle", labelSw:"Manyunyu",        icon:"ti-cloud-drizzle",tip:"Skip spraying — rain washes chemicals away.",   tipSw:"Usinyunyize — mvua itaosha dawa." },
  61: { label:"Rain",          labelSw:"Mvua",            icon:"ti-cloud-rain",   tip:"Skip spraying. Check field drainage.",          tipSw:"Usinyunyize. Angalia mifereji ya maji." },
  63: { label:"Moderate rain", labelSw:"Mvua ya wastani", icon:"ti-cloud-rain",   tip:"Good to transplant. Check for flooding.",       tipSw:"Wakati mzuri wa kupanda miche." },
  65: { label:"Heavy rain",    labelSw:"Mvua kubwa",      icon:"ti-cloud-storm",  tip:"Protect seedlings. Check drainage urgently.",   tipSw:"Linda miche. Angalia mifereji haraka." },
  80: { label:"Rain showers",  labelSw:"Mvua za radi",    icon:"ti-cloud-rain",   tip:"Good for recently planted crops.",              tipSw:"Nzuri kwa mazao yaliyopandwa hivi karibuni." },
  95: { label:"Thunderstorm",  labelSw:"Dhoruba",         icon:"ti-storm",        tip:"Shelter livestock. Secure equipment.",          tipSw:"Linda mifugo. Hifadhi vifaa." },
};

function getWx(code) {
  const keys = Object.keys(WX_CODES).map(Number).sort((a,b) => b-a);
  return WX_CODES[keys.find(k => code >= k)] || WX_CODES[0];
}

const QUICK = {
  en: [
    { icon:"ti-plant-2",       label:"Rice planting",    prompt:"Best practices for planting rice in Mwea this season — variety, spacing, and fertilizer?" },
    { icon:"ti-bug",           label:"Crop disease ID",  prompt:"My tomato leaves have brown spots and are wilting. What disease is this and how do I treat it?" },
    { icon:"ti-currency-dollar",label:"Best prices now", prompt:"What crops fetch the best prices right now in Kirinyaga? Where should I sell?" },
    { icon:"ti-cow",           label:"Dairy cattle",     prompt:"My dairy cow has reduced milk and looks weak. What could be wrong and what do I do?" },
    { icon:"ti-droplet",       label:"Fertilizer guide", prompt:"Which fertilizer for my maize and how much per acre at planting and top-dressing?" },
    { icon:"ti-calendar",      label:"What to plant now",prompt:"Based on the current season in Kirinyaga, what should I plant, prepare, or harvest?" },
    { icon:"ti-building-bank", label:"Wezesha funding",  prompt:"How do I access Wezesha Kirinyaga funding for my farmer group? What are the requirements?" },
    { icon:"ti-cloud-rain",    label:"Water harvesting", prompt:"Rainfall is unreliable. What drought-resistant crops and water harvesting techniques work in Kirinyaga?" },
  ],
  sw: [
    { icon:"ti-plant-2",       label:"Kupanda mchele",   prompt:"Mbinu bora za kupanda mchele Mwea msimu huu — mbegu, nafasi, mbolea?" },
    { icon:"ti-bug",           label:"Tambua ugonjwa",   prompt:"Majani ya nyanya yana madoa ya kahawia na yanakauka. Ni ugonjwa gani na ninautibuaje?" },
    { icon:"ti-currency-dollar",label:"Bei nzuri sasa",  prompt:"Mazao gani yana bei nzuri sasa Kirinyaga? Niuze wapi kupata faida zaidi?" },
    { icon:"ti-cow",           label:"Ng'ombe wa maziwa",prompt:"Ng'ombe wangu anatoa maziwa kidogo na anaonekana dhaifu. Tatizo ni nini na nifanye nini?" },
    { icon:"ti-droplet",       label:"Mbolea gani",      prompt:"Ni mbolea gani kwa mahindi na kiasi gani kwa ekari — wakati wa kupanda na kuweka juu?" },
    { icon:"ti-calendar",      label:"Nini kipande sasa",prompt:"Kwa msimu wa sasa Kirinyaga, ninastahili kupanda, kuandaa, au kuvuna nini?" },
    { icon:"ti-building-bank", label:"Pesa ya Wezesha",  prompt:"Ninawezaje kupata pesa za Wezesha Kirinyaga kwa kikundi changu? Mahitaji ni gani?" },
    { icon:"ti-cloud-rain",    label:"Kukusanya maji",   prompt:"Mvua ni ya kuaminika kidogo. Ni mazao gani yanayostahimili ukame na mbinu za maji zipi?" },
  ],
};

const SEASONS = [
  { months:[3,4,5],    label:"Long Rains",       labelSw:"Masika",          color:"#1D9E75", icon:"ti-cloud-rain"   },
  { months:[6,7,8,9],  label:"Long Dry Season",  labelSw:"Kiangazi",        color:"#BA7517", icon:"ti-sun"          },
  { months:[10,11,12], label:"Short Rains",       labelSw:"Vuli",            color:"#378ADD", icon:"ti-cloud-drizzle"},
  { months:[1,2],      label:"Short Dry Season",  labelSw:"Kiangazi Kidogo", color:"#D85A30", icon:"ti-sun-wind"     },
];

function getSeason() {
  const m = new Date().getMonth() + 1;
  return SEASONS.find(s => s.months.includes(m)) || SEASONS[0];
}

function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function WeatherCard({ wx, lang }) {
  if (!wx) return (
    <div style={{ padding:"10px", borderRadius:"var(--border-radius-md)", border:"0.5px solid var(--color-border-tertiary)", background:"var(--color-background-primary)", textAlign:"center" }}>
      <i className="ti ti-cloud-question" style={{ fontSize:"20px", color:"var(--color-text-tertiary)", display:"block", margin:"4px auto 2px" }} aria-hidden="true" />
      <p style={{ margin:0, fontSize:"11px", color:"var(--color-text-tertiary)" }}>{lang === "en" ? "Loading weather…" : "Inapakia hali ya hewa…"}</p>
    </div>
  );
  const info = getWx(wx.code);
  const tempColor = wx.temp > 28 ? "#D85A30" : wx.temp > 22 ? "#BA7517" : "#378ADD";
  const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  return (
    <div style={{ borderRadius:"var(--border-radius-md)", border:"0.5px solid var(--color-border-tertiary)", background:"var(--color-background-primary)", overflow:"hidden" }}>
      <div style={{ padding:"8px 10px", borderBottom:"0.5px solid var(--color-border-tertiary)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <p style={{ margin:0, fontSize:"9px", color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.05em" }}>Kerugoya now</p>
          <p style={{ margin:0, fontSize:"22px", fontWeight:500, color:tempColor, lineHeight:1.1 }}>{Math.round(wx.temp)}°C</p>
        </div>
        <div style={{ textAlign:"right" }}>
          <i className={`ti ${info.icon}`} style={{ fontSize:"26px", color:"var(--color-text-secondary)", display:"block" }} aria-hidden="true" />
          <p style={{ margin:0, fontSize:"10px", color:"var(--color-text-secondary)" }}>{lang === "en" ? info.label : info.labelSw}</p>
        </div>
      </div>
      <div style={{ padding:"5px 10px", display:"flex", gap:"12px" }}>
        <span style={{ fontSize:"10px", color:"var(--color-text-tertiary)" }}>
          <i className="ti ti-droplet" style={{ fontSize:"10px" }} aria-hidden="true" /> {wx.humidity}%
        </span>
        <span style={{ fontSize:"10px", color:"var(--color-text-tertiary)" }}>
          <i className="ti ti-cloud-rain" style={{ fontSize:"10px" }} aria-hidden="true" /> {wx.rain}mm
        </span>
      </div>
      {wx.forecast && (
        <div style={{ padding:"4px 8px 6px", display:"flex", gap:"4px" }}>
          {wx.forecast.map((d,i) => (
            <div key={i} style={{ flex:1, textAlign:"center", padding:"4px 2px", borderRadius:"4px", background:"var(--color-background-secondary)" }}>
              <p style={{ margin:0, fontSize:"9px", color:"var(--color-text-tertiary)" }}>{DAYS[new Date(d.time).getDay()]}</p>
              <i className={`ti ${getWx(d.code).icon}`} style={{ fontSize:"12px", color:"var(--color-text-secondary)" }} aria-hidden="true" />
              <p style={{ margin:0, fontSize:"9px", color:"var(--color-text-secondary)" }}>{d.max}°/{d.min}°</p>
            </div>
          ))}
        </div>
      )}
      <div style={{ padding:"5px 10px 7px", borderTop:"0.5px solid var(--color-border-tertiary)" }}>
        <p style={{ margin:0, fontSize:"10px", color:"#3B6D11", lineHeight:"1.4" }}>
          <i className="ti ti-bulb" style={{ fontSize:"10px" }} aria-hidden="true" /> {lang === "en" ? info.tip : info.tipSw}
        </p>
      </div>
    </div>
  );
}

export default function ShambaAI() {
  const [messages, setMessages] = useState([{
    role:"assistant", type:"text",
    content:"Habari sana! \uD83C\uDF31 I'm Shamba AI — your farm advisor for Kirinyaga County.\n\nAsk me anything, or use a quick question on the left. You can also \uD83D\uDCF7 upload a photo of a sick crop, pest, or animal for instant AI diagnosis.\n\nI speak English and Swahili. What's happening on your farm today?",
  }]);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [lang, setLang]             = useState("en");
  const [sidebar, setSidebar]       = useState(true);
  const [weather, setWeather]       = useState(null);
  const [pendingImg, setPendingImg] = useState(null);
  const [dragOver, setDragOver]     = useState(false);
  const endRef    = useRef(null);
  const inputRef  = useRef(null);
  const photoRef  = useRef(null);
  const season    = getSeason();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  useEffect(() => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${KERUGOYA.lat}&longitude=${KERUGOYA.lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Africa%2FNairobi&forecast_days=4`)
      .then(r => r.json())
      .then(d => {
        const c = d.current, dl = d.daily;
        setWeather({
          temp: c.temperature_2m, humidity: c.relative_humidity_2m,
          rain: c.precipitation,  code: c.weather_code,
          forecast: [1,2,3].map(i => ({ time:dl.time[i], code:dl.weather_code[i], max:Math.round(dl.temperature_2m_max[i]), min:Math.round(dl.temperature_2m_min[i]) })),
        });
      }).catch(() => {});
  }, []);

  const pickPhoto = useCallback(async (file) => {
    if (!file?.type.startsWith("image/")) return;
    const objectUrl = URL.createObjectURL(file);
    const base64    = await toBase64(file);
    setPendingImg({ objectUrl, base64, mediaType: file.type });
  }, []);

  const send = async (text) => {
    const trimmed = text.trim();
    const img = pendingImg;
    if ((!trimmed && !img) || loading) return;

    const displayText = trimmed || (lang === "en" ? "Please diagnose what you see in this photo." : "Tafadhali tambua tatizo linalonoonekana kwenye picha hii.");
    const userMsg = { role:"user", type: img ? "image":"text", content: displayText, imageUrl: img?.objectUrl };
    const history  = [...messages, userMsg];
    setMessages(history);
    setInput(""); setPendingImg(null); setLoading(true);
    inputRef.current?.focus();

    const wxNote = weather
      ? `\n\nCURRENT WEATHER IN KERUGOYA: ${Math.round(weather.temp)}°C, ${getWx(weather.code).label}, humidity ${weather.humidity}%, precipitation ${weather.rain}mm. Factor this into your advice where relevant.`
      : "";

    const apiMsgs = history.map((m, idx) => {
      if (m.type === "image" && img && idx === history.length - 1) {
        return { role:"user", content:[
          { type:"image", source:{ type:"base64", media_type: img.mediaType, data: img.base64 }},
          { type:"text", text: m.content },
        ]};
      }
      return { role: m.role, content: m.content };
    });

    try {
      const res  = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system: SYSTEM_PROMPT + wxNote, messages: apiMsgs }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || (lang === "en" ? "Sorry, no response. Please try again." : "Samahani, hakuna jibu. Jaribu tena.");
      setMessages(prev => [...prev, { role:"assistant", type:"text", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role:"assistant", type:"text", content: lang === "en" ? "Connection error. Check your internet and try again." : "Hitilafu ya mtandao. Angalia muunganisho na ujaribu tena." }]);
    }
    setLoading(false);
  };

  const canSend = !loading && (input.trim().length > 0 || !!pendingImg);
  const prompts  = QUICK[lang];

  return (
    <div
      style={{ fontFamily:"var(--font-sans)", display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden", background:"var(--bg-chat)" }}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); pickPhoto(e.dataTransfer.files[0]); }}
    >
      {/* ── HEADER ── */}
      <div style={{ padding:"11px 16px", borderBottom:"2px solid var(--green-dark)", display:"flex", alignItems:"center", justifyContent:"space-between", background:"var(--bg-header)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <button onClick={() => setSidebar(s => !s)} style={{ background:"none", border:"none", cursor:"pointer", padding:"4px", color:"#A8C870", fontSize:"20px" }} aria-label="Toggle sidebar">
            <i className="ti ti-menu-2" aria-hidden="true" />
          </button>
          <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:"var(--green-mid)", border:"2px solid #A8C870", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <i className="ti ti-plant-2" style={{ color:"#D8EDBA", fontSize:"20px" }} aria-hidden="true" />
          </div>
          <div>
            <p style={{ margin:0, fontWeight:600, fontSize:"16px", color:"#EAF3DE", letterSpacing:"0.01em" }}>Shamba AI</p>
            <p style={{ margin:0, fontSize:"11px", color:"#A8C870" }}>
              <i className="ti ti-map-pin" style={{ fontSize:"11px", verticalAlign:"-1px" }} aria-hidden="true" /> Kirinyaga County · {lang === "en" ? season.label : season.labelSw}
            </p>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          {weather && (
            <div style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"12px", color:"#D8EDBA", padding:"4px 10px", borderRadius:"var(--r-pill)", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(168,200,112,0.4)" }}>
              <i className={`ti ${getWx(weather.code).icon}`} style={{ fontSize:"14px", color:"#A8C870" }} aria-hidden="true" />
              <span style={{ fontWeight:500 }}>{Math.round(weather.temp)}°C</span>
              <span style={{ opacity:0.75 }}>· {lang === "en" ? getWx(weather.code).label : getWx(weather.code).labelSw}</span>
            </div>
          )}
          <button onClick={() => setLang(l => l === "en" ? "sw" : "en")} style={{ fontSize:"12px", padding:"5px 11px", borderRadius:"var(--r-pill)", border:"1px solid rgba(168,200,112,0.5)", background:"rgba(255,255,255,0.1)", cursor:"pointer", color:"#D8EDBA", fontWeight:500 }}>
            {lang === "en" ? "🇰🇪 Kiswahili" : "🇬🇧 English"}
          </button>
        </div>
      </div>

      <div style={{ display:"flex", flex:1, overflow:"hidden", minHeight:0 }}>
        {/* ── SIDEBAR ── */}
        {sidebar && (
          <div style={{ width:"200px", borderRight:"2px solid var(--border-sidebar)", padding:"12px 8px", overflowY:"auto", background:"var(--bg-sidebar)", display:"flex", flexDirection:"column", gap:"4px", flexShrink:0 }}>
            <p style={{ margin:"0 0 6px 2px", fontSize:"10px", color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", fontWeight:600 }}>
              {lang === "en" ? "Today's weather" : "Hali ya hewa leo"}
            </p>
            <WeatherCard wx={weather} lang={lang} />

            <div style={{ height:"8px" }} />
            <p style={{ margin:"0 0 6px 2px", fontSize:"10px", color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", fontWeight:600 }}>
              {lang === "en" ? "Quick questions" : "Maswali ya haraka"}
            </p>
            {prompts.map((q,i) => (
              <button key={i} className="quick-btn" onClick={() => send(q.prompt)} disabled={loading} style={{ textAlign:"left", padding:"8px 9px", borderRadius:"var(--r-md)", border:"1px solid var(--border-mid)", background:"rgba(255,255,255,0.7)", cursor:loading ? "default":"pointer", fontSize:"12px", color:"var(--text-primary)", lineHeight:"1.4", display:"flex", alignItems:"center", gap:"7px", opacity:loading ? 0.5:1, transition:"background 0.15s, border-color 0.15s", borderLeft:"3px solid var(--green-mid)" }}>
                <i className={`ti ${q.icon}`} style={{ fontSize:"15px", color:"var(--green)", flexShrink:0 }} aria-hidden="true" />
                <span style={{ fontWeight:500 }}>{q.label}</span>
              </button>
            ))}

            <div style={{ marginTop:"auto", paddingTop:"10px", borderTop:"1px solid var(--border-mid)" }}>
              <p style={{ margin:"0 0 5px 2px", fontSize:"10px", color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", fontWeight:600 }}>
                {lang === "en" ? "Key contacts" : "Mawasiliano"}
              </p>
              {[
                ["ti-building",      lang === "en" ? "County Agric Office" : "Ofisi ya Kilimo"],
                ["ti-microscope",    "KALRO Mwea Research"],
                ["ti-device-mobile", "*234# M-Pesa Kilimo"],
              ].map(([icon,text],i) => (
                <p key={i} style={{ margin:"3px 0", fontSize:"11px", color:"var(--text-secondary)", lineHeight:"1.5", display:"flex", alignItems:"center", gap:"5px" }}>
                  <i className={`ti ${icon}`} style={{ fontSize:"12px", color:"var(--green-mid)" }} aria-hidden="true" /> {text}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* ── CHAT ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
          {/* Messages */}
          <div style={{ flex:1, overflowY:"auto", padding:"16px 18px", display:"flex", flexDirection:"column", gap:"12px", background:"var(--bg-chat)" }}>
            {messages.map((m,i) => (
              <div key={i} style={{ display:"flex", flexDirection:"column", alignItems: m.role === "user" ? "flex-end":"flex-start" }}>
                {m.role === "assistant" && (
                  <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"4px" }}>
                    <div style={{ width:"20px", height:"20px", borderRadius:"50%", background:"var(--green)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <i className="ti ti-plant-2" style={{ color:"#C0DD97", fontSize:"12px" }} aria-hidden="true" />
                    </div>
                    <span style={{ fontSize:"11px", color:"var(--text-muted)", fontWeight:500 }}>Shamba AI</span>
                  </div>
                )}
                <div style={{ maxWidth:"84%", display:"flex", flexDirection:"column", gap:"4px", alignItems: m.role === "user" ? "flex-end":"flex-start" }}>
                  {m.imageUrl && (
                    <img src={m.imageUrl} alt="Uploaded farm photo" style={{ maxWidth:"220px", maxHeight:"180px", objectFit:"cover", borderRadius:"12px", border:"2px solid var(--border-mid)" }} />
                  )}
                  <div style={{ padding:"11px 15px", borderRadius: m.role === "user" ? "18px 18px 4px 18px":"4px 18px 18px 18px", background: m.role === "user" ? "var(--green)":"var(--bg-card)", color: m.role === "user" ? "#EAF3DE":"var(--text-primary)", fontSize:"13.5px", lineHeight:"1.7", border: m.role === "assistant" ? "1px solid var(--border-subtle)":"none", whiteSpace:"pre-wrap", wordBreak:"break-word", boxShadow: m.role === "assistant" ? "0 1px 3px rgba(60,100,20,0.08)":"none" }}>
                    {m.content}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display:"flex", alignItems:"flex-start", gap:"6px" }}>
                <div style={{ width:"20px", height:"20px", borderRadius:"50%", background:"var(--green)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:"2px" }}>
                  <i className="ti ti-plant-2" style={{ color:"#C0DD97", fontSize:"12px" }} aria-hidden="true" />
                </div>
                <div style={{ padding:"11px 16px", borderRadius:"4px 18px 18px 18px", background:"var(--bg-card)", border:"1px solid var(--border-subtle)", fontSize:"13.5px", color:"var(--text-hint)" }}>
                  {lang === "en" ? "Analysing…" : "Ninachanganua…"}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Pending image preview */}
          {pendingImg && (
            <div style={{ padding:"8px 14px", borderTop:"1px solid var(--border-mid)", background:"var(--bg-amber)", display:"flex", alignItems:"center", gap:"8px" }}>
              <img src={pendingImg.objectUrl} alt="Pending" style={{ width:"48px", height:"48px", objectFit:"cover", borderRadius:"8px", border:"2px solid var(--border-mid)" }} />
              <div style={{ flex:1 }}>
                <p style={{ margin:0, fontSize:"12px", color:"var(--text-amber)", fontWeight:600 }}>{lang === "en" ? "Photo ready to send" : "Picha iko tayari kutumwa"}</p>
                <p style={{ margin:0, fontSize:"11px", color:"var(--text-secondary)" }}>{lang === "en" ? "Add a message or press send for diagnosis" : "Ongeza ujumbe au bonyeza tuma"}</p>
              </div>
              <button onClick={() => setPendingImg(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", fontSize:"20px", padding:"4px" }} aria-label="Remove photo">
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Input bar */}
          <input ref={photoRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={e => e.target.files[0] && pickPhoto(e.target.files[0])} />
          <div style={{ padding:"10px 14px", borderTop:"2px solid var(--border-mid)", display:"flex", gap:"8px", alignItems:"flex-end", background:"var(--bg-sidebar)", flexShrink:0 }}>
            <button
              onClick={() => photoRef.current?.click()} disabled={loading}
              title={lang === "en" ? "Upload crop photo for diagnosis" : "Pakia picha ya zao kwa utambuzi"}
              style={{ width:"40px", height:"40px", borderRadius:"50%", background: pendingImg ? "var(--green)":"var(--bg-card)", border:`2px solid ${pendingImg ? "var(--green)":"var(--border-mid)"}`, cursor:loading ? "default":"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, opacity:loading ? 0.5:1 }}
              aria-label="Upload photo"
            >
              <i className="ti ti-camera" style={{ fontSize:"18px", color: pendingImg ? "#EAF3DE":"var(--text-muted)" }} aria-hidden="true" />
            </button>
            <textarea
              ref={inputRef} value={input} rows={1} disabled={loading}
              onChange={e => { setInput(e.target.value); e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,100)+"px"; }}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }}}
              placeholder={pendingImg
                ? (lang === "en" ? "Describe the problem, or press send for diagnosis…" : "Elezea tatizo, au bonyeza tuma…")
                : (lang === "en" ? "Ask about crops, livestock, prices… or upload a photo" : "Uliza kuhusu mazao, mifugo, bei… au pakia picha")}
              style={{ flex:1, padding:"10px 14px", borderRadius:"var(--r-pill)", border:"1.5px solid var(--border-mid)", background:"var(--bg-input)", fontSize:"13.5px", color:"var(--text-primary)", outline:"none", resize:"none", overflow:"hidden", lineHeight:"1.5", minHeight:"40px", maxHeight:"100px" }}
            />
            <button
              onClick={() => send(input)} disabled={!canSend}
              style={{ width:"40px", height:"40px", borderRadius:"50%", background: canSend ? "var(--green)":"var(--border-subtle)", border:"none", cursor: canSend ? "pointer":"default", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"background 0.2s" }}
              aria-label={lang === "en" ? "Send" : "Tuma"}
            >
              <i className="ti ti-arrow-up" style={{ color: canSend ? "#EAF3DE":"var(--text-hint)", fontSize:"18px" }} aria-hidden="true" />
            </button>
          </div>

          {/* Footer */}
          <div style={{ padding:"5px 16px 7px", background:"var(--green-dark)", borderTop:"1px solid var(--green)" }}>
            <p style={{ margin:0, fontSize:"10px", color:"#7AAE44", textAlign:"center" }}>
              {lang === "en"
                ? "AI advice is a guide — consult your local agriculture officer for major decisions. Drag & drop photos anytime."
                : "Ushauri wa AI ni mwongozo — wasiliana na afisa wa kilimo kwa maamuzi makubwa. Buruta picha wakati wowote."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
