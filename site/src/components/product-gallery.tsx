"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [selected,setSelected] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  if(!images.length) return <div className="gallery-main">No photograph supplied for this product.</div>;
  function move(direction: number) {setSelected(current => (current+direction+images.length)%images.length);}
  return <div className="product-gallery"><button className="gallery-main" aria-label="Enlarge product photograph" onClick={() => dialog.current?.showModal()}><Image src={images[selected]} alt={`${name} — view ${selected+1}`} width={1000} height={1000} priority /><span className="gallery-expand"><Expand size={17} />Enlarge</span></button><div className="gallery-bottom"><span>{String(selected+1).padStart(2,"0")} / {String(images.length).padStart(2,"0")}</span><span>ORIGINAL PRODUCT PHOTOGRAPHY</span></div>{images.length>1 && <div className="gallery-thumbnails" aria-label="Product photographs">{images.map((src,index) => <button key={src} aria-label={`Show product view ${index+1}`} aria-pressed={selected===index} onClick={() => setSelected(index)}><Image src={src} alt={`Product view ${index+1}`} width={100} height={100} loading="lazy" /></button>)}</div>}<dialog ref={dialog} className="gallery-dialog" aria-label="Enlarged product photograph" onClick={e => {if(e.target===e.currentTarget)dialog.current?.close();}} onKeyDown={e => {if(e.key==="ArrowRight")move(1);if(e.key==="ArrowLeft")move(-1);}}><div><button className="icon-button gallery-close" onClick={() => dialog.current?.close()} aria-label="Close photograph"><X /></button><Image src={images[selected]} alt={`${name} — view ${selected+1}`} width={1200} height={1200} />{images.length>1 && <div className="gallery-modal-controls"><button className="icon-button" onClick={() => move(-1)} aria-label="Previous photograph"><ChevronLeft /></button><span>{selected+1} / {images.length}</span><button className="icon-button" onClick={() => move(1)} aria-label="Next photograph"><ChevronRight /></button></div>}</div></dialog></div>;
}
