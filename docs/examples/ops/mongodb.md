# Administer mongodb


```bash|{type:'command'}
mongo --eval "db.getSiblingDB('ottomatica').users.find()"
```

By email

```bash|{type:'command'}
mongo --eval "db.getSiblingDB('ottomatica').users.findOne({email: 'chris.parnin@gmail.com'})"
```

Delete user(s)

```bash|{type:'command'}
mongo --eval "db.getSiblingDB('ottomatica').users.remove({_id: ObjectId('5f4e43cbfb61e7909699bb5a')})"
mongo --eval "db.getSiblingDB('ottomatica').users.remove({_id: ObjectId('5f4e4f8f8878f497bd5d248d')})"
mongo --eval "db.getSiblingDB('ottomatica').users.remove({_id: ObjectId('5f4e5007ee96f197cc46d9ca')})"
```

```
curl -H "Content-Type: application/json" -X POST --data '{"email":"d@e", "password":"password"}' localhost:3333/api/login
```

```
curl -H "Content-Type: application/json" -X POST --data '{"email":"d@e", "name": "test account", "password":"password"}' localhost:3333/api/register
```

Get:
```
curl -H "Content-Type: application/json" -H "Authorization: c1e36225-5978-432b-98a3-a6517a5eb1eb" -X GET localhost:3333/api/account
```

Update:
```
curl -H "Content-Type: application/json" -H "Authorization: c1e36225-5978-432b-98a3-a6517a5eb1eb" -X PUT --data '{"name":"bobe"}' localhost:3333/api/account
```


