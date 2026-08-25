import { NextResponse } from "next/server";
const TOTAL_AYAHS=6236;
const DEFAULT_EDITION=process.env.QURAN_EDITION||"sq.nahi";
const fallbacks=[
 {text:"Nëse falënderoni, Unë do t’jua shtoj të mirat.",surahName:"Ibrahim",surahNumber:14,ayahNumber:7},
 {text:"Vërtet, pas vështirësisë vjen lehtësimi.",surahName:"Esh-Sharh",surahNumber:94,ayahNumber:6},
 {text:"Allahu nuk e ngarkon askënd përtej mundësive të tij.",surahName:"El-Bekare",surahNumber:2,ayahNumber:286},
 {text:"Mos e humbni shpresën në mëshirën e Allahut.",surahName:"Ez-Zumer",surahNumber:39,ayahNumber:53}
];
function randomFallback(){return fallbacks[Math.floor(Math.random()*fallbacks.length)]}
export async function GET(){
 const ayah=Math.floor(Math.random()*TOTAL_AYAHS)+1;
 const endpoint=`https://api.alquran.cloud/v1/ayah/${ayah}/${DEFAULT_EDITION}`;
 try{
  const response=await fetch(endpoint,{cache:"no-store",signal:AbortSignal.timeout(8000),headers:{Accept:"application/json"}});
  if(!response.ok) throw new Error(`Quran API returned ${response.status}`);
  const payload=await response.json(); const data=payload?.data;
  if(!data?.text||!data?.surah) throw new Error("Unexpected response");
  return NextResponse.json({data:{text:String(data.text).trim(),surahName:data.surah.englishName||data.surah.name||`Surja ${data.surah.number}`,surahNumber:Number(data.surah.number),ayahNumber:Number(data.numberInSurah),source:"Al Quran Cloud",translator:DEFAULT_EDITION==="sq.nahi"?"Hasan Efendi Nahi":DEFAULT_EDITION}});
 }catch{
  return NextResponse.json({data:{...randomFallback(),source:"Fallback lokal",translator:"Përkthim shqip"},fallback:true});
 }
}
