# Simple scripts

Run code in a code block.

Create an array of the past seven days, inclusive

```js |{type:'script'}
let array = [...Array(7).keys()].map(days => new Date(Date.now() - 86400000 * days));
console.log( array );
```

Generate a random alphanumerical string of length 11.

```js |{type:'script'}
let id = Math.random().toString(36).substring(2);
console.log(id);
```

Return a shuffled copy of an Array-like.

```js |{type:'script'}
let fnShuffle = (arr) => arr.slice().sort(() => Math.random() - 0.5)
console.log( fnShuffle([1,2,3,4,5,6,7,8,9,10]) );
```

Generate random color.

```js |{type:'script'}
let randomHex = '#' + Math.floor(Math.random() * 0xffffff).toString(16).padEnd(6, '0');
console.log( randomHex );
```

Remove duplicates. 

```js |{type:'script'}
let arr = [1,2,3,3];
console.log( [...new Set(arr)] );
```
> This only works with primitives but it's still nifty. Set takes any iterable object, like an array `[1,2,3,3]`, and removes duplicates. The spread operator makes that set `[1,2,3]`.


Fizz buzz

```js |{type:'script'}
for(i=0;++i<101;console.log(i%5?f||i:f+'Buzz'))f=i%3?'':'Fizz'
```

Print keyboard.

```js |{type:'script'}
let keyboard = (_=>[..."`1234567890-=~~QWERTYUIOP[]\\~ASDFGHJKL;'~~ZXCVBNM,./~"].map(x=>(o+=`/${b='_'.repeat(w=x<y?2:' 667699'[x=["BS","TAB","CAPS","ENTER"][p++]||'SHIFT',p])}\\|`,m+=y+(x+'    ').slice(0,w)+y+y,n+=y+b+y+y,l+=' __'+b)[73]&&(k.push(l,m,n,o),l='',m=n=o=y),m=n=o=y='|',p=l=k=[])&&k.join`
`)();

console.log(keyboard);
```