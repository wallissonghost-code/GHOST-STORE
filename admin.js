const qs=id=>document.getElementById(id);
const cfg=window.GHOST_STORE_CONFIG||{};
const sbFactory=window.supabase?.createClient;
const hasConfig=Boolean(cfg.supabaseUrl&&cfg.supabasePublishableKey&&sbFactory);
const sb=hasConfig?sbFactory(cfg.supabaseUrl,cfg.supabasePublishableKey):null;
const money=value=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(value)||0);
let products=[];
let editingId=null;
let session=null;

function escapeHtml(v=''){return String(v).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}
function slugify(text){return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,64)||`produto-${Date.now()}`}
function toast(msg){const el=qs('toast');el.textContent=msg;el.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.classList.remove('show'),2400)}
function normalize(p){return {...p,price:Number(p.price)||0,meta:Array.isArray(p.meta)?p.meta:[],specs:p.specs||{},published:p.published!==false,file_path:p.file_path||''}}

function showLogin(message=''){
  qs('authScreen').classList.remove('hidden');
  qs('adminApp').classList.add('hidden');
  qs('authMessage').textContent=message;
}
function showAdmin(){
  qs('authScreen').classList.add('hidden');
  qs('adminApp').classList.remove('hidden');
  qs('adminEmail').textContent=session?.user?.email||'';
  qs('backendStatus').textContent='Supabase conectado';
  qs('settingsStatusText').textContent='Sessão autenticada e permissões protegidas por RLS.';
  qs('supabaseUrlPreview').value=cfg.supabaseUrl;
}

async function verifyAdmin(){
  if(!session?.user)return false;
  const {data,error}=await sb.from(cfg.adminsTable||'store_admins').select('user_id').eq('user_id',session.user.id).maybeSingle();
  if(error){console.error(error);return false}
  return Boolean(data);
}

async function bootstrap(){
  if(!hasConfig){showLogin('Supabase ainda não foi configurado neste projeto.');return}
  const {data:{session:current}}=await sb.auth.getSession();
  session=current;
  if(!session){showLogin();return}
  if(!(await verifyAdmin())){
    await sb.auth.signOut();session=null;showLogin('Esta conta não tem permissão de administrador.');return;
  }
  showAdmin();
  await loadProducts();
}

async function login(email,password){
  const {data,error}=await sb.auth.signInWithPassword({email,password});
  if(error)throw error;
  session=data.session;
  if(!(await verifyAdmin())){
    await sb.auth.signOut();session=null;throw new Error('Conta autenticada, mas sem permissão de administrador.');
  }
  showAdmin();await loadProducts();
}

async function loadProducts(){
  const {data,error}=await sb.from(cfg.productsTable||'products').select('*').order('created_at',{ascending:false});
  if(error){console.error(error);toast('Não foi possível carregar os produtos');return}
  products=(data||[]).map(normalize);render();
}

function render(){
  qs('statProducts').textContent=products.length;
  qs('statPublished').textContent=products.filter(p=>p.published).length;
  qs('statExclusive').textContent=products.filter(p=>(p.badge||'').toLowerCase().includes('exclus')).length;
  qs('statValue').textContent=money(products.reduce((s,p)=>s+p.price,0));
  qs('adminEmpty').classList.toggle('hidden',products.length>0);
  qs('productTableBody').innerHTML=products.map(p=>`<tr><td><div class="product-cell"><span class="product-mini-icon" style="box-shadow:inset 0 0 0 1px ${escapeHtml(p.color)}55">${escapeHtml(p.icon||'BOX')}</span><div><strong>${escapeHtml(p.name)}</strong><br><small>${escapeHtml(p.type||'')}</small></div></div></td><td>${escapeHtml(p.category||'')}</td><td>${money(p.price)}</td><td><span class="status-dot ${p.published?'':'draft'}">${p.published?'Publicado':'Rascunho'}</span></td><td><div class="table-actions"><button data-edit="${escapeHtml(p.id)}">Editar</button></div></td></tr>`).join('');
  document.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>openEditor(b.dataset.edit)));
}

function openEditor(id=null){
  editingId=id;const p=id?products.find(x=>x.id===id):null;
  qs('editorTitle').textContent=p?'Editar produto':'Novo produto';
  qs('deleteProductButton').classList.toggle('hidden',!p);
  qs('productId').value=p?.id||'';qs('productName').value=p?.name||'';qs('productCategory').value=p?.category||'Sites';qs('productType').value=p?.type||'';qs('productPrice').value=p?.price??'';qs('productBadge').value=p?.badge||'';qs('productIcon').value=p?.icon||'';qs('productColor').value=p?.color||'#d8ff3f';qs('productPublished').value=String(p?.published!==false);qs('productDescription').value=p?.description||'';qs('productMeta').value=(p?.meta||[]).join(', ');qs('specDelivery').value=p?.specs?.Entrega||'';qs('specLicense').value=p?.specs?.Licença||'';qs('specCode').value=p?.specs?.Código||'';qs('specSupport').value=p?.specs?.Suporte||'';qs('productFilePath').value=p?.file_path||'';qs('productFile').value='';qs('uploadHint').textContent=p?.file_path?'Arquivo atual mantido até você escolher outro.':'Escolha um arquivo para enviar ao bucket privado.';
  qs('productEditor').classList.remove('hidden');document.body.classList.add('no-scroll');
}
function closeEditor(){qs('productEditor').classList.add('hidden');document.body.classList.remove('no-scroll');editingId=null}

function formProduct(){
  const current=editingId?products.find(p=>p.id===editingId):null;
  return {id:current?.id||slugify(qs('productName').value),name:qs('productName').value.trim(),category:qs('productCategory').value,type:qs('productType').value.trim(),badge:qs('productBadge').value.trim(),price:Number(qs('productPrice').value)||0,icon:qs('productIcon').value.trim()||'BOX',description:qs('productDescription').value.trim(),meta:qs('productMeta').value.split(',').map(v=>v.trim()).filter(Boolean),specs:{Entrega:qs('specDelivery').value.trim(),Licença:qs('specLicense').value.trim(),Código:qs('specCode').value.trim(),Suporte:qs('specSupport').value.trim()},color:qs('productColor').value,published:qs('productPublished').value==='true',file_path:qs('productFilePath').value.trim()};
}

async function uploadSelectedFile(productId){
  const file=qs('productFile').files?.[0];
  if(!file)return qs('productFilePath').value.trim();
  const ext=(file.name.split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,'');
  const safeName=`${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/,''))}.${ext}`;
  const path=`products/${productId}/${safeName}`;
  qs('uploadHint').textContent='Enviando arquivo privado...';
  const {error}=await sb.storage.from(cfg.storageBucket||'product-files').upload(path,file,{upsert:false,cacheControl:'3600'});
  if(error)throw error;
  qs('productFilePath').value=path;
  qs('uploadHint').textContent='Upload concluído no bucket privado.';
  return path;
}

async function persistProduct(product){
  const {error}=await sb.from(cfg.productsTable||'products').upsert(product,{onConflict:'id'});
  if(error)throw error;
}

async function removeProduct(id){
  const p=products.find(x=>x.id===id);
  if(p?.file_path){
    const {error:fileError}=await sb.storage.from(cfg.storageBucket||'product-files').remove([p.file_path]);
    if(fileError)console.warn('Arquivo não removido:',fileError.message);
  }
  const {error}=await sb.from(cfg.productsTable||'products').delete().eq('id',id);
  if(error)throw error;
}

qs('loginForm').addEventListener('submit',async e=>{
  e.preventDefault();if(!hasConfig){qs('authMessage').textContent='Configure o Supabase primeiro.';return}
  const button=qs('loginButton');button.disabled=true;button.textContent='Entrando...';qs('authMessage').textContent='';
  try{await login(qs('loginEmail').value.trim(),qs('loginPassword').value)}catch(err){console.error(err);showLogin(err.message||'Falha no login')}finally{button.disabled=false;button.textContent='Entrar'}
});
qs('logoutButton').addEventListener('click',async()=>{await sb.auth.signOut();session=null;products=[];showLogin()});
qs('newProductButton').addEventListener('click',()=>openEditor());qs('closeEditor').addEventListener('click',closeEditor);qs('cancelEditor').addEventListener('click',closeEditor);qs('productEditor').addEventListener('click',e=>{if(e.target===qs('productEditor'))closeEditor()});
qs('productForm').addEventListener('submit',async e=>{
  e.preventDefault();const button=qs('saveProductButton');button.disabled=true;button.textContent='Salvando...';
  try{const p=formProduct();p.file_path=await uploadSelectedFile(p.id);await persistProduct(p);toast('Produto salvo com segurança');closeEditor();await loadProducts()}catch(err){console.error(err);toast(err.message||'Não foi possível salvar o produto')}finally{button.disabled=false;button.textContent='Salvar produto'}
});
qs('deleteProductButton').addEventListener('click',async()=>{if(!editingId||!confirm('Excluir este produto e o arquivo privado associado?'))return;try{await removeProduct(editingId);toast('Produto excluído');closeEditor();await loadProducts()}catch(err){console.error(err);toast('Não foi possível excluir')}});
document.querySelectorAll('[data-admin-tab]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-admin-tab]').forEach(x=>x.classList.toggle('active',x===btn));document.querySelectorAll('.admin-tab').forEach(x=>x.classList.add('hidden'));qs(`tab-${btn.dataset.adminTab}`).classList.remove('hidden')}));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!qs('productEditor').classList.contains('hidden'))closeEditor()});
if(sb)sb.auth.onAuthStateChange((_event,newSession)=>{session=newSession});
bootstrap();
