const products=[
{id:1,name:"Essential Oversized Tee",cat:"Men",price:899,img:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80",tag:"BESTSELLER"},
{id:2,name:"Relaxed Linen Shirt",cat:"Men",price:1499,img:"https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=700&q=80",tag:"NEW"},
{id:3,name:"Minimal Everyday Dress",cat:"Women",price:1899,img:"https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=700&q=80",tag:""},
{id:4,name:"Classic Street Sneakers",cat:"Footwear",price:2299,img:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80",tag:""},
{id:5,name:"Structured Tote Bag",cat:"Accessories",price:1199,img:"https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=80",tag:""},
{id:6,name:"Everyday Denim",cat:"Women",price:1699,img:"https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=700&q=80",tag:""},
{id:7,name:"Modern Chrono Watch",cat:"Accessories",price:1999,img:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80",tag:""},
{id:8,name:"Low Profile Trainers",cat:"Footwear",price:2499,img:"https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=700&q=80",tag:""}
];
let cart=[];
const money=n=>"₹"+n.toLocaleString("en-IN");
function renderProducts(filter="All"){document.getElementById("products").innerHTML=products.filter(p=>filter==="All"||p.cat===filter).map(p=>`<article class="product-card"><div class="product-image"><img src="${p.img}" alt="${p.name}" loading="lazy">${p.tag?`<span class="tag">${p.tag}</span>`:""}</div><div class="product-info"><div><h3>${p.name}</h3><p>${p.cat}</p></div><span class="price">${money(p.price)}</span></div><button class="add" onclick="addToCart(${p.id})">ADD TO BAG +</button></article>`).join("")}
function updateCart(){let count=cart.reduce((s,x)=>s+x.qty,0),total=cart.reduce((s,x)=>s+x.price*x.qty,0);document.getElementById("cartCount").textContent=count;document.getElementById("drawerCount").textContent=`(${count})`;document.getElementById("subtotal").textContent=money(total);document.getElementById("cartItems").innerHTML=cart.length?cart.map(x=>`<div class="cart-row"><span>${x.name}<br><small>Qty: ${x.qty}</small></span><span>${money(x.price*x.qty)}<br><button onclick="removeItem(${x.id})">REMOVE</button></span></div>`).join(""):'<p class="empty">Your bag is waiting for something good.</p>'}
function addToCart(id){let p=products.find(x=>x.id===id),item=cart.find(x=>x.id===id);item?item.qty++:cart.push({...p,qty:1});updateCart();document.body.classList.add("cart-open")}
function removeItem(id){cart=cart.filter(x=>x.id!==id);updateCart()}
document.querySelectorAll(".filter").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderProducts(b.dataset.filter)}));
document.querySelectorAll(".collection-card").forEach(c=>c.addEventListener("click",()=>{let f=c.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x.dataset.filter===f));renderProducts(f)}));
const open=()=>document.body.classList.add("cart-open"),close=()=>document.body.classList.remove("cart-open");
document.getElementById("openCart").onclick=open;document.getElementById("closeCart").onclick=close;document.getElementById("scrim").onclick=close;
document.getElementById("checkout").onclick=()=>{if(!cart.length){alert("Your bag is empty.");return}let lines=cart.map(x=>`${x.name} x ${x.qty} — ${money(x.price*x.qty)}`).join("%0A"),total=cart.reduce((s,x)=>s+x.price*x.qty,0);let msg=`Hello RAM FASHION! I would like to place an order:%0A${lines}%0A%0ATotal: ${money(total)}%0APlease share payment and delivery details.`;window.open(`https://wa.me/918208270317?text=${msg}`,"_blank")};
document.getElementById("newsletterForm").addEventListener("submit",e=>{e.preventDefault();alert("Thank you for subscribing! Newsletter signup needs an email service connection before launch.");e.target.reset()});
renderProducts();updateCart();