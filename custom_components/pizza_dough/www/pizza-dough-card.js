var Q=globalThis,ee=Q.ShadowRoot&&(Q.ShadyCSS===void 0||Q.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,ce=Symbol(),Re=new WeakMap,I=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==ce)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(ee&&t===void 0){let s=e!==void 0&&e.length===1;s&&(t=Re.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&Re.set(e,t))}return t}toString(){return this.cssText}},De=i=>new I(typeof i=="string"?i:i+"",void 0,ce),P=(i,...t)=>{let e=i.length===1?i[0]:t.reduce((s,n,r)=>s+(a=>{if(a._$cssResult$===!0)return a.cssText;if(typeof a=="number")return a;throw Error("Value passed to 'css' function must be a 'css' function result: "+a+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(n)+i[r+1],i[0]);return new I(e,i,ce)},He=(i,t)=>{if(ee)i.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let s=document.createElement("style"),n=Q.litNonce;n!==void 0&&s.setAttribute("nonce",n),s.textContent=e.cssText,i.appendChild(s)}},he=ee?i=>i:i=>i instanceof CSSStyleSheet?(t=>{let e="";for(let s of t.cssRules)e+=s.cssText;return De(e)})(i):i;var{is:pt,defineProperty:ut,getOwnPropertyDescriptor:mt,getOwnPropertyNames:gt,getOwnPropertySymbols:ft,getPrototypeOf:bt}=Object,te=globalThis,Oe=te.trustedTypes,_t=Oe?Oe.emptyScript:"",$t=te.reactiveElementPolyfillSupport,U=(i,t)=>i,de={toAttribute(i,t){switch(t){case Boolean:i=i?_t:null;break;case Object:case Array:i=i==null?i:JSON.stringify(i)}return i},fromAttribute(i,t){let e=i;switch(t){case Boolean:e=i!==null;break;case Number:e=i===null?null:Number(i);break;case Object:case Array:try{e=JSON.parse(i)}catch{e=null}}return e}},Le=(i,t)=>!pt(i,t),Ne={attribute:!0,type:String,converter:de,reflect:!1,useDefault:!1,hasChanged:Le};Symbol.metadata??=Symbol("metadata"),te.litPropertyMetadata??=new WeakMap;var S=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=Ne){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){let s=Symbol(),n=this.getPropertyDescriptor(t,s,e);n!==void 0&&ut(this.prototype,t,n)}}static getPropertyDescriptor(t,e,s){let{get:n,set:r}=mt(this.prototype,t)??{get(){return this[e]},set(a){this[e]=a}};return{get:n,set(a){let l=n?.call(this);r?.call(this,a),this.requestUpdate(t,l,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??Ne}static _$Ei(){if(this.hasOwnProperty(U("elementProperties")))return;let t=bt(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(U("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(U("properties"))){let e=this.properties,s=[...gt(e),...ft(e)];for(let n of s)this.createProperty(n,e[n])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[s,n]of e)this.elementProperties.set(s,n)}this._$Eh=new Map;for(let[e,s]of this.elementProperties){let n=this._$Eu(e,s);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let s=new Set(t.flat(1/0).reverse());for(let n of s)e.unshift(he(n))}else t!==void 0&&e.push(he(t));return e}static _$Eu(t,e){let s=e.attribute;return s===!1?void 0:typeof s=="string"?s:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,e=this.constructor.elementProperties;for(let s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return He(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){let s=this.constructor.elementProperties.get(t),n=this.constructor._$Eu(t,s);if(n!==void 0&&s.reflect===!0){let r=(s.converter?.toAttribute!==void 0?s.converter:de).toAttribute(e,s.type);this._$Em=t,r==null?this.removeAttribute(n):this.setAttribute(n,r),this._$Em=null}}_$AK(t,e){let s=this.constructor,n=s._$Eh.get(t);if(n!==void 0&&this._$Em!==n){let r=s.getPropertyOptions(n),a=typeof r.converter=="function"?{fromAttribute:r.converter}:r.converter?.fromAttribute!==void 0?r.converter:de;this._$Em=n;let l=a.fromAttribute(e,r.type);this[n]=l??this._$Ej?.get(n)??l,this._$Em=null}}requestUpdate(t,e,s,n=!1,r){if(t!==void 0){let a=this.constructor;if(n===!1&&(r=this[t]),s??=a.getPropertyOptions(t),!((s.hasChanged??Le)(r,e)||s.useDefault&&s.reflect&&r===this._$Ej?.get(t)&&!this.hasAttribute(a._$Eu(t,s))))return;this.C(t,e,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:n,wrapped:r},a){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,a??e??this[t]),r!==!0||a!==void 0)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),n===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[n,r]of this._$Ep)this[n]=r;this._$Ep=void 0}let s=this.constructor.elementProperties;if(s.size>0)for(let[n,r]of s){let{wrapped:a}=r,l=this[n];a!==!0||this._$AL.has(n)||l===void 0||this.C(n,void 0,r,l)}}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(e)):this._$EM()}catch(s){throw t=!1,this._$EM(),s}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(t){}firstUpdated(t){}};S.elementStyles=[],S.shadowRootOptions={mode:"open"},S[U("elementProperties")]=new Map,S[U("finalized")]=new Map,$t?.({ReactiveElement:S}),(te.reactiveElementVersions??=[]).push("2.1.2");var _e=globalThis,Ie=i=>i,se=_e.trustedTypes,Ue=se?se.createPolicy("lit-html",{createHTML:i=>i}):void 0,Ve="$lit$",w=`lit$${Math.random().toFixed(9).slice(2)}$`,We="?"+w,yt=`<${We}>`,C=document,B=()=>C.createComment(""),K=i=>i===null||typeof i!="object"&&typeof i!="function",$e=Array.isArray,vt=i=>$e(i)||typeof i?.[Symbol.iterator]=="function",pe=`[ 	
\f\r]`,F=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Fe=/-->/g,Be=/>/g,T=RegExp(`>|${pe}(?:([^\\s"'>=/]+)(${pe}*=${pe}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Ke=/'/g,je=/"/g,Ye=/^(?:script|style|textarea|title)$/i,ye=i=>(t,...e)=>({_$litType$:i,strings:t,values:e}),h=ye(1),Lt=ye(2),It=ye(3),M=Symbol.for("lit-noChange"),c=Symbol.for("lit-nothing"),Ge=new WeakMap,k=C.createTreeWalker(C,129);function qe(i,t){if(!$e(i)||!i.hasOwnProperty("raw"))throw Error("invalid template strings array");return Ue!==void 0?Ue.createHTML(t):t}var xt=(i,t)=>{let e=i.length-1,s=[],n,r=t===2?"<svg>":t===3?"<math>":"",a=F;for(let l=0;l<e;l++){let o=i[l],d,g,p=-1,u=0;for(;u<o.length&&(a.lastIndex=u,g=a.exec(o),g!==null);)u=a.lastIndex,a===F?g[1]==="!--"?a=Fe:g[1]!==void 0?a=Be:g[2]!==void 0?(Ye.test(g[2])&&(n=RegExp("</"+g[2],"g")),a=T):g[3]!==void 0&&(a=T):a===T?g[0]===">"?(a=n??F,p=-1):g[1]===void 0?p=-2:(p=a.lastIndex-g[2].length,d=g[1],a=g[3]===void 0?T:g[3]==='"'?je:Ke):a===je||a===Ke?a=T:a===Fe||a===Be?a=F:(a=T,n=void 0);let m=a===T&&i[l+1].startsWith("/>")?" ":"";r+=a===F?o+yt:p>=0?(s.push(d),o.slice(0,p)+Ve+o.slice(p)+w+m):o+w+(p===-2?l:m)}return[qe(i,r+(i[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),s]},j=class i{constructor({strings:t,_$litType$:e},s){let n;this.parts=[];let r=0,a=0,l=t.length-1,o=this.parts,[d,g]=xt(t,e);if(this.el=i.createElement(d,s),k.currentNode=this.el.content,e===2||e===3){let p=this.el.content.firstChild;p.replaceWith(...p.childNodes)}for(;(n=k.nextNode())!==null&&o.length<l;){if(n.nodeType===1){if(n.hasAttributes())for(let p of n.getAttributeNames())if(p.endsWith(Ve)){let u=g[a++],m=n.getAttribute(p).split(w),y=/([.?@])?(.*)/.exec(u);o.push({type:1,index:r,name:y[2],strings:m,ctor:y[1]==="."?me:y[1]==="?"?ge:y[1]==="@"?fe:H}),n.removeAttribute(p)}else p.startsWith(w)&&(o.push({type:6,index:r}),n.removeAttribute(p));if(Ye.test(n.tagName)){let p=n.textContent.split(w),u=p.length-1;if(u>0){n.textContent=se?se.emptyScript:"";for(let m=0;m<u;m++)n.append(p[m],B()),k.nextNode(),o.push({type:2,index:++r});n.append(p[u],B())}}}else if(n.nodeType===8)if(n.data===We)o.push({type:2,index:r});else{let p=-1;for(;(p=n.data.indexOf(w,p+1))!==-1;)o.push({type:7,index:r}),p+=w.length-1}r++}}static createElement(t,e){let s=C.createElement("template");return s.innerHTML=t,s}};function D(i,t,e=i,s){if(t===M)return t;let n=s!==void 0?e._$Co?.[s]:e._$Cl,r=K(t)?void 0:t._$litDirective$;return n?.constructor!==r&&(n?._$AO?.(!1),r===void 0?n=void 0:(n=new r(i),n._$AT(i,e,s)),s!==void 0?(e._$Co??=[])[s]=n:e._$Cl=n),n!==void 0&&(t=D(i,n._$AS(i,t.values),n,s)),t}var ue=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:e},parts:s}=this._$AD,n=(t?.creationScope??C).importNode(e,!0);k.currentNode=n;let r=k.nextNode(),a=0,l=0,o=s[0];for(;o!==void 0;){if(a===o.index){let d;o.type===2?d=new G(r,r.nextSibling,this,t):o.type===1?d=new o.ctor(r,o.name,o.strings,this,t):o.type===6&&(d=new be(r,this,t)),this._$AV.push(d),o=s[++l]}a!==o?.index&&(r=k.nextNode(),a++)}return k.currentNode=C,n}p(t){let e=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}},G=class i{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,n){this.type=2,this._$AH=c,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=n,this._$Cv=n?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=D(this,t,e),K(t)?t===c||t==null||t===""?(this._$AH!==c&&this._$AR(),this._$AH=c):t!==this._$AH&&t!==M&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):vt(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==c&&K(this._$AH)?this._$AA.nextSibling.data=t:this.T(C.createTextNode(t)),this._$AH=t}$(t){let{values:e,_$litType$:s}=t,n=typeof s=="number"?this._$AC(t):(s.el===void 0&&(s.el=j.createElement(qe(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===n)this._$AH.p(e);else{let r=new ue(n,this),a=r.u(this.options);r.p(e),this.T(a),this._$AH=r}}_$AC(t){let e=Ge.get(t.strings);return e===void 0&&Ge.set(t.strings,e=new j(t)),e}k(t){$e(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,s,n=0;for(let r of t)n===e.length?e.push(s=new i(this.O(B()),this.O(B()),this,this.options)):s=e[n],s._$AI(r),n++;n<e.length&&(this._$AR(s&&s._$AB.nextSibling,n),e.length=n)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){let s=Ie(t).nextSibling;Ie(t).remove(),t=s}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},H=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,n,r){this.type=1,this._$AH=c,this._$AN=void 0,this.element=t,this.name=e,this._$AM=n,this.options=r,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=c}_$AI(t,e=this,s,n){let r=this.strings,a=!1;if(r===void 0)t=D(this,t,e,0),a=!K(t)||t!==this._$AH&&t!==M,a&&(this._$AH=t);else{let l=t,o,d;for(t=r[0],o=0;o<r.length-1;o++)d=D(this,l[s+o],e,o),d===M&&(d=this._$AH[o]),a||=!K(d)||d!==this._$AH[o],d===c?t=c:t!==c&&(t+=(d??"")+r[o+1]),this._$AH[o]=d}a&&!n&&this.j(t)}j(t){t===c?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},me=class extends H{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===c?void 0:t}},ge=class extends H{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==c)}},fe=class extends H{constructor(t,e,s,n,r){super(t,e,s,n,r),this.type=5}_$AI(t,e=this){if((t=D(this,t,e,0)??c)===M)return;let s=this._$AH,n=t===c&&s!==c||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,r=t!==c&&(s===c||n);n&&this.element.removeEventListener(this.name,this,s),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},be=class{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){D(this,t)}};var At=_e.litHtmlPolyfillSupport;At?.(j,G),(_e.litHtmlVersions??=[]).push("3.3.3");var Je=(i,t,e)=>{let s=e?.renderBefore??t,n=s._$litPart$;if(n===void 0){let r=e?.renderBefore??null;s._$litPart$=n=new G(t.insertBefore(B(),r),r,void 0,e??{})}return n._$AI(i),n};var ve=globalThis,v=class extends S{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=Je(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return M}};v._$litElement$=!0,v.finalized=!0,ve.litElementHydrateSupport?.({LitElement:v});var St=ve.litElementPolyfillSupport;St?.({LitElement:v});(ve.litElementVersions??=[]).push("4.2.2");function xe(i,t){try{let e=localStorage.getItem(i);return e?{...t,...JSON.parse(e)}:t}catch{return t}}function Ae(i,t){try{t===null?localStorage.removeItem(i):localStorage.setItem(i,JSON.stringify(t))}catch{}}var wt=[[0,.13],[2,.17],[4,.21],[6,.26],[8,.31],[10,.36],[12,.42],[14,.48],[16,.55],[18,.64],[20,.74],[22,.86],[24,1],[26,1.16],[28,1.33],[30,1.5],[32,1.65],[35,1.85]],Et=7.93,Pt=1.5,Tt=206,kt=1,Se={min:.02,max:3},we={min:2,max:30},Ee={fresh:1,active_dry:.4,instant:.33},Ct={weak:1.3,normal:1,strong:.75};function Ze(i){let t=wt;if(i<=t[0][0])return t[0][1];let e=t[t.length-1];if(i>=e[0])return e[1];for(let s=1;s<t.length;s++){let[n,r]=t[s];if(i<=n){let[a,l]=t[s-1];return l+(r-l)*(i-a)/(n-a)}}return e[1]}function ne(i){return i.reduce((t,e)=>t+Math.max(0,e.hours)*Ze(e.tempC),0)}var Xe=(i,t,e)=>Math.min(e,Math.max(t,i));function Qe(i,t=1){let e=ne(i);if(e<=0)return Se.max;let s=Et/Math.pow(e,Pt)*t;return Xe(s,Se.min,Se.max)}function et(i,t="normal",e=1){let s=ne(i);if(s<=0)return we.max;let n=Tt/Math.pow(s,kt)*Ct[t]*e;return Xe(n,we.min,we.max)}var V=4,O={fresh:"Frischhefe",active_dry:"Trockenhefe",instant:"Instant-Trockenhefe",sourdough:"Sauerteig (Anstellgut)"},Te={bulk:"Stockgare",balls:"St\xFCckgare"},tt={balls:6,ballWeight:270,hydration:65,salt:3,yeastType:"fresh",correction:1,starterHydration:100,starterActivity:"normal",phases:[{kind:"bulk",hours:2,tempC:22,label:"Raumtemperatur"},{kind:"bulk",hours:42,tempC:4.5,label:"K\xFChlschrank"},{kind:"balls",hours:4,tempC:22,label:"Raumtemperatur"}]},x=class extends Error{};function Mt(i){let t=[];if(!(i.balls>=1))throw new x("Mindestens ein Teigballen ist n\xF6tig.");if(!(i.ballWeight>0))throw new x("Das Ballengewicht muss gr\xF6\xDFer als 0 sein.");if(!(i.hydration>=0))throw new x("Die Hydration darf nicht negativ sein.");if(!(i.salt>=0))throw new x("Der Salzanteil darf nicht negativ sein.");if(i.phases.length<1)throw new x("Mindestens eine G\xE4rphase ist Pflicht.");if(i.phases.length>V)throw new x(`H\xF6chstens ${V} G\xE4rphasen.`);for(let s of i.phases){if(!(s.hours>0))throw new x("Jede G\xE4rphase braucht eine Dauer \xFCber 0 Stunden.");if(!Number.isFinite(s.tempC))throw new x("Jede G\xE4rphase braucht eine Temperatur.")}let e=i.phases.findIndex(s=>s.kind==="balls");if(e>=0&&i.phases.slice(e).some(s=>s.kind==="bulk"))throw new x("Die Stockgare muss vor der St\xFCckgare liegen.");return e<0&&t.push({code:"no_balls_phase",message:"Keine St\xFCckgare angegeben. Teiglinge brauchen meist noch einige Stunden nach dem Formen."}),(i.hydration<55||i.hydration>85)&&t.push({code:"hydration_range",message:"Die Hydration liegt au\xDFerhalb des \xFCblichen Bereichs f\xFCr Pizza (55\u201385 %)."}),(i.salt<1||i.salt>4)&&t.push({code:"salt_range",message:"Der Salzanteil liegt au\xDFerhalb des \xFCblichen Bereichs (1\u20134 %)."}),i.phases.some(s=>s.tempC>35)&&t.push({code:"too_warm",message:"\xDCber 35 \xB0C wird die Hefe geschw\xE4cht. Das Modell ist dort ungenau."}),i.phases.some(s=>s.tempC<0)&&t.push({code:"too_cold",message:"Unter 0 \xB0C ruht die G\xE4rung praktisch vollst\xE4ndig."}),t}var b=i=>Math.round(i*10)/10,Pe=i=>Math.round(i*100)/100;function st(i){let t=Mt(i),e=i.correction&&i.correction>0?i.correction:1,s=i.hydration/100,n=i.salt/100,r=i.balls*i.ballWeight,a=ne(i.phases);if(i.yeastType==="sourdough"){let g=i.yeastPercentOverride??et(i.phases,i.starterActivity??"normal",e),p=(i.starterHydration??100)/100,u=r/(1+s+n),m=u*g/100,y=m/(1+p),oe=m-y,z=u*s-oe;z<0&&t.push({code:"starter_too_wet",message:"Das Anstellgut bringt mehr Wasser mit, als die Hydration erlaubt."});let L=1e3/u;return{totalDough:b(r),flourTotal:b(u),flour:b(u-y),water:b(Math.max(0,z)),salt:b(u*n),yeast:0,starter:b(m),yeastPercent:Pe(g),freshYeastPercent:0,equivalentHours:b(a),perKgFlour:{water:b(Math.max(0,z)*L),salt:b(u*n*L),yeast:0,starter:b(m*L)},warnings:t}}let l=i.yeastPercentOverride!==void 0?i.yeastPercentOverride/Ee[i.yeastType]:Qe(i.phases,e),o=l*Ee[i.yeastType]/100,d=r/(1+s+n+o);return a>0&&a<4&&t.push({code:"short_fermentation",message:"Sehr kurze G\xE4rzeit. F\xFCr neapolitanische Pizza sind 8 h und mehr \xFCblich."}),{totalDough:b(r),flourTotal:b(d),flour:b(d),water:b(d*s),salt:b(d*n),yeast:Pe(d*o),starter:0,yeastPercent:Math.round(o*100*1e3)/1e3,freshYeastPercent:Math.round(l*1e3)/1e3,equivalentHours:b(a),perKgFlour:{water:b(1e3*s),salt:b(1e3*n),yeast:Pe(1e3*o),starter:0},warnings:t}}var W={bulk:"Stockgare",balls:"St\xFCckgare"},ke=36e5,Ce=6e4,Me=i=>`${String(Math.round(i*10)/10).replace(".",",")} \xB0C`,E=i=>`${String(Math.round(i*10)/10).replace(".",",")} h`;function Y(i,t){return i.label?`${i.label} (${Me(i.tempC)})`:i.tempC<t?`K\xFChlschrank (${Me(i.tempC)})`:`bei ${Me(i.tempC)}`}function nt(i,t,e={}){if(i.length===0)throw new Error("Mindestens eine G\xE4rphase ist Pflicht.");let s=e.mixMinutes??35,n=e.bakeLeadMinutes??30,r=e.preheatMinutes??60,a=e.fridgeThresholdC??10,l=t.getTime()-n*Ce,o=i.reduce(($,A)=>$+A.hours*ke,0),d=l-o,g=d-s*Ce,p=[],u=($,A,_,R)=>p.push({id:`${p.length+1}_${$}`,type:$,title:_,description:R,at:new Date(A).toISOString()}),m=i[0];u("mix",g,"Teig ansetzen",`Zutaten abwiegen, Teig kneten und kurz ruhen lassen. Danach ${W[m.kind]} ${E(m.hours)} ${Y(m,a)}.`),m.kind==="balls"?u("shape",d,"Teiglinge formen",`Teig teilen, Teiglinge schleifen und abgedeckt ${E(m.hours)} ${Y(m,a)} gehen lassen.`):m.tempC<a?u("to_fridge",d,"Teig in den K\xFChlschrank",`Stockgare ${E(m.hours)} ${Y(m,a)}.`):u("bulk_start",d,"Stockgare beginnt",`Teig abgedeckt ${E(m.hours)} ${Y(m,a)} gehen lassen.`);let y=d+m.hours*ke;for(let $=1;$<i.length;$++){let A=i[$-1],_=i[$],R=Y(_,a),Z=A.tempC<a,X=_.tempC<a;if(A.kind==="bulk"&&_.kind==="balls"){let le="";Z&&!X&&(le=" Teig vorher aus dem K\xFChlschrank nehmen."),!Z&&X&&(le=" Teiglinge danach in den K\xFChlschrank stellen."),u("shape",y,"Teiglinge formen",`Teig teilen, Teiglinge schleifen und ${E(_.hours)} ${R} gehen lassen.${le}`)}else!Z&&X?u("to_fridge",y,_.kind==="balls"?"Teiglinge in den K\xFChlschrank":"Teig in den K\xFChlschrank",`${W[_.kind]} ${E(_.hours)} ${R}.`):Z&&!X?u("from_fridge",y,_.kind==="balls"?"Teiglinge aus dem K\xFChlschrank":"Teig aus dem K\xFChlschrank",`${W[_.kind]} ${E(_.hours)} ${R}.`):u("temp_change",y,`${W[_.kind]}: Ort wechseln`,`${W[_.kind]} ${E(_.hours)} ${R}.`);y+=_.hours*ke}r>0&&u("preheat",l-r*Ce,"Ofen vorheizen","Ofen bzw. Pizzastein auf volle Temperatur bringen.");let oe=i[i.length-1];u("bake",l,"Pizza backen",oe.tempC<a?"Teiglinge sind kalt. Ggf. 1\u20132 h vorher aus dem K\xFChlschrank nehmen. Ausziehen, belegen, backen.":"Teiglinge ausziehen, belegen und backen. Guten Appetit!"),p.sort(($,A)=>$.at.localeCompare(A.at)),p.forEach(($,A)=>$.id=`${A+1}_${$.type}`);let z=[],L=e.now??new Date;return g<L.getTime()&&z.push({code:"start_in_past",message:"Der Teig h\xE4tte schon angesetzt werden m\xFCssen. Bitte Essenszeit oder G\xE4rzeiten anpassen."}),{eatAt:t.toISOString(),start:new Date(g).toISOString(),steps:p,warnings:z}}var ie=i=>i.replace(/[-:]/g,"").replace(/\.\d{3}/,""),ze=i=>i.replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,";");function it(i,t="Pizzateig",e=0){let s=ie(new Date().toISOString()),n=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//pizza-dough//DE","CALSCALE:GREGORIAN"];return i.steps.forEach((r,a)=>{let l=i.steps[a+1],o=l&&l.at>r.at?l.at:new Date(new Date(r.at).getTime()+15*6e4).toISOString();n.push("BEGIN:VEVENT",`UID:${ie(i.start)}-${r.id}@pizza-dough`,`DTSTAMP:${s}`,`DTSTART:${ie(r.at)}`,`DTEND:${ie(o)}`,`SUMMARY:${ze(`\u{1F355} ${r.title}`)}`,`DESCRIPTION:${ze(`${t}: ${r.description}`)}`,"BEGIN:VALARM","ACTION:DISPLAY",`DESCRIPTION:${ze(r.title)}`,`TRIGGER:-PT${Math.max(0,Math.round(e))}M`,"END:VALARM","END:VEVENT")}),n.push("END:VCALENDAR"),n.join(`\r
`)+`\r
`}var f=(i,t=1)=>i.toLocaleString("de-DE",{minimumFractionDigits:t,maximumFractionDigits:t});var q=(i,t)=>new Date(i).toLocaleString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",timeZone:t});function rt(i){let t=e=>String(e).padStart(2,"0");return`${i.getFullYear()}-${t(i.getMonth()+1)}-${t(i.getDate())}T${t(i.getHours())}:${t(i.getMinutes())}`}function at(i){let t=i<0,e=Math.round(Math.abs(i)/6e4),s=Math.floor(e/1440);e-=s*1440;let n=Math.floor(e/60);e-=n*60;let r=[s?`${s} T`:"",n?`${n} h`:"",`${e} min`].filter(Boolean);return(t?"vor ":"")+r.join(" ")}function ot(i,t,e,s){return{name:i,eat_at:s.eatAt,recipe:t,amounts:{flour:e.flour,flour_total:e.flourTotal,water:e.water,salt:e.salt,yeast:e.yeast,starter:e.starter,yeast_type:t.yeastType,yeast_percent:e.yeastPercent},steps:s.steps.map(({id:n,type:r,title:a,description:l,at:o})=>({id:n,type:r,title:a,description:l,at:o}))}}var lt=P`
  :host {
    --pd-primary: var(--pd-accent, var(--primary-color, #b8432f));
    --pd-on-primary: var(--text-primary-color, #fff);
    --pd-text: var(--primary-text-color, #1d1b19);
    --pd-muted: var(--secondary-text-color, #6b6560);
    --pd-bg: var(--card-background-color, var(--ha-card-background, #fff));
    --pd-surface: var(--secondary-background-color, #f5f1ec);
    --pd-border: var(--divider-color, #e3ddd6);
    --pd-warn: var(--warning-color, #b26a00);
    --pd-ok: var(--success-color, #2e7d32);
    --pd-radius: 10px;
    display: block;
    color: var(--pd-text);
    font-family: var(--paper-font-body1_-_font-family, inherit);
    font-size: 14px;
    line-height: 1.4;
  }
  * { box-sizing: border-box; }
  h3 { font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: var(--pd-muted); margin: 18px 0 8px; font-weight: 600; }
  label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--pd-muted); min-width: 0; }
  input, select {
    font: inherit; font-size: 15px; color: var(--pd-text); background: var(--pd-surface);
    border: 1px solid var(--pd-border); border-radius: 8px; padding: 8px 10px; width: 100%; min-width: 0;
  }
  input:focus, select:focus { outline: 2px solid var(--pd-primary); outline-offset: -1px; }
  button {
    font: inherit; font-weight: 600; cursor: pointer; border-radius: 8px; padding: 9px 14px;
    border: 1px solid var(--pd-border); background: var(--pd-surface); color: var(--pd-text);
  }
  button.primary { background: var(--pd-primary); border-color: var(--pd-primary); color: var(--pd-on-primary); }
  button.ghost { background: transparent; border-color: transparent; color: var(--pd-primary); padding: 6px 8px; }
  button:disabled { opacity: .5; cursor: default; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; }
  .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .muted { color: var(--pd-muted); font-size: 12px; }
  .warn { color: var(--pd-warn); font-size: 13px; margin: 6px 0; display: flex; gap: 6px; }
  .num { font-variant-numeric: tabular-nums; }
`;var zt=[{kind:"bulk",hours:24,tempC:4,label:"K\xFChlschrank"},{kind:"bulk",hours:2,tempC:22,label:"Raumtemperatur"},{kind:"bulk",hours:12,tempC:16,label:"Keller"}],ct="pizza-dough:recipe",ht="pizza-dough:plan-settings";function dt(){let i=new Date(Date.now()+1728e5);return i.setHours(19,0,0,0),rt(i)}var N=class extends v{constructor(){super();this._userPickedTab=!1;this._cancel=async()=>{if(confirm("Plan wirklich abbrechen? Alle Erinnerungen werden gel\xF6scht."))try{await this.backend?.cancelPlan(),this.tab="calc",this._message="Plan abgebrochen."}catch(e){this._message=`Fehler: ${e.message}`}};this.activePlan=null,this.extraActions=[],this.tab="calc",this._recipe=xe(ct,structuredClone(tt)),this._settings=xe(ht,{name:"Pizzaabend",eatAt:dt(),mixMinutes:35,preheatMinutes:60,bakeLeadMinutes:30}),new Date(this._settings.eatAt).getTime()<Date.now()&&(this._settings.eatAt=dt()),this._busy=!1,this._message="",this._now=Date.now(),this._showAdvanced=!1}connectedCallback(){super.connectedCallback(),this._timer=window.setInterval(()=>this._now=Date.now(),3e4)}disconnectedCallback(){super.disconnectedCallback(),window.clearInterval(this._timer)}willUpdate(e){if(e.has("activePlan")&&!this._userPickedTab){let s=!!e.get("activePlan");this.activePlan&&!s&&(this.tab="active")}this.tab==="active"&&!this.activePlan&&(this.tab="calc")}get _computed(){try{let e=st(this._recipe),s=new Date(this._settings.eatAt),n=Number.isNaN(s.getTime())?void 0:nt(this._recipe.phases,s,{mixMinutes:this._settings.mixMinutes,preheatMinutes:this._settings.preheatMinutes,bakeLeadMinutes:this._settings.bakeLeadMinutes,now:new Date(this._now)});return n&&(n.steps[0].description+=` Mengen: ${f(e.flour)} g Mehl, ${f(e.water)} g Wasser, ${f(e.salt)} g Salz, ${e.starter?`${f(e.starter)} g Anstellgut`:`${f(e.yeast,2)} g ${O[this._recipe.yeastType]}`}.`),{dough:e,schedule:n}}catch(e){return{error:e.message}}}_update(e){this._recipe={...this._recipe,...e},Ae(ct,this._recipe)}_updatePhase(e,s){let n=this._recipe.phases.map((r,a)=>a===e?{...r,...s}:r);this._update({phases:n})}_updateSettings(e){this._settings={...this._settings,...e},Ae(ht,this._settings)}_num(e){let s=parseFloat(e.target.value.replace(",","."));return Number.isFinite(s)?s:0}render(){let e=this._computed;return h`
      <nav role="tablist">
        ${this._tabButton("calc","Rechner")}
        ${this._tabButton("plan","Zeitplan")}
        ${this.activePlan?this._tabButton("active","Aktiv"):c}
      </nav>
      <div class="content">
        ${this.tab==="calc"?this._renderCalc(e):c}
        ${this.tab==="plan"?this._renderPlan(e):c}
        ${this.tab==="active"&&this.activePlan?this._renderActive(this.activePlan):c}
        ${this._message?h`<p class="message" role="status">${this._message}</p>`:c}
      </div>
    `}_tabButton(e,s){return h`<button role="tab" aria-selected=${this.tab===e} class=${this.tab===e?"tab sel":"tab"}
      @click=${()=>{this.tab=e,this._userPickedTab=!0,this._message=""}}>${s}</button>`}_renderCalc(e){let s=this._recipe;return h`
      <div class="grid">
        <label>Teigballen<input type="number" inputmode="numeric" min="1" step="1" .value=${String(s.balls)} @change=${n=>this._update({balls:Math.max(1,Math.round(this._num(n)))})} /></label>
        <label>Gewicht je Ballen (g)<input type="number" inputmode="decimal" min="1" .value=${String(s.ballWeight)} @change=${n=>this._update({ballWeight:this._num(n)})} /></label>
        <label>Hydration (%)<input type="number" inputmode="decimal" step="0.5" .value=${String(s.hydration)} @change=${n=>this._update({hydration:this._num(n)})} /></label>
        <label>Salz (%)<input type="number" inputmode="decimal" step="0.1" .value=${String(s.salt)} @change=${n=>this._update({salt:this._num(n)})} /></label>
      </div>

      <h3>Triebmittel</h3>
      <div class="grid">
        <label>Hefetyp
          <select @change=${n=>this._update({yeastType:n.target.value,yeastPercentOverride:void 0})}>
            ${Object.keys(O).map(n=>h`<option value=${n} ?selected=${s.yeastType===n}>${O[n]}</option>`)}
          </select>
        </label>
        ${s.yeastType==="sourdough"?h`
              <label>Hydration Anstellgut (%)<input type="number" inputmode="decimal" .value=${String(s.starterHydration??100)} @change=${n=>this._update({starterHydration:this._num(n)})} /></label>
              <label>Triebkraft
                <select @change=${n=>this._update({starterActivity:n.target.value})}>
                  <option value="weak" ?selected=${s.starterActivity==="weak"}>schwach</option>
                  <option value="normal" ?selected=${(s.starterActivity??"normal")==="normal"}>normal</option>
                  <option value="strong" ?selected=${s.starterActivity==="strong"}>stark</option>
                </select>
              </label>`:c}
      </div>

      <h3>Gärphasen</h3>
      ${s.phases.map((n,r)=>this._renderPhase(n,r))}
      <div class="row">
        ${s.phases.length<V?h`<span class="muted">Hinzufügen:</span>
              ${zt.map(n=>h`<button class="ghost" @click=${()=>this._addPhase(n)}>+ ${n.label}</button>`)}`:h`<span class="muted">Maximal ${V} Phasen.</span>`}
      </div>

      <h3>Ergebnis</h3>
      ${e.error?h`<p class="warn">⚠ ${e.error}</p>`:c}
      ${e.dough?this._renderResult(e.dough):c}

      <button class="ghost" @click=${()=>this._showAdvanced=!this._showAdvanced}>${this._showAdvanced?"\u25BE":"\u25B8"} Feineinstellungen</button>
      ${this._showAdvanced?h`<div class="grid">
            <label>Korrekturfaktor<input type="number" inputmode="decimal" step="0.05" min="0.1" .value=${String(s.correction??1)} @change=${n=>this._update({correction:this._num(n)||1})} /></label>
            <label>${s.yeastType==="sourdough"?"Anstellgut":"Hefe"} manuell (%)
              <input type="number" inputmode="decimal" step="0.01" placeholder="automatisch" .value=${s.yeastPercentOverride===void 0?"":String(s.yeastPercentOverride)}
                @change=${n=>{let r=n.target.value;this._update({yeastPercentOverride:r===""?void 0:this._num(n)})}} /></label>
          </div>
          <p class="muted">Korrekturfaktor über 1 bedeutet mehr Hefe. Passe ihn an, wenn dein Teig nach dem ersten Versuch zu träge (größer) oder übergärig (kleiner) war.</p>`:c}
    `}_addPhase(e){let s=[...this._recipe.phases],n=s.findIndex(r=>r.kind==="balls");s.splice(n<0?s.length:n,0,{...e}),this._update({phases:s})}_renderPhase(e,s){let n=this._recipe.phases;return h`
      <div class="phase">
        <span class="idx">${s+1}</span>
        <label class="kind">Art
          <select @change=${r=>this._updatePhase(s,{kind:r.target.value})}>
            <option value="bulk" ?selected=${e.kind==="bulk"}>${Te.bulk}</option>
            <option value="balls" ?selected=${e.kind==="balls"}>${Te.balls}</option>
          </select>
        </label>
        <label class="hours">Dauer (h)<input type="number" inputmode="decimal" step="0.5" min="0.5" .value=${String(e.hours)} @change=${r=>this._updatePhase(s,{hours:this._num(r)})} /></label>
        <label class="temp">Temp. (°C)<input type="number" inputmode="decimal" step="0.5" .value=${String(e.tempC)} @change=${r=>this._updatePhase(s,{tempC:this._num(r)})} /></label>
        <label class="place">Ort<input type="text" .value=${e.label??""} placeholder="z. B. Kühlschrank" @change=${r=>this._updatePhase(s,{label:r.target.value||void 0})} /></label>
        <button class="ghost icon" title="Phase entfernen" aria-label="Phase entfernen" ?disabled=${n.length<=1}
          @click=${()=>this._update({phases:n.filter((r,a)=>a!==s)})}>✕</button>
      </div>`}_renderResult(e){let s=this._recipe,n=s.yeastType==="sourdough",r=[[n?"Mehl (zugeben)":"Mehl",e.flour,1,1e3],[n?"Wasser (zugeben)":"Wasser",e.water,1,e.perKgFlour.water],["Salz",e.salt,1,e.perKgFlour.salt],n?["Anstellgut",e.starter,1,e.perKgFlour.starter]:[O[s.yeastType],e.yeast,2,e.perKgFlour.yeast]];return n&&(r[0][3]=e.flour/e.flourTotal*1e3),h`
      <table class="result">
        <thead><tr><th></th><th>Menge</th><th>pro kg Mehl</th></tr></thead>
        <tbody>
          ${r.map(([a,l,o,d])=>h`<tr><td>${a}</td><td class="num big">${f(l,o)} g</td><td class="num muted">${f(d,o)} g</td></tr>`)}
        </tbody>
      </table>
      <p class="muted">
        Teig gesamt ${f(e.totalDough,0)} g · ${n?`Gesamtmehl ${f(e.flourTotal)} g \xB7 Anstellgut ${f(e.yeastPercent,1)} %`:`Hefe ${f(e.yeastPercent,3)} %`}
        · Gärzeit ${f(s.phases.reduce((a,l)=>a+l.hours,0),1)} h (entspricht ${f(e.equivalentHours,1)} h bei 24 °C)
      </p>
      ${e.warnings.map(a=>h`<p class="warn">⚠ ${a.message}</p>`)}`}_renderPlan(e){let s=this._settings,n=e.schedule;return h`
      <div class="grid">
        <label class="wide">Pizza essen am<input type="datetime-local" .value=${s.eatAt} @change=${r=>this._updateSettings({eatAt:r.target.value})} /></label>
        <label>Name<input type="text" .value=${s.name} @change=${r=>this._updateSettings({name:r.target.value})} /></label>
      </div>
      <div class="grid" style="margin-top:10px">
        <label>Kneten + Ruhe (min)<input type="number" min="0" step="5" .value=${String(s.mixMinutes)} @change=${r=>this._updateSettings({mixMinutes:this._num(r)})} /></label>
        <label>Backen vor Essen (min)<input type="number" min="0" step="5" .value=${String(s.bakeLeadMinutes)} @change=${r=>this._updateSettings({bakeLeadMinutes:this._num(r)})} /></label>
        <label>Ofen vorheizen (min)<input type="number" min="0" step="5" .value=${String(s.preheatMinutes)} @change=${r=>this._updateSettings({preheatMinutes:this._num(r)})} /></label>
      </div>
      ${e.error?h`<p class="warn">⚠ ${e.error}</p>`:c}
      ${n?h`
            <h3>Ablauf</h3>
            <ol class="timeline">
              ${n.steps.map(r=>h`<li class=${new Date(r.at).getTime()<this._now?"past":""}>
                <div class="when num">${q(r.at)}</div>
                <div><strong>${r.title}</strong><div class="muted">${r.description}</div></div></li>`)}
            </ol>
            ${n.warnings.map(r=>h`<p class="warn">⚠ ${r.message}</p>`)}
            <div class="row actions">
              ${this.backend?h`<button class="primary" ?disabled=${this._busy} @click=${()=>this._start(e)}>${this.activePlan?"Neuen Plan starten":"Plan starten"}</button>`:c}
              <button @click=${()=>this._downloadIcs(n)}>Kalender (.ics)</button>
              ${this.extraActions.map(r=>h`<button ?disabled=${this._busy} @click=${()=>this._runExtra(r,e)}>${r.label}</button>`)}
            </div>
            ${this.activePlan?h`<p class="muted">Ein neuer Plan ersetzt den aktiven Plan „${this.activePlan.name}“.</p>`:c}`:c}
    `}_payload(e){return ot(this._settings.name||"Pizzateig",this._recipe,e.dough,e.schedule)}async _start(e){if(!(!this.backend||!e.dough||!e.schedule)){this._busy=!0,this._message="";try{await this.backend.startPlan(this._payload(e)),this._message=`Plan gestartet. Erinnerungen kommen \xFCber ${this.backend.label}.`,this.tab="active",this._userPickedTab=!1}catch(s){this._message=`Fehler: ${s.message}`}finally{this._busy=!1}}}async _runExtra(e,s){if(!(!s.dough||!s.schedule)){this._busy=!0;try{this._message=await e.run(this._payload(s))||""}catch(n){this._message=`Fehler: ${n.message}`}finally{this._busy=!1}}}_downloadIcs(e){let s=new Blob([it(e,this._settings.name||"Pizzateig")],{type:"text/calendar"}),n=document.createElement("a");n.href=URL.createObjectURL(s),n.download="pizzateig.ics",n.click(),setTimeout(()=>URL.revokeObjectURL(n.href),1e3)}_renderActive(e){let s=e.steps.find(a=>!a.done&&!a.notified),n=e.amounts??{},r=n.yeast_type?O[n.yeast_type]:"Hefe";return h`
      <div class="hero">
        <div>
          <div class="muted">${e.name} · Essen ${q(e.eat_at)}</div>
          ${s?h`<div class="next-title">${s.title}</div>
                <div class="muted num">${q(s.at)} · in ${at(new Date(s.at).getTime()-this._now)}</div>`:h`<div class="next-title">Alle Schritte erledigt 🍕</div>`}
        </div>
      </div>
      ${n.flour!==void 0?h`<div class="chips num">
            <span>Mehl <b>${f(n.flour)} g</b></span><span>Wasser <b>${f(n.water??0)} g</b></span><span>Salz <b>${f(n.salt??0)} g</b></span>
            ${n.starter?h`<span>Anstellgut <b>${f(n.starter)} g</b></span>`:h`<span>${r} <b>${f(n.yeast??0,2)} g</b></span>`}
          </div>`:c}
      <ol class="timeline">
        ${e.steps.map(a=>{let l=a.done?"done":a.notified?"due":a.id===s?.id?"next":"";return h`<li class=${l}>
            <div class="when num">${q(a.at)}</div>
            <div class="grow"><strong>${a.done?"\u2713 ":""}${a.title}</strong><div class="muted">${a.description}</div></div>
            ${!a.done&&this.backend?h`<button class="ghost" @click=${()=>this._complete(a.id)}>Erledigt</button>`:c}
          </li>`})}
      </ol>
      ${this.backend?h`<div class="row actions"><button @click=${this._cancel}>Plan abbrechen</button></div>`:c}
    `}async _complete(e){try{await this.backend?.completeStep(e)}catch(s){this._message=`Fehler: ${s.message}`}}};N.properties={backend:{attribute:!1},activePlan:{attribute:!1},extraActions:{attribute:!1},tab:{type:String},_recipe:{state:!0},_settings:{state:!0},_busy:{state:!0},_message:{state:!0},_now:{state:!0},_showAdvanced:{state:!0}},N.styles=[lt,P`
      nav { display: flex; gap: 4px; border-bottom: 1px solid var(--pd-border); margin-bottom: 14px; }
      .tab { background: none; border: none; border-bottom: 2px solid transparent; border-radius: 0; padding: 10px 12px; color: var(--pd-muted); }
      .tab.sel { color: var(--pd-primary); border-bottom-color: var(--pd-primary); }
      .phase { display: grid; grid-template-columns: 22px 1.3fr 1fr 1fr 1.5fr 32px; gap: 8px; align-items: end; padding: 8px 0; border-bottom: 1px dashed var(--pd-border); }
      .phase .idx { align-self: center; font-weight: 700; color: var(--pd-muted); }
      .icon { padding: 8px; }
      @media (max-width: 520px) {
        .phase { grid-template-columns: 22px 1fr 1fr 32px; grid-template-areas: "idx kind kind del" ". hours temp ." ". place place ."; }
        .phase .idx { grid-area: idx; } .phase .kind { grid-area: kind; } .phase .hours { grid-area: hours; }
        .phase .temp { grid-area: temp; } .phase .place { grid-area: place; } .phase .icon { grid-area: del; }
      }
      .wide { grid-column: span 2; }
      table.result { width: 100%; border-collapse: collapse; }
      .result th { text-align: right; font-size: 12px; font-weight: 500; color: var(--pd-muted); padding: 4px 0; }
      .result td { padding: 8px 0; border-bottom: 1px solid var(--pd-border); }
      .result td:not(:first-child) { text-align: right; }
      .result .big { font-size: 18px; font-weight: 700; }
      .timeline { list-style: none; padding: 0; margin: 0; }
      .timeline li { display: flex; gap: 12px; padding: 10px 0 10px 14px; border-left: 3px solid var(--pd-border); margin-left: 4px; align-items: flex-start; }
      .timeline li.past, .timeline li.done { opacity: .55; }
      .timeline li.next { border-left-color: var(--pd-primary); }
      .timeline li.due { border-left-color: var(--pd-warn); }
      .timeline .when { min-width: 118px; font-size: 13px; font-weight: 600; }
      .grow { flex: 1; min-width: 0; }
      @media (max-width: 420px) { .timeline li { flex-wrap: wrap; } .timeline .when { min-width: 0; width: 100%; } }
      .actions { margin-top: 14px; }
      .hero { background: var(--pd-surface); border-radius: var(--pd-radius); padding: 14px; margin-bottom: 12px; }
      .next-title { font-size: 20px; font-weight: 700; margin: 2px 0; }
      .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
      .chips span { background: var(--pd-surface); border-radius: 999px; padding: 4px 10px; font-size: 13px; }
      .message { margin-top: 12px; font-weight: 600; }
    `];customElements.get("pizza-dough-planner")||customElements.define("pizza-dough-planner",N);var re="pizza_dough",Rt="0.1.1";console.info(`%c PIZZA-DOUGH-CARD %c ${Rt} `,"color:#fff;background:#b8432f;font-weight:700;border-radius:3px 0 0 3px","color:#b8432f;background:#fff;border:1px solid #b8432f;border-radius:0 3px 3px 0");var J=class extends v{constructor(){super();this._lastPlanKey="";this._plan=null;this._config={type:"custom:pizza-dough-card"},this._backend={label:"Home Assistant",startPlan:async e=>{await this.hass.callService(re,"start_plan",e)},cancelPlan:async()=>{await this.hass.callService(re,"cancel_plan",{})},completeStep:async e=>{await this.hass.callService(re,"complete_step",{step_id:e})}}}setConfig(e){this._config={...e}}static getConfigElement(){return document.createElement("pizza-dough-card-editor")}static getStubConfig(){return{title:"Pizzateig"}}getCardSize(){return 8}getGridOptions(){return{columns:12,min_columns:6,rows:"auto"}}get _entity(){if(this.hass)return this._config.entity?this.hass.states[this._config.entity]:Object.values(this.hass.states).find(e=>e.entity_id.startsWith("sensor.")&&e.attributes?.pizza_dough===!0)}_activePlan(){let e=this._entity;if(!e||e.state==="idle"||!Array.isArray(e.attributes.steps)||e.attributes.steps.length===0)return this._plan=null,this._lastPlanKey="",null;let s=JSON.stringify([e.state,e.attributes.steps,e.attributes.name]);return s!==this._lastPlanKey&&(this._lastPlanKey=s,this._plan={name:e.attributes.name??"Pizzateig",eat_at:e.attributes.eat_at,amounts:e.attributes.amounts??{},steps:e.attributes.steps}),this._plan}render(){let e=this._entity;return h`
      <ha-card .header=${this._config.title??"Pizzateig"}>
        <div class="card-content">
          ${this.hass&&!e?h`<p class="hint">Die Integration „Pizzateig-Planer“ ist noch nicht eingerichtet. Der Rechner funktioniert trotzdem, Erinnerungen gibt es aber erst nach der Einrichtung unter Einstellungen → Geräte &amp; Dienste.</p>`:c}
          <pizza-dough-planner .backend=${e?this._backend:void 0} .activePlan=${this._activePlan()}></pizza-dough-planner>
        </div>
      </ha-card>
    `}};J.properties={hass:{attribute:!1},_config:{state:!0}},J.styles=P`
    .card-content { padding: 0 16px 16px; }
    .hint { color: var(--warning-color, #b26a00); font-size: 13px; }
  `;var ae=class extends v{constructor(){super(...arguments);this._schema=[{name:"title",selector:{text:{}}},{name:"entity",selector:{entity:{domain:"sensor",integration:re}}}];this._label=e=>e.name==="title"?"Titel":"Status-Sensor (optional, sonst automatisch)"}setConfig(e){this._config=e}render(){return!this.hass||!this._config?c:h`<ha-form .hass=${this.hass} .data=${this._config} .schema=${this._schema} .computeLabel=${this._label}
      @value-changed=${e=>{this._config=e.detail.value,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this._config},bubbles:!0,composed:!0}))}}></ha-form>`}};ae.properties={hass:{attribute:!1},_config:{state:!0}};customElements.get("pizza-dough-card")||customElements.define("pizza-dough-card",J);customElements.get("pizza-dough-card-editor")||customElements.define("pizza-dough-card-editor",ae);window.customCards=window.customCards||[];window.customCards.some(i=>i.type==="pizza-dough-card")||window.customCards.push({type:"pizza-dough-card",name:"Pizzateig-Planer",description:"Teigrechner, G\xE4rzeitplan und Erinnerungen f\xFCr Pizzateig",preview:!0});
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
lit-html/lit-html.js:
lit-element/lit-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/is-server.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
