const modal=document.querySelector('#photo-dialog');
const modalImg=document.querySelector('#modal-image');
const title=document.querySelector('#modal-title');
const credit=document.querySelector('#modal-credit');
let opener=null;
for(const button of document.querySelectorAll('[data-photo]')){
 button.addEventListener('click',()=>{opener=button;const img=button.querySelector('img');modalImg.src=img.src;modalImg.alt=img.alt;title.textContent=button.dataset.title;credit.replaceChildren();credit.append(document.createTextNode(button.dataset.credit+' · 实地参考，不是本项目渲染。'));const source=document.createElement('a');source.href=button.dataset.source;source.textContent='来源页面';source.target='_blank';source.rel='noopener noreferrer';const license=document.createElement('a');license.href=button.dataset.license;license.textContent='许可';license.target='_blank';license.rel='noopener noreferrer';credit.append(source,license);modal.showModal();});
}
document.querySelector('#close-dialog').addEventListener('click',()=>modal.close());
modal.addEventListener('click',event=>{if(event.target===modal){const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)modal.close();}});
modal.addEventListener('close',()=>{modalImg.removeAttribute('src');opener?.focus();});
