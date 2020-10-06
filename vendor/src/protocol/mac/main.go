package main

/*
#cgo CFLAGS: -x objective-c
#cgo LDFLAGS: -framework Foundation
#include "handler.h"
*/
import "C"


// Sources used to figure this out:
// Info.plist: https://gist.github.com/chrissnell/db95a3c5ad6ceca4c673e96cca0f7548
// custom url handler example: http://fredandrandall.com/blog/2011/07/30/how-to-launch-your-macios-app-with-a-custom-url/
// obj-c example: https://gist.github.com/leepro/016d7d6b61021dfc67daf61771c92b3c
// note: import .h, not .m
import (
	"fmt"
	// "os"
	"os/exec"
	"strings"
	"github.com/andlabs/ui"
)

var labelText chan string

func main() {


	labelText = make(chan string, 1) // the event handler blocks!, so buffer the channel at least once to get the first message
	C.StartURLHandler()

	err := ui.Main(func() {
		input := ui.NewEntry()
		button := ui.NewButton("Import")
		greeting := ui.NewLabel("")
		box := ui.NewVerticalBox()
		box.Append(ui.NewLabel("Import Notebook from GitHub"), false)
		box.Append(input, false)
		box.Append(button, false)
		box.Append(greeting, false)
		window := ui.NewWindow("Docable Import", 300, 185, false)
		window.SetMargined(true)
		window.SetChild(box)
		button.OnClicked(func(*ui.Button) {
			greeting.SetText("Importing: " + input.Text())

			path, err := exec.LookPath("docable-notebooks")
			if err != nil {
				greeting.SetText("Could not find docable-notebooks on path")
			} else {

				cmd := exec.Command(path, "import", input.Text())
				out, err := cmd.CombinedOutput()
				if err != nil {
					greeting.SetText("Import failed:" + err.Error())
				} else {
					greeting.SetText("Import: " + string(out))
				}
			}


		})
		window.OnClosing(func(*ui.Window) bool {
			ui.Quit()
			return true
		})
		window.Show()

		// Set import from url
		go func() {
			for text := range labelText {
				ui.QueueMain(func() {
					url := strings.ReplaceAll(text, "docable:", "https:")
					input.SetText(url)
				})
			}
		}()

	})
	if err != nil {
		panic(fmt.Errorf("error initializing UI library: %v", err))
	}
}

//export HandleURL
func HandleURL(u *C.char) {
	labelText <- C.GoString(u)
}