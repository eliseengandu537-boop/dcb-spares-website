"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, ArrowUpRight, MessageCircle, RotateCcw, Send, Sparkles, X } from "lucide-react";
import { getDemoReply, type DemoReply } from "@/lib/demo-assistant";
import { whatsapp } from "@/lib/data";
import { AssistantQuote } from "./assistant-quote";

type Message=DemoReply & {id:number;role:"assistant"|"user"};
const welcome:Message={id:0,role:"assistant",text:"Hi, I’m DCB Assist. 👋\nLooking for the right connection? Try a part number or tell me what you drive."};
const prompts=["Toyota Hilux starter","Where are your branches?","How do I get a quote?"];

export function DemoAssistant(){
  const dialog=useRef<HTMLDialogElement>(null);
  const input=useRef<HTMLInputElement>(null);
  const conversation=useRef<HTMLDivElement>(null);
  const request=useRef(0);
  const lastSearch=useRef("");
  const [open,setOpen]=useState(false);
  const [messages,setMessages]=useState<Message[]>([welcome]);
  const [draft,setDraft]=useState("");
  const [pending,setPending]=useState(false);
  const [quoteOpen,setQuoteOpen]=useState(false);
  const [quoteBusy,setQuoteBusy]=useState(false);
  useEffect(()=>{
    const startAssist=()=>{dialog.current?.showModal();setOpen(true);};
    const startQuote=()=>{dialog.current?.showModal();setOpen(true);setQuoteOpen(true);};
    window.addEventListener("dcb:assist",startAssist);
    window.addEventListener("dcb:quote",startQuote);
    return()=>{window.removeEventListener("dcb:assist",startAssist);window.removeEventListener("dcb:quote",startQuote);};
  },[]);
  useEffect(()=>{if(!open)return;const old=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{document.body.style.overflow=old;};},[open]);
  useEffect(()=>{if(open)conversation.current?.scrollTo({top:conversation.current.scrollHeight,behavior:"instant"});},[messages,pending,open]);
  function show(){dialog.current?.showModal();setOpen(true);}
  function close(){dialog.current?.close();setOpen(false);}
  function reset(){if(quoteBusy)return;setQuoteOpen(false);request.current++;setPending(false);setMessages([welcome]);setDraft("");lastSearch.current="";input.current?.focus();}
  async function send(value:string){
    const text=value.trim().slice(0,400);if(!text||pending)return;
    const id=++request.current;
    setMessages(current=>[...current.slice(-19),{id:id*2,role:"user",text}]);setDraft("");setPending(true);
    try{
      const reply=await getDemoReply(text,lastSearch.current);
      if(id!==request.current)return;
      if(reply.products?.length)lastSearch.current=text;
      setMessages(current=>[...current,{...reply,id:id*2+1,role:"assistant"}]);
    }catch{
      if(id===request.current)setMessages(current=>[...current,{id:id*2+1,role:"assistant",text:"I couldn’t load the catalogue just now. Please try again, or chat with the DCB team below.",links:[{label:"Browse the catalogue",href:"/products/"}]}]);
    }finally{if(id===request.current)setPending(false);}
  }
  function submit(event:FormEvent){event.preventDefault();void send(draft);}
  const latest=messages.filter(m=>m.role==="user").at(-1)?.text;
  return <><button className="assistant-launcher" onClick={show} aria-label="Open DCB Assist" aria-haspopup="dialog" aria-expanded={open}><span className="assistant-launcher-icon"><Sparkles size={21} /></span><span>Ask DCB<small>PARTS & QUOTES</small></span><span className="assistant-launcher-dot" /></button>
  <dialog ref={dialog} className="assistant-dialog" aria-labelledby="assistant-title" onClose={()=>setOpen(false)} onClick={event=>{if(event.target===event.currentTarget)close();}}>
    <div className="assistant-panel"><header className="assistant-header"><span className="assistant-avatar"><Sparkles size={22} /></span><div><h2 id="assistant-title">DCB Assist<span>GUIDE</span></h2><p>Your auto-electrical guide</p></div><button className="icon-button assistant-reset" onClick={reset} disabled={quoteBusy} aria-label="Start a new conversation"><RotateCcw size={17} /></button><button className="icon-button" onClick={close} aria-label="Close assistant"><X size={21} /></button></header>
    <div className="assistant-demo-note"><span />Guided support · catalogue-based replies</div>
    <div ref={conversation} className="assistant-conversation" role="log" aria-label="Assistant conversation" aria-live="polite" aria-relevant="additions" aria-busy={pending}>
      {quoteOpen ? <AssistantQuote onCancel={()=>setQuoteOpen(false)} onBusy={setQuoteBusy} /> : <>
      {messages.map(message=><article key={message.id} className={`assistant-message ${message.role}`}><span className="assistant-speaker">{message.role==="user"?"YOU":"DCB ASSIST"}</span><div className="assistant-bubble"><p>{message.text}</p>{message.products?.map(product=><Link prefetch={false} onClick={close} className="assistant-product" key={product.id} href={`/product/${product.slug}/`}>{product.image&&<Image src={product.image} alt="" width={60} height={60} />}<span><strong>{product.code||`DCB ${product.id}`}</strong><span>{product.name}</span></span><ArrowUpRight size={15} /></Link>)}{message.links&&<div className="assistant-links">{message.links.map(link=><Link key={link.href} href={link.href} onClick={close}>{link.label}<ArrowRight size={13} /></Link>)}</div>}{message.quoteOptions&&<div className="assistant-quote-choices"><a href={whatsapp("Hi DCB Spares, I would like a quote. My vehicle make and model are: ")} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} />Chat on WhatsApp<ArrowUpRight size={14} /></a><button onClick={()=>setQuoteOpen(true)}><Sparkles size={16} />Request with DCB Assist<ArrowRight size={14} /></button></div>}</div></article>)}
      {messages.length===1&&<div className="assistant-prompts"><span>A GOOD PLACE TO START</span>{prompts.map(prompt=><button key={prompt} disabled={pending} onClick={()=>void send(prompt)}>{prompt}<ArrowUpRight size={14} /></button>)}</div>}
      {pending&&<div className="assistant-loading" role="status"><span /><span /><span /><span className="sr-only">Checking the catalogue</span></div>}
      </>}
    </div>
    <footer className="assistant-compose">{!quoteOpen&&<form onSubmit={submit}><label htmlFor="assistant-message" className="sr-only">Message DCB Assist</label><input ref={input} id="assistant-message" autoComplete="off" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Ask about a part, vehicle or branch…" maxLength={400} /><button type="submit" disabled={pending||!draft.trim()} aria-label="Send message"><Send size={18} /></button></form>}<div><span>Aftermarket parts. Confirm fit with our team.</span><a href={whatsapp(latest?`Hi DCB Spares, please help with this enquiry: ${latest}`:undefined)} target="_blank" rel="noopener noreferrer"><MessageCircle size={13} />Chat with our team<ArrowUpRight size={12} /></a></div></footer></div>
  </dialog></>;
}
