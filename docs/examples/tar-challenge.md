# Tar challenge

![tar-xkcd](https://imgs.xkcd.com/comics/tar.png)

```bash|{type:'command'}
touch file1.txt file2.txt file3.txt
```

Pick one:

```bash|{type:'command'}
tar -cf file1.txt file2.txt file3.txt destination.tar
```

```bash|{type:'command'}
tar -cf destination.tar file1.txt file2.txt file3.txt
```

Pick one:

```bash|{type:'command'}
tar -xvf destination.tar 
```

```bash|{type:'command'}
tar -zxf destination.tar 
```