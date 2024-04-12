
/*!
* lunr.min.js v0.7.2-zh baidu compress
*/
;(function(){var lunr=function(config){var idx=new lunr.Index
    idx.pipeline.add(lunr.trimmer,lunr.stopWordFilter,lunr.stemmer)
    if(config)config.call(idx,idx)
    return idx}
    lunr.version="0.7.2"/*!
    * lunr.utils
    * Copyright (C) 2016 Oliver Nightingale
    */
    lunr.utils={}
    lunr.utils.warn=(function(global){return function(message){if(global.console&&console.warn){console.warn(message)}}})(this)
    lunr.utils.asString=function(obj){if(obj===void 0||obj===null){return ""}else{return obj.toString()}}/*!
    * lunr.EventEmitter
    * Copyright (C) 2016 Oliver Nightingale
    */
    lunr.EventEmitter=function(){this.events={}}
    lunr.EventEmitter.prototype.addListener=function(){var args=Array.prototype.slice.call(arguments),fn=args.pop(),names=args
    if(typeof fn!=="function")throw new TypeError("last argument must be a function")
    names.forEach(function(name){if(!this.hasHandler(name))this.events[name]=[]
    this.events[name].push(fn)},this)}
    lunr.EventEmitter.prototype.removeListener=function(name,fn){if(!this.hasHandler(name))return
    var fnIndex=this.events[name].indexOf(fn)
    this.events[name].splice(fnIndex,1)
    if(!this.events[name].length)delete this.events[name]}
    lunr.EventEmitter.prototype.emit=function(name){if(!this.hasHandler(name))return
    var args=Array.prototype.slice.call(arguments,1)
    this.events[name].forEach(function(fn){fn.apply(undefined,args)})}
    lunr.EventEmitter.prototype.hasHandler=function(name){return name in this.events}/*!
    * lunr.tokenizer
    * Copyright (C) 2016 Oliver Nightingale
    */
    lunr.tokenizer=function(obj){if(!arguments.length||obj==null||obj==undefined)return[]
    if(Array.isArray(obj))return obj.map(function(t){return lunr.utils.asString(t).toLowerCase()})
    var str=obj.toString().replace(/^\s+/,'')
    for(var i=str.length-1;i>=0;i--){if(/\S/.test(str.charAt(i))){str=str.substring(0,i+1)
    break}}
    var rs=str.split(/[\ |\~|\`|\!|\@|\#|\$|\%|\^|\&|\*|\uFE30-\uFFA0|\(|\)|\-|\_|\+|\=|\||\\|\[|\]|\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?]+/).map(function(token){var t=token.replace(/[\ |\~|\`|\!|\@|\#|\$|\%|\^|\&|\*|\uFE30-\uFFA0|\(|\)|\-|\_|\+|\=|\||\\|\[|\]|\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?]/g,'').toLowerCase()
    return t;});var separator=lunr.tokenizer.seperator||lunr.tokenizer.separator
    return obj.toString().trim().toLowerCase().split(separator)}
    lunr.tokenizer.seperator=false
    lunr.tokenizer.separator=/[\s\-]+/
    lunr.tokenizer.load=function(label){var fn=this.registeredFunctions[label]
    if(!fn){throw new Error('Cannot load un-registered function: '+label)}
    return fn}
    lunr.tokenizer.label='default'
    lunr.tokenizer.registeredFunctions={'default':lunr.tokenizer}
    lunr.tokenizer.registerFunction=function(fn,label){if(label in this.registeredFunctions){lunr.utils.warn('Overwriting existing tokenizer: '+label)}
    fn.label=label
    this.registeredFunctions[label]=fn}/*!
    * lunr.Pipeline
    * Copyright (C) 2016 Oliver Nightingale
    */
    lunr.Pipeline=function(){this._stack=[]}
    lunr.Pipeline.registeredFunctions={}
    lunr.Pipeline.registerFunction=function(fn,label){if(label in this.registeredFunctions){lunr.utils.warn('Overwriting existing registered function: '+label)}
    fn.label=label
    lunr.Pipeline.registeredFunctions[fn.label]=fn}
    lunr.Pipeline.warnIfFunctionNotRegistered=function(fn){var isRegistered=fn.label&&(fn.label in this.registeredFunctions)
    if(!isRegistered){lunr.utils.warn('Function is not registered with pipeline. This may cause problems when serialising the index.\n',fn)}}
    lunr.Pipeline.load=function(serialised){var pipeline=new lunr.Pipeline
    serialised.forEach(function(fnName){var fn=lunr.Pipeline.registeredFunctions[fnName]
    if(fn){pipeline.add(fn)}else{throw new Error('Cannot load un-registered function: '+fnName)}})
    return pipeline}
    lunr.Pipeline.prototype.add=function(){var fns=Array.prototype.slice.call(arguments)
    fns.forEach(function(fn){lunr.Pipeline.warnIfFunctionNotRegistered(fn)
    this._stack.push(fn)},this)}
    lunr.Pipeline.prototype.after=function(existingFn,newFn){lunr.Pipeline.warnIfFunctionNotRegistered(newFn)
    var pos=this._stack.indexOf(existingFn)
    if(pos==-1){throw new Error('Cannot find existingFn')}
    pos=pos+1
    this._stack.splice(pos,0,newFn)}
    lunr.Pipeline.prototype.before=function(existingFn,newFn){lunr.Pipeline.warnIfFunctionNotRegistered(newFn)
    var pos=this._stack.indexOf(existingFn)
    if(pos==-1){throw new Error('Cannot find existingFn')}
    this._stack.splice(pos,0,newFn)}
    lunr.Pipeline.prototype.remove=function(fn){var pos=this._stack.indexOf(fn)
    if(pos==-1){return}
    this._stack.splice(pos,1)}
    lunr.Pipeline.prototype.run=function(tokens){var out=[],tokenLength=tokens.length,stackLength=this._stack.length
    for(var i=0;i<tokenLength;i++){var token=tokens[i]
    for(var j=0;j<stackLength;j++){token=this._stack[j](token,i,tokens)
    if(token===void 0||token==='')break};if(token!==void 0&&token!=='')out.push(token)};return out}
    lunr.Pipeline.prototype.reset=function(){this._stack=[]}
    lunr.Pipeline.prototype.toJSON=function(){return this._stack.map(function(fn){lunr.Pipeline.warnIfFunctionNotRegistered(fn)
    return fn.label})}/*!
    * lunr.Vector
    * Copyright (C) 2016 Oliver Nightingale
    */
    lunr.Vector=function(){this._magnitude=null
    this.list=undefined
    this.length=0}
    lunr.Vector.Node=function(idx,val,next){this.idx=idx
    this.val=val
    this.next=next}
    lunr.Vector.prototype.insert=function(idx,val){this._magnitude=undefined;var list=this.list
    if(!list){this.list=new lunr.Vector.Node(idx,val,list)
    return this.length++}
    if(idx<list.idx){this.list=new lunr.Vector.Node(idx,val,list)
    return this.length++}
    var prev=list,next=list.next
    while(next!=undefined){if(idx<next.idx){prev.next=new lunr.Vector.Node(idx,val,next)
    return this.length++}
    prev=next,next=next.next}
    prev.next=new lunr.Vector.Node(idx,val,next)
    return this.length++}
    lunr.Vector.prototype.magnitude=function(){if(this._magnitude)return this._magnitude
    var node=this.list,sumOfSquares=0,val
    while(node){val=node.val
    sumOfSquares+=val*val
    node=node.next}
    return this._magnitude=Math.sqrt(sumOfSquares)}
    lunr.Vector.prototype.dot=function(otherVector){var node=this.list,otherNode=otherVector.list,dotProduct=0
    while(node&&otherNode){if(node.idx<otherNode.idx){node=node.next}else if(node.idx>otherNode.idx){otherNode=otherNode.next}else{dotProduct+=node.val*otherNode.val
    node=node.next
    otherNode=otherNode.next}}
    return dotProduct}
    lunr.Vector.prototype.similarity=function(otherVector){return this.dot(otherVector)/(this.magnitude()*otherVector.magnitude())}/*!
    * lunr.SortedSet
    * Copyright (C) 2016 Oliver Nightingale
    */
    lunr.SortedSet=function(){this.length=0
    this.elements=[]}
    lunr.SortedSet.load=function(serialisedData){var set=new this
    set.elements=serialisedData
    set.length=serialisedData.length
    return set}
    lunr.SortedSet.prototype.add=function(){var i,element
    for(i=0;i<arguments.length;i++){element=arguments[i]
    if(~this.indexOf(element))continue
    this.elements.splice(this.locationFor(element),0,element)}
    this.length=this.elements.length}
    lunr.SortedSet.prototype.toArray=function(){return this.elements.slice()}
    lunr.SortedSet.prototype.map=function(fn,ctx){return this.elements.map(fn,ctx)}
    lunr.SortedSet.prototype.forEach=function(fn,ctx){return this.elements.forEach(fn,ctx)}
    lunr.SortedSet.prototype.indexOf=function(elem){var start=0,end=this.elements.length,sectionLength=end-start,pivot=start+Math.floor(sectionLength/2),pivotElem=this.elements[pivot]
    while(sectionLength>1){if(pivotElem===elem)return pivot
    if(pivotElem<elem)start=pivot
    if(pivotElem>elem)end=pivot
    sectionLength=end-start
    pivot=start+Math.floor(sectionLength/2)
    pivotElem=this.elements[pivot]}
    if(pivotElem===elem)return pivot
    return-1}
    lunr.SortedSet.prototype.locationFor=function(elem){var start=0,end=this.elements.length,sectionLength=end-start,pivot=start+Math.floor(sectionLength/2),pivotElem=this.elements[pivot]
    while(sectionLength>1){if(pivotElem<elem)start=pivot
    if(pivotElem>elem)end=pivot
    sectionLength=end-start
    pivot=start+Math.floor(sectionLength/2)
    pivotElem=this.elements[pivot]}
    if(pivotElem>elem)return pivot
    if(pivotElem<elem)return pivot+1}
    lunr.SortedSet.prototype.intersect=function(otherSet){var intersectSet=new lunr.SortedSet,i=0,j=0,a_len=this.length,b_len=otherSet.length,a=this.elements,b=otherSet.elements
    while(true){if(i>a_len-1||j>b_len-1)break
    if(a[i]===b[j]){intersectSet.add(a[i])
    i++,j++
    continue}
    if(a[i]<b[j]){i++
    continue}
    if(a[i]>b[j]){j++
    continue}};return intersectSet}
    lunr.SortedSet.prototype.clone=function(){var clone=new lunr.SortedSet
    clone.elements=this.toArray()
    clone.length=clone.elements.length
    return clone}
    lunr.SortedSet.prototype.union=function(otherSet){var longSet,shortSet,unionSet
    if(this.length>=otherSet.length){longSet=this,shortSet=otherSet}else{longSet=otherSet,shortSet=this}
    unionSet=longSet.clone()
    for(var i=0,shortSetElements=shortSet.toArray();i<shortSetElements.length;i++){unionSet.add(shortSetElements[i])}
    return unionSet}
    lunr.SortedSet.prototype.toJSON=function(){return this.toArray()}/*!
    * lunr.Index
    * Copyright (C) 2016 Oliver Nightingale
    */
    lunr.Index=function(){this._fields=[]
    this._ref='id'
    this.pipeline=new lunr.Pipeline
    this.documentStore=new lunr.Store
    this.tokenStore=new lunr.TokenStore
    this.corpusTokens=new lunr.SortedSet
    this.eventEmitter=new lunr.EventEmitter
    this.tokenizerFn=lunr.tokenizer
    this._idfCache={}
    this.on('add','remove','update',(function(){this._idfCache={}}).bind(this))}
    lunr.Index.prototype.on=function(){var args=Array.prototype.slice.call(arguments)
    return this.eventEmitter.addListener.apply(this.eventEmitter,args)}
    lunr.Index.prototype.off=function(name,fn){return this.eventEmitter.removeListener(name,fn)}
    lunr.Index.load=function(serialisedData){if(serialisedData.version!==lunr.version){lunr.utils.warn('version mismatch: current '+lunr.version+' importing '+serialisedData.version)}
    var idx=new this
    idx._fields=serialisedData.fields
    idx._ref=serialisedData.ref
    idx.tokenizer(lunr.tokenizer.load(serialisedData.tokenizer))
    idx.documentStore=lunr.Store.load(serialisedData.documentStore)
    idx.tokenStore=lunr.TokenStore.load(serialisedData.tokenStore)
    idx.corpusTokens=lunr.SortedSet.load(serialisedData.corpusTokens)
    idx.pipeline=lunr.Pipeline.load(serialisedData.pipeline)
    return idx}
    lunr.Index.prototype.field=function(fieldName,opts){var opts=opts||{},field={name:fieldName,boost:opts.boost||1}
    this._fields.push(field)
    return this}
    lunr.Index.prototype.ref=function(refName){this._ref=refName
    return this}
    lunr.Index.prototype.tokenizer=function(fn){var isRegistered=fn.label&&(fn.label in lunr.tokenizer.registeredFunctions)
    if(!isRegistered){lunr.utils.warn('Function is not a registered tokenizer. This may cause problems when serialising the index')}
    this.tokenizerFn=fn
    return this}
    lunr.Index.prototype.add=function(doc,emitEvent){var docTokens={},allDocumentTokens=new lunr.SortedSet,docRef=doc[this._ref],emitEvent=emitEvent===undefined?true:emitEvent
    this._fields.forEach(function(field){var fieldTokens=this.pipeline.run(this.tokenizerFn(doc[field.name]))
    docTokens[field.name]=fieldTokens
    for(var i=0;i<fieldTokens.length;i++){var token=fieldTokens[i]
    allDocumentTokens.add(token)
    this.corpusTokens.add(token)}},this)
    this.documentStore.set(docRef,allDocumentTokens)
    for(var i=0;i<allDocumentTokens.length;i++){var token=allDocumentTokens.elements[i]
    var tf=0;for(var j=0;j<this._fields.length;j++){var field=this._fields[j]
    var fieldTokens=docTokens[field.name]
    var fieldLength=fieldTokens.length
    if(!fieldLength)continue
    var tokenCount=0
    for(var k=0;k<fieldLength;k++){if(fieldTokens[k]===token){tokenCount++}}
    tf+=(tokenCount/fieldLength*field.boost)}
    this.tokenStore.add(token,{ref:docRef,tf:tf})};if(emitEvent)this.eventEmitter.emit('add',doc,this)}
    lunr.Index.prototype.remove=function(doc,emitEvent){var docRef=doc[this._ref],emitEvent=emitEvent===undefined?true:emitEvent
    if(!this.documentStore.has(docRef))return
    var docTokens=this.documentStore.get(docRef)
    this.documentStore.remove(docRef)
    docTokens.forEach(function(token){this.tokenStore.remove(token,docRef)},this)
    if(emitEvent)this.eventEmitter.emit('remove',doc,this)}
    lunr.Index.prototype.update=function(doc,emitEvent){var emitEvent=emitEvent===undefined?true:emitEvent
    this.remove(doc,false)
    this.add(doc,false)
    if(emitEvent)this.eventEmitter.emit('update',doc,this)}
    lunr.Index.prototype.idf=function(term){var cacheKey="@"+term
    if(Object.prototype.hasOwnProperty.call(this._idfCache,cacheKey))return this._idfCache[cacheKey]
    var documentFrequency=this.tokenStore.count(term),idf=1
    if(documentFrequency>0){idf=1+Math.log(this.documentStore.length/documentFrequency)}
    return this._idfCache[cacheKey]=idf}
    lunr.Index.prototype.search=function(query){var queryTokens=this.pipeline.run(this.tokenizerFn(query)),queryVector=new lunr.Vector,documentSets=[],fieldBoosts=this._fields.reduce(function(memo,f){return memo+f.boost},0)
    var hasSomeToken=queryTokens.some(function(token){return this.tokenStore.has(token)},this)
    if(!hasSomeToken)return[]
    queryTokens.forEach(function(token,i,tokens){var tf=1/tokens.length*this._fields.length*fieldBoosts,self=this
    var set=this.tokenStore.expand(token).reduce(function(memo,key){var pos=self.corpusTokens.indexOf(key),idf=self.idf(key),similarityBoost=1,set=new lunr.SortedSet
    if(key!==token){var diff=Math.max(3,key.length-token.length)
    similarityBoost=1/Math.log(diff)}
    if(pos>-1)queryVector.insert(pos,tf*idf*similarityBoost)
    var matchingDocuments=self.tokenStore.get(key),refs=Object.keys(matchingDocuments),refsLen=refs.length
    for(var i=0;i<refsLen;i++){set.add(matchingDocuments[refs[i]].ref)}
    return memo.union(set)},new lunr.SortedSet)
    documentSets.push(set)},this)
    var documentSet=documentSets.reduce(function(memo,set){return memo.intersect(set)})
    return documentSet.map(function(ref){return{ref:ref,score:queryVector.similarity(this.documentVector(ref))}},this).sort(function(a,b){return b.score-a.score})}
    lunr.Index.prototype.documentVector=function(documentRef){var documentTokens=this.documentStore.get(documentRef),documentTokensLength=documentTokens.length,documentVector=new lunr.Vector
    for(var i=0;i<documentTokensLength;i++){var token=documentTokens.elements[i],tf=this.tokenStore.get(token)[documentRef].tf,idf=this.idf(token)
    documentVector.insert(this.corpusTokens.indexOf(token),tf*idf)};return documentVector}
    lunr.Index.prototype.toJSON=function(){return{version:lunr.version,fields:this._fields,ref:this._ref,tokenizer:this.tokenizerFn.label,documentStore:this.documentStore.toJSON(),tokenStore:this.tokenStore.toJSON(),corpusTokens:this.corpusTokens.toJSON(),pipeline:this.pipeline.toJSON()}}
    lunr.Index.prototype.use=function(plugin){var args=Array.prototype.slice.call(arguments,1)
    args.unshift(this)
    plugin.apply(this,args)}/*!
    * lunr.Store
    * Copyright (C) 2016 Oliver Nightingale
    */
    lunr.Store=function(){this.store={}
    this.length=0}
    lunr.Store.load=function(serialisedData){var store=new this
    store.length=serialisedData.length
    store.store=Object.keys(serialisedData.store).reduce(function(memo,key){memo[key]=lunr.SortedSet.load(serialisedData.store[key])
    return memo},{})
    return store}
    lunr.Store.prototype.set=function(id,tokens){if(!this.has(id))this.length++
    this.store[id]=tokens}
    lunr.Store.prototype.get=function(id){return this.store[id]}
    lunr.Store.prototype.has=function(id){return id in this.store}
    lunr.Store.prototype.remove=function(id){if(!this.has(id))return
    delete this.store[id]
    this.length--}
    lunr.Store.prototype.toJSON=function(){return{store:this.store,length:this.length}}/*!
    * lunr.stemmer
    * Copyright (C) 2016 Oliver Nightingale
    * Includes code from - http://tartarus.org/~martin/PorterStemmer/js.txt
    */
    lunr.stemmer=(function(){var step2list={"ational":"ate","tional":"tion","enci":"ence","anci":"ance","izer":"ize","bli":"ble","alli":"al","entli":"ent","eli":"e","ousli":"ous","ization":"ize","ation":"ate","ator":"ate","alism":"al","iveness":"ive","fulness":"ful","ousness":"ous","aliti":"al","iviti":"ive","biliti":"ble","logi":"log"},step3list={"icate":"ic","ative":"","alize":"al","iciti":"ic","ical":"ic","ful":"","ness":""},c="[^aeiou]",v="[aeiouy]",C=c+"[^aeiouy]*",V=v+"[aeiou]*",mgr0="^("+C+")?"+V+C,meq1="^("+C+")?"+V+C+"("+V+")?$",mgr1="^("+C+")?"+V+C+V+C,s_v="^("+C+")?"+v;var re_mgr0=new RegExp(mgr0);var re_mgr1=new RegExp(mgr1);var re_meq1=new RegExp(meq1);var re_s_v=new RegExp(s_v);var re_1a=/^(.+?)(ss|i)es$/;var re2_1a=/^(.+?)([^s])s$/;var re_1b=/^(.+?)eed$/;var re2_1b=/^(.+?)(ed|ing)$/;var re_1b_2=/.$/;var re2_1b_2=/(at|bl|iz)$/;var re3_1b_2=new RegExp("([^aeiouylsz])\\1$");var re4_1b_2=new RegExp("^"+C+v+"[^aeiouwxy]$");var re_1c=/^(.+?[^aeiou])y$/;var re_2=/^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;var re_3=/^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;var re_4=/^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;var re2_4=/^(.+?)(s|t)(ion)$/;var re_5=/^(.+?)e$/;var re_5_1=/ll$/;var re3_5=new RegExp("^"+C+v+"[^aeiouwxy]$");var porterStemmer=function porterStemmer(w){var stem,suffix,firstch,re,re2,re3,re4;if(w.length<3){return w;}
    firstch=w.substr(0,1);if(firstch=="y"){w=firstch.toUpperCase()+w.substr(1);}
    re=re_1a
    re2=re2_1a;if(re.test(w)){w=w.replace(re,"$1$2");}
    else if(re2.test(w)){w=w.replace(re2,"$1$2");}
    re=re_1b;re2=re2_1b;if(re.test(w)){var fp=re.exec(w);re=re_mgr0;if(re.test(fp[1])){re=re_1b_2;w=w.replace(re,"");}}else if(re2.test(w)){var fp=re2.exec(w);stem=fp[1];re2=re_s_v;if(re2.test(stem)){w=stem;re2=re2_1b_2;re3=re3_1b_2;re4=re4_1b_2;if(re2.test(w)){w=w+"e";}
    else if(re3.test(w)){re=re_1b_2;w=w.replace(re,"");}
    else if(re4.test(w)){w=w+"e";}}}
    re=re_1c;if(re.test(w)){var fp=re.exec(w);stem=fp[1];w=stem+"i";}
    re=re_2;if(re.test(w)){var fp=re.exec(w);stem=fp[1];suffix=fp[2];re=re_mgr0;if(re.test(stem)){w=stem+step2list[suffix];}}
    re=re_3;if(re.test(w)){var fp=re.exec(w);stem=fp[1];suffix=fp[2];re=re_mgr0;if(re.test(stem)){w=stem+step3list[suffix];}}
    re=re_4;re2=re2_4;if(re.test(w)){var fp=re.exec(w);stem=fp[1];re=re_mgr1;if(re.test(stem)){w=stem;}}else if(re2.test(w)){var fp=re2.exec(w);stem=fp[1]+fp[2];re2=re_mgr1;if(re2.test(stem)){w=stem;}}
    re=re_5;if(re.test(w)){var fp=re.exec(w);stem=fp[1];re=re_mgr1;re2=re_meq1;re3=re3_5;if(re.test(stem)||(re2.test(stem)&&!(re3.test(stem)))){w=stem;}}
    re=re_5_1;re2=re_mgr1;if(re.test(w)&&re2.test(w)){re=re_1b_2;w=w.replace(re,"");}
    if(firstch=="y"){w=firstch.toLowerCase()+w.substr(1);}
    return w;};return porterStemmer;})();lunr.Pipeline.registerFunction(lunr.stemmer,'stemmer')/*!
    * lunr.stopWordFilter
    * Copyright (C) 2016 Oliver Nightingale
    */
    lunr.generateStopWordFilter=function(stopWords){var words=stopWords.reduce(function(memo,stopWord){memo[stopWord]=stopWord
    return memo},{})
    return function(token){if(token&&words[token]!==token)return token}}
    lunr.stopWordFilter=lunr.generateStopWordFilter(['you','your'])
    lunr.Pipeline.registerFunction(lunr.stopWordFilter,'stopWordFilter')/*!
    * lunr.trimmer
    * Copyright (C) 2016 Oliver Nightingale
    */
    lunr.trimmer=function(token){if(isChineseChar(token)){return token;}
    return token.replace(/^\W+/,'').replace(/\W+$/,'')}
    function isChineseChar(str){var reg=/[\u4E00-\u9FA5\uF900-\uFA2D]/;return reg.test(str);}
    lunr.Pipeline.registerFunction(lunr.trimmer,'trimmer')/*!
    * lunr.stemmer
    * Copyright (C) 2016 Oliver Nightingale
    * Includes code from - http://tartarus.org/~martin/PorterStemmer/js.txt
    */
    lunr.TokenStore=function(){this.root={docs:{}}
    this.length=0}
    lunr.TokenStore.load=function(serialisedData){var store=new this
    store.root=serialisedData.root
    store.length=serialisedData.length
    return store}
    lunr.TokenStore.prototype.add=function(token,doc,root){var root=root||this.root,key=token.charAt(0),rest=token.slice(1)
    if(!(key in root))root[key]={docs:{}}
    if(rest.length===0){root[key].docs[doc.ref]=doc
    this.length+=1
    return}else{return this.add(rest,doc,root[key])}}
    lunr.TokenStore.prototype.has=function(token){if(!token)return false
    var node=this.root
    for(var i=0;i<token.length;i++){if(!node[token.charAt(i)])return false
    node=node[token.charAt(i)]}
    return true}
    lunr.TokenStore.prototype.getNode=function(token){if(!token)return{}
    var node=this.root
    for(var i=0;i<token.length;i++){if(!node[token.charAt(i)])return{}
    node=node[token.charAt(i)]}
    return node}
    lunr.TokenStore.prototype.get=function(token,root){return this.getNode(token,root).docs||{}}
    lunr.TokenStore.prototype.count=function(token,root){return Object.keys(this.get(token,root)).length}
    lunr.TokenStore.prototype.remove=function(token,ref){if(!token)return
    var node=this.root
    for(var i=0;i<token.length;i++){if(!(token.charAt(i)in node))return
    node=node[token.charAt(i)]}
    delete node.docs[ref]}
    lunr.TokenStore.prototype.expand=function(token,memo){var root=this.getNode(token),docs=root.docs||{},memo=memo||[]
    if(Object.keys(docs).length)memo.push(token)
    Object.keys(root).forEach(function(key){if(key==='docs')return
    memo.concat(this.expand(token+key,memo))},this)
    return memo}
    lunr.TokenStore.prototype.toJSON=function(){return{root:this.root,length:this.length}};(function(root,factory){if(typeof define==='function'&&define.amd){define(factory)}else if(typeof exports==='object'){module.exports=factory()}else{root.lunr=factory()}}(this,function(){return lunr}))})();

//动态加载js
function loadScriptBack(url, callback) {
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) {
        if (callback) {
            callback();
        }
    } else {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => {
            if (callback) {
                callback();
            }
        };
        document.head.appendChild(script);
    }
}
