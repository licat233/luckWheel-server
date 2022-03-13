"use strict";
function App() {
    if (!window || !document || !fetch) return alert("不支持當前瀏覽器");
    this.loginbtnE = document.getElementById("loginbtn");
    this.userE = document.getElementById("user");
    this.passE = document.getElementById("pass");
    this.autoE = document.getElementById("check");
    this.alertE = document.getElementById("alert");
    this.verify = function () {
        if (this.value.trim().length === 0) {
            this.value = "";
            this.classList.add("error");
            return
        } else {
            this.classList.remove("error");
        }
    }
    this.Login = () => {
        if (this.userE.value.trim().length === 0) {
            this.userE.classList.add("error");
            return;
        }
        if (this.passE.value.trim().length === 0) {
            this.passE.classList.add("error");
            return;
        }
        if (this.loginbtnE.dataset.state === "true") {
            return;
        }
        this.loginbtnE.dataset.state = true;

        var myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        var raw = JSON.stringify({
            "Username": this.userE.value,
            "Password": this.passE.value,
            "AutoLogin": this.autoE.checked
        });
        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        };
        window.fetch("/luck/login/verify", requestOptions)
            .then(response => response.json())
            .then(result => {
                try {
                    this.alertE.innerText = result.message;
                    if (result.code !== 200) {
                        this.loginbtnE.dataset.state = false;
                        this.alertE.classList.add("errortxt");
                        return
                    }
                    this.alertE.classList.remove("errortxt");
                    var tokenData = JSON.stringify(result.data);
                    localStorage.setItem("luckToken", tokenData);
                    location.href = "/luck/admin";
                } catch (error) {
                    this.loginbtnE.dataset.state = false;
                    this.alertE.innerText = error;
                    this.alertE.classList.add("errortxt");
                    console.log(error);
                }
            })
            .catch(error => { console.log('error', error); loginbtnE.dataset.loginState = 0; });
    }
    this.Run = () => {
        this.userE.onchange = this.verify;
        this.passE.onchange = this.verify;
        this.loginbtnE.onclick = () => false;
        this.loginbtnE.addEventListener('click', this.Login);
        var _this = this;
        window.document.onkeydown = function (ev) {
            var event = ev || event
            if (event.keyCode == 13) _this.Login()
        }
    }
}
(function () {
    new App().Run();
})();