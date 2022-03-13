package main

import "luckwheelserver/app"

func main() {
	a := new(app.App)
	a.Initialize()
	a.Run()
}
