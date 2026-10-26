import { branches } from "./data";
import { distributorStatement, compatibilityStatement } from "./business";

export type AssistantProduct={id:number;slug:string;name:string;code:string;image:string|null;refs:string};
export type DemoReply={text:string;products?:AssistantProduct[];links?:{label:string;href:string}[];quoteOptions?:boolean};
let catalogue: Promise<AssistantProduct[]> | undefined;
const normalize=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const ignored=new Set("a an the i me my we you your can could would please need want looking look find have do does for of to and or in on with is it this that some show help about part parts motor motors hi hello hey bro thanks thank tell get search".split(" "));

function getCatalogue(){
  if(!catalogue)catalogue=fetch("/assistant-catalogue.json").then(response=>{if(!response.ok)throw Error("Catalogue unavailable");return response.json() as Promise<AssistantProduct[]>;}).catch(error=>{catalogue=undefined;throw error;});
  return catalogue;
}

export async function getDemoReply(message:string,previousSearch=""):Promise<DemoReply>{
  const query=normalize(message);
  if(/\b(price|prices|cost|quote|quotation|stock|availability|available|buy|order)\b|how much/.test(query))return {text:"Tell DCB what you need a quote for — a bulb, light, electrical item or vehicle part. You can add a photo, and vehicle details are optional. You can also chat with our team below on WhatsApp.\n\nChoose WhatsApp to speak to the team, or use DCB Assist to submit your quote request. The team will confirm the price, stock and correct fit.",quoteOptions:true};
  if(/\b(genuine|oem|aftermarket|manufacture|manufacturer|distributor)\b/.test(query))return {text:`${distributorStatement}\n\n${compatibilityStatement}`,links:[{label:"Browse by compatible vehicle make",href:"/brands/"}]};
  if(/\b(branch|branches|address|location|located|where|contact|phone|telephone|email)\b/.test(query))return {text:`You’ll find DCB in Gauteng and the Western Cape.\n\n${branches.map(b=>`${b.name}\n${b.street}, ${b.area}\n${b.phone}`).join("\n\n")}\n\nEmail: info@dcbspares.co.za`,links:[{label:"View contact details",href:"/contact/"}]};
  if(/\b(hours|open|opening|close|closing|sunday|saturday)\b/.test(query))return {text:"I don’t have verified opening hours in this demo. Give your nearest branch a call before visiting: Alrode 011 908 6366, or Cape Town 021 286 2737.",links:[{label:"Contact a branch",href:"/contact/"}]};
  if(/\b(wholesale|retail|business|gb|company|profile)\b/.test(query))return {text:`DCB supplies both wholesale and retail customers, from workshops and automotive businesses to individual vehicle owners. ${distributorStatement}`,links:[{label:"About DCB",href:"/about/"},{label:"Company profile",href:"/company-profile/"}]};
  if(/\b(delivery|shipping|return|warranty|guarantee)\b/.test(query))return {text:"The demo doesn’t have confirmed delivery, returns or warranty terms. DCB’s team can check the arrangements for your order.",links:[{label:"Contact DCB",href:"/contact/"}]};
  if(/^(hi|hello|hey|bro|thanks|thank you|help|find a part|find my part)$/.test(query))return {text:"Tell me the part or vehicle you’re looking for—for example, “Toyota Hilux starter” or “STR1246”. I can show catalogue matches, branch details, or how to get a quote."};
  const words=query.split(/\s+/).filter(w=>!ignored.has(w));
  const previous=normalize(previousSearch).split(/\s+/).filter(w=>!ignored.has(w));
  const contextual=words.length<=2 && !words.some(w=>/[a-z]+\d{3,}/.test(w)) ? [...new Set([...previous,...words])] : words;
  const terms=contextual.map(w=>w==="starters"?"starter":w==="alternators"?"alternator":w==="bendix"?"drive":w==="lights"?"light":w);
  if(!terms.length)return {text:"Try a part number, vehicle model, or product range. I can also help with branch details and preparing a quote."};
  const items=await getCatalogue();
  const compact=query.replaceAll(" ","");
  const scored=items.map(product=>{
    const text=normalize(`${product.name} ${product.code} ${product.refs}`);
    const code=normalize(product.code).replaceAll(" ","");
    const exact=code.length>2 && (compact===code || query.split(" ").includes(code));
    const matched=terms.filter(t=>text.includes(t));
    return {product,score:exact?100:matched.length===terms.length?matched.length*10+(product.name.toLowerCase().includes(terms.join(" "))?5:0):0};
  }).filter(p=>p.score>0).sort((a,b)=>b.score-a.score);
  if(!scored.length)return {text:"I couldn’t find a clear catalogue match for that. Try the part number or a shorter description, such as “Hilux starter”. For help matching a photo or checking fit, chat with the DCB team.",links:[{label:"Explore all products",href:"/products/"}]};
  const products=scored.slice(0,3).map(p=>p.product);
  return {text:`${scored.length===1?"I found this catalogue match.":`I found ${scored.length} catalogue matches. Here are a few to explore.`} These are aftermarket replacements; vehicle names indicate compatibility. DCB’s team can confirm fitment and availability.`,products,links:scored.length>3?[{label:"See more in the catalogue",href:`/products/?q=${encodeURIComponent(terms.join(" "))}`}]:undefined};
}
