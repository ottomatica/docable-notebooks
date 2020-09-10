// Run `go get golang.org/x/sys/windows`
package main

import (
	"fmt"
	"unsafe"
	"golang.org/x/sys/windows"
)

var (
    user32DLL	= windows.NewLazyDLL("user32.dll")
    SendMessageTimeout	= user32DLL.NewProc("SendMessageTimeoutW")
    SendMessage	= user32DLL.NewProc("SendMessageW")
)

func main() {

	text, _ := windows.UTF16PtrFromString("Environment");
	fmt.Println("[+] Sending refresh message...")
	// fmt.Println(err);
	SendMessage.Call(0xffff, 26, 0, uintptr(unsafe.Pointer(text)) );
	// var buf [256]byte
	// SendMessageTimeout.Call(0xffff, 26, 0, uintptr(unsafe.Pointer(text)), 0, 5000, uintptr(unsafe.Pointer(&buf[0])));
	// fmt.Println(buf);
}
