"use strict";
function App() {
    if (window.loginState) return location.href = "/luck/login";
    var _this = this;
    this.totalE = document.getElementById("total");
    this.genbtnE = document.getElementById("genbtn");
    this.shortKeyE = document.getElementById("shortKey");
    this.genmsgE = document.getElementById("genmsg");
    this.notebook_ulE = document.getElementById("notebook_ul");
    this.queryE = document.getElementById("query");
    this.orderListE = document.getElementById("orderList");
    this.logoutE = document.getElementById("logout");
    this.baseUrl = `${location.origin || location.protocol + "//" + location.host}/luck/`;
    this.to_scroll_top = (callback) => {
        var scrollTopNum = .6 * (this.notebook_ulE.scrollTop || 0);
        scrollTopNum > 10 ? (this.notebook_ulE.scrollTo(0, scrollTopNum), window.setTimeout(() => { this.to_scroll_top(callback) }, 20)) : (this.notebook_ulE.scrollTo(0, 0), callback())
    }
    this.NewLinkInfo = function (shortKey, link, createAt) {
        return {
            Status: false,
            Count: 0,
            ShortKey: shortKey,
            ShortLink: link,
            Prize: null,
            LuckDate: "",
            CreatedAt: createAt
        }
    }
    this.alertMsg = (name, msg) => {
        this.genmsgE.className = name;
        this.genmsgE.innerHTML = msg;
    }
    this.showStyle = (ele) => {
        var lastE = document.querySelector(".showAnimate");
        if (lastE) {
            lastE.className = "card card-4";
            lastE = null;
        }
        ele.className = "card card-3 showAnimate";
        ele.style.display = "";
    }
    this.genNotebook = (info) => {
        var PrizeName = info.Prize && info.Prize.Name || "";
        var imgTmp = "";
        if (info.Prize && info.Prize.Image) {
            imgTmp = `<img class="prizeImg" src="${info.Prize.Image}" alt="">`
        }
        var htmlTmp = ` 獎品: ${PrizeName}<br/>
                    抽獎時間: ${info.LuckDate.substring(0, 19)}<br/>
                    憑證: ${info.ShortKey}<br />
                    短鏈接: ${this.baseUrl + info.ShortLink}<br />
                    創建時間: ${info.CreatedAt.substring(0, 19)}
                    <div class="right top">
                        ${imgTmp}
                    </div>`;
        var liEle = document.createElement("li");
        liEle.className = "card card-4";
        liEle.innerHTML = htmlTmp;
        return liEle;
    }
    this.genListNotebook = (data) => {
        var len = data.length;
        var fragmentE = document.createDocumentFragment();
        for (var i = 0; i < len; i++) {
            var info = data[i];
            fragmentE.appendChild(this.genNotebook(info))
        }
        this.notebook_ulE.appendChild(fragmentE);
    }
    this.IsPhoneNumber = (s) => {
        return /^\d{6,15}$/.test(s)
    }
    this.inputVerify = () => {
        if (this.shortKeyE.value.trim().length === 0) {
            this.shortKeyE.className = "errorInput";
            this.alertMsg("error", "請輸入憑證");
            setTimeout(() => {
                this.shortKeyE.className = "";
                this.alertMsg("", "");
            }, 3000);
            return false
        }
        if (this.shortKeyE.value.trim().length < 4) {
            this.shortKeyE.className = "errorInput";
            this.alertMsg("error", "輸入憑證長度小於4");
            return false
        }
        if (this.shortKeyE.value.trim().length > 15) {
            this.shortKeyE.className = "errorInput";
            this.alertMsg("error", "輸入憑證長度大於15");
            return false
        }
        this.shortKeyE.className = "";
        this.alertMsg("", "");
        return true;
    }
    this.hasShortKey = (s) => {
        if (!window.links.data) {
            return true;
        }
        return window.links.data.some(item => item.ShortKey === s);
    }
    this.genShortlink = () => {
        if (this.genbtnE.dataset.state === "on") {
            return;
        }
        this.genmsgE.className = "";
        this.genbtnE.dataset.state = "on";
        var shortKey = this.shortKeyE.value.trim();
        if (!this.inputVerify()) {
            this.genbtnE.dataset.state = "off";
            return;
        }
        if (this.hasShortKey(shortKey)) {
            this.alertMsg("error", "該憑證已存在");
            return
        }

        var myHeaders = new Headers();
        myHeaders.append("Authorization", window.jwtToken.Token);
        myHeaders.append("Content-Type", "text/plain");

        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: JSON.stringify({ ShortKey: shortKey }),
            redirect: 'follow'
        };
        if (!window.fetch) {
            alert("當前瀏覽器不支持fetch,請更換瀏覽器後重試！");
            return;
        }
        fetch(this.baseUrl + "admin/genlink", requestOptions)
            .then(response => response.json())
            .then(result => {
                if (!result.code) {
                    this.alertMsg("error", "服務器錯誤！");
                } else if (result.code === 200) {
                    var num = Number(this.totalE.innerText);
                    if (num === 0) {
                        this.notebook_ulE.className = "";
                        this.notebook_ulE.innerHTML = "";
                    }
                    this.totalE.innerText = num + 1;
                    this.alertMsg("success", this.baseUrl + result.data.ShortLink);
                    var info = this.NewLinkInfo(result.data.ShortKey, result.data.ShortLink, result.data.CreatedAt)
                    var nodeE = this.genNotebook(info);
                    window.links.data.push(info);
                    window.links.total++;
                    nodeE.style.display = "none";
                    this.notebook_ulE.insertAdjacentElement("afterbegin", nodeE);
                    this.to_scroll_top(() => { this.showStyle(nodeE) });
                } else if (result.code === 401) {
                    this.alertMsg("warning", result.message);
                } else {
                    this.alertMsg("error", result.message);
                }
            }).catch(error => {
                console.log('error', error);
                this.alertMsg("error", "程序出錯,請聯繫管理員");
            }).finally(() => {
                this.genbtnE.dataset.state = "off";
            });
    }

    this.requestData = (callback) => {
        var myHeaders = new Headers();
        myHeaders.append("Authorization", window.jwtToken.Token);

        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            redirect: 'follow'
        };

        fetch(this.baseUrl + "admin/shortlinks", requestOptions)
            .then(response => response.json())
            .then(result => {
                if (!result.code) {
                    this.notebook_ulE.className = "error";
                    this.notebook_ulE.innerHTML = "服務器錯誤！";
                } else if (result.code === 200) {
                    if (result.data.length === 0) {
                        this.notebook_ulE.className = "warning";
                        this.notebook_ulE.innerHTML = "當前無記錄";
                        return;
                    }
                    callback(result);
                } else if (result.code === 401) {
                    this.notebook_ulE.className = "warning";
                    this.notebook_ulE.innerHTML = result.message;
                    location.href = this.baseUrl + "login";
                } else {
                    this.notebook_ulE.className = "error";
                    this.notebook_ulE.innerHTML = result.message;
                }
            })
            .catch(error => {
                console.log('error', error);
                this.notebook_ulE.className = "error";
                this.notebook_ulE.innerHTML = "程序出錯,請聯繫管理員";
            });
    }
    this.matchedInfo = function (search) {
        var reg = new RegExp(search);
        var len = window.links.data.length;
        var result = [];
        for (var i = 0; i < len; i++) {
            if (reg.test(window.links.data[i].ShortKey) || reg.test(window.links.data[i].ShortLink)) {
                result.push(window.links.data[i])
            }
        }
        return result;
    }
    this.queryHandler = () => {
        var content = this.queryE.value.trim();
        if (content.length === 0) {
            this.totalE.innerText = window.links.total;
            this.genListNotebook(window.links.data);
            return
        }
        var result = this.matchedInfo(content);
        this.notebook_ulE.innerHTML = "";
        this.totalE.innerText = result.length;
        this.genListNotebook(result);
    }
    this.bubbleSort = (arr, order) => {
        var len = arr.length;
        if (len < 2) return
        var compareFn;
        if (order === "asc" || order === "initial") {
            compareFn = (a, b) => new Date(a.CreatedAt.substring(0, 19)) < new Date(b.CreatedAt.substring(0, 19));
        } else if (order === "desc") {
            compareFn = (a, b) => new Date(a.CreatedAt.substring(0, 19)) > new Date(b.CreatedAt.substring(0, 19));
        } else if (order === "win" || order === "fail" || order === "used") {
            compareFn = (a, b) => new Date(a.LuckDate.substring(0, 19)) < new Date(b.LuckDate.substring(0, 19));
        } else {
            return;
        }
        var temp, before, after;
        for (var i = len; i > 1; i--) {
            for (var j = 1; j < i; j++) {
                before = arr[j - 1], after = arr[j];
                if (compareFn(before, after)) {
                    temp = before, arr[j - 1] = after, arr[j] = temp;
                }
            }
        }
    }
    this.orderListHandler = () => {
        var order = this.orderListE.value.trim();
        var renderData = [];
        if (order === "initial") {
            renderData = window.links.data.filter(item => !item.Status);
        } else if (order === "used") {
            renderData = window.links.data.filter(item => item.Status);
        } else if (order === "win") {
            renderData = window.links.data.filter(item => item.Status && item.Prize.Win);
        } else if (order === "fail") {
            renderData = window.links.data.filter(item => item.Status && !item.Prize.Win);
        } else if (order === "asc" || order === "desc") {
            renderData = window.links.data;
        }
        this.bubbleSort(renderData, order);
        this.notebook_ulE.innerHTML = "";
        this.genListNotebook(renderData);
    }
    this.animateButton = () => {
        this.genbtnE.classList.remove('animate');
        this.genbtnE.classList.add('animate');
        setTimeout(() => {
            this.genbtnE.classList.remove('animate');
        }, 700);
    };
    this.logoutHandler = () => {
        if (!confirm("確定要退出登錄嗎？")) return

        var myHeaders = new Headers();
        myHeaders.append("Authorization", window.jwtToken.Token);
        myHeaders.append("User-Agent", "apifox/1.0.0 (https://www.apifox.cn)");
        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            redirect: 'follow'
        };
        fetch(this.baseUrl + "logout", requestOptions)
            .then(response => response.text())
            .then(result => {
                if (result.code === 500) {
                    alert("服務器異常，登出失敗！")
                } else if (result.code === 200) {
                    alert("登出成功！")
                }
            })
            .catch(error => console.log('error', error))
            .finally(() => {
                window.jwtToken = null;
                window.localStorage.removeItem("luckToken");
                location.href = this.baseUrl + "login"
            })
    }
    this.initialize = () => {
        window.links = {
            total: 0,
            data: []
        }
        this.requestData((result) => {
            window.links.data = result.data;
            window.links.total = result.total;
            this.totalE.innerText = result.total;
            this.bubbleSort(window.links.data, "asc");
            this.genListNotebook(window.links.data);
        });
    }
    this.Run = () => {
        this.initialize()
        var timer;
        this.queryE.addEventListener("input", () => {
            clearTimeout(timer)
            timer = setTimeout(this.queryHandler, 300);
        });
        this.shortKeyE.addEventListener("change", () => {
            this.inputVerify();
        });
        this.genbtnE.addEventListener("click", () => {
            this.animateButton();
            this.genShortlink();
        }, false);
        this.orderListE.addEventListener("change", this.orderListHandler)
        this.shortKeyE.onkeydown = function (ev) {
            var event = ev || event
            if (event.keyCode == 13) _this.animateButton(), _this.genShortlink();
        }
        this.logoutE.addEventListener("click", this.logoutHandler)
    }
}
(function () {
    new App().Run();
})();