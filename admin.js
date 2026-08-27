const DEFAULT_PRODUCTS = [
  {id:'ghost-market',name:'Marketplace Premium',category:'Sites',type:'SITE + PAINEL',badge:'EXCLUSIVO',price:249,icon:'WEB',description:'Loja digital moderna com catálogo, carrinho, páginas de produto e base pronta para checkout.',meta:['HTML/CSS/JS','Responsivo','Editável'],specs:{Entrega:'ZIP',Licença:'Comercial',Código:'Incluído',Suporte:'Instalação'},color:'#d8ff3f',published:true,file_path:''},
  {id:'live-hud',name:'HUD Interativo para Lives',category:'Sistemas',type:'SISTEMA',badge:'PRONTO PARA USAR',price:179,icon:'HUD',description:'Interface para jogos e lives com slots de eventos, placar, comandos e estrutura para integração em tempo real.',meta:['Web','Realtime-ready','Painel'],specs:{Entrega:'ZIP',Licença:'Comercial',Código:'Incluído',Suporte:'Web App'},color:'#54d9ff',published:true,file_path:''},
  {id:'knight-pack',name:'Knight Character Pack',category:'GLB / 3D',type:'MODELO 3D',badge:'GLB',price:69,icon:'3D',description:'Pacote de personagem 3D para protótipos e jogos, organizado para importação em engines compatíveis.',meta:['.GLB','Game Asset','3D'],specs:{Entrega:'GLB',Licença:'Comercial',Código:'Rig: consultar',Suporte:'Texturas incluídas'},color:'#ac80ff',published:true,file_path:''},
  {id:'sprite-pack',name:'Sprite Combat Pack',category:'Assets',type:'SPRITES',badge:'PNG',price:49,icon:'PNG',description:'Conjunto de sprites organizados para jogos 2D, HUDs e protótipos interativos.',meta:['PNG','2D','Game Ready'],specs:{Entrega:'ZIP',Licença:'Comercial',Código:'Fundo transparente',Suporte:'Jogos 2D'},color:'#ff866e',published:true,file_path:''},
  {id:'source-system',name:'Sistema Web Source Pack',category:'ZIPs',type:'CÓDIGO-FONTE',badge:'EDITÁVEL',price:99,icon:'ZIP',description:'Base de sistema web organizada para adaptar, personalizar e evoluir em novos projetos.',meta:['Source','ZIP','Código'],specs:{Entrega:'ZIP',Licença:'Comercial',Código:'100%',Suporte:'Web'},color:'#ffc95b',published:true,file_path:''},
  {id:'startup-blueprint',name:'Blueprint de Produto Digital',category:'Ideias',type:'IDEIA + PLANO',badge:'CONCEITO',price:39,icon:'IDEA',description:'Conceito estruturado com proposta, público, monetização, MVP e próximos passos para execução.',meta:['PDF','Estratégia','MVP'],specs:{Entrega:'Documento',Licença:'Uso próprio',Código:'Roadmap',Suporte:'Digital'},color:'#7affbb',published:true,file_path:''}
];

const qs=id=>document.getElementById(id);
const cfg=window.GHOST_STORE_CONFIG||{};
const useSupabase=Boolean(cfg.supabaseUrl&&cfg.supabaseAnonKey);
const money=value=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(value)||0);
let products=[];
let editingId=null;

function headers(){return {'apikey':cfg.supabaseAnonKey,'Authorization':`Bearer ${cfg.supabaseAnonKey}`,'Content-Type':'application/json','Prefer':'return=representation'}}
function endpoint(){return `${cfg.supabaseUrl}/rest/v1/${cfg.productsTable||'products'}`}
function normalize(p){return {...p,price:Number(p.price)||0,meta:Array.isArray(p.meta)?p.meta:[],specs:p.specs||{},published:p.published!==false,file_path:p.file_path||''}}
function localLoad(){const raw=localStorage.getItem('ghostStoreProducts');if(raw){try{return JSON.parse(raw).map(normalize)}catch(e){}}localStorage.setItem('ghostStoreProducts',JSON.stringify(DEFAULT_PRODUCTS));return DEFAULT_PRODUCTS.map(normalize)}
function localSave(){localStorage.setItem('ghostStoreProducts',JSON.stringify(products))}

async function loadProducts(){
  if(useSupabase){
    try{const res=await fetch(`${endpoint()}?select=*&order=created_at.desc`,{headers:headers()});if(!res.ok)throw new Error(await res.text());products=(await res.json()).map(normalize);setStatus(true);render();return}catch(err){console.error(err);toast('Supabase indisponível; usando modo local')}
  }
  products=localLoad();setStatus(false);render();
}

function setStatus(online){
  qs('backendStatus').textContent=online?'Supabase conectado':'Modo local';
  qs('settingsStatusText').textContent=online?'Produtos sincronizados com Supabase.':'A loja está funcionando em modo local neste navegador.';
  qs('supabaseUrlPreview').value=cfg.supabaseUrl||'Não configurado';
}

function render(){
  qs('statProducts').textContent=products.length;
  qs('statPublished').textContent=products.filter(p=>p.published).length;
  qs('statExclusive').textContent=products.filter(p=>(p.badge||'').toLowerCase().includes('exclus')).length;
  qs('statValue').textContent=money(products.reduce((s,p)=>s+p.price,0));
  qs('adminEmpty').classList.toggle('hidden',products.length>0);
  qs('productTableBody').innerHTML=products.map(p=>`<tr><td><div class="product-cell"><span class="product-mini-icon" style="box-shadow:inset 0 0 0 1px ${p.color}55">${escapeHtml(p.icon||'BOX')}</span><div><strong>${escapeHtml(p.name)}</strong><br><small>${escapeHtml(p.type||'')}</small></div></div></td><td>${escapeHtml(p.category||'')}</td><td>${money(p.price)}</td><td><span class="status-dot ${p.published?'':'draft'}">${p.published?'Publicado':'Rascunho'}</span></td><td><div class="table-actions"><button data-edit="${p.id}">Editar</button></div></td></tr>`).join('');
  document.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>openEditor(b.dataset.edit)));
}

function slugify(text){return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,64)||`produto-${Date.now()}`}
function escapeHtml(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function toast(msg){const el=qs('toast');el.textContent=msg;el.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.classList.remove('show'),2400)}

function openEditor(id=null){
  editingId=id;const p=id?products.find(x=>x.id===id):null;
  qs('editorTitle').textContent=p?'Editar produto':'Novo produto';
  qs('deleteProductButton').classList.toggle('hidden',!p);
  qs('productId').value=p?.id||'';qs('productName').value=p?.name||'';qs('productCategory').value=p?.category||'Sites';qs('productType').value=p?.type||'';qs('productPrice').value=p?.price??'';qs('productBadge').value=p?.badge||'';qs('productIcon').value=p?.icon||'';qs('productColor').value=p?.color||'#d8ff3f';qs('productPublished').value=String(p?.published!==false);qs('productDescription').value=p?.description||'';qs('productMeta').value=(p?.meta||[]).join(', ');qs('specDelivery').value=p?.specs?.Entrega||'';qs('specLicense').value=p?.specs?.Licença||'';qs('specCode').value=p?.specs?.Código||'';qs('specSupport').value=p?.specs?.Suporte||'';qs('productFilePath').value=p?.file_path||'';
  qs('productEditor').classList.remove('hidden');document.body.classList.add('no-scroll');
}
function closeEditor(){qs('productEditor').classList.add('hidden');document.body.classList.remove('no-scroll');editingId=null}

function formProduct(){
  const current=editingId?products.find(p=>p.id===editingId):null;
  return {id:current?.id||slugify(qs('productName').value),name:qs('productName').value.trim(),category:qs('productCategory').value,type:qs('productType').value.trim(),badge:qs('productBadge').value.trim(),price:Number(qs('productPrice').value)||0,icon:qs('productIcon').value.trim()||'BOX',description:qs('productDescription').value.trim(),meta:qs('productMeta').value.split(',').map(v=>v.trim()).filter(Boolean),specs:{Entrega:qs('specDelivery').value.trim(),Licença:qs('specLicense').value.trim(),Código:qs('specCode').value.trim(),Suporte:qs('specSupport').value.trim()},color:qs('productColor').value,published:qs('productPublished').value==='true',file_path:qs('productFilePath').value.trim()};
}

async function persistProduct(product){
  if(useSupabase){
    const exists=products.some(p=>p.id===product.id);const url=exists?`${endpoint()}?id=eq.${encodeURIComponent(product.id)}`:endpoint();const res=await fetch(url,{method:exists?'PATCH':'POST',headers:headers(),body:JSON.stringify(product)});if(!res.ok)throw new Error(await res.text());return;
  }
  const i=products.findIndex(p=>p.id===product.id);if(i>=0)products[i]=product;else products.unshift(product);localSave();
}

async function removeProduct(id){
  if(useSupabase){const res=await fetch(`${endpoint()}?id=eq.${encodeURIComponent(id)}`,{method:'DELETE',headers:headers()});if(!res.ok)throw new Error(await res.text())}
  else{products=products.filter(p=>p.id!==id);localSave()}
}

qs('newProductButton').addEventListener('click',()=>openEditor());qs('closeEditor').addEventListener('click',closeEditor);qs('cancelEditor').addEventListener('click',closeEditor);qs('productEditor').addEventListener('click',e=>{if(e.target===qs('productEditor'))closeEditor()});
qs('productForm').addEventListener('submit',async e=>{e.preventDefault();const p=formProduct();try{await persistProduct(p);toast('Produto salvo');closeEditor();await loadProducts()}catch(err){console.error(err);toast('Não foi possível salvar o produto')}});
qs('deleteProductButton').addEventListener('click',async()=>{if(!editingId||!confirm('Excluir este produto?'))return;try{await removeProduct(editingId);toast('Produto excluído');closeEditor();await loadProducts()}catch(err){console.error(err);toast('Não foi possível excluir')}});

document.querySelectorAll('[data-admin-tab]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-admin-tab]').forEach(x=>x.classList.toggle('active',x===btn));document.querySelectorAll('.admin-tab').forEach(x=>x.classList.add('hidden'));qs(`tab-${btn.dataset.adminTab}`).classList.remove('hidden')}));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeEditor()});
loadProducts();
