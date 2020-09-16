
```bash |{type:'command'}
RED='\033[0;31m'
NC='\033[0m' # No Color
printf "I ${RED}love${NC} Stack Overflow\n"
```

ls, with colors.

```bash |{type:'command', tty: true}
tty
# export TERM=xterm-256color
ls --color=auto / 
```