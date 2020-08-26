### Bug

Code (`inline code`):

    print "Code is just indented four spaces";

You can also create code using "code fences".


```python
n = 50 # We want to find prime numbers between 2 and 50

print sorted(set(range(2,n+1)).difference(set((p * f) for p in range(2,int(n**0.5) + 2) for f in range(2,(n/p)+1))))
```
