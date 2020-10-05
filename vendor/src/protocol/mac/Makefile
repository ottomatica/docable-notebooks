docable.app: *.go *.h *.m Makefile Info.plist
	mkdir -p docable.app/Contents/MacOS
	go build -i -o docable.app/Contents/MacOS/docable
	cp Info.plist docable.app/Contents/Info.plist

.PHONY: open
open: docable.app
	open docable.app > app.log

.PHONY: scheme
scheme: docable.app
	open docable://hello/world

.PHONY: clean
clean:
	rm -rf docable.app docable.zip

sign:
	codesign --deep --force --verify --verbose --sign "Developer ID Application: Christopher Parnin (8D3UA9GWVH)" --options runtime docable.app

verify:
	spctl --assess --type execute --verbose --ignore-cache --no-cache docable.app	
notary:
	zip -r docable.zip docable.app
	xcrun altool -type osx --notarize-app --primary-bundle-id "io.ottomatica.docable" --username "gameweld@gmail.com"  --password="${DOCABLE_SIGN_PW}" --file docable.zip

### Check
# xcrun altool --notarization-info  2e545dca-7b6b-4e7e-a17c-dded31e4e49d --username "gameweld@gmail.com" --password $DOCABLE_SIGN_PW