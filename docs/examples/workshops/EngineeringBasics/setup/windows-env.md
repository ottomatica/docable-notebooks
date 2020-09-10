# Send




```
SendMessage /message:WM_SETTINGCHANGE /lparam:"Environment"
```

```
SendMessage(HWND_BROADCAST,WM_SETTINGCHANGE,0,TEXT("Environment"))
```

https://docs.microsoft.com/en-us/windows/win32/procthread/environment-variables

> Calling `SetEnvironmentVariable` has no effect on the system environment variables. To programmatically add or modify system environment variables, add them to the "HKEY_LOCAL_MACHINE\System\CurrentControlSet\Control\Session Manager\Environment" registry key, then broadcast a `WM_SETTINGCHANGE` message with `lParam` set to the string "Environment". This allows applications, such as the shell, to pick up your updates.

