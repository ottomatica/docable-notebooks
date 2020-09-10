[Setup](../Setup.md#setup) > Make Windows Just As Awesome

# Optional: Make Windows Just as Awesome

If you have **Windows 10**, you can use the [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/about)!  Follow the [Windows 10 Installation Guide](https://docs.microsoft.com/en-us/windows/wsl/install-win10).

*Tip*: You can also get many of the same commands available in your windows shell environment by installing git and ensuring they exist on your path.

* Update your System Environment Variables Path to include: `C:\Program Files\Git\usr\bin`. 
* Restart your shell and many unix commands will work in windows too!

You can install even more unix utilities:
* Install gnuwin basic utils for windows: `choco install gnuwin32-coreutils.install`
* Update your System Environment Variables Path: `C:\Program Files (x86)\GnuWin32\bin`

![Windows-EnvironmentVariables](resources/imgs/win-env.jpg)