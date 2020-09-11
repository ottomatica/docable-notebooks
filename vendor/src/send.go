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

/*
https://docs.microsoft.com/en-us/windows/win32/procthread/environment-variables

> Calling SetEnvironmentVariable has no effect on the system environment variables. 
To programmatically add or modify system environment variables, add them to the 
HKEY_LOCAL_MACHINE\System\CurrentControlSet\Control\Session Manager\Environment registry key, 
then broadcast a WM_SETTINGCHANGE message with lParam set to the string "Environment". 
This allows applications, such as the shell, to pick up your updates.
*/

func main() {

	text, _ := windows.UTF16PtrFromString("Environment");
	fmt.Println("[+] Sending refresh message...")
	// fmt.Println(err);
	// #define HWND_BROADCAST ((HWND)0xffff)
	// #define WM_SETTINGCHANGE                  0x001A
	// https://docs.microsoft.com/en-us/windows/win32/winmsg/wm-settingchange
	// Wparam 0
	// Lparam "Environment"
	SendMessage.Call(0xffff, 26, 0, uintptr(unsafe.Pointer(text)) );
	// var buf [256]byte
	// SendMessageTimeout.Call(0xffff, 26, 0, uintptr(unsafe.Pointer(text)), 0, 5000, uintptr(unsafe.Pointer(&buf[0])));
	// fmt.Println(buf);
}

// Notes, Helpful links:
// https://anubissec.github.io/How-To-Call-Windows-APIs-In-Golang/#
// Alternative Powershell implementation: https://gist.github.com/alphp/78fffb6d69e5bb863c76bbfc767effda
